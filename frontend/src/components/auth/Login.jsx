// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, UserCircle, Shield } from 'lucide-react';

// Logo image URL
const LOGO_URL = 'https://res.cloudinary.com/dzyqof9it/image/upload/v1777133180/shamba_n7wgns.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid email or password');
    }
    setLoading(false);
  };

  const fillDemoCredentials = (type) => {
    if (type === 'admin') {
      setEmail('adminshambarecords@gmail.com');
      setPassword('Admin@123');
    } else {
      setEmail('agentshambarecords@gmail.com');
      setPassword('agent123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={LOGO_URL} 
              alt="SmartSeason Logo" 
              className="h-16 md:h-20 w-auto rounded-xl shadow-sm"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">SmartSeason</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Field Monitoring System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                placeholder="you@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50 rounded-xl"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo Credentials Section - Full width buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-4">Demo Credentials</p>
          
          {/* Admin Demo Button */}
          <button
            onClick={() => fillDemoCredentials('admin')}
            className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition group mb-3"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 text-left">Admin Demo</p>
              <p className="text-xs text-gray-500 truncate text-left">adminshambarecords@gmail.com</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-mono text-gray-600">Admin@123</p>
            </div>
          </button>
          
          {/* Agent Demo Button */}
          <button
            onClick={() => fillDemoCredentials('agent')}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 text-left">Agent Demo</p>
              <p className="text-xs text-gray-500 truncate text-left">agentshambarecords@gmail.com</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-mono text-gray-600">agent123</p>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            New to SmartSeason?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;