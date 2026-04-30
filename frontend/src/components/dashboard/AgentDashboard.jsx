// AgentDashboard.jsx - Full width layout (end-to-end)
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  MessageSquare,
  Edit,
  Bell,
  Clock,
  PieChart,
  RefreshCw,
  Activity,
  ChevronRight,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Map,
  List
} from 'lucide-react'
import { fieldService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const AgentDashboard = () => {
  const [fields, setFields] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    atRisk: 0,
    completed: 0
  })
  const [stageBreakdown, setStageBreakdown] = useState({
    planted: 0,
    growing: 0,
    ready: 0,
    harvested: 0
  })
  const [recentObservations, setRecentObservations] = useState([])
  const [recentFieldsList, setRecentFieldsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('fields')
  const [expandedObservation, setExpandedObservation] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
    loadDemoNotifications()
  }, [])

  useEffect(() => {
    let interval
    if (activeTab === 'observations') {
      interval = setInterval(() => {
        fetchRecentObservations()
      }, 15000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab])

  const loadDemoNotifications = () => {
    const demoNotifications = [
      {
        id: 1,
        type: 'update',
        title: 'Field Update Reminder',
        message: 'North Field hasn\'t been updated in 5 days',
        fieldId: 1,
        fieldName: 'North Field',
        time: '2 hours ago',
        priority: 'high'
      },
      {
        id: 2,
        type: 'risk',
        title: 'At Risk Alert',
        message: 'East Field showing signs of pest damage - needs immediate attention',
        fieldId: 2,
        fieldName: 'East Field',
        time: '5 hours ago',
        priority: 'high'
      },
      {
        id: 3,
        type: 'stage',
        title: 'Stage Advancement',
        message: 'South Field is ready for harvest',
        fieldId: 3,
        fieldName: 'South Field',
        time: '1 day ago',
        priority: 'medium'
      },
      {
        id: 4,
        type: 'weather',
        title: 'Weather Alert',
        message: 'Heavy rain expected tomorrow - consider postponing field activities',
        time: '1 day ago',
        priority: 'medium'
      },
      {
        id: 5,
        type: 'achievement',
        title: 'Weekly Summary',
        message: 'You\'ve updated 3 fields this week. Great progress!',
        time: '2 days ago',
        priority: 'low'
      }
    ]
    setNotifications(demoNotifications)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fieldService.getMyFields()
      
      let fieldsData = []
      if (Array.isArray(response)) {
        fieldsData = response
      } else if (response && response.fields && Array.isArray(response.fields)) {
        fieldsData = response.fields
      } else {
        fieldsData = []
      }
      
      setFields(fieldsData)
      setRecentFieldsList(fieldsData.slice(0, 5))
      
      const total = fieldsData.length
      const active = fieldsData.filter(f => f.status === 'Active' || (!f.status && f.current_stage !== 'harvested')).length
      const atRisk = fieldsData.filter(f => f.status === 'At Risk' || f.requires_attention).length
      const completed = fieldsData.filter(f => f.status === 'Completed' || f.current_stage === 'harvested').length
      
      setStats({ total, active, atRisk, completed })
      
      const breakdown = {
        planted: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'planted').length,
        growing: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'growing').length,
        ready: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'ready').length,
        harvested: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'harvested').length
      }
      setStageBreakdown(breakdown)
      
      await fetchRecentObservations(fieldsData)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentObservations = async (fieldsData = null) => {
    try {
      const data = fieldsData || fields
      let allObservations = []
      
      for (const field of data) {
        try {
          const observations = await fieldService.getFieldObservations(field.id)
          if (Array.isArray(observations)) {
            const obsWithField = observations.map(obs => ({
              ...obs,
              field_name: field.name,
              field_id: field.id
            }))
            allObservations.push(...obsWithField)
          }
        } catch (err) {
          console.error(`Error fetching observations for field ${field.id}:`, err)
        }
      }
      
      const sortedObservations = allObservations
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
      
      setRecentObservations(sortedObservations)
      
    } catch (error) {
      console.error('Error fetching observations:', error)
    }
  }

  const getPendingUpdatesCount = () => {
    return notifications.filter(n => n.priority === 'high').length
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return `${Math.floor(diffDays / 7)}w ago`
  }

  const toggleObservationExpand = (id) => {
    setExpandedObservation(expandedObservation === id ? null : id)
  }

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-emerald-100 text-emerald-700',
      'At Risk': 'bg-amber-100 text-amber-700',
      Completed: 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getStageBadge = (stage) => {
    const styles = {
      planted: 'bg-purple-100 text-purple-700',
      growing: 'bg-blue-100 text-blue-700',
      ready: 'bg-orange-100 text-orange-700',
      harvested: 'bg-emerald-100 text-emerald-700'
    }
    return styles[stage?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0

  const healthScore = stats.total > 0 
    ? Math.round(((stats.active + stats.completed) / stats.total) * 100) 
    : 0

  const pendingUpdatesCount = getPendingUpdatesCount()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Full Width */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Welcome back, {user?.first_name || user?.username || 'Agent'}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => navigate('/fields')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Recent Fields</span>
              </button>
              
              <button 
                onClick={() => navigate('/observations')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Recent Observations</span>
                {recentObservations.length > 0 && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {recentObservations.length}
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => navigate('/fields')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Update Stage</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                  {pendingUpdatesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingUpdatesCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-[500px] overflow-hidden">
                      <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button onClick={() => { toast.success('Notifications refreshed'); loadDemoNotifications(); }} className="text-xs text-blue-600 hover:text-blue-700">Refresh</button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                              <div key={notification.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => { setShowNotifications(false); if (notification.fieldId) navigate(`/fields/${notification.fieldId}`); }}>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.priority === 'high' ? 'bg-red-100' : notification.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                    {notification.type === 'update' && <Edit className="w-4 h-4 text-gray-600" />}
                                    {notification.type === 'risk' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                                    {notification.type === 'stage' && <Sprout className="w-4 h-4 text-green-600" />}
                                    {notification.type === 'achievement' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                                  </div>
                                  {notification.priority === 'high' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - FULL WIDTH, no side padding */}
      <div className="space-y-6">
        
        {/* Stats Cards - Full Width */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
          <div className="bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Map className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-gray-600 text-sm mt-3">Total Fields</p>
          </div>

          <div className="bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.active}</span>
            </div>
            <p className="text-gray-600 text-sm mt-3">Active Fields</p>
          </div>

          <div className="bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.atRisk}</span>
            </div>
            <p className="text-gray-600 text-sm mt-3">At Risk</p>
          </div>

          <div className="bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{completionPercentage}%</span>
            </div>
            <p className="text-gray-600 text-sm mt-3">Completion Rate</p>
          </div>
        </div>

        {/* Field Analytics Section - Full Width */}
        <div className="bg-white border-t border-b border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Field Analytics
            </h3>
            <p className="text-xs text-gray-500 mt-1">Your field performance overview</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {stats.total > 0 && (
                      <>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray={`${(stats.active / stats.total) * 251.2} 251.2`} strokeDashoffset="0" transform="rotate(-90 50 50)" className="transition-all duration-500" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray={`${(stats.atRisk / stats.total) * 251.2} 251.2`} strokeDashoffset={`-${(stats.active / stats.total) * 251.2}`} transform="rotate(-90 50 50)" className="transition-all duration-500" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray={`${(stats.completed / stats.total) * 251.2} 251.2`} strokeDashoffset={`-${((stats.active + stats.atRisk) / stats.total) * 251.2}`} transform="rotate(-90 50 50)" className="transition-all duration-500" />
                      </>
                    )}
                    <text x="50" y="50" textAnchor="middle" dy="5" className="text-lg font-bold fill-gray-800">{stats.total}</text>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mt-2">Total Fields</p>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Active Fields</span>
                    <span className="font-semibold text-gray-900">{stats.active}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 rounded-full h-2 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>At Risk Fields</span>
                    <span className="font-semibold text-amber-600">{stats.atRisk}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-amber-500 rounded-full h-2 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.atRisk / stats.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Completed Fields</span>
                    <span className="font-semibold text-blue-600">{stats.completed}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" />Your Field Health Score</span>
                    <span className="font-semibold text-gray-900">{healthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`rounded-full h-3 transition-all duration-500 ${healthScore > 70 ? 'bg-emerald-500' : healthScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Stage Distribution - Full Width */}
        <div className="bg-white border-t border-b border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Crop Stage Distribution
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stageBreakdown.planted}</div>
                <p className="text-sm text-gray-600 mt-1">🌱 Planted</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stageBreakdown.growing}</div>
                <p className="text-sm text-gray-600 mt-1">🌿 Growing</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stageBreakdown.ready}</div>
                <p className="text-sm text-gray-600 mt-1">🌾 Ready</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stageBreakdown.harvested}</div>
                <p className="text-sm text-gray-600 mt-1">🚜 Harvested</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Full Width */}
        <div className="border-b border-gray-200 bg-white px-6">
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
                {recentFieldsList.length}
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
              {activeTab === 'observations' && recentObservations.length > 0 && (
                <span className="ml-2 text-xs text-emerald-600 animate-pulse">● Live</span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content - Full Width */}
        {activeTab === 'fields' && (
          <div className="bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-600" />
                Your Recent Fields
              </h3>
              <button onClick={() => navigate('/fields')} className="text-emerald-600 hover:text-emerald-700 text-sm">View all fields →</button>
            </div>
            
            {recentFieldsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentFieldsList.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/fields/${field.id}`)}>
                        <td className="px-6 py-3 font-medium text-gray-800">{field.name}</td>
                        <td className="px-6 py-3 text-gray-600">{field.crop_type || 'Maize'}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStageBadge(field.current_stage)}`}>
                            {field.current_stage || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(field.status)}`}>
                            {field.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {formatRelativeTime(field.updated_at || field.last_updated)}
                        </td>
                        <td className="px-6 py-3">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No fields assigned yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'observations' && (
          <div className="bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Recent Observations
                  <span className="text-xs text-gray-400 font-normal ml-2">Latest {recentObservations.length}</span>
                  {recentObservations.length > 0 && <span className="ml-2 text-xs text-emerald-600 animate-pulse">Auto-refreshing...</span>}
                </h3>
              </div>
              <button onClick={() => navigate('/observations/new')} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Add Observation</button>
            </div>
            
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {recentObservations.length > 0 ? (
                recentObservations.slice(0, 10).map((obs) => (
                  <div key={obs.id} className="bg-gray-50 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => toggleObservationExpand(obs.id)}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-emerald-600">{obs.field_name || `Field #${obs.field}`}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(obs.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{obs.note}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {obs.crop_health && <span className={`text-xs px-2 py-0.5 rounded-full ${obs.crop_health === 'excellent' ? 'bg-green-100 text-green-700' : obs.crop_health === 'good' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>Health: {obs.crop_health}</span>}
                            {obs.stage_at_observation && <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Stage: {obs.stage_at_observation}</span>}
                            {obs.photos && obs.photos.length > 0 && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1"><ImageIcon className="w-3 h-3" />{obs.photos.length} photo(s)</span>}
                          </div>
                        </div>
                        <div className="ml-2">{expandedObservation === obs.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                      </div>
                      {expandedObservation === obs.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{obs.note}</p>
                            {obs.photos && obs.photos.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Attached Images:</p>
                                <div className="flex flex-wrap gap-2">
                                  {obs.photos.slice(0, 6).map((photo, idx) => <img key={idx} src={photo} alt={`Observation ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border border-gray-200" onClick={(e) => { e.stopPropagation(); window.open(photo, '_blank'); }} />)}
                                </div>
                              </div>
                            )}
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
                  <button onClick={() => navigate('/observations/new')} className="mt-3 text-sm text-blue-600 hover:text-blue-700">+ Add your first observation</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* At-Risk Alert Banner - Full Width */}
        {stats.atRisk > 0 && (
          <div className="bg-amber-50 border-t border-b border-amber-200 p-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800"><span className="font-medium">{stats.atRisk} field(s) at risk.</span> Fields become "At Risk" when not updated for 5+ days.</p>
              <button onClick={() => navigate('/at-risk')} className="text-sm text-amber-700 font-medium hover:underline">View →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDashboard