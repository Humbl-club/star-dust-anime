-- 1.5 Enable RLS on Existing Tables Only (Security Fix)
-- Enable RLS only on tables that exist and need it

-- Check if table exists before enabling RLS
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Enable RLS on tables that definitely exist based on the schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_feed') THEN
        ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claimed_usernames') THEN
        ALTER TABLE public.claimed_usernames ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_reports') THEN
        ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_activities') THEN
        ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_logs') THEN
        ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_subscriptions') THEN
        ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_reactions') THEN
        ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'score_validations') THEN
        ALTER TABLE public.score_validations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_title_lists') THEN
        ALTER TABLE public.user_title_lists ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;