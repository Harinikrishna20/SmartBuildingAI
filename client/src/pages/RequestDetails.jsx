import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Timeline from '../components/Timeline'
import { requestApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RequestDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)

  useEffect(() => {
    let active = true
    const loadRequest = () => requestApi.getById(id)
      .then(({ request: data }) => { if (active) setRequest(data) })
      .catch((error) => {
        if (active) console.error('Failed to load request details', error)
      })

    loadRequest()
    const refreshInterval = window.setInterval(loadRequest, 5000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
    }
  }, [id])

  if (!request) {
    return <div className="page-stack"><div className="card-surface">Loading request...</div></div>
  }

  const timeline = request.timeline?.length ? request.timeline : [{ status: request.status_label || request.status, current: true, completed: true }]
  const normalizedStatus = String(request.status || '').toLowerCase()

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Request details</p>
          <h2>{request.category}</h2>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card-surface detail-card">
          <div className="section-head">
            <h3>Problem</h3>
          </div>
          <p><strong>{request.category}</strong></p>
          <p>{request.description}</p>
          <div className="detail-list">
            <div><span>AI Classification</span><strong>{request.ai_category || request.aiClassification || 'N/A'}</strong></div>
            <div><span>Priority</span><strong>{request.priority}/100 — {request.priorityLabel || 'Medium'}</strong></div>
            <div><span>Provider</span><strong>{request.providerName || request.provider?.name || 'Awaiting match'}</strong></div>
            {user?.role === 'provider' && request.provider_id === user.id ? (
              <>
                <div><span>Resident</span><strong>{request.resident_name || 'Resident'}</strong></div>
                <div><span>Distance</span><strong>{request.provider?.distance_km ?? 'N/A'} km</strong></div>
              </>
            ) : null}
            <div><span>Location</span><strong>{request.address || 'N/A'}</strong></div>
          </div>
        </div>

        <div className="card-surface detail-card">
          <div className="section-head">
            <h3>Status Timeline</h3>
          </div>
          <Timeline items={timeline} />
          <div className="detail-list compact-list">
            <div><span>Submitted time</span><strong>{request.requestedAt || 'N/A'}</strong></div>
            <div><span>Provider status</span><strong>{request.status_label || request.status}</strong></div>
            <div><span>Service updates</span><strong>{normalizedStatus === 'completed' ? 'Problem resolved' : normalizedStatus === 'in_progress' ? 'Work is in progress' : normalizedStatus === 'accepted' ? 'Provider accepted' : request.provider_id ? 'Pending provider acceptance' : 'Waiting for provider match'}</strong></div>
          </div>
          {user?.role === 'provider' && (request.provider_id === user.id || !request.provider_id) ? (
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.6rem' }}>
              {normalizedStatus === 'requested' ? (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={async () => {
                    await requestApi.acceptRequest(request.id)
                    requestApi.getById(id).then(({ request: data }) => setRequest(data))
                  }}
                >
                  Accept Request
                </button>
              ) : null}
              {normalizedStatus === 'accepted' ? (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={async () => {
                    await requestApi.updateStatus(request.id, 'In Progress')
                    requestApi.getById(id).then(({ request: data }) => setRequest(data))
                  }}
                >
                  Start Work
                </button>
              ) : null}
              {normalizedStatus === 'in_progress' ? (
                <button
                  type="button"
                  className="primary-btn"
                  style={{ background: '#2fa58d', borderColor: '#2fa58d' }}
                  onClick={async () => {
                    await requestApi.updateStatus(request.id, 'Completed')
                    requestApi.getById(id).then(({ request: data }) => setRequest(data))
                  }}
                >
                  Mark as Completed
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
