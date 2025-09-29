// Campaign Launch Dashboard for real-time monitoring
import React, { useState, useEffect, useMemo } from 'react';
import { useAnalytics } from '../lib/analytics';
import { useUTMTracking } from '../lib/utm-tracker';
import { useAnalyticsTesting } from '../lib/analytics-testing';

interface CampaignMetrics {
  total_sessions: number;
  attributed_sessions: number;
  conversion_rate: number;
  revenue: number;
  average_order_value: number;
  quality_conversion_rate: number;
  top_sources: Array<{ source: string; sessions: number; revenue: number }>;
  influencer_performance: Array<{
    influencer: string;
    clicks: number;
    conversions: number;
    revenue: number;
    commission_owed: number;
  }>;
}

interface LiveAlert {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  metric?: string;
  value?: number;
}

export const CampaignDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    total_sessions: 0,
    attributed_sessions: 0,
    conversion_rate: 0,
    revenue: 0,
    average_order_value: 0,
    quality_conversion_rate: 0,
    top_sources: [],
    influencer_performance: [],
  });

  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [testResults, setTestResults] = useState<any>(null);

  const { getCampaignPerformance } = useUTMTracking();
  const { runFullTestSuite, generateTestReport } = useAnalyticsTesting();

  // Mock data for demo - in production, this would come from your analytics API
  const generateMockMetrics = (): CampaignMetrics => ({
    total_sessions: Math.floor(Math.random() * 1000) + 500,
    attributed_sessions: Math.floor(Math.random() * 300) + 150,
    conversion_rate: Math.random() * 5 + 2,
    revenue: Math.random() * 10000 + 5000,
    average_order_value: Math.random() * 50 + 100,
    quality_conversion_rate: Math.random() * 3 + 1,
    top_sources: [
      { source: 'instagram', sessions: Math.floor(Math.random() * 100) + 50, revenue: Math.random() * 2000 + 1000 },
      { source: 'facebook', sessions: Math.floor(Math.random() * 80) + 40, revenue: Math.random() * 1500 + 800 },
      { source: 'google', sessions: Math.floor(Math.random() * 120) + 60, revenue: Math.random() * 2500 + 1200 },
      { source: 'email', sessions: Math.floor(Math.random() * 60) + 30, revenue: Math.random() * 1000 + 500 },
    ],
    influencer_performance: [
      { influencer: 'Sarah Johnson', clicks: Math.floor(Math.random() * 500) + 200, conversions: Math.floor(Math.random() * 20) + 5, revenue: Math.random() * 1000 + 500, commission_owed: Math.random() * 80 + 40 },
      { influencer: 'Emma Chen', clicks: Math.floor(Math.random() * 400) + 150, conversions: Math.floor(Math.random() * 15) + 3, revenue: Math.random() * 800 + 400, commission_owed: Math.random() * 64 + 32 },
      { influencer: 'Mike Torres', clicks: Math.floor(Math.random() * 600) + 250, conversions: Math.floor(Math.random() * 25) + 8, revenue: Math.random() * 1200 + 600, commission_owed: Math.random() * 96 + 48 },
    ],
  });

  // Generate alerts based on metrics
  const generateAlertsFromMetrics = (newMetrics: CampaignMetrics, prevMetrics: CampaignMetrics) => {
    const newAlerts: LiveAlert[] = [];

    // Conversion rate alerts
    if (newMetrics.conversion_rate > prevMetrics.conversion_rate * 1.2) {
      newAlerts.push({
        id: `alert_${Date.now()}_1`,
        type: 'success',
        message: `🚀 Conversion rate spike! Up ${((newMetrics.conversion_rate / prevMetrics.conversion_rate - 1) * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'conversion_rate',
        value: newMetrics.conversion_rate,
      });
    } else if (newMetrics.conversion_rate < prevMetrics.conversion_rate * 0.8) {
      newAlerts.push({
        id: `alert_${Date.now()}_2`,
        type: 'warning',
        message: `⚠️ Conversion rate drop detected. Down ${((1 - newMetrics.conversion_rate / prevMetrics.conversion_rate) * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        metric: 'conversion_rate',
        value: newMetrics.conversion_rate,
      });
    }

    // Revenue alerts
    if (newMetrics.revenue > prevMetrics.revenue * 1.15) {
      newAlerts.push({
        id: `alert_${Date.now()}_3`,
        type: 'success',
        message: `💰 Revenue surge! Up $${(newMetrics.revenue - prevMetrics.revenue).toFixed(2)}`,
        timestamp: Date.now(),
        metric: 'revenue',
        value: newMetrics.revenue,
      });
    }

    // Quality conversion alerts
    if (newMetrics.quality_conversion_rate > prevMetrics.quality_conversion_rate * 1.3) {
      newAlerts.push({
        id: `alert_${Date.now()}_4`,
        type: 'success',
        message: `✨ Quality conversions trending up! Premium customers increasing`,
        timestamp: Date.now(),
        metric: 'quality_conversion_rate',
        value: newMetrics.quality_conversion_rate,
      });
    }

    return newAlerts;
  };

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      if (!isLive) return;

      setMetrics(prevMetrics => {
        const newMetrics = generateMockMetrics();
        const newAlerts = generateAlertsFromMetrics(newMetrics, prevMetrics);
        
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
        }
        
        setLastUpdate(new Date());
        return newMetrics;
      });
    };

    updateMetrics(); // Initial load
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  // Run analytics test suite
  const handleRunTests = async () => {
    try {
      const results = await runFullTestSuite();
      setTestResults(results);
      
      if (results.overall_success) {
        setAlerts(prev => [{
          id: `test_${Date.now()}`,
          type: 'success',
          message: `✅ Analytics test suite passed (${results.passed_tests}/${results.total_tests})`,
          timestamp: Date.now(),
        }, ...prev]);
      } else {
        setAlerts(prev => [{
          id: `test_${Date.now()}`,
          type: 'error',
          message: `❌ Analytics test failures detected (${results.passed_tests}/${results.total_tests})`,
          timestamp: Date.now(),
        }, ...prev]);
      }
    } catch (error) {
      console.error('Test suite failed:', error);
    }
  };

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => ({
    attribution_rate: metrics.attributed_sessions > 0 ? (metrics.attributed_sessions / metrics.total_sessions * 100) : 0,
    roas: metrics.revenue > 0 ? (metrics.revenue / 1000) : 0, // Assuming $1000 ad spend for demo
    quality_premium: metrics.quality_conversion_rate / Math.max(metrics.conversion_rate, 0.1),
    top_performing_source: metrics.top_sources.reduce((best, current) => 
      current.revenue > best.revenue ? current : best, 
      metrics.top_sources[0] || { source: 'none', revenue: 0 }
    ),
  }), [metrics]);

  return (
    <div className="campaign-dashboard bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="dashboard-header mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaign Launch Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring for TheCalista marketing campaigns</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{isLive ? 'Live' : 'Paused'}</span>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isLive ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleRunTests}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Run Analytics Tests
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-4">
          {(['1h', '24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded ${
                selectedTimeRange === range 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Sessions</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.total_sessions.toLocaleString()}</p>
          <p className="text-sm text-green-600">+12% vs yesterday</p>
        </div>

        <div className="metric-card bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.conversion_rate.toFixed(2)}%</p>
          <p className="text-sm text-blue-600">Quality focus: {metrics.quality_conversion_rate.toFixed(2)}%</p>
        </div>

        <div className="metric-card bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">${metrics.revenue.toLocaleString()}</p>
          <p className="text-sm text-purple-600">AOV: ${metrics.average_order_value.toFixed(2)}</p>
        </div>

        <div className="metric-card bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Attribution Rate</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{derivedMetrics.attribution_rate.toFixed(1)}%</p>
          <p className="text-sm text-indigo-600">ROAS: {derivedMetrics.roas.toFixed(2)}x</p>
        </div>
      </div>

      {/* Live Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Alerts</h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`alert p-4 rounded-lg border-l-4 ${
                  alert.type === 'success' ? 'bg-green-50 border-green-400' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium">{alert.message}</p>
                  <span className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Sources Performance */}
      <div className="campaign-sources mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Campaign Sources</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {metrics.top_sources.map(source => (
                <div key={source.source} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      source.source === 'instagram' ? 'bg-pink-500' :
                      source.source === 'facebook' ? 'bg-blue-500' :
                      source.source === 'google' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium capitalize">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{source.sessions} sessions</p>
                    <p className="text-sm text-gray-600">${source.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Quality Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Quality Premium Factor</span>
                <span className="font-semibold">{derivedMetrics.quality_premium.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Top Performing Source</span>
                <span className="font-semibold capitalize">{derivedMetrics.top_performing_source?.source || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Attributed Sessions</span>
                <span className="font-semibold">{metrics.attributed_sessions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Influencer Performance */}
      <div className="influencer-performance mb-8">
        <h2 className="text-xl font-semibold mb-4">Influencer Performance</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CVR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.influencer_performance.map(influencer => (
                <tr key={influencer.influencer}>
                  <td className="px-6 py-4 font-medium text-gray-900">{influencer.influencer}</td>
                  <td className="px-6 py-4 text-gray-600">{influencer.clicks}</td>
                  <td className="px-6 py-4 text-gray-600">{influencer.conversions}</td>
                  <td className="px-6 py-4 font-medium text-green-600">${influencer.revenue.toFixed(2)}</td>
                  <td className="px-6 py-4 font-medium text-purple-600">${influencer.commission_owed.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {((influencer.conversions / influencer.clicks) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="test-results">
          <h2 className="text-xl font-semibold mb-4">Analytics Test Results</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                testResults.overall_success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResults.overall_success ? '✅ All Tests Passed' : '❌ Tests Failed'}
              </div>
              <span className="text-gray-600">
                {testResults.passed_tests}/{testResults.total_tests} passed
              </span>
            </div>
            
            <div className="space-y-2">
              {testResults.test_results.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.test_name}</span>
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? '✅' : '❌'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{result.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDashboard;