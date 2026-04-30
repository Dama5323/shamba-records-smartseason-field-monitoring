import React, { useState } from 'react'
import { fieldService } from '../../services/api'
import { Camera, X, Save, Sprout } from 'lucide-react'
import toast from 'react-hot-toast'

const ObservationFormModal = ({ isOpen, onClose, fieldId, fieldName, onSuccess }) => {
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
      
      await fieldService.addObservation(fieldId, observationData)
      toast.success('Observation added successfully!')
      window.dispatchEvent(new Event('observationAdded'))
      
      // Reset form
      setFormData({
        note: '',
        crop_health: 'good',
        stage_at_observation: '',
        pest_detected: '',
        disease_detected: '',
        weather_conditions: ''
      })
      setPhotos([])
      setPhotoPreviews([])
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding observation:', error)
      toast.error(error.response?.data?.message || 'Failed to add observation')
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Add New Observation</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Selected Field Display */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Field</p>
            <p className="font-medium text-gray-800">{fieldName || `Field #${fieldId}`}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observation Notes *
            </label>
            <textarea
              name="note"
              required
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Describe what you observed..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Health
              </label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Growth Stage
              </label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pest Detected
              </label>
              <input
                type="text"
                name="pest_detected"
                value={formData.pest_detected}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Aphids"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disease Detected
              </label>
              <input
                type="text"
                name="disease_detected"
                value={formData.disease_detected}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Leaf Rust"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weather Conditions
            </label>
            <input
              type="text"
              name="weather_conditions"
              value={formData.weather_conditions}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Sunny, Rainy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="observation-photos-modal"
              />
              <label htmlFor="observation-photos-modal" className="cursor-pointer flex flex-col items-center">
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
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Observation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ObservationFormModal