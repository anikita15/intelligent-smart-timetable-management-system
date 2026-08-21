import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';

import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (Simplified for Phase 1) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/login" replace />} />
          
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/faculty" element={<div><h1 className="page-title">Manage Faculty</h1></div>} />
          <Route path="admin/subjects" element={<div><h1 className="page-title">Manage Subjects</h1></div>} />
          <Route path="admin/rooms" element={<div><h1 className="page-title">Manage Rooms</h1></div>} />

          <Route path="faculty" element={<FacultyDashboard />} />
          <Route path="student" element={<StudentDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
