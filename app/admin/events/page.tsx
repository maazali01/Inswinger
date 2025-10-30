'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('events')
      .select('id,title,start_time,sport_type,event_url,thumbnail_url,description')
      .order('start_time', { ascending: true })
      .limit(200);
    if (error) {
      setError(error.message);
      setEvents([]);
    } else {
      setEvents((data ?? []) as any[]);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Manage Events</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/admin/events/new')}>New Event</Button>
          <Button variant="ghost" onClick={fetchEvents}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading events...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Error: {error}</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-slate-600">No events yet.</div>
      ) : (
        <div className="grid gap-4">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex-1">
                  <div className="text-lg font-medium">{ev.title}</div>
                  <div className="text-sm text-slate-500">
                    {ev.start_time ? new Date(ev.start_time).toLocaleString() : 'TBA'} {ev.sport_type ? `• ${ev.sport_type}` : ''}
                  </div>
                  {ev.description && (
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{ev.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ev.link && (
                    <a href={ev.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                      Open
                    </a>
                  )}
                  <Link href={`/admin/events/${ev.id}/edit`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
