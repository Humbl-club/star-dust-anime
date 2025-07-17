-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create email queue table for reliability and tracking
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_type text NOT NULL DEFAULT 'verification',
  status text NOT NULL DEFAULT 'pending',
  retries integer DEFAULT 0,
  next_retry_at timestamptz DEFAULT now(),
  correlation_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

-- Create email sent archive table
CREATE TABLE IF NOT EXISTS email_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_type text NOT NULL,
  correlation_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sent_user ON email_sent(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to email_queue
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sent ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to both tables
CREATE POLICY "Service role has full access to email queue" ON email_queue USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to email sent" ON email_sent USING (true) WITH CHECK (true);

-- Allow users to view their own emails
CREATE POLICY "Users can view their own queued emails" ON email_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own sent emails" ON email_sent FOR SELECT USING (auth.uid() = user_id);

-- Add cron job to process email queue
SELECT cron.schedule(
  'process-email-queue', -- name of the cron job
  '* * * * *', -- run every minute (fixed with all 5 asterisks)
  $$
  SELECT net.http_post(
    url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/process-email-queue',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);