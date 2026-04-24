import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { fieldService, adminService } from '../../services/api'
import { CROP_TYPES, CROP_STAGES } from '../../utils/constants'
import toast from 'react-hot-toast'

const CreateField = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    crop_type: 'Maize',
    planting_date: new Date().toISOString().split('T')[0],
    current_stage: 'Planted',
    assigned_agent_id: ''
  })
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  const fetchAgents = async () => {
    try {
      const data = await adminService.getAgents()
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const fieldData = {
        name: formData.name,
        crop_type: formData.crop_type,
        planting_date: formData.planting_date,
        current_stage: formData.current_stage
      }
      
      const newField = await fieldService.createField(fieldData)
      
      // Assign to agent if selected
      if (formData.assigned_agent_id) {
        await fieldService.assignToAgent(newField.id, formData.assigned_agent_id)
      }
      
      toast.success('Field created successfully')
      navigate(`/fields/${newField.id}`)
    } catch (error) {
      console.error('Error creating field:', error)
      toast.error('Failed to create field')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </button>
      
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Field</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">
              Field Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="e.g., North Field, Section A"
            />
          </div>
          
          <div>
            <label htmlFor="crop_type" className="label">
              Crop Type *
            </label>
            <select
              id="crop_type"
              name="crop_type"
              required
              value={formData.crop_type}
              onChange={handleChange}
              className="input"
            >
              {CROP_TYPES.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="planting_date" className="label">
              Planting Date *
            </label>
            <input
              type="date"
              id="planting_date"
              name="planting_date"
              required
              value={formData.planting_date}
              onChange={handleChange}
              className="input"
            />
          </div>
          
          <div>
            <label htmlFor="current_stage" className="label">
              Current Stage *
            </label>
            <select
              id="current_stage"
              name="current_stage"
              required
              value={formData.current_stage}
              onChange={handleChange}
              className="input"
            >
              {Object.entries(CROP_STAGES).map(([key, value]) => (
                <option key={key} value={value}>{value}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="assigned_agent_id" className="label">
              Assign to Agent (Optional)
            </label>
            <select
              id="assigned_agent_id"
              name="assigned_agent_id"
              value={formData.assigned_agent_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">Unassigned</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.first_name} {agent.last_name} ({agent.email})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Field'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateField