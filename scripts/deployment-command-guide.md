# CalistaLife Production Deployment Guide
## Netlify Frontend + Render Backend Deployment

> **⚠️ SECURITY FIRST**: Never commit secrets to git. Always use environment variables in CI/CD platforms.

---

## 🚀 Pre-Deployment Checklist

### 1. Repository Status
```bash
# Ensure all code is committed and pushed
git status
git add .
git commit -m "Production-ready deployment with environment configurations"
git push origin main

# Verify no secrets in repository
git log --oneline -p | grep -E "(xkeysib-|sk_live_|eyJ)" || echo "✅ No secrets found"
```

### 2. Environment Files Validation
```bash
# Check .env files are in .gitignore
cat .gitignore | grep -E "\.env" || echo "⚠️ Add .env files to .gitignore"

# Verify environment templates exist
ls -la .env.example .env.development .env.production.template 2>/dev/null || echo "⚠️ Missing environment templates"
```

---

## 📦 Frontend Deployment (Netlify)

### Step 1: Create Netlify Site
1. **Manual Setup**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select branch: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **CLI Setup** (Alternative):
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --prod
```

### Step 2: Configure Netlify Environment Variables
**⚠️ CRITICAL: Only set PUBLIC frontend variables on Netlify**

Navigate to: Site Settings → Environment Variables

```bash
# PUBLIC Frontend Variables (safe to expose)
VITE_GA4_MEASUREMENT_ID=G-FL9QNKMXPX
VITE_SENTRY_DSN=https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_ENV=production
```

### Step 3: Deploy and Get URL
```bash
# Note your Netlify URL for backend CORS configuration
# Example: https://luminous-douhua-a1b2c3.netlify.app
```

---

## 🛠️ Backend Deployment (Render)

### Step 1: Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `calista-backend`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Starter` (free tier)

### Step 2: Configure Render Environment Variables
**⚠️ CRITICAL: Set ALL backend secrets on Render (never on frontend)**

In Render dashboard → Environment tab:

```bash
# Database & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Email Marketing
BREVO_API_KEY=xkeysib-your-brevo-api-key

# Error Monitoring
SENTRY_DSN=https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904

# Security
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
CORS_ORIGIN=https://your-netlify-site.netlify.app

# Environment
NODE_ENV=production
PORT=10000
```

### Step 3: Configure CORS for Frontend
Ensure your backend CORS configuration accepts your Netlify frontend URL:

```javascript
// In your backend CORS configuration
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-netlify-site.netlify.app',
  credentials: true
}));
```

---

## ✅ Post-Deployment Validation

### Step 1: Run Automated Validation
```bash
# Install dependencies for validation
npm install axios

# Run validation with your actual URLs
node scripts/production-deployment-validator.cjs \
  --frontend https://your-netlify-site.netlify.app \
  --backend https://your-render-backend.onrender.com
```

### Step 2: Manual Validation Checklist

#### Frontend Validation
- [ ] ✅ Site loads without errors
- [ ] ✅ HTTPS certificate is valid
- [ ] ✅ GA4 tracking loads (check Network tab)
- [ ] ✅ No console errors related to environment variables
- [ ] ✅ Backend API calls work (check Network tab)

#### Backend Validation  
- [ ] ✅ Health endpoint responds: `curl https://your-render-backend.onrender.com/health`
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ Database connectivity works
- [ ] ✅ Email service connectivity works
- [ ] ✅ Error monitoring (Sentry) receives test errors

#### Integration Testing
- [ ] ✅ Frontend can reach backend APIs
- [ ] ✅ CORS is properly configured
- [ ] ✅ Authentication flow works end-to-end
- [ ] ✅ Email notifications are sent successfully

---

## 🔐 Security Validation

### Environment Variable Security Check
```bash
# Check no secrets are exposed in frontend
curl -s https://your-netlify-site.netlify.app | grep -E "(xkeysib|sk_live|service_role)" && echo "🔥 SECURITY BREACH!" || echo "✅ Frontend secure"

# Verify backend environment
curl -s https://your-render-backend.onrender.com/api/env-check
```

### Access Control Validation
- [ ] ✅ Frontend cannot access backend secrets
- [ ] ✅ Database service role key is only on backend
- [ ] ✅ Email API key is only on backend  
- [ ] ✅ JWT secret is only on backend
- [ ] ✅ All secrets use CI/CD environment injection

---

## 📊 Monitoring Setup

### Sentry Error Monitoring
1. **Frontend**: Errors automatically tracked via `VITE_SENTRY_DSN`
2. **Backend**: Configure Sentry middleware with `SENTRY_DSN`
3. **Test error tracking**:
```javascript
// Test in browser console
throw new Error("Test production error tracking");
```

### Google Analytics 4
1. **Verify tracking**: Visit your site and check GA4 Real-time reports
2. **Test events**: Interact with your site and verify events in GA4
3. **Goal tracking**: Configure conversion events in GA4 dashboard

---

## 🚀 Marketing Automation Deployment

### Brevo Email Automation
```bash
# Deploy email templates and workflows
node scripts/brevo-marketing-automation.cjs

# Verify in Brevo dashboard:
# 1. Contact lists created
# 2. Email templates uploaded  
# 3. Automation workflows configured
# 4. Webhooks setup for tracking
```

### Campaign Infrastructure
- [ ] ✅ Email templates deployed to Brevo
- [ ] ✅ Segmented contact lists created
- [ ] ✅ Welcome email automation configured
- [ ] ✅ Purchase confirmation flows setup
- [ ] ✅ Abandoned cart recovery campaigns ready

---

## 🔥 Launch Sequence

### Phase 1: Soft Launch ($2,500 budget)
1. **Pre-launch validation** (Run all above checks)
2. **Limited audience testing** (friends, family, beta users)
3. **Monitor metrics closely** (1-2 weeks)
4. **Iterate based on feedback**

### Phase 2: Scale-up ($5,000 budget)
1. **Expand to broader audience**
2. **Activate paid advertising campaigns**
3. **Implement referral programs**
4. **Scale winning strategies**

---

## 🆘 Emergency Response Plan

### If Deployment Fails
```bash
# Rollback frontend (Netlify)
netlify rollback

# Rollback backend (Render)
# Use Render dashboard → Deployments → Rollback to previous

# Check logs for errors
netlify logs
# Render logs available in dashboard
```

### If Secrets Are Compromised
1. **Immediately rotate all affected secrets**
2. **Update CI/CD environment variables**
3. **Redeploy both frontend and backend**
4. **Monitor for unauthorized access**

---

## 📋 Success Criteria

Your deployment is successful when:
- [ ] ✅ Frontend loads at 95%+ reliability
- [ ] ✅ Backend APIs respond at 99%+ uptime
- [ ] ✅ All integrations pass validation (>95% test success rate)
- [ ] ✅ Security scan shows no exposed secrets
- [ ] ✅ Monitoring dashboards show healthy metrics
- [ ] ✅ Email automation workflows are active
- [ ] ✅ Analytics tracking is functional

---

## 📞 Support Resources

- **Netlify Support**: [Netlify Documentation](https://docs.netlify.com)
- **Render Support**: [Render Documentation](https://render.com/docs)
- **Emergency Contact**: Keep team contact info handy during deployment

---

> **🎉 Ready for Production!** Once all checkboxes are completed and validation passes, you're ready to serve customers with confidence.

**Next Steps**: Monitor your metrics, iterate based on user feedback, and scale your successful campaigns!