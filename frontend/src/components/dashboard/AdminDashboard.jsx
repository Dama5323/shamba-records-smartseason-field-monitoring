import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  TrendingUp,
  Plus,
  Download
} from 'lucide-react'
import StatsCard from './StatsCard'
import FieldList from '../fields/FieldList'
import { dashboardService, exportService } from '../../services/api'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentFields, setRecentFields] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, recentData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentFields()
      ])
      setStats(statsData)
      setRecentFields(recentData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }
  
  const handleExportCSV = async () => {
    try {
      const blob = await exportService.exportFieldsCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fields_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Export started successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }
  
  const statsCards = stats ? [
    { title: 'Total Fields', value: stats.total_fields, icon: Sprout, color: 'primary' },
    { title: 'Active Fields', value: stats.active_fields, icon: TrendingUp, color: 'green' },
    { title: 'At Risk', value: stats.at_risk_fields, icon: AlertTriangle, color: 'yellow' },
    { title: 'Completed', value: stats.completed_fields, icon: CheckCircle, color: 'blue' },
    { title: 'Total Agents', value: stats.total_agents, icon: Users, color: 'purple' }
  ] : []
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of all fields and system statistics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/fields/create')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Field</span>
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      
      {/* Recent Fields */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Fields</h2>
        <FieldList fields={recentFields} showActions />
      </div>
    </div>
  )
}

export default AdminDashboard