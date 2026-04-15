# UVA Turkish Network — Deployment Guide

You'll have a live link in about 30 minutes. Follow these steps in order.

---

## Prerequisites

- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- A free [GitHub](https://github.com) account
- [Node.js 18+](https://nodejs.org) installed locally
- [Git](https://git-scm.com) installed locally

---

## Step 1 — Set Up Supabase

### 1.1 Create a New Project

1. Go to [app.supabase.com](https://app.supabase.com) and click **New project**
2. Name it `uva-turkish-network` (or anything you like)
3. Set a strong database password (save it somewhere)
4. Choose the region closest to you (US East is fine)
5. Click **Create new project** and wait ~1 minute

### 1.2 Run the Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the editor and click **Run** (green button)
5. You should see: `Success. No rows returned`

### 1.3 Configure Authentication

1. Go to **Authentication** > **URL Configuration** in the sidebar
2. Under **Site URL**: enter `http://localhost:3000` for now (you'll update it after Vercel deploy)
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`
4. Click **Save**

### 1.4 Copy Your API Keys

1. Go to **Project Settings** > **API**
2. Copy:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

---

## Step 2 — Run Locally (Test First)

### 2.1 Install Dependencies

Open a terminal in this project folder and run:

```bash
npm install
```

### 2.2 Create Your Environment File

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

### 2.4 Test the Auth Flow

1. Click **Join as Alumni** and register with any email
2. Check your email for the confirmation link
3. Click the link — you'll land on **Edit Profile**
4. Fill in your profile and save
5. You should now see the Dashboard

---

## Step 3 — Push to GitHub

### 3.1 Initialize Git

```bash
git init
git add .
git commit -m "Initial commit: UVA Turkish Network"
```

### 3.2 Create a New GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `uva-turkish-network` (keep it private if you prefer)
3. **Do not** add a README, .gitignore, or license
4. Click **Create repository**

### 3.3 Push Your Code

GitHub will show you the commands. They look like this:

```bash
git remote add origin https://github.com/YOUR_USERNAME/uva-turkish-network.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

### 4.1 Import the Project

1. Go to [vercel.com](https://vercel.com) and sign in (use your GitHub account)
2. Click **Add New** > **Project**
3. Find your `uva-turkish-network` repo and click **Import**
4. Framework: Vercel will auto-detect **Next.js** — don't change it
5. **Do not click Deploy yet** — you need to add env vars first

### 4.2 Add Environment Variables

In the Vercel import screen, scroll to **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (your anon key) |

### 4.3 Deploy

Click **Deploy**. Vercel will build and deploy in about 2 minutes.

You'll get a URL like `https://uva-turkish-network.vercel.app` — that's your live link!

---

## Step 5 — Update Supabase with Your Live URL

1. Go back to Supabase > **Authentication** > **URL Configuration**
2. Update **Site URL** to: `https://uva-turkish-network.vercel.app` (your actual Vercel URL)
3. Under **Redirect URLs**, add: `https://uva-turkish-network.vercel.app/auth/callback`
4. Keep `http://localhost:3000/auth/callback` in the list too (for local dev)
5. Click **Save**

---

## Step 6 — Make Yourself an Admin

1. Go to Supabase > **SQL Editor** > **New query**
2. Run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace with the email you registered with. Now go to `/admin` in your live app.

---

## Step 7 — Custom Domain (Optional)

If you want `network.uvaturkish.org` or similar:

1. In Vercel, go to your project > **Settings** > **Domains**
2. Add your domain and follow the DNS instructions
3. Update Supabase Site URL and Redirect URLs with the new domain

---

## Ongoing Maintenance

**To add a new feature or fix something:**
1. Edit the code locally
2. Test with `npm run dev`
3. `git add . && git commit -m "description" && git push`
4. Vercel auto-deploys on every push to `main`

**To view your database:**
- Supabase > **Table Editor** — view/edit rows directly

**To view auth users:**
- Supabase > **Authentication** > **Users**

**To make someone else an admin** (when the community grows):
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'colleague@email.com';
```

---

## Architecture Overview

```
UVA Turkish Network
├── Frontend:   Next.js 14 (App Router) on Vercel (free)
├── Database:   Supabase PostgreSQL (free tier: 500MB)
├── Auth:       Supabase Auth (email + magic link)
└── Hosting:    Vercel (free tier: unlimited deploys)

Tables:
  profiles   — all users (students, alumni, admin)
  jobs       — job/internship/referral postings
  requests   — coffee chat & mentorship requests
  messages   — alumni-to-alumni direct messages

Security:
  - Row Level Security on all tables
  - UVA email gate enforced in app for students
  - Contact info gated behind authentication
  - Admin role required for /admin routes
```

---

## Troubleshooting

**"Invalid API Key" error on first load**
→ Double-check `.env.local` values match exactly what Supabase shows

**Email confirmation links not working**
→ Make sure your Supabase Redirect URL includes `/auth/callback`

**Profile page shows empty after login**
→ The trigger may not have fired. Run:
```sql
INSERT INTO profiles (id, email, role)
SELECT id, email, 'student' FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

**Build fails on Vercel**
→ Check that all env vars are set in Vercel project settings

---

You're done. Send the link!
