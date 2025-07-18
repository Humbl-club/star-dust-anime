import { vi } from 'vitest';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export const mockUser: User = {
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
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: mockUser, session: mockSession }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { user: mockUser, session: mockSession }, 
      error: null 
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ 
      data: { provider: 'google', url: 'https://oauth.url' }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    }),
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: mockUser }, 
      error: null 
    }),
    onAuthStateChange: vi.fn(() => ({
      data: { 
        subscription: { 
          unsubscribe: vi.fn() 
        } 
      }
    })),
    refreshSession: vi.fn().mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ 
      data: {}, 
      error: null 
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
    csv: vi.fn().mockResolvedValue({ data: '', error: null }),
    geojson: vi.fn().mockResolvedValue({ data: {}, error: null }),
    explain: vi.fn().mockResolvedValue({ data: '', error: null }),
  })),
  rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      move: vi.fn().mockResolvedValue({ data: {}, error: null }),
      copy: vi.fn().mockResolvedValue({ data: {}, error: null }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url' }, error: null }),
      createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://public.url' } })),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
  removeAllChannels: vi.fn(),
  getChannels: vi.fn(() => []),
});

export const mockAuthError = {
  name: 'AuthError',
  message: 'Test auth error',
  code: 'test_error',
  status: 400,
} as AuthError;

export const createAuthError = (message: string) => ({
  name: 'AuthError',
  message,
  code: 'test_error',
  status: 400,
} as AuthError);