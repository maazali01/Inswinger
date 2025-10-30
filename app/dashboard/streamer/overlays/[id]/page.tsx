'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Simple redirect: view page is not used anymore — go back to overlays list
export default function OverlayViewRedirect() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  useEffect(() => {
    // immediate redirect back to overlays list
    router.replace('/dashboard/streamer/overlays');
  }, [router, params]);
  return null;
}