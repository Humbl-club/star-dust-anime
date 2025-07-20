import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalyticsCharts } from '@/components/features/AnalyticsCharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  BarChart3, 
  RefreshCw, 
  Download, 
  TrendingUp,
  Users,
  Search,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Analytics = () => {
  const { analytics, loading, refreshAnalytics } = useAnalytics();
  const [activeTab, setActiveTab] = useState('overview');

  const handleExport = () => {
    // Mock export functionality
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation onSearch={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation onSearch={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient-primary mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive insights into user behavior and content performance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              Last updated: {new Date().toLocaleDateString()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAnalytics}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {analytics ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI & Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AnalyticsCharts analytics={analytics} />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Users</span>
                      <span className="font-bold">{analytics.userActivity.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <span className="font-bold text-primary">{analytics.userActivity.activeUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Users (30d)</span>
                      <span className="font-bold text-secondary">{analytics.userActivity.newUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Growth Rate</span>
                      <Badge variant="default" className="text-xs">
                        +{analytics.userActivity.userGrowth.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Session Time</span>
                      <span className="font-bold">12m 34s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bounce Rate</span>
                      <span className="font-bold">32.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Return Visitors</span>
                      <span className="font-bold text-primary">68.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pages/Session</span>
                      <span className="font-bold">4.2</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Mobile</span>
                        <span className="text-sm font-bold">64%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '64%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Desktop</span>
                        <span className="text-sm font-bold">36%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full" style={{ width: '36%' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Search Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Searches</span>
                      <span className="font-bold">{analytics.searchAnalytics.totalSearches.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">AI Enhanced</span>
                      <span className="font-bold text-primary">{analytics.searchAnalytics.aiSearches.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <Badge variant="default">{analytics.searchAnalytics.searchSuccessRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Results</span>
                      <span className="font-bold">12.4</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Popular Search Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.searchAnalytics.popularQueries.map((query: string, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{query}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${100 - index * 15}%` }} 
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 500) + 100}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{analytics.recommendations.totalRecommendations.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Recommendations</div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <div className="text-2xl font-bold">{analytics.recommendations.clickThroughRate}%</div>
                    <div className="text-sm text-muted-foreground">Click-through Rate</div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold">85%</div>
                    <div className="text-sm text-muted-foreground">User Satisfaction</div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">2.4</div>
                    <div className="text-sm text-muted-foreground">Avg per User</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>AI Cost Optimization Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">87%</div>
                      <div className="text-sm text-muted-foreground">Cost Reduction</div>
                      <div className="text-xs text-muted-foreground mt-1">vs Pure AI approach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">94%</div>
                      <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                      <div className="text-xs text-muted-foreground mt-1">24h cache duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary">76%</div>
                      <div className="text-sm text-muted-foreground">Hybrid Success</div>
                      <div className="text-xs text-muted-foreground mt-1">AI + Algorithmic mix</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-destructive/20">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
              <p className="text-muted-foreground mb-4">
                Unable to load analytics data. Please try refreshing or contact support.
              </p>
              <Button onClick={refreshAnalytics} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;