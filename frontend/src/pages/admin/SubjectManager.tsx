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

const GRID = '1.2fr .8fr .8fr .8fr .8fr .6fr 90px';

interface Subject { id: string; name: string; type: string; weeklyLectures: number; weeklyLabs: number; semester: number; isCore: boolean; }

const defaultForm = { name: '', type: 'Theory', weeklyLectures: 3, weeklyLabs: 0, semester: 1, isCore: false };

const SubjectManager: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.get('/subjects')); } catch { toast('error', 'Failed to load subjects'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (s: Subject) => { setEditItem(s); setForm({ name: s.name, type: s.type, weeklyLectures: s.weeklyLectures, weeklyLabs: s.weeklyLabs, semester: s.semester, isCore: s.isCore }); setModalOpen(true); };

  useEffect(() => {
    if ((location.state as any)?.dockAction === 'openCreate') {
      openCreate();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleSave = async () => {
    if (!form.name) return toast('warning', 'Name is required');
    setSaving(true);
    try {
      if (editItem) { await api.put(`/subjects/${editItem.id}`, form); toast('success', 'Subject updated'); }
      else { await api.post('/subjects', form); toast('success', 'Subject created'); }
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/subjects/${deleteId}`); toast('success', 'Subject deleted'); setDeleteId(null); load(); }
    catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const f = (field: keyof typeof form, val: any) => setForm(p => ({ ...p, [field]: val }));
  const filtered = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalSessions = list.reduce((sum, s) => sum + (s.weeklyLectures || 0) + (s.weeklyLabs || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="DATA · 02"
        title="Subjects"
        description="Course codes, weekly lectures and labs, core flag."
        count={list.length}
        countLabel="RECORDS"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add subject</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search subjects"
        columns={['NAME', 'TYPE', 'LECTURES/WK', 'LABS/WK', 'SEMESTER', 'CORE', 'ACTIONS']}
        gridTemplate={GRID}
        loading={loading}
        empty={filtered.length === 0}
        emptyTitle="No subjects found"
        emptyDescription="Add subjects to continue."
        emptyAction={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add subject</button>}
        summary={`${list.length} RECORD${list.length === 1 ? '' : 'S'} · ${totalSessions} SESSIONS REQUIRED PER WEEK`}
      >
        {filtered.map(s => (
          <DataTableRow key={s.id} gridTemplate={GRID}>
            <span className="dt-cell-name">{s.name}</span>
            <StatusPill tone="crimson">{s.type.toUpperCase()}</StatusPill>
            <span className="dt-cell-mono">{s.weeklyLectures}</span>
            <span className="dt-cell-mono" style={{ color: 'rgba(26,16,16,.4)' }}>{s.weeklyLabs}</span>
            <span className="dt-cell-sub">Sem {s.semester}</span>
            <span style={s.isCore ? { color: 'var(--crimson)', fontWeight: 500, fontSize: 12 } : { color: 'rgba(26,16,16,.35)' }}>{s.isCore ? 'Yes' : '—'}</span>
            <div className="dt-actions">
              <span className="dt-edit" onClick={() => openEdit(s)}>Edit</span>
              <span className="dt-delete" onClick={() => setDeleteId(s.id)}>Delete</span>
            </div>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="DATA · 02" title={editItem ? 'Edit Subject' : 'Add Subject'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? (editItem ? 'Saving…' : 'Creating…') : editItem ? 'Save changes' : 'Create subject'}</button></>}>
        <div className="form-group"><label className="form-label">Name <span className="required">*</span></label><input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Mathematics" /></div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => f('type', e.target.value)}>
              <option>Theory</option><option>Lab</option><option>Both</option>
            </select>
          </div>
          <div className="form-group flex-1"><label className="form-label">Semester</label>
            <input className="form-input" type="number" min={1} max={8} value={form.semester} onChange={e => f('semester', parseInt(e.target.value) || 1)} />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Weekly Lectures</label><input className="form-input" type="number" min={0} value={form.weeklyLectures} onChange={e => f('weeklyLectures', parseInt(e.target.value) || 0)} /></div>
          <div className="form-group flex-1"><label className="form-label">Weekly Labs</label><input className="form-input" type="number" min={0} value={form.weeklyLabs} onChange={e => f('weeklyLabs', parseInt(e.target.value) || 0)} /></div>
        </div>
        <div className="check-strip">
          <input type="checkbox" className="check-box" id="isCore" checked={form.isCore} onChange={e => f('isCore', e.target.checked)} />
          <label htmlFor="isCore">Core subject</label>
          <span className="check-helper">Cannot be dropped by a section</span>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Subject" message="Delete this subject? All related assignments will also be removed." confirmLabel="Delete" danger loading={saving} />
    </div>
  );
};

export default SubjectManager;
