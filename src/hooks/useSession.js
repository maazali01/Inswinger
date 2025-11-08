import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const useSessionRefresh = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check session validity periodically, but avoid acting on transient errors
    // (browsers can throttle timers in background tabs which may cause transient failures).
    const checkSession = async () => {
      // If tab is hidden, skip the check — avoid background throttling effects
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Only treat explicit auth-related errors as fatal. Otherwise, log and skip.
          const msg = String(error?.message ?? '').toLowerCase();
          const isAuthError = msg.includes('jwt') || msg.includes('not authenticated') || msg.includes('session') || error?.code === 'PGRST301';

          console.warn('Session check error (non-fatal):', error);

          if (isAuthError) {
            // For real auth errors, sign out and navigate to login
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.error('Error during signOut after auth error:', e);
            }
            navigate('/login');
          }

          return;
        }

        // If no session, navigate to login (avoid forcing signOut here — let auth flow handle it)
        if (!session) {
          if (window.location.pathname !== '/login') navigate('/login');
        }
      } catch (error) {
        // Network or transient errors should not force sign-out. Log and continue.
        console.warn('Session refresh exception (ignored):', error);
      }
    };

    // Run check when page becomes visible again (helps after tab switching)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Check session on mount
    checkSession();

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [navigate]);
};

// Hook to handle API errors globally
export const useApiErrorHandler = () => {
  const navigate = useNavigate();

  const handleApiError = async (error) => {
    console.error('API Error:', error);

    // Check if it's an auth error
    if (
      error?.message?.includes('JWT') ||
      error?.message?.includes('session') ||
      error?.message?.includes('not authenticated') ||
      error?.code === 'PGRST301'
    ) {
      console.log('Auth error detected, signing out...');
      await supabase.auth.signOut();
      navigate('/login');
      return true;
    }

    return false;
  };

  return { handleApiError };
};
