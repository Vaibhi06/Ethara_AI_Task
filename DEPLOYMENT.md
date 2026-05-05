# 🚀 TaskFlow — Railway Deployment Guide

> Deploy TaskFlow to [Railway](https://railway.com) using your GitHub repository.
> Railway provides **free PostgreSQL hosting** and **auto-deploy on every git push**.

---

## Prerequisites

- A [Railway account](https://railway.com) (sign up with GitHub)
- Your code pushed to a **GitHub repository**
- Google Cloud Console project with OAuth credentials ready

---

## Step 1 — Push Code to GitHub

```bash
# Inside E:\Vaibhavi_Resume\Assign_Task
git init
git add .
git commit -m "feat: initial TaskFlow implementation"
git branch -M main

# Create a new GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

> ⚠️ Make sure `Google_auth_client_id.json` and `server/.env` are **NOT** committed (already in `.gitignore`).

---

## Step 2 — Create a Railway Project from GitHub

1. Go to **[railway.com/new](https://railway.com/new)**
2. Click **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your **taskflow** repository
5. Click **"Deploy Now"**

Railway will automatically detect `railway.json` and start the build.

---

## Step 3 — Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway creates the database and **automatically injects `DATABASE_URL`** into your app

> The database schema (`server/db/schema.sql`) runs automatically on first boot.

---

## Step 4 — Set Environment Variables

In Railway → your **app service** → **"Variables"** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate: 32+ random chars)* |
| `SESSION_SECRET` | *(generate: 32+ random chars)* |
| `GOOGLE_CLIENT_ID` | *(your Google Client ID from Cloud Console)* |
| `GOOGLE_CLIENT_SECRET` | *(your Google Client Secret from Cloud Console)* |
| `CLIENT_URL` | `https://YOUR-APP.railway.app` *(set after deploy)* |
| `SERVER_URL` | `https://YOUR-APP.railway.app` *(same URL)* |

> `DATABASE_URL` is **auto-set** by the PostgreSQL service — do not add it manually.

**Generate a strong secret (run in PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | % {[char]$_})
```

---

## Step 5 — Get Your Railway App URL

1. Go to your Railway app service → **"Settings"** tab
2. Under **"Networking"** → click **"Generate Domain"**
3. Copy the URL (e.g. `https://taskflow-production.railway.app`)
4. Update `CLIENT_URL` and `SERVER_URL` variables with this URL

---

## Step 6 — Update Google Cloud Console

> Required for **Google Sign-In** to work in production.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click your **OAuth 2.0 Client ID** (`gen-lang-client-0996210991`)
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://YOUR-APP.railway.app/api/auth/google/callback
   ```
5. Under **"Authorized JavaScript origins"**, add:
   ```
   https://YOUR-APP.railway.app
   ```
6. Click **Save**

---

## Step 7 — Redeploy

After setting all environment variables:

1. In Railway → your app service → **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment

Or simply push a new commit — Railway auto-deploys on every push to `main`.

---

## Auto-Deploy on Git Push

Every time you push to your `main` branch, Railway **automatically rebuilds and redeploys**:

```bash
git add .
git commit -m "fix: something"
git push origin main
# Railway detects the push → builds → deploys automatically
```

---

## Verify Deployment

After deploy, check these endpoints:

| URL | Expected |
|---|---|
| `https://YOUR-APP.railway.app` | React app loads |
| `https://YOUR-APP.railway.app/api/health` | `{"status":"ok"}` |
| `https://YOUR-APP.railway.app/api/auth/google` | Redirects to Google |

---

## Railway Services Overview

```
Your Railway Project
├── 🟣 App Service (Node.js)
│   ├── Builds: npm install + npm run build (client)
│   ├── Starts: node server/index.js
│   └── Serves: React SPA + REST API
└── 🐘 PostgreSQL Service
    ├── Auto-managed by Railway
    └── DATABASE_URL injected automatically
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Build fails | Check Railway logs → "Deployments" → click the failed deploy |
| DB not connecting | Ensure PostgreSQL service is in the same Railway project |
| Google OAuth fails | Confirm redirect URI is added in Google Cloud Console |
| 404 on page refresh | Already handled — Express serves `index.html` for all routes |
| `CLIENT_URL` mismatch | Must match your exact Railway domain (no trailing slash) |

---

## Cost

Railway offers a **free Hobby tier** with:
- $5/month free credit
- 512 MB RAM
- Shared PostgreSQL

Sufficient for development and small-team usage.
