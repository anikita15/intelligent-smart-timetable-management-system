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
  const totalSeats = list.reduce((sum, s) => sum + (s.strength || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="DATA · 03"
        title="Sections"
        description="Student groups by semester and strength."
        count={list.length}
        countLabel="RECORDS"
        action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add section</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sections"
        columns={['NAME', 'SEMESTER', 'STRENGTH', 'STATUS', 'ACTIONS']}
        gridTemplate={GRID}
        loading={loading}
        empty={filtered.length === 0}
        emptyTitle="No sections found"
        emptyDescription="Add sections to continue."
        emptyAction={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add section</button>}
        summary={`${list.length} RECORD${list.length === 1 ? '' : 'S'} · ${totalSeats} SEATS TO PLACE`}
      >
        {filtered.map(s => (
          <DataTableRow key={s.id} gridTemplate={GRID}>
            <span className="dt-cell-name">{s.name}</span>
            <span className="dt-cell-sub">Sem {s.semester}</span>
            <span className="dt-cell-sub">{s.strength} students</span>
            <StatusPill tone="neutral">{s.isActive ? 'ACTIVE' : 'INACTIVE'}</StatusPill>
            <div className="dt-actions">
              <span className="dt-edit" onClick={() => openEdit(s)}>Edit</span>
              <span className="dt-delete" onClick={() => setDeleteId(s.id)}>Delete</span>
            </div>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="DATA · 03" title={editItem ? 'Edit Section' : 'Add Section'}
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? (editItem ? 'Saving…' : 'Creating…') : editItem ? 'Save changes' : 'Create section'}</button></>}>
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
