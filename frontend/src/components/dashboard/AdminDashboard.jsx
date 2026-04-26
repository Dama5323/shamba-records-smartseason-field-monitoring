import React, { useState, useEffect } from 'react';
import { dashboardService, fieldService, adminService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Map, Sprout, AlertTriangle, CheckCircle, Users,
  TrendingUp, Calendar, ChevronRight, Activity,
  Eye, Clock, Shield, BarChart3, UserPlus, ShieldPlus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentFields, setRecentFields] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [newAgent, setNewAgent] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, fieldsRes, agentsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentFields(),
        adminService.getAgents().catch(() => ({ agents: [] }))
      ]);
      
      setStats(statsRes);
      setRecentFields(Array.isArray(fieldsRes) ? fieldsRes : (fieldsRes.results || []));
      setAgents(agentsRes.agents || []);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.username || !newAdmin.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newAdmin.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setCreating(true);
    try {
      await adminService.createAdmin({ 
        email: newAdmin.email, 
        username: newAdmin.username, 
        password: newAdmin.password 
      });
      toast.success('Admin user created successfully');
      setShowCreateAdminModal(false);
      setNewAdmin({ email: '', username: '', password: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.email || !newAgent.username || !newAgent.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newAgent.password !== newAgent.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setCreating(true);
    try {
      await adminService.createAgent({ 
        email: newAgent.email, 
        username: newAgent.username, 
        password: newAgent.password,
        first_name: newAgent.first_name,
        last_name: newAgent.last_name
      });
      toast.success('Field Agent created successfully');
      setShowCreateAgentModal(false);
      setNewAgent({ email: '', username: '', password: '', confirmPassword: '', first_name: '', last_name: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create agent');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shamba"></div>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const totalFields = summary.total_fields || 0;
  const activeFields = summary.active_fields || 0;
  const atRiskFields = summary.at_risk_fields || 0;
  const completedFields = summary.completed_fields || 0;
  const totalAgents = summary.total_agents || agents.length || 0;

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
        <div className="flex flex-wrap gap-3">
          <Link to="/fields/create" className="btn-primary flex items-center gap-2">
            <Sprout className="w-4 h-4" />
            New Field
          </Link>
          <button 
            onClick={() => setShowCreateAgentModal(true)} 
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Agent
          </button>
          <button 
            onClick={() => setShowCreateAdminModal(true)} 
            className="btn-secondary flex items-center gap-2"
          >
            <ShieldPlus className="w-4 h-4" />
            Create Admin
          </button>
          <Link to="/analytics" className="btn-secondary flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      {/* Stats Cards - Same as before */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Status Distribution and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            
            <button
              onClick={() => setShowCreateAgentModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Create Field Agent</p>
                  <p className="text-sm text-gray-500">Add a new field agent to the system</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </button>
            
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShieldPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Create Admin User</p>
                  <p className="text-sm text-gray-500">Add a new admin to the system</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
            </button>
            
            <Link 
              to="/users" 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Manage All Users</p>
                  <p className="text-sm text-gray-500">View and manage all system users</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Fields Table - Same as before */}
      <div className="card overflow-hidden">
        {/* ... keep your existing recent fields table code ... */}
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <ShieldPlus className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Create Admin User</h2>
              </div>
              <button onClick={() => setShowCreateAdminModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="input-field"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="input-field"
                  placeholder="admin_username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCreateAdmin} 
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
                <button 
                  onClick={() => setShowCreateAdminModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Create Field Agent</h2>
              </div>
              <button onClick={() => setShowCreateAgentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  className="input-field"
                  placeholder="agent@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAgent.username}
                  onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })}
                  className="input-field"
                  placeholder="agent_username"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newAgent.first_name}
                    onChange={(e) => setNewAgent({ ...newAgent, first_name: e.target.value })}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newAgent.last_name}
                    onChange={(e) => setNewAgent({ ...newAgent, last_name: e.target.value })}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newAgent.confirmPassword}
                  onChange={(e) => setNewAgent({ ...newAgent, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCreateAgent} 
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create Agent'}
                </button>
                <button 
                  onClick={() => setShowCreateAgentModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;