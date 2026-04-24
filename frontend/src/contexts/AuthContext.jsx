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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])
  
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password)
      setUser(data.user)
      toast.success('Login successful!')
      return true
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
      return false
    }
  }
  
  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      toast.success('Registration successful! Please verify your email.')
      return true
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
      return false
    }
  }
  
  const logout = () => {
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
      return true
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      return false
    }
  }
  
  const value = {
    user,
    setUser,
    login,
    register,
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