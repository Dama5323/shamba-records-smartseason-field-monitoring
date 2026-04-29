import React, { useState, useEffect } from 'react'
import { 
  X, Edit, UserPlus, Camera, Sprout, BarChart3, Trash2, 
  MessageSquare, User, MapPin, Calendar, AlertTriangle, 
  TrendingUp, CheckCircle, Save, Eye, EyeOff, Plus, 
  Upload, Image, FileText, Trash, Download, Loader2
} from 'lucide-react'
import { fieldService } from '../../services/api'
import toast from 'react-hot-toast'
import AssignAgentModal from './AssignAgentModal'

const FieldQuickViewModal = ({ isOpen, onClose, fieldId, onFieldUpdated }) => {
  const [field, setField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showObservationForm, setShowObservationForm] = useState(false)
  const [newObservation, setNewObservation] = useState({ 
    note: '', 
    crop_health: 'good'
  })
  const [selectedImageFiles, setSelectedImageFiles] = useState([])
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedStage, setSelectedStage] = useState('')
  const [showStageUpdate, setShowStageUpdate] = useState(false)

  const CROP_STAGES = ['planted', 'growing', 'ready', 'harvested']
  const HEALTH_STATUS = ['excellent', 'good', 'fair', 'poor']

  useEffect(() => {
    if (isOpen && fieldId) {
      fetchFieldDetails()
    }
  }, [isOpen, fieldId])

  const fetchFieldDetails = async () => {
    try {
      setLoading(true)
      const data = await fieldService.getFieldDetails(fieldId)
      setField(data)
      setSelectedStage(data.current_stage)
    } catch (error) {
      console.error('Error fetching field:', error)
      toast.error('Failed to load field details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async () => {
    if (!selectedStage || selectedStage === field.current_stage) {
      toast.error('Please select a different stage')
      return
    }
    setUploading(true)
    try {
      await fieldService.partialUpdateField(fieldId, { current_stage: selectedStage })
      toast.success(`Stage updated to ${selectedStage}`)
      setShowStageUpdate(false)
      fetchFieldDetails()
      if (onFieldUpdated) onFieldUpdated()
    } catch (error) {
      toast.error('Failed to update stage')
    } finally {
      setUploading(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedImageFiles(prev => [...prev, ...files])
    toast.success(`${files.length} photo(s) added`)
    e.target.value = '' // Reset input
  }

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedDocumentFiles(prev => [...prev, ...files])
    toast.success(`${files.length} document(s) added`)
    e.target.value = '' // Reset input
  }

  const removeImageFile = (index) => {
    setSelectedImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeDocumentFile = (index) => {
    setSelectedDocumentFiles(prev => prev.filter((_, i) => i !== index))
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAddObservation = async (e) => {
    e.preventDefault()
    if (!newObservation.note.trim()) {
      toast.error('Please enter an observation note')
      return
    }
    
    setUploading(true)
    try {
      const observationData = {
        note: newObservation.note,
        crop_health: newObservation.crop_health
      }
      
      // Convert images to base64
      if (selectedImageFiles.length > 0) {
        const imageBase64Promises = selectedImageFiles.map(file => convertFileToBase64(file))
        const imageBase64 = await Promise.all(imageBase64Promises)
        observationData.photos = imageBase64
      }
      
      // Convert documents to base64 with metadata
      if (selectedDocumentFiles.length > 0) {
        const docPromises = selectedDocumentFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await convertFileToBase64(file)
        }))
        observationData.documents = await Promise.all(docPromises)
      }
      
      await fieldService.addObservation(fieldId, observationData)
      toast.success('Observation added successfully!')
      
      // Reset form
      setNewObservation({ note: '', crop_health: 'good' })
      setSelectedImageFiles([])
      setSelectedDocumentFiles([])
      setShowObservationForm(false)
      fetchFieldDetails()
      
    } catch (error) {
      console.error('Error adding observation:', error)
      toast.error('Failed to add observation')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteField = async () => {
    if (window.confirm(`Delete field "${field?.name}"? This cannot be undone.`)) {
      try {
        await fieldService.deleteField(fieldId)
        toast.success('Field deleted')
        onClose()
        if (onFieldUpdated) onFieldUpdated()
      } catch (error) {
        toast.error('Failed to delete field')
      }
    }
  }

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-5 h-5 text-blue-500" />
    if (ext === 'csv' || ext === 'xlsx') return <FileText className="w-5 h-5 text-green-500" />
    return <FileText className="w-5 h-5 text-gray-500" />
  }

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-emerald-100 text-emerald-700',
      'At Risk': 'bg-amber-100 text-amber-700',
      Completed: 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getStageBadge = (stage) => {
    const styles = {
      planted: 'bg-purple-100 text-purple-700',
      growing: 'bg-blue-100 text-blue-700',
      ready: 'bg-orange-100 text-orange-700',
      harvested: 'bg-emerald-100 text-emerald-700'
    }
    return styles[stage?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {loading ? 'Loading...' : field?.name}
                </h2>
                {!loading && field && (
                  <p className="text-xs text-gray-500">Field #{field.id}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : field && (
            <>
              {/* Quick Action Buttons Grid */}
              <div className="p-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <button
                    onClick={() => setShowObservationForm(!showObservationForm)}
                    className="flex flex-col items-center p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition group"
                  >
                    <MessageSquare className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Observe</span>
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex flex-col items-center p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition group"
                  >
                    <UserPlus className="w-5 h-5 text-orange-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Assign</span>
                  </button>
                  <button
                    onClick={() => setShowStageUpdate(!showStageUpdate)}
                    className="flex flex-col items-center p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition group"
                  >
                    <Sprout className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Stage</span>
                  </button>
                  <button
                    onClick={handleDeleteField}
                    className="flex flex-col items-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition group"
                  >
                    <Trash2 className="w-5 h-5 text-red-600 mb-1" />
                    <span className="text-xs font-medium text-gray-700">Delete</span>
                  </button>
                </div>
              </div>

              {/* Update Stage Form */}
              {showStageUpdate && (
                <div className="px-5 py-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Update Stage:</label>
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      {CROP_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateStage}
                      disabled={uploading}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      {uploading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowStageUpdate(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add Observation Form with Photo/Document Support */}
              {showObservationForm && (
                <form onSubmit={handleAddObservation} className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                  <div className="space-y-3">
                    <textarea
                      value={newObservation.note}
                      onChange={(e) => setNewObservation({ ...newObservation, note: e.target.value })}
                      placeholder="Add observation notes..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={newObservation.crop_health}
                        onChange={(e) => setNewObservation({ ...newObservation, crop_health: e.target.value })}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      >
                        {HEALTH_STATUS.map(health => (
                          <option key={health} value={health}>{health.charAt(0).toUpperCase() + health.slice(1)}</option>
                        ))}
                      </select>
                      
                      {/* Image Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                          id="modal-observation-images"
                        />
                        <label
                          htmlFor="modal-observation-images"
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50"
                        >
                          <Camera className="w-4 h-4" />
                          Add Photos
                        </label>
                      </div>
                      
                      {/* Document Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.csv,.xlsx"
                          multiple
                          onChange={handleDocumentSelect}
                          className="hidden"
                          id="modal-observation-docs"
                        />
                        <label
                          htmlFor="modal-observation-docs"
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50"
                        >
                          <Upload className="w-4 h-4" />
                          Add Docs
                        </label>
                      </div>
                      
                      <button type="submit" disabled={uploading} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {uploading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowObservationForm(false)
                          setSelectedImageFiles([])
                          setSelectedDocumentFiles([])
                          setNewObservation({ note: '', crop_health: 'good' })
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {/* Image Previews */}
                    {selectedImageFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImageFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${idx + 1}`} 
                              className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImageFile(idx)}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Document Previews */}
                    {selectedDocumentFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDocumentFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg group">
                            {getFileIcon(file.name)}
                            <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeDocumentFile(idx)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 px-5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'details'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('observations')}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'observations'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Observations ({field.observations?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 overflow-y-auto max-h-[50vh]">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Crop Type</label>
                        <p className="font-medium text-gray-900">{field.crop_type || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Current Stage</label>
                        <p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStageBadge(field.current_stage)}`}>
                            {field.current_stage || '-'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Status</label>
                        <p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(field.status)}`}>
                            {field.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Planting Date</label>
                        <p className="font-medium text-gray-900">
                          {field.planting_date ? new Date(field.planting_date).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Field Size</label>
                        <p className="font-medium text-gray-900">{field.field_size ? `${field.field_size} acres` : '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Location</label>
                        <p className="font-medium text-gray-900">{field.location || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Soil Type</label>
                        <p className="font-medium text-gray-900">{field.soil_type || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Assigned To</label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {field.assigned_to_details?.username || field.assigned_to_name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {field.notes && (
                      <div>
                        <label className="text-xs text-gray-500">Notes</label>
                        <p className="text-sm text-gray-700 mt-1">{field.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'observations' && (
                  <div className="space-y-3">
                    {field.observations && field.observations.length > 0 ? (
                      field.observations.map((obs, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStageBadge(obs.stage_at_observation)}`}>
                                {obs.stage_at_observation}
                              </span>
                              {obs.crop_health && (
                                <span className="ml-2 text-xs text-gray-500">Health: {obs.crop_health}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {obs.created_at ? new Date(obs.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{obs.note}</p>
                          {obs.photos && obs.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {obs.photos.map((photo, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={photo}
                                  alt={`Observation ${idx + 1} photo`}
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">By: {obs.agent_name}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No observations yet</p>
                        <button
                          onClick={() => setShowObservationForm(true)}
                          className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          Add your first observation →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign Agent Modal */}
      <AssignAgentModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          fetchFieldDetails()
          if (onFieldUpdated) onFieldUpdated()
        }}
        field={field}
        onAssigned={() => {
          fetchFieldDetails()
          if (onFieldUpdated) onFieldUpdated()
        }}
      />
    </>
  )
}

export default FieldQuickViewModal