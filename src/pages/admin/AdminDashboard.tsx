import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, Users, Database, Settings, 
  AlertTriangle, Activity, TrendingUp 
} from 'lucide-react';
import { AdminStats } from '@/components/admin/AdminStats';
import { ContentManager } from '@/components/admin/ContentManager';
import { UserManager } from '@/components/admin/UserManager';
import { SystemHealth } from '@/components/admin/SystemHealth';
import { PendingMatchesManager } from '@/components/admin/PendingMatchesManager';
import { AdminRoute } from '@/components/AdminRoute';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage content, users, and system health</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-5 w-full max-w-4xl">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pending Matches
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <AdminStats />
            </TabsContent>
            
            <TabsContent value="content">
              <ContentManager />
            </TabsContent>
            
            <TabsContent value="matches">
              <PendingMatchesManager />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManager />
            </TabsContent>
            
            <TabsContent value="system">
              <SystemHealth />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminRoute>
  );
}