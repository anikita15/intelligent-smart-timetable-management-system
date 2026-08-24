import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CalendarDays, FileDown, Sheet, Settings2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import TimetableGrid from '../components/TimetableGrid';
import PageHeader from '../components/PageHeader';
import StatusPill from '../components/StatusPill';
import { useToast } from '../components/Toast';
import { exportTimetablePdf } from '../utils/exportPdf';
import { exportTimetableExcel } from '../utils/exportExcel';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PREF_LEVELS = ['PREFERRED', 'NEUTRAL', 'AVOID'] as const;
type PrefLevel = typeof PREF_LEVELS[number];

const prefConfig: Record<PrefLevel, { label: string; color: string }> = {
  PREFERRED: { label: '✓ Preferred', color: '#22c55e' },
  NEUTRAL:   { label: '— Neutral',   color: '#6b7280' },
  AVOID:     { label: '✕ Avoid',     color: '#ef4444' },
};

function nextPref(current: PrefLevel): PrefLevel {
  const idx = PREF_LEVELS.indexOf(current);
  return PREF_LEVELS[(idx + 1) % PREF_LEVELS.length];
}

const FacultyDashboard: React.FC = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'schedule' | 'preferences'>('schedule');
  const [publishedVersion, setPublishedVersion] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [myFaculty, setMyFaculty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Preferences state
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [prefMap, setPrefMap] = useState<Map<string, PrefLevel>>(new Map());
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const userId = localStorage.getItem('userId');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [versions, faculty] = await Promise.all([
        api.get('/timetable/versions'),
        api.get('/faculty'),
      ]);
      const published = versions.find((v: any) => v.status === 'PUBLISHED');
      setPublishedVersion(published || null);

      const storedEmail = localStorage.getItem('email');
      const myFac = faculty.find((f: any) => f.user?.email === storedEmail || f.userId === userId);
      setMyFaculty(myFac || null);

      if (published) {
        const e = await api.get(`/timetable/versions/${published.id}/entries`);
        setEntries(e);
      }
    } catch { toast('error', 'Failed to load schedule'); } finally { setLoading(false); }
  }, [userId]);

  const loadPreferences = useCallback(async () => {
    if (!myFaculty) return;
    setPrefsLoading(true);
    try {
      const [slots, prefs] = await Promise.all([
        api.get('/timeslots'),
        api.get(`/faculty/${myFaculty.id}/preferences`),
      ]);
      setTimeSlots(slots.filter((s: any) => !s.isLunch));
      const map = new Map<string, PrefLevel>();
      prefs.forEach((p: any) => map.set(p.timeSlotId, p.preferenceLevel as PrefLevel));
      setPrefMap(map);
    } catch { toast('error', 'Failed to load preferences'); } finally { setPrefsLoading(false); }
  }, [myFaculty]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'preferences' && myFaculty) loadPreferences(); }, [tab, myFaculty, loadPreferences]);

  const togglePref = (slotId: string) => {
    setPrefMap(prev => {
      const current = prev.get(slotId) || 'NEUTRAL';
      const next = nextPref(current);
      const updated = new Map(prev);
      if (next === 'NEUTRAL') updated.delete(slotId);
      else updated.set(slotId, next);
      return updated;
    });
  };

  const savePreferences = async () => {
    if (!myFaculty) return;
    setSavingPrefs(true);
    try {
      const preferences = Array.from(prefMap.entries()).map(([timeSlotId, preferenceLevel]) => ({
        timeSlotId,
        preferenceLevel,
      }));
      await api.post(`/faculty/${myFaculty.id}/preferences`, { preferences });
      toast('success', 'Preferences saved! They will be used in the next timetable generation.');
    } catch { toast('error', 'Failed to save preferences'); } finally { setSavingPrefs(false); }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportTimetablePdf('faculty-timetable-grid', myFaculty?.name || 'timetable', `${myFaculty?.name} — Schedule`);
      toast('success', 'PDF downloaded!');
    } catch { toast('error', 'PDF export failed'); } finally { setExportingPdf(false); }
  };

  const handleExportExcel = () => {
    const myEntries = entries.filter(e => myFaculty && e.faculty.id === myFaculty.id);
    exportTimetableExcel(myEntries, `${myFaculty?.name || 'faculty'}-schedule`);
    toast('success', 'Excel downloaded!');
  };

  const myEntries = entries.filter(e => myFaculty && e.faculty.id === myFaculty.id);
  const totalHours = myEntries.length;

  // Group time slots by day for the preference grid
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = timeSlots.filter((s: any) => s.dayOfWeek === day).sort((a: any, b: any) => a.slotIndex - b.slotIndex);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <PageHeader
        eyebrow="FACULTY"
        title="Faculty Portal"
        description="Your schedule and availability preferences."
        action={tab === 'schedule' && myFaculty && entries.length > 0 ? (
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={handleExportExcel}><Sheet size={14} /> Excel</button>
            <button className="btn btn-outline btn-sm" onClick={handleExportPdf} disabled={exportingPdf}><FileDown size={14} /> {exportingPdf ? 'Exporting…' : 'PDF'}</button>
          </div>
        ) : undefined}
      />

      {/* Tabs */}
      <div className="flex gap-0 mb-4" style={{ borderBottom: '2px solid var(--border)' }}>
        <button
          className={`tab-btn${tab === 'schedule' ? ' active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          <CalendarDays size={15} /> My Schedule
        </button>
        <button
          className={`tab-btn${tab === 'preferences' ? ' active' : ''}`}
          onClick={() => setTab('preferences')}
        >
          <Settings2 size={15} /> My Preferences
        </button>
      </div>

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        loading ? (
          <div className="empty-state card p-8"><p>Loading your schedule...</p></div>
        ) : !publishedVersion ? (
          <div className="card p-8 text-center empty-state">
            <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
            <h3>No published timetable</h3>
            <p>The admin hasn't published a timetable yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {!myFaculty && (
              <div className="alert-banner alert-warning mb-4">
                <Clock size={16} />
                <span>Your account is not linked to a faculty profile. Contact the admin.</span>
              </div>
            )}
            {myFaculty && (
              <div className="stats-grid mb-4">
                <div className="stat-card">
                  <div className="stat-card-icon"><Clock size={18} /></div>
                  <div className="stat-card-label">Weekly Hours</div>
                  <div className="stat-card-value">{totalHours}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon"><CalendarDays size={18} /></div>
                  <div className="stat-card-label">Classes This Week</div>
                  <div className="stat-card-value">{myEntries.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon"><CalendarDays size={18} /></div>
                  <div className="stat-card-label">Unique Subjects</div>
                  <div className="stat-card-value">{new Set(myEntries.map(e => e.subject.id)).size}</div>
                </div>
              </div>
            )}

            <div className="card p-4" id="faculty-timetable-grid">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{publishedVersion.label || 'Published Timetable'}</h2>
                <StatusPill tone="crimson">PUBLISHED</StatusPill>
              </div>
              <TimetableGrid entries={entries} filterFacultyId={myFaculty?.id} showSection />
            </div>
          </>
        )
      )}

      {/* Preferences Tab */}
      {tab === 'preferences' && (
        <div>
          {!myFaculty ? (
            <div className="card p-8 text-center empty-state">
              <Settings2 size={48} style={{ color: 'var(--text-muted)' }} />
              <h3>No faculty profile linked</h3>
              <p>Contact admin to link your account to a faculty profile.</p>
            </div>
          ) : prefsLoading ? (
            <div className="empty-state card p-8"><p>Loading preferences...</p></div>
          ) : (
            <>
              <div className="card p-4 mb-4">
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Set Your Time Preferences</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Click each slot to cycle through: <strong style={{ color: '#22c55e' }}>Preferred</strong> → <strong style={{ color: '#ef4444' }}>Avoid</strong> → Neutral. These are used as soft constraints during timetable generation.
                </p>

                {/* Legend */}
                <div className="flex gap-4 mb-4 flex-wrap">
                  {PREF_LEVELS.map(level => (
                    <div key={level} className="flex items-center gap-2" style={{ fontSize: '0.8rem' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: prefConfig[level].color }} />
                      <span>{prefConfig[level].label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                    <span>— Neutral (default)</span>
                  </div>
                </div>

                {/* Preference grid */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, width: 90, borderBottom: '2px solid var(--border)' }}>Time</th>
                        {DAYS.map(day => (
                          <th key={day} style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>
                            {day.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(timeSlots.filter((s: any) => s.dayOfWeek === 'Monday').sort((a: any, b: any) => a.slotIndex - b.slotIndex)).map((refSlot: any) => (
                        <tr key={refSlot.slotIndex}>
                          <td style={{ padding: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                            {refSlot.startTime}–{refSlot.endTime}
                          </td>
                          {DAYS.map(day => {
                            const slot = (slotsByDay[day] || []).find((s: any) => s.slotIndex === refSlot.slotIndex);
                            if (!slot) return <td key={day} style={{ borderBottom: '1px solid var(--border)' }} />;
                            const pref = prefMap.get(slot.id) || 'NEUTRAL';
                            const isSet = pref !== 'NEUTRAL';
                            return (
                              <td key={day} style={{ padding: '0.3rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                                <button
                                  onClick={() => togglePref(slot.id)}
                                  title={`${day} ${slot.startTime} — Click to change (${pref})`}
                                  style={{
                                    width: '100%',
                                    padding: '0.35rem 0.25rem',
                                    borderRadius: 6,
                                    border: isSet ? `2px solid ${prefConfig[pref].color}` : '1px solid var(--border)',
                                    background: isSet ? `${prefConfig[pref].color}22` : 'var(--surface-2)',
                                    color: isSet ? prefConfig[pref].color : 'var(--text-muted)',
                                    fontSize: '0.7rem',
                                    fontWeight: isSet ? 700 : 400,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {isSet ? (pref === 'PREFERRED' ? '✓' : '✕') : '·'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {Array.from(prefMap.values()).filter(v => v === 'PREFERRED').length} preferred · {Array.from(prefMap.values()).filter(v => v === 'AVOID').length} avoided
                  </span>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setPrefMap(new Map()); }}>Reset All</button>
                    <button className="btn btn-primary btn-sm" onClick={savePreferences} disabled={savingPrefs}>
                      <CheckCircle2 size={14} /> {savingPrefs ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
