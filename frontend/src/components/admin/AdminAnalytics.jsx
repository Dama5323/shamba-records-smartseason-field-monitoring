import React, { useState, useEffect } from 'react';
import { fieldAPI, authAPI } from '../../services/api';
import { 
  TrendingUp, TrendingDown, Calendar, Download, 
  Bell, AlertTriangle, CheckCircle, Users, 
  Map, Sprout, BarChart3, FileText, Settings,
  Eye, Clock, Shield, Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const [fieldsRes, usersRes, statsRes] = await Promise.all([
        fieldAPI.getFields(),
        authAPI.getUsers(),
        fieldAPI.getStatistics()
      ]);
      
      setAnalytics({
        fields: fieldsRes.data,
        users: usersRes.data,
        stats: statsRes.data,
        fieldTrends: calculateFieldTrends(fieldsRes.data),
        agentPerformance: calculateAgentPerformance(fieldsRes.data),
        cropDistribution: calculateCropDistribution(fieldsRes.data),
        riskAnalysis: calculateRiskAnalysis(fieldsRes.data)
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFieldTrends = (fields) => {
    // Group fields by creation date
    const trends = {};
    fields.forEach(field => {
      const date = new Date(field.created_at).toLocaleDateString();
      trends[date] = (trends[date] || 0) + 1;
    });
    return Object.entries(trends).map(([date, count]) => ({ date, count }));
  };

  const calculateAgentPerformance = (fields) => {
    const agentStats = {};
    fields.forEach(field => {
      if (field.assigned_to_name) {
        if (!agentStats[field.assigned_to_name]) {
          agentStats[field.assigned_to_name] = { total: 0, completed: 0, atRisk: 0 };
        }
        agentStats[field.assigned_to_name].total++;
        if (field.status === 'Completed') agentStats[field.assigned_to_name].completed++;
        if (field.status === 'At Risk') agentStats[field.assigned_to_name].atRisk++;
      }
    });
    return Object.entries(agentStats).map(([name, stats]) => ({ name, ...stats }));
  };

  const calculateCropDistribution = (fields) => {
    const crops = {};
    fields.forEach(field => {
      crops[field.crop_type] = (crops[field.crop_type] || 0) + 1;
    });
    return Object.entries(crops).map(([name, value]) => ({ name, value }));
  };

  const calculateRiskAnalysis = (fields) => {
    const atRisk = fields.filter(f => f.status === 'At Risk').length;
    const active = fields.filter(f => f.status === 'Active').length;
    const completed = fields.filter(f => f.status === 'Completed').length;
    return { atRisk, active, completed, total: fields.length };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shamba"></div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Comprehensive field monitoring insights</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-32"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{analytics?.riskAnalysis.total || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">Total Fields</h3>
          <p className="text-xs text-gray-500 mt-1">Across all regions</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{analytics?.users?.total || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">Active Agents</h3>
          <p className="text-xs text-gray-500 mt-1">Field personnel</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-orange-600">{analytics?.riskAnalysis.atRisk || 0}</span>
          </div>
          <h3 className="font-medium text-gray-700">At Risk Fields</h3>
          <p className="text-xs text-gray-500 mt-1">Need immediate attention</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">
              {Math.round((analytics?.riskAnalysis.completed / analytics?.riskAnalysis.total) * 100) || 0}%
            </span>
          </div>
          <h3 className="font-medium text-gray-700">Completion Rate</h3>
          <p className="text-xs text-gray-500 mt-1">Harvested fields</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Trends */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Field Creation Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.fieldTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2E7D32" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crop Distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-green-600" />
            Crop Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.cropDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(analytics?.cropDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Agent Performance Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Fields</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">At Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.agentPerformance?.map((agent) => (
                <tr key={agent.name} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{agent.name}</td>
                  <td className="px-6 py-4">{agent.total}</td>
                  <td className="px-6 py-4 text-green-600">{agent.completed}</td>
                  <td className="px-6 py-4 text-orange-600">{agent.atRisk}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 rounded-full h-2"
                          style={{ width: `${(agent.completed / agent.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs">{Math.round((agent.completed / agent.total) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${agent.atRisk > 0 ? 'badge-risk' : 'badge-active'}`}>
                      {agent.atRisk > 0 ? 'Needs Review' : 'On Track'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800">⚠️ Critical Alerts</h3>
            <p className="text-sm text-orange-700 mt-1">
              {analytics?.riskAnalysis.atRisk > 0 
                ? `${analytics.riskAnalysis.atRisk} field(s) are at risk and require immediate attention.`
                : "All fields are healthy. No critical alerts."}
            </p>
            {analytics?.riskAnalysis.atRisk > 0 && (
              <button className="mt-3 text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700">
                View At-Risk Fields
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;