# Netlify Deployment Configuration

## Secrets Scanning Issue Fix

Netlify's secrets scanner incorrectly flags legitimate frontend environment variables (VITE_*) as potential secrets. These variables are **intentionally public** and meant to be included in the browser bundle.

### ⚠️ REQUIRED: Configure Netlify Dashboard

The netlify.toml configuration alone is **not sufficient**. You must configure these settings in the Netlify dashboard:

#### Option 1: Exclude Specific Variables (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add Variable**
4. Add the following:

```
Key: SECRETS_SCAN_OMIT_KEYS
Value: VITE_APP_ENV,VITE_GA4_MEASUREMENT_ID,VITE_SENTRY_DSN,VITE_API_URL,VITE_FACEBOOK_PIXEL_ID,VITE_GOOGLE_ADS_ID,VITE_BREVO_CLIENT_KEY
```

5. Save the variable
6. **Trigger a new deployment** (push a commit or click "Trigger deploy")

#### Option 2: Disable Secrets Scanning (Alternative)

If Option 1 doesn't work, completely disable secrets scanning:

1. Go to **Site Settings** → **Environment Variables**
2. Add:

```
Key: SECRETS_SCAN_ENABLED
Value: false
```

3. Save and redeploy

### 🔍 Why This Happens

**These are NOT actual secrets:**
- `VITE_APP_ENV` = Environment name ("production", "development")
- `VITE_GA4_MEASUREMENT_ID` = Public Google Analytics tracking ID
- `VITE_SENTRY_DSN` = Public Sentry error reporting endpoint
- `VITE_API_URL` = Public API endpoint URL

**Vite intentionally includes VITE_* variables in the browser bundle** - this is normal and expected behavior for frontend applications.

### 📋 Deployment Checklist

- [ ] Environment variables configured in Netlify dashboard
- [ ] All VITE_* variables contain only public, non-sensitive values
- [ ] No actual secrets (API keys, passwords, tokens) in VITE_* variables
- [ ] Deployment triggered after configuration changes

### 🚨 Security Verification

**Safe VITE_* Variables (OK to be public):**
- Environment names (`production`, `development`)
- Public analytics IDs (Google Analytics, Facebook Pixel)
- Public monitoring endpoints (Sentry DSN)
- Public API endpoints
- Feature flags and configuration options

**NEVER use VITE_* prefix for:**
- Database passwords
- API keys for backend services
- Admin tokens
- SMTP passwords
- Private encryption keys

### 🔧 Troubleshooting

#### If deployment still fails:

1. **Verify environment variable is set correctly** in Netlify dashboard
2. **Check variable name spelling** - must be exactly `SECRETS_SCAN_OMIT_KEYS`
3. **Ensure no extra spaces** in the value
4. **Try Option 2** (disable scanning entirely)
5. **Contact Netlify support** if issue persists

#### Build logs should show:

**Before fix:**
```
❌ Secrets scanning found 3 instance(s) of secrets in build output
❌ Build failed due to secrets scanning
```

**After fix:**
```
✅ Scanning complete. No secrets found in build output
✅ Deploy succeeded
```

### 📁 Project Structure

This project uses a **dual-layer approach**:

1. **Dynamic Configuration**: Environment variables loaded at runtime (not build time)
2. **Netlify Configuration**: Explicit exclusions in dashboard settings

Both layers ensure maximum compatibility and deployment success.

### 🔄 Re-deployment Steps

After configuring environment variables:

1. **Option A**: Push any commit to trigger auto-deployment
2. **Option B**: Go to Netlify dashboard → "Trigger deploy" → "Deploy site"
3. **Monitor build logs** to confirm secrets scanning passes
4. **Test deployed site** to ensure all functionality works

### 📞 Support

If you continue to have issues:
1. Double-check the environment variable configuration
2. Verify all values are public/non-sensitive
3. Try disabling secrets scanning entirely as a last resort
4. Contact Netlify support with reference to this configuration

---

## Additional Configuration

### Performance Headers

The site includes optimized caching headers:
- Static assets: 1 year cache
- HTML files: 1 hour cache
- Security headers for protection

### API Routing

Backend API calls are proxied through Netlify:
- `/api/*` → `https://api.calistalife.com/*`

### SPA Routing

Single Page Application routing configured:
- All unmatched routes serve `index.html`
- Client-side routing handles navigation

---

*Last updated: $(Get-Date -Format "yyyy-MM-dd")*