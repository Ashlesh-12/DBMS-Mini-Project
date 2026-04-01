-- AERAS schema (idempotent)
-- Select your target database before running this script.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS students (
    USN VARCHAR(15) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Semester INT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    RoomID INT AUTO_INCREMENT PRIMARY KEY,
    RoomNumber VARCHAR(10) UNIQUE NOT NULL,
    BenchColumns INT NOT NULL,
    TotalBenchesPerRow INT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
    ExamID INT AUTO_INCREMENT PRIMARY KEY,
    SubjectCode VARCHAR(20) NOT NULL,
    ExamDate DATE NOT NULL,
    Semester INT NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty (
    FacultyID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Department VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS student_exam_map (
    USN VARCHAR(15),
    ExamID INT,
    PRIMARY KEY (USN, ExamID),
    FOREIGN KEY (USN) REFERENCES students(USN),
    FOREIGN KEY (ExamID) REFERENCES exams(ExamID)
);

CREATE TABLE IF NOT EXISTS allocation (
    AllocationID INT AUTO_INCREMENT PRIMARY KEY,
    USN VARCHAR(15),
    ExamID INT,
    RoomID INT,
    BenchColumnNumber INT NOT NULL,
    BenchRowNumber INT NOT NULL,
    SeatPosition INT DEFAULT 1,
    FOREIGN KEY (USN) REFERENCES students(USN),
    FOREIGN KEY (ExamID) REFERENCES exams(ExamID),
    FOREIGN KEY (RoomID) REFERENCES rooms(RoomID)
);

CREATE TABLE IF NOT EXISTS faculty_allocation (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    FacultyID INT,
    RoomID INT,
    ExamDate DATE,
    FOREIGN KEY (FacultyID) REFERENCES faculty(FacultyID),
    FOREIGN KEY (RoomID) REFERENCES rooms(RoomID)
);

CREATE TABLE IF NOT EXISTS systemlogs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    Message VARCHAR(255),
    LogTime DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roomstats (
    StatID INT AUTO_INCREMENT PRIMARY KEY,
    RoomNumber VARCHAR(10),
    TotalSeats INT,
    OccupiedSeats INT,
    Status VARCHAR(20),
    GeneratedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;

DROP TRIGGER IF EXISTS AfterStudentInsert;
DROP FUNCTION IF EXISTS GetOccupiedSeats;
DROP PROCEDURE IF EXISTS AddStudentData;
DROP PROCEDURE IF EXISTS GenerateRoomReport;
DROP PROCEDURE IF EXISTS DeleteStudent;
DROP PROCEDURE IF EXISTS UpdateStudentData;

DELIMITER //

CREATE TRIGGER AfterStudentInsert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    INSERT INTO systemlogs (Message)
    VALUES (CONCAT('New Student Joined: ', NEW.Name, ' (', NEW.USN, ')'));
END;
//

CREATE FUNCTION GetOccupiedSeats(targetRoomID INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE occupiedCount INT;
    SELECT COUNT(*) INTO occupiedCount
    FROM allocation
    WHERE RoomID = targetRoomID;
    RETURN occupiedCount;
END;
//

CREATE PROCEDURE AddStudentData(
    IN p_USN VARCHAR(15),
    IN p_Name VARCHAR(100),
    IN p_Semester INT
)
BEGIN
    DECLARE v_ExamID INT;

    INSERT INTO students (USN, Name, Semester) VALUES (p_USN, p_Name, p_Semester);

    IF p_Semester = 5 THEN
        SET v_ExamID = 1;
    ELSEIF p_Semester = 7 THEN
        SET v_ExamID = 2;
    END IF;

    IF v_ExamID IS NOT NULL THEN
        INSERT INTO student_exam_map (USN, ExamID) VALUES (p_USN, v_ExamID);
    END IF;
END;
//

CREATE PROCEDURE GenerateRoomReport()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_ID INT;
    DECLARE r_Num VARCHAR(10);
    DECLARE r_Cols INT;
    DECLARE r_Rows INT;
    DECLARE total_cap INT;
    DECLARE used_seats INT;
    DECLARE room_status VARCHAR(20);

    DECLARE roomCursor CURSOR FOR
        SELECT RoomID, RoomNumber, BenchColumns, TotalBenchesPerRow FROM rooms;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    TRUNCATE TABLE roomstats;

    OPEN roomCursor;

    read_loop: LOOP
        FETCH roomCursor INTO r_ID, r_Num, r_Cols, r_Rows;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET total_cap = (r_Cols * r_Rows) * 3;
        SET used_seats = GetOccupiedSeats(r_ID);

        IF used_seats = 0 THEN
            SET room_status = 'Empty';
        ELSEIF used_seats >= total_cap THEN
            SET room_status = 'Full';
        ELSE
            SET room_status = 'Active';
        END IF;

        INSERT INTO roomstats (RoomNumber, TotalSeats, OccupiedSeats, Status)
        VALUES (r_Num, total_cap, used_seats, room_status);
    END LOOP;

    CLOSE roomCursor;
END;
//

CREATE PROCEDURE DeleteStudent(IN p_USN VARCHAR(15))
BEGIN
    DELETE FROM allocation WHERE USN = p_USN;
    DELETE FROM student_exam_map WHERE USN = p_USN;
    DELETE FROM students WHERE USN = p_USN;
END;
//

CREATE PROCEDURE UpdateStudentData(
    IN p_USN VARCHAR(15),
    IN p_NewName VARCHAR(100),
    IN p_NewSemester INT
)
BEGIN
    DECLARE v_ExamID INT;

    UPDATE students
    SET Name = p_NewName, Semester = p_NewSemester
    WHERE USN = p_USN;

    IF p_NewSemester = 5 THEN
        SET v_ExamID = 1;
    ELSEIF p_NewSemester = 7 THEN
        SET v_ExamID = 2;
    END IF;

    DELETE FROM student_exam_map WHERE USN = p_USN;

    IF v_ExamID IS NOT NULL THEN
        INSERT INTO student_exam_map (USN, ExamID) VALUES (p_USN, v_ExamID);
    END IF;

    DELETE FROM allocation WHERE USN = p_USN;
END;
//

DELIMITER ;
