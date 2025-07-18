import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { createMockSupabaseClient, mockUser, mockSession, createAuthError } from '../mocks/supabase';
import type { ReactNode } from 'react';

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('useAuth', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle successful signup', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password123');
      expect(response.error).toBeNull();
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining(window.location.origin),
      },
    });
  });

  it('should handle signup error', async () => {
    const authError = createAuthError('User already registered');
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signUp('test@example.com', 'password123');
      expect(response.error).toBe(authError);
    });
  });

  it('should handle successful signin', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password123');
      expect(response.error).toBeNull();
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle signin error', async () => {
    const authError = createAuthError('Invalid login credentials');
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: authError,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrongpassword');
      expect(response.error).toBe(authError);
    });
  });

  it('should handle Google signin', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://oauth.url' },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signInWithGoogle();
      expect(response.error).toBeNull();
    });

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining(window.location.origin),
      },
    });
  });

  it('should handle signout', async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signOut();
      expect(response.error).toBeNull();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should validate password strength', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const weakPassword = result.current.validatePasswordStrength('123');
    expect(weakPassword.isValid).toBe(false);
    expect(weakPassword.errors).toContain('Password must be at least 8 characters long');

    const strongPassword = result.current.validatePasswordStrength('SecurePassword123!');
    expect(strongPassword.isValid).toBe(true);
    expect(strongPassword.errors).toHaveLength(0);
  });

  it('should validate email format', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const invalidEmail = result.current.validateEmailFormat('invalid-email');
    expect(invalidEmail.isValid).toBe(false);

    const validEmail = result.current.validateEmailFormat('test@example.com');
    expect(validEmail.isValid).toBe(true);
  });
});