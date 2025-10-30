'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Overlay edit removed — redirect to streamer dashboard
export default function OverlayEditRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/streamer');
  }, [router]);
  return null;
}