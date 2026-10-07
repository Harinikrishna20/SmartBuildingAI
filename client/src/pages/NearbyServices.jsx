import { useState } from 'react'
import ProviderCard from '../components/ProviderCard'
import { nearbyProviders } from '../services/mockData'

const filters = ['All', 'Electrician', 'Plumber', 'Appliance Repair', 'Carpenter', 'Cleaning']

export default function NearbyServices() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredProviders = nearbyProviders.filter((provider) => {
    if (activeFilter === 'All') return true
    return provider.serviceCategory === activeFilter
  })

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Discovery</p>
          <h2>Nearby Service Providers</h2>
        </div>
        <span className="demo-tag">Sample/demo providers</span>
      </div>

      <div className="filter-row">
        {filters.map((filter) => (
          <button type="button" key={filter} className={activeFilter === filter ? 'chip-btn active' : 'chip-btn'} onClick={() => setActiveFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>

      <div className="provider-grid">
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onSelect={() => {}} />
        ))}
      </div>

      <div className="card-surface match-card">
        <div className="section-head">
          <h3>Why this provider?</h3>
        </div>
        <div className="match-score">
          <strong>94% Match</strong>
          <ul>
            <li>Correct service category</li>
            <li>Closest available provider</li>
            <li>Currently available</li>
            <li>Suitable workload</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
