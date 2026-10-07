import { BarChart3, Bell, Briefcase, Building2, FileText, House, MapPinned, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const residentItems = [
  { label: 'Home', icon: House, to: '/resident' },
  { label: 'Insights', icon: BarChart3, to: '/resident/utility-insights' },
  { label: 'Report', icon: FileText, to: '/resident/report-problem' },
  { label: 'Jobs', icon: Briefcase, to: '/resident/my-requests' },
  { label: 'Alerts', icon: Bell, to: '/resident/notifications' },
  { label: 'Profile', icon: Building2, to: '/resident/profile' },
]

const providerItems = [
  { label: 'Home', icon: House, to: '/provider' },
  { label: 'Requests', icon: MapPinned, to: '/provider/nearby-requests' },
  { label: 'Jobs', icon: Briefcase, to: '/provider/my-jobs' },
  { label: 'Alerts', icon: Bell, to: '/provider/notifications' },
  { label: 'Profile', icon: ShieldCheck, to: '/provider/profile' },
]

export default function MobileNavigation({ role = 'resident' }) {
  const items = role === 'provider' || role === 'serviceProvider' ? providerItems : residentItems

  return (
    <nav className="mobile-nav">
      {items.map(({ label, icon: Icon, to }) => (
        <NavLink key={label} to={to} className="mobile-nav__item">
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
