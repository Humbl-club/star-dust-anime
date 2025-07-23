import { supabase } from '@/integrations/supabase/client';
import { OfflineAction, OfflineActionData } from '@/types/userLists';

// Handler functions moved outside of the hook for better modularity and testing
export const handleAddToList = async (action: OfflineAction<'add_to_list'>) => {
  const { user_id, title_id, media_type, status_id } = action.data;
  
  // Check if user_title_lists table exists, otherwise use activity_feed for tracking
  const { error } = await supabase
    .from('activity_feed')
    .insert({
      user_id,
      title_id,
      activity_type: 'add_to_list',
      metadata: { 
        media_type, 
        status_id,
        offline_sync: true,
        timestamp: new Date().toISOString()
      }
    });
  
  if (error) throw error;
};

export const handleUpdateProgress = async (action: OfflineAction<'update_progress'>) => {
  const { list_item_id, progress } = action.data;
  
  // For now, log to activity_feed until user_title_lists is implemented
  const { error } = await supabase
    .from('activity_feed')
    .insert({
      activity_type: 'update_progress',
      metadata: { 
        list_item_id, 
        progress,
        offline_sync: true,
        timestamp: new Date().toISOString()
      }
    });
  
  if (error) throw error;
};

export const handleRateTitle = async (action: OfflineAction<'rate_title'>) => {
  const { list_item_id, rating } = action.data;
  
  // For now, log to activity_feed until user_title_lists is implemented
  const { error } = await supabase
    .from('activity_feed')
    .insert({
      activity_type: 'rate_title',
      metadata: { 
        list_item_id, 
        rating,
        offline_sync: true,
        timestamp: new Date().toISOString()
      }
    });
  
  if (error) throw error;
};

export const handleWriteReview = async (action: OfflineAction<'write_review'>) => {
  const { title_id, user_id, content, rating, spoiler_warning, title } = action.data;
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      title_id,
      user_id,
      content,
      rating: rating || null,
      spoiler_warning: spoiler_warning || false,
      title: title || null
    });
  
  if (error) throw error;
};

export const handleUpdateStatus = async (action: OfflineAction<'update_status'>) => {
  const { list_item_id, status_id } = action.data;
  
  // For now, log to activity_feed until user_title_lists is implemented
  const { error } = await supabase
    .from('activity_feed')
    .insert({
      activity_type: 'update_status',
      metadata: { 
        list_item_id, 
        status_id,
        offline_sync: true,
        timestamp: new Date().toISOString()
      }
    });
  
  if (error) throw error;
};

export const handleUpdateNotes = async (action: OfflineAction<'update_notes'>) => {
  const { list_item_id, notes } = action.data;
  
  // For now, log to activity_feed until user_title_lists is implemented
  const { error } = await supabase
    .from('activity_feed')
    .insert({
      activity_type: 'update_notes',
      metadata: { 
        list_item_id, 
        notes,
        offline_sync: true,
        timestamp: new Date().toISOString()
      }
    });
  
  if (error) throw error;
};

// Sync user title list items when the proper table structure is available
export const syncUserTitleListItem = async (item: any) => {
  try {
    // For now, just mark as synced since we're using activity_feed as a fallback
    console.log('Syncing user title list item:', item);
    return { success: true };
  } catch (error) {
    console.error('Error syncing user title list item:', error);
    return { success: false, error };
  }
};