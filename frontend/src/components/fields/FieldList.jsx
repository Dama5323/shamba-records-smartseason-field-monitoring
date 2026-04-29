import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  UserPlus,
  ArrowUpDown,
  X,
  User
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fieldService, exportService } from '../../services/api'
import toast from 'react-hot-toast'
import FieldQuickViewModal from './FieldQuickViewModal'

const FieldList = ({ initialFields, onFieldUpdate }) => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [fields, setFields] = useState(initialFields || [])
  const [loading, setLoading] = useState(!initialFields)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedFields, setSelectedFields] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [showQuickViewModal, setShowQuickViewModal] = useState(false)

  const itemsPerPageOptions = [25, 50, 100, 250, 500]

  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      setFields(initialFields)
      setLoading(false)
    } else {
      fetchFields()
    }
  }, [])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const response = await fieldService.getAllFields()
      let fieldsData = []
      
      if (Array.isArray(response)) {
        fieldsData = response
      } else if (response && response.results && Array.isArray(response.results)) {
        fieldsData = response.results
      } else if (response && response.fields && Array.isArray(response.fields)) {
        fieldsData = response.fields
      } else {
        fieldsData = []
      }
      
      // Process fields to ensure assigned_to_name is available
      const processedFields = fieldsData.map(field => ({
        ...field,
        assigned_to_name: field.assigned_to_details?.username || 
                          field.assigned_to_name || 
                          (field.assigned_to && typeof field.assigned_to === 'object' ? field.assigned_to.username : null)
      }))
      
      setFields(processedFields)
    } catch (error) {
      console.error('Error fetching fields:', error)
      toast.error('Failed to load fields')
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedFields.length === filteredFields.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(filteredFields.map(f => f.id))
    }
  }

  const handleSelectField = (fieldId) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(id => id !== fieldId))
    } else {
      setSelectedFields([...selectedFields, fieldId])
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const blob = await exportService.exportFieldsCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fields_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export started')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export fields')
    } finally {
      setExporting(false)
    }
  }

  const formatFieldId = (id) => {
    return `#FLD-${String(id).padStart(4, '0')}`
  }

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-emerald-100 text-emerald-700',
      'At Risk': 'bg-amber-100 text-amber-700',
      Completed: 'bg-blue-100 text-blue-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getStageBadge = (stage) => {
    const styles = {
      planted: 'bg-purple-100 text-purple-700',
      growing: 'bg-blue-100 text-blue-700',
      ready: 'bg-orange-100 text-orange-700',
      harvested: 'bg-emerald-100 text-emerald-700'
    }
    return styles[stage?.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  // Get assigned agent display name
  const getAssignedAgentName = (field) => {
    if (field.assigned_to_details?.username) {
      return field.assigned_to_details.username
    }
    if (field.assigned_to_details?.email) {
      return field.assigned_to_details.email.split('@')[0]
    }
    if (field.assigned_to_name) {
      return field.assigned_to_name
    }
    if (field.assigned_to && typeof field.assigned_to === 'object' && field.assigned_to.username) {
      return field.assigned_to.username
    }
    if (field.assigned_to && typeof field.assigned_to === 'object' && field.assigned_to.email) {
      return field.assigned_to.email.split('@')[0]
    }
    if (field.assigned_to && typeof field.assigned_to !== 'object') {
      return `Agent #${field.assigned_to}`
    }
    return null
  }

  // Filtering
  const filteredFields = fields.filter(field => {
    const agentName = getAssignedAgentName(field) || ''
    const matchesSearch = searchTerm === '' || 
      field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.crop_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatFieldId(field.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      agentName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || field.status === statusFilter
    const matchesStage = stageFilter === 'all' || field.current_stage === stageFilter
    
    return matchesSearch && matchesStatus && matchesStage
  })

  // Sorting
  const sortedFields = [...filteredFields].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    if (sortField === 'planting_date' || sortField === 'created_at' || sortField === 'updated_at') {
      aVal = new Date(aVal || 0)
      bVal = new Date(bVal || 0)
    }
    
    if (typeof aVal === 'string') {
      aVal = aVal?.toLowerCase() || ''
      bVal = bVal?.toLowerCase() || ''
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedFields.length / itemsPerPage)
  const paginatedFields = sortedFields.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setStageFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || stageFilter !== 'all'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Fields</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and monitor all agricultural fields
            {filteredFields.length > 0 && ` • ${filteredFields.length} field${filteredFields.length !== 1 ? 's' : ''}`}
            {selectedFields.length > 0 && ` • ${selectedFields.length} selected`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <Link
            to="/fields/create"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
          >
            + New Field
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by field name, crop, location, ID, or assigned agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-white text-emerald-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {(statusFilter !== 'all' ? 1 : 0) + (stageFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Growth Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Stages</option>
                <option value="planted">Planted</option>
                <option value="growing">Growing</option>
                <option value="ready">Ready</option>
                <option value="harvested">Harvested</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Items per page selector */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Show
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="mx-2 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {itemsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          entries
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {isAdmin && (
                  <th className="px-4 py-3 text-left w-8">
                    <input
                      type="checkbox"
                      checked={selectedFields.length === filteredFields.length && filteredFields.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('id')}>
                  ID <SortIcon field="id" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                  Field Name <SortIcon field="name" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('crop_type')}>
                  Crop <SortIcon field="crop_type" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('current_stage')}>
                  Stage <SortIcon field="current_stage" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('planting_date')}>
                  Planted <SortIcon field="planting_date" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedFields.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>No fields found</p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-emerald-600 text-sm hover:underline">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFields.map((field) => {
                  const agentName = getAssignedAgentName(field)
                  return (
                    <tr key={field.id} className="hover:bg-gray-50 transition">
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.id)}
                            onChange={() => handleSelectField(field.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {formatFieldId(field.id)}
                        </code>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link to={`/fields/${field.id}`} className="hover:text-emerald-600">
                          {field.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{field.crop_type || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStageBadge(field.current_stage)}`}>
                          {field.current_stage || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(field.status)}`}>
                          {field.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {agentName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-sm">{agentName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {field.planting_date ? new Date(field.planting_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {field.location || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick View (Eye icon) - Opens modal */}
                          <button
                            onClick={() => {
                              setSelectedFieldId(field.id)
                              setShowQuickViewModal(true)
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 transition rounded-lg hover:bg-emerald-50"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                      
                          
                          {isAdmin && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete field "${field.name}"? This action cannot be undone.`)) {
                                  try {
                                    await fieldService.deleteField(field.id)
                                    await fetchFields()
                                    toast.success('Field deleted successfully')
                                  } catch (error) {
                                    toast.error('Failed to delete field')
                                  }
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                              title="Delete Field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedFields.length)} of {sortedFields.length} fields
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm transition ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <FieldQuickViewModal
        isOpen={showQuickViewModal}
        onClose={() => {
          setShowQuickViewModal(false)
          setSelectedFieldId(null)
        }}
        fieldId={selectedFieldId}
        onFieldUpdated={fetchFields}
      />
    </div>
  )
}

export default FieldList