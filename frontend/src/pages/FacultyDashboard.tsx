import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { api } from '../api';
import TimetableGrid from '../components/TimetableGrid';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useToast } from '../components/Toast';

const FacultyDashboard: React.FC = () => {
  const { toast } = useToast();
  const [publishedVersion, setPublishedVersion] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [myFaculty, setMyFaculty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive faculty from stored user info (userId → faculty profile)
  const userId = localStorage.getItem('userId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [versions, faculty] = await Promise.all([
        api.get('/timetable/versions'),
        api.get('/faculty'),
      ]);
      const published = versions.find((v: any) => v.status === 'PUBLISHED');
      setPublishedVersion(published || null);

      // Find faculty linked to current user
      const storedEmail = localStorage.getItem('email');
      const myFac = faculty.find((f: any) => f.user?.email === storedEmail || f.userId === userId);
      setMyFaculty(myFac || null);

      if (published) {
        const e = await api.get(`/timetable/versions/${published.id}/entries`);
        setEntries(e);
      }
    } catch { toast('error', 'Failed to load schedule'); } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const myEntries = entries.filter(e => myFaculty && e.faculty.id === myFaculty.id);
  const totalHours = myEntries.length; // 1 entry = 1 hour slot

  return (
    <div>
      <PageHeader eyebrow="FACULTY" title="My Schedule" description="Your published weekly timetable." />

      {loading ? (
        <div className="empty-state card p-8"><p>Loading your schedule...</p></div>
      ) : !publishedVersion ? (
        <div className="card p-8 text-center empty-state">
          <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
          <h3>No published timetable</h3>
          <p>The admin hasn't published a timetable yet. Check back soon.</p>
        </div>
      ) : (
        <>
          {!myFaculty && (
            <div className="alert-banner alert-warning mb-4">
              <Clock size={16} />
              <span>Your account is not linked to a faculty profile. Contact the admin.</span>
            </div>
          )}
          {myFaculty && (
            <div className="stats-grid mb-4">
              <div className="stat-card">
                <div className="stat-card-icon"><Clock size={18} /></div>
                <div className="stat-card-label">Weekly Hours</div>
                <div className="stat-card-value">{totalHours}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><CalendarDays size={18} /></div>
                <div className="stat-card-label">Classes This Week</div>
                <div className="stat-card-value">{myEntries.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><CalendarDays size={18} /></div>
                <div className="stat-card-label">Unique Subjects</div>
                <div className="stat-card-value">{new Set(myEntries.map(e => e.subject.id)).size}</div>
              </div>
            </div>
          )}

          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{publishedVersion.label || 'Published Timetable'}</h2>
              <StatusPill tone="crimson">PUBLISHED</StatusPill>
            </div>
            <TimetableGrid entries={entries} filterFacultyId={myFaculty?.id} showSection />
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyDashboard;
