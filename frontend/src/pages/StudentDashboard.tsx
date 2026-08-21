import React from 'react';

const StudentDashboard: React.FC = () => {
  return (
    <div>
      <h1 className="page-title">Student Dashboard</h1>
      <div className="card p-6">
        <h2>My Class Timetable</h2>
        <p style={{ color: 'var(--text-muted)' }} className="mt-4">
          Your schedule will appear here.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;
