# Quick Start Guide

Get Inswinger running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database is Ready

The Supabase database is already configured with:
- ✅ All tables created
- ✅ RLS policies applied
- ✅ Subscription plans seeded
- ✅ Initial settings configured

Connection details are in `.env` file.

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Test the Application

### Create User Account

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Click "Join as Viewer"
3. Enter your details:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"

You'll be redirected to `/dashboard`

### Create Streamer Account

1. Sign out from user account
2. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
3. Click "Become a Streamer"
4. Select a subscription plan (e.g., "Pro")
5. Enter your details:
   - Full Name: Test Streamer
   - Email: streamer@example.com
   - Password: password123
   - Bio: Professional sports streamer
6. Click "Create Streamer Account"

You'll be redirected to `/dashboard/streamer`

### Create Admin Account

1. Sign up as a regular user
2. Go to [Supabase Dashboard](https://app.supabase.com)
3. Select your project
4. Go to Table Editor > `profiles`
5. Find your user row
6. Change `role` from `'user'` to `'admin'`
7. Log out and log back in
8. You now have access to `/admin` (when implemented)

## Available Routes

### Public Routes (no auth required)
- `/` - Homepage
- `/browse` - Browse streams (with filters)
- `/login` - Sign in
- `/signup` - Sign up
- `/signup/streamer` - Become a streamer

### Protected Routes (auth required)
- `/dashboard` - User dashboard
- `/dashboard/streamer` - Streamer dashboard (streamer role only)
- `/admin` - Admin panel (admin role only, when implemented)

## Features to Test

### Homepage
- ✅ Responsive design
- ✅ Navigation with role-based menu items
- ✅ Sport category badges
- ✅ Call-to-action buttons
- ✅ Footer with links

### Browse Streams
- ✅ Stream listing (will be empty initially)
- ✅ Filter by category
- ✅ Filter by status (live, scheduled)
- ✅ Search functionality
- ✅ Empty state with CTA

### User Dashboard
- ✅ Profile information
- ✅ Watch history (empty initially)
- ✅ Following list (empty initially)
- ✅ Account statistics

### Streamer Dashboard
- ✅ Streamer profile with subscription info
- ✅ Stream management (empty initially)
- ✅ Analytics placeholder
- ✅ "New Stream" button

### Authentication
- ✅ Sign up flow with role selection
- ✅ Login with role-based redirects
- ✅ Protected routes
- ✅ Sign out functionality

## Database Tables

You can view and edit data in Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "Table Editor"
4. View/edit any table:
   - `profiles` - User accounts
   - `streamers` - Streamer data
   - `streams` - Stream content (empty initially)
   - `subscription_plans` - Available plans (seeded)
   - `chats` - Chat messages (empty)
   - And more...

## Common Tasks

### Add Test Streams

```sql
-- In Supabase SQL Editor
-- First, get a streamer ID
SELECT id FROM streamers LIMIT 1;

-- Then insert a test stream (replace streamer_id)
INSERT INTO streams (
  streamer_id,
  title,
  slug,
  description,
  category,
  status,
  visibility
) VALUES (
  'your-streamer-id',
  'NFL Live Game',
  'nfl-live-game',
  'Watch the exciting NFL match live',
  'NFL',
  'live',
  'public'
);
```

### View All Users

```sql
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### Check RLS Policies

```sql
-- View policies for a table
SELECT * FROM pg_policies WHERE tablename = 'streams';
```

## Development Workflow

### Make Code Changes

1. Edit files in `app/` or `components/`
2. Save - Hot reload will update the browser
3. Check console for errors

### Add New Pages

Create a new file in `app/`:
```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <div>About Us</div>;
}
```

Automatically available at `/about`

### Add New API Routes

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello!' });
}
```

### Update Database Schema

1. Make changes in Supabase Dashboard
2. Or write SQL migration
3. Apply to production when ready

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Error

1. Check `.env` file has correct Supabase URL and key
2. Verify Supabase project is running
3. Check network connection

### Build Errors

```bash
# Clean build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Try build again
npm run build
```

### Authentication Issues

1. Clear browser cookies and localStorage
2. Check Supabase Auth settings
3. Verify email/password are correct
4. Check browser console for errors

## Next Steps

Now that you have the app running:

1. **Read README.md** - Full project overview
2. **Read IMPLEMENTATION_GUIDE.md** - How to add remaining features
3. **Read DEPLOYMENT.md** - Deploy to production

### Implement Additional Features

Choose what to build next:
- 🎥 Video streaming (Livepeer/Mux integration)
- 💬 Real-time chat (Supabase Realtime)
- 💳 Payments (Stripe integration)
- 📝 Blog system
- 📅 Events calendar
- 🛠️ Admin CMS

Each feature has detailed implementation steps in `IMPLEMENTATION_GUIDE.md`

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Need Help?

Check documentation files:
- `README.md` - Project overview
- `IMPLEMENTATION_GUIDE.md` - Feature development
- `DEPLOYMENT.md` - Production deployment
- This file - Local development

---

**You're all set!** Start building features on top of Inswinger.
