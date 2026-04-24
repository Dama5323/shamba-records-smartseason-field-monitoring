import React from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

const Alert = ({ type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />
  }
  
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }
  
  return (
    <div className={`rounded-lg border p-4 mb-4 ${colors[type]} relative`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto">
            <XCircle className="h-5 w-5 opacity-50 hover:opacity-100" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert