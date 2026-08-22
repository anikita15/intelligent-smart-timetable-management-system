import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

interface Faculty { id: string; name: string; maxWeeklyLoad: number; isActive: boolean; user: { email: string }; }

const FacultyManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Faculty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', maxWeeklyLoad: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.get('/faculty')); } catch { toast('error', 'Failed to load faculty'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', email: '', password: '', maxWeeklyLoad: 20 }); setModalOpen(true); };
  const openEdit = (f: Faculty) => { setEditItem(f); setForm({ name: f.name, email: f.user?.email || '', password: '', maxWeeklyLoad: f.maxWeeklyLoad }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast('warning', 'Name is required');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/faculty/${editItem.id}`, { name: form.name, maxWeeklyLoad: form.maxWeeklyLoad });
        toast('success', 'Faculty updated');
      } else {
        if (!form.email || !form.password) return toast('warning', 'Email and password are required');
        await api.post('/auth/register', { email: form.email, password: form.password, role: 'FACULTY', name: form.name, maxWeeklyLoad: form.maxWeeklyLoad });
        toast('success', 'Faculty account created');
      }
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/faculty/${deleteId}`); toast('success', 'Faculty removed'); setDeleteId(null); load(); }
    catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const filtered = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty</h1>
          <p className="page-subtitle">Manage faculty accounts and workloads</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Faculty</button>
      </div>

      <div className="card">
        <div className="p-4 filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper flex-1">
            <Search size={15} />
            <input className="form-input search-input" placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : filtered.length === 0 ? (
            <div className="empty-state"><h3>No faculty found</h3><p>Add faculty members to get started.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Max Weekly Load</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium">{f.name}</td>
                    <td className="text-muted text-sm">{f.user?.email}</td>
                    <td>{f.maxWeeklyLoad} hrs/week</td>
                    <td><span className={`badge ${f.isActive ? 'badge-active' : 'badge-inactive'}`}>{f.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(f)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(f.id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Faculty' : 'Add Faculty'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Name <span className="required">*</span></label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Jane Smith" /></div>
        {!editItem && <>
          <div className="form-group"><label className="form-label">Email <span className="required">*</span></label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@dept.edu" /></div>
          <div className="form-group"><label className="form-label">Password <span className="required">*</span></label><input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Initial password" /></div>
        </>}
        <div className="form-group"><label className="form-label">Max Weekly Load (hours)</label><input className="form-input" type="number" min={1} max={40} value={form.maxWeeklyLoad} onChange={e => setForm(p => ({ ...p, maxWeeklyLoad: parseInt(e.target.value) || 20 })) } /></div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Faculty" message="This will permanently delete this faculty member and all associated records. This action cannot be undone." confirmLabel="Delete" danger loading={saving} />
    </div>
  );
};

export default FacultyManager;
