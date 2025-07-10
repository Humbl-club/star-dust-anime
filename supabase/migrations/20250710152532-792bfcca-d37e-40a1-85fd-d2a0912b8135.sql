-- Add custom verification system to profiles table
ALTER TABLE public.profiles 
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired')),
ADD COLUMN verification_required_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- Update existing users to be verified (grandfathering)
UPDATE public.profiles 
SET verification_status = 'verified' 
WHERE verification_status = 'pending';

-- Create function to handle new user verification setup
CREATE OR REPLACE FUNCTION public.setup_user_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Set verification required until 7 days from now for new users
  NEW.verification_status = 'pending';
  NEW.verification_required_until = now() + interval '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
CREATE TRIGGER setup_verification_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_user_verification();

-- Create function to verify user manually
CREATE OR REPLACE FUNCTION public.verify_user_email(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET verification_status = 'verified',
      verification_required_until = NULL
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if verification expired
CREATE OR REPLACE FUNCTION public.check_verification_expiry()
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET verification_status = 'expired'
  WHERE verification_status = 'pending' 
    AND verification_required_until < now();
END;
$$ LANGUAGE plpgsql;