import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { DataTable, DataTableRow } from '../../components/DataTable';
import { useToast } from '../../components/Toast';

const GRID = '1fr 1.6fr 1fr .8fr 90px';

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
  const totalCapacity = list.reduce((sum, f) => sum + (f.maxWeeklyLoad || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="DATA · 01"
        title="Faculty"
        description="Accounts, designations and weekly load ceilings."
        count={list.length}
        countLabel="RECORDS"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add faculty</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search faculty"
        searchExtra={<button className="btn btn-outline">Import CSV</button>}
        columns={['NAME', 'EMAIL', 'MAX WEEKLY LOAD', 'STATUS', 'ACTIONS']}
        gridTemplate={GRID}
        loading={loading}
        empty={filtered.length === 0}
        emptyTitle="No faculty found"
        emptyDescription="Add faculty members to get started."
        emptyAction={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add faculty</button>}
        summary={`${list.length} RECORD${list.length === 1 ? '' : 'S'} · TOTAL CAPACITY ${totalCapacity} HRS / WEEK`}
      >
        {filtered.map(f => (
          <DataTableRow key={f.id} gridTemplate={GRID}>
            <span className="dt-cell-name">{f.name}</span>
            <span className="dt-cell-mono">{f.user?.email}</span>
            <span className="dt-cell-sub">{f.maxWeeklyLoad} hrs / week</span>
            <StatusPill tone="neutral">{f.isActive ? 'ACTIVE' : 'INACTIVE'}</StatusPill>
            <div className="dt-actions">
              <span className="dt-edit" onClick={() => openEdit(f)}>Edit</span>
              <span className="dt-delete" onClick={() => setDeleteId(f.id)}>Delete</span>
            </div>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="DATA · 01" title={editItem ? 'Edit Faculty' : 'Add Faculty'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? (editItem ? 'Saving…' : 'Creating…') : editItem ? 'Save changes' : 'Create faculty'}</button></>}>
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
