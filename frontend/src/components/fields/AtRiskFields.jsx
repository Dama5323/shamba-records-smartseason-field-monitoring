import React, { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { fieldService } from '../../services/api'
import FieldList from './FieldList'
import toast from 'react-hot-toast'

const AtRiskFields = () => {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchAtRiskFields()
  }, [])
  
  const fetchAtRiskFields = async () => {
    try {
      setLoading(true)
      const data = await fieldService.getAtRiskFields()
      setFields(data)
    } catch (error) {
      console.error('Error fetching at-risk fields:', error)
      toast.error('Failed to load at-risk fields')
    } finally {
      setLoading(false)
    }
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
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fields At Risk</h1>
          <p className="text-gray-600 mt-1">
            Fields requiring immediate attention
          </p>
        </div>
      </div>
      
      {fields.length > 0 ? (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ {fields.length} field{fields.length !== 1 ? 's are' : ' is'} at risk. Please review and take necessary action.
            </p>
          </div>
          <FieldList fields={fields} showActions />
        </>
      ) : (
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-500">No fields at risk</p>
          <p className="text-sm text-gray-400">All fields are on track!</p>
        </div>
      )}
    </div>
  )
}

export default AtRiskFields