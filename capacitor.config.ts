import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7fc28aeda663475388771ca39b8ccf8c',
  appName: 'AniVault - Anime Discovery',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#0a0a0b'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0b',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0b'
    }
  }
};

export default config;