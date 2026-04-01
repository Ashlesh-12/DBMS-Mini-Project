-- AERAS seed data (safe to rerun)
-- Select your target database before running this script.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE allocation;
TRUNCATE TABLE faculty_allocation;
TRUNCATE TABLE student_exam_map;
TRUNCATE TABLE students;
TRUNCATE TABLE exams;
TRUNCATE TABLE rooms;
TRUNCATE TABLE faculty;
TRUNCATE TABLE roomstats;
TRUNCATE TABLE systemlogs;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO rooms (RoomNumber, BenchColumns, TotalBenchesPerRow) VALUES
('101', 4, 5),
('102', 4, 5),
('201', 4, 5),
('304', 6, 10);

INSERT INTO exams (ExamID, SubjectCode, ExamDate, Semester) VALUES
(1, '18CS51_DBMS', '2025-11-25', 5),
(2, '18CS71_AI',   '2025-11-25', 7);

INSERT INTO faculty (Name, Department) VALUES
('Dr. Anjali Sharma', 'CS'),
('Prof. Rajesh Kumar', 'IS'),
('Prof. David John', 'EC'),
('Dr. Hema Latha', 'CS'),
('Prof. Syed Ahmed', 'MECH'),
('Prof. Vani P', 'CIVIL');

INSERT INTO students (USN, Name, Semester) VALUES
('4SF23CS001', 'Aditya Rao', 5), ('4SF23CS002', 'Bhavya K', 5),
('4SF23CS003', 'Chirag M', 5), ('4SF23CS004', 'Deepa S', 5),
('4SF23CS005', 'Esha Gupta', 5), ('4SF23CS006', 'Farhan Z', 5),
('4SF23CS007', 'Ganesh P', 5), ('4SF23CS008', 'Harish B', 5),
('4SF23CS009', 'Ishan V', 5), ('4SF23CS010', 'Jagan R', 5),
('4SF23CS011', 'Kavya N', 5), ('4SF23CS012', 'Lohit D', 5),
('4SF23CS013', 'Manish T', 5), ('4SF23CS014', 'Neha P', 5),
('4SF23CS015', 'Omkar S', 5), ('4SF23CS016', 'Pooja R', 5),
('4SF23CS017', 'Qasim A', 5), ('4SF23CS018', 'Rahul K', 5),
('4SF23CS019', 'Sahana M', 5), ('4SF23CS020', 'Tanvi H', 5),
('4SF23CS021', 'Ullas G', 5), ('4SF23CS022', 'Varun J', 5),
('4SF23CS023', 'Waseem K', 5), ('4SF23CS024', 'Xavier L', 5),
('4SF23CS025', 'Yashwanth', 5), ('4SF23CS026', 'Zoya F', 5),
('4SF23CS027', 'Aarav S', 5), ('4SF23CS028', 'Bipin C', 5),
('4SF23CS029', 'Chetan L', 5), ('4SF23CS030', 'Divya K', 5),
('4SF23CS031', 'Elango M', 5), ('4SF23CS032', 'Fathima S', 5),
('4SF23CS033', 'Girish T', 5), ('4SF23CS034', 'Hemanth R', 5),
('4SF23CS035', 'Indira G', 5), ('4SF23CS036', 'Jayant P', 5),
('4SF23CS037', 'Kiran B', 5), ('4SF23CS038', 'Latha M', 5),
('4SF23CS039', 'Manoj K', 5), ('4SF23CS040', 'Nithin S', 5),
('4SF23CS041', 'Oviya R', 5), ('4SF23CS042', 'Pradeep', 5),
('4SF23CS043', 'Qadir H', 5), ('4SF23CS044', 'Ramesh', 5),
('4SF23CS045', 'Suresh', 5),
('4SF21CS101', 'Senior Abhishek', 7), ('4SF21CS102', 'Senior Bharath', 7),
('4SF21CS103', 'Senior Chandan', 7), ('4SF21CS104', 'Senior Danish', 7),
('4SF21CS105', 'Senior Eshwar', 7), ('4SF21CS106', 'Senior Faran', 7),
('4SF21CS107', 'Senior Ganesh', 7), ('4SF21CS108', 'Senior Harsha', 7),
('4SF21CS109', 'Senior Imran', 7), ('4SF21CS110', 'Senior Jay', 7),
('4SF21CS111', 'Senior Karthik', 7), ('4SF21CS112', 'Senior Lokesh', 7),
('4SF21CS113', 'Senior Mohan', 7), ('4SF21CS114', 'Senior Naveen', 7),
('4SF21CS115', 'Senior Om', 7), ('4SF21CS116', 'Senior Pavan', 7),
('4SF21CS117', 'Senior Quresh', 7), ('4SF21CS118', 'Senior Ravi', 7),
('4SF21CS119', 'Senior Sachin', 7), ('4SF21CS120', 'Senior Tarun', 7),
('4SF21CS121', 'Senior Umesh', 7), ('4SF21CS122', 'Senior Vinay', 7),
('4SF21CS123', 'Senior Walter', 7), ('4SF21CS124', 'Senior Xavier', 7),
('4SF21CS125', 'Senior Yash', 7), ('4SF21CS126', 'Senior Zaid', 7),
('4SF21CS127', 'Senior Amit', 7), ('4SF21CS128', 'Senior Bhuvan', 7),
('4SF21CS129', 'Senior Chetan', 7), ('4SF21CS130', 'Senior Deepak', 7),
('4SF21CS131', 'Senior Eshan', 7), ('4SF21CS132', 'Senior Francis', 7),
('4SF21CS133', 'Senior Gowtham', 7), ('4SF21CS134', 'Senior Hari', 7),
('4SF21CS135', 'Senior Irfan', 7), ('4SF21CS136', 'Senior Jagadish', 7),
('4SF21CS137', 'Senior Kamal', 7), ('4SF21CS138', 'Senior Lakshman', 7),
('4SF21CS139', 'Senior Mahesh', 7), ('4SF21CS140', 'Senior Niranjan', 7),
('4SF21CS141', 'Senior Oscar', 7), ('4SF21CS142', 'Senior Pratham', 7),
('4SF21CS143', 'Senior Qasim', 7), ('4SF21CS144', 'Senior Roshan', 7),
('4SF21CS145', 'Senior Sharath', 7);

INSERT INTO student_exam_map (USN, ExamID)
SELECT USN, 1 FROM students WHERE Semester = 5;

INSERT INTO student_exam_map (USN, ExamID)
SELECT USN, 2 FROM students WHERE Semester = 7;

CALL GenerateRoomReport();
