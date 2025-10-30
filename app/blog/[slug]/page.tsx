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

// Generate static params so "output: export" doesn't fail during export
export async function generateStaticParams() {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
	const rows = await fetchFromSupabase('blogs?select=slug&published=eq.true&limit=1000');
	if (!Array.isArray(rows)) return [];

	const variants: { slug: string }[] = [];
	function pushIfValid(s: string | null | undefined) {
		if (!s) return;
		const t = String(s).trim();
		if (!t) return;
		variants.push({ slug: t });
	}

	for (const r of rows) {
		if (!r || typeof r.slug !== 'string' || r.slug.length === 0) continue;
		const raw = r.slug.trim();

		// common encodings
		const encoded = encodeURIComponent(raw); // standard encoding
		const doubleEncoded = encodeURIComponent(encoded); // double-encoded
		const plus = raw.replace(/\s+/g, '+'); // spaces as plus
		const encodedPlus = encodeURIComponent(plus);

		// prefixed forms Next sometimes requests during export
		const prefixed = `/blog/${raw}`;
		const prefixedEncoded = `/blog/${encoded}`;
		const prefixedDouble = `/blog/${doubleEncoded}`;
		const prefixedPlus = `/blog/${plus}`;
		const prefixedEncodedPlus = `/blog/${encodedPlus}`;

		// leading slash variants (some systems include leading slash)
		const leadRaw = `/${raw}`;
		const leadEncoded = `/${encoded}`;

		// push a broad set of variants
		pushIfValid(raw);
		pushIfValid(encoded);
		pushIfValid(doubleEncoded);
		pushIfValid(plus);
		pushIfValid(encodedPlus);

		pushIfValid(prefixed);
		pushIfValid(prefixedEncoded);
		pushIfValid(prefixedDouble);
		pushIfValid(prefixedPlus);
		pushIfValid(prefixedEncodedPlus);

		pushIfValid(leadRaw);
		pushIfValid(leadEncoded);

		// truncated at common separators (colon, dash, pipe, parentheses)
		const truncated = raw.split(/[:|—–\-\(|\)]/)[0].trim();
		if (truncated && truncated !== raw) {
			pushIfValid(truncated);
			pushIfValid(encodeURIComponent(truncated));
			pushIfValid(`/blog/${encodeURIComponent(truncated)}`);
			// also first N words
			const words = truncated.split(/\s+/).slice(0, 5).join(' ').trim();
			if (words && words !== truncated) {
				pushIfValid(words);
				pushIfValid(encodeURIComponent(words));
				pushIfValid(`/blog/${encodeURIComponent(words)}`);
			}
		}

		// first N words variant (useful when links use shorter titles)
		const firstWords = raw.split(/\s+/).slice(0, 5).join(' ').trim();
		if (firstWords && firstWords !== raw) {
			pushIfValid(firstWords);
			pushIfValid(encodeURIComponent(firstWords));
			pushIfValid(`/blog/${encodeURIComponent(firstWords)}`);
		}
	}

	// dedupe and return
	const seen = new Set<string>();
	return variants.filter(v => {
		if (seen.has(v.slug)) return false;
		seen.add(v.slug);
		return true;
	});
}

function normalizeIncomingSlug(paramSlug: string) {
	// Strip leading "/blog/" or "blog/" if present, then decode
	const withoutPrefix = paramSlug.replace(/^\/?blog\/?/i, '');
	return decodeURIComponent(withoutPrefix);
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
	const canonical = `${APP_URL}/blog/${encodeURIComponent(params.slug)}`;

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
