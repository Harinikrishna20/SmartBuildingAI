import { Briefcase, CheckCheck, Gauge, MapPinned, Wrench } from 'lucide-react'
import StatCard from '../components/StatCard'

export default function ProviderDashboard() {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Provider overview</p>
          <h2>Service provider operations</h2>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Available Requests" value="12" accent="blue" icon={MapPinned} />
        <StatCard title="Accepted Jobs" value="4" accent="teal" icon={CheckCheck} />
        <StatCard title="In Progress" value="2" accent="amber" icon={Gauge} />
        <StatCard title="Completed" value="8" accent="green" icon={Briefcase} />
      </div>

      <div className="provider-stack">
        <div className="card-surface">
          <div className="section-head">
            <h3>Nearby priority requests</h3>
          </div>
          <ul className="bullet-list">
            <li>Water Leakage — 0.8 km — High — 87/100</li>
            <li>Plumbing — 1.1 km — High — 82/100</li>
            <li>Electrical Issue — 2.6 km — Critical — 96/100</li>
          </ul>
        </div>
        <div className="card-surface">
          <div className="section-head">
            <h3>Dispatch readiness</h3>
          </div>
          <div className="readiness-card">
            <Wrench size={20} />
            <span>Available for plumbing and appliance support in Colombo area</span>
          </div>
        </div>
      </div>
    </div>
  )
}
