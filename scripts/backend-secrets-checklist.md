# Backend Secrets Checklist for Render Deployment

## CRITICAL: These secrets MUST ONLY exist in backend environment:

### Email Service (Brevo)
- `BREVO_API_KEY` - Server-side email sending
- `BREVO_WEBHOOK_SECRET` - Webhook validation

### Database
- `DATABASE_URL` or individual DB credentials
- `SUPABASE_URL` 
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access

### Authentication & Security  
- `JWT_SECRET` - Token signing
- `SESSION_SECRET` - Session encryption
- `ENCRYPTION_KEY` - Data encryption

### External APIs (Backend Only)
- `STRIPE_SECRET_KEY` - Payment processing
- `TWILIO_AUTH_TOKEN` - SMS sending
- `SENTRY_DSN` - Error reporting (backend instance)

### Frontend-Safe Variables (VITE_ prefixed):
✅ `VITE_API_URL` - Public API endpoint
✅ `VITE_BREVO_CLIENT_KEY` - Public Brevo client
✅ `VITE_GA4_MEASUREMENT_ID` - Public analytics
✅ `VITE_SENTRY_DSN` - Public error reporting (if different from backend)

## Deployment Commands:
```bash
# Render: Add environment variables via dashboard
# Netlify: Add via dashboard or CLI
netlify env:set VITE_API_URL "https://api.calistalife.com"
```

## Validation:
- [ ] No backend secrets in frontend `.env*` files
- [ ] All VITE_ variables are public/client-safe
- [ ] Backend secrets only in Render environment variables
- [ ] Test API connectivity after deployment