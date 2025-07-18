import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

interface EnhancedPasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  showChecklist?: boolean;
  confirmPassword?: string;
  className?: string;
}

const EnhancedPasswordInput: React.FC<EnhancedPasswordInputProps> = ({
  value,
  onChange,
  placeholder = "Password",
  showStrength = true,
  showChecklist = true,
  confirmPassword,
  className
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {showStrength && value && (
        <PasswordStrengthIndicator password={value} />
      )}

      {showChecklist && value && (
        <div className="text-sm space-y-1">
          <PasswordChecklistItem 
            isValid={value.length >= 8}
            text="Has at least 8 characters"
          />
          <PasswordChecklistItem 
            isValid={/[!@#$%^&*(),.?":{}|<>]/.test(value)}
            text="Has special characters (!@#$%^&*)"
          />
          <PasswordChecklistItem 
            isValid={/\d/.test(value)}
            text="Has a number"
          />
          <PasswordChecklistItem 
            isValid={/[A-Z]/.test(value)}
            text="Has uppercase letters"
          />
          <PasswordChecklistItem 
            isValid={/[a-z]/.test(value)}
            text="Has lowercase letters"
          />
          {confirmPassword && (
            <PasswordChecklistItem 
              isValid={value === confirmPassword && value.length > 0}
              text="Passwords match"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Custom PasswordChecklistItem component to replace react-password-checklist
const PasswordChecklistItem: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    {isValid ? (
      <Check className="w-3 h-3 text-green-500" />
    ) : (
      <X className="w-3 h-3 text-destructive" />
    )}
    <span className={isValid ? "text-green-500" : "text-muted-foreground"}>
      {text}
    </span>
  </div>
);

export default EnhancedPasswordInput;