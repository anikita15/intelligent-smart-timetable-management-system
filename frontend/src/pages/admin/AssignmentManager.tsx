import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { DataTable, DataTableRow } from '../../components/DataTable';
import { useToast } from '../../components/Toast';

const GRID = '1fr 1.4fr .8fr 1fr .8fr 90px';

interface Assignment {
  id: string;
  facultyId: string;
  subjectId: string;
  sectionId: string;
  academicYear: string;
  semester: number;
  faculty: { name: string };
  subject: { name: string; type: string };
  section: { name: string };
}

const emptyForm = () => ({ facultyId: '', subjectId: '', sectionId: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), semester: 1 });

const AssignmentManager: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState<Assignment[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openCreate = () => { setForm(emptyForm()); setModalOpen(true); };

  useEffect(() => {
    if ((location.state as any)?.dockAction === 'openCreate') {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, f, s, sec] = await Promise.all([
        api.get('/assignments'),
        api.get('/faculty'),
        api.get('/subjects'),
        api.get('/sections'),
      ]);
      setList(a); setFaculty(f); setSubjects(s); setSections(sec);
    } catch { toast('error', 'Failed to load data'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.facultyId || !form.subjectId || !form.sectionId) return toast('warning', 'All fields are required');
    setSaving(true);
    try {
      await api.post('/assignments', form);
      toast('success', 'Assignment created');
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/assignments/${deleteId}`); toast('success', 'Assignment removed'); setDeleteId(null); load(); }
    catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const f = (field: keyof typeof form, val: any) => setForm(p => ({ ...p, [field]: val }));

  const loadByFaculty = new Map<string, number>();
  list.forEach(a => {
    const subj = subjects.find((s: any) => s.id === a.subjectId);
    const sessions = subj ? (subj.weeklyLectures || 0) + (subj.weeklyLabs || 0) : 1;
    loadByFaculty.set(a.facultyId, (loadByFaculty.get(a.facultyId) || 0) + sessions);
  });
  let busiest: { name: string; load: number; max: number } | null = null;
  loadByFaculty.forEach((load, facultyId) => {
    const fac = faculty.find((fc: any) => fc.id === facultyId);
    if (fac && (!busiest || load > busiest.load)) busiest = { name: fac.name, load, max: fac.maxWeeklyLoad };
  });
  const recordLabel = `${list.length} RECORD${list.length === 1 ? '' : 'S'}`;
  const summaryText = busiest ? `${recordLabel} · ${(busiest as { name: string }).name.toUpperCase()} AT ${(busiest as { load: number }).load} / ${(busiest as { max: number }).max} HRS` : recordLabel;

  return (
    <div>
      <PageHeader
        eyebrow="DATA · 05"
        title="Assignments"
        description="Faculty × subject × section for the term."
        count={list.length}
        countLabel="RECORDS"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add assignment</button>}
      />

      <DataTable
        columns={['FACULTY', 'SUBJECT', 'SECTION', 'ACADEMIC YEAR', 'SEMESTER', 'ACTIONS']}
        gridTemplate={GRID}
        loading={loading}
        empty={list.length === 0}
        emptyTitle="No assignments"
        emptyDescription="Assign faculty to subjects and sections to enable timetable generation."
        emptyAction={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add assignment</button>}
        summary={summaryText}
      >
        {list.map(a => (
          <DataTableRow key={a.id} gridTemplate={GRID}>
            <span className="dt-cell-name">{a.faculty?.name}</span>
            <div className="flex items-center gap-2">
              <span className="dt-cell-sub">{a.subject?.name}</span>
              <StatusPill tone="crimson">{a.subject?.type?.toUpperCase()}</StatusPill>
            </div>
            <span className="dt-cell-sub">{a.section?.name}</span>
            <span className="dt-cell-mono">{a.academicYear}</span>
            <span className="dt-cell-sub">Sem {a.semester}</span>
            <div className="dt-actions">
              <span className="dt-delete" onClick={() => setDeleteId(a.id)}>Delete</span>
            </div>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="DATA · 05" title="Add Assignment"
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? 'Creating…' : 'Create assignment'}</button></>}>
        <div className="form-group"><label className="form-label">Faculty <span className="required">*</span></label>
          <select className="form-select" value={form.facultyId} onChange={e => f('facultyId', e.target.value)}>
            <option value="">— Select Faculty —</option>
            {faculty.map((fac: any) => <option key={fac.id} value={fac.id}>{fac.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Subject <span className="required">*</span></label>
          <select className="form-select" value={form.subjectId} onChange={e => f('subjectId', e.target.value)}>
            <option value="">— Select Subject —</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Section <span className="required">*</span></label>
          <select className="form-select" value={form.sectionId} onChange={e => f('sectionId', e.target.value)}>
            <option value="">— Select Section —</option>
            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Academic Year</label><input className="form-input" value={form.academicYear} onChange={e => f('academicYear', e.target.value)} placeholder="2024-2025" /></div>
          <div className="form-group flex-1"><label className="form-label">Semester</label>
            <select className="form-select" value={form.semester} onChange={e => f('semester', parseInt(e.target.value))}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Remove Assignment" message="Remove this faculty-subject-section assignment?" confirmLabel="Remove" danger loading={saving} />
    </div>
  );
};

export default AssignmentManager;
