// src/components/auth/SignUp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowRight, Eye, EyeOff, CheckCircle, AlertCircle, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';

// Google Icon Component
const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const SignUp = () => {
  const navigate = useNavigate();
  const { register, signUpWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeMethod, setActiveMethod] = useState('email');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const addDebug = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    setDebugInfo(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    addDebug('Checking if Google API is loaded...', 'info');
    
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        addDebug('✅ Google API loaded successfully!', 'success');
        setGoogleLoaded(true);
        clearInterval(checkGoogle);
      }
    }, 500);
    
    const timeout = setTimeout(() => {
      clearInterval(checkGoogle);
      if (!googleLoaded) {
        addDebug('❌ Google API failed to load after 10 seconds', 'error');
      }
    }, 10000);
    
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      addDebug('Loading Google script dynamically...', 'info');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => addDebug('✅ Google script loaded', 'success');
      script.onerror = () => addDebug('❌ Failed to load Google script', 'error');
      document.body.appendChild(script);
    }
    
    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, []);

  // Updated Google Sign In - using React Router navigation only
  const handleGoogleSignIn = () => {
    addDebug('🔵 Google Sign In button clicked', 'info')
    
    if (!googleLoaded) {
      addDebug('❌ Google API not loaded yet', 'error')
      toast.error('Google Sign In is still loading. Please wait a moment.')
      return
    }
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    addDebug(`Using Client ID: ${clientId?.substring(0, 20)}...`, 'info')
    
    if (!clientId) {
      addDebug('❌ VITE_GOOGLE_CLIENT_ID is not set in environment variables!', 'error')
      toast.error('Google Client ID not configured. Please contact support.')
      return
    }
    
    setLoading(true)
    addDebug('🟢 Creating Google OAuth token client...', 'info')
    
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (tokenResponse) => {
          addDebug(`🟢 Google callback received!`, 'success')
          
          try {
            addDebug('🟢 Calling signUpWithGoogle function...', 'info')
            const result = await signUpWithGoogle(tokenResponse.access_token)
            addDebug(`🟢 signUpWithGoogle result: success=${result.success}`, result.success ? 'success' : 'error')
            
            if (result.success) {
              addDebug('🟢 Checking localStorage after signup...', 'info')
              const token = localStorage.getItem('access_token')
              const user = localStorage.getItem('user')
              addDebug(`Access token stored: ${!!token}`, token ? 'success' : 'error')
              addDebug(`User data stored: ${!!user}`, user ? 'success' : 'error')
              
              if (token && user) {
                addDebug('✅ Both token and user stored, navigating to dashboard via React Router', 'success')
                // IMPORTANT: Use React Router navigate, NOT window.location
                navigate('/dashboard')
              } else {
                addDebug('❌ Storage verification failed - missing token or user', 'error')
                setLoading(false)
              }
            } else {
              addDebug(`❌ signUpWithGoogle failed: ${result.error}`, 'error')
              setLoading(false)
            }
          } catch (error) {
            addDebug(`❌ Error in Google callback: ${error.message}`, 'error')
            console.error('Full error:', error)
            setLoading(false)
          }
        },
        onError: (error) => {
          addDebug(`❌ Google OAuth error: ${error.type || error.message || 'Unknown error'}`, 'error')
          toast.error('Google signup cancelled or failed')
          setLoading(false)
        }
      })
      
      addDebug('🟢 Requesting access token from Google...', 'info')
      client.requestAccessToken()
    } catch (error) {
      addDebug(`❌ Error initializing Google OAuth: ${error.message}`, 'error')
      toast.error('Failed to initialize Google Sign In')
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!formData.email.endsWith('@gmail.com')) {
      newErrors.email = 'Only Gmail accounts are allowed';
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateForm();
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateForm();
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    addDebug('🔵 Email signup submitted', 'info');
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      addDebug(`Registering user: ${formData.email}`, 'info');
      const result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name: '',
        last_name: ''
      });
      
      if (result.success) {
        addDebug('✅ Email registration successful, navigating to login', 'success');
        navigate('/login');
      } else {
        addDebug(`❌ Email registration failed: ${result.error}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-600 mt-2">Join SmartSeason to start managing your fields</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-2 gap-1 p-1">
            <button
              onClick={() => setActiveMethod('email')}
              className={`py-3 rounded-lg text-sm font-medium transition-all ${
                activeMethod === 'email'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveMethod('google')}
              className={`py-3 rounded-lg text-sm font-medium transition-all ${
                activeMethod === 'google'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <GoogleIcon className="w-4 h-4 inline mr-2" />
              Google
            </button>
          </div>
        </div>

        {activeMethod === 'email' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleEmailSignUp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@gmail.com"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.email && touched.email
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Choose a username"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.username && touched.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-emerald-500'
                  }`}
                />
                {errors.username && touched.username && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Create a password"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.password && touched.password
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-emerald-500'
                  }`}
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {formData.password.length >= 8 ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                    <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {/[A-Z]/.test(formData.password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                    <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {/[0-9]/.test(formData.password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                    <span className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>One number</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Creating account...</>
                ) : (
                  <>Create account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {activeMethod === 'google' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GoogleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sign up with Google</h3>
              <p className="text-sm text-gray-600 mt-1">One-click sign up. No password needed.</p>
              <div className="mt-2">
                <span className={`text-xs ${googleLoaded ? 'text-green-600' : 'text-amber-600'}`}>
                  {googleLoaded ? '✅ Google API ready' : '⏳ Loading Google API...'}
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading || !googleLoaded}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <GoogleIcon className="w-5 h-5" />
              {loading ? 'Signing up...' : !googleLoaded ? 'Loading...' : 'Continue with Google'}
            </button>

            <div className="mt-6 p-3 bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-400 mb-2 font-mono">🔍 Debug Logs:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.slice(-5).map((log, idx) => (
                  <p key={idx} className={`text-xs font-mono ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    [{log.timestamp}] {log.message}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 text-center">🔒 One-click sign up. We'll only ask for permissions we need.</p>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;