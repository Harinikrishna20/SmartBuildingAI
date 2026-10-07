import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [formData, setFormData] = useState({ email: 'harini@example.com', password: 'password123' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await login(formData)
      const isProvider = user?.role === 'provider' || user?.role === 'serviceProvider'
      navigate(isProvider ? '/provider' : '/resident', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card card-surface">
          <div className="auth-card__header">
            <div className="brand-inline"><div className="brand-mark">AI</div><span>SmartBuilding AI</span></div>
            <h2>Welcome back</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-wrap">
              <Mail size={16} />
              <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            </div>

            <div className="input-wrap">
              <Lock size={16} />
              <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Password" required />
              <button type="button" className="inline-icon" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error ? <p className="field-error">{error}</p> : null}

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <Link to="/register" className="secondary-btn auth-link">Create Account</Link>
          </form>
        </div>
      </div>
    </div>
  )
}
