import { NavLink, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPeople, MdVideoLibrary, MdTv, MdEvent, MdArticle, MdLogout, MdBarChart, MdAutoAwesome, MdPerson, MdClose } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

/* Minimal dark sidebar for admin */
export default function Sidebar({ className = '' }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // mobile overlay state
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: MdDashboard },
    { to: '/admin/stream-types', label: 'Stream Types', icon: MdTv },
    { to: '/admin/stream-management', label: 'Stream Management', icon: MdVideoLibrary },
    { to: '/admin/streamers', label: 'Streamers', icon: MdPeople },
    { to: '/admin/users', label: 'User Management', icon: MdPerson },
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
      } catch {
        // Silent catch - storage access might be blocked
      }
      navigate('/login', { replace: true });
      setSigningOut(false);
    }
  };

  useEffect(() => {
    // prevent background scroll when mobile sidebar open
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navItems = profile?.role === 'admin' ? adminItems : profile?.role === 'streamer' ? streamerItems : [];

  return (
    <>
      {/* Floating mobile button */}
      <button
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] bg-gray-800 border border-gray-700 p-2 rounded-lg text-gray-200 shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-64 h-screen border-r border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 ${className} fixed top-0 left-0 overflow-y-auto flex-col`}>
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

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-80 max-w-[85%] bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  <span className="neon-text">Inswinger</span>
                  <span className="text-blue-400">+</span>
                </h2>
                <p className="text-xs text-gray-400">Panel</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-300 hover:text-white">
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`
                    }
                  >
                    <Icon className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-gray-700 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate">{profile?.name || user?.email || 'No name'}</p>
                  <p className="text-xs text-gray-400 capitalize">{profile?.role || 'guest'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMobileOpen(false); navigate(profile?.role === 'streamer' ? '/streamer/profile' : '/profile'); }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-700/80"
                >
                  Profile
                </button>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  disabled={signingOut}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {signingOut ? 'Signing Out...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
