import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

interface Section { id: string; name: string; semester: number; strength: number; isActive: boolean; }

const SectionManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Section | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', semester: 1, strength: 60 });

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.get('/sections')); } catch { toast('error', 'Failed to load sections'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', semester: 1, strength: 60 }); setModalOpen(true); };
  const openEdit = (s: Section) => { setEditItem(s); setForm({ name: s.name, semester: s.semester, strength: s.strength }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast('warning', 'Name is required');
    setSaving(true);
    try {
      if (editItem) { await api.put(`/sections/${editItem.id}`, form); toast('success', 'Section updated'); }
      else { await api.post('/sections', form); toast('success', 'Section created'); }
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/sections/${deleteId}`); toast('success', 'Section deleted'); setDeleteId(null); load(); }
    catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const filtered = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Sections</h1><p className="page-subtitle">Manage student sections</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Section</button>
      </div>
      <div className="card">
        <div className="p-4 filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper flex-1"><Search size={15} /><input className="form-input search-input" placeholder="Search sections..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : filtered.length === 0 ? (
            <div className="empty-state"><h3>No sections found</h3><p>Add sections to continue.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Semester</th><th>Strength</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>Sem {s.semester}</td>
                    <td>{s.strength} students</td>
                    <td><span className={`badge ${s.isActive ? 'badge-active' : 'badge-inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Section' : 'Add Section'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Section Name <span className="required">*</span></label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. CS-A" /></div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Semester</label><input className="form-input" type="number" min={1} max={8} value={form.semester} onChange={e => setForm(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))} /></div>
          <div className="form-group flex-1"><label className="form-label">Student Strength</label><input className="form-input" type="number" min={1} max={200} value={form.strength} onChange={e => setForm(p => ({ ...p, strength: parseInt(e.target.value) || 60 }))} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Section" message="Delete this section permanently?" confirmLabel="Delete" danger loading={saving} />
    </div>
  );
};

export default SectionManager;
