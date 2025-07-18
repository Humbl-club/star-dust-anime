import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { createMockSupabaseClient } from '../mocks/supabase';
import { createMockUser } from '../factories/user';

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
  }),
}));

describe('useEmailVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useEmailVerification());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isVerified).toBe(false);
    expect(result.current.verificationStatus).toBeNull();
  });

  it('should check verification status on mount', async () => {
    const verificationData = {
      is_verified: true,
      verification_status: 'verified',
      days_remaining: null,
      verification_expires_at: null,
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [verificationData],
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    expect(result.current.isVerified).toBe(true);
    expect(result.current.verificationStatus).toBe('verified');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_email_verification_status', {
      user_id_param: 'test-user-id',
    });
  });

  it('should handle pending verification status', async () => {
    const verificationData = {
      is_verified: false,
      verification_status: 'pending',
      days_remaining: 5,
      verification_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [verificationData],
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    expect(result.current.isVerified).toBe(false);
    expect(result.current.verificationStatus).toBe('pending');
    expect(result.current.daysRemaining).toBe(5);
    expect(result.current.showVerificationPrompt).toBe(true);
  });

  it('should handle expired verification status', async () => {
    const verificationData = {
      is_verified: false,
      verification_status: 'expired',
      days_remaining: -1,
      verification_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [verificationData],
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    expect(result.current.isVerified).toBe(false);
    expect(result.current.verificationStatus).toBe('expired');
    expect(result.current.showVerificationPrompt).toBe(true);
  });

  it('should verify email successfully', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ is_verified: false, verification_status: 'pending' }],
      error: null,
    });

    // Mock the verify function
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.verifyEmail();
    });

    expect(mockSupabase.rpc).toHaveBeenCalledWith('verify_user_email', {
      user_id_param: 'test-user-id',
    });
  });

  it('should resend verification email', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ is_verified: false, verification_status: 'pending' }],
      error: null,
    });

    // Mock the resend function
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { success: true, message: 'Verification email sent' },
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.resendVerification();
    });

    expect(result.current.isResending).toBe(false);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('resend_verification_email', {
      user_id_param: 'test-user-id',
    });
  });

  it('should handle resend verification rate limiting', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ is_verified: false, verification_status: 'pending' }],
      error: null,
    });

    // Mock rate limit error
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { error: 'Rate limit exceeded. Please wait before requesting another verification email.' },
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.resendVerification();
    });

    expect(result.current.isResending).toBe(false);
  });

  it('should check if user can use restricted features', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ is_verified: false, verification_status: 'pending' }],
      error: null,
    });

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    // Should allow basic features
    expect(result.current.canUseFeature('viewing')).toBe(true);
    expect(result.current.canUseFeature('basic_lists')).toBe(true);

    // Should restrict advanced features
    expect(result.current.canUseFeature('reviews')).toBe(false);
    expect(result.current.canUseFeature('comments')).toBe(false);
    expect(result.current.canUseFeature('social_features')).toBe(false);
  });

  it('should handle verification check errors', async () => {
    const error = new Error('Failed to check verification status');
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useEmailVerification());

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.isLoading).toBe(false);

    expect(consoleSpy).toHaveBeenCalledWith('Error checking verification status:', error);
    expect(result.current.verificationStatus).toBeNull();
    
    consoleSpy.mockRestore();
  });
});