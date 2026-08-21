# ITMS – Intelligent Timetable Management System

A full-stack web application that automatically generates conflict-free weekly class timetables for an academic department.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | SQLite (dev) |
| Frontend | React, Vite, TypeScript, React Router |
| Auth | JWT (JSON Web Tokens) |

## Project Structure

```
itms/
├── backend/     # Express REST API + Prisma + SQLite
└── frontend/    # React + Vite SPA
```

## Getting Started

### Backend

```bash
cd backend
npm install
npx prisma db push       # Create DB tables
npm run build            # Compile TypeScript
npm start                # Start on port 5005
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

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login and receive JWT |
| `POST /api/auth/setup` | Create initial admin (run once) |
| `GET/POST/PUT/DELETE /api/faculty` | Manage faculty |
| `GET/POST/PUT/DELETE /api/subjects` | Manage subjects |
| `GET/POST/PUT/DELETE /api/sections` | Manage sections |
| `GET/POST/PUT/DELETE /api/rooms` | Manage rooms |
| `GET/POST /api/assignments` | Faculty-Subject-Section assignments |
| `GET /api/timeslots` | List time slots |
| `POST /api/timeslots/seed` | Seed weekly time slots |
| `POST /api/timetable/generate` | Generate timetable (greedy algorithm) |
| `GET /api/timetable/versions` | List timetable versions |
| `GET /api/timetable/versions/:id/entries` | Get timetable entries |

## Features (Phase 1)

- ✅ Unified login (Admin / Faculty / Student)
- ✅ Admin Dashboard with stats and timetable generation
- ✅ Master data management (Faculty, Subjects, Rooms, Sections)
- ✅ Greedy constraint-based timetable generation engine
- ✅ Hard constraint enforcement (no faculty/room/section double-booking)
- ✅ JWT-based role authentication
- ✅ SQLite database via Prisma ORM
