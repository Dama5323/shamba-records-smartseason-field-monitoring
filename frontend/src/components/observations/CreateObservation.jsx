import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { observationAPI, fieldService } from '../../services/api';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateObservation = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [field, setField] = useState(null);
  const [formData, setFormData] = useState({
    field: fieldId,
    note: '',
    crop_health: 'good',
    stage_at_observation: '',
    pest_detected: '',
    disease_detected: '',
    weather_conditions: ''
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    if (fieldId) {
      fetchFieldDetails();
    }
  }, [fieldId]);

  const fetchFieldDetails = async () => {
    try {
      const response = await fieldService.getField(fieldId);
      setField(response);
    } catch (error) {
      console.error('Error fetching field:', error);
      toast.error('Failed to load field details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
    
    // Create previews
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.note) {
      toast.error('Please add a note for this observation');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('field', formData.field);
      submitData.append('note', formData.note);
      submitData.append('crop_health', formData.crop_health);
      if (formData.stage_at_observation) submitData.append('stage_at_observation', formData.stage_at_observation);
      if (formData.pest_detected) submitData.append('pest_detected', formData.pest_detected);
      if (formData.disease_detected) submitData.append('disease_detected', formData.disease_detected);
      if (formData.weather_conditions) submitData.append('weather_conditions', formData.weather_conditions);
      
      // Append photos
      photos.forEach(photo => {
        submitData.append('photos', photo);
      });
      
      const response = await observationAPI.createObservation(submitData);
      console.log('Observation created:', response);
      
      toast.success('Observation added successfully!');
      
      // Dispatch event to refresh dashboard
      window.dispatchEvent(new Event('observationAdded'));
      
      // Navigate back to field details
      navigate(`/fields/${fieldId}`);
    } catch (error) {
      console.error('Error creating observation:', error);
      toast.error(error.response?.data?.message || 'Failed to add observation');
    } finally {
      setLoading(false);
    }
  };

  if (fieldId && !field) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Observation</h1>
        <p className="text-gray-500 text-sm mt-1">
          {field ? `Field: ${field.name}` : 'Record field observations'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observation Notes *
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe what you observed in the field..."
            required
          />
        </div>

        {/* Crop Health */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Health
          </label>
          <select
            name="crop_health"
            value={formData.crop_health}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        {/* Growth Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Growth Stage
          </label>
          <select
            name="stage_at_observation"
            value={formData.stage_at_observation}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select stage</option>
            <option value="planting">Planting</option>
            <option value="germination">Germination</option>
            <option value="vegetative">Vegetative</option>
            <option value="flowering">Flowering</option>
            <option value="harvesting">Harvesting</option>
          </select>
        </div>

        {/* Pests and Diseases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pest Detected
            </label>
            <input
              type="text"
              name="pest_detected"
              value={formData.pest_detected}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Aphids, Armyworms"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disease Detected
            </label>
            <input
              type="text"
              name="disease_detected"
              value={formData.disease_detected}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Leaf rust, Blight"
            />
          </div>
        </div>

        {/* Weather Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weather Conditions
          </label>
          <input
            type="text"
            name="weather_conditions"
            value={formData.weather_conditions}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., Sunny, Rainy, Cloudy"
          />
        </div>

        {/* Photos Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm">Upload Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-gray-500">{photos.length} photo(s) selected</span>
          </div>
          
          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Adding Observation...' : 'Add Observation'}
          </button>
          <Link
            to={`/fields/${fieldId || '#'}`}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateObservation;