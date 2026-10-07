import { useMemo, useState } from 'react'
import { MapPinned } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { requestApi } from '../services/api'

const issueOptions = ['Electrical Issue', 'Water Leakage', 'Plumbing', 'Appliance Repair', 'Structural Damage', 'Other']

export default function ReportProblem() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    category: 'Water Leakage',
    description: 'There is water continuously leaking from underneath my kitchen sink.',
    photo: '',
    location: 'Colombo 07',
    latitude: '6.9271',
    longitude: '79.8612',
  })

  const aiAnalysis = useMemo(() => {
    const desc = formData.description.toLowerCase()
    if (desc.includes('water') || desc.includes('leak')) {
      return {
        category: 'Plumbing',
        issue: 'Water Leakage',
        priority: '87/100 — High',
        reason: 'Possible water-related issue with potential property damage.'
      }
    }
    if (desc.includes('electric') || desc.includes('breaker') || desc.includes('power')) {
      return {
        category: 'Electrical Issue',
        issue: 'Electrical hazard',
        priority: '98/100 — Critical',
        reason: 'Potential electrical hazard requiring urgent review.'
      }
    }
    return {
      category: 'Appliance Repair',
      issue: 'Household appliance issue',
      priority: '50/100 — Medium',
      reason: 'Likely appliance maintenance need with moderate urgency.'
    }
  }, [formData.description])

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, photo: url }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      category: formData.category || aiAnalysis.category,
      issueCategory: aiAnalysis.category,
      description: formData.description,
      location: formData.location,
      latitude: Number(formData.latitude || 0),
      longitude: Number(formData.longitude || 0),
      priority: 87,
      priorityLabel: 'High',
    }

    try {
      await requestApi.createRequest(payload)
      navigate('/resident/my-requests')
    } catch (error) {
      console.error('Request submission failed', error)
    }
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
            <label>Issue Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {issueOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label>Problem Description</label>
            <textarea rows="6" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="field-group">
            <label>Upload Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {formData.photo ? <img src={formData.photo} alt="Preview" className="photo-preview" /> : null}
          </div>

          <div className="field-group">
            <label>Location</label>
            <button type="button" className="secondary-btn"><MapPinned size={16} /> Use My Location</button>
            <div className="coords-grid">
              <input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Latitude" />
              <input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Longitude" />
            </div>
            <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Address if available" />
          </div>

          <button type="submit" className="primary-btn">Confirm & Submit Request</button>
        </form>

        <aside className="card-surface ai-analysis">
          <div className="section-head">
            <h3>AI Analysis</h3>
          </div>

          <div className="ai-analysis__block">
            <span>AI Suggested Category</span>
            <strong>{aiAnalysis.category}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Possible Issue</span>
            <strong>{aiAnalysis.issue}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Priority</span>
            <strong>{aiAnalysis.priority}</strong>
          </div>

          <div className="ai-analysis__block">
            <span>Reason</span>
            <p>{aiAnalysis.reason}</p>
          </div>

          <div className="ai-adjust">
            <label>AI suggestion can be adjusted before submission</label>
            <select value={aiAnalysis.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {issueOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </aside>
      </div>
    </div>
  )
}
