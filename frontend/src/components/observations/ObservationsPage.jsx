import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observationAPI, fieldService } from '../../services/api';
import { 
  Activity, 
  Clock, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Camera,
  X,
  Save,
  User,
  Sprout 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ObservationsPage = () => {
  const [observations, setObservations] = useState([]);
  const [groupedObservations, setGroupedObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedObservation, setExpandedObservation] = useState(null);
  const [expandedField, setExpandedField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('');
  const [uniqueFields, setUniqueFields] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fields, setFields] = useState([]);
  const [newObservation, setNewObservation] = useState({
    field: '',
    note: '',
    crop_health: 'good',
    stage_at_observation: '',
    pest_detected: '',
    disease_detected: '',
    weather_conditions: ''
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [creating, setCreating] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  
  const CROP_STAGES = ['planted', 'growing', 'flowering', 'ready', 'harvested'];
  const HEALTH_STATUS = ['excellent', 'good', 'fair', 'poor'];

  useEffect(() => {
    fetchObservations();
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await fieldService.getAllFields();
      let fieldsList = [];
      if (Array.isArray(response)) {
        fieldsList = response;
      } else if (response?.results) {
        fieldsList = response.results;
      } else if (response?.data) {
        fieldsList = response.data;
      }
      setFields(fieldsList);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const response = await observationAPI.getObservations();
      let observationsList = [];
      
      if (Array.isArray(response)) {
        observationsList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        observationsList = response.data;
      } else if (response?.results) {
        observationsList = response.results;
      } else {
        observationsList = [];
      }
      
      const sortedObservations = observationsList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setObservations(sortedObservations);
      
      // Group observations by field
      const grouped = {};
      sortedObservations.forEach(obs => {
        const fieldKey = obs.field || obs.field_name;
        if (!grouped[fieldKey]) {
          grouped[fieldKey] = {
            fieldId: obs.field,
            fieldName: obs.field_name || `Field #${obs.field}`,
            observations: []
          };
        }
        grouped[fieldKey].observations.push(obs);
      });
      
      // Sort each field's observations by date (newest first)
      Object.keys(grouped).forEach(key => {
        grouped[key].observations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
      
      setGroupedObservations(Object.values(grouped));
      
      // Extract unique field names for filter
      const fields = [...new Set(sortedObservations.map(obs => obs.field_name || `Field #${obs.field}`))];
      setUniqueFields(fields);
      
    } catch (error) {
      console.error('Error fetching observations:', error);
      toast.error('Failed to load observations');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateObservation = async (e) => {
    e.preventDefault();
    
    if (!newObservation.field) {
      toast.error('Please select a field');
      return;
    }
    if (!newObservation.note.trim()) {
      toast.error('Please enter an observation note');
      return;
    }
    
    setCreating(true);
    try {
      // Prepare the observation data in the format the backend expects
      const observationData = {
        note: newObservation.note,
        crop_health: newObservation.crop_health,
        stage_at_observation: newObservation.stage_at_observation || null,
        pest_detected: newObservation.pest_detected || null,
        disease_detected: newObservation.disease_detected || null,
        weather_conditions: newObservation.weather_conditions || null
      };
      
      // Handle photos separately if needed
      if (photos.length > 0) {
        // Convert photos to base64 if the backend expects that format
        const imagePromises = photos.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        });
        const imageBase64 = await Promise.all(imagePromises);
        observationData.photos = imageBase64;
      }
      
      // Use the fieldService to add observation (this is the working method from FieldDetail)
      await fieldService.addObservation(newObservation.field, observationData);
      
      toast.success('Observation added successfully!');
      
      // Reset form
      setNewObservation({
        field: '',
        note: '',
        crop_health: 'good',
        stage_at_observation: '',
        pest_detected: '',
        disease_detected: '',
        weather_conditions: ''
      });
      setPhotos([]);
      setPhotoPreviews([]);
      setShowCreateForm(false);
      
      // Refresh observations
      fetchObservations();
      window.dispatchEvent(new Event('observationAdded'));
      
    } catch (error) {
      console.error('Error creating observation:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to add observation');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const toggleObservationExpand = (id) => {
    setExpandedObservation(expandedObservation === id ? null : id);
  };

  const toggleFieldExpand = (fieldId) => {
    setExpandedField(expandedField === fieldId ? null : fieldId);
  };

  const getHealthColor = (health) => {
    const colors = {
      'excellent': 'bg-green-100 text-green-700',
      'good': 'bg-blue-100 text-blue-700',
      'fair': 'bg-yellow-100 text-yellow-700',
      'poor': 'bg-red-100 text-red-700'
    };
    return colors[health?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getStageColor = (stage) => {
    const colors = {
      'planted': 'bg-purple-100 text-purple-800',
      'growing': 'bg-blue-100 text-blue-800',
      'flowering': 'bg-pink-100 text-pink-800',
      'ready': 'bg-orange-100 text-orange-800',
      'harvested': 'bg-green-100 text-green-800'
    };
    return colors[stage?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const filteredGroupedObservations = groupedObservations.filter(group => {
    if (!filterField) return true;
    return group.fieldName.toLowerCase().includes(filterField.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Observations</h1>
          <p className="text-gray-500 text-sm mt-1">View all field observations and notes from agents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Observation
          </button>
          <button
            onClick={fetchObservations}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Create Observation Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Add New Observation</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateObservation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Field *</label>
              <select
                value={newObservation.field}
                onChange={(e) => setNewObservation({...newObservation, field: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose a field...</option>
                {fields.map(field => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observation Notes *</label>
              <textarea
                value={newObservation.note}
                onChange={(e) => setNewObservation({...newObservation, note: e.target.value})}
                rows="3"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Describe what you observed..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Health</label>
                <select
                  value={newObservation.crop_health}
                  onChange={(e) => setNewObservation({...newObservation, crop_health: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {HEALTH_STATUS.map(health => (
                    <option key={health} value={health}>{health.charAt(0).toUpperCase() + health.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Growth Stage</label>
                <select
                  value={newObservation.stage_at_observation}
                  onChange={(e) => setNewObservation({...newObservation, stage_at_observation: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select stage</option>
                  {CROP_STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pest Detected</label>
                <input
                  type="text"
                  value={newObservation.pest_detected}
                  onChange={(e) => setNewObservation({...newObservation, pest_detected: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Aphids"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disease Detected</label>
                <input
                  type="text"
                  value={newObservation.disease_detected}
                  onChange={(e) => setNewObservation({...newObservation, disease_detected: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Leaf Rust"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weather Conditions</label>
              <input
                type="text"
                value={newObservation.weather_conditions}
                onChange={(e) => setNewObservation({...newObservation, weather_conditions: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Sunny, Rainy"
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
            
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={creating} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">
                {creating ? 'Creating...' : 'Create Observation'}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search observations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="sm:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
            >
              <option value="">All Fields</option>
              {uniqueFields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grouped Observations - Like Social Media Posts */}
      <div className="space-y-6">
        {filteredGroupedObservations.length > 0 ? (
          filteredGroupedObservations.map((group) => {
            // Filter observations within the group by search term
            const filteredGroupObservations = group.observations.filter(obs =>
              obs.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              obs.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (filteredGroupObservations.length === 0) return null;
            
            return (
              <div key={group.fieldId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Field Header - Like a social media post header */}
                <div 
                  className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100 cursor-pointer hover:from-emerald-100 hover:to-green-100 transition"
                  onClick={() => toggleFieldExpand(group.fieldId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                        <Sprout className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{group.fieldName}</h3>
                        <p className="text-xs text-gray-500">
                          {group.observations.length} observation{group.observations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/fields/${group.fieldId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      >
                        View Field Details →
                      </Link>
                      {expandedField === group.fieldId ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Observations List - Like comments on a post */}
                {expandedField === group.fieldId && (
                  <div className="divide-y divide-gray-100">
                    {filteredGroupObservations.map((obs) => (
                      <div 
                        key={obs.id} 
                        className="p-6 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => toggleObservationExpand(obs.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          
                          <div className="flex-1">
                            {/* Observation Header */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-medium text-gray-800">{obs.agent_name || 'Unknown Agent'}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(obs.created_at)}
                              </span>
                            </div>
                            
                            {/* Observation Content */}
                            <p className="text-gray-700 mb-2">{obs.note}</p>
                            
                            {/* Tags/Badges */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {obs.crop_health && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor(obs.crop_health)}`}>
                                  Health: {obs.crop_health}
                                </span>
                              )}
                              {obs.stage_at_observation && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStageColor(obs.stage_at_observation)}`}>
                                  Stage: {obs.stage_at_observation}
                                </span>
                              )}
                              {obs.pest_detected && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                  Pest: {obs.pest_detected}
                                </span>
                              )}
                              {obs.disease_detected && (
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                  Disease: {obs.disease_detected}
                                </span>
                              )}
                            </div>
                            
                            {/* Photos */}
                            {obs.photos && obs.photos.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {obs.photos.slice(0, 4).map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`Observation ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border border-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(photo, '_blank');
                                    }}
                                  />
                                ))}
                                {obs.photos.length > 4 && (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-500">+{obs.photos.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Timestamp */}
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(obs.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Expanded Full Details */}
                        {expandedObservation === obs.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 ml-11">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-800 mb-3">Full Details</h4>
                              
                              <div className="space-y-3">
                                {obs.pest_detected && (
                                  <div>
                                    <p className="text-xs text-gray-500">Pest Detected</p>
                                    <p className="text-sm text-gray-700">{obs.pest_detected}</p>
                                  </div>
                                )}
                                {obs.disease_detected && (
                                  <div>
                                    <p className="text-xs text-gray-500">Disease Detected</p>
                                    <p className="text-sm text-gray-700">{obs.disease_detected}</p>
                                  </div>
                                )}
                                {obs.weather_conditions && (
                                  <div>
                                    <p className="text-xs text-gray-500">Weather Conditions</p>
                                    <p className="text-sm text-gray-700">{obs.weather_conditions}</p>
                                  </div>
                                )}
                                
                                {obs.photos && obs.photos.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">All Images</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {obs.photos.map((photo, idx) => (
                                        <img
                                          key={idx}
                                          src={photo}
                                          alt={`Full ${idx + 1}`}
                                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(photo, '_blank');
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No observations found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filterField ? 'Try adjusting your filters' : 'Click "New Observation" to add your first observation'}
            </p>
            {!searchTerm && !filterField && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Observation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservationsPage;