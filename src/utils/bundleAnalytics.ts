import { getMemoryUsage } from './performance';

export interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  moduleCount: number;
  largestModules: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  memoryUsage: ReturnType<typeof getMemoryUsage>;
  loadTime: number;
}

export function getBundleMetrics(): BundleMetrics {
  const memoryUsage = getMemoryUsage();
  
  // Get performance navigation timing
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const loadTime = navigation ? navigation.loadEventEnd - navigation.navigationStart : 0;

  // Mock bundle analysis data - in production this would come from build tools
  const mockLargestModules = [
    { name: '@tanstack/react-query', size: 234567, percentage: 15.2 },
    { name: 'react-dom', size: 198432, percentage: 12.8 },
    { name: '@radix-ui/react-*', size: 156789, percentage: 10.1 },
    { name: 'framer-motion', size: 145632, percentage: 9.4 },
    { name: 'lucide-react', size: 123456, percentage: 8.0 },
    { name: 'tailwindcss', size: 98765, percentage: 6.4 },
    { name: '@supabase/supabase-js', size: 87654, percentage: 5.7 },
    { name: 'react-router-dom', size: 76543, percentage: 4.9 }
  ];

  const totalSize = mockLargestModules.reduce((sum, module) => sum + module.size, 0) + 500000; // Additional modules
  const gzippedSize = Math.round(totalSize * 0.3); // Approximate gzip compression

  return {
    totalSize,
    gzippedSize,
    moduleCount: 127, // Mock module count
    largestModules: mockLargestModules,
    memoryUsage,
    loadTime
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getBundleSizeRating(sizeInBytes: number): 'excellent' | 'good' | 'warning' | 'poor' {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB <= 1) return 'excellent';
  if (sizeInMB <= 2) return 'good';
  if (sizeInMB <= 4) return 'warning';
  return 'poor';
}