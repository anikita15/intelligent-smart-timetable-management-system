import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import StatusPill from '../../components/StatusPill';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<ConflictData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.get(`/timetable/versions/${versionId}/conflicts`)); }
    catch { toast('error', 'Failed to load conflict data'); } finally { setLoading(false); }
  }, [versionId]);
  useEffect(() => { load(); }, [load]);

  const bySectionMap = data?.conflicts.reduce((acc: Record<string, ConflictItem[]>, c) => {
    const key = c.section.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {}) || {};

  const sectionsHit = Object.keys(bySectionMap).length;
  const headline = data && data.totalConflicts > 0
    ? `${data.totalConflicts} class${data.totalConflicts === 1 ? '' : 'es'} could not be placed`
    : 'No conflicts to report';

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link to="/admin/timetable" className="breadcrumb-eyebrow" style={{ color: 'inherit' }}>
            <ArrowLeft size={11} /> TIMETABLE · CONFLICT REPORT · {(data?.label || '—').toUpperCase()}
          </Link>
        }
        title={headline}
        description={data && data.totalConflicts > 0 ? 'Some required sessions are unscheduled — likely too few rooms, or the assigned faculty is blocked at every slot.' : undefined}
        stats={data && data.totalConflicts > 0 ? [
          { label: 'CONFLICTS', value: data.totalConflicts },
          { label: 'ASSIGNED', value: data.totalEntries },
          { label: 'SECTIONS HIT', value: sectionsHit },
        ] : undefined}
      />

      {loading ? (
        <div className="empty-state card p-8"><p>Loading...</p></div>
      ) : !data ? (
        <div className="empty-state card p-8"><p>No data found</p></div>
      ) : data.totalConflicts === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle size={48} style={{ color: 'var(--crimson)', margin: '0 auto 1rem' }} />
          <h2 className="font-serif" style={{ fontSize: 22, marginBottom: '0.5rem' }}>No conflicts</h2>
          <p className="text-muted">All faculty-subject-section assignments were successfully scheduled.</p>
          <Link to="/admin/timetable" className="btn btn-primary mt-4" style={{ display: 'inline-flex' }}>View timetable</Link>
        </div>
      ) : (
        <div className="dash-body-grid" style={{ gridTemplateColumns: '1fr 340px', marginTop: 0 }}>
          <div className="flex flex-col gap-4">
            {Object.entries(bySectionMap).map(([sectionName, items]) => (
              <div key={sectionName} className="data-table-card">
                <div className="section-card-header">
                  <div className="section-card-title">Section {sectionName}</div>
                  <StatusPill tone="crimson">HIGH SEVERITY</StatusPill>
                  <div className="section-card-meta">{items.length} UNPLACED SUBJECT{items.length === 1 ? '' : 'S'}</div>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="p-4" style={{ display: 'flex', alignItems: 'center', gap: 28, borderBottom: i < items.length - 1 ? '1px solid var(--hairline-soft)' : undefined }}>
                    <div style={{ flex: 1 }}>
                      <div className="font-serif" style={{ fontSize: 22, marginBottom: 5 }}>{item.subject.name}</div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(26,16,16,.55)' }}>Faculty: {item.faculty.name} · {item.type?.toLowerCase()}</div>
                    </div>
                    <div className="numeral-col"><div className="numeral-label">REQUIRED</div><div className="numeral-value">{item.required}</div></div>
                    <div className="numeral-col"><div className="numeral-label">ASSIGNED</div><div className="numeral-value dim">{item.assigned}</div></div>
                    <div className="numeral-col"><div className="numeral-label">MISSING</div><div className="numeral-value crimson">{item.missing}</div></div>
                  </div>
                ))}
              </div>
            ))}

            <div className="card" style={{ padding: '20px 22px 24px' }}>
              <div className="font-serif" style={{ fontSize: 20, marginBottom: 16 }}>How to resolve</div>
              <div className="flex flex-col">
                <div className="resolve-row">
                  <div className="resolve-index">01</div>
                  <div className="resolve-text">Add more rooms — labs first if lab sessions clash</div>
                  <Link className="resolve-link" to="/admin/rooms">Rooms</Link>
                </div>
                <div className="resolve-row">
                  <div className="resolve-index">02</div>
                  <div className="resolve-text">Reduce weekly lecture or lab counts on the conflicting subject</div>
                  <Link className="resolve-link" to="/admin/subjects">Subjects</Link>
                </div>
                <div className="resolve-row">
                  <div className="resolve-index">03</div>
                  <div className="resolve-text">Check whether a faculty member is carrying too many assignments</div>
                  <Link className="resolve-link" to="/admin/assignments">Assignments</Link>
                </div>
                <div className="resolve-row">
                  <div className="resolve-index">04</div>
                  <div className="resolve-text">Review slot preferences that over-constrain the schedule</div>
                  <span className="resolve-link">Constraints</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="version-panel-dark">
              <div className="version-panel-eyebrow">VERSION {(data.label || 'UNTITLED').toUpperCase()}</div>
              <div className="version-panel-title">{data.totalEntries} of {data.totalEntries + data.conflicts.reduce((s, c) => s + c.missing, 0)} slots filled</div>
              <div className="version-panel-desc">Publishing a version with conflicts is allowed, but students will see gaps in their schedule.</div>
              <button className="btn btn-primary" onClick={() => navigate('/admin/timetable')}>Back to timetable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictsPage;
