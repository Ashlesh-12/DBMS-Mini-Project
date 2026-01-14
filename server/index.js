const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

db.connect((err) => {
    if (err) console.error('Error connecting to MySQL:', err);
    else console.log('Connected to MySQL Database (aeras_db)');
});


// Get All Rooms
app.get('/rooms', (req, res) => {
    db.query('SELECT * FROM rooms', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// Get Visual Room Data (Grid View)
app.get('/room-view/:roomId', (req, res) => {
    const { roomId } = req.params;
    const roomSql = 'SELECT * FROM Rooms WHERE RoomID = ?';
    const allocSql = `SELECT a.SeatPosition, a.BenchColumnNumber, a.BenchRowNumber, s.USN, s.Name, e.SubjectCode 
                      FROM Allocation a
                      JOIN Students s ON a.USN = s.USN
                      JOIN Exams e ON a.ExamID = e.ExamID
                      WHERE a.RoomID = ?`;

    db.query(roomSql, [roomId], (err, roomResult) => {
        if (err) return res.status(500).send(err);
        db.query(allocSql, [roomId], (err, allocResult) => {
            if (err) return res.status(500).send(err);
            res.send({ room: roomResult[0], seats: allocResult });
        });
    });
});

// Get Faculty List
app.get('/faculty-allocations', (req, res) => {
    const sql = `SELECT f.Name, r.RoomNumber 
                 FROM Faculty_Allocation fa
                 JOIN Faculty f ON fa.FacultyID = f.FacultyID
                 JOIN Rooms r ON fa.RoomID = r.RoomID`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// Search Student Seat (Student Portal)
app.get('/search-student/:usn', (req, res) => {
    const { usn } = req.params;
    const sql = `SELECT s.Name, s.USN, r.RoomNumber, a.BenchColumnNumber, a.BenchRowNumber, a.SeatPosition, e.SubjectCode 
                 FROM Allocation a
                 JOIN Students s ON a.USN = s.USN
                 JOIN Rooms r ON a.RoomID = r.RoomID
                 JOIN Exams e ON a.ExamID = e.ExamID
                 WHERE s.USN = ?`;

    db.query(sql, [usn], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length === 0) return res.status(404).send({ message: "Seat not allocated yet." });
        res.send(result[0]);
    });
});


// ALLOCATE STUDENTS (Sorted by USN + 2 Per Bench)
// 4. STUDENT ALLOCATION ALGORITHM (3 Seats Per Bench - Checkerboard Pattern)
// 4. STUDENT ALLOCATION (3 Seats Per Bench - VERTICAL FILLING)
app.post('/allocate', async (req, res) => {
    const { examId1, examId2 } = req.body; 

    try {
        // 1. Fetch Students Sorted by USN (Ascending)
        const [students1] = await db.promise().query(
            'SELECT * FROM Student_Exam_Map WHERE ExamID = ? ORDER BY USN ASC', [examId1]
        );
        const [students2] = await db.promise().query(
            'SELECT * FROM Student_Exam_Map WHERE ExamID = ? ORDER BY USN ASC', [examId2]
        );
        
        const [rooms] = await db.promise().query('SELECT * FROM Rooms');
        
        // Clear previous allocations
        await db.promise().query('DELETE FROM Allocation WHERE ExamID IN (?, ?)', [examId1, examId2]);

        let s1Index = 0;
        let s2Index = 0;

        // 2. Loop through Rooms
        for (const room of rooms) {
            const columns = room.BenchColumns;      // 3
            const rows = room.TotalBenchesPerRow;   // 3 or 5

            // --- GENERATE VERTICAL SLOTS FOR EXAM 1 ---
            // We find every seat meant for Exam 1 and fill them sequentially vertically
            for (let col = 1; col <= columns; col++) {
                const isOddCol = (col % 2 !== 0);
                
                // Logic: 
                // Odd Cols (1,3): Exam 1 is in Seat 1 & Seat 3
                // Even Cols (2):  Exam 1 is in Seat 2
                let seatPositionsForExam1 = isOddCol ? [1, 3] : [2];

                for (let seatPos of seatPositionsForExam1) {
                    // FILL VERTICALLY (Row 1 -> Row N)
                    for (let row = 1; row <= rows; row++) {
                        if (s1Index < students1.length) {
                            const student = students1[s1Index++];
                            await allocateSeat(student, examId1, room.RoomID, col, row, seatPos);
                        }
                    }
                }
            }

            // --- GENERATE VERTICAL SLOTS FOR EXAM 2 ---
            // We find every seat meant for Exam 2 and fill them sequentially vertically
            for (let col = 1; col <= columns; col++) {
                const isOddCol = (col % 2 !== 0);

                // Logic: Opposite of Exam 1
                // Odd Cols (1,3): Exam 2 is in Seat 2
                // Even Cols (2):  Exam 2 is in Seat 1 & Seat 3
                let seatPositionsForExam2 = isOddCol ? [2] : [1, 3];

                for (let seatPos of seatPositionsForExam2) {
                    // FILL VERTICALLY (Row 1 -> Row N)
                    for (let row = 1; row <= rows; row++) {
                        if (s2Index < students2.length) {
                            const student = students2[s2Index++];
                            await allocateSeat(student, examId2, room.RoomID, col, row, seatPos);
                        }
                    }
                }
            }
        }
        res.send({ message: "Allocation Successful: Vertical Sequential Order!" });

    } catch (error) {
        console.error("Allocation Error:", error);
        res.status(500).send(error);
    }
});

// Helper Function
async function allocateSeat(student, examId, roomId, col, row, seatPos) {
    const sql = `INSERT INTO Allocation (USN, ExamID, RoomID, BenchColumnNumber, BenchRowNumber, SeatPosition) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.promise().query(sql, [student.USN, examId, roomId, col, row, seatPos]);
}
// Helper function to keep code clean
async function allocateSeat(student, examId, roomId, col, row, seatPos) {
    const sql = `INSERT INTO Allocation (USN, ExamID, RoomID, BenchColumnNumber, BenchRowNumber, SeatPosition) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.promise().query(sql, [student.USN, examId, roomId, col, row, seatPos]);
}
// ALLOCATE FACULTY (Random & Unique)
app.post('/allocate-faculty', async (req, res) => {
    try {
        await db.promise().query('DELETE FROM Faculty_Allocation');
        const [rooms] = await db.promise().query('SELECT RoomID FROM Rooms');
        const [faculty] = await db.promise().query('SELECT FacultyID FROM Faculty');

        // Shuffle Faculty
        for (let i = faculty.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [faculty[i], faculty[j]] = [faculty[j], faculty[i]];
        }

        // Assign
        for (let i = 0; i < rooms.length; i++) {
            if (i < faculty.length) {
                await db.promise().query(
                    'INSERT INTO Faculty_Allocation (FacultyID, RoomID, ExamDate) VALUES (?, ?, CURDATE())',
                    [faculty[i].FacultyID, rooms[i].RoomID]
                );
            }
        }
        res.send({ message: "Faculty Assigned" });

    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});


// Add Faculty
app.post('/add-faculty', async (req, res) => {
    const { name, dept } = req.body;
    try {
        await db.promise().query('INSERT INTO Faculty (Name, Department) VALUES (?, ?)', [name, dept]);
        res.send({ message: "Faculty Added!" });
    } catch (err) {
        res.status(500).send({ message: "Error adding faculty." });
    }
});

// Add Student & Register for Exam
app.post('/add-student', async (req, res) => {
    const { usn, name, semester } = req.body;
    let examId = (parseInt(semester) === 5) ? 1 : (parseInt(semester) === 7) ? 2 : null;

    try {
        await db.promise().query('INSERT INTO Students (USN, Name, Semester) VALUES (?, ?, ?)', [usn, name, semester]);
        if (examId) {
            await db.promise().query('INSERT INTO Student_Exam_Map (USN, ExamID) VALUES (?, ?)', [usn, examId]);
        }
        res.send({ message: "Student Added!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error: USN might exist." });
    }
});

// 8. Add a New Student (USING STORED PROCEDURE)
app.post('/add-student', async (req, res) => {
    const { usn, name, semester } = req.body;

    try {
        const sql = 'CALL AddStudentData(?, ?, ?)';
        await db.promise().query(sql, [usn, name, semester]);

        res.send({ message: "Student Added via Stored Procedure!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error: USN already exists or Invalid Data." });
    }
});

// 9. REPORTING API (Triggers the Cursor)
app.get('/room-reports', async (req, res) => {
    try {
        // Step 1: Execute the Stored Procedure (The Cursor Logic)
        await db.promise().query('CALL GenerateRoomReport()');
        
        // Step 2: Select the data it just generated
        const [rows] = await db.promise().query('SELECT * FROM RoomStats');
        
        res.send(rows);
    } catch (err) {
        console.error("Report Error:", err);
        res.status(500).send({ message: "Error executing cursor." });
    }
});

// 10. GET ALL STUDENTS (For the Manage Data list)
app.get('/students', (req, res) => {
    db.query('SELECT * FROM students ORDER BY USN ASC', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// 11. DELETE STUDENT (Using Stored Procedure)
app.delete('/delete-student/:usn', async (req, res) => {
    const { usn } = req.params;
    try {
        await db.promise().query('CALL DeleteStudent(?)', [usn]);
        res.send({ message: "Student Deleted Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error deleting student" });
    }
});

// 12. UPDATE STUDENT (Using Stored Procedure)
app.put('/update-student', async (req, res) => {
    const { usn, name, semester } = req.body;
    try {
        await db.promise().query('CALL UpdateStudentData(?, ?, ?)', [usn, name, semester]);
        res.send({ message: "Student Updated Successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error updating student" });
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});