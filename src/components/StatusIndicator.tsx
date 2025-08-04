import React from 'react';
import { Badge } from './ui/badge';
import { Sparkles, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'NEW' | 'FINALE_SOON' | 'ENDING_SOON';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'NEW':
        return {
          icon: Sparkles,
          label: 'NEW',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white animate-pulse',
        };
      case 'FINALE_SOON':
        return {
          icon: AlertTriangle,
          label: 'FINALE',
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600 text-white',
        };
      case 'ENDING_SOON':
        return {
          icon: Zap,
          label: 'ENDING',
          variant: 'destructive' as const,
          className: 'bg-orange-500 hover:bg-orange-600 text-white',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'text-xs font-semibold backdrop-blur-sm flex items-center gap-1',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};