import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Treat "signing out" as logged-out to immediately show Login/Sign Up
  const isAuthenticated = !!user && !!profile && !signingOut;

  // Check if streamer is on verification pages
  const isOnVerificationPages = ['/verification-upload', '/verification-pending', '/subscription-plans'].includes(location.pathname);

  // Hide navbar for admin always
  // Show navbar for streamers during onboarding flow and after verification
  const ALWAYS_SHOW_NAVBAR_PATHS = [
    '/',
    '/login',
    '/signup',
    '/subscription-plans',
    '/verification-upload',
    '/verification-pending',
  ];

  let hideNavbar = false;
  if (isAuthenticated) {
    if (profile?.role === 'admin') {
      // Always hide for admin
      hideNavbar = true;
    } else if (profile?.role === 'streamer') {
      // Show navbar during onboarding, hide after verification on dashboard
      const onDashboard = location.pathname.startsWith('/streamer/');
      hideNavbar = onDashboard && profile.is_verified;
    }
  }

  // Always show navbar on public pages
  if (ALWAYS_SHOW_NAVBAR_PATHS.includes(location.pathname)) {
    hideNavbar = false;
  }

  if (hideNavbar) return null;

  // Remove Supabase auth tokens from storage
  const removeSupabaseTokens = () => {
    try {
      // Remove localStorage tokens
      Object.keys(localStorage).forEach((k) => {
        if ((k.startsWith('sb-') && k.includes('-auth-token')) || k.startsWith('supabase')) {
          localStorage.removeItem(k);
        }
      });
      // Remove sessionStorage tokens (if any)
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.startsWith('supabase')) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn('Error removing auth tokens:', e);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent multiple clicks
    setSigningOut(true);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      removeSupabaseTokens();
      navigate('/login', { replace: true });
      setSigningOut(false);
    }
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'streamer':
        return '/streamer/dashboard';
      case 'user':
      default:
        return '/home';
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Hide on verification pages */}
          {!isOnVerificationPages && (
            <Link 
              to="/" 
              className="flex items-center space-x-2"
            >
              <div className="text-2xl font-bold">
                <span className="neon-text">Inswinger</span>
                <span className="text-blue-500">+</span>
              </div>
            </Link>
          )}

          {/* Spacer when logo is hidden */}
          {isOnVerificationPages && <div></div>}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                {/* Only show navigation links if NOT on verification pages */}
                {!isOnVerificationPages && profile.role === 'user' && (
                  <>
                    <Link to="/home" className="text-gray-300 hover:text-white transition-colors">
                      Home
                    </Link>
                    <Link to="/blogs" className="text-gray-300 hover:text-white transition-colors">
                      Blogs
                    </Link>
                    <Link to="/events" className="text-gray-300 hover:text-white transition-colors">
                      Events
                    </Link>
                  </>
                )}

                {/* Profile Dropdown - always show for authenticated users */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-blue-400 transition-all">
                      <span className="text-white font-semibold text-sm">
                        {(profile.name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700 animate-fadeIn">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-white font-semibold truncate">{profile.name || user.email}</p>
                        <p className="text-xs text-gray-400 capitalize mt-1 flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              profile.role === 'admin'
                                ? 'bg-red-500'
                                : profile.role === 'streamer'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                            }`}
                          ></span>
                          {profile.role}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {signingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated && (
              <>
                {/* Only show navigation links if NOT on verification pages */}
                {!isOnVerificationPages && profile.role === 'user' && (
                  <>
                    <Link
                      to="/home"
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      to="/blogs"
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Blogs
                    </Link>
                    <Link
                      to="/events"
                      className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Events
                    </Link>
                  </>
                )}
                <div className="px-3 py-2 border-t border-gray-700 mt-2">
                  <p className="text-gray-300 text-sm">{profile.name || user.email}</p>
                  <p className="text-xs text-gray-500 capitalize mb-2">{profile.role}</p>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="btn-secondary w-full text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signingOut ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
