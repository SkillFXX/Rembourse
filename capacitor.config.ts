import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rembourse.app',
  appName: 'Rembourse',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
