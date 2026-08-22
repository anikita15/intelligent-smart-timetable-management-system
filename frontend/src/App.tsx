import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';

import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Admin sub-pages
import FacultyManager from './pages/admin/FacultyManager';
import SubjectManager from './pages/admin/SubjectManager';
import SectionManager from './pages/admin/SectionManager';
import RoomManager from './pages/admin/RoomManager';
import AssignmentManager from './pages/admin/AssignmentManager';
import TimetableViewer from './pages/admin/TimetableViewer';
import ConflictsPage from './pages/admin/ConflictsPage';
import UserManager from './pages/admin/UserManager';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/login" replace />} />

            {/* Admin routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/faculty" element={<FacultyManager />} />
            <Route path="admin/subjects" element={<SubjectManager />} />
            <Route path="admin/sections" element={<SectionManager />} />
            <Route path="admin/rooms" element={<RoomManager />} />
            <Route path="admin/assignments" element={<AssignmentManager />} />
            <Route path="admin/timetable" element={<TimetableViewer />} />
            <Route path="admin/timetable/:versionId/conflicts" element={<ConflictsPage />} />
            <Route path="admin/users" element={<UserManager />} />

            {/* Faculty & student */}
            <Route path="faculty" element={<FacultyDashboard />} />
            <Route path="student" element={<StudentDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
