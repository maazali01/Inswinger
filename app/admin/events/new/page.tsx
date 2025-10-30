import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// import { supabase } from '@/lib/supabase/client'; // Removed to avoid server-side bundling
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function create(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  const start = formData.get('start') as string;
  const sport_type = formData.get('sport_type') as string;
  const link = formData.get('link') as string;
  const thumbnail = formData.get('thumbnail') as string;
  const description = formData.get('description') as string;

  if (!title) throw new Error('Title is required');

  // Defensive: ensure env vars exist before constructing headers
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY on server');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      start_time: start || null,
      sport_type: sport_type || null,
      event_url: link || null,
      thumbnail_url: thumbnail || null,
      description: description || null,
    }),
  });
  if (!res.ok) throw new Error('Failed to create event');

  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export default function NewEventPage() {
  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={create}>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input name="title" required placeholder="Event title" />
              </div>
              <div>
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" name="start" />
              </div>
              <div>
                <Label>Sport Type</Label>
                <Input name="sport_type" placeholder="e.g. Football, Basketball" />
              </div>
              <div>
                <Label>Event URL</Label>
                <Input name="link" placeholder="https://..." />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input name="thumbnail" placeholder="https://..." />
              </div>
              <div>
                <Label>Description</Label>
                <textarea name="description" className="w-full border rounded px-3 py-2 h-28" placeholder="Optional event details..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Create Event</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
