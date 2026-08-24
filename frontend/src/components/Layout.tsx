import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userRole = localStorage.getItem('role') || 'ADMIN';
  const email = localStorage.getItem('email') || userRole;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/faculty', label: 'Faculty' },
    { to: '/admin/subjects', label: 'Subjects' },
    { to: '/admin/sections', label: 'Sections' },
    { to: '/admin/rooms', label: 'Rooms' },
    { to: '/admin/assignments', label: 'Assignments' },
    { to: '/admin/timetable', label: 'Timetable' },
    { to: '/admin/users', label: 'Users' },
  ];

  const facultyLinks = [{ to: '/faculty', label: 'My Schedule', end: true }];
  const studentLinks = [{ to: '/student', label: 'My Timetable', end: true }];

  const navLinks = userRole === 'ADMIN' ? adminLinks : userRole === 'FACULTY' ? facultyLinks : studentLinks;

  const contextLabel = userRole === 'ADMIN' ? 'ADMIN PANEL' : userRole === 'FACULTY' ? 'FACULTY PORTAL' : 'STUDENT PORTAL';
  const avatarInitials = userRole.slice(0, 2).toUpperCase();

  const isDashboardOrConflicts = location.pathname === '/admin' || /\/admin\/timetable\/.+\/conflicts$/.test(location.pathname);

  const goWithAction = (to: string, action: string) => {
    setMobileNavOpen(false);
    navigate(to, { state: { dockAction: action } });
  };

  const renderNav = (onNavigate?: () => void) => navLinks.map(link => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className="masthead-nav-link"
      onClick={onNavigate}
    >
      {link.label}
    </NavLink>
  ));

  return (
    <div className="app-layout">
      <header className="masthead">
        <div className="masthead-row1">
          <div className="masthead-wordmark">ITMS</div>
          <div className="masthead-context">{contextLabel}</div>

          <nav className="masthead-nav" aria-label="Primary">
            {renderNav()}
          </nav>

          <button className="masthead-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
            <Menu size={16} /> Menu
          </button>

          <div className="masthead-divider" />
          <div className="masthead-account" title={email}>
            <div className="masthead-avatar">{avatarInitials}</div>
            <div className="masthead-role">{userRole}</div>
            <button className="masthead-logout" onClick={handleLogout} title="Log out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div id="page-header-slot" />
      </header>

      {mobileNavOpen && (
        <div className="mobile-nav-sheet">
          <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
          {renderNav(() => setMobileNavOpen(false))}
        </div>
      )}

      <main className="main-content">
        <div className={`page-content ${isDashboardOrConflicts ? 'content-overlap' : ''}`}>
          <Outlet />
        </div>
      </main>

      {userRole === 'ADMIN' && (
        <div className="command-dock">
          <button className="dock-item" onClick={() => goWithAction('/admin/subjects', 'openCreate')}>New subject</button>
          <button className="dock-item" onClick={() => goWithAction('/admin/assignments', 'openCreate')}>New assignment</button>
          <button className="dock-item disabled" title="Coming soon">Import CSV</button>
          <div className="dock-divider" />
          <button className="dock-primary" onClick={() => goWithAction('/admin/timetable', 'openGenerate')}>Generate timetable</button>
          <div className="dock-hint">⌘K</div>
        </div>
      )}
    </div>
  );
};

export default Layout;
