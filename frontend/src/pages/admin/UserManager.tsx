import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserCircle2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { DataTable, DataTableRow } from '../../components/DataTable';
import { useToast } from '../../components/Toast';

const GRID = '1.6fr .8fr .8fr .8fr 1fr';

interface UserEntry {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  facultyProfile: { id: string; name: string; isActive: boolean; maxWeeklyLoad: number } | null;
}

const UserManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20 });

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await api.get('/auth/users')); } catch { toast('error', 'Failed to load users'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.email || !form.password) return toast('warning', 'Email and password required');
    if (form.role === 'FACULTY' && !form.name) return toast('warning', 'Name is required for faculty');
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      toast('success', `${form.role === 'FACULTY' ? 'Faculty' : 'Student'} account created`);
      setModalOpen(false); load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const f = (field: keyof typeof form, val: any) => setForm(p => ({ ...p, [field]: val }));
  const filtered = list.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.facultyProfile?.name.toLowerCase().includes(search.toLowerCase()));
  const studentLogins = list.filter(u => u.role === 'STUDENT').length;

  return (
    <div>
      <PageHeader
        eyebrow="SYSTEM"
        title="Users"
        description="Faculty and student accounts, roles and access."
        count={list.length}
        countLabel="ACCOUNTS"
        action={<button className="btn btn-primary" onClick={() => { setForm({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20 }); setModalOpen(true); }}><Plus size={16} /> Create account</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or name"
        columns={['NAME / EMAIL', 'ROLE', 'MAX LOAD', 'STATUS', 'CREATED']}
        gridTemplate={GRID}
        rightAlignLast={false}
        loading={loading}
        empty={filtered.length === 0}
        emptyTitle="No accounts yet"
        emptyDescription="Create faculty and student accounts."
        emptyAction={<button className="btn btn-primary" onClick={() => setModalOpen(true)}><UserCircle2 size={16} /> Create account</button>}
        summary={`${list.length} ACCOUNT${list.length === 1 ? '' : 'S'} · ${studentLogins} STUDENT LOGIN${studentLogins === 1 ? '' : 'S'}`}
      >
        {filtered.map(u => (
          <DataTableRow key={u.id} gridTemplate={GRID}>
            <div className="dt-cell-stack">
              <div className="dt-cell-name">{u.facultyProfile?.name || '—'}</div>
              <div className="dt-cell-mono">{u.email}</div>
            </div>
            <StatusPill tone={u.role === 'FACULTY' ? 'crimson' : 'neutral'}>{u.role}</StatusPill>
            <span className="dt-cell-mono">{u.facultyProfile ? `${u.facultyProfile.maxWeeklyLoad} hrs` : '—'}</span>
            <StatusPill tone="neutral">{u.facultyProfile ? (u.facultyProfile.isActive ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE'}</StatusPill>
            <span className="dt-cell-mono">{new Date(u.createdAt).toLocaleDateString()}</span>
          </DataTableRow>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow="SYSTEM" title="Create Account"
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? 'Creating…' : 'Create account'}</button></>}>
        <div className="form-group"><label className="form-label">Role</label>
          <select className="form-select" value={form.role} onChange={e => f('role', e.target.value)}>
            <option value="FACULTY">Faculty</option><option value="STUDENT">Student</option>
          </select>
        </div>
        {form.role === 'FACULTY' && (
          <div className="form-group"><label className="form-label">Full Name <span className="required">*</span></label>
            <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
        )}
        <div className="form-group"><label className="form-label">Email <span className="required">*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="user@dept.edu" />
        </div>
        <div className="form-group"><label className="form-label">Password <span className="required">*</span></label>
          <input className="form-input" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="Temporary password" />
        </div>
        {form.role === 'FACULTY' && (
          <div className="form-group"><label className="form-label">Max Weekly Load (hours)</label>
            <input className="form-input" type="number" min={1} max={40} value={form.maxWeeklyLoad} onChange={e => f('maxWeeklyLoad', parseInt(e.target.value) || 20)} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManager;
