import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, BookOpen, MapPin, Grid, LogOut } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Basic auth check (replace with real auth state later)
  const userRole = localStorage.getItem('role') || 'ADMIN';
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: <Grid size={20} />, label: 'Dashboard' },
    { to: '/admin/faculty', icon: <Users size={20} />, label: 'Faculty' },
    { to: '/admin/subjects', icon: <BookOpen size={20} />, label: 'Subjects' },
    { to: '/admin/rooms', icon: <MapPin size={20} />, label: 'Rooms' },
  ];

  const facultyLinks = [
    { to: '/faculty', icon: <Grid size={20} />, label: 'Dashboard' },
  ];

  const studentLinks = [
    { to: '/student', icon: <Grid size={20} />, label: 'Dashboard' },
  ];

  const links = userRole === 'ADMIN' ? adminLinks : userRole === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <CalendarDays size={24} />
          <h2>ITMS</h2>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: 500 }}>Welcome, {userRole}</div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <LogOut size={16} /> Logout
          </button>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
