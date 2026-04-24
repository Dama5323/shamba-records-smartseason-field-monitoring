import React, { useState } from 'react'
import { fieldService } from '../../services/api'
import { CROP_STAGES } from '../../utils/constants'
import toast from 'react-hot-toast'

const ObservationForm = ({ fieldId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    stage_at_observation: 'Growing',
    health_status: 'Healthy',
    note: ''
  })
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.note.trim()) {
      toast.error('Please enter an observation note')
      return
    }
    
    setLoading(true)
    
    try {
      const observation = await fieldService.addObservation(fieldId, formData)
      toast.success('Observation added successfully')
      onSuccess(observation)
    } catch (error) {
      console.error('Error adding observation:', error)
      toast.error('Failed to add observation')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium text-gray-900">Add New Observation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="stage_at_observation" className="label">
            Field Stage
          </label>
          <select
            id="stage_at_observation"
            name="stage_at_observation"
            required
            value={formData.stage_at_observation}
            onChange={handleChange}
            className="input"
          >
            {Object.entries(CROP_STAGES).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="health_status" className="label">
            Health Status
          </label>
          <select
            id="health_status"
            name="health_status"
            required
            value={formData.health_status}
            onChange={handleChange}
            className="input"
          >
            <option value="Healthy">Healthy</option>
            <option value="Moderate">Moderate</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="note" className="label">
          Notes / Observations *
        </label>
        <textarea
          id="note"
          name="note"
          required
          rows="3"
          value={formData.note}
          onChange={handleChange}
          className="input"
          placeholder="Describe crop condition, pest issues, growth progress, etc."
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Observation'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ObservationForm