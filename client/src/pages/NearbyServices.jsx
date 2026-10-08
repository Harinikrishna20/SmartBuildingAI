import { useEffect, useMemo, useState } from 'react'
import { MapPinned } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import ProviderCard from '../components/ProviderCard'
import { useAuth } from '../context/AuthContext'
import { providerApi, requestApi } from '../services/api'
import { getCurrentCoordinates } from '../services/location'

const filters = ['All', 'Electrician', 'Plumber', 'Appliance Repair', 'Carpenter', 'Cleaning']
const categoryFilters = {
  Plumbing: 'Plumber',
  'Water Leakage': 'Plumber',
  'Electrical Issue': 'Electrician',
  'Structural Damage': 'Carpenter',
}
const resolveFilter = (category) => categoryFilters[category] || (filters.includes(category) ? category : 'All')

export default function NearbyServices() {
  const { user } = useAuth()
  const routeLocation = useLocation()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState(resolveFilter(routeLocation.state?.category))
  const [providers, setProviders] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestingProviderId, setRequestingProviderId] = useState(null)
  const [demoSetup, setDemoSetup] = useState(null)
  const [demoSetupLoading, setDemoSetupLoading] = useState(false)

  const searchLatitude = routeLocation.state?.latitude ?? user?.latitude
  const searchLongitude = routeLocation.state?.longitude ?? user?.longitude
  const hasSearchCoordinates = searchLatitude != null && searchLongitude != null

  const loadNearbyProviders = async (latitude, longitude, category) => {
    setLoading(true)
    try {
      const response = await providerApi.getNearby({
        latitude,
        longitude,
        category: category === 'All' ? undefined : category,
        radius: 10,
      })
      const nextProviders = Array.isArray(response.providers) ? response.providers : []
      setProviders(nextProviders)
      setStatus(nextProviders.length ? 'Suitable providers found near your location.' : 'No suitable service providers found within 10 km.')
    } catch (error) {
      setStatus(error.message || 'Unable to load nearby providers. Please try again.')
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasSearchCoordinates) return undefined

    let active = true
    providerApi.getNearby({
      latitude: Number(searchLatitude),
      longitude: Number(searchLongitude),
      category: activeFilter === 'All' ? undefined : activeFilter,
      radius: 10,
    })
      .then((response) => {
        if (!active) return
        const nextProviders = Array.isArray(response.providers) ? response.providers : []
        setProviders(nextProviders)
        setStatus(nextProviders.length ? 'Suitable providers found near your location.' : 'No suitable service providers found within 10 km.')
      })
      .catch((error) => {
        if (!active) return
        setStatus(error.message || 'Unable to load nearby providers. Please try again.')
        setProviders([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [hasSearchCoordinates, searchLatitude, searchLongitude, activeFilter])

  const handleUseCurrentLocation = async () => {
    setStatus('Detecting location...')
    try {
      const coordinates = await getCurrentCoordinates()
      loadNearbyProviders(coordinates.latitude, coordinates.longitude, activeFilter)
    } catch (err) {
      console.warn('Geolocation unavailable, applying fallback coordinates:', err.message)
      const fallbackLat = 12.6827
      const fallbackLon = 77.7158
      loadNearbyProviders(fallbackLat, fallbackLon, activeFilter)
      setStatus('Using fallback location coordinates (12.6827, 77.7158).')
    }
  }

  const handlePrepareDemoProviders = async () => {
    const lat = hasSearchCoordinates ? Number(searchLatitude) : 12.6827
    const lon = hasSearchCoordinates ? Number(searchLongitude) : 77.7158
    setDemoSetupLoading(true)
    setStatus('')
    try {
      const { data } = await providerApi.setupDemoProviders({
        latitude: lat,
        longitude: lon,
      })
      setDemoSetup(data)
      await loadNearbyProviders(lat, lon, activeFilter)
    } catch (error) {
      setStatus(error.message || 'Unable to prepare demo providers.')
    } finally {
      setDemoSetupLoading(false)
    }
  }

  const handleProviderSelection = async (provider) => {
    const requestId = routeLocation.state?.requestId
    if (!requestId) {
      navigate('/resident/report-problem', { state: { preferredProvider: provider } })
      return
    }

    setRequestingProviderId(provider.id)
    try {
      await requestApi.assignProvider(requestId, provider.id)
      setStatus(`Request sent to ${provider.name}. You will be notified when they accept.`)
      navigate('/resident/my-requests', { replace: true })
    } catch (error) {
      setStatus(error.message || 'Unable to request this provider. Please try another.')
    } finally {
      setRequestingProviderId(null)
    }
  }

  const filteredProviders = useMemo(() => {
    if (activeFilter === 'All') return providers
    const filterNorm = activeFilter.toLowerCase().trim()
    return providers.filter((provider) => {
      const service = (provider.serviceCategory || provider.service_category || provider.service || '').toLowerCase().trim()
      if (service.includes(filterNorm) || filterNorm.includes(service)) return true
      if ((filterNorm.includes('plumb') || filterNorm === 'plumbing') && (service.includes('plumb') || service === 'plumbing')) return true
      if ((filterNorm.includes('electr') || filterNorm === 'electrical') && (service.includes('electr') || service === 'electrical')) return true
      return false
    })
  }, [activeFilter, providers])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Discovery</p>
          <h2>Nearby Service Providers</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={handleUseCurrentLocation}>
          <MapPinned size={16} /> 📍 Use My Current Location
        </button>
      </div>

      {status || !hasSearchCoordinates ? (
        <p className="field-hint">{status || 'Your location is used to find nearby maintenance service providers and calculate distance.'}</p>
      ) : null}

      <div className="filter-row">
        {filters.map((filter) => (
          <button type="button" key={filter} className={activeFilter === filter ? 'chip-btn active' : 'chip-btn'} onClick={() => setActiveFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>

      {!loading && hasSearchCoordinates && providers.length === 0 ? (
        <div className="empty-state card-surface">
          <h3>No registered providers in range</h3>
          <p>Demo providers are test accounts, not real businesses. Create them only for a demonstration.</p>
          <button type="button" className="secondary-btn" onClick={handlePrepareDemoProviders} disabled={demoSetupLoading}>
            {demoSetupLoading ? 'Preparing...' : 'Prepare Demo Providers'}
          </button>
        </div>
      ) : null}

      {demoSetup ? (
        <div className="card-surface empty-state">
          <h3>Demo provider accounts ready</h3>
          <p>{demoSetup.notice}</p>
          {demoSetup.provider_login.accounts.map((account) => (
            <p key={account.email}>{account.name}: {account.email}</p>
          ))}
          <p>Demo password: {demoSetup.provider_login.password}</p>
          <p>Use the provider accounts for testing only. Do not use these credentials in production.</p>
        </div>
      ) : null}

      {loading ? <p className="field-hint">Loading nearby providers...</p> : null}

      <div className="provider-grid">
        {filteredProviders.length ? filteredProviders.map((provider) => (
          <ProviderCard
            key={provider.id || provider.provider_id}
            provider={provider}
            onSelect={handleProviderSelection}
            disabled={requestingProviderId === provider.id}
          />
        )) : !loading ? <p className="field-hint">No suitable service providers found within 10 km.</p> : null}
      </div>
    </div>
  )
}
