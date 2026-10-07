export default function PredictionCard({ title, current, average, predicted, normalRange, status }) {
  return (
    <div className="prediction-card card-surface">
      <div className="prediction-card__header">
        <p className="eyebrow">{title}</p>
        <span className="status-badge status-badge--warning">{status}</span>
      </div>

      <div className="prediction-grid">
        <div>
          <span>Current</span>
          <strong>{current}</strong>
        </div>
        <div>
          <span>Average</span>
          <strong>{average}</strong>
        </div>
        <div>
          <span>Predicted</span>
          <strong>{predicted}</strong>
        </div>
        <div>
          <span>Normal range</span>
          <strong>{normalRange}</strong>
        </div>
      </div>
    </div>
  )
}
