import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComments } from '@/hooks/useComments';
import { createMockSupabaseClient } from '../mocks/supabase';
import { createMockComment, createMockComments } from '../factories/comment';
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

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input),
  },
}));

// Mock bad-words
vi.mock('bad-words', () => ({
  default: class Filter {
    clean(text: string) {
      return text.replace(/badword/gi, '***');
    }
  },
}));

describe('useComments', () => {
  const titleId = 'test-title-id';
  const mockComments = createMockComments(3);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: mockComments,
      error: null,
    });
  });

  it('should fetch comments on mount', async () => {
    const { result } = renderHook(() => useComments(titleId));

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    expect(result.current.comments).toEqual(mockComments);
    expect(mockSupabase.from).toHaveBeenCalledWith('title_comments');
  });

  it('should handle fetch comments error', async () => {
    const error = new Error('Failed to fetch comments');
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: null,
      error,
    });

    const { result } = renderHook(() => useComments(titleId));

    // Wait for async hook to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    expect(result.current.comments).toEqual([]);
  });

  it('should add a comment successfully', async () => {
    const newComment = createMockComment({ content: 'New test comment' });
    
    mockSupabase.from().insert().select().single().mockResolvedValue({
      data: newComment,
      error: null,
    });

    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.addComment('New test comment');
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('title_comments');
    expect(result.current.submitting).toBe(false);
  });

  it('should filter inappropriate content when adding comment', async () => {
    const newComment = createMockComment({ content: '*** test comment' });
    
    mockSupabase.from().insert().select().single().mockResolvedValue({
      data: newComment,
      error: null,
    });

    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.addComment('badword test comment');
    });

    // Verify the content was filtered
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      title_id: titleId,
      user_id: 'test-user-id',
      content: '*** test comment',
    });
  });

  it('should handle add comment error', async () => {
    const error = new Error('Failed to add comment');
    mockSupabase.from().insert().select().single().mockResolvedValue({
      data: null,
      error,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.addComment('Test comment');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error adding comment:', error);
    expect(result.current.submitting).toBe(false);
    
    consoleSpy.mockRestore();
  });

  it('should update a comment successfully', async () => {
    const updatedComment = createMockComment({ 
      id: 'test-comment-1',
      content: 'Updated comment' 
    });
    
    mockSupabase.from().update().eq().select().single().mockResolvedValue({
      data: updatedComment,
      error: null,
    });

    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.updateComment('test-comment-1', 'Updated comment');
    });

    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      content: 'Updated comment',
      updated_at: expect.any(String),
    });
  });

  it('should delete a comment successfully', async () => {
    mockSupabase.from().delete().eq().mockResolvedValue({
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.deleteComment('test-comment-1');
    });

    expect(mockSupabase.from().delete).toHaveBeenCalled();
    expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', 'test-comment-1');
  });

  it('should refetch comments', async () => {
    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.refetch();
    });

    // Should call fetch again
    expect(mockSupabase.from).toHaveBeenCalledTimes(2); // Once on mount, once on refetch
  });

  it('should prevent empty comments', async () => {
    const { result } = renderHook(() => useComments(titleId));

    await act(async () => {
      await result.current.addComment('   '); // Only whitespace
    });

    // Should not call insert for empty content
    expect(mockSupabase.from().insert).not.toHaveBeenCalled();
  });
});