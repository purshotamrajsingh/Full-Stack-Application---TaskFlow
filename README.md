# TaskFlow - Full-Stack Task & Project Management App

TaskFlow is a full-stack web application for managing projects and tasks within a team. It was built for the **Advanced Software Development / Full Stack Application Development (CMS22204)** project brief at Ravensbourne University London.

It solves the problem of scattered task tracking for small teams by giving every user a single place to create projects, assign tasks, track progress, and see analytics — with role-based access so admins can oversee everything while regular users only see their own projects.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 (Vite) + React Router + Context API | Fast dev loop, component reuse, built-in global auth state via Context — no need for Redux at this scale |
| Backend | Node.js + Express | Lightweight, unopinionated REST API layer |
| Database | MongoDB + Mongoose ODM | Flexible schema for evolving task/project fields; Mongoose gives schema validation, hooks (password hashing) and query building |
| Auth | JWT + bcryptjs | Stateless auth suited to a decoupled SPA + API |
| Charts | Recharts | Dashboard pie/bar charts for analytics |
| Containerization | Docker + docker-compose | One-command local spin-up of Mongo + API + client |

> Note: the brief's template mentions "Django ORM" — this project uses **Mongoose** (the equivalent ORM/ODM for the Node.js + MongoDB stack actually specified in the brief's own deliverables). Django is a Python framework and isn't compatible with a Node.js backend; Mongoose is the correct, direct analogue for this stack. Mention this substitution explicitly in your report if your tutor asks about it.

## Features

- **Authentication & role-based access** — JWT-based login/register, `admin` and `user` roles. Admins see all projects/tasks/users; regular users only see projects they own or are a member of.
- **Projects** — create, view, delete projects with owners and members.
- **Tasks** — create, update status, delete; each task belongs to a project and can be assigned to a user.
- **Search, filter, sort** — full-text search on task title/description, filter by status/priority/project, sort by due date/priority/title/created date, with pagination support in the API.
- **Dashboard/analytics** — total tasks, completed, in-progress, overdue counts, plus pie/bar charts of tasks by status and priority (scoped to the logged-in user's visible tasks, or all tasks for admins).
- **Admin panel** — list and remove users (admin-only route, enforced both client-side and server-side).

## Project Structure

```
taskflow/
├── server/                # Node.js + Express API
│   ├── src/
│   │   ├── config/db.js       # Mongoose connection
│   │   ├── models/            # User, Project, Task schemas
│   │   ├── controllers/       # Route handler logic
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # JWT auth guard, role guard, error handler
│   │   ├── utils/generateToken.js
│   │   ├── seed.js            # Demo data seeder
│   │   └── index.js           # App entry point
│   ├── .env.example
│   └── Dockerfile
├── client/                # React (Vite) frontend
│   ├── src/
│   │   ├── api/client.js      # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/        # Navbar, ProtectedRoute
│   │   ├── pages/              # Login, Register, Dashboard, Projects, Tasks, Admin
│   │   └── App.jsx
│   ├── .env.example
│   └── Dockerfile
└── docker-compose.yml     # Mongo + server + client, one command
```

## Getting Started

### Option A — Docker (recommended, easiest)

Requires Docker + Docker Compose installed.

```bash
git clone <your-repo-url> taskflow
cd taskflow
docker compose up --build
```

This starts MongoDB, the API on `http://localhost:5000`, and the client on `http://localhost:3000`.

Then seed demo data (run once, while containers are up):

```bash
docker compose exec server npm run seed
```

### Option B — Run locally without Docker

Requires Node.js 18+ and a MongoDB instance (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

**1. Backend**

```bash
cd server
cp .env.example .env      # then edit MONGO_URI if using Atlas
npm install
npm run seed               # optional: creates demo users/projects/tasks
npm run dev                 # starts on http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd client
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173 (Vite default)
```

Open the URL Vite prints (usually `http://localhost:5173`) in your browser.

### Demo login (after running `npm run seed`)

| Email | Password | Role |
|---|---|---|
| admin@taskflow.dev | Password123 | admin |
| bob@taskflow.dev | Password123 | user |
| carol@taskflow.dev | Password123 | user |

## API Reference

Base URL: `http://localhost:5000/api`. All routes except `/auth/register` and `/auth/login` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user. Body: `{ name, email, password }`. Returns `{ token, user }`. |
| POST | `/auth/login` | Log in. Body: `{ email, password }`. Returns `{ token, user }`. |
| GET | `/auth/me` | Get the current authenticated user's profile. |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | List projects visible to the current user (all for admins). |
| POST | `/projects` | Create a project. Body: `{ name, description, members? }`. |
| GET | `/projects/:id` | Get one project. |
| PUT | `/projects/:id` | Update a project (owner or admin only). |
| DELETE | `/projects/:id` | Delete a project (owner or admin only). |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List tasks. Query params: `search`, `status`, `priority`, `project`, `assignee`, `sortBy`, `order`, `page`, `limit`. |
| POST | `/tasks` | Create a task. Body: `{ title, description, status?, priority?, dueDate?, project, assignee? }`. |
| GET | `/tasks/:id` | Get one task. |
| PUT | `/tasks/:id` | Update a task (e.g. change status). |
| DELETE | `/tasks/:id` | Delete a task. |
| GET | `/tasks/dashboard/stats` | Aggregated counts for the dashboard: total, overdue, byStatus, byPriority. |

### Users (admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users. |
| DELETE | `/users/:id` | Delete a user (admin only). |

## Data Models

**User**: `name`, `email` (unique), `password` (hashed with bcrypt, never returned by default), `role` (`admin` \| `user`), timestamps.

**Project**: `name`, `description`, `owner` (ref User), `members` (ref User[]), timestamps.

**Task**: `title`, `description`, `status` (`todo` \| `in_progress` \| `done`), `priority` (`low` \| `medium` \| `high`), `dueDate`, `project` (ref Project), `assignee` (ref User), `createdBy` (ref User), timestamps. A text index on `title`/`description` powers the search feature.

## Architecture & Data Flow

```
┌─────────────┐        HTTPS/JSON (Axios, JWT in header)        ┌──────────────────┐
│   Browser   │  <───────────────────────────────────────────>  │   React SPA      │
│   (User)    │                                                  │ (Context API for │
└─────────────┘                                                  │  auth state)     │
                                                                  └────────┬─────────┘
                                                                           │ REST calls
                                                                           ▼
                                                                  ┌──────────────────┐
                                                                  │  Express API      │
                                                                  │  - auth middleware│
                                                                  │  - role guard     │
                                                                  │  - controllers    │
                                                                  └────────┬─────────┘
                                                                           │ Mongoose ODM
                                                                           ▼
                                                                  ┌──────────────────┐
                                                                  │    MongoDB        │
                                                                  │ users/projects/   │
                                                                  │ tasks collections │
                                                                  └──────────────────┘
```

1. The React client stores the JWT in `localStorage` after login/register and attaches it to every API request via an Axios interceptor.
2. The Express API validates the JWT on protected routes (`middleware/auth.js`), attaches `req.user`, and enforces role checks (`requireRole`) for admin-only routes.
3. Controllers query MongoDB through Mongoose models; non-admin users are automatically scoped to only their own/owned projects and tasks at the query level (not just hidden in the UI).
4. The dashboard endpoint runs MongoDB aggregation pipelines to compute counts by status/priority and overdue tasks, which the client renders with Recharts.

## Testing Notes

Backend route wiring, JWT sign/verify, and bcrypt password hashing were smoke-tested during development. Because this project targets MongoDB (a component the brief explicitly asks for), full integration testing requires a running `mongod` instance or MongoDB Atlas connection — see Getting Started above. Recommended next step for the student: add Jest + Supertest integration tests against a local Mongo instance or `mongodb-memory-server` (works fine on a normal machine with internet access to download the Mongo binary once).

## Known Limitations & Future Improvements

- No password reset/email verification flow (out of scope for the brief).
- No pagination controls in the Tasks UI yet, though the API supports `page`/`limit`.
- Could add optimistic UI updates and toast notifications for a smoother UX.
- Deployment (AWS/Heroku/Azure) and automated tests are listed as optional in the brief and are documented here as next steps rather than implemented, to prioritise the mandatory deliverables given the project timeline.
