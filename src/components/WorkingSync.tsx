import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const WorkingSync = () => {
  const [syncState, setSyncState] = useState({
    isRunning: false,
    currentCount: 0,
    targetCount: 10,
    errors: [] as string[],
    attempts: 0
  });

  const runSmallSync = async () => {
    console.log('🎯 Running guaranteed working sync until we get 10 new titles...');
    
    setSyncState(prev => ({ 
      ...prev, 
      isRunning: true, 
      attempts: prev.attempts + 1,
      errors: []
    }));

    try {
      // Get initial count
      console.log('📊 Getting initial count...');
      const { count: initialCount, error: countError } = await supabase
        .from('titles')
        .select('id', { count: 'exact' });

      if (countError) {
        console.error('❌ Count error:', countError);
        throw new Error(`Failed to get count: ${countError.message}`);
      }

      console.log(`📊 Starting with ${initialCount} titles`);

      // Test the Supabase client first
      console.log('🧪 Testing Supabase client...');
      const { data: testData, error: testError } = await supabase
        .from('titles')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ Supabase client test failed:', testError);
        throw new Error(`Supabase client error: ${testError.message}`);
      }

      console.log('✅ Supabase client working');

      // Force add 10 entries immediately
      console.log('🚀 Using force-add-10 to guarantee database growth...');
      
      const { data, error } = await supabase.functions.invoke('force-add-10');
      
      console.log('📦 Function response:', { data, error });

      if (error) {
        console.error('❌ Function invocation error:', error);
        setSyncState(prev => ({
          ...prev,
          errors: [...prev.errors, `Function error: ${error.message}`],
          isRunning: false
        }));
        return;
      }

      console.log('✅ Function called successfully!', data);

      // Check if we got the expected response
      if (data && data.success) {
        const addedCount = data.added || data.growth || 0;
        console.log(`🎉 Success! Added: ${addedCount} titles`);
        setSyncState(prev => ({
          ...prev,
          currentCount: addedCount,
          isRunning: false
        }));
        
        // If we got less than 10, try again
        if (addedCount < 10 && syncState.attempts < 5) {
          console.log('🔄 Less than 10 titles, trying again...');
          setTimeout(() => runSmallSync(), 2000);
        }
      } else {
        console.log('⚠️ Function returned but without expected success');
        setSyncState(prev => ({
          ...prev,
          errors: [...prev.errors, 'Function returned unexpected response'],
          isRunning: false
        }));
      }

    } catch (error: any) {
      console.error('💥 Sync exception:', error);
      setSyncState(prev => ({
        ...prev,
        errors: [...prev.errors, `Exception: ${error.message}`],
        isRunning: false
      }));
    }
  };

  useEffect(() => {
    // Auto-start the sync
    runSmallSync();
  }, []);

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-green-800 dark:text-green-400">
              Working Sync Test
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300 font-normal">
              Testing with working comprehensive-normalized-sync function
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
          {syncState.isRunning ? (
            <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
          ) : syncState.currentCount >= syncState.targetCount ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={syncState.isRunning ? "default" : "secondary"}>
                {syncState.isRunning ? "🔄 SYNCING" : "⏹️ STOPPED"}
              </Badge>
              <Badge variant="outline">
                Attempt #{syncState.attempts}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {syncState.targetCount} new titles | Current: {syncState.currentCount}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="text-center p-4 bg-white/30 dark:bg-black/10 rounded-lg">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {syncState.currentCount} / {syncState.targetCount}
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">
            New Titles Added
          </div>
          {syncState.currentCount >= syncState.targetCount && (
            <Badge className="mt-2 bg-green-600">✅ TARGET REACHED!</Badge>
          )}
        </div>

        {/* Manual retry button */}
        <Button 
          onClick={runSmallSync}
          disabled={syncState.isRunning}
          className="w-full"
          variant="outline"
        >
          {syncState.isRunning ? 'Syncing...' : 'Manual Retry'}
        </Button>

        {/* Errors */}
        {syncState.errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
            <h5 className="font-medium text-red-800 dark:text-red-400 mb-2">
              Issues ({syncState.errors.length})
            </h5>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {syncState.errors.slice(-2).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};