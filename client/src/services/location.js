import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

const permissionError = 'Location permission was denied. Enable location access in settings or enter your location manually.'

const explainGeolocationError = (error) => {
  if (error?.code === 1 || /permission|denied/i.test(error?.message || '')) return permissionError
  if (error?.code === 3 || /timeout/i.test(error?.message || '')) return 'Location request timed out. Check that GPS is enabled and try again.'
  if (error?.code === 2 || /unavailable/i.test(error?.message || '')) return 'Your location is unavailable. Check GPS settings and try again.'
  return 'Unable to get your location. Check GPS settings and try again.'
}

export async function getCurrentCoordinates() {
  try {
    if (Capacitor.isNativePlatform()) {
      let permissions = await Geolocation.checkPermissions()
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        permissions = await Geolocation.requestPermissions()
      }
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        throw new Error(permissionError)
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
      return { latitude: position.coords.latitude, longitude: position.coords.longitude }
    }

    if (!navigator.geolocation) throw new Error('Location is not supported by this device or browser.')

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      })
    })
    return { latitude: position.coords.latitude, longitude: position.coords.longitude }
  } catch (error) {
    throw new Error(error.message === permissionError ? permissionError : explainGeolocationError(error))
  }
}