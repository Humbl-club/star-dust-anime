import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export const useNativeSetup = () => {
  useEffect(() => {
    const setupNative = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Configure status bar for iOS
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0b' });

        // Hide splash screen after app loads
        await SplashScreen.hide();
      } catch (error) {
        console.log('Native setup error:', error);
      }
    };

    setupNative();
  }, []);

  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };
};