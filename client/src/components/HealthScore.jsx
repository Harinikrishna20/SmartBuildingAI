export default function HealthScore({ data }) {
  const metrics = [
    { label: 'Electricity', value: data?.electricity_status || 'Needs readings' },
    { label: 'Water', value: data?.water_status || 'Needs readings' },
    { label: 'Maintenance', value: data?.maintenance_status || 'No status data' },
  ]

  return (
    <div className="health-card card-surface">
      <div className="health-score-ring">
        <div className="health-score-ring__inner">
          <strong>{data?.score ?? '—'}</strong>
          <span>/100</span>
        </div>
      </div>
      <div className="health-details">
        <h3>AI-assisted building health indicator</h3>
        <p className="muted">{data?.message || 'Status is based on recorded readings and requests, not a scientific certification.'}</p>
        <div className="metric-list">
          {metrics.map((metric) => (
            <div className="metric-row" key={metric.label}>
              <div className="metric-row__head">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
