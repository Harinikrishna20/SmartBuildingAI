export default function StatusBadge({ status }) {
  const label = (() => {
    if (status === 'requested') return 'Requested'
    if (status === 'accepted') return 'Accepted'
    if (status === 'in_progress') return 'In Progress'
    if (status === 'completed') return 'Completed'
    return 'Requested'
  })()

  const className = status === 'accepted' ? 'status-badge--info' : status === 'in_progress' ? 'status-badge--warning' : status === 'completed' ? 'status-badge--success' : 'status-badge--neutral'

  return <span className={`status-badge ${className}`}>{label}</span>
}
