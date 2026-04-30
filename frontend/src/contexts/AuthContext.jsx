// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Persistent debug logger that saves to sessionStorage
const persistentLog = (message, data = null) => {
  const logs = JSON.parse(sessionStorage.getItem('auth_debug_logs') || '[]')
  logs.push({ 
    timestamp: new Date().toISOString(), 
    message, 
    data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null 
  })
  // Keep only last 20 logs
  while (logs.length > 20) logs.shift()
  sessionStorage.setItem('auth_debug_logs', JSON.stringify(logs))
  console.log(message, data || '')
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')
    
    persistentLog('🔵 AuthProvider init - checking localStorage')
    persistentLog(`  storedUser: ${!!storedUser}`)
    persistentLog(`  token exists: ${!!token}`)
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser)
        persistentLog(`✅ User loaded from localStorage: ${parsedUser.email}`)
        setUser(parsedUser)
      } catch (error) {
        persistentLog(`❌ Error parsing user data: ${error.message}`)
        localStorage.removeItem('user')
      }
    } else {
      persistentLog('⚠️ No stored user or token found')
    }
    setLoading(false)
  }, [])
  
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password)
      setUser(data.user)
      toast.success('Login successful!')
      return { success: true, data }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      toast.success(data.message || 'Registration successful! You can now login.')
      return { success: true, data }
    } catch (error) {
      console.error('Registration error:', error)
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  // Google Sign Up with persistent logging
  const signUpWithGoogle = async (accessToken) => {
    persistentLog('🔵 Starting Google signup')
    persistentLog(`🔵 Token preview: ${accessToken?.substring(0, 30)}...`)
    
    try {
      persistentLog('🔵 Calling authService.googleLogin...')
      const data = await authService.googleLogin(accessToken)
      persistentLog('🔵 Response received', data)
      
      // Extract tokens from response - handles both 'access' and 'access_token' formats
      const access_token = data.access || data.access_token
      const refresh_token = data.refresh || data.refresh_token
      const userData = data.user || data.user_data
      
      persistentLog(`🔵 Extracted - access_token: ${!!access_token}, user: ${!!userData}`)
      
      if (access_token && userData) {
        persistentLog('🔵 Storing in localStorage...')
        localStorage.setItem('access_token', access_token)
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
        localStorage.setItem('user', JSON.stringify(userData))
        
        persistentLog('✅ Tokens stored successfully')
        persistentLog(`🔵 Verification - access_token: ${!!localStorage.getItem('access_token')}, user: ${!!localStorage.getItem('user')}`)
        
        setUser(userData)
        
        toast.success(data.is_new_user ? 'Account created with Google!' : 'Welcome back!')
        return { success: true, data }
      } else {
        persistentLog('🔴 Invalid response format', { 
          has_access: !!access_token, 
          has_user: !!userData,
          response_keys: Object.keys(data)
        })
        return { success: false, error: 'Invalid response from server' }
      }
    } catch (error) {
      persistentLog('🔴 Error caught', { 
        message: error.message, 
        response: error.response?.data,
        status: error.response?.status
      })
      const message = error.response?.data?.error || error.response?.data?.detail || 'Google authentication failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }
  
  const logout = () => {
    persistentLog('🔵 Logging out...')
    authService.logout()
    setUser(null)
    toast.success('Logged out successfully')
  }
  
  const updateProfile = async (data) => {
    try {
      const updatedUser = await authService.updateProfile(data)
      const currentUser = { ...user, ...updatedUser }
      setUser(currentUser)
      localStorage.setItem('user', JSON.stringify(currentUser))
      toast.success('Profile updated successfully')
      return { success: true, data: updatedUser }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.response?.data?.message }
    }
  }
  
  const value = {
    user,
    setUser,
    login,
    register,
    signUpWithGoogle,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isFieldAgent: user?.role === 'agent',
    loading
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}