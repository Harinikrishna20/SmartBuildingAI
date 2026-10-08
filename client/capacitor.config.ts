import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.smartbuildingai.app',
  appName: 'SmartBuilding AI',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
}

export default config