import React, { useState } from 'react'
import { fieldService } from '../../services/api'
import { Camera, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const ObservationForm = ({ fieldId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [formData, setFormData] = useState({
    note: '',
    crop_health: 'good',
    stage_at_observation: '',
    pest_detected: '',
    disease_detected: '',
    weather_conditions: ''
  })
  
  const CROP_STAGES = ['planted', 'growing', 'flowering', 'ready', 'harvested']
  const HEALTH_STATUS = ['excellent', 'good', 'fair', 'poor']
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }
  
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.note.trim()) {
      toast.error('Please enter an observation note')
      return
    }
    
    setLoading(true)
    
    try {
      const observationData = {
        note: formData.note,
        crop_health: formData.crop_health,
        stage_at_observation: formData.stage_at_observation || null,
        pest_detected: formData.pest_detected || null,
        disease_detected: formData.disease_detected || null,
        weather_conditions: formData.weather_conditions || null
      }
      
      // Handle photos
      if (photos.length > 0) {
        const imagePromises = photos.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
        })
        const imageBase64 = await Promise.all(imagePromises)
        observationData.photos = imageBase64
      }
      
      const observation = await fieldService.addObservation(fieldId, observationData)
      toast.success('Observation added successfully')
      onSuccess(observation)
    } catch (error) {
      console.error('Error adding observation:', error)
      toast.error(error.response?.data?.message || 'Failed to add observation')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Add New Observation</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Observation Notes *
        </label>
        <textarea
          id="note"
          name="note"
          required
          rows="3"
          value={formData.note}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Describe crop condition, pest issues, growth progress, etc."
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="crop_health" className="block text-sm font-medium text-gray-700 mb-1">
            Crop Health
          </label>
          <select
            id="crop_health"
            name="crop_health"
            value={formData.crop_health}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {HEALTH_STATUS.map(health => (
              <option key={health} value={health}>
                {health.charAt(0).toUpperCase() + health.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="stage_at_observation" className="block text-sm font-medium text-gray-700 mb-1">
            Growth Stage
          </label>
          <select
            id="stage_at_observation"
            name="stage_at_observation"
            value={formData.stage_at_observation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select stage</option>
            {CROP_STAGES.map(stage => (
              <option key={stage} value={stage}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pest_detected" className="block text-sm font-medium text-gray-700 mb-1">
            Pest Detected
          </label>
          <input
            type="text"
            id="pest_detected"
            name="pest_detected"
            value={formData.pest_detected}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Aphids"
          />
        </div>
        
        <div>
          <label htmlFor="disease_detected" className="block text-sm font-medium text-gray-700 mb-1">
            Disease Detected
          </label>
          <input
            type="text"
            id="disease_detected"
            name="disease_detected"
            value={formData.disease_detected}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Leaf Rust"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="weather_conditions" className="block text-sm font-medium text-gray-700 mb-1">
          Weather Conditions
        </label>
        <input
          type="text"
          id="weather_conditions"
          name="weather_conditions"
          value={formData.weather_conditions}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g., Sunny, Rainy, Cloudy"
        />
      </div>
      
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="observation-photos"
          />
          <label htmlFor="observation-photos" className="cursor-pointer flex flex-col items-center">
            <Camera className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload photos</span>
            <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
          </label>
        </div>
        
        {photoPreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {photoPreviews.map((preview, idx) => (
              <div key={idx} className="relative">
                <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex space-x-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Adding...' : 'Add Observation'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ObservationForm