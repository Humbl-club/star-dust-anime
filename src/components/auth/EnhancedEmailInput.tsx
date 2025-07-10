import React, { useState, useEffect } from 'react';
import validator from 'validator';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedEmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showValidation?: boolean;
  className?: string;
}

const EnhancedEmailInput: React.FC<EnhancedEmailInputProps> = ({
  value,
  onChange,
  placeholder = "Email",
  showValidation = true,
  className
}) => {
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid' | 'warning'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setValidationState('idle');
      setValidationMessage('');
      return;
    }

    // Basic email format validation
    if (!validator.isEmail(value)) {
      setValidationState('invalid');
      setValidationMessage('Please enter a valid email address');
      return;
    }

    // Check for common typos in domain
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domain = value.split('@')[1]?.toLowerCase();
    
    if (domain) {
      // Check for typos like "gmial.com" instead of "gmail.com"
      const suggestions = commonDomains.filter(d => {
        const similarity = calculateSimilarity(domain, d);
        return similarity > 0.7 && similarity < 1;
      });

      if (suggestions.length > 0) {
        setValidationState('warning');
        setValidationMessage(`Did you mean ${suggestions[0]}?`);
        return;
      }
    }

    // All good
    setValidationState('valid');
    setValidationMessage('Email looks good!');
  }, [value]);

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getInputClassName = () => {
    switch (validationState) {
      case 'valid':
        return 'border-green-500 focus-visible:ring-green-500';
      case 'invalid':
        return 'border-destructive focus-visible:ring-destructive';
      case 'warning':
        return 'border-yellow-500 focus-visible:ring-yellow-500';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(className, getInputClassName())}
        />
        {showValidation && validationState !== 'idle' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {showValidation && validationMessage && validationState !== 'idle' && (
        <p className={cn(
          'text-xs',
          validationState === 'valid' && 'text-green-600',
          validationState === 'invalid' && 'text-destructive',
          validationState === 'warning' && 'text-yellow-600'
        )}>
          {validationMessage}
        </p>
      )}
    </div>
  );
};

export default EnhancedEmailInput;