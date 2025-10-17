# Deployment Guide

This guide covers deploying the Lenkersdorfer CRM to production using Vercel and Supabase.

## Prerequisites

- Vercel account (free tier works)
- Supabase project set up (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
- GitHub repository with your code

## Step 1: Prepare Supabase for Production

### 1.1 Review Row Level Security (RLS)
Ensure all RLS policies are enabled:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### 1.2 Configure Production URL
In Supabase Project Settings > General:
- Set custom domain (optional)
- Enable SSL certificate
- Note down production URL

### 1.3 Set up Email Templates
Go to Authentication > Email Templates and customize:
- Confirmation email
- Password reset
- Magic link (if enabled)

### 1.4 Enable Database Backups
Project Settings > Database:
- Enable automated daily backups
- Configure backup retention (7-30 days)

### 1.5 Review Connection Pooling
For production scale:
- Enable connection pooling in Project Settings
- Use pooled connection string in serverless functions
- Set appropriate pool size (start with 15-20)

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and login
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository

### 2.2 Configure Environment Variables

Add these environment variables in Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Analytics, monitoring, etc.
# NEXT_PUBLIC_GOOGLE_ANALYTICS=GA-XXXXXXXXX
```

### 2.3 Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or higher

### 2.4 Deploy

Click "Deploy" and wait for build to complete.

## Step 3: Post-Deployment Verification

### 3.1 Test Authentication
1. Visit your production URL
2. Create a new user account
3. Verify email confirmation works
4. Test login/logout flow
5. Check password reset flow

### 3.2 Test Core Functionality
- [ ] Create new client
- [ ] Add watch to inventory
- [ ] Add client to waitlist
- [ ] Record purchase
- [ ] Verify commission calculations
- [ ] Check VIP tier updates
- [ ] Test allocation system

### 3.3 Monitor Performance
Initial checks:
- Page load time < 3s
- API response time < 200ms
- No console errors
- Supabase connections < 10

## Step 4: Production Optimizations

### 4.1 Enable Caching
In `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 4.2 Set up Monitoring

**Vercel Analytics**:
- Enable in Project Settings > Analytics
- Monitor Core Web Vitals

**Supabase Monitoring**:
- Set up alerting for high connection count
- Monitor query performance in Dashboard

**Error Tracking** (Optional):
- Set up Sentry or similar
- Add error boundary reporting

### 4.3 Configure Rate Limiting

Add to Supabase Edge Functions:

```typescript
import { rateLimit } from '@supabase/edge-runtime'

const limiter = rateLimit({
  max: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
})
```

### 4.4 Database Indexing

Ensure critical indexes exist:

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_client ON purchases(client_id);
```

## Step 5: Security Hardening

### 5.1 Environment Variables
- Never commit `.env.local` to git
- Rotate Supabase service role key quarterly
- Use least privilege for API keys

### 5.2 Content Security Policy
Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

### 5.3 API Route Protection
All API routes already check authentication:
- Review RLS policies
- Ensure no admin endpoints exposed
- Validate all user inputs

## Step 6: Scaling Considerations

### When to Scale

**Database**:
- > 1000 concurrent connections
- Query times > 100ms
- Storage > 8GB (free tier limit)

**Actions**:
- Upgrade Supabase plan
- Add read replicas
- Implement caching layer (Redis)

**Frontend**:
- Enable Edge Functions for global latency
- Implement ISR (Incremental Static Regeneration)
- Add CDN for static assets

## Rollback Plan

### Quick Rollback
1. Go to Vercel Deployments
2. Find last working deployment
3. Click "..." > "Promote to Production"
4. Verify functionality

### Database Rollback
1. Access Supabase Dashboard
2. Go to Database > Backups
3. Select backup point
4. Click "Restore"
5. Run migrations forward if needed

## Troubleshooting

### Issue: API Routes Return 401
**Cause**: Supabase auth not working
**Fix**:
- Check environment variables
- Verify Supabase URL/keys
- Check browser console for auth errors

### Issue: Build Fails on Vercel
**Cause**: TypeScript errors or missing env vars
**Fix**:
- Check Vercel build logs
- Ensure all env vars set
- Test build locally: `npm run build`

### Issue: Slow Query Performance
**Cause**: Missing indexes or inefficient queries
**Fix**:
- Enable query logging in Supabase
- Add indexes on filtered columns
- Optimize complex joins

### Issue: High Database Connection Count
**Cause**: Too many concurrent users or connection leaks
**Fix**:
- Enable connection pooling
- Review and close unused connections
- Implement connection limits per user

## Maintenance

### Daily
- Check error logs in Vercel
- Monitor Supabase metrics
- Review API response times

### Weekly
- Review user feedback
- Check database size growth
- Analyze slow queries
- Review security logs

### Monthly
- Update dependencies: `npm update`
- Review and optimize queries
- Database vacuum and analyze
- Review and update RLS policies
- Security audit

### Quarterly
- Rotate secrets and API keys
- Full security audit
- Performance benchmark
- Disaster recovery test

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Supabase RLS policies enabled
- [ ] Email templates configured
- [ ] Database backups enabled
- [ ] SSL certificate active
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Rate limiting configured
- [ ] Database indexes created
- [ ] Security headers configured
- [ ] Test user accounts created
- [ ] Documentation updated
- [ ] Rollback plan tested
- [ ] Monitoring alerts configured
- [ ] Support contact set up

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Emergency Contact**: [Your contact info]

## Useful Commands

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs [deployment-url]

# Environment variables
vercel env pull

# Check build locally
npm run build
npm run start
```
