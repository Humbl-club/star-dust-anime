// Phase 3: Social Features & Trading Types

export interface CharacterShowcase {
  id: string;
  user_id: string;
  character_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  featured: boolean;
  like_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterShowcaseLike {
  id: string;
  user_id: string;
  showcase_id: string;
  created_at: string;
}

export interface CharacterTradeListing {
  id: string;
  seller_id: string;
  character_id: string;
  asking_price: number;
  currency_type: 'points' | 'credits';
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterEnhancement {
  id: string;
  character_id: string;
  enhancement_type: 'upgrade_tier' | 'add_effect' | 'customize_colors' | 'boost_stats';
  enhancement_data: {
    from_tier?: string;
    to_tier?: string;
    added_effects?: string[];
    color_changes?: Record<string, string>;
    stat_boosts?: Record<string, number>;
    [key: string]: any;
  };
  cost_points: number;
  applied_at: string;
  applied_by: string;
}

export interface CharacterInteraction {
  id: string;
  character1_id: string;
  character2_id?: string;
  interaction_type: 'battle' | 'showcase_view' | 'trade' | 'enhancement';
  interaction_data: {
    battle_result?: 'win' | 'lose' | 'draw';
    points_gained?: number;
    experience_gained?: number;
    [key: string]: any;
  };
  result_data: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_data: {
    title: string;
    description: string;
    reward_points: number;
    icon?: string;
    rarity?: string;
    [key: string]: any;
  };
  unlocked_at: string;
}

export interface TradingFilters {
  tier?: string;
  maxPrice?: number;
  minPrice?: number;
  sortBy: 'price_asc' | 'price_desc' | 'tier' | 'date';
}

export interface ShowcaseFilters {
  featured?: boolean;
  tier?: string;
  sortBy: 'likes' | 'views' | 'date' | 'tier';
}