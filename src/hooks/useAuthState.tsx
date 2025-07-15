import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuthState() {
  // MOCK AUTHENTICATION FOR TESTING - BYPASS REAL AUTH
  const mockUser: User = {
    id: 'test-user-id-12345',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: { 
      full_name: 'Test User',
      username: 'TestMaster',
      avatar_url: null 
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    role: 'authenticated'
  };

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  // Always return authenticated state for testing
  return { 
    user: mockUser, 
    session: mockSession, 
    loading: false 
  };
}