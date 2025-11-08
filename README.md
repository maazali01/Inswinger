# Inswinger+ 🏆

A modern, full-stack sports streaming platform built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Multi-Role System**: User, Streamer, and Admin roles with dedicated dashboards
- **Live Streaming**: Stream and watch live sports events across 9+ sports categories
- **Real-time Chat**: Live chat during streams using Supabase Realtime
- **Streamer Verification**: Subscription-based verification system with admin approval
- **Content Management**: Admin CMS for managing streams, blogs, and events
- **Sports-Themed UI**: Dynamic gradients, neon highlights, and responsive design

## Tech Stack

- **Frontend**: React 18 + Vite 7
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Routing**: React Router v6
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account (free tier works)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL commands from `SUPABASE_SETUP.md` in your Supabase SQL Editor

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Create an admin user**:
   - Sign up through the app
   - Run this SQL in Supabase to promote yourself:
   ```sql
   UPDATE public.users 
   SET role = 'admin', is_verified = true 
   WHERE email = 'your-email@example.com';
   ```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx      # Main navigation
│   └── ProtectedRoute.jsx  # Route protection
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state
├── lib/                # Utilities and config
│   ├── supabase.js     # Supabase client
│   └── constants.js    # App constants and mock data
├── pages/              # Page components
│   ├── Login.jsx       # Login page
│   ├── Signup.jsx      # Signup page
│   ├── SubscriptionPlans.jsx  # Streamer subscription
│   ├── VerificationUpload.jsx # Screenshot upload
│   ├── VerificationPending.jsx # Pending verification
│   ├── user/           # User dashboard pages
│   │   ├── UserDashboard.jsx
│   │   ├── StreamCard.jsx
│   │   └── StreamView.jsx
│   ├── streamer/       # Streamer dashboard pages
│   │   ├── StreamerDashboard.jsx
│   │   └── AddStreamModal.jsx
│   └── admin/          # Admin CMS pages
│       ├── AdminDashboard.jsx
│       ├── StreamerManagement.jsx
│       ├── StreamTypeManagement.jsx
│       └── BlogManagement.jsx
└── App.jsx             # Main app with routing
```

## User Roles & Workflows

### 👤 User
- View live and recorded streams
- Access blogs and upcoming events
- Participate in live chat during streams
- **Entry**: Sign up → Auto-redirected to `/home`

### 🎥 Streamer
- Add stream links to admin-created stream types
- Manage own streams (edit/delete)
- Configure ads settings
- **Entry**: Sign up as streamer → Select plan → Upload screenshot → Wait for admin approval

### 👨‍💼 Admin
- Approve/reject streamer applications
- Create stream types (templates)
- Manage blogs and events
- View analytics dashboard
- **Entry**: Manually promoted via SQL

## Database Schema

### Tables
- `users` - User profiles with role and verification status
- `stream_types` - Stream templates created by admin
- `streams` - Actual streams added by verified streamers
- `blogs` - Blog posts managed by admin
- `upcoming_events` - Scheduled events
- `chat_messages` - Live chat messages

See `SUPABASE_SETUP.md` for complete schema and RLS policies.

## Key Features Implementation

### Authentication Flow
- Supabase Auth with email/password
- Role-based redirect after login
- Protected routes with `ProtectedRoute` component

### Streamer Verification
1. User signs up as streamer
2. Selects subscription plan (PKR pricing)
3. Uploads payment screenshot to Supabase Storage
4. Admin reviews and approves/rejects
5. Verified streamers gain access to dashboard

### Real-time Chat
- Uses Supabase Realtime subscriptions
- Listens to `INSERT` events on `chat_messages` table
- Auto-scrolls to latest messages

### Mock Data Fallback
- If no real data exists, displays mock streams/blogs/events
- Seamlessly switches to real data when available
- Defined in `src/lib/constants.js`

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (Supabase URL and key)
4. Deploy

### Environment Variables for Production
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## Customization

### Sports Categories
Edit `src/lib/constants.js` to add/remove sports:
```javascript
export const SPORTS_CATEGORIES = [
  'NFL', 'Football', 'Cricket', 'Basketball', 
  'F1', 'Tennis', 'Boxing', 'MMA', 'Hockey'
];
```

### Subscription Plans
Modify plans in `src/lib/constants.js`:
```javascript
export const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic Plan', price: 1999, currency: 'PKR', ... }
];
```

### Theme Colors
Update `tailwind.config.js` for custom colors and gradients.

## Troubleshooting

### RLS Policy Errors
- Ensure all RLS policies from `SUPABASE_SETUP.md` are applied
- Check user role is correctly set in database

### Storage Upload Errors
- Verify `verification-screenshots` bucket exists in Supabase Storage
- Check storage policies are applied

### Authentication Issues
- Confirm Supabase URL and anon key in `.env`
- Check if user profile exists in `users` table

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

Built with ❤️ using React, Vite, Tailwind CSS, and Supabase
