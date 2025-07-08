-- Phase 1: Database Cleanup & Enhancement for Hybrid AI + Template System

-- Clean up unused/empty visual_traits column from username_pool
-- (This column appears to be empty/unused based on default '{}'::jsonb)
ALTER TABLE username_pool DROP COLUMN IF EXISTS visual_traits;

-- Create character templates table for base character designs per tier
CREATE TABLE character_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier username_tier NOT NULL,
  template_name TEXT NOT NULL,
  base_config JSONB NOT NULL DEFAULT '{}',
  color_palette JSONB NOT NULL DEFAULT '[]',
  animation_style TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create character variations table for procedural generation
CREATE TABLE character_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES character_templates(id) ON DELETE CASCADE,
  variation_name TEXT NOT NULL,
  variation_config JSONB NOT NULL DEFAULT '{}',
  rarity_weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create animation sets table for walk-out animations
CREATE TABLE animation_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animation_name TEXT NOT NULL UNIQUE,
  animation_type TEXT NOT NULL DEFAULT 'walk_out',
  duration_ms INTEGER DEFAULT 3000,
  animation_config JSONB NOT NULL DEFAULT '{}',
  tier_compatibility TEXT[] DEFAULT '{"GOD","LEGENDARY","EPIC","RARE","UNCOMMON","COMMON"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create generated characters cache table for AI-generated variants
CREATE TABLE generated_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  tier username_tier NOT NULL,
  generation_method TEXT NOT NULL DEFAULT 'procedural', -- 'procedural' or 'ai'
  character_data JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(username, tier)
);

-- Enable RLS on new tables
ALTER TABLE character_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE animation_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_characters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public read character templates" ON character_templates FOR SELECT USING (true);
CREATE POLICY "Public read character variations" ON character_variations FOR SELECT USING (true);
CREATE POLICY "Public read animation sets" ON animation_sets FOR SELECT USING (true);
CREATE POLICY "Public read generated characters" ON generated_characters FOR SELECT USING (true);

-- Service role full access policies
CREATE POLICY "Service role manages character templates" ON character_templates FOR ALL USING (true);
CREATE POLICY "Service role manages character variations" ON character_variations FOR ALL USING (true);
CREATE POLICY "Service role manages animation sets" ON animation_sets FOR ALL USING (true);
CREATE POLICY "Service role manages generated characters" ON generated_characters FOR ALL USING (true);

-- Add update trigger for character_templates
CREATE TRIGGER update_character_templates_updated_at
  BEFORE UPDATE ON character_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert base character templates for each tier
INSERT INTO character_templates (tier, template_name, base_config, color_palette, animation_style) VALUES
('GOD', 'Divine Ruler', '{"style": "regal", "accessories": ["crown", "aura"], "pose": "commanding"}', '["#FFD700", "#FF69B4", "#8A2BE2", "#FF6347"]', 'divine'),
('LEGENDARY', 'Hero Champion', '{"style": "heroic", "accessories": ["cape", "emblem"], "pose": "confident"}', '["#FF4500", "#FFD700", "#4169E1", "#32CD32"]', 'heroic'),
('EPIC', 'Mystic Warrior', '{"style": "mystical", "accessories": ["staff", "runes"], "pose": "ready"}', '["#4169E1", "#8A2BE2", "#00CED1", "#FF69B4"]', 'mystical'),
('RARE', 'Skilled Fighter', '{"style": "combat", "accessories": ["weapon", "armor"], "pose": "battle"}', '["#228B22", "#4169E1", "#FF6347", "#DAA520"]', 'combat'),
('UNCOMMON', 'Apprentice', '{"style": "learning", "accessories": ["book", "pendant"], "pose": "studying"}', '["#708090", "#4682B4", "#9370DB", "#20B2AA"]', 'apprentice'),
('COMMON', 'Novice', '{"style": "simple", "accessories": ["basic_gear"], "pose": "standing"}', '["#696969", "#778899", "#B0C4DE", "#87CEEB"]', 'simple');

-- Insert base animation sets
INSERT INTO animation_sets (animation_name, animation_type, duration_ms, animation_config, tier_compatibility) VALUES
('divine_descent', 'walk_out', 4000, '{"effects": ["golden_light", "particles"], "movement": "floating"}', '{"GOD"}'),
('heroic_entrance', 'walk_out', 3500, '{"effects": ["energy_burst", "cape_flow"], "movement": "confident_stride"}', '{"LEGENDARY"}'),
('mystic_emergence', 'walk_out', 3000, '{"effects": ["magical_runes", "sparkles"], "movement": "ethereal_float"}', '{"EPIC"}'),
('warrior_approach', 'walk_out', 2500, '{"effects": ["dust_kick", "weapon_gleam"], "movement": "determined_walk"}', '{"RARE"}'),
('student_step', 'walk_out', 2000, '{"effects": ["book_pages", "learning_glow"], "movement": "eager_walk"}', '{"UNCOMMON"}'),
('simple_walk', 'walk_out', 1500, '{"effects": ["basic_shine"], "movement": "normal_walk"}', '{"COMMON"}');

-- Insert character variations for procedural generation (sample data)
INSERT INTO character_variations (template_id, variation_name, variation_config, rarity_weight)
SELECT 
  ct.id,
  ct.template_name || ' Variant ' || generate_series,
  jsonb_build_object(
    'hair_style', (ARRAY['long', 'short', 'spiky', 'wavy', 'braided'])[1 + (generate_series % 5)],
    'outfit_style', (ARRAY['classic', 'modern', 'traditional', 'futuristic', 'casual'])[1 + (generate_series % 5)],
    'color_variant', generate_series % 4
  ),
  CASE 
    WHEN generate_series % 10 = 0 THEN 5  -- Rare variations
    WHEN generate_series % 5 = 0 THEN 3   -- Uncommon variations
    ELSE 1                                -- Common variations
  END
FROM character_templates ct
CROSS JOIN generate_series(1, 50);

-- Function to clean up expired cached characters
CREATE OR REPLACE FUNCTION cleanup_expired_generated_characters()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM generated_characters 
  WHERE cache_expires_at < now();
END;
$$;