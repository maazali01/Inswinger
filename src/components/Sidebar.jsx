import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdVideoLibrary, MdTv, MdVerified, MdEvent, MdArticle, MdLogout, MdBarChart } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

/* Minimal dark sidebar for admin */
export default function Sidebar({ className = '' }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const adminItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: MdDashboard },
    { to: '/admin/users', label: 'User Management', icon: MdPeople },
    { to: '/admin/streamers', label: 'Streamer Management', icon: MdVideoLibrary },
    { to: '/admin/stream-types', label: 'Stream Types', icon: MdTv },
    { to: '/admin/verifications', label: 'Verifications', icon: MdVerified },
    { to: '/admin/events', label: 'Upcoming Events', icon: MdEvent },
    { to: '/admin/blogs', label: 'Blogs', icon: MdArticle },
  ];

  const streamerItems = [
    { to: '/streamer/dashboard', label: 'Stream Management', icon: MdVideoLibrary },
    { to: '/streamer/analytics', label: 'Analytics', icon: MdBarChart },
  ];

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error', err);
    } finally {
      // remove tokens (best-effort)
      try {
        Object.keys(localStorage).forEach((k) => {
          if ((k.startsWith('sb-') && k.includes('-auth-token')) || k.startsWith('supabase')) localStorage.removeItem(k);
        });
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('sb-') || k.startsWith('supabase')) sessionStorage.removeItem(k);
        });
      } catch (e) {}
      navigate('/login', { replace: true });
      setSigningOut(false);
    }
  };

  const navItems = profile?.role === 'admin' ? adminItems : profile?.role === 'streamer' ? streamerItems : [];

  return (
    <aside className={`w-64 h-screen border-r border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 ${className} fixed top-0 left-0 overflow-y-auto flex flex-col`}>
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">
          <span className="neon-text">Inswinger</span>
          <span className="text-blue-400">+</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">Panel</p>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'
                }`
              }
            >
              <Icon className="text-xl" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || user?.email || 'No name'}</p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role || 'guest'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(profile?.role === 'streamer' ? '/streamer/profile' : '/profile')}
            className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-700/80"
          >
            Profile
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {signingOut ? 'Signing Out...' : 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  );
}
