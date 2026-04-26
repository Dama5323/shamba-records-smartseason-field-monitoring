import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isValid, parseISO } from 'date-fns'
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Sprout,
  Eye,
  Edit,
  MessageSquare,
  UserPlus
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import AssignAgentModal from './AssignAgentModal'

const FieldCard = ({ field, onUpdate }) => {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [showActions, setShowActions] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'At Risk': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <TrendingUp className="h-4 w-4" />
      case 'At Risk': return <AlertTriangle className="h-4 w-4" />
      case 'Completed': return <CheckCircle className="h-4 w-4" />
      default: return null
    }
  }
  
  const getStageColor = (stage) => {
    const colors = {
      'planted': 'bg-purple-100 text-purple-800',
      'growing': 'bg-blue-100 text-blue-800',
      'ready': 'bg-orange-100 text-orange-800',
      'harvested': 'bg-green-100 text-green-800'
    }
    return colors[stage?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set'
    try {
      let date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      if (isValid(date)) return format(date, 'MMM dd, yyyy')
      return 'Invalid date'
    } catch {
      return 'Date error'
    }
  }
  
  const handleViewDetails = () => {
    navigate(`/fields/${field.id}`)
  }
  
  const handleAddObservation = (e) => {
    e.stopPropagation()
    navigate(`/fields/${field.id}?addObservation=true`)
  }
  
  const handleUpdateStage = (e) => {
    e.stopPropagation()
    navigate(`/fields/${field.id}`)
    setTimeout(() => {
      const stageButton = document.querySelector('[data-stage-update]')
      if (stageButton) stageButton.click()
    }, 100)
  }

  const handleAssignAgent = (e) => {
    e.stopPropagation()
    setShowAssignModal(true)
  }

  const handleAssigned = () => {
    if (onUpdate) onUpdate()
  }
  
  const cropType = field.crop_type || 'Unknown crop'
  const stage = field.current_stage || 'Not specified'
  const status = field.status || 'Active'
  const fieldName = field.name || 'Unnamed Field'
  const fieldId = field.id || 'N/A'
  
  return (
    <>
      <div 
        className="card hover:shadow-lg transition-all duration-200 cursor-pointer relative group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleViewDetails}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{fieldName}</h3>
            <p className="text-xs text-gray-500">Field #{fieldId}</p>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span>{status}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Sprout className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium">{cropType}</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(stage)}`}>
              {stage}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{field.location || 'Location not set'}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Planted: {formatDate(field.planting_date)}</span>
          </div>
          
          {field.assigned_to_details && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              Agent: {field.assigned_to_details.username || field.assigned_to_details.email}
            </div>
          )}
        </div>
        
        {/* Quick Actions Overlay - Updated with Assign Agent for Admin */}
        {showActions && (
          <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center space-x-3 animate-fade-in">
            <button
              onClick={handleViewDetails}
              className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
            >
              <Eye className="h-5 w-5 text-green-600" />
              <span className="text-xs mt-1 text-gray-700">View</span>
            </button>
            <button
              onClick={handleAddObservation}
              className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
            >
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-xs mt-1 text-gray-700">Observe</span>
            </button>
            <button
              onClick={handleUpdateStage}
              className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
            >
              <Edit className="h-5 w-5 text-purple-600" />
              <span className="text-xs mt-1 text-gray-700">Update</span>
            </button>
            {/* Assign Agent button - only visible to admins */}
            {isAdmin && (
              <button
                onClick={handleAssignAgent}
                className="flex flex-col items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all"
              >
                <UserPlus className="h-5 w-5 text-orange-600" />
                <span className="text-xs mt-1 text-gray-700">Assign</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      <AssignAgentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        field={field}
        onAssigned={handleAssigned}
      />
    </>
  )
}

export default FieldCard