/**
 * Create the Supabase client only on the client runtime.
 * This prevents server-side bundling of @supabase/* packages which
 * triggers "Critical dependency: the request of a dependency is an expression"
 * warnings during the Next.js build.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
	// Only create/import on the browser runtime
	if (typeof window === 'undefined') return null;
	if (_supabase) return _supabase;

	// Use require to avoid static server-side ESM resolution
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { createClient } = require('@supabase/supabase-js');

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		// if env missing on client, return null (callers should handle)
		return null;
	}

	_supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
		},
	});

	return _supabase;
}

// default export kept for compatibility; may be null on server
export const supabase = getSupabaseClient();
