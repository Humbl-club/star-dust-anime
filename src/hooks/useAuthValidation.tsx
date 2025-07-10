import { validatePassword, validateEmail } from '@/utils/authValidation';

export function useAuthValidation() {
  const validatePasswordStrength = (password: string) => {
    return validatePassword(password);
  };

  const validateEmailFormat = (email: string) => {
    return validateEmail(email);
  };

  return {
    validatePasswordStrength,
    validateEmailFormat
  };
}