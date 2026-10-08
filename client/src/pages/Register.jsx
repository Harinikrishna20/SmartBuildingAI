import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCurrentCoordinates } from '../services/location'

const categories = ['Electrician', 'Plumber', 'Appliance Repair', 'Carpenter', 'Cleaning', 'Other']

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'resident',
    location: '',
    serviceCategory: 'Plumber',
    workingLocation: '',
    availability: 'Available',
    experience: '',
    latitude: '',
    longitude: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setLocationMessage('Your location is used to find nearby maintenance service providers and attach a location to your requests.')
    try {
      const coordinates = await getCurrentCoordinates()
      setFormData((prev) => ({
        ...prev,
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        location: prev.location || prev.workingLocation || 'Current location',
        workingLocation: prev.workingLocation || 'Current location',
      }))
      setLocationMessage('✓ Current location detected')
    } catch (error) {
      setLocationMessage(error.message)
    } finally {
      setLocating(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      const normalizedPayload = {
        ...formData,
        name: formData.fullName,
        role: formData.role === 'provider' || formData.role === 'serviceProvider' ? 'provider' : 'resident',
        location: formData.location || formData.workingLocation || '',
        serviceCategory: formData.serviceCategory,
        service_category: formData.serviceCategory,
        workingLocation: formData.workingLocation || formData.location || '',
      }
      const user = await register(normalizedPayload)
      const isProvider = user?.role === 'provider' || user?.role === 'serviceProvider'
      navigate(isProvider ? '/provider' : '/resident', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--wide">
        <div className="auth-card card-surface">
          <div className="auth-card__header">
            <div className="brand-inline"><div className="brand-mark">AI</div><span>SmartBuilding AI</span></div>
            <h2>Create account</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form auth-form--grid">
            <div className="input-wrap">
              <UserRound size={16} />
              <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required />
            </div>
            <div className="input-wrap">
              <Mail size={16} />
              <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            </div>
            <div className="input-wrap">
              <Phone size={16} />
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required />
            </div>

            <div className="input-wrap">
              <Lock size={16} />
              <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Password" required />
              <button type="button" className="inline-icon" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="input-wrap">
              <Lock size={16} />
              <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />
              <button type="button" className="inline-icon" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="input-wrap input-wrap--select">
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="resident">Resident</option>
                <option value="provider">Service Provider</option>
              </select>
            </div>

            {formData.role === 'resident' ? (
              <>
                <div className="input-wrap full-span">
                  <MapPin size={16} />
                  <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
                </div>
                <div className="full-span">
                  <button type="button" className="secondary-btn" onClick={handleUseCurrentLocation} disabled={locating}>
                    <MapPin size={16} /> {locating ? 'Finding location...' : '📍 Use My Current Location'}
                  </button>
                </div>
                <div className="full-span">
                  {locationMessage ? <p className="field-hint">{locationMessage}</p> : null}
                  {formData.latitude && formData.longitude ? (
                    <div className="coords-grid">
                      <input readOnly value={formData.latitude} placeholder="Latitude" />
                      <input readOnly value={formData.longitude} placeholder="Longitude" />
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="input-wrap input-wrap--select">
                  <select name="serviceCategory" value={formData.serviceCategory} onChange={handleChange}>
                    {categories.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="input-wrap">
                  <MapPin size={16} />
                  <input name="workingLocation" value={formData.workingLocation} onChange={handleChange} placeholder="Working Location" required />
                </div>
                <div className="full-span">
                  <button type="button" className="secondary-btn" onClick={handleUseCurrentLocation} disabled={locating}>
                    <MapPin size={16} /> {locating ? 'Finding location...' : '📍 Use My Current Location'}
                  </button>
                </div>
                <div className="full-span">
                  {locationMessage ? <p className="field-hint">{locationMessage}</p> : null}
                  {formData.latitude && formData.longitude ? (
                    <div className="coords-grid">
                      <input readOnly value={formData.latitude} placeholder="Latitude" />
                      <input readOnly value={formData.longitude} placeholder="Longitude" />
                    </div>
                  ) : null}
                </div>
                <div className="input-wrap input-wrap--select">
                  <select name="availability" value={formData.availability} onChange={handleChange}>
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Limited">Limited</option>
                  </select>
                </div>
                <div className="input-wrap">
                  <input name="experience" value={formData.experience} onChange={handleChange} placeholder="Experience" required />
                </div>
              </>
            )}

            {error ? <p className="field-error full-span">{error}</p> : null}

            <button type="submit" className="primary-btn full-span">Register</button>
            <p className="auth-switch full-span">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
