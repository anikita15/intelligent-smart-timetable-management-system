import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Layers } from 'lucide-react';
import { api } from '../api';
import TimetableGrid from '../components/TimetableGrid';
import { useToast } from '../components/Toast';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [publishedVersion, setPublishedVersion] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const versions = await api.get('/timetable/versions');
      const published = versions.find((v: any) => v.status === 'PUBLISHED');
      setPublishedVersion(published || null);
      if (published) {
        const e = await api.get(`/timetable/versions/${published.id}/entries`);
        setEntries(e);
      }
    } catch { toast('error', 'Failed to load timetable'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableSections = [...new Set(entries.map(e => e.section.id))].map(id => entries.find(e => e.section.id === id)!.section);

  return (
    <div>
      <h1 className="page-title">My Timetable</h1>
      <p className="page-subtitle">Your section's weekly schedule</p>

      {loading ? (
        <div className="empty-state card p-8"><p>Loading...</p></div>
      ) : !publishedVersion ? (
        <div className="card p-8 text-center empty-state">
          <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
          <h3>No timetable published yet</h3>
          <p>Your admin will publish the timetable soon.</p>
        </div>
      ) : (
        <>
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers size={16} style={{ color: 'var(--text-muted)' }} />
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Your Section:</label>
              </div>
              <select className="form-select" style={{ maxWidth: '200px' }} value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                <option value="">— Select Section —</option>
                {availableSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedSection && (
                <span className="badge badge-active">{availableSections.find((s: any) => s.id === selectedSection)?.name}</span>
              )}
            </div>
          </div>

          {!selectedSection ? (
            <div className="card empty-state p-8">
              <Layers size={40} />
              <h3>Select your section</h3>
              <p>Choose your section to view your timetable.</p>
            </div>
          ) : (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{publishedVersion.label || 'Published Timetable'}</h2>
                <span className="badge badge-published">Published</span>
              </div>
              <TimetableGrid entries={entries} filterSectionId={selectedSection} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
