// src/components/profile/Profile.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Phone, MapPin, Sprout, User, Edit, Calendar, Shield } from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    }
    return user?.username || 'User';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">View your personal information</p>
      </div>
      
      <div className="card">
        {/* Profile Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold text-3xl">
              {getInitials()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{getFullName()}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role === 'admin' ? 'Administrator' : 'Field Agent'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  user?.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
        
        {/* Profile Details */}
        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="text-gray-900">{user?.email}</p>
              {user?.is_email_verified && (
                <span className="text-xs text-green-600">✓ Verified</span>
              )}
            </div>
          </div>
          
          {user?.phone_number && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900">{user.phone_number}</p>
              </div>
            </div>
          )}
          
          {user?.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900">{user.location}</p>
              </div>
            </div>
          )}
          
          {user?.farm_name && (
            <div className="flex items-start gap-3">
              <Sprout className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Farm/Business Name</p>
                <p className="text-gray-900">{user.farm_name}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-gray-900">{formatDate(user?.date_joined)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;