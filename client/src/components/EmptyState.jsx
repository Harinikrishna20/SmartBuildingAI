export default function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state card-surface">
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel ? (
        <button type="button" className="primary-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
