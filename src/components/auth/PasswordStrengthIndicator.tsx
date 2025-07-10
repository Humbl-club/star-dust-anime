import React from 'react';
import zxcvbn from 'zxcvbn';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className
}) => {
  if (!password) return null;

  const result = zxcvbn(password);
  const score = result.score; // 0-4 scale
  const feedback = result.feedback;

  const getStrengthLabel = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Weak';
    }
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'text-destructive';
      case 2:
        return 'text-yellow-500';
      case 3:
        return 'text-blue-500';
      case 4:
        return 'text-green-500';
      default:
        return 'text-destructive';
    }
  };

  const getProgressColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-destructive';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-destructive';
    }
  };

  const strengthPercentage = (score / 4) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn('text-sm font-medium', getStrengthColor(score))}>
          {getStrengthLabel(score)}
        </span>
      </div>
      
      <div className="relative">
        <Progress value={strengthPercentage} className="h-2" />
        <div 
          className={cn('absolute top-0 left-0 h-2 rounded-full transition-all', getProgressColor(score))}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {feedback.warning && (
        <p className="text-xs text-destructive">{feedback.warning}</p>
      )}
      
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="space-y-1">
          {feedback.suggestions.map((suggestion, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              💡 {suggestion}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;