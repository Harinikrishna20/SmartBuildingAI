import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const isProvider = user?.role === 'provider' || user?.role === 'serviceProvider'
  const [formData, setFormData] = useState({
    name: user?.name || user?.fullName || 'Harini Perera',
    email: user?.email || 'harini@smartbuilding.ai',
    phone: user?.phone || '+94 77 123 4567',
    serviceCategory: user?.service_category || user?.serviceCategory || 'Plumber',
    workingLocation: user?.location || user?.workingLocation || 'Colombo 06',
    availability: user?.availability || 'Available',
    experience: user?.experience || '7 years',
  })

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{isProvider ? 'Service Provider Profile' : 'Resident Profile'}</h2>
        </div>
      </div>

      <form className="card-surface form-card">
        <div className="field-group">
          <label>Name</label>
          <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="field-group">
          <label>Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="field-group">
          <label>Phone</label>
          <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>

        {isProvider ? (
          <>
            <div className="field-group">
              <label>Service category</label>
              <input value={formData.serviceCategory} onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })} />
            </div>
            <div className="field-group">
              <label>Working location</label>
              <input value={formData.workingLocation} onChange={(e) => setFormData({ ...formData, workingLocation: e.target.value })} />
            </div>
            <div className="field-group">
              <label>Availability</label>
              <input value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })} />
            </div>
            <div className="field-group">
              <label>Experience</label>
              <input value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
            </div>
          </>
        ) : (
          <div className="field-group">
            <label>Location</label>
            <input value="Colombo 07" readOnly />
          </div>
        )}

        <button type="button" className="primary-btn">Save Changes</button>
      </form>
    </div>
  )
}
