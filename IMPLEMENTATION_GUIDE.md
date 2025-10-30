# Implementation Guide for Remaining Features

This guide provides detailed steps for implementing the remaining features outlined in the requirements. The foundation is built and production-ready - this guide helps complete the full vision.

## Priority 1: Video Streaming Infrastructure

### Option A: Livepeer Integration (Recommended for Scale)

**Why Livepeer**: Decentralized, cost-effective, easy to integrate, supports HLS playback

**Implementation Steps**:

1. **Install Livepeer SDK**
```bash
npm install @livepeer/react livepeer
```

2. **Set up Livepeer Client** (`lib/livepeer/client.ts`)
```typescript
import { createReactClient, studioProvider } from '@livepeer/react';

const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: process.env.NEXT_PUBLIC_LIVEPEER_API_KEY! }),
});

export default livepeerClient;
```

3. **Create Stream** (Streamer Dashboard)
```typescript
// Call Livepeer API to create stream
const response = await fetch('https://livepeer.studio/api/stream', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.LIVEPEER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: streamTitle }),
});

const { id, playbackId, streamKey } = await response.json();

// Store in database
await supabase.from('streams').update({
  livepeer_stream_id: id,
  livepeer_playback_id: playbackId,
}).eq('id', streamId);
```

4. **Video Player Component** (`components/video-player.tsx`)
```typescript
'use client';

import { Player } from '@livepeer/react';

export function VideoPlayer({ playbackId }: { playbackId: string }) {
  return (
    <Player
      playbackId={playbackId}
      autoPlay
      muted
      controls
      showLoadingSpinner
    />
  );
}
```

5. **Stream Page** (`app/watch/[slug]/page.tsx`)
- Fetch stream data by slug
- Render VideoPlayer with playbackId
- Show stream info, streamer details
- Implement follow button
- Add related streams section

### Option B: Mux Integration

Similar to Livepeer but using Mux API. Better analytics but higher cost.

### WebRTC Alternative (For Low Latency)

Use WebRTC for peer-to-peer streaming with libraries like PeerJS or MediaSoup. More complex but lower latency.

---

## Priority 2: Real-time Chat System

### Implementation Steps

1. **Enable Supabase Realtime**

In Supabase Dashboard:
- Go to Database > Replication
- Enable realtime for `chats` table

2. **Chat Component** (`components/chat/stream-chat.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

export function StreamChat({ streamId }: { streamId: string }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chats')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await supabase.from('chats').insert({
      stream_id: streamId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <div className="font-semibold">{msg.user?.full_name}:</div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>
      {user && (
        <form onSubmit={sendMessage} className="p-4 border-t">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            className="w-full px-4 py-2 border rounded"
          />
        </form>
      )}
    </div>
  );
}
```

3. **Rate Limiting**

Implement rate limiting in chat:
```typescript
// Check last message time
const { data: lastMessage } = await supabase
  .from('chats')
  .select('created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

const rateLimit = 3; // seconds
if (lastMessage) {
  const timeSince = (Date.now() - new Date(lastMessage.created_at).getTime()) / 1000;
  if (timeSince < rateLimit) {
    toast.error(`Please wait ${Math.ceil(rateLimit - timeSince)} seconds`);
    return;
  }
}
```

---

## Priority 3: Stripe Payment Integration

### Setup Steps

1. **Install Stripe**
```bash
npm install stripe @stripe/stripe-js
```

2. **Environment Variables**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Create Checkout Session API** (`app/api/checkout/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  const { planId, userId } = await request.json();

  // Fetch plan from database
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: planPriceId,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/streamer?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/streamer?canceled=true`,
    metadata: { userId, planId },
  });

  return NextResponse.json({ sessionId: session.id });
}
```

4. **Stripe Webhook Handler** (Supabase Edge Function)

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'npm:stripe@13';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Update user to streamer role
        // Create subscription record
        break;
      case 'invoice.payment_succeeded':
        // Update subscription status
        break;
      case 'customer.subscription.deleted':
        // Handle cancellation
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

Deploy Edge Function:
```bash
supabase functions deploy stripe-webhook
```

---

## Priority 4: Blog System

### Implementation

1. **Blog Listing Page** (`app/blog/page.tsx`)

```typescript
export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blogs')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1>Blog</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

2. **Blog Post Page** (`app/blog/[slug]/page.tsx`)

```typescript
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { data: post } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  return {
    title: post.title,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      images: [post.featured_image],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { data: post } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

3. **Blog Editor** (Admin CMS)

Install rich text editor:
```bash
npm install @tiptap/react @tiptap/starter-kit
```

---

## Priority 5: Admin CMS

### Implementation Structure

Create admin routes with middleware protection:

```
app/admin/
├── layout.tsx              # Admin layout with sidebar
├── page.tsx                # Dashboard overview
├── users/page.tsx          # User management
├── streamers/page.tsx      # Streamer management
├── streams/page.tsx        # Stream moderation
├── blogs/
│   ├── page.tsx            # Blog list
│   ├── new/page.tsx        # Create blog
│   └── [id]/edit/page.tsx  # Edit blog
├── events/page.tsx         # Events management
└── settings/page.tsx       # Site settings
```

**Admin Layout with Protection**:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminLayout({ children }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      router.push('/');
    }
  }, [profile, loading, router]);

  if (loading || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

---

## SEO Implementation Guide

### 1. Dynamic Sitemap

Create `app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://yourdomain.com';

  // Fetch dynamic content
  const { data: streams } = await supabase
    .from('streams')
    .select('slug, updated_at')
    .eq('visibility', 'public');

  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug, updated_at')
    .eq('published', true);

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/browse`, lastModified: new Date() },
    ...streams.map((s) => ({
      url: `${baseUrl}/watch/${s.slug}`,
      lastModified: new Date(s.updated_at),
    })),
    ...blogs.map((b) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: new Date(b.updated_at),
    })),
  ];
}
```

### 2. Robots.txt

Create `app/robots.ts`:

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/'],
    },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  };
}
```

### 3. JSON-LD Structured Data

Add to stream pages:

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: stream.title,
  description: stream.description,
  thumbnailUrl: stream.thumbnail_url,
  uploadDate: stream.created_at,
  contentUrl: `https://yourdomain.com/watch/${stream.slug}`,
};

// In page component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

---

## Testing Strategy

### Unit Tests

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Example test (`__tests__/components/navbar.test.tsx`):

```typescript
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/navbar';

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: null, profile: null, loading: false }),
}));

describe('Navbar', () => {
  it('renders logo and navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('StreamHub')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
  });
});
```

### E2E Tests

```bash
npm install --save-dev @playwright/test
```

Example test (`e2e/auth.spec.ts`):

```typescript
import { test, expect } from '@playwright/test';

test('user can sign up', async ({ page }) => {
  await page.goto('http://localhost:3000/signup');
  await page.click('text=Join as Viewer');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Deployment Checklist

- [ ] Set up production Supabase project
- [ ] Configure environment variables in Vercel
- [ ] Set up Stripe webhook endpoint
- [ ] Configure custom domain and SSL
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for media assets
- [ ] Set up database backups
- [ ] Configure CORS policies
- [ ] Test all authentication flows
- [ ] Verify RLS policies are working
- [ ] Test payment flows end-to-end
- [ ] Run Lighthouse audit
- [ ] Test on mobile devices
- [ ] Set up monitoring alerts

---

## Performance Optimization

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src={stream.thumbnail_url}
  alt={stream.title}
  width={640}
  height={360}
  loading="lazy"
/>
```

### Database Query Optimization

- Use `.select()` to fetch only needed columns
- Implement pagination for large lists
- Add database indexes for frequently queried columns
- Use `.maybeSingle()` instead of `.single()` for optional records

### Caching Strategy

```typescript
// app/browse/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BrowsePage() {
  // This page will be cached and revalidated
}
```

---

## Monitoring & Analytics

### Set up Sentry

```bash
npm install @sentry/nextjs
```

### Add Google Analytics

```typescript
// app/layout.tsx
import Script from 'next/script';

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

---

This implementation guide provides the roadmap to complete all remaining features. The foundation is solid - follow these steps to build out the full platform.
