import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    setPermission(Notification.permission);

    // Get existing subscription
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Generate VAPID keys - in production, these should be stored securely
      const vapidPublicKey = 'BJ5IJz8YjKWm8K9nJ5YZ5Z9XzK8n5J5Z5Z9XzK8n5J5Z5Z9XzK8n5J5Z5Z9XzK8n5J5Z5Z9XzK8n5J5Z'; // Demo key
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      setSubscription(sub);

      // Store subscription in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: sub.toJSON(),
          created_at: new Date().toISOString()
        });
      }

      return sub;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return true;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from('push_subscriptions').delete().eq('user_id', user.id);
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const showNotification = async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag,
        data: options.data
      } as any);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    isSubscribed: !!subscription
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}