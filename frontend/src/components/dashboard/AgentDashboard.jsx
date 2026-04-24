import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Plus,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  MessageSquare,
  Edit,
  Eye
} from 'lucide-react'
import StatsCard from './StatsCard'
import FieldList from '../fields/FieldList'
import { fieldService, dashboardService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

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
  const navigate = useNavigate()
  const { user } = useAuth()
  
  useEffect(() => {
    fetchMyFields()
    fetchDashboardStats()
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
    // Mock recent activities - replace with actual API call
    setRecentActivities([
      { id: 1, action: 'Added observation', field: 'Test Maize Field', time: '2 hours ago', icon: MessageSquare },
      { id: 2, action: 'Updated stage to Ready', field: 'Test Maize Field', time: '1 day ago', icon: Edit },
      { id: 3, action: 'Created field', field: 'Test Field for Agent', time: '3 days ago', icon: Plus },
    ])
  }
  
  const statsCards = stats ? [
    { title: 'Total Fields', value: stats.total, icon: Sprout, color: 'primary' },
    { title: 'Active', value: stats.active, icon: TrendingUp, color: 'green' },
    { title: 'At Risk', value: stats.atRisk, icon: AlertTriangle, color: 'yellow' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'blue' }
  ] : []
  
  const userDisplayName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'User'
  
  const quickActions = [
    { icon: Plus, label: 'Add Field', color: 'green', onClick: () => navigate('/fields/create'), adminOnly: true },
    { icon: MessageSquare, label: 'Add Observation', color: 'blue', onClick: () => navigate('/fields') },
    { icon: Edit, label: 'Update Stage', color: 'purple', onClick: () => navigate('/fields') },
    { icon: Eye, label: 'View All', color: 'orange', onClick: () => navigate('/fields') },
  ]
  
  const filteredActions = quickActions.filter(action => !action.adminOnly || user?.role === 'admin')
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {userDisplayName}!</h1>
            <p className="text-green-100">Track and monitor your assigned fields efficiently.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/fields')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Stage Breakdown & Quick Actions */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Stage Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Planted', value: stageBreakdown.planted, color: 'bg-purple-600' },
                { label: 'Growing', value: stageBreakdown.growing, color: 'bg-blue-600' },
                { label: 'Ready', value: stageBreakdown.ready, color: 'bg-orange-600' },
                { label: 'Harvested', value: stageBreakdown.harvested, color: 'bg-green-600' }
              ].map((stage, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stage.label}</span>
                    <span className="font-medium">{stage.value} fields</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${stats?.total ? (stage.value / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {filteredActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`p-3 bg-${action.color}-50 rounded-lg text-center hover:bg-${action.color}-100 transition-all group`}
                >
                  <action.icon className={`h-5 w-5 text-${action.color}-600 mx-auto mb-1 group-hover:scale-110 transition-transform`} />
                  <p className="text-xs text-gray-700">{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Recent Fields */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sprout className="h-5 w-5 mr-2 text-green-600" />
                Recent Fields
              </h3>
              {fields.length > 0 && (
                <button
                  onClick={() => navigate('/fields')}
                  className="text-sm text-green-600 hover:text-green-700"
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
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-100 rounded-full p-2">
                  <activity.icon className="h-4 w-4 text-green-600" />
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