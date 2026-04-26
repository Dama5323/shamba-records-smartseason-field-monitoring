import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, isValid, parseISO } from 'date-fns'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  Sprout,
  User,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Save,
  X,
  Pencil,
  Trash,
  Camera,
  Image as ImageIcon,
  Loader2,
  Upload
} from 'lucide-react'
import { fieldService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import AssignAgentModal from './AssignAgentModal'

const FieldDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const [field, setField] = useState(null)
  const [observations, setObservations] = useState([])
  const [showObservationForm, setShowObservationForm] = useState(false)
  const [showStageUpdate, setShowStageUpdate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingObservation, setEditingObservation] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const fileInputRef = useRef(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [newObservation, setNewObservation] = useState({
    note: '',
    crop_health: 'good'
  })
  const [selectedStage, setSelectedStage] = useState('')
  
  const CROP_STAGES = ['planted', 'growing', 'ready', 'harvested']
  const HEALTH_STATUS = ['excellent', 'good', 'fair', 'poor']
  
  useEffect(() => {
    fetchFieldDetails()
  }, [id])
  
  const fetchFieldDetails = async () => {
    try {
      setLoading(true)
      const data = await fieldService.getFieldDetails(id)
      setField(data)
      setSelectedStage(data.current_stage)
      
      const observationsData = await fieldService.getFieldObservations(id)
      setObservations(Array.isArray(observationsData) ? observationsData : [])
    } catch (error) {
      console.error('Error fetching field details:', error)
      toast.error('Failed to load field details')
      navigate('/fields')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFieldAssigned = () => {
    fetchFieldDetails()
  }
  
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const imageUrls = files.map(file => URL.createObjectURL(file))
    setSelectedImages(prev => [...prev, ...imageUrls])
    
    setNewObservation(prev => ({
      ...prev,
      imageFiles: [...(prev.imageFiles || []), ...files]
    }))
  }
  
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setNewObservation(prev => ({
      ...prev,
      imageFiles: prev.imageFiles?.filter((_, i) => i !== index)
    }))
  }
  
  const handleUpdateStage = async () => {
    if (!selectedStage || selectedStage === field.current_stage) {
      toast.error('Please select a different stage')
      return
    }
    
    setUpdating(true)
    try {
      await fieldService.partialUpdateField(id, { current_stage: selectedStage })
      toast.success(`Stage updated to ${selectedStage.charAt(0).toUpperCase() + selectedStage.slice(1)}`)
      setShowStageUpdate(false)
      fetchFieldDetails()
    } catch (error) {
      console.error('Error updating stage:', error)
      toast.error('Failed to update stage')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleAddObservation = async (e) => {
    e.preventDefault()
    if (!newObservation.note.trim()) {
      toast.error('Please enter an observation note')
      return
    }
    
    setUpdating(true)
    try {
      const observationData = {
        note: newObservation.note,
        crop_health: newObservation.crop_health
      }
      
      if (newObservation.imageFiles && newObservation.imageFiles.length > 0) {
        const imagePromises = newObservation.imageFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
        })
        const imageBase64 = await Promise.all(imagePromises)
        observationData.photos = imageBase64
      }
      
      await fieldService.addObservation(id, observationData)
      toast.success('Observation added successfully')
      setNewObservation({
        note: '',
        crop_health: 'good'
      })
      setSelectedImages([])
      setShowObservationForm(false)
      fetchFieldDetails()
    } catch (error) {
      console.error('Error adding observation:', error)
      toast.error('Failed to add observation')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleUpdateObservation = async (e) => {
    e.preventDefault()
    if (!editingObservation.note.trim()) {
      toast.error('Please enter an observation note')
      return
    }
    
    setUpdating(true)
    try {
      await fieldService.updateObservation(editingObservation.id, {
        note: editingObservation.note,
        crop_health: editingObservation.crop_health
      })
      toast.success('Observation updated successfully')
      setEditingObservation(null)
      fetchFieldDetails()
    } catch (error) {
      console.error('Error updating observation:', error)
      toast.error('Failed to update observation')
    } finally {
      setUpdating(false)
    }
  }
  
  const handleDeleteObservation = async (observationId) => {
    if (window.confirm('Are you sure you want to delete this observation?')) {
      setUpdating(true)
      try {
        await fieldService.deleteObservation(observationId)
        toast.success('Observation deleted successfully')
        fetchFieldDetails()
      } catch (error) {
        console.error('Error deleting observation:', error)
        toast.error('Failed to delete observation')
      } finally {
        setUpdating(false)
      }
    }
  }
  
  const handleDeleteField = async () => {
    if (window.confirm('Are you sure you want to delete this field? This will also delete all observations.')) {
      setUpdating(true)
      try {
        await fieldService.deleteField(id)
        toast.success('Field deleted successfully')
        navigate('/fields')
      } catch (error) {
        console.error('Error deleting field:', error)
        toast.error('Failed to delete field')
      } finally {
        setUpdating(false)
      }
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set'
    try {
      let date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      if (isValid(date)) return format(date, 'MMMM dd, yyyy')
      return 'Invalid date'
    } catch {
      return 'Date error'
    }
  }
  
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Date not set'
    try {
      let date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      if (isValid(date)) return format(date, 'MMM dd, yyyy - h:mm a')
      return 'Invalid date'
    } catch {
      return 'Date error'
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'At Risk': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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
  
  const getHealthColor = (health) => {
    const colors = {
      'excellent': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'fair': 'bg-yellow-100 text-yellow-800',
      'poor': 'bg-red-100 text-red-800'
    }
    return colors[health?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }
  
  if (!field) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Field not found</p>
      </div>
    )
  }
  
  const isAgent = user?.role === 'agent'
  const canEdit = isAdmin || isAgent
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex space-x-3">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Assign Agent</span>
              </button>
              <button
                onClick={handleDeleteField}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Field</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Field Info Card */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
            <p className="text-gray-600 mt-1">Field #{field.id}</p>
          </div>
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(field.status)}`}>
            {field.status === 'Active' && <TrendingUp className="h-4 w-4" />}
            {field.status === 'At Risk' && <AlertTriangle className="h-4 w-4" />}
            {field.status === 'Completed' && <CheckCircle className="h-4 w-4" />}
            <span>{field.status || 'Active'}</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Sprout className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Crop Type</p>
                <p className="font-medium">{field.crop_type || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Planting Date</p>
                <p className="font-medium">{formatDate(field.planting_date)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Current Stage</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStageColor(field.current_stage)}`}>
                    {field.current_stage || 'Not specified'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowStageUpdate(!showStageUpdate)}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Update Stage</span>
                </button>
              )}
            </div>
            
            {showStageUpdate && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Stage
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {CROP_STAGES.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setSelectedStage(stage)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedStage === stage
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateStage}
                    disabled={updating}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Confirm Update'}
                  </button>
                  <button
                    onClick={() => setShowStageUpdate(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {field.assigned_to_details && (
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assigned Agent</p>
                  <p className="font-medium">{field.assigned_to_details.username || field.assigned_to_details.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Observations Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Observations & Notes</h2>
          <button
            onClick={() => setShowObservationForm(!showObservationForm)}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Observation</span>
          </button>
        </div>
        
        {/* Add Observation Form */}
        {showObservationForm && (
          <form onSubmit={handleAddObservation} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation Notes *
                </label>
                <textarea
                  value={newObservation.note}
                  onChange={(e) => setNewObservation({...newObservation, note: e.target.value})}
                  rows="3"
                  className="input"
                  placeholder="Describe crop condition, pest issues, growth progress, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Health
                </label>
                <select
                  value={newObservation.crop_health}
                  onChange={(e) => setNewObservation({...newObservation, crop_health: e.target.value})}
                  className="input"
                >
                  {HEALTH_STATUS.map((health) => (
                    <option key={health} value={health}>
                      {health.charAt(0).toUpperCase() + health.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="observation-images"
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="observation-images"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload images</span>
                    <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                  </label>
                </div>
                
                {/* Image Preview */}
                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 -mt-1 -mr-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{updating ? 'Saving...' : 'Save Observation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowObservationForm(false)
                    setSelectedImages([])
                    setNewObservation({ note: '', crop_health: 'good' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Edit Observation Form */}
        {editingObservation && (
          <form onSubmit={handleUpdateObservation} className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-yellow-800">Edit Observation</h3>
              <button
                type="button"
                onClick={() => setEditingObservation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observation Notes *
                </label>
                <textarea
                  value={editingObservation.note}
                  onChange={(e) => setEditingObservation({...editingObservation, note: e.target.value})}
                  rows="3"
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crop Health
                </label>
                <select
                  value={editingObservation.crop_health}
                  onChange={(e) => setEditingObservation({...editingObservation, crop_health: e.target.value})}
                  className="input"
                >
                  {HEALTH_STATUS.map((health) => (
                    <option key={health} value={health}>
                      {health.charAt(0).toUpperCase() + health.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{updating ? 'Updating...' : 'Update Observation'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingObservation(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
        
        {/* Observations List */}
        {observations && observations.length > 0 ? (
          <div className="space-y-3">
            {observations.map((obs) => (
              <div key={obs.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {obs.stage_at_observation && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(obs.stage_at_observation)}`}>
                        {obs.stage_at_observation}
                      </span>
                    )}
                    {obs.crop_health && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getHealthColor(obs.crop_health)}`}>
                        Health: {obs.crop_health}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDateTime(obs.created_at)}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingObservation(obs)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit observation"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteObservation(obs.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete observation"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-700">{obs.note}</p>
                {obs.photos && obs.photos.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {obs.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Observation ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded cursor-pointer"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                )}
                {obs.agent_name && (
                  <p className="text-xs text-gray-400 mt-2">By: {obs.agent_name}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No observations yet</p>
            <p className="text-sm text-gray-400">Click "Add Observation" to start tracking this field</p>
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      <AssignAgentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        field={field}
        onAssigned={handleFieldAssigned}
      />
    </div>
  )
}

export default FieldDetail