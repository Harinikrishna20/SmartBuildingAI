import Timeline from './Timeline'

export default function RequestCard({ request, onView }) {
  const normStatus = (request.status || '').toLowerCase()
  const isCompleted = normStatus === 'completed'
  const isInProgress = normStatus === 'in_progress'
  const isAccepted = normStatus === 'accepted' || isInProgress || isCompleted
  const hasProvider = Boolean(request.provider_id || request.providerName || request.provider_name || request.provider)

  const timelineItems = request.timeline?.length
    ? request.timeline
    : [
        { key: 'request_submitted', status: 'Request submitted', completed: true },
        { key: 'ai_classified', status: 'AI classified', completed: true },
        { key: 'priority_assigned', status: 'Priority assigned', completed: true },
        { key: 'provider_matched', status: 'Provider matched', completed: hasProvider },
        { key: 'provider_accepted', status: 'Provider accepted', completed: isAccepted },
        { key: 'in_progress', status: 'Work in progress', completed: isInProgress || isCompleted, current: isInProgress },
        { key: 'resolved', status: 'Problem resolved', completed: isCompleted, current: isCompleted },
      ]

  const statusDisplay = isCompleted
    ? 'COMPLETED'
    : isInProgress
      ? 'WORK IN PROGRESS'
      : isAccepted
        ? 'ACCEPTED'
        : 'PENDING'

  const priorityLabel = request.priorityLabel || request.priority_level || 'High'
  const providerDisplay = request.providerName || request.provider_name || request.provider?.name || 'Awaiting match'

  return (
    <div className="request-card card-surface">
      <div className="request-card__top">
        <div>
          <p className="eyebrow">MY MAINTENANCE REQUEST</p>
          <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{request.ai_issue || request.category}</h3>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {request.category} · {priorityLabel} Priority
          </p>
        </div>
        <span className={`status-badge ${isCompleted ? 'status-badge--success' : isInProgress ? 'status-badge--warning' : isAccepted ? 'status-badge--info' : 'status-badge--neutral'}`}>
          {statusDisplay}
        </span>
      </div>

      <div className="request-card__foot" style={{ margin: '0.75rem 0', padding: '0.6rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <span className="muted" style={{ display: 'block', fontSize: '0.8rem' }}>Provider</span>
          <strong>{providerDisplay}</strong>
        </div>
        <div>
          <span className="muted" style={{ display: 'block', fontSize: '0.8rem' }}>Status</span>
          <strong style={{ color: isCompleted ? 'var(--teal-400)' : isInProgress ? 'var(--amber-400)' : 'inherit' }}>
            {statusDisplay}
          </strong>
        </div>
      </div>

      <div style={{ margin: '0.75rem 0' }}>
        <p className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
          Timeline
        </p>
        <Timeline items={timelineItems} />
      </div>

      {isCompleted ? (
        <div style={{ background: 'rgba(47, 165, 141, 0.15)', border: '1px solid rgba(47, 165, 141, 0.3)', borderRadius: '8px', padding: '0.6rem 0.8rem', color: '#2fa58d', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
          <span>✓</span> Problem resolved
        </div>
      ) : null}

      <p className="request-card__desc" style={{ marginTop: '0.5rem' }}>{request.description}</p>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="secondary-btn" onClick={() => onView(request)}>
          View details
        </button>
      </div>
    </div>
  )
}
