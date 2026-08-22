import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserCircle2 } from 'lucide-react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';

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

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Create and manage faculty & student accounts</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ email: '', password: '', role: 'FACULTY', name: '', maxWeeklyLoad: 20 }); setModalOpen(true); }}><Plus size={16} /> Create Account</button>
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
              <thead><tr><th>Name / Email</th><th>Role</th><th>Max Load</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium">{u.facultyProfile?.name || '—'}</div>
                      <div className="text-sm text-muted">{u.email}</div>
                    </td>
                    <td><span className={`badge ${u.role === 'FACULTY' ? 'badge-faculty' : 'badge-student'}`}>{u.role}</span></td>
                    <td>{u.facultyProfile ? `${u.facultyProfile.maxWeeklyLoad} hrs` : '—'}</td>
                    <td>{u.facultyProfile ? <span className={`badge ${u.facultyProfile.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.facultyProfile.isActive ? 'Active' : 'Inactive'}</span> : <span className="badge badge-active">Active</span>}</td>
                    <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
