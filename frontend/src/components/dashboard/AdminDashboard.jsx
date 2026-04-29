import React, { useState, useEffect } from 'react';
import { dashboardService, fieldService, adminService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Map, Sprout, AlertTriangle, CheckCircle, Users,
  ChevronRight, Shield, BarChart3, UserPlus, ShieldPlus,
  X, Plus, MessageSquare, Eye, Clock, Image as ImageIcon,
  ChevronDown, ChevronUp, List, Activity, TrendingUp, PieChart
} from 'lucide-react';
import { observationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentFields, setRecentFields] = useState([]);
  const [agents, setAgents] = useState([]);
  const [recentObservations, setRecentObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fields');
  const [expandedObservation, setExpandedObservation] = useState(null);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fieldStatusData, setFieldStatusData] = useState({
    active: 0,
    atRisk: 0,
    completed: 0,
    monitoring: 0
  });
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
    fetchRecentObservations();
  }, []);

  // Poll for observations only when tab is active
  useEffect(() => {
    let interval;
    if (activeTab === 'observations') {
      // Refresh every 15 seconds only when observations tab is active
      interval = setInterval(() => {
        fetchRecentObservations();
      }, 15000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]); // Re-run when activeTab changes

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
      
      const summary = statsRes?.summary || {};
      setFieldStatusData({
        active: summary.active_fields || 0,
        atRisk: summary.at_risk_fields || 0,
        completed: summary.completed_fields || 0,
        monitoring: summary.monitoring_fields || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentObservations = async () => {
    try {
      const response = await observationAPI.getObservations();
      let observationsList = [];
      if (Array.isArray(response)) {
        observationsList = response;
      } else if (response?.results) {
        observationsList = response.results;
      } else {
        observationsList = [];
      }
      const sortedObservations = observationsList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
      setRecentObservations(sortedObservations);
    } catch (error) {
      console.error('Error fetching observations:', error);
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const toggleObservationExpand = (id) => {
    setExpandedObservation(expandedObservation === id ? null : id);
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
      fetchDashboardData();
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
      fetchDashboardData();
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
  const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Top Navbar - Same Line */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.username || 'Admin'}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex flex-wrap gap-2 justify-end">
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
            <button 
              onClick={() => {
                document.getElementById('recent-fields-section')?.scrollIntoView({ behavior: 'smooth' });
                setActiveTab('fields');
              }}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Recent Fields
            </button>
            <button 
              onClick={() => {
                document.getElementById('recent-observations-section')?.scrollIntoView({ behavior: 'smooth' });
                setActiveTab('observations');
              }}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Recent Observations
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4  mt-6">
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

      {/* Field Status Analytics Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" />
            Field Status Analytics
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart Visualization */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {totalFields > 0 && (
                    <>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${(activeFields / totalFields) * 251.2} 251.2`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="20"
                        strokeDasharray={`${(atRiskFields / totalFields) * 251.2} 251.2`}
                        strokeDashoffset={`-${(activeFields / totalFields) * 251.2}`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={`${(completedFields / totalFields) * 251.2} 251.2`}
                        strokeDashoffset={`-${((activeFields + atRiskFields) / totalFields) * 251.2}`}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-500"
                      />
                    </>
                  )}
                  <text x="50" y="50" textAnchor="middle" dy="5" className="text-lg font-bold fill-gray-800">
                    {totalFields}
                  </text>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mt-2">Total Fields</p>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    Active Fields
                  </span>
                  <span className="font-semibold text-gray-900">{activeFields}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 rounded-full h-2 transition-all duration-500" style={{ width: `${totalFields > 0 ? (activeFields / totalFields) * 100 : 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{totalFields > 0 ? ((activeFields / totalFields) * 100).toFixed(1) : 0}% of total fields</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    At Risk Fields
                  </span>
                  <span className="font-semibold text-amber-600">{atRiskFields}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-500 rounded-full h-2 transition-all duration-500" style={{ width: `${totalFields > 0 ? (atRiskFields / totalFields) * 100 : 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{totalFields > 0 ? ((atRiskFields / totalFields) * 100).toFixed(1) : 0}% of total fields</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Completed Fields
                  </span>
                  <span className="font-semibold text-blue-600">{completedFields}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2 transition-all duration-500" style={{ width: `${totalFields > 0 ? (completedFields / totalFields) * 100 : 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{totalFields > 0 ? ((completedFields / totalFields) * 100).toFixed(1) : 0}% of total fields</p>
              </div>

              {/* Health Score Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Overall Field Health
                  </span>
                  <span className="font-semibold text-gray-900">
                    {totalFields > 0 ? Math.round(((activeFields + completedFields) / totalFields) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className={`rounded-full h-3 transition-all duration-500 ${
                      totalFields > 0 && ((activeFields + completedFields) / totalFields) > 0.7 
                        ? 'bg-emerald-500' 
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${totalFields > 0 ? ((activeFields + completedFields) / totalFields) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {totalFields > 0 && ((activeFields + completedFields) / totalFields) > 0.7 
                    ? 'Good standing - Most fields are healthy' 
                    : 'Needs attention - Several fields at risk'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation for Recent Items */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('fields')}
            className={`pb-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition ${
              activeTab === 'fields'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            Recent Fields
            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
              {recentFields.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('observations')}
            className={`pb-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition ${
              activeTab === 'observations'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Recent Observations
            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
              {recentObservations.length}
            </span>
            {activeTab === 'observations' && (
              <span className="ml-2 text-xs text-emerald-600 animate-pulse">
                ● Live
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content - Recent Fields */}
      {activeTab === 'fields' && (
        <div id="recent-fields-section" className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <List className="w-5 h-5 text-emerald-600" />
              Recent Fields
            </h3>
            <Link to="/fields" className="text-emerald-600 hover:text-emerald-700 text-sm">View all fields →</Link>
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
                  {recentFields.map((field) => (
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
                        <Link to={`/fields/${field.id}`} className="text-emerald-600 hover:text-emerald-700 text-sm">View →</Link>
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
      )}

      {/* Tab Content - Recent Observations */}
      {activeTab === 'observations' && (
        <div id="recent-observations-section" className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Recent Observations
              <span className="text-xs text-gray-400 font-normal ml-2">Latest {recentObservations.length}</span>
              <span className="ml-2 text-xs text-emerald-600 animate-pulse">
                Auto-refreshing...
              </span>
            </h3>
          </div>
          
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {recentObservations.length > 0 ? (
              recentObservations.map((obs) => (
                <div 
                  key={obs.id} 
                  className="bg-gray-50 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => toggleObservationExpand(obs.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            to={`/fields/${obs.field}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            {obs.field_name || `Field #${obs.field}`}
                          </Link>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(obs.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {obs.note}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {obs.crop_health && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              obs.crop_health === 'excellent' ? 'bg-green-100 text-green-700' :
                              obs.crop_health === 'good' ? 'bg-blue-100 text-blue-700' :
                              obs.crop_health === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              Health: {obs.crop_health}
                            </span>
                          )}
                          {obs.stage_at_observation && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                              Stage: {obs.stage_at_observation}
                            </span>
                          )}
                          {obs.photos && obs.photos.length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {obs.photos.length} photo(s)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">By: {obs.agent_name}</p>
                      </div>
                      <div className="ml-2">
                        {expandedObservation === obs.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {expandedObservation === obs.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{obs.note}</p>
                          
                          {/* Images Section */}
                          {obs.photos && obs.photos.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs font-medium text-gray-500 mb-2">Attached Images:</p>
                              <div className="flex flex-wrap gap-2">
                                {obs.photos.slice(0, 6).map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`Observation ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border border-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(photo, '_blank');
                                    }}
                                  />
                                ))}
                                {obs.photos.length > 6 && (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-500">+{obs.photos.length - 6} more</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-end">
                            <Link
                              to={`/fields/${obs.field}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              View Full Field Details
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No observations yet</p>
                <p className="text-sm text-gray-400">Observations will appear here when field agents add them</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* At-Risk Alert */}
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
              <input type="email" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="text" placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="password" placeholder="Confirm Password" value={newAdmin.confirmPassword} onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
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
              <input type="email" placeholder="Email" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              <input type="text" placeholder="Username" value={newAgent.username} onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
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