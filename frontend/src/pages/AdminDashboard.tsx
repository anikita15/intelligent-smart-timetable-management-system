import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { DataTableRow } from '../components/DataTable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const SLOTS_PER_DAY = 8;
const TOTAL_SLOTS = DAYS.length * SLOTS_PER_DAY;
const GRID = '1.2fr 1fr 1fr .8fr 1fr 1fr';

interface RawItem { id: string; [key: string]: any; }

const AdminDashboard: React.FC = () => {
  const [faculty, setFaculty] = useState<RawItem[]>([]);
  const [subjects, setSubjects] = useState<RawItem[]>([]);
  const [rooms, setRooms] = useState<RawItem[]>([]);
  const [sections, setSections] = useState<RawItem[]>([]);
  const [assignments, setAssignments] = useState<RawItem[]>([]);
  const [versions, setVersions] = useState<RawItem[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<RawItem[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [f, s, r, sec, a, v] = await Promise.all([
          api.get('/faculty'), api.get('/subjects'), api.get('/rooms'),
          api.get('/sections'), api.get('/assignments'), api.get('/timetable/versions'),
        ]);
        setFaculty(f); setSubjects(s); setRooms(r); setSections(sec); setAssignments(a); setVersions(v);

        const published = v.find((ver: any) => ver.status === 'PUBLISHED');
        if (published) {
          const [entries, conflicts] = await Promise.all([
            api.get(`/timetable/versions/${published.id}/entries`),
            api.get(`/timetable/versions/${published.id}/conflicts`),
          ]);
          setPublishedEntries(entries);
          setConflictCount(conflicts?.totalConflicts ?? 0);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const published = versions.find(v => v.status === 'PUBLISHED');
  const recentVersions = versions.slice(0, 5);
  const filled = publishedEntries.length;
  const maxFacultyLoad = faculty.reduce((max, f) => Math.max(max, f.maxWeeklyLoad || 0), 0);
  const totalRoomCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalStudents = sections.reduce((sum, s) => sum + (s.strength || 0), 0);

  const headline = !published
    ? (versions.length === 0 ? 'The week is still blank' : 'No version is published yet')
    : filled === 0
      ? 'One version published, none of it placed'
      : conflictCount > 0
        ? `${filled} of ${TOTAL_SLOTS} slots filled, ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} unresolved`
        : 'The week is scheduled and conflict-free';

  const description = !published
    ? 'Generate a timetable to see it take shape here.'
    : `The last run produced a timetable with ${filled} ${filled === 1 ? 'entry' : 'entries'}${conflictCount > 0 ? ` and ${conflictCount} unresolved conflict${conflictCount === 1 ? '' : 's'}` : ''}. ${conflictCount > 0 ? 'Review the report, then regenerate.' : ''}`;

  const eyebrow = published
    ? `PUBLISHED VERSION · ${published.label || 'UNTITLED'} · ${published.academicYear || ''} · SEM ${published.semester || '—'}`
    : 'SYSTEM';

  const statusColor = (s: string): 'crimson' | 'neutral' => s === 'PUBLISHED' ? 'crimson' : 'neutral';

  const statCards = [
    { label: 'FACULTY', value: faculty.length, caption: 'Manage staff', link: '/admin/faculty' },
    { label: 'SUBJECTS', value: subjects.length, caption: 'Courses', link: '/admin/subjects' },
    { label: 'ROOMS', value: rooms.length, caption: `Capacity ${totalRoomCapacity}`, link: '/admin/rooms' },
    { label: 'SECTIONS', value: sections.length, caption: `${totalStudents} students`, link: '/admin/sections' },
    { label: 'ASSIGNMENTS', value: assignments.length, caption: `${assignments.length} pair${assignments.length === 1 ? '' : 's'} linked`, link: '/admin/assignments' },
  ];

  const slotAt = (day: string, index: number) => publishedEntries.find(e => e.timeSlot?.dayOfWeek === day && e.timeSlot?.slotIndex === index);

  return (
    <div>
      <PageHeader
        hero
        eyebrow={eyebrow}
        title={headline}
        description={description}
        stats={[
          { label: 'SLOTS FILLED', value: filled },
          { label: 'OF', value: TOTAL_SLOTS, dim: true },
          { label: 'CONFLICTS', value: conflictCount },
        ]}
      />

      <div className="dash-stat-grid">
        {statCards.map(c => (
          <Link key={c.label} to={c.link} className="dash-stat-card">
            <div className="dash-stat-card-label">{c.label}</div>
            <div className="dash-stat-card-value">{loading ? '—' : c.value}</div>
            <div className="dash-stat-card-caption">{c.caption}</div>
          </Link>
        ))}
        <Link to="/admin/timetable" className="dash-stat-card dark">
          <div className="dash-stat-card-label">TIMETABLES</div>
          <div className="dash-stat-card-value">{loading ? '—' : versions.length}</div>
          <div className="dash-stat-card-caption">{conflictCount > 0 ? `${conflictCount} conflict${conflictCount === 1 ? '' : 's'} open` : versions.length === 0 ? 'None generated yet' : 'No open conflicts'}</div>
        </Link>
      </div>

      <div className="dash-body-grid">
        <div>
          <div className="flex items-baseline gap-4 mb-4">
            <div className="font-serif" style={{ fontSize: 24 }}>Fall 2026, as it stands</div>
            <div className="font-mono" style={{ fontSize: '10.5px', color: 'rgba(26,16,16,.42)', letterSpacing: '.08em' }}>{TOTAL_SLOTS - filled} OPEN SLOTS</div>
          </div>

          <div className="day-grid">
            {DAYS.map((day, di) => (
              <div className="day-card" key={day}>
                <div className="day-card-label">{DAY_LABELS[di]}</div>
                <div className="day-slots">
                  {Array.from({ length: SLOTS_PER_DAY }).map((_, si) => {
                    const entry = slotAt(day, si);
                    return entry ? (
                      <div className="day-slot filled" key={si} title={`${entry.subject?.name} · ${entry.room?.name}`}>
                        {entry.subject?.name}
                      </div>
                    ) : (
                      <div className="day-slot" key={si} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <div className="data-table-card">
              <div className="section-card-header">
                <div className="section-card-title">Recent versions</div>
                <Link to="/admin/timetable" style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 12 }}>View all</Link>
              </div>
              {loading ? (
                <div className="empty-state"><p>Loading...</p></div>
              ) : recentVersions.length === 0 ? (
                <div className="empty-state">
                  <h3>No timetables generated yet</h3>
                  <p>Use the dock below to generate your first timetable.</p>
                </div>
              ) : (
                <>
                  <div className="dt-head-row" style={{ gridTemplateColumns: GRID }}>
                    <div className="dt-head-cell">LABEL</div><div className="dt-head-cell">ACADEMIC YEAR</div><div className="dt-head-cell">SEMESTER</div><div className="dt-head-cell">ENTRIES</div><div className="dt-head-cell">STATUS</div><div className="dt-head-cell">GENERATED</div>
                  </div>
                  {recentVersions.map(v => (
                    <Link key={v.id} to="/admin/timetable" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <DataTableRow gridTemplate={GRID}>
                        <span className="dt-cell-name">{v.label || 'Untitled'}</span>
                        <span className="dt-cell-mono">{v.academicYear || '—'}</span>
                        <span className="dt-cell-sub">{v.semester ? `Sem ${v.semester}` : '—'}</span>
                        <span className="dt-cell-mono">{v._count?.entries ?? '—'}</span>
                        <StatusPill tone={statusColor(v.status)}>{v.status}</StatusPill>
                        <span className="dt-cell-mono">{new Date(v.generatedAt).toLocaleDateString()}</span>
                      </DataTableRow>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {conflictCount > 0 && published && (
            <div className="attention-panel">
              <div className="attention-eyebrow">NEEDS ATTENTION</div>
              <div className="attention-title">{conflictCount} conflict{conflictCount === 1 ? '' : 's'} in &ldquo;{published.label || 'Untitled'}&rdquo;</div>
              <div className="attention-desc">Some required sessions have nowhere to go. Review the conflict report to see what's blocking placement.</div>
              <Link to={`/admin/timetable/${published.id}/conflicts`} className="btn btn-primary">Open report</Link>
            </div>
          )}

          <div className="constraints-card">
            <div className="constraints-title">Constraints</div>
            <div className="flex flex-col gap-2">
              <div className="constraint-row">Max hours / faculty<span>{maxFacultyLoad || '—'}</span></div>
              <div className="constraint-row">Teaching days<span>MON–FRI</span></div>
              <div className="constraint-row">Faculty on staff<span>{faculty.length}</span></div>
              <div className="constraint-row">Rooms available<span>{rooms.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
