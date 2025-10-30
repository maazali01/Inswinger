'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// New overlay page removed — redirect to streamer dashboard
export default function NewOverlayRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/streamer');
  }, [router]);
  return null;
}