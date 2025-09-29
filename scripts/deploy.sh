#!/bin/bash
# CalistaLife Production Deployment Commands
# Run these after completing environment setup

echo "🎯 Starting CalistaLife Production Deployment..."

# Step 1: Final verification
echo "🔍 Running pre-launch verification..."
node scripts/pre-launch-verification.cjs
if [ $? -ne 0 ]; then
    echo "❌ Pre-launch verification failed - fix issues before proceeding"
    exit 1
fi

# Step 2: Production validation
echo "✅ Running production validation..."
node scripts/final-production-validation.cjs

# Step 3: Launch marketing campaigns
echo "🚀 Launching marketing campaigns..."
node scripts/marketing-campaign-launch.cjs

# Step 4: Start monitoring
echo "📊 Starting operations monitoring..."
node scripts/operations-monitoring.cjs --continuous &

# Step 5: Final health check
echo "🏥 Final health check..."
node scripts/operations-monitoring.cjs

echo "🎉 CalistaLife production deployment complete!"
echo "📊 Monitor KPIs for the first 48 hours"
echo "💰 Marketing budget: $2,500 over 14 days"
echo "🎯 Target ROAS: 3.5x"
