export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card card-surface">
        <div className="modal-card__head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
