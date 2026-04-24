export const CROP_STAGES = {
  PLANTED: 'Planted',
  GROWING: 'Growing',
  READY: 'Ready',
  HARVESTED: 'Harvested'
}

export const CROP_TYPES = [
  'Maize',
  'Wheat',
  'Rice',
  'Soybeans',
  'Potatoes',
  'Tomatoes',
  'Cotton',
  'Coffee',
  'Tea',
  'Sugarcane'
]

export const FIELD_STATUS = {
  ACTIVE: 'Active',
  AT_RISK: 'At Risk',
  COMPLETED: 'Completed'
}

// Status determination logic:
// - ACTIVE: Planted/Growing stage and within expected growing season
// - AT_RISK: Growing stage but beyond expected harvest date OR observations indicate issues
// - COMPLETED: Ready/Harvested stage
export const determineFieldStatus = (field, observations = []) => {
  const { current_stage, planting_date } = field
  
  if (current_stage === 'HARVESTED' || current_stage === 'READY') {
    return FIELD_STATUS.COMPLETED
  }
  
  const plantingDate = new Date(planting_date)
  const today = new Date()
  const daysSincePlanting = Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24))
  
  // Check for at-risk conditions
  const hasRecentIssues = observations.some(obs => 
    obs.note?.toLowerCase().includes('pest') || 
    obs.note?.toLowerCase().includes('disease') ||
    obs.note?.toLowerCase().includes('problem')
  )
  
  if (current_stage === 'GROWING' && daysSincePlanting > 120) {
    return FIELD_STATUS.AT_RISK
  }
  
  if (hasRecentIssues && current_stage !== 'HARVESTED') {
    return FIELD_STATUS.AT_RISK
  }
  
  return FIELD_STATUS.ACTIVE
}

export const API_ENDPOINTS = {
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  PROFILE: '/auth/profile/',
  UPDATE_PROFILE: '/auth/profile/update/',
  CHANGE_PASSWORD: '/auth/change-password/',
  FIELDS: '/fields/',
  MY_FIELDS: '/my-fields/',
  AT_RISK_FIELDS: '/fields/at_risk/',
  DASHBOARD_STATS: '/dashboard/stats/',
  RECENT_FIELDS: '/dashboard/recent-fields/',
  AGENTS: '/agents/',
  ASSIGN_FIELD: '/fields/assign/',
  UNASSIGN_FIELD: '/fields/unassign/',
  USERS: '/auth/users/',
  TOGGLE_USER_STATUS: '/auth/users/',
  EXPORT_FIELDS_CSV: '/export/fields/csv/',
  EXPORT_OBSERVATIONS_CSV: '/export/observations/csv/'
}