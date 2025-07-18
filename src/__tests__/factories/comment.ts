import type { TitleComment } from '@/hooks/useComments';

export const createMockComment = (overrides: Partial<TitleComment> = {}): TitleComment => ({
  id: 'test-comment-id',
  title_id: 'test-title-id',
  user_id: 'test-user-id',
  content: 'This is a test comment',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  profiles: {
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  ...overrides,
});

export const createMockComments = (count: number = 3): TitleComment[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockComment({
      id: `test-comment-${i}`,
      content: `Test comment ${i + 1}`,
    })
  );
};