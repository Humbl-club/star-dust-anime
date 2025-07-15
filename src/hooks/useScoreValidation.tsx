import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ValidationStats {
  hidden_gem: { count: number; percentage: number };
  undervalued: { count: number; percentage: number };
  accurate_af: { count: number; percentage: number };
  overhyped: { count: number; percentage: number };
  bot_farm: { count: number; percentage: number };
  total: number;
}

export interface ScoreValidation {
  id: string;
  user_id: string;
  title_id: string;
  validation_type: 'hidden_gem' | 'undervalued' | 'accurate_af' | 'overhyped' | 'bot_farm';
  created_at: string;
  updated_at: string;
}

export const VALIDATION_LABELS = {
  hidden_gem: 'Hidden Gem',
  undervalued: 'Undervalued',
  accurate_af: 'Accurate AF',
  overhyped: 'Overhyped',
  bot_farm: 'Bot Farm'
} as const;

export const VALIDATION_ORDER = ['hidden_gem', 'undervalued', 'accurate_af', 'overhyped', 'bot_farm'] as const;

export const useScoreValidation = (titleId: string) => {
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    hidden_gem: { count: 0, percentage: 0 },
    undervalued: { count: 0, percentage: 0 },
    accurate_af: { count: 0, percentage: 0 },
    overhyped: { count: 0, percentage: 0 },
    bot_farm: { count: 0, percentage: 0 },
    total: 0
  });
  const [userValidation, setUserValidation] = useState<ScoreValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch validation stats and user's current validation
  const fetchValidationData = async () => {
    if (!titleId) return;
    
    try {
      setLoading(true);
      
      // Get validation stats using the database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_title_validation_stats', { title_id_param: titleId });
      
      if (statsError) {
        console.error('Error fetching validation stats:', statsError);
      } else {
        // Transform the data into our expected format
        const stats: ValidationStats = {
          hidden_gem: { count: 0, percentage: 0 },
          undervalued: { count: 0, percentage: 0 },
          accurate_af: { count: 0, percentage: 0 },
          overhyped: { count: 0, percentage: 0 },
          bot_farm: { count: 0, percentage: 0 },
          total: 0
        };
        
        let total = 0;
        if (statsData) {
          statsData.forEach((item: any) => {
            const validationType = item.validation_type as keyof ValidationStats;
            if (validationType !== 'total' && stats[validationType]) {
              (stats[validationType] as { count: number; percentage: number }) = {
                count: parseInt(item.count),
                percentage: parseFloat(item.percentage)
              };
              total += parseInt(item.count);
            }
          });
        }
        stats.total = total;
        setValidationStats(stats);
      }
      
      // Get user's current validation if logged in
      if (user) {
        const { data: userValidationData, error: userValidationError } = await supabase
          .from('score_validations')
          .select('*')
          .eq('title_id', titleId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userValidationError) {
          console.error('Error fetching user validation:', userValidationError);
        } else {
          setUserValidation(userValidationData as ScoreValidation);
        }
      }
    } catch (error) {
      console.error('Error in fetchValidationData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit or update validation with optional comment
  const submitValidation = async (validationType: keyof typeof VALIDATION_LABELS, comment?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to validate scores.",
        variant: "destructive"
      });
      return;
    }

    if (!titleId) return;

    setSubmitting(true);
    try {
      if (userValidation) {
        // Update existing validation
        const { error } = await supabase
          .from('score_validations')
          .update({
            validation_type: validationType,
            updated_at: new Date().toISOString()
          })
          .eq('id', userValidation.id);

        if (error) throw error;
      } else {
        // Create new validation
        const { error } = await supabase
          .from('score_validations')
          .insert({
            title_id: titleId,
            user_id: user.id,
            validation_type: validationType
          });

        if (error) throw error;
      }

      // Add comment if provided
      if (comment && comment.trim()) {
        // Check if user already has a comment for this title
        const { data: existingComment } = await supabase
          .from('title_comments')
          .select('id')
          .eq('title_id', titleId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingComment) {
          // Update existing comment
          const { error: commentError } = await supabase
            .from('title_comments')
            .update({
              content: comment.trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingComment.id);

          if (commentError) {
            console.error('Error updating comment:', commentError);
          }
        } else {
          // Create new comment
          const { error: commentError } = await supabase
            .from('title_comments')
            .insert({
              title_id: titleId,
              user_id: user.id,
              content: comment.trim()
            });

          if (commentError) {
            console.error('Error creating comment:', commentError);
          }
        }
      }

      toast({
        title: "Validation Submitted",
        description: `Marked as ${VALIDATION_LABELS[validationType]}${comment ? " with comment" : ""}`,
        variant: "default"
      });

      // Refresh data
      await fetchValidationData();
    } catch (error) {
      console.error('Error submitting validation:', error);
      toast({
        title: "Error",
        description: "Failed to submit validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Remove validation
  const removeValidation = async () => {
    if (!user || !userValidation) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('score_validations')
        .delete()
        .eq('id', userValidation.id);

      if (error) throw error;

      toast({
        title: "Validation Removed",
        description: "Your validation has been removed.",
        variant: "default"
      });

      // Refresh data
      await fetchValidationData();
    } catch (error) {
      console.error('Error removing validation:', error);
      toast({
        title: "Error",
        description: "Failed to remove validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchValidationData();
  }, [titleId, user]);

  return {
    validationStats,
    userValidation,
    loading,
    submitting,
    submitValidation,
    removeValidation,
    refetch: fetchValidationData
  };
};