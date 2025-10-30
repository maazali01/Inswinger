'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Simple redirect: edit page is not used — go back to overlays list
export default function OverlayEditRedirect() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  useEffect(() => {
    // immediate redirect back to overlays list
    router.replace('/dashboard/streamer/overlays');
  }, [router, params]);
  return null;
}