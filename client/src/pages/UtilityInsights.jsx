import { useState } from 'react'
import { ArrowRight, Droplets, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PredictionCard from '../components/PredictionCard'
import UtilityChart from '../components/UtilityChart'
import { electricityHistory, electricityPrediction, waterHistory, waterPrediction } from '../services/mockData'

export default function UtilityInsights() {
  const [tab, setTab] = useState('water')
  const navigate = useNavigate()

  const waterData = waterHistory.map((item) => ({
    date: item.date.split(' ')[0],
    usage: item.usage,
    predicted: 610,
  }))

  const electricityData = electricityHistory.map((item) => ({
    date: item.date,
    usage: item.usage,
    predicted: 10,
  }))

  const activeData = tab === 'water' ? waterData : electricityData

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

      {tab === 'water' ? (
        <>
          <div className="stats-grid stats-grid--compact">
            <PredictionCard title="Water status" current="850 L/day" average="610 L/day" predicted="850 L/day" normalRange="500–600 L/day" status="High anomaly" />
          </div>
          <UtilityChart data={waterData} title="Actual Consumption vs Predicted Consumption" normalMin={500} normalMax={600} color="#2fa58d" />

          <div className="card-surface reason-card">
            <div className="section-head">
              <h3>Why did AI generate this alert?</h3>
            </div>
            <ul className="bullet-list">
              {waterPrediction.explanation.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <button type="button" className="primary-btn" onClick={() => navigate('/resident/report-problem')}>
              Report a Problem
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid stats-grid--compact">
            <PredictionCard title="Electricity status" current="16.2 kWh/day" average="9.8 kWh/day" predicted="16.2 kWh/day" normalRange="8–11 kWh/day" status="Warning" />
          </div>
          <UtilityChart data={electricityData} title="Actual vs Predicted Electricity Usage" normalMin={8} normalMax={11} color="#f59e0b" />

          <div className="card-surface reason-card">
            <div className="section-head">
              <h3>AI Alert</h3>
            </div>
            <p className="alert-highlight">{electricityPrediction.status}</p>
            <p>{electricityPrediction.recommendation}</p>
          </div>
        </>
      )}
    </div>
  )
}
