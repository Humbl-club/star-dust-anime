import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

export const DirectDatabaseAdd = () => {
  const [state, setState] = useState({
    isRunning: false,
    currentCount: 0,
    targetCount: 10,
    beforeCount: 0,
    afterCount: 0,
    errors: [] as string[],
    success: false
  });

  const addTitlesDirectly = async () => {
    console.log('🎯 DIRECT DATABASE ADD: Adding 10 titles directly...');
    
    setState(prev => ({ 
      ...prev, 
      isRunning: true, 
      errors: [],
      success: false 
    }));

    try {
      // Get initial count
      console.log('📊 Getting initial count...');
      const { count: beforeCount, error: countError } = await supabase
        .from('titles')
        .select('id', { count: 'exact' });

      if (countError) {
        throw new Error(`Failed to get initial count: ${countError.message}`);
      }

      console.log(`📊 Before: ${beforeCount} titles`);
      setState(prev => ({ ...prev, beforeCount: beforeCount || 0 }));

      // Add 10 test titles directly
      const timestamp = Date.now();
      let addedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i <= 10; i++) {
        const uniqueId = 700000 + (timestamp % 100000) + i;
        console.log(`➕ Adding title ${i}/10 with anilist_id: ${uniqueId}`);
        
        try {
          const { data, error } = await supabase
            .from('titles')
            .insert({
              anilist_id: uniqueId,
              title: `Direct Add Test ${i} - ${new Date().toLocaleTimeString()}`,
              title_english: `Direct English Title ${i}`,
              synopsis: `This is test title ${i} added directly via Supabase client to prove database access works`,
              score: 70 + (i * 3),
              popularity: 500 + (i * 50),
              favorites: 25 + (i * 5),
              year: 2018 + (i % 7),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id, anilist_id, title')
            .single();

          if (error) {
            console.error(`❌ Error adding title ${i}:`, error.message);
            errors.push(`Title ${i}: ${error.message}`);
          } else {
            console.log(`✅ Successfully added: ${data.title} (ID: ${data.id})`);
            addedCount++;
          }
        } catch (err: any) {
          console.error(`💥 Exception adding title ${i}:`, err);
          errors.push(`Title ${i}: ${err.message}`);
        }

        // Update progress
        setState(prev => ({ 
          ...prev, 
          currentCount: addedCount,
          errors: errors 
        }));

        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Get final count
      const { count: afterCount } = await supabase
        .from('titles')
        .select('id', { count: 'exact' });

      const totalGrowth = (afterCount || 0) - (beforeCount || 0);
      
      console.log(`🎉 DIRECT ADD COMPLETE!`);
      console.log(`📊 Before: ${beforeCount}, After: ${afterCount}, Growth: ${totalGrowth}`);
      console.log(`✅ Successfully added: ${addedCount}/10 titles`);

      setState(prev => ({
        ...prev,
        afterCount: afterCount || 0,
        currentCount: totalGrowth,
        isRunning: false,
        success: totalGrowth >= 10,
        errors: errors
      }));

    } catch (error: any) {
      console.error('💥 Direct add failed:', error);
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, `Direct add failed: ${error.message}`],
        isRunning: false
      }));
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Plus className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-400">
              Direct Database Add Test
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300 font-normal">
              Adding 10 titles directly using Supabase client
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
          {state.isRunning ? (
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          ) : state.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={state.isRunning ? "default" : "secondary"}>
                {state.isRunning ? "🔄 ADDING" : state.success ? "✅ SUCCESS" : "⏹️ READY"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {state.targetCount} new titles | Added: {state.currentCount}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center p-4 bg-white/30 dark:bg-black/10 rounded-lg">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {state.currentCount} / {state.targetCount}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-300">
            Titles Added
          </div>
          {state.beforeCount > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              Before: {state.beforeCount} → After: {state.afterCount}
            </div>
          )}
          {state.success && (
            <Badge className="mt-2 bg-green-600">🎉 TARGET REACHED!</Badge>
          )}
        </div>

        {/* Add button */}
        <Button 
          onClick={addTitlesDirectly}
          disabled={state.isRunning}
          className="w-full"
          variant="default"
        >
          {state.isRunning ? 'Adding Titles...' : 'Add 10 Titles Directly'}
        </Button>

        {/* Errors */}
        {state.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <h5 className="font-medium text-red-800 dark:text-red-400 mb-2">
              Issues ({state.errors.length})
            </h5>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {state.errors.slice(-3).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};