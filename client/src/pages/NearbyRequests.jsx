import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { providerApi, requestApi } from '../services/api'

export default function NearbyRequests() {
  const [requests, setRequests] = useState([])
  const [distance, setDistance] = useState('All')
  const [category, setCategory] = useState('All')
  const [priority, setPriority] = useState('All')
  const { user } = useAuth()

  useEffect(() => {
    providerApi.getRequests()
      .then(({ requests: data = [] }) => setRequests(data))
      .catch((error) => {
        console.error('Failed to load nearby requests', error)
        setRequests([])
      })
  }, [])

  const jobs = useMemo(() => {
    return requests.filter((request) => {
      if (distance !== 'All') {
        const value = Number(request.distance_km ?? request.distance ?? 0)
        if (distance === '0-2 km' && !(value >= 0 && value <= 2)) return false
        if (distance === '2-5 km' && !(value > 2 && value <= 5)) return false
      }

      if (category !== 'All' && request.category !== category) return false
      if (priority !== 'All') {
        if (priority === 'High' && (request.priority_score ?? 0) < 70) return false
        if (priority === 'Critical' && (request.priority_score ?? 0) < 90) return false
      }
      return true
    })
  }, [category, distance, priority, requests])

  const handleAccept = async (requestId) => {
    try {
      await requestApi.acceptRequest(requestId, user)
      setRequests((prev) => prev.filter((request) => request.id !== requestId))
    } catch (error) {
      console.error('Failed to accept request', error)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Requests</p>
          <h2>Nearby Requests</h2>
        </div>
      </div>

      <div className="filter-grid">
        <select value={distance} onChange={(e) => setDistance(e.target.value)}>
          <option>All</option>
          <option>0-2 km</option>
          <option>2-5 km</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          <option>Plumbing</option>
          <option>Electrical Issue</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>All</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      <div className="request-grid request-grid--list">
        {jobs.map((request) => (
          <div key={request.id} className="request-card card-surface">
            <div className="request-card__top">
              <div>
                <h3>{request.category}</h3>
                <p className="eyebrow">Distance: {request.distance_km ?? request.distance ?? 'N/A'} km</p>
              </div>
              <span className="status-badge status-badge--warning">{request.priority_level || 'High'} — {request.priority_score ?? request.priority ?? 0}/100</span>
            </div>
            <p className="request-card__desc">{request.description}</p>
            <div className="request-card__actions">
              <button type="button" className="primary-btn" onClick={() => handleAccept(request.id)}>Accept Request</button>
              <button type="button" className="secondary-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
