# TaskFlow

A full-stack project and task management application built for small teams. It covers the basics you actually need: creating projects, assigning tasks, managing access by role, and keeping everyone on the same page through a shared dashboard.

Live: https://etharaaitask-production-0d25.up.railway.app

---

## Overview

TaskFlow was built to give teams a straightforward place to organize work without too many features getting in the way. The admin sets up the projects and invites people. Members see their tasks and update progress. Nothing more complicated than that.

New users who register with email and password are placed in a pending state until an admin approves them. Users who sign in with Google are approved automatically. This keeps the team list clean without requiring a complex invitation system.

---

## Features

**Authentication**

Users can register with an email and password or sign in through Google OAuth. Email registrations require admin approval before the user can access the application. Google sign-ins bypass this step and are granted access immediately.

**Role-Based Access**

There are two roles: admin and member. Admins have full control over projects, tasks, and user management. Members can view projects they belong to and update the status of tasks assigned to them. The permission structure is enforced at both the API level and the frontend.

**Projects**

Admins can create projects, give them a name, description, and color, and invite other users as members. Each project has its own task list and Kanban board.

**Kanban Board**

Each project has a board view that organizes tasks into three columns: To Do, In Progress, and Done. Tasks can be dragged between columns to update their status, or you can edit a task directly to change any of its fields.

**Tasks**

Tasks belong to a project and can be assigned to any member of that project. Each task has a title, description, priority (low, medium, high), status, and an optional due date. The tasks page lets you filter by project, status, priority, or search by title.

**Dashboard**

The dashboard shows a summary of all your projects and tasks. It includes stat cards for total projects, total tasks, completed tasks, and overdue tasks, along with a pie chart by status and a bar chart by priority. Below the charts is a table of recent tasks with their assignees and due dates.

**Team Management**

Admins can view all registered users, see their role, project count, task count, and approval status. Pending users can be approved from this page.

---

## Default Admin Account

When the application is deployed, a system administrator account is created automatically from the database seed.

- **Email:** admin@ethara.com
- **Password:** Admin123!

Log in with these credentials when setting up a new deployment. It is a good idea to change the password afterward.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 with Vite |
| Styling | CSS with glassmorphism and CSS variables |
| Backend | Node.js with Express |
| Database | PostgreSQL |
| Authentication | JWT (via cookie-session) and Google OAuth 2.0 via Passport.js |
| Charts | Recharts |
| Deployment | Railway |

---

## Role Permissions

| Action | Admin | Member |
|---|---|---|
| Create and delete projects | Yes | No |
| Invite members to a project | Yes | No |
| Create tasks | Yes | No |
| Assign tasks to members | Yes | No |
| Update task status | Yes | Own tasks only |
| View dashboard | Full (all projects) | Filtered (own data) |
| Approve new user registrations | Yes | No |
| View team/users page | Yes | No |

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values before running locally.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `SESSION_SECRET` | Secret for the cookie session (used only during OAuth flow) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `CLIENT_URL` | URL of the frontend (e.g. http://localhost:5173 in dev) |
| `SERVER_URL` | URL of the backend (e.g. http://localhost:5000 in dev) |
| `NODE_ENV` | Set to `production` on Railway, `development` locally |

---

## Local Development

You will need Node.js 18 or later and a PostgreSQL database running locally.

```bash
# Clone the repository
git clone https://github.com/Vaibhi06/Ethara_AI_Task.git
cd Ethara_AI_Task

# Install dependencies for server and client
npm install --prefix server
npm install --prefix client

# Set up environment variables
cp server/.env.example server/.env
# Open server/.env and fill in DATABASE_URL and other values

# Initialize the database (run schema.sql against your local PostgreSQL)
psql -U postgres -d your_db_name -f server/db/schema.sql

# Start the backend (port 5000)
npm run dev --prefix server

# In a second terminal, start the frontend (port 5173)
npm run dev --prefix client
```

The frontend dev server proxies API requests to the backend so you do not need to configure CORS separately in development.

---

## Project Structure

```
taskflow/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Layout and UI components (Navbar, Sidebar, etc.)
│       ├── context/         # Auth context for global user state
│       ├── pages/           # Route-level page components
│       ├── services/        # Axios API client
│       └── utils/           # Helper functions
├── server/                  # Express backend
│   ├── config/              # Database connection and Passport.js setup
│   ├── controllers/         # Business logic for each resource
│   ├── middleware/          # Auth guards and role-based access checks
│   ├── routes/              # API route definitions
│   └── db/
│       └── schema.sql       # PostgreSQL schema with seed for default admin
├── railway.json             # Railway build and deployment configuration
└── .gitignore
```

---

## API Routes

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register a new user |
| POST | /api/auth/login | No | Log in with email and password |
| GET | /api/auth/google | No | Start Google OAuth flow |
| GET | /api/auth/me | Yes | Get current user info |
| POST | /api/auth/logout | Yes | Log out |
| GET | /api/projects | Yes | List projects for current user |
| POST | /api/projects | Yes (Admin) | Create a new project |
| GET | /api/projects/:id | Yes | Get project details |
| PUT | /api/projects/:id | Yes (Admin) | Update a project |
| DELETE | /api/projects/:id | Yes (Admin) | Delete a project |
| GET | /api/tasks | Yes | List tasks (filterable) |
| POST | /api/tasks | Yes (Admin) | Create a task |
| PUT | /api/tasks/:id | Yes | Update a task |
| DELETE | /api/tasks/:id | Yes (Admin) | Delete a task |
| GET | /api/users | Yes (Admin) | List all users |
| PATCH | /api/users/:id/approve | Yes (Admin) | Approve a pending user |
| GET | /api/dashboard/stats | Yes | Get dashboard statistics |
