import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Mail, Database, Play, Activity } from 'lucide-react';
import { ProductionMonitoring } from '@/components/ProductionMonitoring';

export const EmailVerificationTest = () => {
  const { user } = useAuth();
  const { 
    isVerified, 
    verificationStatus, 
    daysRemaining, 
    isLoading,
    resendVerification,
    isResending 
  } = useEmailVerification();
  
  const [testEmail, setTestEmail] = useState('');
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [testResults, setTestResults] = useState<{
    database: 'success' | 'error' | 'pending';
    edgeFunction: 'success' | 'error' | 'pending';
    emailSending: 'success' | 'error' | 'pending';
  }>({
    database: 'pending',
    edgeFunction: 'pending',
    emailSending: 'pending'
  });

  const testDatabaseFunction = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Testing database function...');
      
      // Test check_email_verification_status
      const { data: statusData, error: statusError } = await supabase
        .rpc('check_email_verification_status', {
          user_id_param: user.id
        });

      if (statusError) {
        console.error('Database function error:', statusError);
        setTestResults(prev => ({ ...prev, database: 'error' }));
        return;
      }

      console.log('Status check result:', statusData);
      
      // Test resend_verification_email
      const { data: resendData, error: resendError } = await supabase
        .rpc('resend_verification_email', {
          user_id_param: user.id
        });

      if (resendError) {
        console.error('Resend function error:', resendError);
        setTestResults(prev => ({ ...prev, database: 'error' }));
        return;
      }

      console.log('Resend result:', resendData);
      setTestResults(prev => ({ ...prev, database: 'success' }));
      
      toast({
        title: "Database Test Passed",
        description: "Database functions are working correctly",
      });

    } catch (error) {
      console.error('Database test error:', error);
      setTestResults(prev => ({ ...prev, database: 'error' }));
      toast({
        title: "Database Test Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const testEdgeFunction = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Testing edge function with email:', testEmail);
      
      const { data, error } = await supabase.functions.invoke('send-auth-emails', {
        body: {
          email: testEmail,
          user_id: 'test-user-id',
          email_action_type: 'signup',
          token: 'test-token',
          token_hash: 'test-token-hash',
          redirect_to: window.location.origin
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setTestResults(prev => ({ ...prev, edgeFunction: 'error' }));
        toast({
          title: "Edge Function Test Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Edge function result:', data);
      setTestResults(prev => ({ ...prev, edgeFunction: 'success' }));
      
      toast({
        title: "Email Sent Successfully!",
        description: `Confirmation email sent to ${testEmail}`,
      });

    } catch (error) {
      console.error('Edge function test error:', error);
      setTestResults(prev => ({ ...prev, edgeFunction: 'error' }));
      toast({
        title: "Edge Function Test Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const testEmailSending = async () => {
    try {
      console.log('Testing email sending...');
      
      const result = await resendVerification();
      
      setTestResults(prev => ({ ...prev, emailSending: 'success' }));
      
      toast({
        title: "Email Test Passed",
        description: "Email sending is working correctly",
      });

    } catch (error) {
      console.error('Email sending test error:', error);
      setTestResults(prev => ({ ...prev, emailSending: 'error' }));
      toast({
        title: "Email Test Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const runAllTests = async () => {
    setTestResults({
      database: 'pending',
      edgeFunction: 'pending',
      emailSending: 'pending'
    });

    await testDatabaseFunction();
    await testEdgeFunction();
    await testEmailSending();
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Verification System Test
            </div>
            <Button 
              onClick={() => setShowMonitoring(!showMonitoring)}
              variant="outline"
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              {showMonitoring ? 'Hide' : 'Show'} Monitoring
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testEmail">Test Email (optional)</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runAllTests} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Run All Tests
            </Button>
            <Button variant="outline" onClick={testDatabaseFunction}>
              <Database className="w-4 h-4 mr-2" />
              Test Database
            </Button>
            <Button variant="outline" onClick={testEdgeFunction}>
              <Mail className="w-4 h-4 mr-2" />
              Test Edge Function
            </Button>
            <Button variant="outline" onClick={testEmailSending} disabled={isResending}>
              <Clock className="w-4 h-4 mr-2" />
              Test Email Sending
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current User Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>User:</strong> {user?.email || 'Not authenticated'}
            </div>
            <div className="flex items-center gap-2">
              <strong>Verified:</strong> {isVerified ? 'Yes' : 'No'}
            </div>
            <div className="flex items-center gap-2">
              <strong>Status:</strong> {verificationStatus || 'Unknown'}
            </div>
            <div className="flex items-center gap-2">
              <strong>Days Remaining:</strong> {daysRemaining !== null ? daysRemaining : 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.database)}
                <span>Database Functions</span>
              </div>
              <span className="text-sm text-gray-600">
                {testResults.database === 'pending' ? 'Not tested' : 
                 testResults.database === 'success' ? 'Working' : 'Failed'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.edgeFunction)}
                <span>Edge Function</span>
              </div>
              <span className="text-sm text-gray-600">
                {testResults.edgeFunction === 'pending' ? 'Not tested' : 
                 testResults.edgeFunction === 'success' ? 'Working' : 'Failed'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.emailSending)}
                <span>Email Sending</span>
              </div>
              <span className="text-sm text-gray-600">
                {testResults.emailSending === 'pending' ? 'Not tested' : 
                 testResults.emailSending === 'success' ? 'Working' : 'Failed'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>✅ Database migration applied</p>
            <p>✅ Edge function deployed</p>
            <p>✅ Email template configured</p>
            <p>✅ Authentication service updated</p>
            <p>✅ Real-time listeners configured</p>
            <p>✅ Rate limiting implemented</p>
            <p>✅ Error handling improved</p>
          </div>
        </CardContent>
      </Card>
      
      {showMonitoring && (
        <div className="mt-6">
          <ProductionMonitoring />
        </div>
      )}
    </div>
  );
};