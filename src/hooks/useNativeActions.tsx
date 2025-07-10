import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const useNativeActions = () => {
  const shareContent = async (title: string, text: string, url?: string) => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web share API
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        // Copy to clipboard as fallback
        await copyToClipboard(url || text);
      }
      return;
    }

    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share this anime'
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!Capacitor.isNativePlatform()) {
      await navigator.clipboard.writeText(text);
      return;
    }

    try {
      await Clipboard.write({ string: text });
    } catch (error) {
      console.log('Clipboard error:', error);
    }
  };

  const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const impactStyle = style === 'light' ? ImpactStyle.Light : 
                         style === 'medium' ? ImpactStyle.Medium : 
                         ImpactStyle.Heavy;
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.log('Haptics error:', error);
    }
  };

  // Alias methods for compatibility with new components
  const hapticFeedback = triggerHaptic;
  const nativeShare = async (options: { title: string; text: string; url: string }) => {
    await shareContent(options.title, options.text, options.url);
  };

  return {
    shareContent,
    copyToClipboard,
    triggerHaptic,
    hapticFeedback,
    nativeShare,
    isNative: Capacitor.isNativePlatform()
  };
};