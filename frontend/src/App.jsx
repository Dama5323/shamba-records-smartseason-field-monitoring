import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Navbar from './components/common/Navbar'
import AdminDashboard from './components/dashboard/AdminDashboard'
import AgentDashboard from './components/dashboard/AgentDashboard'
import FieldList from './components/fields/FieldList.jsx'
import FieldDetail from './components/fields/FieldDetail'
import CreateField from './components/fields/CreateField'
import AtRiskFields from './components/fields/AtRiskFields'
import UserManagement from './components/admin/UserManagement'
import { fieldService } from './services/api'
import { useEffect, useState } from 'react'
import Profile from './components/profile/Profile'
import LandingPage from './components/landing/LandingPage'

// Dashboard wrapper component
const DashboardWrapper = () => {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <AgentDashboard />
}

// Fields wrapper component
const FieldsWrapper = () => {
  const [fields, setFields] = useState([])
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchFields = async () => {
      try {
        if (isAdmin) {
          const data = await fieldService.getAllFields()
          // Handle response format
          if (Array.isArray(data)) {
            setFields(data)
          } else if (data && data.results && Array.isArray(data.results)) {
            setFields(data.results)
          } else {
            setFields([])
          }
        } else {
          const response = await fieldService.getMyFields()
          // Handle response format - API returns {total_fields: 0, fields: []}
          if (response && response.fields && Array.isArray(response.fields)) {
            setFields(response.fields)
          } else if (Array.isArray(response)) {
            setFields(response)
          } else {
            setFields([])
          }
        }
      } catch (error) {
        console.error('Error fetching fields:', error)
        setFields([])
      } finally {
        setLoading(false)
      }
    }
    fetchFields()
  }, [isAdmin])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Fields</h1>
        <p className="text-gray-600 mt-1">Manage and monitor all agricultural fields</p>
      </div>
      <FieldList fields={fields} showActions />
    </div>
  )
}

// Main App content
const AppContent = () => {
  const { isAuthenticated } = useAuth()
  
  // If not authenticated, show landing page with login/register routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  
  // If authenticated, show dashboard with navbar
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          } />
          <Route path="/fields" element={
            <ProtectedRoute>
              <FieldsWrapper />
            </ProtectedRoute>
          } />
          <Route path="/fields/create" element={
            <ProtectedRoute requiredRole="admin">
              <CreateField />
            </ProtectedRoute>
          } />
          <Route path="/fields/:id" element={
            <ProtectedRoute>
              <FieldDetail />
            </ProtectedRoute>
          } />
          <Route path="/at-risk" element={
            <ProtectedRoute>
              <AtRiskFields />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AuthProvider>
  )
}

export default App