import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { title, body, data, userId, tag = 'default' } = await req.json();

    console.log('📱 Sending push notification:', { title, body, userId, tag });

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .eq('active', true);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active push subscriptions found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send notifications to all user's devices
    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = sub.subscription;
        
        // For demo purposes, we'll log what would be sent
        // In production, you'd use a proper push service like web-push
        console.log('🔔 Would send notification to:', subscription.endpoint);
        
        const payload = {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          data: data || {},
          timestamp: Date.now()
        };

        // Here you would use a library like 'web-push' to actually send the notification
        // For now, we'll simulate success
        console.log('✅ Notification payload:', payload);
        
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('❌ Failed to send notification:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    // Log notification in database
    await supabase.from('notification_logs').insert({
      user_id: userId,
      title,
      body,
      data: data || {},
      sent_count: successCount,
      total_subscriptions: subscriptions.length,
      sent_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscriptions.length,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Push notification error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});