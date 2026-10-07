export default function ProviderCard({ provider, onSelect }) {
  return (
    <div className="provider-card card-surface">
      <div className="provider-card__top">
        <div>
          <h3>{provider.name}</h3>
          <p>{provider.serviceCategory}</p>
        </div>
        <span className="provider-card__score">{provider.matchScore}% Match</span>
      </div>

      <ul className="provider-card__meta">
        <li>{provider.distance}</li>
        <li>{provider.availability}</li>
      </ul>

      <div className="provider-card__actions">
        <button type="button" className="primary-btn" onClick={() => onSelect(provider)}>
          View / Request
        </button>
      </div>
    </div>
  )
}
