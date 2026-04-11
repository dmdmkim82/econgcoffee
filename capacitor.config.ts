import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.skecoplant.ekcoffee',
  appName: '에콩커피',
  webDir: 'dist/frontend',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
  },
}

export default config
