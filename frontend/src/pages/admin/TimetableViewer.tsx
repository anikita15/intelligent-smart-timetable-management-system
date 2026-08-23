import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle, Archive, Trash2, Calendar, AlertTriangle, ChevronRight, FileDown, Sheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import TimetableGrid from '../../components/TimetableGrid';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { exportTimetablePdf } from '../../utils/exportPdf';
import { exportTimetableExcel } from '../../utils/exportExcel';


interface Version {
  id: string; label: string | null; status: string;
  generatedAt: string; publishedAt: string | null; academicYear: string | null; semester: number | null;
  _count: { entries: number };
}

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
);

const TimetableViewer: React.FC = () => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<Version | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<{ totalConflicts: number; conflicts: any[] } | null>(null);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<null | 'publish' | 'archive' | 'delete'>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [genForm, setGenForm] = useState({ academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), semester: 1, label: '' });
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try { setVersions(await api.get('/timetable/versions')); }
    catch { toast('error', 'Failed to load versions'); } finally { setVersionsLoading(false); }
  }, []);

  const loadFilters = useCallback(async () => {
    try { const [f, s] = await Promise.all([api.get('/faculty'), api.get('/sections')]); setFaculty(f); setSections(s); }
    catch { /* ignore */ }
  }, []);

  useEffect(() => { loadVersions(); loadFilters(); }, []);

  const selectVersion = async (v: Version) => {
    setSelected(v); setEntries([]); setConflicts(null); setFilterFaculty(''); setFilterSection('');
    setLoading(true);
    try {
      const [e, c] = await Promise.all([
        api.get(`/timetable/versions/${v.id}/entries`),
        api.get(`/timetable/versions/${v.id}/conflicts`),
      ]);
      setEntries(e); setConflicts(c);
    } catch { toast('error', 'Failed to load timetable'); } finally { setLoading(false); }
  };

  const doAction = async () => {
    if (!selected || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'publish') { await api.patch(`/timetable/versions/${selected.id}/publish`); toast('success', 'Timetable published!'); }
      if (confirmAction === 'archive') { await api.patch(`/timetable/versions/${selected.id}/archive`); toast('success', 'Timetable archived'); }
      if (confirmAction === 'delete') { await api.delete(`/timetable/versions/${selected.id}`); toast('success', 'Version deleted'); setSelected(null); setEntries([]); }
      setConfirmAction(null); loadVersions();
      if (confirmAction !== 'delete') selectVersion({ ...selected, status: confirmAction === 'publish' ? 'PUBLISHED' : 'ARCHIVED' });
    } catch (e: any) { toast('error', e.message); } finally { setActionLoading(false); }
  };

  const generate = async () => {
    if (!genForm.academicYear || !genForm.semester) return toast('warning', 'Academic year and semester required');
    setGenerating(true);
    try {
      const result = await api.post('/timetable/generate', genForm);
      toast('success', `Generated! ${result.assignedCount} slots assigned.`);
      if (result.unassignedCount > 0) toast('warning', `${result.unassignedCount} unresolved conflicts.`);
      setGenerateModal(false); await loadVersions();
      const refreshed = await api.get('/timetable/versions');
      setVersions(refreshed);
      const newest = refreshed[0];
      if (newest) selectVersion(newest);
    } catch (e: any) { toast('error', e.message); } finally { setGenerating(false); }
  };

  const handleExportPdf = async () => {
    if (!entries.length || !selected) return;
    setExportingPdf(true);
    try {
      await exportTimetablePdf(
        'timetable-export-area',
        selected.label || 'timetable',
        selected.label || 'Timetable'
      );
      toast('success', 'PDF downloaded!');
    } catch {
      toast('error', 'PDF export failed');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = () => {
    if (!entries.length || !selected) return;
    exportTimetableExcel(entries, selected.label || 'timetable');
    toast('success', 'Excel file downloaded!');
  };

  const exportIcal = () => {
    if (!entries.length) return;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ITMS//EN'];
    entries.forEach(e => {
      lines.push('BEGIN:VEVENT');
      lines.push(`SUMMARY:${e.subject.name} (${e.section.name})`);
      lines.push(`DESCRIPTION:Faculty: ${e.faculty.name}\\nRoom: ${e.room.name}`);
      lines.push(`DTSTART:20240101T${e.timeSlot.startTime.replace(':', '')}00`);
      lines.push(`DTEND:20240101T${e.timeSlot.endTime.replace(':', '')}00`);
      lines.push('RRULE:FREQ=WEEKLY;BYDAY=' + e.timeSlot.dayOfWeek.slice(0, 2).toUpperCase());
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${selected?.label || 'timetable'}.ics`; a.click();
    toast('success', 'iCal file downloaded');
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Timetable Manager</h1><p className="page-subtitle">Generate, view, and publish timetables</p></div>
        <button className="btn btn-primary" onClick={() => setGenerateModal(true)}><Sparkles size={16} /> Generate Timetable</button>
      </div>

      <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>
        {/* Version list */}
        <div className="card" style={{ width: '300px', flexShrink: 0 }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.875rem' }}>Versions</div>
          <div style={{ padding: '0.5rem' }}>
            {versionsLoading ? <div className="p-4 text-muted text-sm">Loading...</div> : versions.length === 0 ? (
              <div className="p-4 text-muted text-sm text-center">No timetables yet. Generate one!</div>
            ) : versions.map(v => (
              <div key={v.id} className={`version-card mb-2 ${selected?.id === v.id ? 'selected' : ''}`} onClick={() => selectVersion(v)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-medium truncate text-sm">{v.label || 'Untitled'}</div>
                  <div className="text-xs text-muted">{v._count.entries} entries · {new Date(v.generatedAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Main viewer */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selected ? (
            <div className="card empty-state" style={{ padding: '4rem' }}>
              <Calendar size={48} /><h3>Select a version</h3><p>Pick a timetable version from the left panel.</p>
            </div>
          ) : (
            <div>
              {/* Conflict banner */}
              {conflicts && conflicts.totalConflicts > 0 && (
                <div className="alert-banner alert-warning">
                  <AlertTriangle size={16} />
                  <span><strong>{conflicts.totalConflicts} unresolved conflict{conflicts.totalConflicts !== 1 ? 's' : ''}</strong> — some slots could not be assigned.</span>
                  <Link to={`/admin/timetable/${selected.id}/conflicts`} className="flex items-center gap-1" style={{ marginLeft: 'auto', fontWeight: 600 }}>View details <ChevronRight size={14} /></Link>
                </div>
              )}
              {conflicts && conflicts.totalConflicts === 0 && (
                <div className="alert-banner alert-success"><CheckCircle size={16} /><span>No conflicts — all slots assigned successfully.</span></div>
              )}

              {/* Header with actions */}
              <div className="card p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{selected.label || 'Untitled'}</h2>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div className="text-sm text-muted mt-1">{selected.academicYear} · Sem {selected.semester} · {entries.length} entries</div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn btn-outline btn-sm" onClick={exportIcal}><Calendar size={14} /> iCal</button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportExcel}><Sheet size={14} /> Excel</button>
                    <button className="btn btn-outline btn-sm" onClick={handleExportPdf} disabled={exportingPdf}><FileDown size={14} /> {exportingPdf ? 'Exporting...' : 'PDF'}</button>
                    {selected.status === 'DRAFT' && <>
                      <button className="btn btn-success btn-sm" onClick={() => setConfirmAction('publish')}><CheckCircle size={14} /> Publish</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction('delete')} style={{ color: 'var(--danger)' }}><Trash2 size={14} /> Delete</button>
                    </>}
                    {selected.status === 'PUBLISHED' && <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction('archive')}><Archive size={14} /> Archive</button>}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mt-4 flex-wrap">
                  <select className="form-select" style={{ maxWidth: '200px' }} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                    <option value="">All Sections</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="form-select" style={{ maxWidth: '200px' }} value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
                    <option value="">All Faculty</option>
                    {faculty.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {(filterSection || filterFaculty) && <button className="btn btn-ghost btn-sm" onClick={() => { setFilterSection(''); setFilterFaculty(''); }}>Clear filters</button>}
                </div>
              </div>

              {loading ? (
                <div className="card empty-state p-8"><p>Loading timetable...</p></div>
              ) : (
                <div id="timetable-export-area" className="card p-4">
                  <TimetableGrid entries={entries} filterFacultyId={filterFaculty || undefined} filterSectionId={filterSection || undefined} showSection={!filterSection} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate modal */}
      <Modal open={generateModal} onClose={() => setGenerateModal(false)} title="Generate New Timetable"
        footer={<><button className="btn btn-outline" onClick={() => setGenerateModal(false)}>Cancel</button><button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button></>}>
        <div className="form-group"><label className="form-label">Version Label</label><input className="form-input" value={genForm.label} onChange={e => setGenForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Sem 1 – Main Draft" /></div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Academic Year <span className="required">*</span></label><input className="form-input" value={genForm.academicYear} onChange={e => setGenForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="2024-2025" /></div>
          <div className="form-group flex-1"><label className="form-label">Semester</label>
            <select className="form-select" value={genForm.semester} onChange={e => setGenForm(p => ({ ...p, semester: parseInt(e.target.value) }))}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>
        <div className="alert-banner alert-info mt-2" style={{ marginBottom: 0 }}>
          <AlertTriangle size={14} /><span>Ensure all faculty assignments are set and time slots are seeded before generating.</span>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={doAction} loading={actionLoading}
        title={confirmAction === 'publish' ? 'Publish Timetable' : confirmAction === 'archive' ? 'Archive Timetable' : 'Delete Version'}
        message={confirmAction === 'publish' ? 'Publish this timetable? It will become visible to faculty and students.' : confirmAction === 'archive' ? 'Archive this timetable? It will no longer be the active schedule.' : 'Permanently delete this draft version? This cannot be undone.'}
        confirmLabel={confirmAction === 'publish' ? 'Publish' : confirmAction === 'archive' ? 'Archive' : 'Delete'}
        danger={confirmAction === 'delete'}
      />
    </div>
  );
};

export default TimetableViewer;
