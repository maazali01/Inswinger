# Inswinger+ - AI Agent Instructions

## Project Overview

Inswinger+ is a **sports streaming platform** with a three-tier role system (User, Streamer, Admin), built on React + Vite + Tailwind + Supabase. The core architecture separates **content creation** (admin) from **content linking** (streamers) from **content consumption** (users).

## Architecture & Data Flow

### Role-Based Architecture
- **Admin** creates **stream types** (templates) → stored in `stream_types` table
- **Streamer** adds **stream links** to those types → stored in `streams` table (FK to `stream_types`)
- **User** views streams created by streamers → queries join `streams` + `stream_types`

**Critical**: Streamers do NOT create stream metadata (title, sport, time) - they only provide URLs to existing admin-created templates. This prevents duplicates and ensures content quality.

### Authentication & Authorization Flow
1. User signs up via Supabase Auth → creates `auth.users` entry
2. Signup page automatically creates matching `public.users` profile with role
3. `AuthContext` loads user + profile on mount → stores in React context
4. `ProtectedRoute` checks role and redirects to appropriate dashboard
5. All routes use RLS policies - **never bypass with service role keys in frontend**

### Streamer Verification Workflow
```
Signup (role=streamer) → /subscription-plans → select plan → 
/verification-upload → upload screenshot to Storage → 
/verification-pending → Admin approves → is_verified=true → 
Access granted to /streamer/dashboard
```

**Storage pattern**: Screenshots go to `verification-screenshots` bucket with naming `{user_id}-{timestamp}.ext`. URL saved in `users.screenshot_url`.

### Real-time Features
- **Live Chat**: Uses `supabase.channel()` with `postgres_changes` event on `chat_messages` INSERT
- Pattern: Subscribe on mount, fetch initial messages, append new via callback, cleanup on unmount
- **Data Updates**: Admin/streamer CRUDs should trigger UI refresh via re-fetch (not optimistic updates due to RLS complexity)

## Key Conventions & Patterns

### Component Structure
- **Pages** in `src/pages/{role}/` - one folder per role
- **Shared components** in `src/components/` - must work across all roles
- **Modals** colocated with parent component (e.g., `AddStreamModal.jsx` next to `StreamerDashboard.jsx`)

### State Management
- **Auth state**: Global via `AuthContext` - provides `{ user, profile, loading, signOut }`
- **Data fetching**: Local state with `useState` + `useEffect` - no global store
- **Loading states**: Always show spinner during async ops - use `loading` boolean

### Supabase Patterns
```javascript
// ✅ Good: Join with select
const { data } = await supabase
  .from('streams')
  .select('*, stream_types(*), users(name)')
  .eq('streamer_id', userId);

// ❌ Bad: Multiple queries + manual join
```

### Error Handling
- Try/catch on all Supabase calls
- Show `alert()` for user-facing errors (quick impl, replace with toast if upgrading)
- Log errors to console for debugging

### Styling
- Use Tailwind utility classes exclusively
- Custom components defined in `index.css` with `@layer components`
- Key classes: `btn-primary`, `btn-secondary`, `card`, `input-field`
- Sports theme: gradients (`sport-gradient`, `gradient-neon`), neon text (`neon-text`)

## Development Workflows

### Adding a New Feature
1. Check if Supabase table/column exists - if not, add migration SQL
2. Update RLS policies if new data access pattern
3. Create page component in appropriate role folder
4. Add route to `App.jsx` with `ProtectedRoute` wrapper
5. Test with all three roles

### Debugging Auth Issues
- Check `public.users` table exists and has profile for user
- Verify RLS policies allow the operation (test in SQL editor with `auth.uid()`)
- Confirm `AuthContext` has loaded profile before redirecting

### Testing Realtime
- Open two browser windows (or incognito + regular)
- Perform action in one → should instantly reflect in other
- Check Network tab for `realtime` WebSocket connection

## File Locations

### Critical Files
- `src/lib/supabase.js` - Supabase client singleton (NEVER recreate)
- `src/lib/constants.js` - All mock data, sports list, plans
- `src/contexts/AuthContext.jsx` - Auth state provider
- `SUPABASE_SETUP.md` - Complete DB schema + RLS policies

### Where to Add...
- New sport category → `constants.js` SPORTS_CATEGORIES array
- New subscription plan → `constants.js` SUBSCRIPTION_PLANS array
- New page for users → `pages/user/` folder
- New admin function → `pages/admin/` folder
- Reusable UI component → `components/` folder

## Common Pitfalls

### RLS Policy Errors
**Symptom**: "new row violates row-level security policy"  
**Fix**: Check user role is correct in DB and policy allows the operation

### Infinite Loop on useEffect
**Symptom**: Component re-renders constantly  
**Fix**: Add proper dependency array - empty `[]` for mount-only

### Mock Data Showing After Real Data Added
**Symptom**: Mock data still visible even with DB entries  
**Fix**: Check `if (!data || data.length === 0)` condition - should be strict

### Storage Upload Fails
**Symptom**: 403 on upload  
**Fix**: Verify bucket exists, storage policies applied, and file path matches policy pattern

## Environment Setup

**Required**: `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`  
**Never commit**: `.env` (use `.env.example` for template)

## Supabase-Specific Notes

- Always use `anon` key in frontend (never `service_role`)
- RLS policies are the security layer - test them thoroughly
- Use `auth.uid()` in policies to reference current user
- Storage URLs from `getPublicUrl()` work even with RLS (bucket is public)
- Realtime only works if table has RLS enabled and allows SELECT

## Performance Considerations

- Use `.select('*')` only when needed - specify columns to reduce payload
- Add `.limit()` on unbounded queries (e.g., chat messages)
- Index foreign keys (already done in schema)
- No client-side filtering if can be done in SQL

## When Extending This Project

- New roles: Add to `role` enum, create folder in `pages/`, add RLS policies
- New tables: Follow naming (plural, snake_case), add RLS immediately
- New storage buckets: Create bucket + policies in same SQL transaction
- New realtime feature: Subscribe to specific table + filter by ID to reduce load

---

**Bottom Line**: This is a role-based CMS where admins create structure, streamers populate it, and users consume it. All data flows through Supabase with RLS as the security layer. Keep role separation strict and always test auth flows with all three roles.
