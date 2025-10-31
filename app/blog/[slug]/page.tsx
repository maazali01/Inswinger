import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// REMOVE hard throw; degrade gracefully if env missing

const restHeaders =
	SUPABASE_URL && SUPABASE_ANON_KEY
		? {
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
				accept: 'application/json',
		  }
		: undefined as any;

async function fetchFromSupabase(path: string) {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
	const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		headers: restHeaders,
		next: { revalidate: 3600 }, // use ISR for blog post requests
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Supabase REST error: ${res.status} ${text}`);
	}
	return res.json();
}

// helper used when generating static params to produce simple, safe slugs
function cleanForStaticParam(s: unknown): string | null {
	if (s === null || s === undefined) return null;
	let t = String(s).trim();
	if (!t) return null;
	// remove leading /blog/ or leading slashes
	t = t.replace(/^\/?blog\/?/i, '').replace(/^\/+/, '');
	// decode if possible, fallback to raw
	try {
		t = decodeURIComponent(t);
	} catch {}
	// discard empty or obviously malformed values
	if (!t) return null;
	// avoid pushing variants that still contain a slash (keep only slug part)
	if (t.includes('/')) t = t.split('/').pop() ?? t;
	return t || null;
}

// Generate static params so "output: export" doesn't fail during export
export async function generateStaticParams() {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
	const rows = await fetchFromSupabase('blogs?select=slug&published=eq.true&limit=1000');
	if (!Array.isArray(rows)) return [];

	const variants: { slug: string }[] = [];
	const seen = new Set<string>();

	for (const r of rows) {
		const raw = r?.slug ?? null;
		const cleaned = cleanForStaticParam(raw);
		if (cleaned && !seen.has(cleaned)) {
			seen.add(cleaned);
			variants.push({ slug: cleaned });
		}
		// also consider first N words as additional slug variants (safe)
		if (cleaned) {
			const firstWords = cleaned.split(/\s+/).slice(0, 5).join(' ').trim();
			if (firstWords && !seen.has(firstWords)) {
				seen.add(firstWords);
				variants.push({ slug: firstWords });
			}
		}
	}

	return variants;
}

// Normalize incoming slug safely (coerce to string first)
function normalizeIncomingSlug(paramSlug: unknown) {
	// coerce to string, strip leading "/blog/" or "blog/" if present, then decode
	const raw = String(paramSlug ?? '').trim();
	const withoutPrefix = raw.replace(/^\/?blog\/?/i, '');
	try {
		return decodeURIComponent(withoutPrefix);
	} catch {
		// if decoding fails, return the raw cleaned string
		return withoutPrefix;
	}
}

// add: same sanitizeTitle helper to clean CDATA/quotes/entities for blog titles
function sanitizeTitle(raw?: string | null) {
	if (!raw) return '';
	let t = String(raw).trim();
	t = t.replace(/<!\[CDATA\[(.*?)\]\]>/i, '$1');
	t = t.replace(/^[\u0022\u0027\u2018\u2019\u201C\u201D]+|[\u0022\u0027\u2018\u2019\u201C\u201D]+$/g, '').trim();
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&#8217;': "'",
		'&#8216;': "'",
		'&#8220;': '"',
		'&#8221;': '"',
	};
	t = t.replace(/&[#A-Za-z0-9]+;/g, (m) => entities[m] ?? m);
	return t;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { title: 'Post not found' };
	// normalize incoming slug (handles encoded/raw/prefixed)
	const rawSlug = normalizeIncomingSlug(params.slug);
	const encoded = encodeURIComponent(rawSlug);
	const rows = await fetchFromSupabase(
		`blogs?select=title,meta_description,featured_image&slug=eq.${encoded}&limit=1`
	);
	const data = Array.isArray(rows) && rows[0] ? rows[0] : null;
	if (!data) return { title: 'Post not found' };
	// use the normalized raw slug for canonical URLs (avoid prefixed/encoded params.slug)
	const canonical = `${APP_URL.replace(/\/$/, '')}/blog/${encodeURIComponent(rawSlug)}`;

	return {
		title: sanitizeTitle(data.title),
		description: data.meta_description ?? undefined,
		alternates: { canonical },
		openGraph: {
			title: sanitizeTitle(data.title),
			description: data.meta_description ?? undefined,
			url: canonical,
			images: data.featured_image ? [data.featured_image] : undefined,
			type: 'article',
			siteName: 'StreamHub',
		},
		twitter: {
			card: 'summary_large_image',
			title: sanitizeTitle(data.title),
			description: data.meta_description ?? undefined,
			images: data.featured_image ? [data.featured_image] : undefined,
		},
	};
}

// small HTML-escape helper and text->HTML converter for plain-text posts
function escapeHtml(str: string) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function textToHtml(input?: string | null) {
	if (!input) return '';
	const t = String(input).trim();
	// if content already contains HTML tags, return as-is
	if (/[<][a-z][\s\S]*[>]/i.test(t)) return t;
	// normalize CRLF -> LF
	const normalized = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	// split paragraphs on empty line(s)
	const paragraphs = normalized.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
	const html = paragraphs.map(p => {
		// single newlines inside a paragraph -> <br/>
		const withBreaks = escapeHtml(p).replace(/\n/g, '<br/>');
		return `<p>${withBreaks}</p>`;
	}).join('');
	return html;
}

export const revalidate = 3600; // cache individual blog posts for 1 hour

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
	// If env missing, no DB; notFound
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		notFound();
	}

	// normalize incoming slug (handles encoded/raw/prefixed)
	const rawSlug = normalizeIncomingSlug(params.slug);
	const encoded = encodeURIComponent(rawSlug);

	const posts = await fetchFromSupabase(
		`blogs?select=id,title,content,featured_image,published_at,author_id&slug=eq.${encoded}&limit=1`
	);
	const post = Array.isArray(posts) && posts[0] ? posts[0] : null;

	if (!post) {
		notFound();
	}

	// prepare HTML for rendering: prefer existing HTML, otherwise convert plain text
	const contentHtml = textToHtml(post.content);

	let author: { full_name?: string; avatar_url?: string } | null = null;
	if (post.author_id) {
		const authors = await fetchFromSupabase(
			`profiles?select=full_name,avatar_url&id=eq.${encodeURIComponent(post.author_id)}&limit=1`
		);
		author = Array.isArray(authors) && authors[0] ? authors[0] : null;
	}

	return (
		// mobile-first responsive article layout
		<main className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6">
			<div className="max-w-7xl mx-auto">
				{/* Back / meta row */}
				<div className="mb-6 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link
							href="/blog"
							className="inline-flex items-center text-sm text-slate-600 hover:text-slate-800"
							aria-label="Back to blog list"
						>
							<span className="sr-only">Back to blog</span>
							&larr; Back
						</Link>
					</div>

					{/* Date and author summary on larger screens */}
					<div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
						{author?.full_name && <div>By {author.full_name}</div>}
						{post.published_at && <div>{new Date(post.published_at).toLocaleDateString()}</div>}
					</div>
				</div>

				{/* Main content area */}
				<article className="bg-white rounded-xl shadow-sm overflow-hidden">
					{/* Featured image */}
					{post.featured_image && (
						<div className="w-full">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={post.featured_image}
								alt={sanitizeTitle(post.title)}
								loading="lazy"
								className="w-full object-cover h-52 sm:h-72 md:h-96"
								style={{ width: '100%', display: 'block' }}
							/>
						</div>
					)}

					{/* Article inner */}
					<div className="px-4 py-6 sm:px-8 sm:py-10">
						<header className="max-w-3xl mx-auto">
							<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-3 text-slate-900">
								{sanitizeTitle(post.title)}
							</h1>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div className="flex items-center gap-3">
									{author?.avatar_url ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={author.avatar_url}
											alt={author.full_name ?? 'Author'}
											className="w-9 h-9 rounded-full object-cover"
										/>
									) : (
										<div className="w-9 h-9 rounded-full bg-slate-200" />
									)}
									<div className="text-sm">
										<div className="font-medium text-slate-800">{author?.full_name ?? 'Author'}</div>
										{post.published_at && (
											<div className="text-xs text-slate-500">
												{new Date(post.published_at).toLocaleDateString()}
											</div>
										)}
									</div>
								</div>

								{/* Share / actions */}
								<div className="flex items-center gap-3">
									<a
										href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(
											typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
												? `${process.env.NEXT_PUBLIC_APP_URL}/blog/${encodeURIComponent(params.slug)}`
												: `/blog/${encodeURIComponent(params.slug)}`
										)}`}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-slate-600 hover:text-slate-900"
										aria-label={`Share "${sanitizeTitle(post.title)}" on Twitter`}
									>
										Twitter
									</a>
									<a
										href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(
											typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
												? `${process.env.NEXT_PUBLIC_APP_URL}/blog/${encodeURIComponent(params.slug)}`
												: `/blog/${encodeURIComponent(params.slug)}`
										)}`}
										className="text-sm text-slate-600 hover:text-slate-900"
										aria-label={`Email this article: "${sanitizeTitle(post.title)}"`}
									>
										Email
									</a>
								</div>
							</div>
						</header>

						{/* Content */}
						<main className="mt-8 max-w-3xl mx-auto">
							<div className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-slate">
								{/* Render HTML content safely (converted if needed) */}
								<div dangerouslySetInnerHTML={{ __html: contentHtml }} />
							</div>

							{/* Small CTA / continue reading */}
							<div className="mt-10 border-t pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900">
										&larr; Back to articles
									</Link>
								</div>
								<div className="text-sm text-slate-500">
									{/* placeholder for tags or read time */}
									{ /* e.g. Published: {new Date(post.published_at).toLocaleDateString()} */ }
								</div>
							</div>
						</main>
					</div>
				</article>
			</div>
		</main>
	);
}
