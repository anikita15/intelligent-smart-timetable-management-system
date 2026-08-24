import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Layers, FileDown, Sheet } from 'lucide-react';
import { api } from '../api';
import TimetableGrid from '../components/TimetableGrid';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useToast } from '../components/Toast';
import { exportTimetablePdf } from '../utils/exportPdf';
import { exportTimetableExcel } from '../utils/exportExcel';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [publishedVersion, setPublishedVersion] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Auto-linked section from login
  const linkedSectionId = localStorage.getItem('sectionId') || '';

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

  // Auto-select linked section once entries are loaded
  useEffect(() => {
    if (linkedSectionId && entries.length > 0) {
      setSelectedSection(linkedSectionId);
    }
  }, [linkedSectionId, entries]);

  const availableSections = [...new Set(entries.map(e => e.section.id))].map(
    id => entries.find(e => e.section.id === id)!.section
  );

  const filteredEntries = selectedSection ? entries.filter(e => e.section.id === selectedSection) : [];
  const sectionName = availableSections.find((s: any) => s.id === selectedSection)?.name;

  const handleExportPdf = async () => {
    if (!selectedSection) return;
    setExportingPdf(true);
    try {
      await exportTimetablePdf('student-timetable-grid', `${sectionName || 'timetable'}-schedule`, `${sectionName} — Timetable`);
      toast('success', 'PDF downloaded!');
    } catch { toast('error', 'PDF export failed'); } finally { setExportingPdf(false); }
  };

  const handleExportExcel = () => {
    if (!selectedSection) return;
    exportTimetableExcel(filteredEntries, `${sectionName || 'timetable'}-schedule`);
    toast('success', 'Excel downloaded!');
  };

  return (
    <div>
      <PageHeader
        eyebrow="STUDENT"
        title="My Timetable"
        description="Your section's weekly schedule."
        action={selectedSection && filteredEntries.length > 0 ? (
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={handleExportExcel}><Sheet size={14} /> Excel</button>
            <button className="btn btn-outline btn-sm" onClick={handleExportPdf} disabled={exportingPdf}><FileDown size={14} /> {exportingPdf ? 'Exporting…' : 'PDF'}</button>
          </div>
        ) : undefined}
      />

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
              <select
                className="form-select"
                style={{ maxWidth: '200px' }}
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
              >
                <option value="">— Select Section —</option>
                {availableSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedSection && (
                <>
                  <StatusPill tone="neutral">{sectionName}</StatusPill>
                  {linkedSectionId === selectedSection && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(26,16,16,.5)' }}>← your linked section</span>
                  )}
                </>
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
            <div className="card p-4" id="student-timetable-grid">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{publishedVersion.label || 'Published Timetable'}</h2>
                <StatusPill tone="crimson">PUBLISHED</StatusPill>
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
