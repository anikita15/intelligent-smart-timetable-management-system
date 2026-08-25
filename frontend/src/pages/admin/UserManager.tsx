import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UserCircle2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';
import { DataTable, DataTableRow } from '../../components/DataTable';
import { useToast } from '../../components/Toast';

const GRID = '1.6fr .8fr 1fr .8fr .9fr 90px';

interface UserEntry {
  id: string;
  email: string;
  role: string;
  sectionId: string | null;
  section: { id: string; name: string } | null;
  createdAt: string;
  facultyProfile: { id: string; name: string; isActive: boolean; maxWeeklyLoad: number } | null;
}

const UserManager: React.FC = () => {
  const { toast } = useToast();
  const [list, setList] = useState<UserEntry[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sectionModalUser, setSectionModalUser] = useState<UserEntry | null>(null);
  const [linkSectionId, setLinkSectionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20, sectionId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [users, secs] = await Promise.all([api.get('/auth/users'), api.get('/sections')]);
      setList(users);
      setSections(secs.filter((s: any) => s.isActive));
    } catch { toast('error', 'Failed to load users'); } finally { setLoading(false); }
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

  const handleLinkSection = async () => {
    if (!sectionModalUser) return;
    setSaving(true);
    try {
      await api.patch(`/auth/users/${sectionModalUser.id}/section`, { sectionId: linkSectionId || null });
      toast('success', linkSectionId ? 'Section linked successfully' : 'Section link removed');
      setSectionModalUser(null);
      load();
    } catch (e: any) { toast('error', e.message); } finally { setSaving(false); }
  };

  const f = (field: keyof typeof form, val: any) => setForm(p => ({ ...p, [field]: val }));
  const filtered = list.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.facultyProfile?.name || '').toLowerCase().includes(search.toLowerCase())
  );
  const studentLogins = list.filter(u => u.role === 'STUDENT').length;

  return (
    <div>
      <PageHeader
        eyebrow="SYSTEM"
        title="Users"
        description="Faculty and student accounts, roles and access."
        count={list.length}
        countLabel="ACCOUNTS"
        action={<button className="btn btn-primary" onClick={() => { setForm({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20, sectionId: '' }); setModalOpen(true); }}><Plus size={16} /> Create account</button>}
      />

      <DataTable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by email or name"
        columns={['NAME / EMAIL', 'ROLE', 'SECTION / LOAD', 'STATUS', 'CREATED', 'ACTIONS']}
        gridTemplate={GRID}
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
              <div className="dt-cell-name">{u.facultyProfile?.name || u.email.split('@')[0]}</div>
              <div className="dt-cell-mono">{u.email}</div>
            </div>
            <StatusPill tone={u.role === 'FACULTY' ? 'crimson' : 'neutral'}>{u.role}</StatusPill>
            {u.role === 'STUDENT' ? (
              u.section ? <StatusPill tone="neutral">{u.section.name}</StatusPill> : <span style={{ color: 'rgba(26,16,16,.4)', fontSize: 12 }}>No section</span>
            ) : (
              <span className="dt-cell-mono">{u.facultyProfile ? `${u.facultyProfile.maxWeeklyLoad} hrs` : '—'}</span>
            )}
            <StatusPill tone="neutral">{u.facultyProfile ? (u.facultyProfile.isActive ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE'}</StatusPill>
            <span className="dt-cell-mono">{new Date(u.createdAt).toLocaleDateString()}</span>
            <div className="dt-actions">
              {u.role === 'STUDENT' && (
                <span className="dt-edit" onClick={() => { setSectionModalUser(u); setLinkSectionId(u.sectionId || ''); }}>
                  {u.sectionId ? 'Change' : 'Link'}
                </span>
              )}
            </div>
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
        {form.role === 'STUDENT' && (
          <div className="form-group"><label className="form-label">Section (optional)</label>
            <select className="form-select" value={form.sectionId} onChange={e => f('sectionId', e.target.value)}>
              <option value="">— No section assigned —</option>
              {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
            </select>
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

      <Modal open={!!sectionModalUser} onClose={() => setSectionModalUser(null)} eyebrow="SYSTEM" title={`Link Section — ${sectionModalUser?.email}`}
        footer={<><button className="btn btn-outline" onClick={() => setSectionModalUser(null)}>Cancel</button><button className="btn btn-primary" onClick={handleLinkSection} disabled={saving} style={saving ? { opacity: 0.6 } : undefined}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="form-group">
          <label className="form-label">Assign to Section</label>
          <select className="form-select" value={linkSectionId} onChange={e => setLinkSectionId(e.target.value)}>
            <option value="">— Remove section link —</option>
            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
          <p style={{ fontSize: '0.8rem', color: 'rgba(26,16,16,.5)', marginTop: '0.5rem' }}>
            The student's timetable will auto-load for their linked section after next login.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UserManager;
