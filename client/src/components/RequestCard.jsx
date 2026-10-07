import PriorityBadge from './PriorityBadge'
import StatusBadge from './StatusBadge'

export default function RequestCard({ request, onView }) {
  return (
    <div className="request-card card-surface">
      <div className="request-card__top">
        <div>
          <p className="eyebrow">Request ID</p>
          <h3>{request.id}</h3>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="request-card__meta">
        <span>{request.category}</span>
        <span>{request.date || request.requestedAt}</span>
      </div>

      <p className="request-card__desc">{request.description}</p>

      <div className="request-card__foot">
        <div>
          <span className="muted">Provider</span>
          <strong>{request.providerName || 'Awaiting match'}</strong>
        </div>
        <div>
          <span className="muted">Priority</span>
          <PriorityBadge value={request.priority} label={`${request.priority}/100`} />
        </div>
      </div>

      <button type="button" className="secondary-btn" onClick={() => onView(request)}>
        View details
      </button>
    </div>
  )
}
