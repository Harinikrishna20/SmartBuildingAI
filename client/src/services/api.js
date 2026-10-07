import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

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
      ...payload,
      role: normalizeRole(payload.role || 'resident'),
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

  updateStatus: async (requestId, status) => {
    const backendStatus = normalizeBackendStatus(status)
    const response = await api.patch(`/requests/${requestId}/status`, { status: backendStatus })
    const data = unwrapData(response)
    return { success: true, request: normalizeRequest(data.request || data) }
  },
}

export const providerApi = {
  getNearby: async () => {
    const response = await api.get('/providers/nearby')
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
}

export const predictionApi = {
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
}

export const dashboardApi = {
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
