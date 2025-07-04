-- Create content moderation and legal compliance tables

-- Age verification and content filtering
CREATE TABLE public.user_content_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_verified BOOLEAN NOT NULL DEFAULT false,
  age_verification_date TIMESTAMP WITH TIME ZONE,
  show_adult_content BOOLEAN NOT NULL DEFAULT false,
  content_rating_preference TEXT NOT NULL DEFAULT 'teen' CHECK (content_rating_preference IN ('all', 'teen', 'mature', 'adult')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Content reports for moderation
CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_content_type TEXT NOT NULL CHECK (reported_content_type IN ('anime', 'manga', 'review', 'post', 'comment', 'user')),
  reported_content_id UUID NOT NULL,
  report_reason TEXT NOT NULL CHECK (report_reason IN ('inappropriate_content', 'copyright_violation', 'spam', 'harassment', 'misinformation', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- API attributions table for legal compliance
CREATE TABLE public.api_attributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  attribution_text TEXT NOT NULL,
  license_url TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legal pages content
CREATE TABLE public.legal_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL UNIQUE CHECK (page_type IN ('privacy_policy', 'terms_of_service', 'content_policy', 'copyright_policy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_content_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_content_preferences
CREATE POLICY "Users can manage their own content preferences"
ON public.user_content_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_reports
CREATE POLICY "Users can create reports"
ON public.content_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own reports"
ON public.content_reports
FOR SELECT
USING (auth.uid() = reporter_user_id);

CREATE POLICY "Service role can manage all reports"
ON public.content_reports
FOR ALL
USING (true);

-- RLS Policies for api_attributions (public read)
CREATE POLICY "Anyone can view API attributions"
ON public.api_attributions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role can manage attributions"
ON public.api_attributions
FOR ALL
USING (true);

-- RLS Policies for legal_pages (public read)
CREATE POLICY "Anyone can view legal pages"
ON public.legal_pages
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage legal pages"
ON public.legal_pages
FOR ALL
USING (true);

-- Insert default API attributions
INSERT INTO public.api_attributions (service_name, attribution_text, license_url, terms_url) VALUES 
('MyAnimeList', 'Anime and manga data provided by MyAnimeList API. All content remains property of their respective owners.', 'https://myanimelist.net/about/terms_of_use', 'https://myanimelist.net/about/terms_of_use'),
('AniList', 'Additional anime data provided by AniList API. All content remains property of their respective owners.', 'https://anilist.co/terms', 'https://anilist.co/terms'),
('Jikan API', 'MyAnimeList data accessed through Jikan API (unofficial). All content remains property of their respective owners.', 'https://jikan.moe/', 'https://jikan.moe/');

-- Insert default legal pages
INSERT INTO public.legal_pages (page_type, title, content) VALUES 
('privacy_policy', 'Privacy Policy', 'This Privacy Policy describes how we collect, use, and protect your information when you use our anime and manga tracking application.

INFORMATION WE COLLECT:
- Account information (email, username)
- Anime and manga preferences and ratings
- Usage analytics and app performance data

HOW WE USE YOUR INFORMATION:
- To provide personalized recommendations
- To sync your data across devices
- To improve our services
- To communicate with you about updates

DATA SHARING:
We do not sell or share your personal information with third parties except as required by law.

THIRD-PARTY SERVICES:
Our app uses data from MyAnimeList and AniList APIs. Please review their privacy policies.

CONTACT US:
For privacy concerns, contact us through the app or our website.

Last updated: ' || CURRENT_DATE),

('terms_of_service', 'Terms of Service', 'By using this anime and manga tracking application, you agree to these Terms of Service.

ACCEPTABLE USE:
- You must be at least 13 years old to use this service
- You agree to provide accurate information
- You will not upload inappropriate or copyrighted content
- You will respect other users and follow community guidelines

CONTENT:
- All anime and manga data is sourced from public APIs
- User-generated content (reviews, ratings) remains your property
- We reserve the right to moderate content

DISCLAIMERS:
- Anime and manga data is provided "as is"
- We are not responsible for third-party content
- Service availability is not guaranteed

CHANGES:
We reserve the right to modify these terms at any time.

Last updated: ' || CURRENT_DATE),

('content_policy', 'Content Policy', 'This Content Policy outlines acceptable content and behavior in our app.

PROHIBITED CONTENT:
- Explicit sexual content involving minors
- Harassment, bullying, or threats
- Spam or misleading information
- Copyright infringement
- Hate speech or discrimination

AGE RATINGS:
Content is rated according to industry standards:
- All Ages: Suitable for everyone
- Teen: May contain mild violence, suggestive themes
- Mature: Strong violence, sexual themes, adult situations
- Adult: Explicit content for 18+ only

REPORTING:
Users can report inappropriate content through the app.

ENFORCEMENT:
Violations may result in content removal or account suspension.

Last updated: ' || CURRENT_DATE),

('copyright_policy', 'Copyright Policy', 'We respect intellectual property rights and comply with copyright laws.

CONTENT SOURCES:
All anime and manga information is sourced from:
- MyAnimeList (with proper attribution)
- AniList (with proper attribution)
- User-generated reviews and ratings

DMCA COMPLIANCE:
If you believe your copyright has been infringed, please contact us with:
- Description of the copyrighted work
- Location of the infringing material
- Your contact information
- Good faith statement of unauthorized use

SAFE HARBOR:
We operate under DMCA safe harbor provisions and will respond to valid takedown requests.

Last updated: ' || CURRENT_DATE);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_content_preferences_updated_at
  BEFORE UPDATE ON public.user_content_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();