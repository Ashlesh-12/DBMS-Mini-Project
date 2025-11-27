import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard Inputs
  const [exam1, setExam1] = useState(1);
  const [exam2, setExam2] = useState(2);
  const [status, setStatus] = useState('');
  
  // Data State
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [reports, setReports] = useState([]);

  // Data Entry Forms
  const [newStudent, setNewStudent] = useState({ usn: '', name: '', semester: '5' });
  const [newFaculty, setNewFaculty] = useState({ name: '', dept: 'CS' });
  const [formStatus, setFormStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // VALIDATION STATE (NEW)
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRooms();
    fetchFaculty();
  }, []);

  // --- API CALLS ---
  const fetchRooms = () => axios.get('http://localhost:3001/rooms').then(res => setRooms(res.data));
  const fetchFaculty = () => axios.get('http://localhost:3001/faculty-allocations').then(res => setFacultyList(res.data));
  const fetchReports = () => axios.get('http://localhost:3001/room-reports').then(res => setReports(res.data));
  const fetchStudents = () => axios.get('http://localhost:3001/students').then(res => setStudentList(res.data));

  // --- VALIDATION LOGIC (NEW) ---
  const validateStudentForm = () => {
    let tempErrors = {};
    let isValid = true;

    // 1. Validate USN (Format: 4SF + 2 Digits + 2 Letters + 3 Digits) -> e.g., 4SF23CS001
    const usnRegex = /^4SF\d{2}[A-Z]{2}\d{3}$/i;
    if (!newStudent.usn) {
      tempErrors.usn = "USN is required.";
      isValid = false;
    } else if (!usnRegex.test(newStudent.usn)) {
      tempErrors.usn = "Invalid Format! Use format like 4SF23CS001";
      isValid = false;
    }

    // 2. Validate Name (No numbers allowed, min 3 chars)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!newStudent.name) {
      tempErrors.name = "Name is required.";
      isValid = false;
    } else if (newStudent.name.length < 3) {
      tempErrors.name = "Name must be at least 3 characters.";
      isValid = false;
    } else if (!nameRegex.test(newStudent.name)) {
      tempErrors.name = "Name cannot contain numbers or symbols.";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const validateAllocation = () => {
    if (exam1 <= 0 || exam2 <= 0) {
      setStatus('❌ Error: Exam IDs must be positive numbers.');
      return false;
    }
    if (exam1 == exam2) { // Loose equality to catch string '1' vs number 1
      setStatus('❌ Error: You cannot select the same Exam ID twice.');
      return false;
    }
    return true;
  };

  // --- HANDLERS ---
  const handleAllocation = async () => {
    if (!validateAllocation()) return; // Stop if validation fails

    setStatus('Allocating...');
    try {
      await axios.post('http://localhost:3001/allocate', { examId1: exam1, examId2: exam2 });
      setStatus('Success');
      if (selectedRoom) viewRoom(selectedRoom);
    } catch (error) { setStatus('Error'); }
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    if (!validateStudentForm()) return; // Stop if validation fails

    try {
      if (isEditing) {
        await axios.put('http://localhost:3001/update-student', newStudent);
        setFormStatus(`✅ Updated Student: ${newStudent.name}`);
        setIsEditing(false);
      } else {
        await axios.post('http://localhost:3001/add-student', newStudent);
        setFormStatus(`✅ Added Student: ${newStudent.name}`);
      }
      setNewStudent({ usn: '', name: '', semester: '5' });
      setErrors({}); // Clear errors
      fetchStudents();
    } catch (err) { setFormStatus('❌ Error: USN already exists or DB Error'); }
  };

  // ... (Other handlers remain the same)
  const handleFacultyAllocation = async () => { await axios.post('http://localhost:3001/allocate-faculty'); fetchFaculty(); };
  const viewRoom = async (roomId) => { setSelectedRoom(roomId); const res = await axios.get(`http://localhost:3001/room-view/${roomId}`); setRoomData(res.data); };
  const submitFaculty = async (e) => { e.preventDefault(); try { await axios.post('http://localhost:3001/add-faculty', newFaculty); setFormStatus(`✅ Added Faculty: ${newFaculty.name}`); setNewFaculty({ name: '', dept: 'CS' }); fetchFaculty(); } catch (err) { setFormStatus('❌ Error adding faculty'); } };
  const handleDeleteStudent = async (usn) => { if (!window.confirm(`Delete ${usn}?`)) return; try { await axios.delete(`http://localhost:3001/delete-student/${usn}`); fetchStudents(); } catch (err) { alert("Failed delete"); } };
  
  const handleEditClick = (student) => {
    setNewStudent({ usn: student.USN, name: student.Name, semester: student.Semester });
    setIsEditing(true);
    setErrors({}); // Clear errors when starting edit
    setFormStatus(`✏️ Editing ${student.USN}...`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchTab = (tab) => { setActiveTab(tab); if (tab === 'reports') fetchReports(); if (tab === 'entry') fetchStudents(); };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div><h1 className="brand-title">AERAS</h1><p className="brand-subtitle">Sahyadri College Examination Control System</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => switchTab('dashboard')} className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}>📊 Dashboard</button>
          <button onClick={() => switchTab('entry')} className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`}>➕ Manage Data</button>
          <button onClick={() => switchTab('reports')} className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}>📈 Reports</button>
        </div>
      </header>

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <>
          <section className="control-panel">
            <div className="input-group">
              <label>Exam A (Left)</label>
              <input type="number" min="1" value={exam1} onChange={e => setExam1(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Exam B (Right)</label>
              <input type="number" min="1" value={exam2} onChange={e => setExam2(e.target.value)} />
            </div>
            <button onClick={handleAllocation} className="btn btn-primary">⚡ Run Allocation</button>
            <button onClick={handleFacultyAllocation} className="btn btn-secondary">👤 Assign Faculty</button>
            {status === 'Success' && <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '10px' }}>✅ Ready</span>}
            {status.includes('Error') && <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '10px' }}>{status}</span>}
          </section>

          <div className="main-content">
            <div className="room-card">
              <h2 style={{ marginBottom: '20px', color: '#333' }}>Room Seating Plan</h2>
              <div className="room-tabs">
                {rooms.map(r => (
                  <button key={r.RoomID} onClick={() => viewRoom(r.RoomID)} className={`room-tab ${selectedRoom === r.RoomID ? 'active' : ''}`}>Room {r.RoomNumber}</button>
                ))}
              </div>
              {roomData ? (
                <div className="seating-grid" style={{ gridTemplateColumns: `repeat(${roomData.room.BenchColumns}, 1fr)` }}>
                  {Array.from({ length: roomData.room.BenchColumns * roomData.room.TotalBenchesPerRow }).map((_, i) => {
                    const col = (i % roomData.room.BenchColumns) + 1;
                    const row = Math.floor(i / roomData.room.BenchColumns) + 1;
                    const s1 = roomData.seats.find(s => s.BenchColumnNumber === col && s.BenchRowNumber === row && s.SeatPosition === 1);
                    const s2 = roomData.seats.find(s => s.BenchColumnNumber === col && s.BenchRowNumber === row && s.SeatPosition === 2);
                    return (
                      <div key={i} className="bench-container">
                        <span className="bench-label">BENCH {col}-{row}</span>
                        <div className="seats-row">
                          <div className={`seat ${s1 ? 'filled-a' : 'empty'}`}>{s1 ? <><span className="usn-text">{s1.USN}</span><span className="sub-text">{s1.SubjectCode}</span></> : <span>Empty</span>}</div>
                          <div className={`seat ${s2 ? 'filled-b' : 'empty'}`}>{s2 ? <><span className="usn-text">{s2.USN}</span><span className="sub-text">{s2.SubjectCode}</span></> : <span>Empty</span>}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ padding: '50px', textAlign: 'center', color: '#9ca3af' }}>Select a room</div>}
            </div>
            <div className="faculty-card">
              <h3 style={{ marginBottom: '15px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>Faculty Duties</h3>
              <ul className="faculty-list">
                {facultyList.map((f, idx) => (
                  <li key={idx} className="faculty-item"><span className="faculty-name">{f.Name || f.name}</span><span className="room-badge">{f.RoomNumber}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* MANAGE DATA VIEW */}
      {activeTab === 'entry' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {formStatus && <div style={{ padding: '15px', background: formStatus.includes('Error') ? '#fee2e2' : '#dcfce7', color: formStatus.includes('Error') ? '#dc2626' : '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>{formStatus}</div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            
            {/* STUDENT FORM WITH VALIDATION */}
            <div className="faculty-card" style={{ borderColor: isEditing ? '#ff6f00' : 'transparent', borderWidth: isEditing ? '2px' : '0px', borderStyle: 'solid' }}>
              <h2 style={{ color: isEditing ? '#ff6f00' : '#1b5e20', marginBottom: '15px' }}>{isEditing ? '✏️ Update Student' : 'Add Student'}</h2>
              <form onSubmit={submitStudent} noValidate>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>USN {isEditing && '(Locked)'}</label>
                  <input 
                    type="text" value={newStudent.usn} onChange={e => setNewStudent({...newStudent, usn: e.target.value})} 
                    disabled={isEditing} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: errors.usn ? '2px solid red' : '1px solid #ccc', background: isEditing ? '#eee' : 'white' }} 
                    placeholder="e.g. 4SF23CS001"
                  />
                  {/* ERROR MESSAGE DISPLAY */}
                  {errors.usn && <span style={{ color: 'red', fontSize: '11px', fontWeight: 'bold' }}>{errors.usn}</span>}
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Full Name</label>
                  <input 
                    type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: errors.name ? '2px solid red' : '1px solid #ccc' }} 
                  />
                  {errors.name && <span style={{ color: 'red', fontSize: '11px', fontWeight: 'bold' }}>{errors.name}</span>}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Semester</label>
                  <select value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="5">5th Semester</option>
                    <option value="7">7th Semester</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: isEditing ? '#ff6f00' : '#1b5e20' }}>{isEditing ? 'Update Student' : 'Save Student'}</button>
                  {isEditing && <button type="button" onClick={() => { setIsEditing(false); setNewStudent({ usn: '', name: '', semester: '5' }); setFormStatus(''); setErrors({}); }} className="btn btn-secondary">Cancel</button>}
                </div>
              </form>
            </div>

            {/* FACULTY FORM */}
            <div className="faculty-card">
              <h2 style={{ color: '#ff6f00', marginBottom: '15px' }}>Add Faculty</h2>
              <form onSubmit={submitFaculty}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Faculty Name</label>
                  <input type="text" required value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} placeholder="Prof. Name" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Department</label>
                  <select value={newFaculty.dept} onChange={e => setNewFaculty({...newFaculty, dept: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="CS">CS</option><option value="IS">IS</option><option value="EC">EC</option><option value="MECH">MECH</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#ff6f00' }}>Save Faculty</button>
              </form>
            </div>
          </div>

          <div className="room-card">
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Student Records Database</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f3f4f6' }}>
                  <tr><th style={{ padding: '12px' }}>USN</th><th style={{ padding: '12px' }}>Name</th><th style={{ padding: '12px' }}>Semester</th><th style={{ padding: '12px' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {studentList.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.USN}</td>
                      <td style={{ padding: '12px' }}>{s.Name}</td>
                      <td style={{ padding: '12px' }}>{s.Semester}</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEditClick(s)} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Edit</button>
                        <button onClick={() => handleDeleteStudent(s.USN)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="room-card">
            <h2 style={{ color: '#1b5e20', marginBottom: '10px' }}>📊 Room Occupancy Reports</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>Generated by <b>MySQL Cursor</b>: <i>GenerateRoomReport()</i></p>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px' }}>Room No</th><th style={{ padding: '12px' }}>Capacity</th><th style={{ padding: '12px' }}>Occupied</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1b5e20' }}>{r.RoomNumber}</td>
                    <td style={{ padding: '12px' }}>{r.TotalSeats}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{r.OccupiedSeats}</td>
                    <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: r.Status === 'Full' ? '#fee2e2' : r.Status === 'Empty' ? '#f3f4f6' : '#dcfce7', color: r.Status === 'Full' ? '#dc2626' : r.Status === 'Empty' ? '#9ca3af' : '#16a34a' }}>{r.Status}</span></td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>{new Date(r.GeneratedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;