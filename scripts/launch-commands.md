# CalistaLife Launch Commands

## Option 1: Master Orchestrator (Recommended)
**Single command that runs everything in sequence:**

```bash
node scripts/master-launch-orchestrator.cjs
```

This will:
- ✅ Run preflight checks
- ✅ Execute production validation (≥95% target)
- ✅ Launch marketing campaigns ($2,500 budget)
- ✅ Start continuous monitoring
- ✅ Generate comprehensive launch report

---

## Option 2: Manual Step-by-Step
**Run each component individually:**

```bash
# 1. Production Validation Suite
node scripts/final-production-validation.cjs

# 2. Launch Marketing Campaigns  
node scripts/marketing-campaign-launch.cjs

# 3. Start Continuous Operations Monitoring
node scripts/operations-monitoring.cjs --continuous

# 4. One-time System Health Check
node scripts/operations-monitoring.cjs
```

---

## After Launch: Monitoring Commands

```bash
# Check current system health
node scripts/operations-monitoring.js

# View marketing campaign status
cat scripts/campaign-launch-report.json

# View latest health report
cat scripts/health-check-latest.json

# Stop continuous monitoring (if needed)
pkill -f "operations-monitoring.cjs"
```

---

## Expected Results

### Production Validation
- ≥95% system readiness score
- All endpoints responding < 2s
- SSL certificates valid
- Security checks passed

### Marketing Campaign
- $2,500 total budget (14 days)
- $178.57 daily budget
- 60% Facebook/Instagram, 40% Google Ads
- Brevo email automations active

### Monitoring
- Real-time health checks every 60 seconds
- SSL expiry alerts (30 days advance)
- Security scanning
- Performance metrics tracking

---

## Next Steps After Launch

1. **First 24 Hours:** Monitor KPIs closely
2. **Week 1:** Optimize campaigns based on data
3. **Week 2:** Scale successful ad sets
4. **Ongoing:** Weekly performance reviews

**Target KPIs:**
- ROAS: 3.5x
- CAC: $35
- Conversion Rate: 2.5%
- Email Deliverability: 95%