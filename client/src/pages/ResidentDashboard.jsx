import { Activity, AlertTriangle, Droplets, Gauge, Lightbulb, ShieldCheck, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertCard from '../components/AlertCard'
import HealthScore from '../components/HealthScore'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { dashboardApi, predictionApi, publicUtilityApi, requestApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import UtilityChart from '../components/UtilityChart'

const flowSteps = ['AI Prediction', 'Unusual Pattern', 'Resident Alert', 'Maintenance Request', 'AI Classification', 'Priority Score', 'Smart Provider Matching', 'Provider Accepts', 'Problem Resolved', 'Utility Monitoring Continues']

export default function ResidentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ water: '—', electricity: '—', requests: '—', health: '—' })
  const [waterPrediction, setWaterPrediction] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [requests, setRequests] = useState([])
  const [publicHistory, setPublicHistory] = useState({ water: null, electricity: null })
  const [investigationModal, setInvestigationModal] = useState(null)
  const [utilityType, setUtilityType] = useState('water')
  const [usageValue, setUsageValue] = useState('')
  const [savingReading, setSavingReading] = useState(false)
  const [readingMessage, setReadingMessage] = useState('')

  const fetchOverview = () => Promise.all([
      predictionApi.getWater().catch(() => null),
      predictionApi.getElectricity().catch(() => null),
      requestApi.getAll().catch(() => ({ requests: [] })),
      dashboardApi.getHealthScore().catch(() => null),
    ])

  const applyOverview = ([waterResult, electricityResult, requestsResult, healthResult]) => {
    const water = waterResult?.data
    const electricity = electricityResult?.data
    const requests = Array.isArray(requestsResult?.requests) ? requestsResult.requests : []
    const health = healthResult?.data
    setWaterPrediction(water)
    setHealthData(health)
    setRequests(requests)
    setStats({
      water: water?.has_data ? `${Math.round(water.current_usage)} L` : '—',
      electricity: electricity?.has_data ? `${Number(electricity.current_usage).toFixed(1)} kWh` : '—',
      requests: String(requests.filter((request) => request.status !== 'completed').length),
      health: health?.score == null ? '—' : `${health.score}/100`,
    })
  }

  useEffect(() => {
    let active = true
    fetchOverview().then((data) => {
      if (active) applyOverview(data)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    Promise.all([
      publicUtilityApi.getHistory('water').catch(() => null),
      publicUtilityApi.getHistory('electricity').catch(() => null),
    ]).then(([water, electricity]) => {
      setPublicHistory({ water: water?.data || null, electricity: electricity?.data || null })
    })
  }, [])

  const handleRecordReading = async (event) => {
    event.preventDefault()
    setSavingReading(true)
    setReadingMessage('')
    try {
      await predictionApi.recordReading({ utilityType, usageValue })
      applyOverview(await fetchOverview())
      setUsageValue('')
      setReadingMessage('Reading saved and overview updated.')
    } catch (error) {
      setReadingMessage(error.message || 'Unable to save this reading.')
    } finally {
      setSavingReading(false)
    }
  }

  const latestRequest = requests[0]
  const flowStage = latestRequest?.status === 'completed' ? 9
    : latestRequest?.status === 'in_progress' || latestRequest?.status === 'accepted' ? 7
      : latestRequest?.provider_id ? 6
        : latestRequest ? 5
          : waterPrediction?.has_prediction && waterPrediction.is_anomaly ? 2 : 0

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Welcome, {user?.name?.split(' ')[0] || 'Resident'}</h2>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Water Usage" value={stats.water} accent="teal" icon={Droplets} />
        <StatCard title="Electricity Usage" value={stats.electricity} accent="amber" icon={Zap} />
        <StatCard title="Active Requests" value={stats.requests} accent="blue" icon={Activity} />
        <StatCard title="Building Health" value={stats.health} accent="green" icon={ShieldCheck} />
      </div>

      <section className="public-utility-overview">
        <div className="page-header">
          <div>
            <p className="eyebrow">Historical public data</p>
            <h2>Utility trends</h2>
          </div>
          <p className="muted">Public history, not live readings from your home.</p>
        </div>
        <div className="two-column-grid">
          {['electricity', 'water'].map((type) => {
            const dataset = publicHistory[type]
            const records = dataset?.records || []
            const chartData = records.map((record) => ({
              date: new Date(record.usage_date).toLocaleDateString(),
              usage: record.usage_value,
            }))
            return (
              <div key={type}>
                {records.length ? (
                  <>
                    <UtilityChart
                      data={chartData}
                      title={`${type === 'water' ? 'Water' : 'Electricity'} history (${records[0].unit})`}
                      color={type === 'water' ? '#2fa58d' : '#f59e0b'}
                    />
                    <p className="field-hint">
                      {dataset.source.geographic_scope}; {records.length} {dataset.source.granularity} records.{' '}
                      <a href={dataset.source.url} target="_blank" rel="noreferrer">{dataset.source.name}</a>.{' '}
                      License: {dataset.source.license}.
                    </p>
                  </>
                ) : (
                  <div className="empty-state card-surface">
                    <h3>{type === 'water' ? 'Water' : 'Electricity'} history unavailable</h3>
                    <p>Public data has not been imported or the backend is unavailable.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="two-column-grid" aria-label="Historical utility investigations">
        <AlertCard
          title="Unusual Electricity Consumption"
          description="Unusual utility consumption detected in public historical analysis. High appliance usage or another electrical issue."
          normal="8–11 kWh/day"
          predicted="16.2 kWh/day"
          buttonText="Investigate"
          note="Public historical datasets are used for proof-of-concept utility analysis. The UCI electricity source represents a household in France."
          onAction={() => setInvestigationModal('electricity')}
        />
        <AlertCard
          title="Unusual Water Consumption"
          description="Unusual utility consumption detected in public historical analysis. May indicate leakage or unusually high usage."
          normal="500–600 L/day"
          predicted="850 L/day"
          buttonText="Investigate"
          note="Public historical datasets are used for proof-of-concept utility analysis. The NYC water source represents citywide/per-capita historical data."
          onAction={() => setInvestigationModal('water')}
        />
      </section>

      <Modal
        open={Boolean(investigationModal)}
        onClose={() => setInvestigationModal(null)}
        title="AI INSIGHT"
      >
        <div className="page-stack">
          <div className="alert-pill">
            <AlertTriangle size={16} />
            <span>
              {investigationModal === 'electricity' ? 'Electricity Consumption Anomaly' : 'Water Consumption Anomaly'}
            </span>
          </div>

          <div className="detail-list">
            <div>
              <span>What was detected:</span>
              <strong>Unusual utility consumption</strong>
            </div>
            <div>
              <span>Expected range:</span>
              <strong>{investigationModal === 'electricity' ? '8–11 kWh/day' : '500–600 L/day'}</strong>
            </div>
            <div>
              <span>Predicted/current value:</span>
              <strong>{investigationModal === 'electricity' ? '16.2 kWh/day' : '850 L/day'}</strong>
            </div>
            <div>
              <span>Possible explanation:</span>
              <p>
                {investigationModal === 'electricity'
                  ? 'High appliance usage or another electrical issue.'
                  : 'Possible leakage or unusually high usage. (Unusual water consumption may indicate leakage or unusually high usage.)'}
              </p>
            </div>
            <div>
              <span>Recommended action:</span>
              <p>
                {investigationModal === 'electricity'
                  ? 'Check high-consumption appliances and investigate the unusual usage.'
                  : 'Check fixtures and investigate the unusual usage.'}
              </p>
            </div>
          </div>

          <p className="field-hint">
            Public historical datasets are used for proof-of-concept utility analysis.{' '}
            {investigationModal === 'electricity'
              ? 'The UCI electricity source represents a household in France.'
              : 'The NYC water source represents citywide/per-capita historical data.'}{' '}
            This data does not describe live readings from your home.
          </p>

          <div className="inline-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                const util = investigationModal
                setInvestigationModal(null)
                navigate(`/resident/report-problem?utility=${util}`)
              }}
            >
              Report Problem
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                const util = investigationModal
                setInvestigationModal(null)
                navigate(`/resident/utility-insights?utility=${util}`)
              }}
            >
              View Analytics
            </button>
          </div>
        </div>
      </Modal>

      <form className="card-surface form-card" onSubmit={handleRecordReading}>
        <div className="section-head">
          <h3>Record utility reading</h3>
        </div>
        <div className="field-group">
          <label htmlFor="utility-type">Utility</label>
          <select id="utility-type" value={utilityType} onChange={(event) => setUtilityType(event.target.value)}>
            <option value="water">Water</option>
            <option value="electricity">Electricity</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="usage-value">Usage ({utilityType === 'water' ? 'L' : 'kWh'})</label>
          <input
            id="usage-value"
            type="number"
            min="0.01"
            step="any"
            value={usageValue}
            onChange={(event) => setUsageValue(event.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-btn" disabled={savingReading}>
          {savingReading ? 'Saving...' : 'Save Reading'}
        </button>
        {readingMessage ? <p className="field-hint" role="status">{readingMessage}</p> : null}
      </form>

      {waterPrediction?.has_prediction && waterPrediction.is_anomaly ? (
        <AlertCard
          title="Unusual Water Consumption"
          description={waterPrediction.explanation}
          normal={`${Math.round(waterPrediction.normal_min)}–${Math.round(waterPrediction.normal_max)} L/day`}
          predicted={`${Math.round(waterPrediction.predicted_usage)} L/day`}
          note="This is based on your recorded water readings. An unusual value may have several causes; it does not confirm a leak."
          onAction={() => navigate('/resident/utility-insights')}
        />
      ) : null}

      <div className="two-column-grid">
        <HealthScore data={healthData} />
        <div className="card-surface maintenance-loop">
          <div className="section-head">
            <h3>Smart Maintenance Loop</h3>
          </div>
          <div className="loop-flow">
            {flowSteps.map((step, index) => (
              <div key={step} className={`loop-step ${index < flowStage ? 'is-complete' : index === flowStage ? 'is-current' : 'is-pending'}`}>
                <span className="loop-step__marker">{index < flowStage ? '✓' : index + 1}</span>
                <span>{step}</span>
                {index < flowSteps.length - 1 ? <span className="loop-arrow" aria-hidden="true">↓</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface insight-panel">
        <div className="section-head">
          <h3>AI insight</h3>
        </div>
        <div className="insight-grid">
          <div>
            <Lightbulb size={18} />
            <p>{waterPrediction?.has_data ? waterPrediction.explanation : 'Water insights will appear after utility readings are recorded.'}</p>
          </div>
          <div>
            <Gauge size={18} />
            <p>{waterPrediction?.is_anomaly ? 'Review the pattern and submit a maintenance report if needed.' : 'Recorded utility readings are used to identify unusual patterns.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
