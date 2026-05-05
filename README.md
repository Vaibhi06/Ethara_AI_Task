# TaskFlow 🚀
> Premium Project & Task Management with Role-Based Access Control

Full-stack web app built with **React + Node.js/Express + PostgreSQL**, deployed on **Railway**.

---

## ✨ Features
- 🔐 **Auth** — Email/Password + Sign in with Google
- 👥 **RBAC** — Admin & Member roles (system + project level)
- 📊 **Dashboard** — Stats cards, pie/bar charts, recent tasks
- 🗂 **Projects** — Create, manage, invite team members
- 🎯 **Kanban Board** — Drag tasks: To Do → In Progress → Done
- 📋 **Tasks** — Filter by status/priority/project/search
- 🌙 **Dark/Light Mode** — Premium glassmorphism UI

---

## 🛠 Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth 2.0 |
| Charts | Recharts |
| Deployment | Railway |

---

## 🚀 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete step-by-step Railway deployment guide.

---


## 💻 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Setup
```bash
# 1. Clone & install
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
npm install --prefix server
npm install --prefix client

# 2. Configure server env
cp server/.env.example server/.env
# Edit server/.env — fill in DATABASE_URL

# 3. Run development servers (two terminals)
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

---

## 🔐 Role Permissions
| Action | Admin | Member |
|---|---|---|
| Create/Delete Projects | ✅ | ❌ |
| Invite Members | ✅ | ❌ |
| Create/Assign Tasks | ✅ | ❌ |
| Update Task Status | ✅ | ✅ (own tasks) |
| View Dashboard | ✅ (all) | ✅ (own) |
| Manage Users | ✅ | ❌ |

---

## 📁 Project Structure
```
taskflow/
├── client/          # React (Vite) frontend
├── server/          # Node.js + Express backend
│   ├── config/      # DB + Passport config
│   ├── controllers/ # Business logic
│   ├── middleware/  # Auth + RBAC
│   ├── routes/      # API endpoints
│   └── db/          # PostgreSQL schema
├── railway.json     # Railway deployment config
└── .gitignore
```
