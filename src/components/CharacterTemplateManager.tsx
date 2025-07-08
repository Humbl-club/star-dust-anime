import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Settings, Sparkles, Crown, Star, Gem } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedCharacterDisplay } from '@/components/AdvancedCharacterDisplay';
import { characterGenerationService } from '@/services/characterGenerationService';
import type { CharacterTemplate, CharacterVariation, AnimationSet, GeneratedCharacter } from '@/types/character';

export const CharacterTemplateManager = () => {
  const [templates, setTemplates] = useState<CharacterTemplate[]>([]);
  const [variations, setVariations] = useState<CharacterVariation[]>([]);
  const [animations, setAnimations] = useState<AnimationSet[]>([]);
  const [previewCharacter, setPreviewCharacter] = useState<GeneratedCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('GOD');

  useEffect(() => {
    loadTemplateData();
  }, []);

  const loadTemplateData = async () => {
    try {
      const [templatesRes, variationsRes, animationsRes] = await Promise.all([
        supabase.from('character_templates').select('*').order('tier'),
        supabase.from('character_variations').select('*').order('rarity_weight', { ascending: false }),
        supabase.from('animation_sets').select('*').order('duration_ms')
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data as CharacterTemplate[]);
      if (variationsRes.data) setVariations(variationsRes.data as CharacterVariation[]);
      if (animationsRes.data) setAnimations(animationsRes.data as AnimationSet[]);
    } catch (error) {
      console.error('Error loading template data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewCharacter = async (tier: string, forceAI = false) => {
    setGenerating(true);
    try {
      const result = await characterGenerationService.generateCharacter({
        username: `Preview_${tier}_${Date.now()}`,
        tier: tier as any,
        forceAI
      });
      
      setPreviewCharacter(result.character);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setGenerating(false);
    }
  };

  const tierIcons = {
    GOD: Crown,
    LEGENDARY: Star,
    EPIC: Sparkles,
    RARE: Gem,
    UNCOMMON: Settings,
    COMMON: Palette
  };

  const tierColors = {
    GOD: 'from-purple-600 to-pink-500',
    LEGENDARY: 'from-yellow-500 to-orange-500',
    EPIC: 'from-blue-500 to-purple-500',
    RARE: 'from-green-500 to-teal-500',
    UNCOMMON: 'from-gray-400 to-slate-500',
    COMMON: 'from-gray-500 to-gray-600'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedTemplate = templates.find(t => t.tier === selectedTier);
  const templateVariations = variations.filter(v => v.template_id === selectedTemplate?.id);
  const tierAnimations = animations.filter(a => a.tier_compatibility.includes(selectedTier));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Character Template Manager</h1>
        <p className="text-muted-foreground">Explore and test the advanced character generation system</p>
      </div>

      <Tabs value={selectedTier} onValueChange={setSelectedTier} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {['GOD', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'].map((tier) => {
            const Icon = tierIcons[tier as keyof typeof tierIcons];
            return (
              <TabsTrigger key={tier} value={tier} className="flex items-center gap-2">
                <Icon size={16} />
                {tier}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {['GOD', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'].map((tier) => (
          <TabsContent key={tier} value={tier} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded bg-gradient-to-r ${tierColors[tier as keyof typeof tierColors]}`} />
                    {selectedTemplate?.template_name || `${tier} Template`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-2">Base Configuration</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Style: <Badge variant="outline">{selectedTemplate.base_config.style}</Badge></div>
                          <div>Animation: <Badge variant="outline">{selectedTemplate.animation_style}</Badge></div>
                          <div>Pose: <Badge variant="outline">{selectedTemplate.base_config.pose}</Badge></div>
                          <div>Accessories: <Badge variant="outline">{selectedTemplate.base_config.accessories?.join(', ')}</Badge></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Color Palette</h4>
                        <div className="flex gap-2 flex-wrap">
                          {selectedTemplate.color_palette.map((color: string, index: number) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded border border-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Available Variations ({templateVariations.length})</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {templateVariations.map((variation) => (
                            <div key={variation.id} className="flex justify-between items-center text-sm">
                              <span>{variation.variation_name}</span>
                              <Badge variant="secondary">Weight: {variation.rarity_weight}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Compatible Animations ({tierAnimations.length})</h4>
                        <div className="space-y-1">
                          {tierAnimations.map((animation) => (
                            <div key={animation.id} className="flex justify-between items-center text-sm">
                              <span>{animation.animation_name}</span>
                              <Badge variant="outline">{animation.duration_ms}ms</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Character Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Character Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => generatePreviewCharacter(tier, false)}
                      disabled={generating}
                      className="flex-1"
                    >
                      {generating ? 'Generating...' : 'Generate Procedural'}
                    </Button>
                    <Button
                      onClick={() => generatePreviewCharacter(tier, true)}
                      disabled={generating}
                      variant="outline"
                      className="flex-1"
                    >
                      {generating ? 'Generating...' : 'Generate AI'}
                    </Button>
                  </div>

                  {previewCharacter && (
                    <div className="flex justify-center">
                      <AdvancedCharacterDisplay
                        character={previewCharacter}
                        showAnimation={true}
                        size="large"
                      />
                    </div>
                  )}

                  {!previewCharacter && !generating && (
                    <div className="h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                      Click generate to preview a character
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};