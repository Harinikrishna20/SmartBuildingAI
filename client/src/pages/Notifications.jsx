import { BellRing, CheckCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import { notifyNewAlerts } from '../services/localNotifications'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    dashboardApi.getNotifications()
      .then(async ({ data = [] }) => {
        setNotifications(data)
        try {
          await notifyNewAlerts(data)
        } catch (error) {
          console.error('Unable to schedule local notifications', error)
        }
      })
      .catch((error) => {
        console.error('Failed to load notifications', error)
        setNotifications([])
      })
  }, [])

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h2>Notifications</h2>
        </div>
      </div>

      <div className="notification-list">
        {notifications.map((note) => (
          <div key={note.id} className={`notification-item ${note.is_read ? 'is-read' : 'is-unread'}`}>
            <div className="notification-item__icon">
              {note.is_read ? <CheckCheck size={17} /> : <BellRing size={17} />}
            </div>
            <div>
              <strong>{note.notification_type || note.type || 'Alert'}</strong>
              <p>{note.title}</p>
              <small>{note.message}</small>
            </div>
            <span>{note.created_at ? new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
