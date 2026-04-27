import React, { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Shield, Trash2, ToggleLeft, ToggleRight, Plus, Eye, X, UserPlus } from 'lucide-react'
import { adminService, authService } from '../../services/api'
import toast from 'react-hot-toast'
import FieldCard from '../fields/FieldCard'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [selectedAgentFields, setSelectedAgentFields] = useState([])
  const [selectedAgentName, setSelectedAgentName] = useState('')
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [newAgent, setNewAgent] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  })
  const [creating, setCreating] = useState(false)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminService.getUsers()
      // Handle different response formats
      if (Array.isArray(data)) {
        setUsers(data)
      } else if (data && data.results && Array.isArray(data.results)) {
        setUsers(data.results)
      } else if (data && data.users && Array.isArray(data.users)) {
        setUsers(data.users)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  
  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId)
      toast.success('User status updated')
      await fetchUsers() // Refresh immediately
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Failed to update user status')
    }
  }
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // Optimistic update - remove from UI immediately
      const previousUsers = [...users]
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      
      try {
        await adminService.deleteUser(userId)
        toast.success('User deleted successfully')
        await fetchUsers() // Final refresh to ensure consistency
      } catch (error) {
        // Restore on failure
        setUsers(previousUsers)
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
      }
    }
  }
  
  // Admin creation handler
  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.username || !newAdmin.password) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (newAdmin.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    setCreating(true)
    try {
      await authService.createAdmin({ 
        email: newAdmin.email, 
        username: newAdmin.username, 
        password: newAdmin.password 
      })
      toast.success('Admin user created successfully')
      setShowCreateModal(false)
      setNewAdmin({ email: '', username: '', password: '', confirmPassword: '' })
      await fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }
  
  // Agent creation handler
  const handleCreateAgent = async () => {
    if (!newAgent.email || !newAgent.username || !newAgent.password) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (newAgent.password !== newAgent.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setCreating(true)
    try {
      await authService.register({ 
        email: newAgent.email, 
        username: newAgent.username, 
        password: newAgent.password,
        role: 'agent',
        first_name: newAgent.first_name || '',
        last_name: newAgent.last_name || ''
      })
      toast.success('Field Agent created successfully')
      setShowAgentModal(false)
      setNewAgent({ email: '', username: '', password: '', confirmPassword: '', first_name: '', last_name: '' })
      await fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create agent')
    } finally {
      setCreating(false)
    }
  }
  
  // View agent's assigned fields
  const viewAgentFields = async (agentId, agentName) => {
    try {
      const response = await adminService.getAgentFields(agentId)
      setSelectedAgentFields(response.fields || [])
      setSelectedAgentName(agentName)
      setShowFieldsModal(true)
    } catch (error) {
      console.error('Error loading agent fields:', error)
      toast.error('Failed to load assigned fields')
    }
  }

  const getRoleBadgeColor = (role) => {
    return role === 'admin' || role === 'ADMIN'
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Create Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their access</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAgentModal(true)} 
            className="btn-secondary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Agent
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn-primary flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Create Admin
          </button>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Fields
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.first_name?.[0] || user.username?.[0] || 'U'}{user.last_name?.[0] || ''}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role === 'admin' || user.role === 'ADMIN' ? 'Admin' : 'Field Agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'agent' && (
                      <button
                        onClick={() => viewAgentFields(user.id, user.username)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Fields ({user.assigned_fields_count || 0})
                      </button>
                    )}
                    {user.role !== 'agent' && (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Create Admin User</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="input-field"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="input-field"
                  placeholder="admin_username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCreateAdmin} 
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Create Field Agent</h2>
              </div>
              <button onClick={() => setShowAgentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  className="input-field"
                  placeholder="agent@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newAgent.username}
                  onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })}
                  className="input-field"
                  placeholder="agent_username"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newAgent.first_name}
                    onChange={(e) => setNewAgent({ ...newAgent, first_name: e.target.value })}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newAgent.last_name}
                    onChange={(e) => setNewAgent({ ...newAgent, last_name: e.target.value })}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newAgent.confirmPassword}
                  onChange={(e) => setNewAgent({ ...newAgent, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCreateAgent} 
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Creating...' : 'Create Agent'}
                </button>
                <button 
                  onClick={() => setShowAgentModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Assigned Fields Modal */}
      {showFieldsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                Fields Assigned to {selectedAgentName}
              </h2>
              <button onClick={() => setShowFieldsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {selectedAgentFields.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No fields assigned to this agent yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAgentFields.map(field => (
                    <FieldCard key={field.id} field={field} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement