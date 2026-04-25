import React, { useState, useEffect } from 'react';
import { dashboardService, fieldService, adminService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Map, Sprout, AlertTriangle, CheckCircle, Users,
  TrendingUp, Calendar, ChevronRight, Activity,
  Eye, Clock, Shield, BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentFields, setRecentFields] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, fieldsRes, agentsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentFields(),
        adminService.getAgents().catch(() => ({ agents: [] }))
      ]);
      
      console.log('Stats response:', statsRes);
      console.log('Fields response:', fieldsRes);
      console.log('Agents response:', agentsRes);
      
      setStats(statsRes);
      setRecentFields(Array.isArray(fieldsRes) ? fieldsRes : (fieldsRes.results || []));
      setAgents(agentsRes.agents || []);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shamba"></div>
      </div>
    );
  }

  // Extract summary data with fallbacks
  const summary = stats?.summary || {};
  const totalFields = summary.total_fields || 0;
  const activeFields = summary.active_fields || 0;
  const atRiskFields = summary.at_risk_fields || 0;
  const completedFields = summary.completed_fields || 0;
  const totalAgents = summary.total_agents || agents.length || 0;

  // Status breakdown for progress bars
  const statusData = [
    { name: 'Active', value: activeFields, color: '#10B981', bgColor: 'bg-green-500' },
    { name: 'At Risk', value: atRiskFields, color: '#F59E0B', bgColor: 'bg-orange-500' },
    { name: 'Completed', value: completedFields, color: '#3B82F6', bgColor: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of all fields and system statistics</p>
        </div>
        <div className="flex gap-3">
          <Link to="/fields/create" className="btn-primary flex items-center gap-2">
            <Sprout className="w-4 h-4" />
            New Field
          </Link>
          <Link to="/analytics" className="btn-secondary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Fields Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Map className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-800">{totalFields}</span>
          </div>
          <h3 className="font-semibold text-gray-700">Total Fields</h3>
          <p className="text-sm text-gray-500 mt-1">All fields in system</p>
        </div>

        {/* Active Fields Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-600">{activeFields}</span>
          </div>
          <h3 className="font-semibold text-gray-700">Active Fields</h3>
          <p className="text-sm text-gray-500 mt-1">Currently growing</p>
        </div>

        {/* At Risk Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-3xl font-bold text-orange-600">{atRiskFields}</span>
          </div>
          <h3 className="font-semibold text-gray-700">At Risk</h3>
          <p className="text-sm text-gray-500 mt-1">Need immediate attention</p>
        </div>

        {/* Completed Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-purple-600">{completedFields}</span>
          </div>
          <h3 className="font-semibold text-gray-700">Completed</h3>
          <p className="text-sm text-gray-500 mt-1">Harvested fields</p>
        </div>
      </div>

      {/* Status Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Status Distribution</h3>
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{status.name}</span>
                  <span className="font-semibold text-gray-800">{status.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${status.bgColor} rounded-full h-2 transition-all duration-500`}
                    style={{ width: `${totalFields > 0 ? (status.value / totalFields) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              to="/fields/create" 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Create New Field</p>
                  <p className="text-sm text-gray-500">Add a new field to the system</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
            </Link>
            
            <Link 
              to="/users" 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Manage Users</p>
                  <p className="text-sm text-gray-500">Add or manage system users</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
            
            <Link 
              to="/analytics" 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">View Analytics</p>
                  <p className="text-sm text-gray-500">See detailed field insights</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Fields Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Recent Fields</h3>
            <p className="text-sm text-gray-500 mt-0.5">Recently updated fields</p>
          </div>
          <Link to="/fields" className="text-shamba hover:text-shamba-dark text-sm font-medium flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentFields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/fields/${field.id}`} className="font-medium text-shamba hover:text-shamba-dark">
                        {field.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{field.crop_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {field.current_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        field.status === 'Active' ? 'badge-active' :
                        field.status === 'At Risk' ? 'badge-risk' : 'badge-completed'
                      }`}>
                        {field.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {field.assigned_to_name || field.assigned_to || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/fields/${field.id}`} className="text-shamba hover:text-shamba-dark font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Map className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No fields found</p>
            <Link to="/fields/create" className="text-shamba text-sm mt-2 inline-block hover:underline">
              Create your first field →
            </Link>
          </div>
        )}
      </div>

      {/* Alert for At-Risk Fields */}
      {atRiskFields > 0 && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">⚠️ At-Risk Fields Alert</h3>
              <p className="text-sm text-orange-700 mt-1">
                {atRiskFields} field(s) are at risk and require immediate attention.
              </p>
              <Link 
                to="/fields?filter=at-risk" 
                className="mt-3 inline-block text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 transition"
              >
                View At-Risk Fields
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;