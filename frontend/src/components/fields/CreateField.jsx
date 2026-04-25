import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fieldService, adminService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Sprout, Map, Calendar, User, AlertCircle } from 'lucide-react';

const CreateField = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]); // Initialize as empty array
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    crop_type: '',
    planting_date: '',
    current_stage: 'planted',
    field_size: '',
    location: '',
    soil_type: '',
    notes: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await adminService.getAgents();
      console.log('Agents response:', response);
      
      // Handle different response formats
      let agentsList = [];
      if (Array.isArray(response)) {
        agentsList = response;
      } else if (response && response.agents && Array.isArray(response.agents)) {
        agentsList = response.agents;
      } else if (response && response.results && Array.isArray(response.results)) {
        agentsList = response.results;
      }
      
      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents list');
      setAgents([]); // Ensure agents is always an array
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data for API
      const submitData = {
        name: formData.name,
        crop_type: formData.crop_type,
        planting_date: formData.planting_date,
        current_stage: formData.current_stage,
        field_size: formData.field_size ? parseFloat(formData.field_size) : null,
        location: formData.location,
        soil_type: formData.soil_type,
        notes: formData.notes,
        assigned_to: formData.assigned_to || null,
      };
      
      await fieldService.createField(submitData);
      toast.success('Field created successfully');
      navigate('/fields');
    } catch (error) {
      console.error('Failed to create field:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create field';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Stage options
  const stageOptions = [
    { value: 'planted', label: 'Planted' },
    { value: 'growing', label: 'Growing' },
    { value: 'ready', label: 'Ready' },
    { value: 'harvested', label: 'Harvested' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Field</h1>
        <p className="text-gray-600 mt-1">Add a new field to the monitoring system</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Basic Information Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-600" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., North Field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type *
              </label>
              <input
                type="text"
                name="crop_type"
                value={formData.crop_type}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Maize, Wheat, Rice"
                required
              />
            </div>
          </div>
        </div>

        {/* Planting Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Planting Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planting Date *
              </label>
              <input
                type="date"
                name="planting_date"
                value={formData.planting_date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stage *
              </label>
              <select
                name="current_stage"
                value={formData.current_stage}
                onChange={handleChange}
                className="input-field"
                required
              >
                {stageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-orange-600" />
            Location & Size
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Size (acres)
              </label>
              <input
                type="number"
                name="field_size"
                value={formData.field_size}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 10.5"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Northern Region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <input
                type="text"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Loamy, Sandy, Clay"
              />
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Assignment
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Agent (Optional)
            </label>
            {loadingAgents ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                <span className="text-sm">Loading agents...</span>
              </div>
            ) : (
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">-- Unassigned --</option>
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.username} ({agent.email})
                    </option>
                  ))
                ) : (
                  <option disabled>No agents available</option>
                )}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Leave unassigned to assign later
            </p>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="Any additional information about this field..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? 'Creating Field...' : 'Create Field'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/fields')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateField;