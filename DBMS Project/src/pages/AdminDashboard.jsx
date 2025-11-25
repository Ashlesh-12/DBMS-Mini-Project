import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'entry'
  
  // Dashboard State
  const [exam1, setExam1] = useState(1);
  const [exam2, setExam2] = useState(2);
  const [status, setStatus] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [facultyList, setFacultyList] = useState([]);

  // Data Entry State
  const [newStudent, setNewStudent] = useState({ usn: '', name: '', semester: '5' });
  const [newFaculty, setNewFaculty] = useState({ name: '', dept: 'CS' });
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    fetchRooms();
    fetchFaculty();
  }, []);

  // --- API CALLS ---
  const fetchRooms = () => {
    axios.get('http://localhost:3001/rooms').then(res => setRooms(res.data));
  };
  const fetchFaculty = () => {
    axios.get('http://localhost:3001/faculty-allocations').then(res => setFacultyList(res.data));
  };

  const handleAllocation = async () => {
    setStatus('Allocating...');
    try {
      await axios.post('http://localhost:3001/allocate', { examId1: exam1, examId2: exam2 });
      setStatus('Success');
      if (selectedRoom) viewRoom(selectedRoom);
    } catch (error) { setStatus('Error'); }
  };

  const handleFacultyAllocation = async () => {
    await axios.post('http://localhost:3001/allocate-faculty');
    fetchFaculty();
  };

  const viewRoom = async (roomId) => {
    setSelectedRoom(roomId);
    const res = await axios.get(`http://localhost:3001/room-view/${roomId}`);
    setRoomData(res.data);
  };

  // --- NEW: FORM HANDLERS ---
  const submitStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/add-student', newStudent);
      setFormStatus(`✅ Added Student: ${newStudent.name}`);
      setNewStudent({ usn: '', name: '', semester: '5' }); // Reset form
    } catch (err) { setFormStatus('❌ Error: USN might exist'); }
  };

  const submitFaculty = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/add-faculty', newFaculty);
      setFormStatus(`✅ Added Faculty: ${newFaculty.name}`);
      setNewFaculty({ name: '', dept: 'CS' }); // Reset form
      fetchFaculty(); // Refresh list
    } catch (err) { setFormStatus('❌ Error adding faculty'); }
  };

  return (
    <div className="dashboard-container">
      
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1 className="brand-title">AERAS</h1>
          <p className="brand-subtitle">Sahyadri College Examination Control System</p>
        </div>
        
        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('entry')} 
            className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`}
          >
            ➕ Manage Data
          </button>
        </div>
      </header>

      {/* === VIEW 1: DASHBOARD (Original View) === */}
      {activeTab === 'dashboard' && (
        <>
          <section className="control-panel">
            <div className="input-group">
              <label>Exam A (Left)</label>
              <input type="number" value={exam1} onChange={e => setExam1(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Exam B (Right)</label>
              <input type="number" value={exam2} onChange={e => setExam2(e.target.value)} />
            </div>
            <button onClick={handleAllocation} className="btn btn-primary">⚡ Run Allocation</button>
            <button onClick={handleFacultyAllocation} className="btn btn-secondary">👤 Assign Faculty</button>
            {status === 'Success' && <span style={{ color: 'green', fontWeight: 'bold', marginLeft: '10px' }}>✅ Ready</span>}
          </section>

          <div className="main-content">
            {/* Room Visualizer */}
            <div className="room-card">
              <h2 style={{ marginBottom: '20px', color: '#333' }}>Room Seating Plan</h2>
              <div className="room-tabs">
                {rooms.map(r => (
                  <button key={r.RoomID} onClick={() => viewRoom(r.RoomID)} className={`room-tab ${selectedRoom === r.RoomID ? 'active' : ''}`}>
                    Room {r.RoomNumber}
                  </button>
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
                          <div className={`seat ${s1 ? 'filled-a' : 'empty'}`}>
                            {s1 ? <><span className="usn-text">{s1.USN}</span><span className="sub-text">{s1.SubjectCode}</span></> : <span>Empty</span>}
                          </div>
                          <div className={`seat ${s2 ? 'filled-b' : 'empty'}`}>
                            {s2 ? <><span className="usn-text">{s2.USN}</span><span className="sub-text">{s2.SubjectCode}</span></> : <span>Empty</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ padding: '50px', textAlign: 'center', color: '#9ca3af' }}>Select a room</div>}
            </div>

            {/* Faculty List */}
            <div className="faculty-card">
              <h3 style={{ marginBottom: '15px', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>Faculty Duties</h3>
              <ul className="faculty-list">
                {facultyList.map((f, idx) => (
                  <li key={idx} className="faculty-item">
                    <span className="faculty-name">{f.Name || f.name}</span>
                    <span className="room-badge">{f.RoomNumber}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* === VIEW 2: DATA ENTRY (New View) === */}
      {activeTab === 'entry' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {formStatus && (
            <div style={{ padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
              {formStatus}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* ADD STUDENT FORM */}
            <div className="faculty-card">
              <h2 style={{ color: '#1b5e20', marginBottom: '15px' }}>Add Student</h2>
              <form onSubmit={submitStudent}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>USN</label>
                  <input 
                    type="text" required value={newStudent.usn}
                    onChange={e => setNewStudent({...newStudent, usn: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    placeholder="4SF23CS..."
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Full Name</label>
                  <input 
                    type="text" required value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Semester</label>
                  <select 
                    value={newStudent.semester}
                    onChange={e => setNewStudent({...newStudent, semester: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="5">5th Semester</option>
                    <option value="7">7th Semester</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Student</button>
              </form>
            </div>

            {/* ADD FACULTY FORM */}
            <div className="faculty-card">
              <h2 style={{ color: '#ff6f00', marginBottom: '15px' }}>Add Faculty</h2>
              <form onSubmit={submitFaculty}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Faculty Name</label>
                  <input 
                    type="text" required value={newFaculty.name}
                    onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    placeholder="Prof. Name"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Department</label>
                  <select 
                    value={newFaculty.dept}
                    onChange={e => setNewFaculty({...newFaculty, dept: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="CS">CS</option>
                    <option value="IS">IS</option>
                    <option value="EC">EC</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', background: '#ff6f00' }}>Save Faculty</button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;