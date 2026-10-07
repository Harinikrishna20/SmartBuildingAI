import { BarChart3, Bell, Briefcase, Building2, FileText, House, LogOut, MapPinned, ShieldCheck, Wrench } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const residentItems = [
  { label: 'Dashboard', icon: House, to: '/resident' },
  { label: 'Utility Insights', icon: BarChart3, to: '/resident/utility-insights' },
  { label: 'Report Problem', icon: FileText, to: '/resident/report-problem' },
  { label: 'Nearby Services', icon: MapPinned, to: '/resident/nearby-services' },
  { label: 'My Requests', icon: Briefcase, to: '/resident/my-requests' },
  { label: 'Notifications', icon: Bell, to: '/resident/notifications' },
  { label: 'Profile', icon: Building2, to: '/resident/profile' },
  { label: 'Logout', icon: LogOut, to: '/' },
]

const providerItems = [
  { label: 'Dashboard', icon: House, to: '/provider' },
  { label: 'Nearby Requests', icon: MapPinned, to: '/provider/nearby-requests' },
  { label: 'My Jobs', icon: Briefcase, to: '/provider/my-jobs' },
  { label: 'Notifications', icon: Bell, to: '/provider/notifications' },
  { label: 'Profile', icon: ShieldCheck, to: '/provider/profile' },
  { label: 'Logout', icon: LogOut, to: '/' },
]

export default function Sidebar({ role, collapsed = false, onNavigate }) {
  const isProvider = role === 'provider' || role === 'serviceProvider'
  const items = isProvider ? providerItems : residentItems

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">
        <div className="brand-mark"><Wrench size={18} /></div>
        {!collapsed ? <div><strong>SmartBuilding</strong><small>AI</small></div> : null}
      </div>

      <nav className="sidebar__nav">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            onClick={() => onNavigate?.(label, to)}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            end={label === 'Dashboard'}
          >
            <Icon size={17} />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
