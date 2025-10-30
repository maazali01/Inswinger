# Deployment Guide

This guide walks you through deploying Inswinger to production.

## Prerequisites

- Vercel account (recommended for Next.js)
- Supabase production project
- Domain name (optional but recommended)
- Stripe account (for payments, if implementing)

## Step 1: Prepare Supabase for Production

### 1.1 Create Production Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose organization and fill in details
4. Note your project URL and anon key

### 1.2 Apply Database Migrations

The migrations have already been created in development. To apply to production:

1. In Supabase Dashboard, go to SQL Editor
2. Run the migration scripts in order:
   - `create_core_schema` migration
   - `seed_initial_data` migration

Or use Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 1.3 Verify RLS Policies

1. Go to Authentication > Policies
2. Verify all tables have RLS enabled
3. Test policies with different user roles

### 1.4 Configure Storage (if using)

1. Go to Storage
2. Create buckets:
   - `avatars` (public)
   - `stream-thumbnails` (public)
   - `stream-recordings` (authenticated)

3. Set up storage policies for each bucket

## Step 2: Deploy to Vercel

### 2.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Inswinger production ready"
git branch -M main
git remote add origin https://github.com/yourusername/inswinger.git
git push -u origin main
```

### 2.2 Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next

### 2.3 Environment Variables

Add these in Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL (after deployment, update this)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Stripe (if implementing payments)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Livepeer (if implementing streaming)
LIVEPEER_API_KEY=your-api-key
NEXT_PUBLIC_LIVEPEER_API_KEY=your-public-key
```

### 2.4 Deploy

Click "Deploy" - Vercel will build and deploy your app.

## Step 3: Configure Custom Domain (Optional)

### 3.1 Add Domain in Vercel

1. Go to Project Settings > Domains
2. Add your custom domain
3. Vercel will provide DNS configuration

### 3.2 Update DNS Records

Add these records with your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3.3 Wait for SSL

Vercel automatically provisions SSL certificates. This can take a few minutes.

### 3.4 Update Environment Variables

Update `NEXT_PUBLIC_APP_URL` to your custom domain:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase URLs

In Supabase Dashboard > Authentication > URL Configuration:

1. Site URL: `https://yourdomain.com`
2. Redirect URLs:
   ```
   https://yourdomain.com/**
   https://yourdomain.com/auth/callback
   ```

### 4.2 Set up Stripe Webhooks (if using)

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy webhook secret to environment variables

### 4.3 Create Admin Account

1. Sign up on your production site
2. Go to Supabase Dashboard > Table Editor > profiles
3. Find your account and change `role` to `'admin'`
4. Log out and back in to access admin features

### 4.4 Seed Subscription Plans

If not already done, insert subscription plans:

```sql
INSERT INTO subscription_plans (name, description, price, features, max_concurrent_streams, max_storage_gb, active)
VALUES
  ('Starter', 'Perfect for new streamers', 29.99, '["1 concurrent stream", "10GB storage", "Basic analytics"]'::jsonb, 1, 10, true),
  ('Pro', 'For growing streamers', 79.99, '["3 concurrent streams", "50GB storage", "Advanced analytics"]'::jsonb, 3, 50, true),
  ('Enterprise', 'Maximum features', 199.99, '["Unlimited streams", "500GB storage", "Full analytics"]'::jsonb, 999, 500, true);
```

## Step 5: Testing in Production

### 5.1 Authentication Flow

- [ ] User signup works
- [ ] User login works
- [ ] Streamer signup with plan selection works
- [ ] Password reset works (if implemented)
- [ ] Role-based redirects work correctly

### 5.2 Authorization

- [ ] Users can only access their own data
- [ ] Streamers can access streamer dashboard
- [ ] Admins can access admin panel
- [ ] RLS policies prevent unauthorized access

### 5.3 Core Features

- [ ] Homepage loads correctly
- [ ] Browse page shows streams
- [ ] Filters work on browse page
- [ ] User dashboard loads
- [ ] Streamer dashboard loads
- [ ] All navigation links work

### 5.4 Performance

- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Check page load times
- [ ] Verify images are optimized
- [ ] Test on mobile devices

## Step 6: Monitoring & Analytics

### 6.1 Set up Error Tracking

Install Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

Add to environment variables:
```env
SENTRY_DSN=your-sentry-dsn
```

### 6.2 Set up Analytics

Add Google Analytics or Plausible:

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 6.3 Database Monitoring

1. Enable Supabase monitoring
2. Set up alerts for:
   - High CPU usage
   - Storage limits
   - Connection pool exhaustion

### 6.4 Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

Configure alerts for downtime.

## Step 7: Security Hardening

### 7.1 Security Headers

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 7.2 Rate Limiting

Implement API route rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 7.3 CORS Configuration

In Supabase Dashboard > Settings > API:
- Configure allowed origins
- Limit to your domain only

### 7.4 Environment Variable Security

- Never commit `.env` files
- Rotate secrets regularly
- Use Vercel's encrypted environment variables
- Limit access to production environment

## Step 8: Performance Optimization

### 8.1 Enable Caching

Add to page components:

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### 8.2 Image Optimization

Use Next.js Image:

```typescript
import Image from 'next/image';

<Image
  src={thumbnail}
  alt={title}
  width={640}
  height={360}
  loading="lazy"
/>
```

### 8.3 Database Optimization

- Add indexes for frequently queried columns
- Use connection pooling
- Implement pagination for large datasets
- Cache frequently accessed data

### 8.4 CDN Configuration

Configure Vercel Edge Network:
- Static assets served from edge
- API routes from edge where possible
- Geographically distributed

## Step 9: Backup Strategy

### 9.1 Database Backups

Supabase provides automatic daily backups on paid plans:
- Go to Settings > Backups
- Enable automatic backups
- Test restore process

### 9.2 Code Backups

- GitHub repository is your source of truth
- Tag releases: `git tag v1.0.0`
- Keep production branch separate from development

### 9.3 Media Backups

If using Supabase Storage:
- Set up periodic exports
- Store in S3 or similar
- Test restore process

## Step 10: Scaling Considerations

### 10.1 Database Scaling

As you grow:
- Monitor query performance
- Add read replicas if needed
- Upgrade Supabase plan for more resources
- Consider connection pooling (PgBouncer)

### 10.2 Application Scaling

Vercel auto-scales, but monitor:
- Function execution limits
- Bandwidth usage
- Build minutes

### 10.3 Media Storage Scaling

For large media files:
- Consider dedicated CDN (Cloudflare, CloudFront)
- Use Livepeer/Mux for video (auto-scales)
- Implement lazy loading

### 10.4 Monitoring Metrics

Track these KPIs:
- Response times (< 200ms for API, < 1s for pages)
- Error rates (< 0.1%)
- Uptime (> 99.9%)
- Core Web Vitals (all green)

## Troubleshooting

### Build Fails

1. Check build logs in Vercel
2. Verify all dependencies are in `package.json`
3. Ensure environment variables are set
4. Test build locally: `npm run build`

### Authentication Issues

1. Verify Supabase URL and keys
2. Check redirect URLs in Supabase
3. Clear browser cache and cookies
4. Check RLS policies are correct

### Database Connection Issues

1. Verify Supabase project is running
2. Check connection pooling settings
3. Monitor active connections
4. Verify RLS policies aren't blocking queries

### Performance Issues

1. Run Lighthouse audit
2. Check server response times
3. Optimize database queries
4. Implement caching
5. Use Next.js Image for all images

## Rollback Plan

If deployment has critical issues:

1. **Vercel**: Revert to previous deployment in Vercel dashboard
2. **Database**: Restore from backup in Supabase
3. **DNS**: Point domain back to previous version

## Success Criteria

Your deployment is successful when:

- [ ] All pages load without errors
- [ ] Authentication flows work correctly
- [ ] Role-based access is enforced
- [ ] Database queries are fast (< 100ms)
- [ ] Pages load in < 2 seconds
- [ ] Lighthouse scores > 90
- [ ] No console errors
- [ ] Mobile responsive on all devices
- [ ] SSL certificate is valid
- [ ] Monitoring is set up and working

## Maintenance Tasks

### Daily
- Monitor error rates
- Check uptime
- Review user feedback

### Weekly
- Review analytics
- Check database performance
- Update content (blogs, events)

### Monthly
- Update dependencies
- Review security alerts
- Optimize database queries
- Review and rotate API keys

### Quarterly
- Security audit
- Performance optimization review
- Feature planning
- User feedback analysis

---

## Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

For issues, check:
1. README.md for project overview
2. IMPLEMENTATION_GUIDE.md for feature development
3. This file for deployment issues

---

**Congratulations!** Your Inswinger platform is now live in production. Monitor closely for the first few days and be ready to make adjustments based on real user feedback.
