import axios from 'axios'
import { Capacitor } from '@capacitor/core'

const defaultApiUrl = Capacitor.isNativePlatform()
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api'
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || defaultApiUrl
const API_BASE_URL = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl.replace(/\/$/, '')}/api`

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartbuilding-token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error
    if (message) error.message = message
    else if (!error.response) error.message = 'Unable to connect to SmartBuilding AI server. Check your internet connection and try again.'
    else if (error.response.status >= 500) error.message = 'SmartBuilding AI is temporarily unavailable. Please try again shortly.'
    return Promise.reject(error)
  },
)

const unwrapData = (response) => response?.data?.data ?? response?.data ?? response

const normalizeRole = (role) => {
  if (role === 'serviceProvider') return 'provider'
  return role
}

const normalizeStatus = (status) => {
  const value = String(status || 'requested').trim()
  if (value === 'Requested') return 'requested'
  if (value === 'Accepted') return 'accepted'
  if (value === 'In Progress' || value === 'in_progress') return 'in_progress'
  if (value === 'Completed') return 'completed'
  return value.toLowerCase()
}

const normalizeBackendStatus = (status) => {
  const value = String(status || 'requested').trim()
  if (value === 'requested') return 'Requested'
  if (value === 'accepted') return 'Accepted'
  if (value === 'in_progress') return 'In Progress'
  if (value === 'completed') return 'Completed'
  return value
}

const normalizeRequest = (request) => {
  if (!request) return request

  return {
    ...request,
    status: normalizeStatus(request.status),
    priority: request.priority_score ?? request.priority ?? 0,
    priorityLabel: request.priority_level || request.priorityLabel || 'Medium',
    requestedAt: request.created_at || request.requestedAt,
    providerName: request.provider_name || request.providerName || request.provider?.name || null,
  }
}

export const authApi = {
  register: async (payload) => {
    const normalizedPayload = {
      name: payload.name || payload.fullName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: normalizeRole(payload.role || 'resident'),
      location: payload.location || payload.workingLocation || '',
      latitude: payload.latitude ? Number(payload.latitude) : null,
      longitude: payload.longitude ? Number(payload.longitude) : null,
      service_category: payload.serviceCategory || payload.service_category || null,
      availability: payload.availability || null,
      experience: payload.experience ? Number(payload.experience) : null,
    }
    const response = await api.post('/auth/register', normalizedPayload)
    const data = unwrapData(response)
    const user = data.user ? { ...data.user, role: normalizeRole(data.user.role) } : data.user
    return { success: true, user, token: data.token }
  },

  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password })
    const data = unwrapData(response)
    const user = data.user ? { ...data.user, role: normalizeRole(data.user.role) } : data.user
    return { success: true, user, token: data.token }
  },

  me: async () => {
    const response = await api.get('/auth/me')
    const data = unwrapData(response)
    return data.user ? { ...data.user, role: normalizeRole(data.user.role) } : data.user
  },
}

export const requestApi = {
  createRequest: async (payload) => {
    const response = await api.post('/requests', payload)
    const data = unwrapData(response)
    return { success: true, request: normalizeRequest(data.request || data) }
  },

  getAll: async () => {
    const response = await api.get('/requests')
    const data = unwrapData(response)
    const requests = Array.isArray(data.requests) ? data.requests.map(normalizeRequest) : Array.isArray(data) ? data.map(normalizeRequest) : []
    return { success: true, requests }
  },

  getById: async (id) => {
    const response = await api.get(`/requests/${id}`)
    const data = unwrapData(response)
    const request = normalizeRequest(data.request || data)
    return { success: true, request }
  },

  acceptRequest: async (requestId, provider) => {
    const response = await api.post(`/requests/${requestId}/accept`, { providerId: provider.id })
    const data = unwrapData(response)
    return { success: true, request: normalizeRequest(data.request || data) }
  },

  assignProvider: async (requestId, providerId) => {
    const response = await api.post(`/requests/${requestId}/provider`, { provider_id: providerId })
    const data = unwrapData(response)
    return { success: true, request: normalizeRequest(data.request || data) }
  },

  updateStatus: async (requestId, status) => {
    const backendStatus = normalizeBackendStatus(status)
    const response = await api.patch(`/requests/${requestId}/status`, { status: backendStatus })
    const data = unwrapData(response)
    return { success: true, request: normalizeRequest(data.request || data) }
  },
}

export const providerApi = {
  setupDemoProviders: async ({ latitude, longitude } = {}) => {
    const response = await api.post('/providers/demo-setup', { latitude, longitude })
    return { success: true, data: unwrapData(response) }
  },

  getNearby: async ({ latitude, longitude, category, radius = 10 } = {}) => {
    const response = await api.get('/providers/nearby', {
      params: {
        latitude,
        longitude,
        category,
        radius,
      },
    })
    const data = unwrapData(response)
    const providers = Array.isArray(data.providers) ? data.providers : Array.isArray(data) ? data : []
    return { success: true, providers }
  },

  getRequests: async () => {
    const response = await api.get('/providers/requests')
    const data = unwrapData(response)
    const requests = Array.isArray(data.requests) ? data.requests : []
    return { success: true, requests }
  },

  rejectRequest: async (requestId) => {
    const response = await api.post(`/requests/${requestId}/reject`)
    return { success: true, data: unwrapData(response) }
  },

  getJobs: async () => {
    const response = await api.get('/providers/jobs')
    const data = unwrapData(response)
    const jobs = Array.isArray(data.jobs) ? data.jobs.map((job) => ({ ...job, status: normalizeStatus(job.status) })) : []
    return { success: true, jobs }
  },

  getProfile: async () => {
    const response = await api.get('/providers/profile')
    const data = unwrapData(response)
    return { success: true, profile: data.provider || data }
  },

  updateAvailability: async (updates) => {
    const response = await api.patch('/providers/availability', updates)
    const data = unwrapData(response)
    return { success: true, profile: data.provider || data }
  },
}

export const predictionApi = {
  recordReading: async ({ utilityType, usageValue }) => {
    const response = await api.post('/utility/readings', {
      utility_type: utilityType,
      usage_value: Number(usageValue),
    })
    const data = unwrapData(response)
    return { success: true, reading: data.reading }
  },

  getWater: async () => {
    const response = await api.get('/predictions/water')
    const data = unwrapData(response)
    return { success: true, data: data.data || data }
  },
  getElectricity: async () => {
    const response = await api.get('/predictions/electricity')
    const data = unwrapData(response)
    return { success: true, data: data.data || data }
  },
  getWaterHistory: async () => {
    const response = await api.get('/utility/water')
    const data = unwrapData(response)
    return { success: true, data: data.data || data }
  },
  getElectricityHistory: async () => {
    const response = await api.get('/utility/electricity')
    const data = unwrapData(response)
    return { success: true, data: data.data || data }
  },

  classifyIssue: async (description) => {
    const response = await api.post('/ai/classify-issue', { description })
    return { success: true, result: unwrapData(response) }
  },
}

export const publicUtilityApi = {
  getHistory: async (utilityType) => {
    const response = await api.get('/public-utilities', { params: { type: utilityType } })
    return { success: true, data: unwrapData(response) }
  },

  investigateHistory: async (utilityType) => {
    const response = await api.get('/public-utilities/investigation', { params: { type: utilityType } })
    return { success: true, data: unwrapData(response) }
  },
}

export const dashboardApi = {
  getHealthScore: async () => {
    const response = await api.get('/health-score')
    return { success: true, data: unwrapData(response) }
  },

  getNotifications: async () => {
    const response = await api.get('/notifications')
    const data = unwrapData(response)
    return { success: true, data: data.notifications || data }
  },
  getProviderNotifications: async () => {
    const response = await api.get('/notifications')
    const data = unwrapData(response)
    return { success: true, data: data.notifications || data }
  },
}
