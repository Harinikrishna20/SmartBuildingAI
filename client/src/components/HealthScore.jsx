export default function HealthScore({ score = 82 }) {
  const metrics = [
    { label: 'Water Efficiency', value: 72 },
    { label: 'Energy Efficiency', value: 88 },
    { label: 'Maintenance', value: 91 },
    { label: 'Anomaly Level', value: 76 },
  ]

  return (
    <div className="health-card card-surface">
      <div className="health-score-ring">
        <div className="health-score-ring__inner">
          <strong>{score}</strong>
          <span>/100</span>
        </div>
      </div>
      <div className="health-details">
        <h3>Smart Infrastructure Health</h3>
        <p className="muted">Demo/modelled scores for smart building monitoring.</p>
        <div className="metric-list">
          {metrics.map((metric) => (
            <div className="metric-row" key={metric.label}>
              <div className="metric-row__head">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
