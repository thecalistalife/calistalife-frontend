import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Award, Users, ShoppingBag, Star, 
  Leaf, Filter, Download, RefreshCw, Calendar, DollarSign, Eye
} from 'lucide-react';

interface BusinessIntelligenceDashboardProps {
  className?: string;
}

const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  className = ''
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'quality', 'sustainability']);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production, this would come from your analytics API
  const qualityMetricsData = [
    { name: 'Luxury', sales: 4500, avgRating: 4.8, returnRate: 2.1, revenue: 342000 },
    { name: 'Premium', sales: 8200, avgRating: 4.6, returnRate: 3.5, revenue: 410000 },
    { name: 'Standard', sales: 12100, avgRating: 4.3, returnRate: 5.2, revenue: 298000 },
    { name: 'Basic', sales: 5800, avgRating: 4.0, returnRate: 7.8, revenue: 145000 }
  ];

  const sustainabilityImpactData = [
    { name: 'A+', percentage: 25, sales: 7500, customerRetention: 89 },
    { name: 'A', percentage: 35, sales: 10200, customerRetention: 82 },
    { name: 'B+', percentage: 28, sales: 8100, customerRetention: 76 },
    { name: 'B', percentage: 12, sales: 3500, customerRetention: 71 }
  ];

  const revenueByFabricData = [
    { fabric: 'Organic Cotton', revenue: 285000, growth: 12.5, products: 45 },
    { fabric: 'Bamboo Blend', revenue: 198000, growth: 8.7, products: 32 },
    { fabric: 'Recycled Polyester', revenue: 156000, growth: 15.2, products: 28 },
    { fabric: 'Linen', revenue: 142000, growth: 6.3, products: 24 },
    { fabric: 'Modal', revenue: 89000, growth: 22.1, products: 18 }
  ];

  const monthlyTrendsData = [
    { month: 'Jan', qualityScore: 4.2, revenue: 89000, sustainability: 3.8 },
    { month: 'Feb', qualityScore: 4.3, revenue: 92000, sustainability: 4.0 },
    { month: 'Mar', qualityScore: 4.4, revenue: 98000, sustainability: 4.1 },
    { month: 'Apr', qualityScore: 4.5, revenue: 105000, sustainability: 4.3 },
    { month: 'May', qualityScore: 4.6, revenue: 112000, sustainability: 4.4 },
    { month: 'Jun', qualityScore: 4.7, revenue: 118000, sustainability: 4.5 }
  ];

  const customerSegmentData = [
    { segment: 'Quality Seekers', value: 35, color: '#8884d8', avgSpend: 156 },
    { segment: 'Eco Conscious', value: 28, color: '#82ca9d', avgSpend: 142 },
    { segment: 'Price Sensitive', value: 22, color: '#ffc658', avgSpend: 89 },
    { segment: 'Fashion Forward', value: 15, color: '#ff7c7c', avgSpend: 198 }
  ];

  const keyMetrics = [
    {
      title: 'Avg Quality Score',
      value: '4.6',
      change: '+0.3',
      trend: 'up',
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sustainability Rating',
      value: '4.4/5',
      change: '+0.2',
      trend: 'up',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue Impact',
      value: '$1.2M',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Customer Retention',
      value: '84%',
      change: '+5.2%',
      trend: 'up',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const renderMetricCard = (metric: typeof keyMetrics[0]) => {
    const IconComponent = metric.icon;
    const isPositive = metric.trend === 'up';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div key={metric.title} className={`p-6 rounded-lg border ${metric.bgColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
            <div className="flex items-center mt-2">
              <TrendIcon className={`w-4 h-4 mr-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${metric.bgColor.replace('50', '100')}`}>
            <IconComponent className={`w-6 h-6 ${metric.color}`} />
          </div>
        </div>
      </div>
    );
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleExportData = () => {
    // Implementation for data export
    const dataToExport = {
      qualityMetrics: qualityMetricsData,
      sustainability: sustainabilityImpactData,
      revenue: revenueByFabricData,
      trends: monthlyTrendsData,
      exportDate: new Date().toISOString(),
      timeframe
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quality Intelligence Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive analytics for quality-driven business decisions
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefreshData}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map(renderMetricCard)}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Performance by Grade */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quality Performance by Grade</h3>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Revenue & Returns</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${(value as number).toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 
                  name === 'returnRate' ? 'Return Rate (%)' : 'Average Rating'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar yAxisId="right" dataKey="returnRate" fill="#ef4444" name="Return Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sustainability Impact */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sustainability Impact</h3>
            <div className="flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Rating Distribution</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sustainabilityImpactData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
              >
                {sustainabilityImpactData.map((entry, index) => {
                  const colors = ['#22c55e', '#16a34a', '#65a30d', '#ca8a04'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Market Share']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Fabric Type */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Fabric Type</h3>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">Material Performance</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByFabricData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="fabric" type="category" width={120} />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? `$${(value as number).toLocaleString()}` : `${value}%`,
                name === 'revenue' ? 'Revenue' : 'Growth Rate'
              ]} />
              <Bar dataKey="revenue" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className="text-sm text-gray-500">Quality & Revenue</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${(value as number).toLocaleString()}` : value,
                  name === 'qualityScore' ? 'Quality Score' :
                  name === 'sustainability' ? 'Sustainability Score' : 'Revenue'
                ]}
              />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="qualityScore" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Quality Score"
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="sustainability" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Sustainability"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Segments & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
          <div className="space-y-3">
            {customerSegmentData.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm font-medium">{segment.segment}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{segment.value}%</div>
                  <div className="text-xs text-gray-500">${segment.avgSpend} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white p-6 rounded-lg border lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Quality Premium Effect</h4>
                <p className="text-sm text-green-700">
                  Luxury grade products show 35% higher profit margins and 60% lower return rates.
                  Consider expanding premium fabric options.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Leaf className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Sustainability Opportunity</h4>
                <p className="text-sm text-blue-700">
                  A+ rated sustainable products drive 22% higher customer retention.
                  Organic cotton and bamboo blends show strongest growth potential.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg">
              <Users className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Customer Segmentation</h4>
                <p className="text-sm text-amber-700">
                  Quality Seekers represent 35% of customers but generate 48% of revenue.
                  Focus marketing efforts on fabric technology and craftsmanship.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommended Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">Inventory Optimization</h4>
            <p className="text-sm text-gray-600">
              Increase luxury grade inventory by 25% based on demand trends and low return rates.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">Marketing Focus</h4>
            <p className="text-sm text-gray-600">
              Highlight thread count and fabric weight in product descriptions to attract quality seekers.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">Sustainability Push</h4>
            <p className="text-sm text-gray-600">
              Expand A+ rated products to capture growing eco-conscious market segment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligenceDashboard;