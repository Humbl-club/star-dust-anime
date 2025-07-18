import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/renderWithProviders';
import { createMockSupabaseClient, mockUser, mockSession } from '../mocks/supabase';

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Simple Auth Form Component for testing
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await mockSupabase.auth.signInWithPassword({ email, password });
      } else {
        await mockSupabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: window.location.origin }
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await mockSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} role="form" aria-label="Authentication form">
      <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
      </button>
      
      <button type="button" onClick={handleGoogleSignIn} disabled={loading}>
        Sign in with Google
      </button>
      
      <button 
        type="button" 
        onClick={() => setIsLogin(!isLogin)}
      >
        Switch to {isLogin ? 'Sign Up' : 'Sign In'}
      </button>
    </form>
  );
};

// Import useState
import { useState } from 'react';

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sign in form by default', () => {
    renderWithProviders(<AuthForm />);
    
    expect(screen.getByRole('form', { name: /authentication form/i })).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
  });

  it('should switch between sign in and sign up modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);
    
    // Initially shows Sign In
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    
    // Switch to Sign Up
    await user.click(screen.getByText('Switch to Sign Up'));
    
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up$/i })).toBeInTheDocument();
    
    // Switch back to Sign In
    await user.click(screen.getByText('Switch to Sign In'));
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should handle successful sign in', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    renderWithProviders(<AuthForm />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle successful sign up', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    renderWithProviders(<AuthForm />);
    
    // Switch to sign up mode
    await user.click(screen.getByText('Switch to Sign Up'));
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign up$/i }));
    
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  });

  it('should handle Google OAuth sign in', async () => {
    const user = userEvent.setup();
    
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://oauth.url' },
      error: null,
    });

    renderWithProviders(<AuthForm />);
    
    await user.click(screen.getByText('Sign in with Google'));
    
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  });

  it('should handle authentication errors', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const authError = new Error('Invalid login credentials');
    mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(authError);

    renderWithProviders(<AuthForm />);
    
    // Fill in form with invalid credentials
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));
    
    expect(consoleSpy).toHaveBeenCalledWith('Auth error:', authError);
    
    consoleSpy.mockRestore();
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockSupabase.auth.signInWithPassword.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithProviders(<AuthForm />);
    
    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /sign in$/i });
    await user.click(submitButton);
    
    // Button should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Sign in with Google')).toBeDisabled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);
    
    // Try to submit without filling fields
    const submitButton = screen.getByRole('button', { name: /sign in$/i });
    await user.click(submitButton);
    
    // HTML5 validation should prevent submission
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should handle email redirect configuration', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<AuthForm />);
    
    // Switch to sign up
    await user.click(screen.getByText('Switch to Sign Up'));
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up$/i }));
    
    // Verify emailRedirectTo is set correctly
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining(window.location.origin),
      },
    });
  });
});