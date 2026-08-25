import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { api } from '../api';
import Modal from './Modal';
import { useToast } from './Toast';

interface EntryEditPanelProps {
  open: boolean;
  onClose: () => void;
  entry: any; // The timetable entry to edit
  versionId: string;
  onSave: () => void; // Callback after successful save
}

const EntryEditPanel: React.FC<EntryEditPanelProps> = ({ open, onClose, entry, versionId, onSave }) => {
  const { toast } = useToast();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedFaculty, setSelectedFaculty] = useState(entry?.faculty?.id || '');
  const [selectedRoom, setSelectedRoom] = useState(entry?.room?.id || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(entry?.timeSlot?.id || '');

  const [saving, setSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string[]>([]);
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (open && entry) {
      setSelectedFaculty(entry.faculty.id);
      setSelectedRoom(entry.room.id);
      setSelectedTimeSlot(entry.timeSlot.id);
      setConflictWarning([]);
      setForce(false);
      loadOptions();
    }
  }, [open, entry]);

  // Check for conflicts whenever the selected options change
  useEffect(() => {
    if (open && entry && !loading) {
      checkConflicts();
    }
  }, [selectedFaculty, selectedRoom, selectedTimeSlot]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [fData, rData, tData] = await Promise.all([
        api.get('/faculty'),
        api.get('/rooms'),
        api.get('/timeslots')
      ]);
      setFaculty(fData);
      setRooms(rData.filter((r: any) => r.isActive)); // only active rooms
      setTimeSlots(tData);
    } catch (e) {
      toast('error', 'Failed to load edit options');
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async () => {
    try {
      const result = await api.post(`/timetable/versions/${versionId}/check-slot`, {
        facultyId: selectedFaculty,
        roomId: selectedRoom,
        sectionId: entry.section.id,
        timeSlotId: selectedTimeSlot,
        ignoreEntryId: entry.id
      });
      if (result.hasConflict) {
        setConflictWarning(result.conflicts);
        setForce(false);
      } else {
        setConflictWarning([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/timetable/versions/${versionId}/entries/${entry.id}`, {
        facultyId: selectedFaculty,
        roomId: selectedRoom,
        timeSlotId: selectedTimeSlot,
        force
      });
      toast('success', 'Entry updated successfully');
      onSave();
      onClose();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="EDIT SLOT"
      title={`${entry.subject.name} (${entry.section.name})`}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || (conflictWarning.length > 0 && !force)}
          >
            <Save size={16} /> {saving ? 'Saving...' : force ? 'Force Save' : 'Save Changes'}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="p-4 text-center text-muted">Loading options...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Faculty</label>
            <select
              className="form-select"
              value={selectedFaculty}
              onChange={e => setSelectedFaculty(e.target.value)}
            >
              {faculty.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Room</label>
            <select
              className="form-select"
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.type}, Cap: {r.capacity})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Time Slot</label>
            <select
              className="form-select"
              value={selectedTimeSlot}
              onChange={e => setSelectedTimeSlot(e.target.value)}
            >
              {timeSlots.map(t => (
                <option key={t.id} value={t.id}>{t.dayOfWeek} {t.startTime} - {t.endTime}</option>
              ))}
            </select>
          </div>

          {conflictWarning.length > 0 && (
            <div className="alert-banner alert-warning" style={{ marginTop: '0.5rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>Conflicts Detected</span>
              </div>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.85rem' }}>
                {conflictWarning.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="force-save"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                />
                <label htmlFor="force-save" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Acknowledge and force save anyway
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default EntryEditPanel;
