# Deployment Guide - Inswinger+

## 🚀 Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git init
git add .
git commit -m "Initial commit - Inswinger+ complete"
```

### Step 2: Push to GitHub

```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/inswinger-plus.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

6. Click "Deploy"

Your app will be live in ~2 minutes! 🎉

---

## 🔄 Continuous Deployment

Once connected, every push to `main` auto-deploys:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys!
```

---

## 🌐 Alternative: Deploy to Netlify

### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your app
npm run build

# Deploy
netlify deploy --prod

# Follow prompts and add environment variables when asked
```

### Via Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select repo
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables in Site Settings → Environment
6. Deploy!

---

## 📱 Deploy to Production Supabase

### Development vs Production

**Development** (what you're using now):
- Free tier Supabase project
- Testing and development

**Production** (for real users):
- Paid Supabase project (or keep free tier)
- Better performance and limits

### Steps to Production

1. **Create Production Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (name it "inswinger-plus-prod")

2. **Run Database Setup**
   - Copy all SQL from `SUPABASE_SETUP.md`
   - Run in production project's SQL Editor

3. **Update Environment Variables**
   - Get production URL and anon key
   - Update in Vercel/Netlify:
     ```
     VITE_SUPABASE_URL=https://your-prod-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-prod-anon-key
     ```

4. **Create Production Admin**
   - Sign up through production app
   - Run SQL to promote to admin

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] Using `anon` key in frontend (never `service_role`)
- [ ] All RLS policies are active
- [ ] Email confirmation is enabled (Supabase Auth settings)
- [ ] Rate limiting is configured (Supabase settings)
- [ ] CORS is properly configured
- [ ] Storage bucket policies are correct

---

## 🎯 Post-Deployment

### 1. Test All Features

- [ ] Sign up as user
- [ ] Sign up as streamer
- [ ] Subscribe and upload screenshot
- [ ] Login as admin and approve
- [ ] Add stream types
- [ ] Add streams
- [ ] Watch streams
- [ ] Test live chat
- [ ] Test on mobile

### 2. Monitor Performance

**Vercel**:
- Dashboard → Analytics
- Check load times
- Monitor errors

**Supabase**:
- Dashboard → Database → Performance
- Monitor query performance
- Check RLS policy performance

### 3. Set Up Monitoring

**Recommended Tools**:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Google Analytics** - User analytics

---

## 📊 Scaling Considerations

### When You Grow

**Supabase Free Tier Limits**:
- 500MB database
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users

**Upgrade Triggers**:
- Database > 400MB → Upgrade to Pro ($25/mo)
- Bandwidth > 1.5GB → Upgrade
- Need better support → Upgrade

**Vercel Free Tier**:
- 100GB bandwidth
- Unlimited sites
- Perfect for most projects

---

## 🐛 Deployment Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: "Environment variables not found"
- Add them in Vercel/Netlify dashboard
- Redeploy

### App Loads but Features Don't Work

**Supabase errors in console**:
- Check environment variables are correct
- Verify Supabase project is accessible
- Check browser console for CORS errors

**No data showing**:
- Run database setup SQL
- Check RLS policies
- Verify data exists in Supabase

### Chat Not Working

- Enable Realtime in Supabase project settings
- Check WebSocket connection in Network tab
- Verify RLS policies on `chat_messages`

---

## 🔄 Rollback Procedure

If deployment breaks:

**Vercel**:
1. Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Netlify**:
1. Site Overview → Production deploys
2. Find last working deploy
3. Click "Publish deploy"

**Code**:
```bash
# Revert to previous commit
git log  # Find last good commit
git revert HEAD
git push
```

---

## 📝 Environment Variables Reference

### Required

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional (for future enhancements)

```bash
# If you add payment processing
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# If you add analytics
VITE_GA_TRACKING_ID=G-...

# If you add email service
VITE_SENDGRID_API_KEY=SG...
```

---

## 🎉 Go Live Checklist

Final steps before announcing:

- [ ] Deploy to production
- [ ] Test all user flows
- [ ] Create admin account
- [ ] Add initial content (stream types, blogs)
- [ ] Test on mobile devices
- [ ] Check page load speed
- [ ] Verify SSL certificate (auto with Vercel/Netlify)
- [ ] Set up custom domain (optional)
- [ ] Configure email settings in Supabase
- [ ] Add terms of service / privacy policy pages
- [ ] Set up monitoring and alerts
- [ ] Create backup plan for database

---

## 🌟 Custom Domain Setup

### Vercel

1. Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Wait for verification (~10 mins)

### Netlify

1. Site settings → Domain management
2. Add custom domain
3. Update DNS records
4. Enable HTTPS (automatic)

**DNS Records** (example):
```
Type: A
Name: @
Value: [Provided by Vercel/Netlify]

Type: CNAME
Name: www
Value: [Your app URL]
```

---

## 📈 Post-Launch Marketing

Once live:

1. **Product Hunt** - Launch and get feedback
2. **Reddit** - Share in r/webdev, r/reactjs
3. **Twitter** - Tweet with screenshots
4. **Dev.to** - Write article about building it
5. **GitHub** - Add to awesome lists

---

## 🎓 Maintenance

### Regular Tasks

**Weekly**:
- Check error logs
- Monitor Supabase usage
- Review user feedback

**Monthly**:
- Update dependencies: `npm update`
- Check security alerts
- Review and optimize queries

**Quarterly**:
- Major dependency updates
- Performance audit
- Security audit

---

## 💰 Cost Estimate

### Free Tier (Perfect for MVP)

- **Vercel**: Free
- **Supabase**: Free (up to limits)
- **Domain**: ~$12/year (optional)

**Total**: $0-12/year

### Production Scale (1000+ users)

- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Domain**: $12/year
- **Monitoring tools**: $0-50/month

**Total**: $45-95/month

---

## ✅ Deployment Complete!

Your app is now:
- ✅ Live on the internet
- ✅ Auto-deploying on push
- ✅ SSL secured (HTTPS)
- ✅ Ready for users
- ✅ Monitored and scalable

**Next**: Share your app and get users! 🚀

---

**Questions?** Check the main README.md or QUICKSTART.md
