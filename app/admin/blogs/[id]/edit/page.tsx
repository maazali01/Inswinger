import { notFound } from 'next/navigation';
import EditBlogClient from '@/components/admin/EditBlogClient';

// Server-side: use REST to list blog ids for export and fetch initial blog data
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	// Fail fast during build/runtime if env missing
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const restHeaders = {
	apikey: SUPABASE_ANON_KEY,
	Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
	accept: 'application/json',
};

async function fetchFromSupabase(path: string) {
	const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		headers: restHeaders,
		cache: 'no-store',
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Supabase REST error: ${res.status} ${text}`);
	}
	return res.json();
}

export async function generateStaticParams() {
	try {
		const rows = await fetchFromSupabase('blogs?select=id&limit=1000');
		if (!Array.isArray(rows)) return [];
		return rows
			.filter((r: any) => r && (typeof r.id === 'string' || typeof r.id === 'number'))
			.map((r: any) => ({ id: String(r.id) }));
	} catch (e) {
		return [];
	}
}

export default async function EditBlogPage({ params }: { params: { id: string } }) {
	const rawId = String(params.id);
	const rows = await fetchFromSupabase(`blogs?select=id,title,slug,content,published,published_at,updated_at,author_id&id=eq.${encodeURIComponent(rawId)}&limit=1`);
	const post = Array.isArray(rows) && rows[0] ? rows[0] : null;

	if (!post) {
		notFound();
	}

	// Render client component and pass initial data (server -> client)
	return <EditBlogClient initialData={post} />;
}
