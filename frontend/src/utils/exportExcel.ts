import * as XLSX from 'xlsx';

interface TimetableEntry {
  timeSlot: { dayOfWeek: string; startTime: string; endTime: string };
  subject: { name: string; type: string };
  faculty: { name: string };
  room: { name: string };
  section: { name: string };
}

/**
 * Exports timetable entries to an Excel (.xlsx) file.
 * @param entries   - array of timetable entry objects
 * @param filename  - output filename (without extension)
 * @param sheetName - name of the worksheet
 */
export function exportTimetableExcel(
  entries: TimetableEntry[],
  filename: string,
  sheetName = 'Timetable'
): void {
  const rows = entries.map((e) => ({
    Day: e.timeSlot.dayOfWeek,
    'Start Time': e.timeSlot.startTime,
    'End Time': e.timeSlot.endTime,
    Subject: e.subject.name,
    Type: e.subject.type,
    Faculty: e.faculty.name,
    Room: e.room.name,
    Section: e.section.name,
  }));

  // Sort by day order then time
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  rows.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.Day) - dayOrder.indexOf(b.Day);
    if (dayDiff !== 0) return dayDiff;
    return a['Start Time'].localeCompare(b['Start Time']);
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key] || '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
