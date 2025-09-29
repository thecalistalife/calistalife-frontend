# CalistaLife Production Deployment Guide: Netlify + Render

## 🎯 **Deployment Architecture**
- **Frontend**: Netlify (Static site with environment variables for GA4, Sentry)
- **Backend**: Render (Node.js API with secure database and email secrets)
- **Database**: Supabase (Already configured)
- **Email**: Brevo (API integration)
- **Monitoring**: Sentry + GA4 + Custom logging

---

## 🔒 **Step 1: Netlify Frontend Deployment**

### **Environment Variables for Netlify**
```bash
# Navigate to Netlify Dashboard → Site Settings → Environment Variables
# Or use Netlify CLI:

netlify env:set VITE_SENTRY_DSN "https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904"

netlify env:set VITE_GA4_MEASUREMENT_ID "G-FL9QNKMXPX"

netlify env:set VITE_APP_ENV "production"

netlify env:set VITE_API_URL "https://your-render-backend.onrender.com"

# Optional: If you have Facebook Pixel (not required for launch)
# netlify env:set VITE_FACEBOOK_PIXEL_ID "your_pixel_id"

# Optional: If you have Google Ads (not required for launch)  
# netlify env:set VITE_GOOGLE_ADS_ID "your_ads_id"
```

### **Critical Security Check for Netlify**
✅ **NEVER set these on Netlify (backend-only secrets):**
- `BREVO_API_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- Any API keys or tokens ending with "SECRET"

### **Netlify Build Settings**
```bash
# Build Command
npm run build

# Publish Directory  
dist

# Node Version (set in Netlify dashboard)
20.x
```

---

## 🖥️ **Step 2: Render Backend Deployment**

### **Environment Variables for Render**
```bash
# In Render Dashboard → Your Service → Environment Variables
# Add these key-value pairs:

SENTRY_DSN=https://644e5c1b924e2641283405c73caf24cb@o4510098794676224.ingest.us.sentry.io/4510101948923904

BREVO_API_KEY=your_brevo_api_key_here

SUPABASE_URL=https://mrshlwfzkikpdycybqzi.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yc2hsd2Z6a2lrcGR5Y3licXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTU0MjYsImV4cCI6MjA3Mzk3MTQyNn0.Jk5Z2iCBo5mjBXSfByg4_1Lyiryi0BcT7B4xWzRPk00

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yc2hsd2Z6a2lrcGR5Y3licXppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5NTQyNiwiZXhwIjoyMDczOTcxNDI2fQ.k-qo9w_nbRuy7NOMosbICBj533cCrXBiwFWjJxIFpRQ

NODE_ENV=production

PORT=3001

CLIENT_URL=https://your-netlify-site.netlify.app

EMAIL_FROM=campaigns@calistalife.com

EMAIL_REPLY_TO=support@calistalife.com

# Optional: Additional services (add if you use them)
# STRIPE_SECRET_KEY=sk_live_your_stripe_key
# TWILIO_ACCOUNT_SID=your_twilio_sid  
# TWILIO_AUTH_TOKEN=your_twilio_token
```

### **Render Build & Start Commands**
```bash
# Build Command
npm install && npm run build

# Start Command  
npm start

# Or if you have a different start script:
node dist/index.js
```

---

## ✅ **Step 3: Deployment Validation Checklist**

### **Pre-Deployment Verification**
```bash
# 1. Verify no secrets in git repository
git log --oneline -10
git status
# Should show no .env files or sensitive data

# 2. Run local validation suite
node scripts/production-validation-suite.cjs
# Target: >95% pass rate after secret injection

# 3. Check environment templates are properly configured
cat frontend/.env.production
cat backend/.env.production
# Should only contain {{PLACEHOLDERS}}, no actual secrets
```

### **Post-Deployment Validation**

#### **Frontend Validation (Netlify)**
```bash
# 1. Check site accessibility
curl -I https://your-netlify-site.netlify.app
# Should return 200 OK

# 2. Validate GA4 integration
# Visit: https://your-netlify-site.netlify.app?debug_mode=true
# Check: https://analytics.google.com/analytics/web/#/debugview/a366936506p414066507

# 3. Test Sentry error capture
# Browser console: setTimeout(() => { throw new Error('Test'); }, 0);
# Check: https://sentry.io/organizations/calista-44/projects/javascript-nextjs/

# 4. Verify no secrets exposed
# View page source, check Network tab - should see no API keys
```

#### **Backend Validation (Render)**
```bash
# 1. Health check endpoint
curl https://your-render-backend.onrender.com/health
# Should return service status JSON

# 2. Database connectivity test
curl https://your-render-backend.onrender.com/api/test/db
# Should confirm Supabase connection

# 3. Email service test  
curl -X POST https://your-render-backend.onrender.com/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"test"}'
# Should send test email via Brevo

# 4. Sentry backend test
# Trigger a server error and check Sentry dashboard
```

---

## 🧪 **Step 4: Staging Environment Testing**

### **Pre-Production Checklist**
```yaml
Frontend Tests:
  - [ ] Site loads without errors
  - [ ] GA4 events tracking in DebugView
  - [ ] Sentry captures frontend errors
  - [ ] All pages render correctly
  - [ ] Contact forms submit successfully
  - [ ] No console errors or warnings

Backend Tests:
  - [ ] API endpoints respond correctly  
  - [ ] Database queries execute successfully
  - [ ] Email delivery works end-to-end
  - [ ] Error logging captures server issues
  - [ ] Authentication flows function
  - [ ] Payment processing (if implemented)

Integration Tests:
  - [ ] Frontend-backend communication works
  - [ ] User registration and login flows
  - [ ] Order placement and confirmation emails
  - [ ] Product catalog loading and filtering
  - [ ] Review and rating system functionality
```

### **Load Testing**
```bash
# Basic load test for backend API
npx loadtest -c 10 -t 30 https://your-render-backend.onrender.com/api/products

# Test email system under load (be mindful of Brevo's 300/day limit)
# Only send 10-20 test emails to avoid hitting free tier limits
```

---

## 🚀 **Step 5: Go Live Checklist**

### **Final Production Deployment**
```bash
# 1. Deploy frontend to Netlify
netlify deploy --prod

# 2. Deploy backend to Render
git push origin main
# (Render auto-deploys from main branch)

# 3. Verify production URLs
curl -I https://your-actual-domain.com
curl -I https://your-render-backend.onrender.com/health

# 4. Monitor first hour of production traffic
# - Check Sentry for errors
# - Monitor GA4 real-time reports
# - Verify email delivery functionality
```

### **Post-Launch Monitoring**
```bash
# Daily health checks
curl https://your-domain.com/health
curl https://your-api.onrender.com/health

# Weekly performance review
# - GA4 analytics dashboard
# - Sentry performance metrics
# - Render resource usage
# - Email delivery rates
```

---

## 🔧 **Troubleshooting Common Issues**

### **Netlify Issues**
- **Build fails**: Check Node version matches (20.x)
- **Environment variables not working**: Verify VITE_ prefix
- **Site not loading**: Check build command and publish directory

### **Render Issues**  
- **Service won't start**: Check start command and PORT variable
- **Database connection fails**: Verify Supabase credentials
- **Email not sending**: Check Brevo API key and from/reply-to addresses

### **Integration Issues**
- **CORS errors**: Update CLIENT_URL in Render backend
- **API calls failing**: Verify VITE_API_URL in Netlify frontend
- **Analytics not tracking**: Check GA4 measurement ID and Sentry DSN

---

## 📞 **Support & Resources**

- **Netlify Docs**: https://docs.netlify.com/
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Brevo API Docs**: https://developers.brevo.com/
- **Sentry Docs**: https://docs.sentry.io/