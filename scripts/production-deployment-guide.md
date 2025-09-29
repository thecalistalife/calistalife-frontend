# CalistaLife Production Deployment Guide

## 🚀 Deployment Checklist

### Frontend Deployment (Netlify)

#### 1. Netlify Setup
```bash
# Connect your Git repository to Netlify
# Build settings:
# - Base directory: frontend
# - Build command: npm ci --production && npm run build  
# - Publish directory: frontend/dist
```

#### 2. Environment Variables (Netlify Dashboard)
Add these via Netlify Dashboard > Site Settings > Environment Variables:

```
VITE_API_URL=https://api.calistalife.com
VITE_APP_ENV=production
VITE_GA4_MEASUREMENT_ID=G-FL9QNKMXPX
VITE_BREVO_CLIENT_KEY=6ewxl4rhcmbnrhir3b33jpgi
VITE_BREVO_MA_SITE_KEY=calista-live-tracking-2024
VITE_SENTRY_DSN={{NETLIFY_SENTRY_DSN}}
```

#### 3. Domain Configuration
- Add custom domain: `calistalife.com`
- Enable HTTPS (automatic via Let's Encrypt)
- Configure DNS records as instructed

### Backend Deployment (Render)

#### 1. Render Service Setup
```bash
# Service Type: Web Service
# Runtime: Node.js
# Build Command: npm ci --production
# Start Command: npm start
```

#### 2. Environment Variables (Render Dashboard)
**CRITICAL: Add these via Render Dashboard > Environment:**

```
NODE_ENV=production
PORT=10000

# Database
DATABASE_URL={{YOUR_DATABASE_URL}}
SUPABASE_URL={{YOUR_SUPABASE_URL}}  
SUPABASE_SERVICE_ROLE_KEY={{YOUR_SUPABASE_SERVICE_ROLE_KEY}}

# Email Service
BREVO_API_KEY={{YOUR_BREVO_API_KEY}}
BREVO_WEBHOOK_SECRET={{GENERATE_RANDOM_SECRET}}

# Security
JWT_SECRET={{GENERATE_RANDOM_SECRET_32_CHARS}}
SESSION_SECRET={{GENERATE_RANDOM_SECRET_32_CHARS}}
ENCRYPTION_KEY={{GENERATE_RANDOM_SECRET_32_CHARS}}

# External APIs
STRIPE_SECRET_KEY={{YOUR_STRIPE_SECRET_KEY}}
TWILIO_AUTH_TOKEN={{YOUR_TWILIO_AUTH_TOKEN}}
SENTRY_DSN={{YOUR_BACKEND_SENTRY_DSN}}

# CORS
FRONTEND_URL=https://calistalife.com
```

#### 3. Custom Domain
- Add custom domain: `api.calistalife.com`
- Configure DNS CNAME record

## 🔍 Post-Deployment Validation

### Automated Tests
```bash
# Run production validation
node scripts/final-production-validation.cjs

# Expected: ≥95% pass rate
# Tests: GA4, Sentry, API connectivity, SSL, performance
```

### Manual Verification
- [ ] Frontend loads at https://calistalife.com
- [ ] Backend API responds at https://api.calistalife.com/health
- [ ] SSL certificates valid (A+ rating)
- [ ] GA4 events tracking
- [ ] Error reporting to Sentry
- [ ] Email sending works via Brevo

## 🚨 Security Verification

### Pre-Deployment
- [ ] No secrets in Git history
- [ ] All backend secrets in Render environment only
- [ ] Frontend contains only VITE_* public variables
- [ ] Secret scanning passes

### Post-Deployment  
- [ ] API endpoints require authentication where needed
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Error messages don't leak sensitive info

## 📊 Monitoring Setup

### Immediate (Day 1)
- [ ] Uptime monitoring (StatusCake/Pingdom)
- [ ] Error tracking (Sentry alerts)
- [ ] Performance monitoring (Core Web Vitals)

### Ongoing (Week 1+)
- [ ] Analytics dashboard (GA4 + custom)
- [ ] Email deliverability monitoring
- [ ] Database performance monitoring
- [ ] Cost monitoring (Render + Netlify usage)

## 🔄 Rollback Plan

If deployment fails:
1. Revert DNS to previous version
2. Restore environment variables
3. Roll back Git commit if needed
4. Investigate issues in staging environment

---

**Next Steps After Deployment:**
1. Run validation suite
2. Monitor for 24 hours
3. Start marketing campaigns
4. Begin KPI tracking