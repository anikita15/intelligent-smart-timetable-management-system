/**
 * Integration tests for critical backend APIs.
 * Uses supertest to make real HTTP requests against the Express app.
 * Requires a running PostgreSQL database (itms_dev).
 */
import request from 'supertest';
import prisma from '../../src/prismaClient';
import app from '../../src/app';

let adminToken: string;
let facultyToken: string;
let createdFacultyId: string;
let createdSubjectId: string;
let createdSectionId: string;
let createdRoomId: string;

// Clean up test data after all tests
afterAll(async () => {
  // Clean up in dependency order
  await prisma.timetableEntry.deleteMany({});
  await prisma.timetableVersion.deleteMany({});
  await prisma.facultySubjectSection.deleteMany({});
  await prisma.facultyPreference.deleteMany({});
  await prisma.faculty.deleteMany({ where: { name: { startsWith: '__test__' } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.itms' } } });
  await prisma.subject.deleteMany({ where: { name: { startsWith: '__test__' } } });
  await prisma.section.deleteMany({ where: { name: { startsWith: '__test__' } } });
  await prisma.room.deleteMany({ where: { name: { startsWith: '__test__' } } });
  await prisma.$disconnect();
});

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Authentication', () => {
  it('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.itms', password: 'wrong' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    // Ensure admin exists first
    await request(app).post('/api/auth/setup');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@itms.edu', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.token;
  });

  it('GET /api/auth/users requires authentication', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/register creates a FACULTY user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'faculty1@test.itms',
        password: 'pass123',
        role: 'FACULTY',
        name: '__test__Faculty One',
        maxWeeklyLoad: 15,
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('FACULTY');
    expect(res.body.faculty).toBeDefined();
    createdFacultyId = res.body.faculty.id;

    // Login as faculty
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty1@test.itms', password: 'pass123' });
    facultyToken = loginRes.body.token;
  });

  it('rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'faculty1@test.itms', password: 'pass123', role: 'FACULTY', name: '__test__Dup' });
    expect(res.status).toBe(400);
  });

  it('rejects FACULTY role accessing admin-only endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ email: 'x@test.itms', password: 'pass', role: 'STUDENT' });
    expect(res.status).toBe(403);
  });
});

describe('Faculty CRUD', () => {
  it('GET /api/faculty returns list', async () => {
    const res = await request(app)
      .get('/api/faculty')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Subject CRUD', () => {
  it('POST /api/subjects creates a subject', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '__test__Math 101',
        type: 'Theory',
        weeklyLectures: 3,
        weeklyLabs: 0,
        semester: 1,
        isCore: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('__test__Math 101');
    createdSubjectId = res.body.id;
  });

  it('GET /api/subjects returns the created subject', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((s: any) => s.id === createdSubjectId)).toBe(true);
  });
});

describe('Section CRUD', () => {
  it('POST /api/sections creates a section', async () => {
    const res = await request(app)
      .post('/api/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '__test__CSE-1A', semester: 1, strength: 60 });
    expect(res.status).toBe(201);
    createdSectionId = res.body.id;
  });
});

describe('Room CRUD', () => {
  it('POST /api/rooms creates a room', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '__test__Room-101', type: 'Classroom', capacity: 60 });
    expect(res.status).toBe(201);
    createdRoomId = res.body.id;
  });

  it('GET /api/rooms returns the created room', async () => {
    const res = await request(app)
      .get('/api/rooms')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.some((r: any) => r.id === createdRoomId)).toBe(true);
  });
});

describe('Faculty Preferences', () => {
  it('POST /api/faculty/:id/preferences saves preferences', async () => {
    // Get a time slot first
    const slotsRes = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (slotsRes.body.length === 0) {
      // Seed if needed
      await request(app)
        .post('/api/timeslots/seed')
        .set('Authorization', `Bearer ${adminToken}`);
    }

    const slots = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (slots.body.length === 0) return; // Skip if no slots

    const slotId = slots.body[0].id;
    const res = await request(app)
      .post(`/api/faculty/${createdFacultyId}/preferences`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ preferences: [{ timeSlotId: slotId, preferenceLevel: 'PREFERRED' }] });
    expect(res.status).toBe(200);
    expect(res.body.preferences).toHaveLength(1);
    expect(res.body.preferences[0].preferenceLevel).toBe('PREFERRED');
  });

  it('GET /api/faculty/:id/preferences retrieves preferences', async () => {
    const res = await request(app)
      .get(`/api/faculty/${createdFacultyId}/preferences`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Timetable Versions', () => {
  it('GET /api/timetable/versions returns list', async () => {
    const res = await request(app)
      .get('/api/timetable/versions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
