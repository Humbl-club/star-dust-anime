import { useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export const useNativeSetup = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupNative = async () => {
      if (!Capacitor.isNativePlatform()) {
        setIsReady(true);
        return;
      }

      try {
        // Configure status bar for iOS
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0b' });

        // Hide splash screen after app loads
        await SplashScreen.hide();

        // Keyboard event listeners
        Keyboard.addListener('keyboardWillShow', () => {
          setKeyboardVisible(true);
        });

        Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardVisible(false);
        });

      } catch (error) {
        console.log('Native setup error:', error);
      }
      
      setIsReady(true);
    };

    setupNative();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform()) {
        Keyboard.removeAllListeners();
      }
    };
  }, []);

  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    keyboardVisible,
    isReady
  };
};