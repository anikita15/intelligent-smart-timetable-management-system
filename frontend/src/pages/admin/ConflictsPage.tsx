import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';

interface ConflictItem {
  type: string;
  severity: 'HIGH' | 'MEDIUM';
  faculty: { id: string; name: string };
  subject: { id: string; name: string };
  section: { id: string; name: string };
  required: number;
  assigned: number;
  missing: number;
}

interface ConflictData {
  versionId: string;
  label: string | null;
  totalEntries: number;
  totalConflicts: number;
  conflicts: ConflictItem[];
}

const ConflictsPage: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<ConflictData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.get(`/timetable/versions/${versionId}/conflicts`)); }
    catch { toast('error', 'Failed to load conflict data'); } finally { setLoading(false); }
  }, [versionId]);
  useEffect(() => { load(); }, [load]);

  // Group by section
  const bySectionMap = data?.conflicts.reduce((acc: Record<string, ConflictItem[]>, c) => {
    const key = c.section.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {}) || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/admin/timetable" className="flex items-center gap-2 text-sm text-muted mb-2" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Timetable Manager
          </Link>
          <h1 className="page-title">Conflict Report</h1>
          {data && <p className="page-subtitle">{data.label || 'Untitled'} · {data.totalEntries} entries assigned</p>}
        </div>
      </div>

      {loading ? (
        <div className="empty-state card p-8"><p>Loading...</p></div>
      ) : !data ? (
        <div className="empty-state card p-8"><p>No data found</p></div>
      ) : data.totalConflicts === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Conflicts!</h2>
          <p className="text-muted">All faculty-subject-section assignments were successfully scheduled.</p>
          <Link to="/admin/timetable" className="btn btn-primary mt-4" style={{ display: 'inline-flex' }}>View Timetable</Link>
        </div>
      ) : (
        <>
          <div className="stats-grid mb-4">
            <div className="stat-card">
              <div className="stat-card-label">Total Conflicts</div>
              <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{data.totalConflicts}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Assigned Entries</div>
              <div className="stat-card-value" style={{ color: 'var(--success)' }}>{data.totalEntries}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Sections Affected</div>
              <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{Object.keys(bySectionMap).length}</div>
            </div>
          </div>

          <div className="alert-banner alert-warning mb-4">
            <AlertTriangle size={16} />
            <span>The following classes could not be scheduled, likely due to insufficient available rooms or faculty conflicts at all time slots.</span>
          </div>

          {Object.entries(bySectionMap).map(([sectionName, items]) => (
            <div key={sectionName} className="card mb-4">
              <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="font-semibold" style={{ fontSize: '0.9rem' }}>Section: {sectionName}</h3>
              </div>
              <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, i) => (
                  <div key={i} className={`conflict-item ${item.severity.toLowerCase()}`}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-semibold" style={{ fontSize: '0.875rem' }}>{item.subject.name}</div>
                        <div className="text-sm text-muted">Faculty: {item.faculty.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted">Required</div>
                          <div className="font-bold">{item.required}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted">Assigned</div>
                          <div className="font-bold" style={{ color: 'var(--success)' }}>{item.assigned}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted">Missing</div>
                          <div className="font-bold" style={{ color: 'var(--danger)' }}>{item.missing}</div>
                        </div>
                        <span className={`badge badge-${item.severity.toLowerCase()}`}>{item.severity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="card p-4 mt-4" style={{ background: 'var(--surface-2)' }}>
            <h3 className="font-semibold mb-2" style={{ fontSize: '0.875rem' }}>How to resolve conflicts</h3>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <li>Add more rooms (especially labs if lab conflicts exist)</li>
              <li>Reduce the weekly lecture/lab count for conflicting subjects</li>
              <li>Check if faculty members have too many assignments</li>
              <li>Review faculty slot preferences to avoid over-constrained schedules</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ConflictsPage;
