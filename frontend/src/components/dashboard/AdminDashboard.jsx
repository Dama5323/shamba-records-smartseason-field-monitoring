import React, { useState, useEffect } from 'react';
import { dashboardService, fieldService, adminService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Map, Sprout, AlertTriangle, CheckCircle, Users,
  ChevronRight, Shield, BarChart3, UserPlus, ShieldPlus,
  X, Plus
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const totalFields = summary.total_fields || 0;
  const activeFields = summary.active_fields || 0;
  const atRiskFields = summary.at_risk_fields || 0;
  const completedFields = summary.completed_fields || 0;
  const totalAgents = summary.total_agents || agents.length || 0;
  const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.username || 'Admin'}</p>
        </div>
        
        {/* Quick Actions - At the top right */}
        <div className="flex flex-wrap gap-2">
          <Link to="/fields/create" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Field
          </Link>
          <button onClick={() => setShowCreateAgentModal(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Agent
          </button>
          <button onClick={() => setShowCreateAdminModal(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
            <ShieldPlus className="w-4 h-4" />
            Add Admin
          </button>
          <Link to="/users" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </Link>
        </div>
      </div>

      {/* Stats Cards - Clean and Consistent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{totalFields}</span>
          </div>
          <p className="text-gray-600 text-sm mt-3">Total Fields</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{activeFields}</span>
          </div>
          <p className="text-gray-600 text-sm mt-3">Active Fields</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-amber-600">{atRiskFields}</span>
          </div>
          <p className="text-gray-600 text-sm mt-3">At Risk</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{completionPercentage}%</span>
          </div>
          <p className="text-gray-600 text-sm mt-3">Completion Rate</p>
        </div>
      </div>

      {/* Field Status Summary - Simple Progress Bars */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Field Status</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Active</span>
              <span>{activeFields}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-emerald-500 rounded-full h-1.5" style={{ width: `${totalFields > 0 ? (activeFields / totalFields) * 100 : 0}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">At Risk</span>
              <span>{atRiskFields}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-amber-500 rounded-full h-1.5" style={{ width: `${totalFields > 0 ? (atRiskFields / totalFields) * 100 : 0}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Completed</span>
              <span>{completedFields}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${totalFields > 0 ? (completedFields / totalFields) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Fields Table - Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Recent Fields</h3>
          <Link to="/fields" className="text-emerald-600 hover:text-emerald-700 text-sm">View all →</Link>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentFields.slice(0, 5).map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{field.name}</td>
                    <td className="px-6 py-3 text-gray-600">{field.crop_type}</td>
                    <td className="px-6 py-3">
                      <span className="capitalize text-gray-600">{field.current_stage}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        field.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        field.status === 'At Risk' ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {field.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{field.assigned_to_name || field.assigned_to || '-'}</td>
                    <td className="px-6 py-3">
                      <Link to={`/fields/${field.id}`} className="text-emerald-600 hover:text-emerald-700">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No fields yet</p>
            <Link to="/fields/create" className="text-emerald-600 text-sm mt-2 inline-block">Create your first field →</Link>
          </div>
        )}
      </div>

      {/* At-Risk Alert - Only shown if needed */}
      {atRiskFields > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-medium">{atRiskFields} field(s) at risk.</span> Fields become "At Risk" when planted over 90 days ago and not harvested.
            </p>
            <Link to="/fields?filter=at-risk" className="ml-auto text-sm text-amber-700 font-medium hover:underline">View →</Link>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create Admin User</h2>
              <button onClick={() => setShowCreateAdminModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="email" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="text" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="password" placeholder="Confirm Password" value={newAdmin.confirmPassword} onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-3 pt-4">
                <button onClick={handleCreateAdmin} disabled={creating} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">Create</button>
                <button onClick={() => setShowCreateAdminModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
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
              <h2 className="text-xl font-bold text-gray-800">Create Field Agent</h2>
              <button onClick={() => setShowCreateAgentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input type="email" placeholder="Email" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="text" placeholder="Username" value={newAgent.username} onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="First Name" value={newAgent.first_name} onChange={(e) => setNewAgent({ ...newAgent, first_name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                <input type="text" placeholder="Last Name" value={newAgent.last_name} onChange={(e) => setNewAgent({ ...newAgent, last_name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <input type="password" placeholder="Password" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="password" placeholder="Confirm Password" value={newAgent.confirmPassword} onChange={(e) => setNewAgent({ ...newAgent, confirmPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <div className="flex gap-3">
                <button onClick={handleCreateAgent} disabled={creating} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">Create</button>
                <button onClick={() => setShowCreateAgentModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;