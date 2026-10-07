import { Activity, Droplets, Gauge, Lightbulb, ShieldCheck, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlertCard from '../components/AlertCard'
import HealthScore from '../components/HealthScore'
import StatCard from '../components/StatCard'
import { dashboardApi, predictionApi, requestApi } from '../services/api'
import { demoLabel } from '../services/mockData'

const flowSteps = ['AI Prediction', 'Unusual Pattern', 'Resident Alert', 'Maintenance Request', 'AI Classification', 'Priority Score', 'Smart Provider Matching', 'Provider Accepts', 'Problem Resolved', 'Utility Monitoring Continues']

const defaultStats = {
  water: '620 L',
  electricity: '9.4 kWh',
  requests: '2',
  health: '82/100',
}

export default function ResidentDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(defaultStats)

  useEffect(() => {
    Promise.all([
      predictionApi.getWater().catch(() => null),
      predictionApi.getElectricity().catch(() => null),
      requestApi.getAll().catch(() => ({ requests: [] })),
      dashboardApi.getNotifications().catch(() => ({ data: [] })),
    ])
      .then(([waterResult, electricityResult, requestsResult, notificationsResult]) => {
        const waterUsage = waterResult?.data?.current_usage ?? 620
        const electricityUsage = electricityResult?.data?.current_usage ?? 9.4
        const requestCount = Array.isArray(requestsResult?.requests) ? requestsResult.requests.length : 0
        const notificationCount = Array.isArray(notificationsResult?.data) ? notificationsResult.data.length : 0

        setStats({
          water: `${Math.round(waterUsage)} L`,
          electricity: `${Number(electricityUsage).toFixed(1)} kWh`,
          requests: String(Math.max(requestCount, 1)),
          health: `${Math.min(95, Math.max(70, 82 + notificationCount))}/100`,
        })
      })
      .catch(() => setStats(defaultStats))
  }, [])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Good morning, Harini 👋</h2>
        </div>
        <span className="demo-tag">{demoLabel}</span>
      </div>

      <div className="stats-grid">
        <StatCard title="Water Usage" value={stats.water} accent="teal" icon={Droplets} />
        <StatCard title="Electricity Usage" value={stats.electricity} accent="amber" icon={Zap} />
        <StatCard title="Active Requests" value={stats.requests} accent="blue" icon={Activity} />
        <StatCard title="Building Health" value={stats.health} accent="green" icon={ShieldCheck} />
      </div>

      <AlertCard
        title="Unusual Water Consumption"
        description="Your predicted water consumption is significantly higher than your usual pattern."
        normal="500–600 L/day"
        predicted="850 L/day"
        onAction={() => navigate('/resident/utility-insights')}
      />

      <div className="two-column-grid">
        <HealthScore score={82} />
        <div className="card-surface maintenance-loop">
          <div className="section-head">
            <h3>Smart Maintenance Loop</h3>
          </div>
          <div className="loop-flow">
            {flowSteps.map((step, index) => (
              <div key={step} className="loop-step">
                <span>{step}</span>
                {index < flowSteps.length - 1 ? <span className="loop-arrow">↓</span> : null}
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
            <p>Higher-than-usual water demand may indicate hidden leakage or abnormal appliance use.</p>
          </div>
          <div>
            <Gauge size={18} />
            <p>Recommended next step: review the pattern and submit a maintenance report if it continues.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
