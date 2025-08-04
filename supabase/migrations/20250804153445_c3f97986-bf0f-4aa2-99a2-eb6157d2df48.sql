-- 1.5 Enable RLS on Tables Only (Security Fix)
-- Critical security fix: Enable RLS on tables that have policies but RLS disabled
-- Excluding views and materialized views

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_title_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.username_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.username_pool ENABLE ROW LEVEL SECURITY;