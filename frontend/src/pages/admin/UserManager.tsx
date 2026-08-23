import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserCircle2, Link2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

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

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Create and manage faculty & student accounts</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20, sectionId: '' }); setModalOpen(true); }}><Plus size={16} /> Create Account</button>
      </div>

      <div className="card">
        <div className="p-4 filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrapper flex-1"><Search size={15} /><input className="form-input search-input" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="empty-state"><p>Loading...</p></div> : filtered.length === 0 ? (
            <div className="empty-state"><UserCircle2 size={40} /><h3>No accounts yet</h3><p>Create faculty and student accounts.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name / Email</th><th>Role</th><th>Section / Load</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium">{u.facultyProfile?.name || u.email.split('@')[0]}</div>
                      <div className="text-sm text-muted">{u.email}</div>
                    </td>
                    <td><span className={`badge ${u.role === 'FACULTY' ? 'badge-faculty' : 'badge-student'}`}>{u.role}</span></td>
                    <td>
                      {u.role === 'STUDENT' ? (
                        u.section ? (
                          <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>{u.section.name}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No section</span>
                        )
                      ) : (
                        u.facultyProfile ? `${u.facultyProfile.maxWeeklyLoad} hrs` : '—'
                      )}
                    </td>
                    <td>{u.facultyProfile ? <span className={`badge ${u.facultyProfile.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.facultyProfile.isActive ? 'Active' : 'Inactive'}</span> : <span className="badge badge-active">Active</span>}</td>
                    <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role === 'STUDENT' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Assign section"
                          onClick={() => { setSectionModalUser(u); setLinkSectionId(u.sectionId || ''); }}
                        >
                          <Link2 size={14} /> {u.sectionId ? 'Change' : 'Link'} Section
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Account"
        footer={<><button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button></>}>
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

      {/* Link Section Modal */}
      <Modal open={!!sectionModalUser} onClose={() => setSectionModalUser(null)} title={`Link Section — ${sectionModalUser?.email}`}
        footer={<><button className="btn btn-outline" onClick={() => setSectionModalUser(null)}>Cancel</button><button className="btn btn-primary" onClick={handleLinkSection} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-group">
          <label className="form-label">Assign to Section</label>
          <select className="form-select" value={linkSectionId} onChange={e => setLinkSectionId(e.target.value)}>
            <option value="">— Remove section link —</option>
            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>)}
          </select>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            The student's timetable will auto-load for their linked section after next login.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default UserManager;
