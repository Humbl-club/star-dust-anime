-- 1.4 Add Missing Database Indexes
-- Performance critical indexes
CREATE INDEX IF NOT EXISTS idx_titles_content_type_score 
  ON titles(content_type, score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_composite 
  ON user_title_lists(user_id, status_id, updated_at DESC);

-- Email tracking indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_user_email 
  ON email_verification_status(user_id, email);

CREATE INDEX IF NOT EXISTS idx_email_delivery_tracking_composite 
  ON email_delivery_tracking(user_id, email_type, created_at DESC);