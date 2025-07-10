import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; needsConfirmation?: boolean; message?: string; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any; message?: string }>;
  validatePasswordStrength: (password: string) => { isValid: boolean; score: number; errors: string[]; suggestions: string[] };
  validateEmailFormat: (email: string) => { isValid: boolean; errors: string[]; suggestions: string[] };
}

export interface AuthResponse {
  error: any;
  needsConfirmation?: boolean;
  message?: string;
  data?: any;
}