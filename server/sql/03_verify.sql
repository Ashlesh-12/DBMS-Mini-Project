-- Post-import verification checks

SELECT 'students' AS tbl, COUNT(*) AS total FROM students
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL SELECT 'student_exam_map', COUNT(*) FROM student_exam_map
UNION ALL SELECT 'allocation', COUNT(*) FROM allocation
UNION ALL SELECT 'faculty_allocation', COUNT(*) FROM faculty_allocation
UNION ALL SELECT 'roomstats', COUNT(*) FROM roomstats
UNION ALL SELECT 'systemlogs', COUNT(*) FROM systemlogs;

SHOW TRIGGERS LIKE 'students';
SHOW FUNCTION STATUS WHERE Db = DATABASE() AND Name = 'GetOccupiedSeats';
SHOW PROCEDURE STATUS WHERE Db = DATABASE() AND Name IN ('AddStudentData','GenerateRoomReport','DeleteStudent','UpdateStudentData');

CALL GenerateRoomReport();
SELECT * FROM roomstats ORDER BY RoomNumber;
