import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchFromSupabase(path: string) {
	// Defensive: ensure env vars exist before constructing headers (prevents `string | undefined` assignment)
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		// For admin/edit pages it's better to surface a clear error than to silently send a broken request.
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for server-side Supabase requests.');
	}

	const headers: Record<string, string> = {
		apikey: SUPABASE_ANON_KEY,
		Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
		accept: 'application/json',
	};

	const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		headers,
		cache: 'no-store',
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Supabase REST error: ${res.status} ${text}`);
	}
	return res.json();
}

export async function generateStaticParams() {
  try {
    const rows = await fetchFromSupabase('events?select=id&limit=1000');
    return Array.isArray(rows) ? rows.map((r: any) => ({ id: r.id })) : [];
  } catch {
    return [];
  }
}

async function save(formData: FormData) {
  'use server';
  // Defensive checks for env vars
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for server-side Supabase requests.');
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const start = formData.get('start') as string;
  const sport_type = formData.get('sport_type') as string;
  const link = formData.get('link') as string;
  const thumbnail = formData.get('thumbnail') as string;
  const description = formData.get('description') as string;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      title,
      start_time: start || null,
      sport_type: sport_type || null,
      event_url: link || null,
      thumbnail_url: thumbnail || null,
      description: description || null,
    }),
  });
  if (!res.ok) throw new Error('Failed to update event');

  revalidatePath('/admin/events');
  redirect('/admin/events');
}

// Updated remove to accept FormData so it can be used directly as a form action
async function remove(formData: FormData) {
  'use server';
  // Defensive checks for env vars
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for server-side Supabase requests.');
  }

  const id = (formData.get('id') as string) || '';
  if (!id) throw new Error('Missing id for delete action');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete event');

  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const rows = await fetchFromSupabase(`events?id=eq.${params.id}&select=*`);
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className="p-6">Event not found</div>;
  }
  const event = rows[0];

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Save form */}
          <form action={save}>
            <input type="hidden" name="id" value={params.id} />
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input name="title" defaultValue={event.title ?? ''} required />
              </div>
              <div>
                <Label>Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  name="start"
                  defaultValue={event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : ''}
                />
              </div>
              <div>
                <Label>Sport Type</Label>
                <Input name="sport_type" defaultValue={event.sport_type ?? ''} />
              </div>
              <div>
                <Label>Event URL</Label>
                <Input name="link" defaultValue={event.event_url ?? ''} />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input name="thumbnail" defaultValue={event.thumbnail_url ?? ''} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  name="description"
                  defaultValue={event.description ?? ''}
                  className="w-full border rounded px-3 py-2 h-28"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>

          {/* Delete form (uses server action 'remove' and includes hidden id) */}
          <form action={remove} className="mt-3">
            <input type="hidden" name="id" value={params.id} />
            <Button type="submit" variant="destructive">Delete Event</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
