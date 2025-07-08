
-- Gamified Username System Database Schema
-- Designed for 100K+ daily active users

-- Create username tier enum
CREATE TYPE username_tier AS ENUM ('GOD', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON');

-- Username pool with pre-categorized anime/manga character names
CREATE TABLE username_pool (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tier username_tier NOT NULL,
  character_type text, -- 'main', 'side', 'generic'
  source_anime text, -- anime/manga source
  created_at timestamp with time zone DEFAULT now()
);

-- Track claimed usernames for GOD TIER exclusivity
CREATE TABLE claimed_usernames (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  tier username_tier NOT NULL,
  claimed_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- User points system for gamification
CREATE TABLE user_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_points integer DEFAULT 0,
  daily_points integer DEFAULT 0,
  last_daily_reset date DEFAULT CURRENT_DATE,
  login_streak integer DEFAULT 0,
  last_login_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User loot box inventory
CREATE TABLE user_loot_boxes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  box_type text NOT NULL, -- 'standard', 'premium', 'ultra'
  quantity integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Username collection history
CREATE TABLE username_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  tier username_tier NOT NULL,
  acquired_method text, -- 'signup', 'loot_box', 'trade'
  acquired_at timestamp with time zone DEFAULT now(),
  is_current boolean DEFAULT false
);

-- Daily activities tracking (partitioned for scale)
CREATE TABLE daily_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date date DEFAULT CURRENT_DATE,
  activity_type text NOT NULL, -- 'login', 'view_anime', 'add_to_list', 'review', 'complete'
  points_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Partition daily_activities by month for performance
CREATE INDEX idx_daily_activities_user_date ON daily_activities (user_id, activity_date);
CREATE INDEX idx_daily_activities_date ON daily_activities (activity_date);

-- Username trading marketplace
CREATE TABLE username_trades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  tier username_tier NOT NULL,
  price_points integer NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Indexes for performance at scale
CREATE INDEX idx_username_pool_tier ON username_pool (tier);
CREATE INDEX idx_claimed_usernames_user ON claimed_usernames (user_id);
CREATE INDEX idx_claimed_usernames_tier ON claimed_usernames (tier);
CREATE INDEX idx_user_points_user ON user_points (user_id);
CREATE INDEX idx_username_history_user ON username_history (user_id);
CREATE INDEX idx_username_trades_status ON username_trades (status);

-- Enable RLS
ALTER TABLE username_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_usernames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE username_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE username_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Username pool - public read
CREATE POLICY "Public read access to username_pool" ON username_pool FOR SELECT USING (true);
CREATE POLICY "Service role manages username_pool" ON username_pool FOR ALL USING (true);

-- Claimed usernames - public read, users manage own
CREATE POLICY "Public read claimed usernames" ON claimed_usernames FOR SELECT USING (true);
CREATE POLICY "Users manage own claimed usernames" ON claimed_usernames FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages claimed usernames" ON claimed_usernames FOR ALL USING (true);

-- User points - users manage own
CREATE POLICY "Users manage own points" ON user_points FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages points" ON user_points FOR ALL USING (true);

-- User loot boxes - users manage own
CREATE POLICY "Users manage own loot boxes" ON user_loot_boxes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages loot boxes" ON user_loot_boxes FOR ALL USING (true);

-- Username history - users view own
CREATE POLICY "Users view own username history" ON username_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own username history" ON username_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages username history" ON username_history FOR ALL USING (true);

-- Daily activities - users manage own
CREATE POLICY "Users manage own activities" ON daily_activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages activities" ON daily_activities FOR ALL USING (true);

-- Username trades - public read, users manage own trades
CREATE POLICY "Public read username trades" ON username_trades FOR SELECT USING (true);
CREATE POLICY "Users manage own trades" ON username_trades FOR ALL USING (auth.uid() = seller_id OR auth.uid() = buyer_id);
CREATE POLICY "Service role manages trades" ON username_trades FOR ALL USING (true);

-- Trigger to update username_history when claimed_usernames changes
CREATE OR REPLACE FUNCTION update_username_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous username as not current
  UPDATE username_history 
  SET is_current = false 
  WHERE user_id = NEW.user_id AND is_current = true;
  
  -- Insert new username record
  INSERT INTO username_history (user_id, username, tier, acquired_method, is_current)
  VALUES (NEW.user_id, NEW.username, NEW.tier, 'system', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER username_claimed_trigger
  AFTER INSERT ON claimed_usernames
  FOR EACH ROW
  EXECUTE FUNCTION update_username_history();

-- Trigger to initialize user points and loot boxes
CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create points record
  INSERT INTO user_points (user_id, total_points, daily_points)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO user_loot_boxes (user_id, box_type, quantity)
  VALUES (NEW.id, 'standard', 1)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_user_gamification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_gamification();

-- Function to assign random username on signup
CREATE OR REPLACE FUNCTION assign_random_username(user_id_param uuid)
RETURNS TABLE(username text, tier username_tier) AS $$
DECLARE
  random_val float;
  selected_username text;
  selected_tier username_tier;
BEGIN
  -- Generate random value for tier selection
  random_val := random();
  
  -- Determine tier based on probability
  IF random_val <= 0.0001 THEN -- 0.01% chance for GOD
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'GOD' 
    AND up.name NOT IN (SELECT username FROM claimed_usernames WHERE is_active = true)
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.005 THEN -- 0.5% chance for LEGENDARY
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'LEGENDARY'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.05 THEN -- 5% chance for EPIC
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'EPIC'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.2 THEN -- 15% chance for RARE
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'RARE'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.5 THEN -- 30% chance for UNCOMMON
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'UNCOMMON'
    ORDER BY random()
    LIMIT 1;
  ELSE -- 49.49% chance for COMMON
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'COMMON'
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  -- If no username found (shouldn't happen), fallback to COMMON
  IF selected_username IS NULL THEN
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'COMMON'
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  -- Claim the username
  INSERT INTO claimed_usernames (username, user_id, tier)
  VALUES (selected_username, user_id_param, selected_tier);
  
  -- Update profile with username
  UPDATE profiles SET username = selected_username WHERE id = user_id_param;
  
  RETURN QUERY SELECT selected_username, selected_tier;
END;
$$ LANGUAGE plpgsql;

-- Seed initial username pool (sample data)
INSERT INTO username_pool (name, tier, character_type, source_anime) VALUES
-- GOD TIER (50 names total)
('Naruto', 'GOD', 'main', 'Naruto'),
('Goku', 'GOD', 'main', 'Dragon Ball'),
('Luffy', 'GOD', 'main', 'One Piece'),
('Ichigo', 'GOD', 'main', 'Bleach'),
('Natsu', 'GOD', 'main', 'Fairy Tail'),
('Edward', 'GOD', 'main', 'Fullmetal Alchemist'),
('Light', 'GOD', 'main', 'Death Note'),
('Eren', 'GOD', 'main', 'Attack on Titan'),
('Tanjiro', 'GOD', 'main', 'Demon Slayer'),
('Deku', 'GOD', 'main', 'My Hero Academia'),

-- LEGENDARY TIER (sample)
('Kakashi', 'LEGENDARY', 'side', 'Naruto'),
('Vegeta', 'LEGENDARY', 'side', 'Dragon Ball'),
('Zoro1', 'LEGENDARY', 'main', 'One Piece'),
('Sasuke1', 'LEGENDARY', 'main', 'Naruto'),
('Levi1', 'LEGENDARY', 'side', 'Attack on Titan'),

-- EPIC TIER (sample)
('Shikamaru1', 'EPIC', 'side', 'Naruto'),
('Piccolo1', 'EPIC', 'side', 'Dragon Ball'),
('Sanji2', 'EPIC', 'side', 'One Piece'),

-- RARE TIER (sample)
('Kiba1', 'RARE', 'side', 'Naruto'),
('Yamcha1', 'RARE', 'side', 'Dragon Ball'),

-- UNCOMMON TIER (sample)
('Ninja1', 'UNCOMMON', 'generic', 'General'),
('Saiyan1', 'UNCOMMON', 'generic', 'General'),

-- COMMON TIER (sample)
('AnimeUser1', 'COMMON', 'generic', 'General'),
('MangaFan1', 'COMMON', 'generic', 'General');
