import zxcvbn from 'zxcvbn';
import validator from 'validator';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Basic requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Use zxcvbn for advanced password strength checking
  const result = zxcvbn(password);
  
  // Minimum score requirement (3 out of 4)
  if (result.score < 2) {
    errors.push('Password is too weak. Please choose a stronger password.');
  }

  // Add zxcvbn suggestions
  if (result.feedback.suggestions) {
    suggestions.push(...result.feedback.suggestions);
  }

  if (result.feedback.warning) {
    suggestions.push(result.feedback.warning);
  }

  return {
    isValid: errors.length === 0 && result.score >= 2,
    score: result.score,
    errors,
    suggestions
  };
};

export const validateEmail = (email: string): EmailValidationResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, suggestions };
  }

  // Basic email validation
  if (!validator.isEmail(email)) {
    errors.push('Please enter a valid email address');
    return { isValid: false, errors, suggestions };
  }

  // Check email length
  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  // Check for common typos
  const domain = email.split('@')[1]?.toLowerCase();
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'live.com', 'msn.com'
  ];

  if (domain) {
    const suggestion = findClosestDomain(domain, commonDomains);
    if (suggestion && suggestion !== domain) {
      suggestions.push(`Did you mean ${email.split('@')[0]}@${suggestion}?`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

// Helper function to find closest domain match
const findClosestDomain = (domain: string, validDomains: string[]): string | null => {
  let minDistance = Infinity;
  let closestDomain = null;

  for (const validDomain of validDomains) {
    const distance = levenshteinDistance(domain, validDomain);
    if (distance < minDistance && distance <= 2) { // Allow up to 2 character differences
      minDistance = distance;
      closestDomain = validDomain;
    }
  }

  return closestDomain;
};

// Levenshtein distance algorithm
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