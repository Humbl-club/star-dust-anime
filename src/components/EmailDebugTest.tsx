
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const EmailDebugTest = () => {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testEmailFunction = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to test the email function",
        variant: "destructive",
      });
      return;
    }

    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addLog(`Testing email function with: ${testEmail}`);
    addLog(`Using user ID: ${user.id}`);

    try {
      addLog('Calling send-auth-emails function...');
      
      const { data, error } = await supabase.functions.invoke('send-auth-emails', {
        body: {
          email: testEmail,
          user_id: user.id, // Use actual user ID instead of test-user-id
          email_action_type: 'signup'
        }
      });

      if (error) {
        addLog(`Function error: ${error.message}`);
        toast({
          title: "Function Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        addLog(`Function success: ${JSON.stringify(data)}`);
        toast({
          title: "Success!",
          description: "Email function executed successfully",
        });
      }
    } catch (error) {
      addLog(`Exception: ${error}`);
      toast({
        title: "Exception",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testResendVerification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addLog(`Testing resend verification for user: ${user.id}`);

    try {
      addLog('Calling resend_verification_email function...');
      
      const { data, error } = await supabase.rpc('resend_verification_email', {
        user_id_param: user.id
      });

      if (error) {
        addLog(`Database function error: ${error.message}`);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        addLog(`Database function success: ${JSON.stringify(data)}`);
        toast({
          title: "Success!",
          description: "Verification email resent successfully",
        });
      }
    } catch (error) {
      addLog(`Exception: ${error}`);
      toast({
        title: "Exception",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Please sign in to test the email functions.</p>
            <Button onClick={() => window.location.href = '/auth'} className="mt-4">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email System Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="testEmail" className="block text-sm font-medium mb-2">
              Test Email Address
            </label>
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testEmailFunction} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Testing...' : 'Test Email Function'}
            </Button>
            
            <Button 
              onClick={testResendVerification} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? 'Testing...' : 'Test Resend Verification'}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Current User:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Run a test to see logs.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => setLogs([])} 
            variant="outline" 
            className="mt-4"
          >
            Clear Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
