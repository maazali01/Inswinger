'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Overlay view removed — redirect to streamer dashboard
export default function OverlayViewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/streamer');
  }, [router]);
  return null;
}