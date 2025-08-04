import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, Loader2 } from 'lucide-react';
import { runProductionChecks } from '@/scripts/pre-production-check';
import { toast } from 'sonner';

interface CheckResult {
  database: boolean;
  edgeFunctions: boolean;
  authentication: boolean;
  dataPopulation: boolean;
  performance: boolean;
  materializedViews: boolean;
  indexes: boolean;
}

export function ProductionChecklist() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CheckResult | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = async () => {
    setIsRunning(true);
    try {
      const checkResults = await runProductionChecks();
      setResults(checkResults);
      setLastRun(new Date());
      
      const passedCount = Object.values(checkResults).filter(Boolean).length;
      const totalCount = Object.keys(checkResults).length;
      
      if (passedCount === totalCount) {
        toast.success('All production checks passed! 🚀');
      } else if (passedCount >= totalCount - 1) {
        toast.warning(`${passedCount}/${totalCount} checks passed. Almost ready!`);
      } else {
        toast.error(`Only ${passedCount}/${totalCount} checks passed. Needs attention.`);
      }
    } catch (error) {
      toast.error('Failed to run production checks');
      console.error('Production checks failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Not Run</Badge>;
    return status ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge> : 
      <Badge variant="destructive">Fail</Badge>;
  };

  const checks = [
    { key: 'database', label: 'Database Connectivity', description: 'Can connect to Supabase database' },
    { key: 'edgeFunctions', label: 'Edge Functions', description: 'Critical edge functions are working' },
    { key: 'authentication', label: 'Authentication System', description: 'Auth system is operational' },
    { key: 'dataPopulation', label: 'Data Population', description: 'Database has anime/manga content' },
    { key: 'performance', label: 'Performance', description: 'Queries complete in reasonable time' },
    { key: 'materializedViews', label: 'Materialized Views', description: 'Trending content views are working' },
    { key: 'indexes', label: 'Database Indexes', description: 'Indexes are optimizing queries' },
  ];

  const overallStatus = results ? 
    Object.values(results).every(Boolean) ? 'ready' : 
    Object.values(results).filter(Boolean).length >= Object.keys(results).length - 1 ? 'mostly' : 'not-ready'
    : null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Production Readiness Checklist</CardTitle>
            <p className="text-muted-foreground mt-2">
              Verify your application is ready for production deployment
            </p>
          </div>
          <Button onClick={runChecks} disabled={isRunning} size="lg">
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Checks
              </>
            )}
          </Button>
        </div>
        
        {lastRun && (
          <p className="text-sm text-muted-foreground">
            Last run: {lastRun.toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {overallStatus && (
          <div className={`p-4 rounded-lg border-2 ${
            overallStatus === 'ready' ? 'bg-green-50 border-green-200' :
            overallStatus === 'mostly' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {overallStatus === 'ready' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : overallStatus === 'mostly' ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={`font-semibold ${
                overallStatus === 'ready' ? 'text-green-800' :
                overallStatus === 'mostly' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                {overallStatus === 'ready' ? '✅ Ready for Production!' :
                 overallStatus === 'mostly' ? '⚠️ Mostly Ready (Minor Issues)' :
                 '❌ Not Ready for Production'}
              </span>
            </div>
          </div>
        )}
        
        <div className="grid gap-3">
          {checks.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(results?.[key as keyof CheckResult] ?? null)}
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
              {getStatusBadge(results?.[key as keyof CheckResult] ?? null)}
            </div>
          ))}
        </div>
        
        {results && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Production Deployment Notes:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• All database migrations have been applied automatically</li>
              <li>• Edge functions are deployed with your code</li>
              <li>• Materialized views refresh automatically via cron jobs</li>
              <li>• Performance monitoring is active in production</li>
              <li>• Lovable handles SSL certificates and CDN automatically</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}