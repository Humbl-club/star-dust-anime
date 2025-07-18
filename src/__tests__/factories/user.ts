import type { User, Session } from '@supabase/supabase-js';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockSession = (userOverrides: Partial<User> = {}): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: createMockUser(userOverrides),
});

export const createMockProfile = (overrides: any = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  verification_status: 'verified',
  verification_required_until: null,
  ...overrides,
});