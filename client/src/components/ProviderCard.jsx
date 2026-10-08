export default function ProviderCard({ provider, onSelect, disabled = false }) {
  const serviceName = provider.serviceCategory || provider.service_category || provider.service || 'Service'
  const matchScore = provider.matchScore ?? provider.match_score ?? 0
  const distance = provider.distance ?? (provider.distance_km != null ? `${provider.distance_km} km away` : 'Distance unavailable')
  const availability = provider.availability ?? (provider.available ? 'Available' : 'Unavailable')

  return (
    <div className="provider-card card-surface">
      <div className="provider-card__top">
        <div>
          <h3>{provider.name}</h3>
          <p>{serviceName}</p>
          {provider.is_demo ? <span className="status-badge status-badge--neutral">DEMO · NOT A REAL BUSINESS</span> : null}
        </div>
        <span className="provider-card__score">{matchScore}% Match</span>
      </div>

      <ul className="provider-card__meta">
        <li>{distance}</li>
        <li>{availability}</li>
      </ul>

      <div className="provider-card__actions">
        <button type="button" className="primary-btn" onClick={() => onSelect?.(provider)} disabled={disabled}>
          {disabled ? 'Sending...' : 'Request Service'}
        </button>
      </div>
    </div>
  )
}
