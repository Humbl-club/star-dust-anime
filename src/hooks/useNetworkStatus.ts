import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  timestamp: number;
  retries: number;
}

/**
 * Network status monitoring hook
 * Detects online/offline transitions and provides request queuing
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    wasOffline: false
  });
  
  const [requestQueue, setRequestQueue] = useState<QueuedRequest[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => {
        if (prev.wasOffline) {
          toast.success('Connection restored');
          // Process queued requests
          processQueuedRequests();
        }
        return {
          isOnline: true,
          wasOffline: prev.wasOffline
        };
      });
    };

    const handleOffline = () => {
      setNetworkStatus({
        isOnline: false,
        wasOffline: true
      });
      toast.error('Connection lost - requests will be queued for retry');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processQueuedRequests = async () => {
    if (requestQueue.length === 0) return;

    toast.info(`Processing ${requestQueue.length} queued requests...`);
    
    for (const request of requestQueue) {
      try {
        await request.fn();
        // Remove successful request from queue
        setRequestQueue(prev => prev.filter(r => r.id !== request.id));
      } catch (error) {
        // Increment retry count
        setRequestQueue(prev => 
          prev.map(r => 
            r.id === request.id 
              ? { ...r, retries: r.retries + 1 }
              : r
          )
        );
        
        // Remove request if max retries exceeded
        if (request.retries >= 3) {
          setRequestQueue(prev => prev.filter(r => r.id !== request.id));
          toast.error(`Failed to process queued request after 3 attempts`);
        }
      }
    }
  };

  const queueRequest = (requestFn: () => Promise<any>) => {
    if (networkStatus.isOnline) {
      // Execute immediately if online
      return requestFn();
    }

    // Queue for later if offline
    const queuedRequest: QueuedRequest = {
      id: crypto.randomUUID(),
      fn: requestFn,
      timestamp: Date.now(),
      retries: 0
    };

    setRequestQueue(prev => [...prev, queuedRequest]);
    toast.info('Request queued for when connection is restored');
    
    return Promise.reject(new Error('Offline - request queued'));
  };

  const clearQueue = () => {
    setRequestQueue([]);
  };

  return {
    isOnline: networkStatus.isOnline,
    wasOffline: networkStatus.wasOffline,
    queuedRequestsCount: requestQueue.length,
    queueRequest,
    clearQueue
  };
};