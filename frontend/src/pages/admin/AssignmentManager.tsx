import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

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

const AssignmentManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Assignment[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ facultyId: '', subjectId: '', sectionId: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), semester: 1 });

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

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Assignments</h1><p className="page-subtitle">Link faculty to subjects and sections</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ facultyId: '', subjectId: '', sectionId: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), semester: 1 }); setModalOpen(true); }}><Plus size={16} /> Add Assignment</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : list.length === 0 ? (
            <div className="empty-state"><h3>No assignments</h3><p>Assign faculty to subjects and sections to enable timetable generation.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Faculty</th><th>Subject</th><th>Section</th><th>Academic Year</th><th>Semester</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.faculty?.name}</td>
                    <td>{a.subject?.name} <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', marginLeft: '4px' }}>{a.subject?.type}</span></td>
                    <td>{a.section?.name}</td>
                    <td>{a.academicYear}</td>
                    <td>Sem {a.semester}</td>
                    <td><button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(a.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Assignment"
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create'}</button></>}>
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
