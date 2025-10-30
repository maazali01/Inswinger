'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export default function HomeGate() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const hero = document.getElementById('hero-guest');
    const authed = document.getElementById('authed-content');
    const placeholder = document.getElementById('home-placeholder');
    if (!hero || !authed || !placeholder) return;

    const showHero = () => {
      hero.classList.remove('hidden');
      authed.classList.add('hidden');
      placeholder.classList.add('hidden');
    };
    const showAuthed = () => {
      authed.classList.remove('hidden');
      hero.classList.add('hidden');
      placeholder.classList.add('hidden');
    };

    // Fast path: infer auth from Supabase localStorage token to avoid guest flash
    if (typeof window !== 'undefined') {
      try {
        const hasSbToken = Object.keys(localStorage).some(
          (k) => k.includes('sb-') && k.includes('auth')
        );
        if (hasSbToken) {
          showAuthed();
        } else {
          showHero();
        }
      } catch {
        // If localStorage not accessible, keep placeholder until useAuth resolves
      }
    }

    // Confirm with actual auth context once ready
    if (!loading) {
      if (user) showAuthed();
      else showHero();
    }
  }, [user, loading]);

  return null;
}
