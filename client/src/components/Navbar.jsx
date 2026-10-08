import { Bell, Menu, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ user, onMenuClick }) {
  const navigate = useNavigate()
  const isProvider = user?.role === 'provider' || user?.role === 'serviceProvider'

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="icon-btn mobile-only" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div className="brand-inline">
          <div className="brand-mark"><Sparkles size={16} /></div>
          <span>SmartBuilding AI</span>
        </div>
      </div>

      <div className="topbar__right">
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate(isProvider ? '/provider/notifications' : '/resident/notifications')}
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="user-chip">
          <div className="avatar">{user?.name?.split(' ')[0]?.[0] || user?.fullName?.split(' ')[0]?.[0] || 'U'}</div>
          <div>
            <strong>{user?.name || user?.fullName || 'User'}</strong>
            <small>{isProvider ? 'Service Provider' : 'Resident'}</small>
          </div>
        </div>
      </div>
    </header>
  )
}
