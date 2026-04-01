const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const env = (key, fallback = '') => (process.env[key] ?? fallback).toString().trim();

const db = mysql.createPool({
  host: env('DB_HOST'),
  user: env('DB_USER'),
  password: env('DB_PASSWORD'),
  database: env('DB_NAME'),
  port: Number(env('DB_PORT', 3306)),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: env('DB_SSL', 'false').toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function query(sql, params = []) {
  const [rows] = await db.promise().query(sql, params);
  return rows;
}

// Health check for deployment/runtime probes
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.send({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).send({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Get All Rooms
app.get('/rooms', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM rooms');
    res.send(rows);
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch rooms', error: err.message });
  }
});

// Get Visual Room Data (Grid View)
app.get('/room-view/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const roomSql = 'SELECT * FROM rooms WHERE RoomID = ?';
  const allocSql = `SELECT a.SeatPosition, a.BenchColumnNumber, a.BenchRowNumber, s.USN, s.Name, e.SubjectCode
                    FROM allocation a
                    JOIN students s ON a.USN = s.USN
                    JOIN exams e ON a.ExamID = e.ExamID
                    WHERE a.RoomID = ?`;

  try {
    const roomResult = await query(roomSql, [roomId]);
    const allocResult = await query(allocSql, [roomId]);
    res.send({ room: roomResult[0] ?? null, seats: allocResult });
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch room view', error: err.message });
  }
});

// Get Faculty List
app.get('/faculty-allocations', async (req, res) => {
  const sql = `SELECT f.Name, r.RoomNumber
               FROM faculty_allocation fa
               JOIN faculty f ON fa.FacultyID = f.FacultyID
               JOIN rooms r ON fa.RoomID = r.RoomID`;

  try {
    const rows = await query(sql);
    res.send(rows);
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch faculty allocations', error: err.message });
  }
});

// Search Student Seat (Student Portal)
app.get('/search-student/:usn', async (req, res) => {
  const usn = req.params.usn.trim();
  const sql = `SELECT s.Name, s.USN, r.RoomNumber, a.BenchColumnNumber, a.BenchRowNumber, a.SeatPosition, e.SubjectCode
               FROM allocation a
               JOIN students s ON a.USN = s.USN
               JOIN rooms r ON a.RoomID = r.RoomID
               JOIN exams e ON a.ExamID = e.ExamID
               WHERE s.USN = ?`;

  try {
    const rows = await query(sql, [usn]);
    if (rows.length === 0) {
      return res.status(404).send({ message: 'Seat not allocated yet.' });
    }
    res.send(rows[0]);
  } catch (err) {
    res.status(500).send({ message: 'Failed to search student', error: err.message });
  }
});

app.post('/allocate', async (req, res) => {
  const { examId1, examId2 } = req.body;

  try {
    const students1 = await query('SELECT * FROM student_exam_map WHERE ExamID = ? ORDER BY USN ASC', [examId1]);
    const students2 = await query('SELECT * FROM student_exam_map WHERE ExamID = ? ORDER BY USN ASC', [examId2]);
    const rooms = await query('SELECT * FROM rooms');

    await query('DELETE FROM allocation WHERE ExamID IN (?, ?)', [examId1, examId2]);

    let s1Index = 0;
    let s2Index = 0;

    for (const room of rooms) {
      const columns = room.BenchColumns;
      const rows = room.TotalBenchesPerRow;

      for (let col = 1; col <= columns; col += 1) {
        const seatPositionsForExam1 = col % 2 !== 0 ? [1, 3] : [2];

        for (const seatPos of seatPositionsForExam1) {
          for (let row = 1; row <= rows; row += 1) {
            if (s1Index < students1.length) {
              const student = students1[s1Index];
              s1Index += 1;
              await allocateSeat(student, examId1, room.RoomID, col, row, seatPos);
            }
          }
        }
      }

      for (let col = 1; col <= columns; col += 1) {
        const seatPositionsForExam2 = col % 2 !== 0 ? [2] : [1, 3];

        for (const seatPos of seatPositionsForExam2) {
          for (let row = 1; row <= rows; row += 1) {
            if (s2Index < students2.length) {
              const student = students2[s2Index];
              s2Index += 1;
              await allocateSeat(student, examId2, room.RoomID, col, row, seatPos);
            }
          }
        }
      }
    }

    res.send({ message: 'Allocation Successful: Vertical Sequential Order!' });
  } catch (error) {
    console.error('Allocation Error:', error);
    res.status(500).send({ message: 'Allocation failed', error: error.message });
  }
});

async function allocateSeat(student, examId, roomId, col, row, seatPos) {
  const sql = 'INSERT INTO allocation (USN, ExamID, RoomID, BenchColumnNumber, BenchRowNumber, SeatPosition) VALUES (?, ?, ?, ?, ?, ?)';
  await query(sql, [student.USN, examId, roomId, col, row, seatPos]);
}

app.post('/allocate-faculty', async (req, res) => {
  try {
    await query('DELETE FROM faculty_allocation');
    const rooms = await query('SELECT RoomID FROM rooms');
    const faculty = await query('SELECT FacultyID FROM faculty');

    for (let i = faculty.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [faculty[i], faculty[j]] = [faculty[j], faculty[i]];
    }

    for (let i = 0; i < rooms.length && i < faculty.length; i += 1) {
      await query('INSERT INTO faculty_allocation (FacultyID, RoomID, ExamDate) VALUES (?, ?, CURDATE())', [faculty[i].FacultyID, rooms[i].RoomID]);
    }

    res.send({ message: 'Faculty Assigned' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Faculty allocation failed', error: error.message });
  }
});

app.post('/add-faculty', async (req, res) => {
  const { name, dept } = req.body;

  try {
    await query('INSERT INTO faculty (Name, Department) VALUES (?, ?)', [name, dept]);
    res.send({ message: 'Faculty Added!' });
  } catch (err) {
    res.status(500).send({ message: 'Error adding faculty.', error: err.message });
  }
});

// Add Student & Register for Exam using stored procedure with fallback.
app.post('/add-student', async (req, res) => {
  const { usn, name, semester } = req.body;
  const sem = Number(semester);
  const examId = sem === 5 ? 1 : sem === 7 ? 2 : null;

  try {
    await query('CALL AddStudentData(?, ?, ?)', [usn, name, semester]);
    res.send({ message: 'Student Added via Stored Procedure!' });
  } catch (err) {
    if (err.code === 'ER_SP_DOES_NOT_EXIST') {
      try {
        await query('INSERT INTO students (USN, Name, Semester) VALUES (?, ?, ?)', [usn, name, semester]);
        if (examId) {
          await query('INSERT INTO student_exam_map (USN, ExamID) VALUES (?, ?)', [usn, examId]);
        }
        return res.send({ message: 'Student Added!' });
      } catch (fallbackErr) {
        return res.status(500).send({ message: 'Error adding student', error: fallbackErr.message });
      }
    }

    console.error(err);
    res.status(500).send({ message: 'Error: USN already exists or Invalid Data.', error: err.message });
  }
});

app.get('/room-reports', async (req, res) => {
  try {
    await query('CALL GenerateRoomReport()');
    const rows = await query('SELECT * FROM roomstats');
    res.send(rows);
  } catch (err) {
    console.error('Report Error:', err);
    res.status(500).send({ message: 'Error executing cursor.', error: err.message });
  }
});

app.get('/students', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM students ORDER BY USN ASC');
    res.send(rows);
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch students', error: err.message });
  }
});

app.delete('/delete-student/:usn', async (req, res) => {
  const { usn } = req.params;

  try {
    await query('CALL DeleteStudent(?)', [usn]);
    res.send({ message: 'Student Deleted Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error deleting student', error: err.message });
  }
});

app.put('/update-student', async (req, res) => {
  const { usn, name, semester } = req.body;

  try {
    await query('CALL UpdateStudentData(?, ?, ?)', [usn, name, semester]);
    res.send({ message: 'Student Updated Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error updating student', error: err.message });
  }
});

const port = Number(env('PORT', 3001));
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);

  try {
    await query('SELECT 1 AS ok');
    console.log('Connected to MySQL successfully.');
  } catch (err) {
    console.error('Initial DB check failed:', err.message);
  }
});
