/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track latest profile to avoid stale closure inside auth listener
  const profileRef = useRef(null);

  // Track the id of the currently loaded profile so we can avoid refetches
  const loadedProfileIdRef = useRef(null);

  useEffect(() => {
    profileRef.current = profile;
    loadedProfileIdRef.current = profile?.id ?? null;
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (!mounted) return;

        try {
          // Handle different auth events
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setLoading(false);
          } else if (event === 'TOKEN_REFRESHED') {
            // Token refresh should be silent — do not toggle global loading.
            // Only (re)load profile if we don't already have it OR the user id changed.
            console.log('Token refreshed successfully');
            setUser(session?.user ?? null);
            if (session?.user) {
              const incomingId = session.user.id;
              if (!loadedProfileIdRef.current || loadedProfileIdRef.current !== incomingId) {
                await loadUserProfile(incomingId, { silent: true });
              } // else: profile already loaded for this user -> skip refetch
            }
            // if no session.user, let the finally block clear loading
           } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setUser(session?.user ?? null);
            if (session?.user) {
              const incomingId = session.user.id;
              // Avoid unnecessary refetch if profile for this user is already loaded
              if (!loadedProfileIdRef.current || loadedProfileIdRef.current !== incomingId) {
                await loadUserProfile(incomingId);
              } // else: skip refetch
            } else {
              setProfile(null);
              setLoading(false);
            }
           } else {
            setUser(session?.user ?? null);
            if (session?.user) {
              const incomingId = session.user.id;
              if (!loadedProfileIdRef.current || loadedProfileIdRef.current !== incomingId) {
                await loadUserProfile(incomingId);
              }
            } else {
              setProfile(null);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
        } finally {
          // Ensure loading is cleared after handling the auth event
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId, options = {}) => {
    const { silent = false } = options;
    try {
      // Only flip global loading if we don't have a profile yet
      if (!silent && !profileRef.current) setLoading(true);
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setProfile(userProfile);
      // Remember that we've loaded this profile id to avoid redundant fetches
      loadedProfileIdRef.current = userProfile?.id ?? null;
      if (!silent && !profileRef.current) setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // If profile not found or auth error, sign out
      if (error.code === 'PGRST116' || error.message?.includes('JWT') || error.message?.includes('JWS')) {
        console.log('Profile not found or auth error, signing out...');
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
      }
      if (!silent) setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut: async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setProfile(null);
      } catch (error) {
        console.error('Sign out error:', error);
        // Force clear auth state even if signOut fails
        setUser(null);
        setProfile(null);
        localStorage.removeItem('inswinger-auth');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
