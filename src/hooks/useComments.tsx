import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { filterContent } from '@/utils/contentModeration';

export interface TitleComment {
  id: string;
  user_id: string;
  title_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export const useComments = (titleId: string) => {
  const [comments, setComments] = useState<TitleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch comments for the title
  const fetchComments = async () => {
    if (!titleId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('title_comments')
        .select('*')
        .eq('title_id', titleId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment
  const addComment = async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add comments.",
        variant: "destructive"
      });
      return;
    }

    if (!titleId || !content.trim()) return;

    // Filter content for offensive language
    const filteredContent = filterContent(content.trim());

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('title_comments')
        .insert({
          title_id: titleId,
          user_id: user.id,
          content: filteredContent
        });

      if (error) throw error;

      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
        variant: "default"
      });

      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update an existing comment
  const updateComment = async (commentId: string, content: string) => {
    if (!user || !content.trim()) return;

    // Filter content for offensive language
    const filteredContent = filterContent(content.trim());

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('title_comments')
        .update({
          content: filteredContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only update their own comments

      if (error) throw error;

      toast({
        title: "Comment Updated",
        description: "Your comment has been updated.",
        variant: "default"
      });

      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('title_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      toast({
        title: "Comment Deleted",
        description: "Your comment has been deleted.",
        variant: "default"
      });

      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [titleId]);

  return {
    comments,
    loading,
    submitting,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments
  };
};