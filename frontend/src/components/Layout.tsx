import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, BookOpen, MapPin, Grid, LogOut,
  Layers, Clock, CalendarCheck, UserCog, LayoutDashboard
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role') || 'ADMIN';
  const email = localStorage.getItem('email') || userRole;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const adminLinks = [
    { section: 'Overview', links: [
      { to: '/admin', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    ]},
    { section: 'Data Management', links: [
      { to: '/admin/faculty', icon: <Users size={17} />, label: 'Faculty' },
      { to: '/admin/subjects', icon: <BookOpen size={17} />, label: 'Subjects' },
      { to: '/admin/sections', icon: <Layers size={17} />, label: 'Sections' },
      { to: '/admin/rooms', icon: <MapPin size={17} />, label: 'Rooms' },
      { to: '/admin/assignments', icon: <Clock size={17} />, label: 'Assignments' },
    ]},
    { section: 'Timetable', links: [
      { to: '/admin/timetable', icon: <CalendarCheck size={17} />, label: 'Timetable Manager' },
    ]},
    { section: 'System', links: [
      { to: '/admin/users', icon: <UserCog size={17} />, label: 'Users' },
    ]},
  ];

  const facultyLinks = [
    { section: null, links: [
      { to: '/faculty', icon: <Grid size={17} />, label: 'My Schedule' },
    ]},
  ];

  const studentLinks = [
    { section: null, links: [
      { to: '/student', icon: <Grid size={17} />, label: 'My Timetable' },
    ]},
  ];

  const linkGroups = userRole === 'ADMIN' ? adminLinks : userRole === 'FACULTY' ? facultyLinks : studentLinks;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <CalendarDays size={22} />
          <span>ITMS</span>
        </div>

        <nav className="sidebar-nav">
          {linkGroups.map((group, gi) => (
            <div key={gi}>
              {group.section && <div className="sidebar-section-label">{group.section}</div>}
              {group.links.map(link => (
                <Link key={link.to} to={link.to} className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}>
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          <button onClick={handleLogout} className="btn btn-outline w-full" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {userRole === 'ADMIN' ? 'Admin Panel' : userRole === 'FACULTY' ? 'Faculty Portal' : 'Student Portal'}
          </div>
          <div className="topbar-user">{userRole}</div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
