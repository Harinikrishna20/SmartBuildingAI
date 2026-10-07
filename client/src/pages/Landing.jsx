import { ArrowRight, Building2, Gauge, MapPinned, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

const featureList = [
  { icon: Gauge, title: 'AI Utility Prediction', text: 'Predict electricity and water consumption.' },
  { icon: ShieldCheck, title: 'Smart Anomaly Detection', text: 'Identify unusual consumption patterns.' },
  { icon: Wrench, title: 'Intelligent Maintenance', text: 'Automatically classify and prioritise reported problems.' },
  { icon: MapPinned, title: 'Nearby Service Matching', text: 'Connect residents with suitable nearby service providers.' },
]

const processSteps = ['Predict', 'Detect', 'Alert', 'Report', 'Match', 'Resolve']

const impactCards = [
  'Reduced response time',
  'Early issue awareness',
  'Better utility monitoring',
  'Smarter maintenance',
]

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="scene-decor" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <header className="landing-header">
        <div className="container nav-row">
          <div className="brand-inline">
            <div className="brand-mark"><Sparkles size={16} /></div>
            <span>SmartBuilding AI</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="ghost-btn">Login</Link>
            <Link to="/register" className="primary-btn">Get Started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero__content">
            <span className="eyebrow hero__eyebrow">AI-powered smart infrastructure</span>
            <h1>Predict. Detect. Connect. Resolve.</h1>
            <p>
              AI-powered smart infrastructure for smarter utility management and faster household maintenance.
            </p>

            <div className="hero__actions">
              <Link to="/register" className="primary-btn">Get Started</Link>
              <a href="#how-it-works" className="secondary-btn">Explore How It Works</a>
            </div>

            <div className="hero__stats">
              <div className="stats-chip">
                <span className="stats-dot" />
                24/7 anomaly monitoring
              </div>
              <div className="stats-chip muted">3.4x faster issue response</div>
            </div>

            <div className="hero__meta">
              <div className="mini-trust">
                <span className="trust-pill">Live</span>
                1.8k properties monitored
              </div>
              <div className="signal-grid">
                <div>
                  <span>Energy</span>
                  <strong>+31%</strong>
                </div>
                <div>
                  <span>Risk</span>
                  <strong>Low</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="hero__visual card-surface">
            <div className="dashboard-preview">
              <div className="dashboard-preview__head">
                <div className="dot-group">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>AI Operations</strong>
              </div>

              <div className="dashboard-hero-card">
                <div>
                  <span>System health</span>
                  <strong>Excellent</strong>
                </div>
                <div className="ring-wrap">
                  <div className="ring-ring" />
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="mini-panel mini-panel--alert">
                  <span>Unusual Water Usage</span>
                  <strong>850 L/day</strong>
                </div>
                <div className="mini-panel">
                  <span>Building Health</span>
                  <strong>82/100</strong>
                </div>
                <div className="mini-panel mini-panel--wide">
                  <span>Utility Trend</span>
                  <div className="mini-bars">
                    <i style={{ height: '45%' }} />
                    <i style={{ height: '60%' }} />
                    <i style={{ height: '58%' }} />
                    <i style={{ height: '85%' }} />
                    <i style={{ height: '100%' }} />
                    <i style={{ height: '72%' }} />
                  </div>
                </div>
                <div className="mini-panel mini-panel--success">
                  <span>Maintenance</span>
                  <strong>Plumber matched</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="section-head center-head">
            <span className="eyebrow">Capabilities</span>
            <h2>Built for proactive building care</h2>
          </div>
          <div className="feature-grid">
            {featureList.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature-card card-surface">
                <div className="feature-icon"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="section container">
          <div className="section-head center-head">
            <span className="eyebrow">Workflow</span>
            <h2>How it works</h2>
          </div>
          <div className="flow-list">
            {processSteps.map((step, index) => (
              <div key={step} className="flow-step">
                <span className="flow-step__index">{index + 1}</span>
                <strong>{step}</strong>
                {index < processSteps.length - 1 ? <ArrowRight size={15} /> : null}
              </div>
            ))}
          </div>
          <div className="flow-caption">
            <div><p>AI analyses consumption patterns.</p></div>
            <div><p>Unusual usage patterns are identified.</p></div>
            <div><p>Resident receives an intelligent alert.</p></div>
            <div><p>Resident reports the problem.</p></div>
            <div><p>Nearby suitable service providers are found.</p></div>
            <div><p>Provider accepts and completes the job.</p></div>
          </div>
        </section>

        <section className="section container">
          <div className="section-head center-head">
            <span className="eyebrow">Impact</span>
            <h2>Smarter building operations</h2>
          </div>
          <div className="impact-grid">
            {impactCards.map((label) => (
              <div className="impact-card card-surface" key={label}>
                <Building2 size={20} />
                <h3>{label}</h3>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
