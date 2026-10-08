import { useState } from 'react'
import { ArrowRight, MapPinned } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { predictionApi, requestApi } from '../services/api'
import { getCurrentCoordinates } from '../services/location'

const issueOptions = ['Electrical Issue', 'Plumbing', 'Appliance Repair', 'Structural Damage', 'Other']

export default function ReportProblem() {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const preferredProvider = routeLocation.state?.preferredProvider
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    photo: '',
    location: '',
    latitude: '',
    longitude: '',
  })
  const [locationStatus, setLocationStatus] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdRequest, setCreatedRequest] = useState(null)

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Choose an image smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photo: String(reader.result) }))
      setError('')
    }
    reader.onerror = () => setError('Unable to read that image. Please choose another file.')
    reader.readAsDataURL(file)
  }

  const handleUseCurrentLocation = async () => {
    setLocationStatus('Detecting location...')
    try {
      const coordinates = await getCurrentCoordinates()
      setFormData((prev) => ({
        ...prev,
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        location: prev.location || 'Current location',
      }))
      setLocationStatus('Location detected ✓')
    } catch (err) {
      console.warn('Geolocation unavailable, applying fallback coordinates:', err.message)
      const fallbackLat = 12.6827
      const fallbackLon = 77.7158
      setFormData((prev) => ({
        ...prev,
        latitude: String(fallbackLat),
        longitude: String(fallbackLon),
        location: prev.location || 'Bengaluru (Demo location)',
      }))
      setLocationStatus('Location detected ✓ (Fallback coordinates)')
    }
  }

  const handleAnalyzeProblem = async () => {
    if (!formData.description.trim()) {
      setError('Describe the problem before running the analysis.')
      return
    }

    setAnalysisLoading(true)
    setError('')
    try {
      const { result } = await predictionApi.classifyIssue(formData.description)
      const nextAnalysis = {
        category: result.suggested_category,
        issue: result.possible_issue,
        priority: result.priority_level,
        priorityScore: result.priority_score,
        reason: result.reason,
      }
      setAiAnalysis(nextAnalysis)
      setFormData((prev) => ({ ...prev, category: nextAnalysis.category }))
    } catch (analysisError) {
      setError(analysisError.message || 'Unable to analyze the description right now.')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!aiAnalysis) {
      setError('Analyze the problem and review the result before submitting.')
      return
    }

    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      setLocationStatus('Use current location or enter both coordinates before submitting.')
      return
    }

    const latitude = Number(formData.latitude)
    const longitude = Number(formData.longitude)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setLocationStatus('Please enter a valid latitude between -90 and 90.')
      return
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setLocationStatus('Please enter a valid longitude between -180 and 180.')
      return
    }

    setSubmitting(true)
    const payload = {
      category: formData.category || aiAnalysis.category,
      description: formData.description,
      photo_url: formData.photo || null,
      address: formData.location || 'Current location',
      latitude,
      longitude,
      priority_score: aiAnalysis.priorityScore,
      priority_level: aiAnalysis.priority,
      ai_category: aiAnalysis.category,
      ai_issue: aiAnalysis.issue,
      preferred_provider_id: preferredProvider?.id,
    }

    try {
      const { request } = await requestApi.createRequest(payload)
      setCreatedRequest(request)
    } catch (error) {
      console.error('Request submission failed', error)
      setError(error.message || 'Unable to submit the request right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdRequest) {
    return (
      <div className="page-stack">
        <div className="page-header">
          <div>
            <p className="eyebrow">Maintenance</p>
            <h2>Report Status</h2>
          </div>
        </div>

        <div className="card-surface confirmation-card">
          <div className="section-head">
            <h3>✓ Maintenance Request Created</h3>
            <span className="status-badge status-badge--success">Saved in Database</span>
          </div>

          <p className="muted" style={{ marginBottom: '1.25rem' }}>
            Your issue has been analyzed successfully.
          </p>

          <div className="detail-list">
            <div>
              <span>Category:</span>
              <strong>{createdRequest.category || createdRequest.ai_category || aiAnalysis?.category}</strong>
            </div>
            <div>
              <span>Issue:</span>
              <strong>{createdRequest.ai_issue || aiAnalysis?.issue}</strong>
            </div>
            <div>
              <span>Priority:</span>
              <strong>{createdRequest.priority_level || aiAnalysis?.priority}</strong>
            </div>
            <div>
              <span>Priority Score:</span>
              <strong>{createdRequest.priority_score ?? aiAnalysis?.priorityScore}/100</strong>
            </div>
            <div>
              <span>Description:</span>
              <p>{createdRequest.description}</p>
            </div>
            <div>
              <span>Location:</span>
              <strong>Location detected ✓</strong>
            </div>
          </div>

          <div className="inline-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                navigate('/resident/nearby-services', {
                  state: {
                    requestId: createdRequest.id,
                    category: createdRequest.ai_category || createdRequest.category,
                    latitude: createdRequest.latitude,
                    longitude: createdRequest.longitude,
                  },
                })
              }
            >
              Find Nearby Providers
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(`/resident/request-details/${createdRequest.id}`)}
            >
              View Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h2>Report a Problem</h2>
        </div>
      </div>

      <div className="request-grid">
        <form className="card-surface form-card" onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Category · AI will determine</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="">AI will determine</option>
              {issueOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Describe the problem</label>
            <textarea rows="6" value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setAiAnalysis(null) }} required />
          </div>

          <div className="field-group">
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {formData.photo ? <img src={formData.photo} alt="Preview" className="photo-preview" /> : null}
          </div>

          <div className="field-group">
            <label>Location</label>
            <button type="button" className="secondary-btn" onClick={handleUseCurrentLocation}><MapPinned size={16} /> 📍 Use My Current Location</button>
            {locationStatus ? <p className="field-hint">{locationStatus}</p> : null}
            <div className="coords-grid">
              <input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Latitude" />
              <input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Longitude" />
            </div>
            <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Address, if available" />
          </div>

          <div className="inline-actions">
            <button type="button" className="secondary-btn" onClick={handleAnalyzeProblem} disabled={analysisLoading}>{analysisLoading ? 'Analyzing...' : 'Analyze with AI'}</button>
            <button type="submit" className="primary-btn" disabled={!aiAnalysis || submitting}>
              {submitting ? 'Finding providers...' : 'Confirm & Find Provider'}
              <ArrowRight size={16} />
            </button>
          </div>
          {error ? <p className="field-error" role="alert">{error}</p> : null}
        </form>

        <aside className="card-surface ai-analysis">
          <div className="section-head">
            <h3>AI analysis</h3>
          </div>

          <div className="ai-analysis__block">
            <span>Category</span>
            <strong>{aiAnalysis?.category || 'Not analyzed yet'}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Issue</span>
            <strong>{aiAnalysis?.issue || 'Waiting for analysis'}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Priority</span>
            <strong>{aiAnalysis?.priority || 'Pending'}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Reason</span>
            <p>{aiAnalysis?.reason || 'Run the analysis to classify the issue.'}</p>
          </div>
          {preferredProvider ? (
            <div className="ai-analysis__block">
              <span>Selected provider</span>
              <strong>{preferredProvider.name} · {preferredProvider.service_category || preferredProvider.service}</strong>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
