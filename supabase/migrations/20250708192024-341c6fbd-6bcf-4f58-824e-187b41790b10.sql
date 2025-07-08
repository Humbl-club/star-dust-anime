-- Phase 3: Social Features, Trading & Character Evolution System

-- Character showcase table for social sharing
CREATE TABLE character_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  character_id UUID REFERENCES generated_characters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Character showcase likes
CREATE TABLE character_showcase_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  showcase_id UUID REFERENCES character_showcases(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, showcase_id)
);

-- Character trading system
CREATE TABLE character_trade_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  character_id UUID REFERENCES generated_characters(id) ON DELETE CASCADE,
  asking_price INTEGER NOT NULL,
  currency_type TEXT DEFAULT 'points',
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Character evolution/enhancement system
CREATE TABLE character_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES generated_characters(id) ON DELETE CASCADE,
  enhancement_type TEXT NOT NULL, -- 'upgrade_tier', 'add_effect', 'customize_colors'
  enhancement_data JSONB NOT NULL DEFAULT '{}',
  cost_points INTEGER NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  applied_by UUID NOT NULL
);

-- Character interaction logs (battles, showcases, etc.)
CREATE TABLE character_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character1_id UUID REFERENCES generated_characters(id) ON DELETE CASCADE,
  character2_id UUID REFERENCES generated_characters(id),
  interaction_type TEXT NOT NULL, -- 'battle', 'showcase_view', 'trade'
  interaction_data JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements for character collecting
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on all new tables
ALTER TABLE character_showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_trade_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character showcases
CREATE POLICY "Public read showcases" ON character_showcases FOR SELECT USING (is_public = true);
CREATE POLICY "Users manage own showcases" ON character_showcases FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for showcase likes
CREATE POLICY "Public read showcase likes" ON character_showcase_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON character_showcase_likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for trade listings
CREATE POLICY "Public read active trades" ON character_trade_listings FOR SELECT USING (status = 'active' AND expires_at > now());
CREATE POLICY "Users manage own trades" ON character_trade_listings FOR ALL USING (auth.uid() = seller_id);

-- RLS Policies for character enhancements
CREATE POLICY "Users view own enhancements" ON character_enhancements FOR SELECT USING (auth.uid() = applied_by);
CREATE POLICY "Users manage own enhancements" ON character_enhancements FOR ALL USING (auth.uid() = applied_by);

-- RLS Policies for character interactions
CREATE POLICY "Public read interactions" ON character_interactions FOR SELECT USING (true);
CREATE POLICY "Service role manages interactions" ON character_interactions FOR ALL USING (true);

-- RLS Policies for user achievements
CREATE POLICY "Users view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages achievements" ON user_achievements FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_character_showcases_public_featured ON character_showcases(is_public, featured) WHERE is_public = true;
CREATE INDEX idx_character_showcases_user ON character_showcases(user_id, created_at);
CREATE INDEX idx_character_trade_listings_active ON character_trade_listings(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_character_interactions_character1 ON character_interactions(character1_id, created_at);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, achievement_type);

-- Add update triggers
CREATE TRIGGER update_character_showcases_updated_at
  BEFORE UPDATE ON character_showcases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_trade_listings_updated_at
  BEFORE UPDATE ON character_trade_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample achievements
INSERT INTO user_achievements (user_id, achievement_type, achievement_data) VALUES
('00000000-0000-0000-0000-000000000000', 'first_character', '{"title": "First Character", "description": "Obtained your first character", "reward_points": 50}'),
('00000000-0000-0000-0000-000000000000', 'tier_collector', '{"title": "Tier Collector", "description": "Collected characters from every tier", "reward_points": 500}'),
('00000000-0000-0000-0000-000000000000', 'showcase_master', '{"title": "Showcase Master", "description": "Created 10 character showcases", "reward_points": 200}'),
('00000000-0000-0000-0000-000000000000', 'trader', '{"title": "Trader", "description": "Completed your first character trade", "reward_points": 100}'),
('00000000-0000-0000-0000-000000000000', 'god_collector', '{"title": "Divine Collector", "description": "Obtained a GOD tier character", "reward_points": 1000}')
ON CONFLICT (user_id, achievement_type) DO NOTHING;