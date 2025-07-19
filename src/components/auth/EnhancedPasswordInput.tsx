import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import PasswordChecklist from 'react-password-checklist';

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
        <div className="text-sm">
          <PasswordChecklist
            rules={["minLength", "specialChar", "number", "capital", "lowercase"]}
            minLength={8}
            value={value}
            valueAgain={confirmPassword}
            messages={{
              minLength: "Has at least 8 characters",
              specialChar: "Has special characters (!@#$%^&*)",
              number: "Has a number",
              capital: "Has uppercase letters",
              lowercase: "Has lowercase letters",
              match: "Passwords match"
            }}
            className="password-checklist"
            style={{
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))',
            }}
            iconComponents={{
              ValidIcon: <span className="text-green-500">✓</span>,
              InvalidIcon: <span className="text-destructive">✗</span>
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedPasswordInput;