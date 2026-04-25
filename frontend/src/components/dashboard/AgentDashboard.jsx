import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Plus,
  BarChart3,
  Calendar,
  MessageSquare,
  Edit,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import StatsCard from './StatsCard'
import FieldList from '../fields/FieldList'
import { fieldService, dashboardService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../../services/api'

const AgentDashboard = () => {
  const [fields, setFields] = useState([])
  const [stats, setStats] = useState(null)
  const [stageBreakdown, setStageBreakdown] = useState({
    planted: 0,
    growing: 0,
    ready: 0,
    harvested: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [creatingDemo, setCreatingDemo] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  
  useEffect(() => {
    fetchMyFields()
    fetchDashboardStats()
    checkAndCreateDemoFields()
    fetchRecentActivities()
  }, [])
  
  const fetchMyFields = async () => {
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
      
      const total = fieldsData.length
      const active = fieldsData.filter(f => f.status === 'Active').length
      const atRisk = fieldsData.filter(f => f.status === 'At Risk').length
      const completed = fieldsData.filter(f => f.status === 'Completed').length
      
      setStats({ total, active, atRisk, completed })
      
      const breakdown = {
        planted: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'planted').length,
        growing: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'growing').length,
        ready: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'ready').length,
        harvested: fieldsData.filter(f => f.current_stage?.toLowerCase() === 'harvested').length
      }
      setStageBreakdown(breakdown)
      
    } catch (error) {
      console.error('Error fetching fields:', error)
      toast.error('Failed to load your fields')
      setFields([])
      setStats({ total: 0, active: 0, atRisk: 0, completed: 0 })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats()
      console.log('Dashboard stats:', data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }
  
  const fetchRecentActivities = async () => {
    setRecentActivities([
      { id: 1, action: 'Added observation', field: 'Demo Maize Field', time: '2 hours ago', icon: MessageSquare },
      { id: 2, action: 'Updated stage to Ready', field: 'Demo Rice Paddy', time: '1 day ago', icon: Edit },
      { id: 3, action: 'Created field', field: 'Demo Wheat Field', time: '3 days ago', icon: Plus },
    ])
  }
  
  const createDemoFields = async () => {
    setCreatingDemo(true)
    try {
      const response = await api.post('/create-demo-fields/')
      toast.success(response.data.message)
      fetchMyFields()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create demo fields')
    } finally {
      setCreatingDemo(false)
    }
  }
  
  const checkAndCreateDemoFields = async () => {
    const response = await fieldService.getMyFields()
    let fieldsData = []
    if (response && response.fields && Array.isArray(response.fields)) {
      fieldsData = response.fields
    }
    
    if (fieldsData.length === 0) {
      const demoCreated = localStorage.getItem('demo_fields_created')
      if (!demoCreated) {
        await createDemoFields()
        localStorage.setItem('demo_fields_created', 'true')
      }
    }
  }
  
  const statsCards = stats ? [
    { title: 'Total Fields', value: stats.total, icon: Sprout, color: 'primary' },
    { title: 'Active', value: stats.active, icon: TrendingUp, color: 'green' },
    { title: 'At Risk', value: stats.atRisk, icon: AlertTriangle, color: 'amber' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'blue' }
  ] : []
  
  const userDisplayName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'User'
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {userDisplayName}!</h1>
            <p className="text-emerald-100">Track and monitor your assigned fields efficiently.</p>
          </div>
          {fields.length === 0 && !creatingDemo && (
            <button
              onClick={createDemoFields}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Load Demo Fields</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`bg-${stat.color === 'primary' ? 'green' : stat.color}-100 p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 text-${stat.color === 'primary' ? 'green' : stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions Section - Full width above recent fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Primary Action - Add Field (spans full width on mobile, 1 column on desktop) */}
          <button
            onClick={() => navigate('/fields/create')}
            className="md:col-span-1 flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Add Field</p>
                <p className="text-xs text-emerald-100">Create new field</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>

          {/* Secondary Actions */}
          <button
            onClick={() => navigate('/fields')}
            className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Add Observation</p>
                <p className="text-xs text-gray-500">Record crop status</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => navigate('/fields')}
            className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-purple-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Edit className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Update Stage</p>
                <p className="text-xs text-gray-500">Advance growth</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => navigate('/at-risk')}
            className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-amber-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 rounded-lg p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">At Risk</p>
                <p className="text-xs text-gray-500">View issues</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Two Column Layout for Stage Breakdown and Recent Fields */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stage Breakdown - Left Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
            Stage Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Planted', value: stageBreakdown.planted, color: 'bg-purple-400' },
              { label: 'Growing', value: stageBreakdown.growing, color: 'bg-blue-400' },
              { label: 'Ready', value: stageBreakdown.ready, color: 'bg-amber-400' },
              { label: 'Harvested', value: stageBreakdown.harvested, color: 'bg-green-500' }
            ].map((stage, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{stage.label}</span>
                  <span className="font-medium text-gray-900">{stage.value} fields</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${stats?.total ? (stage.value / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Fields - Right Column (spans 2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <Sprout className="h-4 w-4 mr-2 text-green-600" />
                Recent Fields
              </h3>
              {fields.length > 0 && (
                <button
                  onClick={() => navigate('/fields')}
                  className="text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  View All →
                </button>
              )}
            </div>
            <FieldList fields={fields.slice(0, 3)} showActions />
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all duration-200">
                <div className="bg-gray-100 rounded-lg p-2">
                  <activity.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.field}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentDashboard