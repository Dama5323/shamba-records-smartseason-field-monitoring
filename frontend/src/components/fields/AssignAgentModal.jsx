import React, { useState, useEffect } from 'react'
import { X, User, Shield, Search } from 'lucide-react'
import { adminService, fieldService } from '../../services/api'
import toast from 'react-hot-toast'

const AssignAgentModal = ({ isOpen, onClose, field, onAssigned }) => {
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchAgents()
    }
  }, [isOpen])

  const fetchAgents = async () => {
    try {
      const response = await adminService.getAgents()
      // Handle different response formats
      let agentsList = []
      if (Array.isArray(response)) {
        agentsList = response
      } else if (response && response.agents && Array.isArray(response.agents)) {
        agentsList = response.agents
      } else if (response && response.results && Array.isArray(response.results)) {
        agentsList = response.results
      }
      setAgents(agentsList)
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast.error('Failed to load agents')
    }
  }

  const handleAssign = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent')
      return
    }

    setLoading(true)
    try {
      await fieldService.assignField(field.id, selectedAgent)
      toast.success(`Field assigned to agent successfully`)
      onAssigned()
      onClose()
    } catch (error) {
      console.error('Error assigning field:', error)
      toast.error(error.response?.data?.error || 'Failed to assign field')
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async () => {
    setLoading(true)
    try {
      await fieldService.unassignField(field.id)
      toast.success('Field unassigned successfully')
      onAssigned()
      onClose()
    } catch (error) {
      console.error('Error unassigning field:', error)
      toast.error(error.response?.data?.error || 'Failed to unassign field')
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(agent =>
    agent.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Assign Field to Agent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Field:</strong> {field.name}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Current Agent:</strong>{' '}
              {field.assigned_to_details?.username || field.assigned_to || 'Unassigned'}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Agents List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Select Agent:</p>
            {filteredAgents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No agents found</p>
            ) : (
              filteredAgents.map((agent) => (
                <label
                  key={agent.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.id
                      ? 'bg-green-50 border border-green-300'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="agent"
                    value={agent.id}
                    checked={selectedAgent === agent.id}
                    onChange={() => setSelectedAgent(agent.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <p className="font-medium text-gray-800">{agent.username}</p>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{agent.email}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {agent.assigned_fields_count || 0} fields
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedAgent}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Assigning...' : 'Assign Field'}
            </button>
            {field.assigned_to && (
              <button
                onClick={handleUnassign}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Unassign
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignAgentModal