import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('You don\'t have permission to access this resource')
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail)
    } else if (error.message !== 'Request aborted') {
      toast.error('Network error. Please try again.')
    }
    
    return Promise.reject(error)
  }
)

// Auth services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password })
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData)
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  createAgent: async (agentData) => {
    const response = await api.post('/auth/register/', agentData)
    return response.data
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/')
    return response.data
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile/update/', data)
    return response.data
  },

  createAdmin: (userData) => api.post('/auth/admin/create/', userData),
  
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword
    })
    return response.data
  }
}

// Field services 
export const fieldService = {
  getAllFields: async () => {
    const response = await api.get('/fields/')
    return response.data
  },
  
  getMyFields: async () => {
    try {
      console.log('Fetching my assigned fields...')
      const response = await api.get('/my-fields/')
      console.log('My fields response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error in getMyFields:', error)
      throw error
    }
  },
  
  getAtRiskFields: async () => {
    const response = await api.get('/fields/at_risk/')
    return response.data
  },
  
  getFieldDetails: async (id) => {
    const response = await api.get(`/fields/${id}/`)
    return response.data
  },
  
  getFieldObservations: async (id) => {
    const response = await api.get(`/fields/${id}/observations/`)
    return response.data
  },
  
  createField: async (fieldData) => {
    const response = await api.post('/fields/', fieldData)
    return response.data
  },
  
  updateField: async (id, fieldData) => {
    const response = await api.put(`/fields/${id}/`, fieldData)
    return response.data
  },
  
  partialUpdateField: async (id, fieldData) => {
    const response = await api.patch(`/fields/${id}/`, fieldData)
    return response.data
  },
  
  deleteField: async (id) => {
    const response = await api.delete(`/fields/${id}/`)
    return response.data
  },
  
  addObservation: async (id, observationData) => {
    const response = await api.post(`/fields/${id}/add_observation/`, observationData)
    return response.data
  },
  
  updateObservation: async (observationId, observationData) => {
    const response = await api.put(`/observations/${observationId}/`, observationData)
    return response.data
  },
  
  deleteObservation: async (observationId) => {
    const response = await api.delete(`/observations/${observationId}/`)
    return response.data
  },
  
  assignToAgent: async (fieldId, agentId) => {
    const response = await api.post(`/fields/assign/${fieldId}/`, { agent_id: agentId })
    return response.data
  },

  

    getFieldImages: async (fieldId) => {
    const response = await api.get(`/fields/fields/${fieldId}/images/`)
    return response.data
    },

    uploadFieldImage: async (fieldId, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await api.post(`/fields/fields/${fieldId}/upload_image/`, formData, {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
    },

    deleteFieldImage: async (imageId) => {
    const response = await api.delete(`/field-images/${imageId}/`)
    return response.data
    },

    assignField: async (fieldId, agentId) => {
    const response = await api.post(`/fields/assign/${fieldId}/`, { agent_id: agentId })
    return response.data
    },

    unassignField: async (fieldId) => {
    const response = await api.post(`/fields/unassign/${fieldId}/`)
    return response.data
    },

    getAgents: async () => {
    const response = await api.get('/agents/')
    return response.data
    },
}

// Dashboard services
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats/')
    return response.data
  },
  
  getRecentFields: async () => {
    const response = await api.get('/dashboard/recent-fields/')
    return response.data
  }
}

// Admin services
export const adminService = {
  getUsers: async () => {
    const response = await api.get('/auth/users/')
    return response.data
  },
  
  getUserDetails: async (userId) => {
    const response = await api.get(`/auth/users/${userId}/`)
    return response.data
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/auth/users/${userId}/`, userData)
    return response.data
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}/`)
    return response.data
  },
  
  toggleUserStatus: async (userId) => {
    const response = await api.post(`/auth/users/${userId}/toggle-status/`)
    return response.data
  },
  
  getAgents: async () => {
    const response = await api.get('/agents/')
    return response.data
  },
  
  getAgentFields: async (agentId) => {
    const response = await api.get(`/agents/${agentId}/fields/`)
    return response.data
  }
}

// Export services
export const exportService = {
  exportFieldsCSV: async () => {
    const response = await api.get('/export/fields/csv/', { responseType: 'blob' })
    return response.data
  },
  
  exportObservationsCSV: async () => {
    const response = await api.get('/export/observations/csv/', { responseType: 'blob' })
    return response.data
  }
}

export default api