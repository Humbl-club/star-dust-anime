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
    // Use username as seed for consistent generation
    const seed = this.hashCode(username);
    
    const colors = template.color_palette;
    const baseIndex = Math.abs(seed) % colors.length;
    
    return {
      hair_color: colors[baseIndex],
      eye_color: colors[(baseIndex + 1) % colors.length],
      outfit_color: colors[(baseIndex + 2) % colors.length],
      accessory_color: colors[(baseIndex + 3) % colors.length],
      skin_tone: this.getSkinTone(seed)
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
    // Use AI for special cases or high-tier characters
    return request.forceAI || 
           request.tier === 'GOD' || 
           (request.tier === 'LEGENDARY' && Math.random() < 0.3);
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

  // Public method to clear cache for testing
  async clearCache(): Promise<void> {
    await supabase.from('generated_characters').delete().neq('id', '');
  }
}

export const characterGenerationService = new CharacterGenerationService();