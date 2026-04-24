import React from 'react'
import FieldCard from './FieldCard'
import EmptyState from '../common/EmptyState'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const FieldList = ({ fields, showActions = true }) => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  
  const fieldsArray = Array.isArray(fields) ? fields : []
  
  if (fieldsArray.length === 0) {
    return (
      <EmptyState 
        type="fields"
        onAction={isAdmin ? () => navigate('/fields/create') : null}
      />
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fieldsArray.map((field) => (
        <FieldCard key={field.id} field={field} />
      ))}
    </div>
  )
}

export default FieldList