import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

interface Subject { id: string; name: string; type: string; weeklyLectures: number; weeklyLabs: number; semester: number; isCore: boolean; }

const defaultForm = { name: '', type: 'Theory', weeklyLectures: 3, weeklyLabs: 0, semester: 1, isCore: false };

const SubjectManager: React.FC = () => {
  const { toast } = useToast();
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

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Subjects</h1><p className="page-subtitle">Manage course subjects</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Subject</button>
      </div>

      <div className="card">
        <div className="p-4 filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper flex-1"><Search size={15} />
            <input className="form-input search-input" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : filtered.length === 0 ? (
            <div className="empty-state"><h3>No subjects found</h3><p>Add subjects to continue.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th>Lectures/wk</th><th>Labs/wk</th><th>Semester</th><th>Core</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td><span className="badge" style={{ background: s.type === 'Lab' ? 'var(--info-light)' : s.type === 'Both' ? 'var(--warning-light)' : 'var(--primary-light)', color: s.type === 'Lab' ? '#1d4ed8' : s.type === 'Both' ? '#92400e' : 'var(--primary)' }}>{s.type}</span></td>
                    <td>{s.weeklyLectures}</td>
                    <td>{s.weeklyLabs}</td>
                    <td>Sem {s.semester}</td>
                    <td>{s.isCore ? '✅' : '—'}</td>
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(s.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Subject' : 'Add Subject'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Create'}</button></>}>
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
        <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
          <input type="checkbox" id="isCore" checked={form.isCore} onChange={e => f('isCore', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
          <label htmlFor="isCore" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Core subject</label>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Subject" message="Delete this subject? All related assignments will also be removed." confirmLabel="Delete" danger loading={saving} />
    </div>
  );
};

export default SubjectManager;
