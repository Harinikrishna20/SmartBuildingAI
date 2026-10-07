import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Timeline from '../components/Timeline'
import { requestApi } from '../services/api'

export default function RequestDetails() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)

  useEffect(() => {
    requestApi.getById(id)
      .then(({ request: data }) => setRequest(data))
      .catch((error) => {
        console.error('Failed to load request details', error)
        setRequest(null)
      })
  }, [id])

  if (!request) {
    return <div className="page-stack"><div className="card-surface">Loading request...</div></div>
  }

  const timeline = request.timeline?.length ? request.timeline.map((item) => item.status || item) : [request.status]

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
            <div><span>Provider</span><strong>{request.providerName || 'Awaiting match'}</strong></div>
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
            <div><span>Provider location</span><strong>{request.providerLocation || 'Pending assignment'}</strong></div>
            <div><span>Expected status update</span><strong>Within 2 hours</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}
