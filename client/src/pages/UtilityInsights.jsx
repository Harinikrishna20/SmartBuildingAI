import { useEffect, useState } from 'react'
import { ArrowRight, Droplets, Zap } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PredictionCard from '../components/PredictionCard'
import UtilityChart from '../components/UtilityChart'
import { predictionApi, publicUtilityApi } from '../services/api'

export default function UtilityInsights() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(() => searchParams.get('utility') === 'electricity' ? 'electricity' : 'water')
  const [predictions, setPredictions] = useState({ water: null, electricity: null })
  const [publicData, setPublicData] = useState({ water: null, electricity: null })
  const [investigation, setInvestigation] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      predictionApi.getWater().catch(() => null),
      predictionApi.getElectricity().catch(() => null),
      publicUtilityApi.getHistory('water').catch(() => null),
      publicUtilityApi.getHistory('electricity').catch(() => null),
      publicUtilityApi.investigateHistory('water').catch(() => null),
      publicUtilityApi.investigateHistory('electricity').catch(() => null),
    ]).then(([water, electricity, publicWater, publicElectricity, waterInvestigation, electricityInvestigation]) => {
      setPredictions({ water: water?.data || null, electricity: electricity?.data || null })
      setPublicData({ water: publicWater?.data || null, electricity: publicElectricity?.data || null })
      setInvestigation({ water: waterInvestigation?.data || null, electricity: electricityInvestigation?.data || null })
    })
  }, [])

  const prediction = predictions[tab]
  const unit = tab === 'water' ? 'L' : 'kWh'
  const chartData = prediction?.history || []
  const publicHistory = publicData[tab]
  const publicInvestigation = investigation?.[tab]
  const publicRecords = publicHistory?.records || []
  const publicChartData = publicRecords.map((record) => ({
    date: new Date(record.usage_date).toLocaleDateString(),
    usage: record.usage_value,
  }))

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Utility Insights</h2>
        </div>
      </div>

      <div className="tab-bar">
        <button type="button" className={tab === 'water' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('water')}>
          <Droplets size={16} /> Water
        </button>
        <button type="button" className={tab === 'electricity' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('electricity')}>
          <Zap size={16} /> Electricity
        </button>
      </div>

      {publicInvestigation ? (
        <section className="card-surface reason-card">
          <div className="section-head">
            <h3>AI INSIGHT · {publicInvestigation.title}</h3>
            <span className={`status-badge ${publicInvestigation.historical_anomaly ? 'status-badge--warning' : 'status-badge--success'}`}>
              {publicInvestigation.historical_anomaly?.severity || 'Anomaly'}
            </span>
          </div>
          <div className="detail-list" style={{ margin: '1rem 0' }}>
            <div>
              <span>What was detected:</span>
              <strong>{publicInvestigation.detected || 'Unusual utility consumption'}</strong>
            </div>
            <div>
              <span>Expected range:</span>
              <strong>{publicInvestigation.expected_range || (tab === 'water' ? '500–600 L/day' : '8–11 kWh/day')}</strong>
            </div>
            <div>
              <span>Predicted/current value:</span>
              <strong>{publicInvestigation.predicted_value || (tab === 'water' ? '850 L/day' : '16.2 kWh/day')}</strong>
            </div>
            <div>
              <span>Possible explanation:</span>
              <p>{publicInvestigation.explanation}</p>
            </div>
            <div>
              <span>Recommended action:</span>
              <p>{publicInvestigation.recommendation}</p>
            </div>
          </div>
          <p className="field-hint">
            Public historical datasets are used for proof-of-concept utility analysis.{' '}
            {tab === 'water'
              ? 'The NYC water source represents citywide/per-capita historical data.'
              : 'The UCI electricity source represents a household in France.'}{' '}
            This data does not describe live readings from your home.
          </p>
          <button type="button" className="primary-btn" onClick={() => navigate(`/resident/report-problem?utility=${tab}`)}>
            Report Problem
            <ArrowRight size={16} />
          </button>
        </section>
      ) : null}

      {prediction?.has_data ? (
        <>
          {prediction.has_prediction ? (
            <div className="stats-grid stats-grid--compact">
              <PredictionCard
                title={`${tab === 'water' ? 'Water' : 'Electricity'} status`}
                current={`${prediction.current_usage} ${unit}/day`}
                average={`${prediction.average_usage} ${unit}/day`}
                predicted={`${prediction.predicted_usage} ${unit}/day`}
                normalRange={`${prediction.normal_min}–${prediction.normal_max} ${unit}/day`}
                status={prediction.is_anomaly ? 'Anomaly' : 'Normal'}
              />
            </div>
          ) : (
            <div className="empty-state card-surface">
              <h3>Personal baseline not ready</h3>
              <p>{prediction.explanation} Recorded values remain visible below.</p>
            </div>
          )}
          <UtilityChart
            data={chartData.map((item) => ({ ...item, date: new Date(item.date).toLocaleDateString() }))}
            title={`Recorded ${tab} consumption`}
            normalMin={prediction.normal_min}
            normalMax={prediction.normal_max}
            color={tab === 'water' ? '#2fa58d' : '#f59e0b'}
          />
          {prediction.has_prediction && prediction.is_anomaly ? (
          <div className="card-surface reason-card">
            <div className="section-head">
              <h3>Consumption alert</h3>
            </div>
            <p>{prediction.explanation}</p>
            <button type="button" className="primary-btn" onClick={() => navigate('/resident/report-problem')}>
              Report a Problem
              <ArrowRight size={16} />
            </button>
          </div>
          ) : null}
        </>
      ) : (
        <div className="empty-state card-surface">
          <h3>No {tab} readings yet</h3>
          <p>Insights will appear after utility readings are recorded for your account.</p>
        </div>
      )}

      <section className="page-stack public-history-section">
        <div className="page-header">
          <div>
            <p className="eyebrow">Historical public data</p>
            <h2>{tab === 'water' ? 'City water consumption' : 'Household electricity consumption'}</h2>
          </div>
        </div>
        {publicRecords.length ? (
          <>
            <UtilityChart
              data={publicChartData}
              title={`Historical ${tab} consumption (${publicRecords[0].unit})`}
              color={tab === 'water' ? '#2fa58d' : '#f59e0b'}
            />
            <p className="field-hint">
              {publicHistory.classification}; this is not live smart-meter data. Scope: {publicHistory.source.geographic_scope}.
              {' '}License: {publicHistory.source.license}. Source: <a href={publicHistory.source.url} target="_blank" rel="noreferrer">{publicHistory.source.name}</a>.
            </p>
          </>
        ) : (
          <div className="empty-state card-surface">
            <h3>Public history has not been imported</h3>
            <p>Import the attributed public datasets from the backend before displaying historical trends.</p>
          </div>
        )}
      </section>
    </div>
  )
}
