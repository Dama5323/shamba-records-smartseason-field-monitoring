import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { observationAPI } from '../../services/api';
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
  Calendar,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const ObservationsPage = () => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedObservation, setExpandedObservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('');
  const [uniqueFields, setUniqueFields] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      console.log('=== FETCHING OBSERVATIONS ===');
      
      // Log the API object to see what's available
      console.log('observationAPI object:', observationAPI);
      console.log('getObservations method:', observationAPI.getObservations);
      
      const response = await observationAPI.getObservations();
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array?', Array.isArray(response));
      
      let observationsList = [];
      
      // Try different response structures
      if (Array.isArray(response)) {
        observationsList = response;
        console.log('Response is array, length:', observationsList.length);
      } else if (response?.results) {
        observationsList = response.results;
        console.log('Response has results array, length:', observationsList.length);
      } else if (response?.data) {
        observationsList = response.data;
        console.log('Response has data array, length:', observationsList.length);
      } else if (response?.observations) {
        observationsList = response.observations;
        console.log('Response has observations array, length:', observationsList.length);
      } else {
        console.log('No observations found in response structure');
        console.log('Response keys:', Object.keys(response || {}));
      }
      
      console.log('Final observations list:', observationsList);
      
      const sortedObservations = observationsList
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('Sorted observations count:', sortedObservations.length);
      
      if (sortedObservations.length > 0) {
        console.log('First observation sample:', sortedObservations[0]);
      }
      
      setObservations(sortedObservations);
      setDebugInfo({
        totalCount: sortedObservations.length,
        responseStructure: Object.keys(response || {}),
        sampleData: sortedObservations[0] || null
      });
      
      // Extract unique field names for filter
      const fields = [...new Set(sortedObservations.map(obs => obs.field_name || `Field #${obs.field}`))];
      setUniqueFields(fields);
      
      if (sortedObservations.length === 0) {
        toast.error('No observations found in the database');
      } else {
        toast.success(`Loaded ${sortedObservations.length} observations`);
      }
    } catch (error) {
      console.error('Error fetching observations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(`Failed to load observations: ${error.message}`);
      setDebugInfo({
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } finally {
      setLoading(false);
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

  const filteredObservations = observations.filter(obs => {
    const matchesSearch = obs.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          obs.agent_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesField = !filterField || 
                         (obs.field_name === filterField || `Field #${obs.field}` === filterField);
    return matchesSearch && matchesField;
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
        <button
          onClick={fetchObservations}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Debug Info (only visible in development) */}
      {debugInfo && (
        <div className="bg-gray-100 rounded-xl p-4 text-xs font-mono">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Info (Click to expand)</summary>
            <pre className="mt-2 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
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

      {/* Observations List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            All Observations
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">
              {filteredObservations.length}
            </span>
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredObservations.length > 0 ? (
            filteredObservations.map((obs) => (
              <div 
                key={obs.id} 
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => toggleObservationExpand(obs.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <Link 
                          to={`/fields/${obs.field}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-base font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          {obs.field_name || `Field #${obs.field}`}
                        </Link>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(obs.created_at)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(obs.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mt-2 line-clamp-3">
                        {obs.note}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {obs.crop_health && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            obs.crop_health === 'excellent' ? 'bg-green-100 text-green-700' :
                            obs.crop_health === 'good' ? 'bg-blue-100 text-blue-700' :
                            obs.crop_health === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Health: {obs.crop_health}
                          </span>
                        )}
                        {obs.stage_at_observation && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            Stage: {obs.stage_at_observation}
                          </span>
                        )}
                        {obs.photos && obs.photos.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {obs.photos.length} photo(s)
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-3">
                        By: {obs.agent_name || 'Unknown Agent'}
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      {expandedObservation === obs.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Content - Full Details */}
                  {expandedObservation === obs.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-800 mb-3">Full Observation Details</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Notes:</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{obs.note}</p>
                          </div>
                          
                          {(obs.pest_detected || obs.disease_detected || obs.weather_conditions) && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">Additional Information:</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {obs.pest_detected && (
                                  <div className="bg-white rounded-lg p-2">
                                    <p className="text-xs text-gray-500">Pest Detected</p>
                                    <p className="text-sm font-medium text-gray-700">{obs.pest_detected}</p>
                                  </div>
                                )}
                                {obs.disease_detected && (
                                  <div className="bg-white rounded-lg p-2">
                                    <p className="text-xs text-gray-500">Disease Detected</p>
                                    <p className="text-sm font-medium text-gray-700">{obs.disease_detected}</p>
                                  </div>
                                )}
                                {obs.weather_conditions && (
                                  <div className="bg-white rounded-lg p-2">
                                    <p className="text-xs text-gray-500">Weather Conditions</p>
                                    <p className="text-sm font-medium text-gray-700">{obs.weather_conditions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {obs.photos && obs.photos.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">Attached Images:</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {obs.photos.map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`Observation ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition border border-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(photo, '_blank');
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Observation ID</p>
                                <p className="text-gray-700 font-mono text-xs">{obs.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Created At</p>
                                <p className="text-gray-700">{formatDate(obs.created_at)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Link
                              to={`/fields/${obs.field}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Full Field Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No observations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filterField ? 'Try adjusting your filters' : 'Observations will appear here when field agents add them'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObservationsPage;