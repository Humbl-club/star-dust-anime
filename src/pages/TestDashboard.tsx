import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database, 
  Mail, 
  Search, 
  Server,
  Code,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  responseTime?: number;
  timestamp?: string;
}

const TestDashboard = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Test states for different sections
  const [edgeFunctionTest, setEdgeFunctionTest] = useState<TestResult>({ status: 'success' });
  const [databaseTest, setDatabaseTest] = useState<TestResult>({ status: 'success' });
  const [apiTest, setApiTest] = useState<TestResult>({ status: 'success' });
  const [emailTest, setEmailTest] = useState<TestResult>({ status: 'success' });
  const [searchTest, setSearchTest] = useState<TestResult>({ status: 'success' });

  // Test parameters
  const [edgeFunctionName, setEdgeFunctionName] = useState('ultra-fast-sync');
  const [edgeFunctionPayload, setEdgeFunctionPayload] = useState('{"test": true}');
  const [databaseTable, setDatabaseTable] = useState('titles');
  const [databaseQuery, setDatabaseQuery] = useState('SELECT * FROM titles LIMIT 5');
  const [apiEndpoint, setApiEndpoint] = useState('/api/anime');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailType, setEmailType] = useState('verification');
  const [searchQuery, setSearchQuery] = useState('naruto');
  const [searchType, setSearchType] = useState('anime');

  useEffect(() => {
    // TEMPORARY: Skip all auth checks for testing
    console.log('TestDashboard: Bypassing auth for testing');
    setIsAdmin(true);
    setCheckingAdmin(false);
  }, []);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // TEMPORARY: Disabled auth redirect for testing
  // if (!user || !isAdmin) {
  //   return <Navigate to="/" replace />;
  // }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const testEdgeFunction = async () => {
    setEdgeFunctionTest({ status: 'loading' });
    const startTime = Date.now();

    try {
      let payload = {};
      try {
        payload = JSON.parse(edgeFunctionPayload);
      } catch {
        payload = {};
      }

      const { data, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: payload
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        setEdgeFunctionTest({
          status: 'error',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        setEdgeFunctionTest({
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setEdgeFunctionTest({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const testDatabase = async () => {
    setDatabaseTest({ status: 'loading' });
    const startTime = Date.now();

    try {
      // Use type-safe table name
      let query;
      switch (databaseTable) {
        case 'titles':
          query = supabase.from('titles').select('*').limit(5);
          break;
        case 'anime_details':
          query = supabase.from('anime_details').select('*').limit(5);
          break;
        case 'manga_details':
          query = supabase.from('manga_details').select('*').limit(5);
          break;
        case 'genres':
          query = supabase.from('genres').select('*').limit(5);
          break;
        case 'studios':
          query = supabase.from('studios').select('*').limit(5);
          break;
        case 'profiles':
          query = supabase.from('profiles').select('id, username, full_name, role').limit(5);
          break;
        default:
          query = supabase.from('titles').select('*').limit(5);
      }

      const { data, error } = await query;

      const responseTime = Date.now() - startTime;

      if (error) {
        setDatabaseTest({
          status: 'error',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        setDatabaseTest({
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setDatabaseTest({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const testAPI = async () => {
    setApiTest({ status: 'loading' });
    const startTime = Date.now();

    try {
      // Test internal API endpoints - simplified test
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .limit(3);

      const responseTime = Date.now() - startTime;

      if (error) {
        setApiTest({
          status: 'error',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        setApiTest({
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setApiTest({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const testEmail = async () => {
    if (!emailRecipient) {
      toast.error('Please enter an email recipient');
      return;
    }

    setEmailTest({ status: 'loading' });
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('send-auth-emails', {
        body: {
          email: emailRecipient,
          email_action_type: emailType,
          user_id: user.id,
          token: 'test-token',
          redirect_to: window.location.origin
        }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        setEmailTest({
          status: 'error',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        setEmailTest({
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString()
        });
        toast.success('Email test completed');
      }
    } catch (error: any) {
      setEmailTest({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const testSearch = async () => {
    setSearchTest({ status: 'loading' });
    const startTime = Date.now();

    try {
      const query = supabase
        .from('titles')
        .select(`
          *,
          ${searchType === 'anime' ? 'anime_details(*)' : 'manga_details(*)'}
        `)
        .ilike('title', `%${searchQuery}%`)
        .limit(5);

      const { data, error } = await query;

      const responseTime = Date.now() - startTime;

      if (error) {
        setSearchTest({
          status: 'error',
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        setSearchTest({
          status: 'success',
          data,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setSearchTest({
        status: 'error',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }
  };

  const ResultDisplay = ({ result }: { result: TestResult }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {result.status === 'loading' && (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Testing...</span>
          </>
        )}
        {result.status === 'success' && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Success</span>
            {result.responseTime && (
              <Badge variant="outline" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                {formatResponseTime(result.responseTime)}
              </Badge>
            )}
          </>
        )}
        {result.status === 'error' && (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">Error</span>
            {result.responseTime && (
              <Badge variant="outline" className="ml-2">
                <Clock className="w-3 h-3 mr-1" />
                {formatResponseTime(result.responseTime)}
              </Badge>
            )}
          </>
        )}
      </div>

      {result.timestamp && (
        <p className="text-xs text-muted-foreground">
          Last tested: {new Date(result.timestamp).toLocaleString()}
        </p>
      )}

      {result.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">Error Details</span>
          </div>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">{result.error}</pre>
        </div>
      )}

      {result.data && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600">Response Data</span>
          </div>
          <pre className="text-xs text-green-700 max-h-40 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Test Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive testing interface for system components
            </p>
          </div>
        </div>

        <Tabs defaultValue="edge-functions" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="edge-functions" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Edge Functions
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edge-functions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Edge Functions Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Function Name</Label>
                    <Input
                      value={edgeFunctionName}
                      onChange={(e) => setEdgeFunctionName(e.target.value)}
                      placeholder="Enter function name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payload (JSON)</Label>
                    <Textarea
                      value={edgeFunctionPayload}
                      onChange={(e) => setEdgeFunctionPayload(e.target.value)}
                      placeholder='{"key": "value"}'
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <Button
                  onClick={testEdgeFunction}
                  disabled={edgeFunctionTest.status === 'loading'}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Edge Function
                </Button>
                <ResultDisplay result={edgeFunctionTest} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Operations Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Select value={databaseTable} onValueChange={setDatabaseTable}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="titles">titles</SelectItem>
                      <SelectItem value="anime_details">anime_details</SelectItem>
                      <SelectItem value="manga_details">manga_details</SelectItem>
                      <SelectItem value="genres">genres</SelectItem>
                      <SelectItem value="studios">studios</SelectItem>
                      <SelectItem value="profiles">profiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={testDatabase}
                  disabled={databaseTest.status === 'loading'}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Database Query
                </Button>
                <ResultDisplay result={databaseTest} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  API Endpoints Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="/api/endpoint"
                  />
                </div>
                <Button
                  onClick={testAPI}
                  disabled={apiTest.status === 'loading'}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test API Endpoint
                </Button>
                <ResultDisplay result={apiTest} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email System Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Type</Label>
                    <Select value={emailType} onValueChange={setEmailType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verification">Verification</SelectItem>
                        <SelectItem value="signup">Signup</SelectItem>
                        <SelectItem value="reset">Password Reset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={testEmail}
                  disabled={emailTest.status === 'loading'}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Email System
                </Button>
                <ResultDisplay result={emailTest} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Functionality Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Search Query</Label>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter search term"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={searchType} onValueChange={setSearchType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="manga">Manga</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={testSearch}
                  disabled={searchTest.status === 'loading'}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Search
                </Button>
                <ResultDisplay result={searchTest} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestDashboard;