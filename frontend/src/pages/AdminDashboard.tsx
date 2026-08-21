import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ faculty: 0, subjects: 0, rooms: 0, versions: 0 });

  useEffect(() => {
    // In a real app, fetch these from an API
    // For now, we just mock or use the ones we built
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [facultyRes, subjectRes, roomRes, versionRes] = await Promise.all([
          axios.get('http://localhost:5005/api/faculty', { headers }),
          axios.get('http://localhost:5005/api/subjects', { headers }),
          axios.get('http://localhost:5005/api/rooms', { headers }),
          axios.get('http://localhost:5005/api/timetable/versions', { headers }),
        ]);

        setStats({
          faculty: facultyRes.data.length,
          subjects: subjectRes.data.length,
          rooms: roomRes.data.length,
          versions: versionRes.data.length
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };

    fetchStats();
  }, []);

  const generateTimetable = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5005/api/timetable/generate', 
        { academicYear: '2023-2024', semester: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Timetable generated! Version ID: ${response.data.versionId}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Admin Dashboard</h1>
        <button className="btn btn-primary" onClick={generateTimetable} disabled={loading}>
          {loading ? 'Generating...' : 'Generate New Timetable'}
        </button>
      </div>

      <div className="flex gap-6 mb-6">
        <div className="card p-6 w-full">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Faculty</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.faculty}</p>
        </div>
        <div className="card p-6 w-full">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Subjects</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.subjects}</p>
        </div>
        <div className="card p-6 w-full">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Rooms</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.rooms}</p>
        </div>
        <div className="card p-6 w-full">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Timetable Versions</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.versions}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2>Recent Timetables</h2>
        <p style={{ color: 'var(--text-muted)' }} className="mt-4">
          Timetable versions will appear here once generated.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
