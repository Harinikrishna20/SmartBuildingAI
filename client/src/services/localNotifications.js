import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const CHANNEL_ID = 'smartbuilding-alerts'
const SEEN_NOTIFICATIONS_KEY = 'smartbuilding-local-notifications-seen'

const toNotificationId = (value) => {
  const id = Number(value)
  if (Number.isSafeInteger(id) && id > 0) return id
  return Array.from(String(value)).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 1) || 1
}

export async function notifyNewAlerts(items) {
  if (!Capacitor.isNativePlatform()) return

  const unread = items.filter((item) => !item.is_read)
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) || '[]'))
  const fresh = unread.filter((item) => !seen.has(String(item.id)))
  if (!fresh.length) return

  let permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'SmartBuilding alerts',
      description: 'Maintenance and utility alerts',
      importance: 4,
    })
  }

  await LocalNotifications.schedule({
    notifications: fresh.map((item) => ({
      id: toNotificationId(item.id),
      title: item.title,
      body: item.message,
      schedule: { at: new Date(Date.now() + 500) },
      channelId: CHANNEL_ID,
      extra: { notificationId: item.id },
    })),
  })

  fresh.forEach((item) => seen.add(String(item.id)))
  localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...seen]))
}