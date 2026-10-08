import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const normalizeRole = (role) => (role === 'serviceProvider' ? 'provider' : role)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartbuilding-user')
    if (!savedUser) return null
    const parsed = JSON.parse(savedUser)
    return parsed ? { ...parsed, role: normalizeRole(parsed.role) } : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('smartbuilding-token'))

  useEffect(() => {
    if (user) {
      const normalizedUser = { ...user, role: normalizeRole(user.role) }
      localStorage.setItem('smartbuilding-user', JSON.stringify(normalizedUser))
    } else {
      localStorage.removeItem('smartbuilding-user')
    }
  }, [user])

  useEffect(() => {
    if (token) {
      localStorage.setItem('smartbuilding-token', token)
      authApi.me()
        .then((meUser) => setUser(meUser ? { ...meUser, role: normalizeRole(meUser.role) } : null))
        .catch(() => {
          setUser(null)
          setToken(null)
        })
    } else {
      localStorage.removeItem('smartbuilding-token')
    }
  }, [token])

  const login = async ({ email, password }) => {
    const response = await authApi.login({ email, password })
    const nextUser = response.user ? { ...response.user, role: normalizeRole(response.user.role) } : null
    setToken(response.token)
    setUser(nextUser)
    return nextUser
  }

  const register = async (payload) => {
    const nextPayload = {
      ...payload,
      name: payload.name || payload.fullName,
      location: payload.location || payload.workingLocation || '',
      serviceCategory: payload.serviceCategory || payload.service_category || null,
      latitude: payload.latitude ? Number(payload.latitude) : null,
      longitude: payload.longitude ? Number(payload.longitude) : null,
      experience: payload.experience ? Number(payload.experience) : null,
    }
    const response = await authApi.register(nextPayload)
    const nextUser = response.user ? { ...response.user, role: normalizeRole(response.user.role) } : null
    setToken(response.token)
    setUser(nextUser)
    return nextUser
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const value = useMemo(
    () => ({ user, setUser, login, register, logout, token }),
    [user, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
