/**
 * Lazily-create a Supabase client only on the browser.
 * - Avoids initializing the client during SSR.
 * - Exposes helpers for strict (throwing) or lenient (nullable) access patterns.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function createClientIfNeeded(): SupabaseClient {
	// read env inside function to avoid server-side compile-time embedding
	const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (client)');
	}

	// require inside function to avoid server-side ESM resolution during build
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { createClient } = require('@supabase/supabase-js');

	_supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
		},
	});

	return _supabase;
}

/**
 * Get a Supabase client (throws if not running in browser or env missing).
 * Use this in client code when you want to fail fast if mis-used.
 */
export function getSupabaseClient(): SupabaseClient {
	if (typeof window === 'undefined') {
		throw new Error('getSupabaseClient() is client-only. Use server-side REST or server client on the server.');
	}
	return _supabase ?? createClientIfNeeded();
}

/**
 * Get a Supabase client or null (safe for libraries that may run server-side).
 */
export function getSupabaseClientOrNull(): SupabaseClient | null {
	if (typeof window === 'undefined') return null;
	try {
		return _supabase ?? createClientIfNeeded();
	} catch {
		return null;
	}
}

/**
 * Backwards-compatible `supabase` export:
 * - It's a proxy that initializes the real client on first property access (client runtime).
 * - Accessing it server-side will throw a clear error to avoid silent failures.
 */
export const supabase = new Proxy(
	{},
	{
		get(_target, prop: string | symbol) {
			if (typeof window === 'undefined') {
				throw new Error('Supabase client is not available on the server. Use server-side REST endpoints instead.');
			}
			const client = getSupabaseClient(); // will create client if needed
			return (client as any)[prop];
		},
	}
) as unknown as SupabaseClient;
