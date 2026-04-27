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
  Sparkles,
  Eye,
  Clock
} from 'lucide-react'
import FieldList from '../fields/FieldList'
import { fieldService, dashboardService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../../services/api'

// Background image URL
const HAPPY_FARMER_BG = 'https://res.cloudinary.com/dzyqof9it/image/upload/v1777133179/shamba_happy_farmer_gylsnt.jpg'
// Seasonal image URL for insights
const SEASON_TIME_IMG = 'https://res.cloudinary.com/dzyqof9it/image/upload/v1777133179/shamba_season_time_upy0pv.jpg'

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
  const [recentObservations, setRecentObservations] = useState([])
  const [creatingDemo, setCreatingDemo] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  
  useEffect(() => {
    fetchMyFields()
    fetchDashboardStats()
    checkAndCreateDemoFields()
    fetchRecentObservations()
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
  
  // Fetch observations directly from fields
  const fetchRecentObservations = async () => {
    try {
      console.log('Fetching observations from fields...')
      
      const fieldsResponse = await fieldService.getMyFields()
      
      let fieldsData = []
      if (Array.isArray(fieldsResponse)) {
        fieldsData = fieldsResponse
      } else if (fieldsResponse && fieldsResponse.fields && Array.isArray(fieldsResponse.fields)) {
        fieldsData = fieldsResponse.fields
      } else {
        fieldsData = []
      }
      
      console.log('Fields found:', fieldsData.length)
      
      let allObservations = []
      for (const field of fieldsData) {
        try {
          const fieldObs = await fieldService.getFieldObservations(field.id)
          if (Array.isArray(fieldObs) && fieldObs.length > 0) {
            console.log(`Found ${fieldObs.length} observations for field: ${field.name}`)
            allObservations = [...allObservations, ...fieldObs.map(obs => ({
              ...obs,
              field_name: field.name,
              field_id: field.id
            }))]
          }
        } catch (err) {
          console.error(`Error fetching observations for field ${field.id}:`, err)
        }
      }
      
      console.log('Total observations found:', allObservations.length)
      
      const sortedObservations = allObservations
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
      
      console.log('Recent observations (first 5):', sortedObservations)
      setRecentObservations(sortedObservations)
      
    } catch (error) {
      console.error('Error fetching observations:', error)
      setRecentObservations([])
    }
  }
  
  const createDemoFields = async () => {
    setCreatingDemo(true)
    try {
      const response = await api.post('/create-demo-fields/')
      toast.success(response.data.message)
      fetchMyFields()
      fetchRecentObservations()
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
  
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }
  
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${HAPPY_FARMER_BG})` }}
    >
      <div className="min-h-screen bg-black/30 backdrop-blur-sm">
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
          
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-green-800/90 to-emerald-800/90 backdrop-blur-sm rounded-2xl p-6 text-white shadow-sm">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Welcome back, {userDisplayName}! 🌾</h1>
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
          
          {/* Seasonal Insights Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/20">
            <div className="flex flex-col md:flex-row gap-5 items-center">
              <img 
                src={SEASON_TIME_IMG} 
                alt="Seasonal farming insights" 
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📅</span>
                  <h3 className="text-lg font-semibold text-gray-800">Smart Season Calendar</h3>
                </div>
                <p className="text-gray-700">
                  Based on current weather patterns, <strong>March - June</strong> is the optimal planting window for maize in your region.
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌱 Planting season</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">💧 Rain expected next week</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">🌡️ Optimal temperature 18-25°C</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <div key={index} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
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
          
          {/* Quick Actions Section - Agent only (3 actions, NO "Add Field") */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Stage Breakdown */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5">
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
            
            {/* Recent Fields */}
            <div className="lg:col-span-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5">
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
          
          {/* Recent Observations Section */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              Recent Observations
            </h3>
            
            {recentObservations.length > 0 ? (
              <div className="space-y-3">
                {recentObservations.map((obs) => (
                  <div key={obs.id} className="flex items-start space-x-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all duration-200">
                    <div className="bg-green-100 rounded-lg p-2 flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {obs.field_name || `Field #${obs.field_id}`}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatRelativeTime(obs.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            Stage: {obs.stage_at_observation}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/fields/${obs.field_id || obs.field}`)}
                      className="text-green-600 hover:text-green-700 flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No observations yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add an observation from any of your fields
                </p>
                <button
                  onClick={() => navigate('/fields')}
                  className="mt-3 text-sm text-green-600 hover:text-green-700"
                >
                  Go to fields →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboard