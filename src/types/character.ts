// Character Template System Types
export interface CharacterTemplate {
  id: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  template_name: string;
  base_config: {
    style: string;
    accessories: string[];
    pose: string;
    [key: string]: any;
  };
  color_palette: string[];
  animation_style: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterVariation {
  id: string;
  template_id: string;
  variation_name: string;
  variation_config: {
    hair_style: string;
    outfit_style: string;
    color_variant: number;
    [key: string]: any;
  };
  rarity_weight: number;
  created_at: string;
}

export interface AnimationSet {
  id: string;
  animation_name: string;
  animation_type: string;
  duration_ms: number;
  animation_config: {
    effects: string[];
    movement: string;
    [key: string]: any;
  };
  tier_compatibility: string[];
  created_at: string;
}

export interface GeneratedCharacter {
  id: string;
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  generation_method: 'procedural' | 'ai';
  character_data: {
    template: CharacterTemplate;
    variation: CharacterVariation;
    animation: AnimationSet;
    visual_data: {
      hair_color: string;
      eye_color: string;
      outfit_color: string;
      accessory_color: string;
      skin_tone: string;
      // Enhanced Phase 2 properties
      hair_style?: string;
      outfit_style?: string;
      accessory_pattern?: string;
      color_saturation?: number;
      special_effects?: string[];
    };
    personality_traits: string[];
    [key: string]: any;
  };
  image_url?: string;
  cached_at: string;
  cache_expires_at: string;
}

export interface CharacterGenerationRequest {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  sourceAnime?: string;
  description?: string;
  forceAI?: boolean;
}

export interface CharacterGenerationResult {
  character: GeneratedCharacter;
  isNewlyGenerated: boolean;
  generationTime: number;
}