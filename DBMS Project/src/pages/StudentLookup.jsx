import React, { useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // We reuse the nice CSS we already made

function StudentLookup() {
  const [usn, setUsn] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setStudentData(null);
    
    try {
      const res = await axios.get(`http://localhost:3001/search-student/${usn}`);
      setStudentData(res.data);
    } catch (err) {
      setError('Student not found or seat not allocated yet.');
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      
      <div className="room-card" style={{ width: '100%', maxWidth: '500px', minHeight: 'auto', textAlign: 'center' }}>
        <h1 className="brand-title" style={{ marginBottom: '10px' }}>AERAS</h1>
        <p className="brand-subtitle" style={{ marginBottom: '30px' }}>Student Exam Seat Search</p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <input 
            type="text" 
            placeholder="Enter USN (e.g. 4SF23CS001)" 
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '16px' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {error && <p style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</p>}

        {studentData && (
          <div style={{ border: '2px solid #1b5e20', borderRadius: '12px', padding: '20px', backgroundColor: '#f0fdf4', marginTop: '20px' }}>
            <h2 style={{ color: '#1b5e20', margin: '0 0 10px 0' }}>{studentData.Name}</h2>
            <p style={{ color: '#666', fontWeight: 'bold', marginBottom: '20px' }}>{studentData.USN}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Room No</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6f00' }}>{studentData.RoomNumber}</div>
              </div>
              
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Exam Subject</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{studentData.SubjectCode}</div>
              </div>

              <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Bench Location</span>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  Col {studentData.BenchColumnNumber} - Row {studentData.BenchRowNumber}
                </div>
              </div>

              <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                 <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Seat Side</span>
                 <div style={{ fontSize: '16px', fontWeight: 'bold', color: studentData.SeatPosition === 1 ? '#1565c0' : '#166534' }}>
                   {studentData.SeatPosition === 1 ? 'Left (Blue)' : 'Right (Green)'}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLookup;