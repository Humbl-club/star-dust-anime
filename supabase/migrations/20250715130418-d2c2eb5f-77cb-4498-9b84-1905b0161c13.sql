-- Fix the existing policies issue by dropping them first
DROP POLICY IF EXISTS "Users can view their own verification status" ON public.email_verification_status;
DROP POLICY IF EXISTS "Users can update their own verification status" ON public.email_verification_status;
DROP POLICY IF EXISTS "Service role can manage verification status" ON public.email_verification_status;

-- Recreate the policies
CREATE POLICY "Users can view their own verification status"
  ON public.email_verification_status
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification status"
  ON public.email_verification_status
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verification status"
  ON public.email_verification_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);