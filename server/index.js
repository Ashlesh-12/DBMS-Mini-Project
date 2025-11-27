const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ashlesh@12',
    database: 'aeras_db'
});

db.connect((err) => {
    if (err) console.error('Error connecting to MySQL:', err);
    else console.log('Connected to MySQL Database (aeras_db)');
});


// Get All Rooms
app.get('/rooms', (req, res) => {
    db.query('SELECT * FROM Rooms', (err, result) => {
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
app.post('/allocate', async (req, res) => {
    const { examId1, examId2 } = req.body; 

    try {
        // --- UPDATED: Added ORDER BY USN ASC ---
        const [students1] = await db.promise().query(
            'SELECT * FROM Student_Exam_Map WHERE ExamID = ? ORDER BY USN ASC', 
            [examId1]
        );
        const [students2] = await db.promise().query(
            'SELECT * FROM Student_Exam_Map WHERE ExamID = ? ORDER BY USN ASC', 
            [examId2]
        );
        
        const [rooms] = await db.promise().query('SELECT * FROM Rooms');

        let s1Index = 0;
        let s2Index = 0;
        
        // Clear previous allocations
        await db.promise().query('DELETE FROM Allocation WHERE ExamID IN (?, ?)', [examId1, examId2]);

        for (const room of rooms) {
            const columns = room.BenchColumns;
            const rows = room.TotalBenchesPerRow;

            // Column-First Fill
            for (let col = 1; col <= columns; col++) {
                
                // Seat 1 (Left - Exam A)
                for (let row = 1; row <= rows; row++) {
                    if (s1Index < students1.length) {
                        const student = students1[s1Index++];
                        const sql = `INSERT INTO Allocation (USN, ExamID, RoomID, BenchColumnNumber, BenchRowNumber, SeatPosition) VALUES (?, ?, ?, ?, ?, 1)`;
                        await db.promise().query(sql, [student.USN, examId1, room.RoomID, col, row]);
                    }
                }

                // Seat 2 (Right - Exam B)
                for (let row = 1; row <= rows; row++) {
                    if (s2Index < students2.length) {
                        const student = students2[s2Index++];
                        const sql = `INSERT INTO Allocation (USN, ExamID, RoomID, BenchColumnNumber, BenchRowNumber, SeatPosition) VALUES (?, ?, ?, ?, ?, 2)`;
                        await db.promise().query(sql, [student.USN, examId2, room.RoomID, col, row]);
                    }
                }
            }
        }
        res.send({ message: "Allocation Successful (Sorted)" });

    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

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
    db.query('SELECT * FROM Students ORDER BY USN ASC', (err, result) => {
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