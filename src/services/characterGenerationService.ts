import { supabase } from '@/integrations/supabase/client';
import type { 
  CharacterTemplate, 
  CharacterVariation, 
  AnimationSet, 
  GeneratedCharacter, 
  CharacterGenerationRequest, 
  CharacterGenerationResult 
} from '@/types/character';

class CharacterGenerationService {
  private templates: CharacterTemplate[] = [];
  private variations: { [templateId: string]: CharacterVariation[] } = {};
  private animations: AnimationSet[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load templates
      const { data: templates } = await supabase
        .from('character_templates')
        .select('*')
        .order('tier');

      // Load variations
      const { data: variations } = await supabase
        .from('character_variations')
        .select('*')
        .order('rarity_weight', { ascending: false });

      // Load animations
      const { data: animations } = await supabase
        .from('animation_sets')
        .select('*')
        .order('duration_ms');

      if (templates) this.templates = templates as CharacterTemplate[];
      if (variations) {
        // Group variations by template_id
        this.variations = (variations as CharacterVariation[]).reduce((acc, variation) => {
          if (!acc[variation.template_id]) acc[variation.template_id] = [];
          acc[variation.template_id].push(variation);
          return acc;
        }, {} as { [templateId: string]: CharacterVariation[] });
      }
      if (animations) this.animations = animations as AnimationSet[];

      this.initialized = true;
      console.log('CharacterGenerationService initialized with:', {
        templates: this.templates.length,
        variations: Object.keys(this.variations).length,
        animations: this.animations.length
      });
    } catch (error) {
      console.error('Failed to initialize CharacterGenerationService:', error);
    }
  }

  async generateCharacter(request: CharacterGenerationRequest): Promise<CharacterGenerationResult> {
    await this.initialize();
    const startTime = Date.now();

    try {
      // Check cache first
      const cached = await this.getCachedCharacter(request.username, request.tier);
      if (cached && !request.forceAI) {
        return {
          character: cached,
          isNewlyGenerated: false,
          generationTime: Date.now() - startTime
        };
      }

      // Generate new character
      const character = await this.createNewCharacter(request);
      
      // Cache the result
      await this.cacheCharacter(character);

      return {
        character,
        isNewlyGenerated: true,
        generationTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Character generation failed:', error);
      // Return fallback character
      return {
        character: this.createFallbackCharacter(request),
        isNewlyGenerated: true,
        generationTime: Date.now() - startTime
      };
    }
  }

  private async getCachedCharacter(username: string, tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON'): Promise<GeneratedCharacter | null> {
    const { data } = await supabase
      .from('generated_characters')
      .select('*')
      .eq('username', username)
      .eq('tier', tier)
      .gt('cache_expires_at', new Date().toISOString())
      .single();

    return data as GeneratedCharacter | null;
  }

  private async createNewCharacter(request: CharacterGenerationRequest): Promise<GeneratedCharacter> {
    // Get template for tier
    const template = this.getTemplateForTier(request.tier);
    if (!template) throw new Error(`No template found for tier: ${request.tier}`);

    // Get random variation
    const variation = this.getRandomVariation(template.id);
    if (!variation) throw new Error(`No variation found for template: ${template.id}`);

    // Get animation for tier
    const animation = this.getAnimationForTier(request.tier);
    if (!animation) throw new Error(`No animation found for tier: ${request.tier}`);

    // Generate visual characteristics
    const visualData = this.generateVisualData(template, variation, request.username);

    // Generate personality traits
    const personalityTraits = this.generatePersonalityTraits(request.tier, request.username);

    // Check if we should use AI for special cases
    const shouldUseAI = this.shouldUseAIGeneration(request);

    const character: GeneratedCharacter = {
      id: crypto.randomUUID(),
      username: request.username,
      tier: request.tier,
      generation_method: shouldUseAI ? 'ai' : 'procedural',
      character_data: {
        template,
        variation,
        animation,
        visual_data: visualData,
        personality_traits: personalityTraits,
        source_anime: request.sourceAnime,
        description: request.description || this.generateDescription(template, personalityTraits)
      },
      cached_at: new Date().toISOString(),
      cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    // Generate AI image if needed
    if (shouldUseAI) {
      character.image_url = await this.generateAIImage(character);
    }

    return character;
  }

  private getTemplateForTier(tier: string): CharacterTemplate | null {
    return this.templates.find(t => t.tier === tier as any) || null;
  }

  private getRandomVariation(templateId: string): CharacterVariation | null {
    const variations = this.variations[templateId] || [];
    if (variations.length === 0) return null;

    // Weighted random selection
    const totalWeight = variations.reduce((sum, v) => sum + v.rarity_weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variation of variations) {
      random -= variation.rarity_weight;
      if (random <= 0) return variation;
    }
    
    return variations[0]; // fallback
  }

  private getAnimationForTier(tier: string): AnimationSet | null {
    const compatibleAnimations = this.animations.filter(a => 
      a.tier_compatibility.includes(tier)
    );
    
    if (compatibleAnimations.length === 0) return null;
    
    // Prefer tier-specific animations
    const tierSpecific = compatibleAnimations.find(a => 
      a.tier_compatibility.length === 1 && a.tier_compatibility[0] === tier
    );
    
    return tierSpecific || compatibleAnimations[Math.floor(Math.random() * compatibleAnimations.length)];
  }

  private generateVisualData(template: CharacterTemplate, variation: CharacterVariation, username: string) {
    // Enhanced visual generation for Phase 2
    const seed = this.hashCode(username);
    const colors = template.color_palette;
    const baseIndex = Math.abs(seed) % colors.length;
    
    // Advanced color harmony system
    const colorVariant = variation.variation_config.color_variant || 0;
    const harmonyOffset = colorVariant * 2;
    
    // Generate complementary colors based on tier
    const tierColorMod = {
      'GOD': 0,      // Use pure colors
      'LEGENDARY': 1, // Slight shift
      'EPIC': 2,     // More shift
      'RARE': 3,     // Moderate shift
      'UNCOMMON': 4, // Higher shift
      'COMMON': 5    // Maximum shift
    };
    
    const mod = tierColorMod[template.tier] || 5;
    
    return {
      hair_color: colors[(baseIndex + harmonyOffset) % colors.length],
      eye_color: colors[(baseIndex + harmonyOffset + 1) % colors.length],
      outfit_color: colors[(baseIndex + harmonyOffset + 2) % colors.length],
      accessory_color: colors[(baseIndex + harmonyOffset + 3) % colors.length],
      skin_tone: this.getSkinTone(seed + mod),
      // Enhanced visual properties
      hair_style: variation.variation_config.hair_style || 'medium',
      outfit_style: variation.variation_config.outfit_style || 'classic',
      accessory_pattern: this.generateAccessoryPattern(seed, template.tier),
      color_saturation: this.getTierSaturation(template.tier),
      special_effects: this.getSpecialEffects(template.tier, seed)
    };
  }

  private generatePersonalityTraits(tier: string, username: string): string[] {
    const tierTraits = {
      'GOD': ['Divine', 'Omnipotent', 'Wise', 'Majestic', 'Transcendent'],
      'LEGENDARY': ['Heroic', 'Brave', 'Noble', 'Determined', 'Inspiring'],
      'EPIC': ['Mystical', 'Powerful', 'Enigmatic', 'Skilled', 'Focused'],
      'RARE': ['Strong', 'Resilient', 'Tactical', 'Reliable', 'Disciplined'],
      'UNCOMMON': ['Curious', 'Eager', 'Studious', 'Ambitious', 'Growing'],
      'COMMON': ['Earnest', 'Friendly', 'Hopeful', 'Simple', 'Genuine']
    };

    const traits = tierTraits[tier as keyof typeof tierTraits] || tierTraits.COMMON;
    const seed = this.hashCode(username);
    
    // Select 2-3 traits based on username hash
    const selectedTraits = [];
    for (let i = 0; i < 3; i++) {
      const index = (Math.abs(seed) + i) % traits.length;
      if (!selectedTraits.includes(traits[index])) {
        selectedTraits.push(traits[index]);
      }
    }
    
    return selectedTraits;
  }

  private shouldUseAIGeneration(request: CharacterGenerationRequest): boolean {
    // Enhanced AI usage strategy for Phase 2
    if (request.forceAI) return true;
    
    // Always use AI for GOD tier
    if (request.tier === 'GOD') return true;
    
    // 50% chance for LEGENDARY
    if (request.tier === 'LEGENDARY') return Math.random() < 0.5;
    
    // 20% chance for EPIC
    if (request.tier === 'EPIC') return Math.random() < 0.2;
    
    // Special cases: if sourceAnime is provided, increase AI chance
    if (request.sourceAnime) {
      return Math.random() < 0.3;
    }
    
    return false;
  }

  private async generateAIImage(character: GeneratedCharacter): Promise<string | undefined> {
    try {
      // Create prompt for AI image generation
      const prompt = this.createImagePrompt(character);
      
      // Call OpenAI image generation (if implemented)
      const response = await supabase.functions.invoke('generate-character-image', {
        body: { prompt, tier: character.tier }
      });
      
      if (response.data?.image_url) {
        return response.data.image_url;
      }
    } catch (error) {
      console.warn('AI image generation failed, using procedural fallback:', error);
    }
    
    return undefined;
  }

  private createImagePrompt(character: GeneratedCharacter): string {
    const { template, visual_data, personality_traits } = character.character_data;
    
    return `Anime character named ${character.username}, ${template.template_name.toLowerCase()} style, ` +
           `${personality_traits.join(', ').toLowerCase()} personality, ` +
           `${visual_data.hair_color} hair, ${visual_data.eye_color} eyes, ` +
           `${template.base_config.style} outfit in ${visual_data.outfit_color}, ` +
           `${template.base_config.pose} pose, ${character.tier.toLowerCase()} tier quality, ` +
           `high quality anime art, detailed character design`;
  }

  private generateDescription(template: CharacterTemplate, traits: string[]): string {
    return `A ${template.template_name.toLowerCase()} with ${traits.join(', ').toLowerCase()} qualities. ` +
           `Known for their ${template.base_config.style} approach and ${template.animation_style} presence.`;
  }

  private createFallbackCharacter(request: CharacterGenerationRequest): GeneratedCharacter {
    return {
      id: crypto.randomUUID(),
      username: request.username,
      tier: request.tier,
      generation_method: 'procedural',
      character_data: {
        template: {
          id: 'fallback',
          tier: request.tier,
          template_name: 'Basic Character',
          base_config: { style: 'simple', accessories: [], pose: 'standing' },
          color_palette: ['#666666', '#888888'],
          animation_style: 'simple',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        variation: {
          id: 'fallback',
          template_id: 'fallback',
          variation_name: 'Default',
          variation_config: { hair_style: 'short', outfit_style: 'classic', color_variant: 0 },
          rarity_weight: 1,
          created_at: new Date().toISOString()
        },
        animation: {
          id: 'fallback',
          animation_name: 'simple_walk',
          animation_type: 'walk_out',
          duration_ms: 2000,
          animation_config: { effects: ['basic_shine'], movement: 'normal_walk' },
          tier_compatibility: ['COMMON'],
          created_at: new Date().toISOString()
        },
        visual_data: {
          hair_color: '#8B4513',
          eye_color: '#1E90FF',
          outfit_color: '#4682B4',
          accessory_color: '#666666',
          skin_tone: '#FDBCB4'
        },
        personality_traits: ['Friendly', 'Simple'],
        description: request.description || 'A basic anime character ready for adventure.'
      },
      cached_at: new Date().toISOString(),
      cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day for fallback
    };
  }

  private async cacheCharacter(character: GeneratedCharacter): Promise<void> {
    try {
      await supabase
        .from('generated_characters')
        .upsert({
          username: character.username,
          tier: character.tier,
          generation_method: character.generation_method,
          character_data: character.character_data,
          image_url: character.image_url,
          cached_at: character.cached_at,
          cache_expires_at: character.cache_expires_at
        });
    } catch (error) {
      console.warn('Failed to cache character:', error);
    }
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getSkinTone(seed: number): string {
    const tones = ['#FDBCB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524'];
    return tones[Math.abs(seed) % tones.length];
  }

  private generateAccessoryPattern(seed: number, tier: string): string {
    const patterns = {
      'GOD': ['divine_radiance', 'celestial_aura', 'golden_particles'],
      'LEGENDARY': ['heroic_emblem', 'energy_lines', 'power_glow'],
      'EPIC': ['mystic_runes', 'magic_circles', 'elemental_effects'],
      'RARE': ['combat_insignia', 'warrior_marks', 'skill_symbols'],
      'UNCOMMON': ['study_marks', 'apprentice_symbols', 'learning_aura'],
      'COMMON': ['simple_pattern', 'basic_design', 'minimal_detail']
    };
    
    const tierPatterns = patterns[tier as keyof typeof patterns] || patterns['COMMON'];
    return tierPatterns[Math.abs(seed) % tierPatterns.length];
  }

  private getTierSaturation(tier: string): number {
    const saturation = {
      'GOD': 1.0,
      'LEGENDARY': 0.9,
      'EPIC': 0.8,
      'RARE': 0.7,
      'UNCOMMON': 0.6,
      'COMMON': 0.5
    };
    
    return saturation[tier as keyof typeof saturation] || 0.5;
  }

  private getSpecialEffects(tier: string, seed: number): string[] {
    const effects = {
      'GOD': ['divine_light', 'golden_particles', 'heavenly_aura', 'transcendent_glow'],
      'LEGENDARY': ['heroic_aura', 'power_emanation', 'epic_glow', 'champion_radiance'],
      'EPIC': ['magical_sparkles', 'mystic_energy', 'elemental_wisps', 'enchanted_shimmer'],
      'RARE': ['skill_aura', 'combat_energy', 'focused_glow', 'determined_radiance'],
      'UNCOMMON': ['learning_glow', 'study_sparkles', 'growth_aura', 'potential_shimmer'],
      'COMMON': ['gentle_glow', 'simple_shine', 'basic_aura']
    };
    
    const tierEffects = effects[tier as keyof typeof effects] || effects['COMMON'];
    const numEffects = Math.min(2, Math.abs(seed) % 3 + 1);
    
    const selectedEffects = [];
    for (let i = 0; i < numEffects; i++) {
      const index = (Math.abs(seed) + i) % tierEffects.length;
      selectedEffects.push(tierEffects[index]);
    }
    
    return selectedEffects;
  }

  // Public method to clear cache for testing
  async clearCache(): Promise<void> {
    await supabase.from('generated_characters').delete().neq('id', '');
  }
}

export const characterGenerationService = new CharacterGenerationService();