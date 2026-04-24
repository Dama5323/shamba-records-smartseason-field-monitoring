import React from 'react'
import { Sprout, Plus, Users, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const EmptyState = ({ type, message, actionText, onAction }) => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  
  const icons = {
    fields: <Sprout className="h-16 w-16 text-gray-400" />,
    observations: <AlertCircle className="h-16 w-16 text-gray-400" />,
    agents: <Users className="h-16 w-16 text-gray-400" />
  }
  
  const defaultMessages = {
    fields: {
      title: "No fields yet",
      description: isAdmin 
        ? "Get started by creating your first field" 
        : "No fields have been assigned to you yet. Contact your administrator.",
      action: isAdmin ? "Create Field" : "Contact Admin"
    },
    observations: {
      title: "No observations",
      description: "Add your first observation to track crop progress",
      action: "Add Observation"
    }
  }
  
  const content = defaultMessages[type] || { title: message, description: message, action: actionText }
  
  return (
    <div className="text-center py-12">
      <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
        {icons[type] || <Sprout className="h-12 w-12 text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{content.title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{content.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>{content.action}</span>
        </button>
      )}
    </div>
  )
}

export default EmptyState