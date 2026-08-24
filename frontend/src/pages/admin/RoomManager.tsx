import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { DataTable, DataTableRow } from '../../components/DataTable';
import { useToast } from '../../components/Toast';

const GRID = '1fr 1fr 1fr .8fr 90px';

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
  const totalCapacity = list.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const isBottleneck = list.length === 1;

  return (
    <div>
      <PageHeader
        eyebrow="DATA · 04"
        title="Rooms"
        description="Classrooms and labs, with capacity."
        count={list.length}
        countLabel="RECORDS"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add room</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rooms"
        columns={['ROOM', 'TYPE', 'CAPACITY', 'STATUS', 'ACTIONS']}
        gridTemplate={GRID}
        loading={loading}
        empty={filtered.length === 0}
        emptyTitle="No rooms found"
        emptyDescription="Add rooms to enable scheduling."
        emptyAction={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add room</button>}
        summary={`${list.length} RECORD${list.length === 1 ? '' : 'S'} · TOTAL CAPACITY ${totalCapacity} SEATS`}
        advisory={isBottleneck && (
          <div className="dt-advisory-row">
            <div className="dt-advisory">One room for the current weekly load is the likely bottleneck if timetable generation fails for lack of room availability. Adding a second room resolves it.</div>
            <button className="btn btn-primary" onClick={openCreate}>Add room</button>
          </div>
        )}
      >
        {filtered.map(r => (
          <DataTableRow key={r.id} gridTemplate={GRID}>
            <span className="dt-cell-name">{r.name}</span>
            <StatusPill tone="crimson">{r.type.toUpperCase()}</StatusPill>
            <span className="dt-cell-mono">{r.capacity}</span>
            <StatusPill tone="neutral">{r.isActive ? 'ACTIVE' : 'INACTIVE'}</StatusPill>
            <div className="dt-actions">
              <span className="dt-edit" onClick={() => openEdit(r)}>Edit</span>
              <span className="dt-delete" onClick={() => setDeleteId(r.id)}>Delete</span>
            </div>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="DATA · 04" title={editItem ? 'Edit Room' : 'Add Room'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? (editItem ? 'Saving…' : 'Creating…') : editItem ? 'Save changes' : 'Create room'}</button></>}>
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
