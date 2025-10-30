'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Overlays feature removed — redirect to streamer dashboard
export default function OverlaysIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/streamer');
  }, [router]);
  return null;
}