import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DirectSyncTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testDirectSync = async () => {
    setTesting(true);
    setResult('Testing...');
    
    console.log('🧪 DIRECT TEST: Testing ultra-fast-sync with minimal params...');
    
    try {
      // Get initial count
      const { data: initialCount } = await supabase
        .from('titles')
        .select('id', { count: 'exact' });
      
      console.log(`🧪 Initial count: ${initialCount?.length || 0}`);
      setResult(`Initial count: ${initialCount?.length || 0}\nTesting sync...`);

      const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: 'anime', maxPages: 1 }
      });
      
      console.log('🧪 Direct test result:', { data, error });
      
      if (error) {
        setResult(`❌ Error: ${error.message}`);
        console.error('❌ Direct test error:', error);
      } else if (data) {
        // Check if count increased
        const { data: finalCount } = await supabase
          .from('titles')
          .select('id', { count: 'exact' });
        
        const growth = (finalCount?.length || 0) - (initialCount?.length || 0);
        setResult(`✅ Success! Added ${growth} titles\nResult: ${JSON.stringify(data, null, 2)}`);
        console.log('✅ Direct test success:', data);
      } else {
        setResult('⚠️ No data returned');
      }
    } catch (err: any) {
      setResult(`💥 Exception: ${err.message}`);
      console.error('💥 Direct test exception:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle>🧪 Direct Function Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDirectSync}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test ultra-fast-sync Function'}
        </Button>
        
        {result && (
          <div className="p-3 bg-white dark:bg-black/20 rounded-lg">
            <pre className="text-xs overflow-auto">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};