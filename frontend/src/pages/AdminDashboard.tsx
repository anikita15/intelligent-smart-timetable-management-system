import React, { useState, useEffect } from 'react';
import { Users, BookOpen, MapPin, CalendarDays, Layers, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';

interface Stats { faculty: number; subjects: number; rooms: number; sections: number; assignments: number; versions: number; }

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ faculty: 0, subjects: 0, rooms: 0, sections: 0, assignments: 0, versions: 0 });
  const [recentVersions, setRecentVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [f, s, r, sec, a, v] = await Promise.all([
          api.get('/faculty'), api.get('/subjects'), api.get('/rooms'),
          api.get('/sections'), api.get('/assignments'), api.get('/timetable/versions'),
        ]);
        setStats({ faculty: f.length, subjects: s.length, rooms: r.length, sections: sec.length, assignments: a.length, versions: v.length });
        setRecentVersions(v.slice(0, 5));
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Faculty', value: stats.faculty, icon: <Users size={18} />, link: '/admin/faculty' },
    { label: 'Subjects', value: stats.subjects, icon: <BookOpen size={18} />, link: '/admin/subjects' },
    { label: 'Rooms', value: stats.rooms, icon: <MapPin size={18} />, link: '/admin/rooms' },
    { label: 'Sections', value: stats.sections, icon: <Layers size={18} />, link: '/admin/sections' },
    { label: 'Assignments', value: stats.assignments, icon: <Clock size={18} />, link: '/admin/assignments' },
    { label: 'Timetables', value: stats.versions, icon: <CalendarDays size={18} />, link: '/admin/timetable' },
  ];

  const statusColor = (s: string) => s === 'PUBLISHED' ? 'badge-published' : s === 'ARCHIVED' ? 'badge-archived' : 'badge-draft';

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage your department's timetable system</p>

      <div className="stats-grid">
        {statCards.map(c => (
          <Link key={c.label} to={c.link} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card">
              <div className="stat-card-icon">{c.icon}</div>
              <div className="stat-card-label">{c.label}</div>
              <div className="stat-card-value">{loading ? '—' : c.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card p-6 mb-4">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Link to="/admin/faculty" className="btn btn-outline"><Users size={15} /> Manage Faculty</Link>
          <Link to="/admin/assignments" className="btn btn-outline"><Clock size={15} /> Manage Assignments</Link>
          <Link to="/admin/timetable" className="btn btn-primary"><CalendarDays size={15} /> Go to Timetable Manager</Link>
        </div>
      </div>

      {/* Recent timetables */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Timetable Versions</h2>
          <Link to="/admin/timetable" className="text-sm" style={{ color: 'var(--primary)' }}>View all →</Link>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state p-8"><p>Loading...</p></div>
          ) : recentVersions.length === 0 ? (
            <div className="empty-state p-8">
              <AlertTriangle size={32} style={{ color: 'var(--warning)' }} />
              <h3>No timetables generated yet</h3>
              <p>Go to the Timetable Manager to generate your first timetable.</p>
              <Link to="/admin/timetable" className="btn btn-primary mt-4" style={{ display: 'inline-flex' }}><CalendarDays size={15} /> Generate Timetable</Link>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Label</th><th>Academic Year</th><th>Semester</th><th>Entries</th><th>Status</th><th>Generated</th></tr></thead>
              <tbody>
                {recentVersions.map(v => (
                  <tr key={v.id}>
                    <td className="font-medium">{v.label || 'Untitled'}</td>
                    <td>{v.academicYear || '—'}</td>
                    <td>{v.semester ? `Sem ${v.semester}` : '—'}</td>
                    <td>{v._count?.entries ?? '—'}</td>
                    <td><span className={`badge ${statusColor(v.status)}`}>{v.status}</span></td>
                    <td className="text-sm text-muted">{new Date(v.generatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
