import { AlertTriangle, ArrowRight } from 'lucide-react'

export default function AlertCard({ title, description, normal, predicted, onAction, buttonText = 'Investigate' }) {
  return (
    <div className="alert-card card-surface">
      <div className="alert-card__header">
        <div className="alert-pill">
          <AlertTriangle size={18} />
          <span>{title}</span>
        </div>
      </div>

      <p className="alert-card__copy">{description}</p>

      <div className="alert-metrics">
        <div>
          <span>Normal</span>
          <strong>{normal}</strong>
        </div>
        <div>
          <span>Predicted</span>
          <strong>{predicted}</strong>
        </div>
      </div>

      <button type="button" className="primary-btn" onClick={onAction}>
        {buttonText}
        <ArrowRight size={16} />
      </button>

      <p className="alert-note">
        This pattern may indicate leakage or unusually high usage. Please check the situation before creating a maintenance request.
      </p>
    </div>
  )
}
