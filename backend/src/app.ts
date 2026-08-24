import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import facultyRoutes from './routes/facultyRoutes';
import subjectRoutes from './routes/subjectRoutes';
import sectionRoutes from './routes/sectionRoutes';
import roomRoutes from './routes/roomRoutes';
import timetableRoutes from './routes/timetableRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import timeSlotRoutes from './routes/timeSlotRoutes';
import facultyPreferenceRoutes from './routes/facultyPreferenceRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/faculty', facultyPreferenceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timeslots', timeSlotRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
