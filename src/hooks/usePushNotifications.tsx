import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pwaAnalytics } from '@/lib/analytics/pwaAnalytics';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        checkExistingSubscription();
      }
    };

    const checkExistingSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setIsSubscribed(true);
          setSubscription({
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
            }
          });
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    pwaAnalytics.trackPushPermissionRequest();

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      pwaAnalytics.trackPushPermissionResult(result === 'granted');
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      pwaAnalytics.trackPushPermissionResult(false);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get the VAPID public key from your environment or backend
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      setSubscription(subscriptionData);
      setIsSubscribed(true);

      // Save subscription to backend
      await saveSubscriptionToBackend(subscriptionData);

      pwaAnalytics.trackPushSubscription(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      pwaAnalytics.trackPushSubscription(false);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported || !isSubscribed) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        await removeSubscriptionFromBackend();
        
        setIsSubscribed(false);
        setSubscription(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const saveSubscriptionToBackend = async (subscription: PushSubscription): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('save-push-subscription', {
        body: {
          userId: user.id,
          subscription
        }
      });
    } catch (error) {
      console.error('Error saving subscription to backend:', error);
    }
  };

  const removeSubscriptionFromBackend = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.functions.invoke('remove-push-subscription', {
        body: {
          userId: user.id
        }
      });
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  };
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
}