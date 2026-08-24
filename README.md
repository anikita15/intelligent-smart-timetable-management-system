# ITMS – Intelligent Timetable Management System

A full-stack web application that automatically generates conflict-free weekly class timetables for an academic department.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Frontend | React, Vite, TypeScript, React Router |
| Auth | JWT (JSON Web Tokens) |
| Testing | Jest + @swc/jest (unit), supertest (integration) |

## Project Structure

```
itms/
├── backend/     # Express REST API + Prisma + PostgreSQL
└── frontend/    # React + Vite SPA
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### Database Setup

```bash
psql -d postgres -c "CREATE DATABASE itms_dev;"
```

### Backend

```bash
cd backend
npm install
# Update .env with your DATABASE_URL if needed (default: anikita@localhost/itms_dev)
npx prisma migrate dev    # Run migrations and create DB tables
npm run build             # Compile TypeScript
npm start                 # Start on port 5005
```

**First-time setup** (create admin user):
```bash
curl -X POST http://localhost:5005/api/auth/setup
```

**Seed time slots:**
```bash
# Login first to get token, then:
curl -X POST http://localhost:5005/api/timeslots/seed \
  -H "Authorization: Bearer <token>"
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Start on http://localhost:5173
```

## Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@itms.edu` |
| Password | `admin123` |
| Role | ADMIN |

## Running Tests

```bash
cd backend
npm test              # All tests (unit + integration)
npm run test:unit     # Unit tests only (scheduling constraints)
npm run test:coverage # With coverage report
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login and receive JWT |
| `POST /api/auth/setup` | Create initial admin (run once) |
| `GET/POST /api/auth/users` | List users / create user |
| `PATCH /api/auth/users/:id/section` | Link student to section |
| `GET/POST/PUT/DELETE /api/faculty` | Manage faculty |
| `GET/POST /api/faculty/:id/preferences` | Faculty time preferences |
| `GET/POST/PUT/DELETE /api/subjects` | Manage subjects |
| `GET/POST/PUT/DELETE /api/sections` | Manage sections |
| `GET/POST/PUT/DELETE /api/rooms` | Manage rooms |
| `GET/POST /api/assignments` | Faculty-Subject-Section assignments |
| `GET /api/timeslots` | List time slots |
| `POST /api/timeslots/seed` | Seed weekly time slots |
| `POST /api/timetable/generate` | Generate timetable (greedy algorithm) |
| `GET /api/timetable/versions` | List timetable versions |
| `GET /api/timetable/versions/:id/entries` | Get timetable entries |
| `PATCH /api/timetable/versions/:id/publish` | Publish a timetable |
| `PATCH /api/timetable/versions/:id/archive` | Archive a timetable |
| `DELETE /api/timetable/versions/:id` | Delete a draft |
| `GET /api/timetable/versions/:id/conflicts` | Get conflict report |

## Features

### Phase 1 – Core
- ✅ Unified login (Admin / Faculty / Student)
- ✅ Admin Dashboard with stats and timetable generation
- ✅ Master data management (Faculty, Subjects, Rooms, Sections)
- ✅ Greedy constraint-based timetable generation engine
- ✅ Hard constraint enforcement (no faculty/room/section double-booking)
- ✅ JWT-based role authentication
- ✅ PostgreSQL database via Prisma ORM

### Phase 2 – Intelligence & Polish
- ✅ Soft constraint optimization (load balancing, morning preferences, faculty preferences)
- ✅ Timetable versioning (DRAFT → PUBLISHED → ARCHIVED)
- ✅ Conflict detection & explanation
- ✅ Full Admin Dashboard (stats, quick actions, conflict viewer)
- ✅ Faculty Dashboard (personal timetable, weekly load)
- ✅ Student Dashboard (section timetable, section selection)
- ✅ User management with faculty profile creation

### Phase 3 – Completion
- ✅ Faculty Preference UI (set PREFERRED/NEUTRAL/AVOID per time slot)
- ✅ PDF Export (jspdf + html2canvas, A4 landscape)
- ✅ Excel Export (xlsx, sorted by day/time)
- ✅ iCal Export (.ics download)
- ✅ Student Section Auto-Link (admin links students to sections; timetable auto-loads on login)
- ✅ PostgreSQL migration (from SQLite dev → production-ready Postgres)
- ✅ Testing suite: 20 unit tests (constraint logic) + 16 integration tests (API)

## Production Deployment

### Backend → Railway

1. Create a Railway project
2. Add a PostgreSQL plugin → copy the `DATABASE_URL`
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
4. Deploy from GitHub: `npm run build && npm start`
5. Run setup: `POST https://your-backend.railway.app/api/auth/setup`

### Frontend → Vercel

1. Connect GitHub repo to Vercel
2. Set `VITE_API_BASE` env var to your Railway backend URL
3. Update `frontend/src/api.ts` `BASE` to use `import.meta.env.VITE_API_BASE`
4. Vercel auto-builds on push
