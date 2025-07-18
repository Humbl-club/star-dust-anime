import { useRef, useCallback, useEffect } from 'react';

interface WorkerTask {
  id: string;
  type: string;
  data: any;
  options?: any;
}

interface WorkerResult {
  id: string;
  result: any;
  error?: string;
}

interface UseWebWorkerOptions {
  workerPath: string;
  fallbackFunction?: (task: WorkerTask) => Promise<any>;
}

export const useWebWorker = ({ workerPath, fallbackFunction }: UseWebWorkerOptions) => {
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>>(new Map());

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(new URL(workerPath, import.meta.url), {
          type: 'module'
        });

        workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
          const { id, result, error } = event.data;
          const task = tasksRef.current.get(id);

          if (task) {
            tasksRef.current.delete(id);
            if (error) {
              task.reject(new Error(error));
            } else {
              task.resolve(result);
            }
          }
        };

        workerRef.current.onerror = (error) => {
          console.warn('Worker error, falling back to main thread:', error);
          // Clear all pending tasks and reject them
          tasksRef.current.forEach(({ reject }) => {
            reject(new Error('Worker failed'));
          });
          tasksRef.current.clear();
        };
      } catch (error) {
        console.warn('Failed to create worker, falling back to main thread:', error);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      tasksRef.current.clear();
    };
  }, [workerPath]);

  const executeTask = useCallback(async (type: string, data: any, options?: any): Promise<any> => {
    const taskId = Math.random().toString(36).substr(2, 9);
    const task: WorkerTask = { id: taskId, type, data, options };

    // Try worker first
    if (workerRef.current) {
      return new Promise((resolve, reject) => {
        tasksRef.current.set(taskId, { resolve, reject });
        workerRef.current!.postMessage(task);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (tasksRef.current.has(taskId)) {
            tasksRef.current.delete(taskId);
            reject(new Error('Worker task timeout'));
          }
        }, 30000);
      });
    }

    // Fallback to main thread
    if (fallbackFunction) {
      return await fallbackFunction(task);
    }

    throw new Error('No worker available and no fallback function provided');
  }, [fallbackFunction]);

  const isWorkerSupported = useCallback(() => {
    return typeof Worker !== 'undefined' && workerRef.current !== null;
  }, []);

  return {
    executeTask,
    isWorkerSupported
  };
};