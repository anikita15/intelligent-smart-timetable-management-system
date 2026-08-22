import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

interface Room { id: string; name: string; type: string; capacity: number; isActive: boolean; }

const RoomManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Classroom', capacity: 60 });

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.get('/rooms')); } catch { toast('error', 'Failed to load rooms'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', type: 'Classroom', capacity: 60 }); setModalOpen(true); };
  const openEdit = (r: Room) => { setEditItem(r); setForm({ name: r.name, type: r.type, capacity: r.capacity }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast('warning', 'Name is required');
    setSaving(true);
    try {
      if (editItem) { await api.put(`/rooms/${editItem.id}`, form); toast('success', 'Room updated'); }
      else { await api.post('/rooms', form); toast('success', 'Room created'); }
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await api.delete(`/rooms/${deleteId}`); toast('success', 'Room deleted'); setDeleteId(null); load(); }
    catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const filtered = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Rooms</h1><p className="page-subtitle">Manage classrooms and labs</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Room</button>
      </div>
      <div className="card">
        <div className="p-4 filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper flex-1"><Search size={15} /><input className="form-input search-input" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : filtered.length === 0 ? (
            <div className="empty-state"><h3>No rooms found</h3><p>Add rooms to enable scheduling.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Room Name</th><th>Type</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td><span className="badge" style={{ background: r.type === 'Lab' ? 'var(--info-light)' : 'var(--primary-light)', color: r.type === 'Lab' ? '#1d4ed8' : 'var(--primary)' }}>{r.type}</span></td>
                    <td>{r.capacity}</td>
                    <td><span className={`badge ${r.isActive ? 'badge-active' : 'badge-inactive'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="actions">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteId(r.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Room' : 'Add Room'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Room Name <span className="required">*</span></label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room 101" /></div>
        <div className="flex gap-4">
          <div className="form-group flex-1"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option>Classroom</option><option>Lab</option></select></div>
          <div className="form-group flex-1"><label className="form-label">Capacity</label><input className="form-input" type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: parseInt(e.target.value) || 60 }))} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Room" message="Delete this room permanently?" confirmLabel="Delete" danger loading={saving} />
    </div>
  );
};

export default RoomManager;
