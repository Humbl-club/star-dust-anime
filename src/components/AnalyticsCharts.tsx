import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Sparkles,
  BookOpen,
  Play,
  Eye,
  Star
} from 'lucide-react';
import { AnalyticsChartsProps, StatCardProps } from '@/types/components';

export const AnalyticsCharts = ({ analytics }: AnalyticsChartsProps) => {
  if (!analytics) return null;

  const { userActivity, contentStats, searchAnalytics, recommendations } = analytics;

  // Color palette for charts
  const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

  // Mock data for trends
  const userGrowthData = [
    { month: 'Jan', users: 150 },
    { month: 'Feb', users: 280 },
    { month: 'Mar', users: 420 },
    { month: 'Apr', users: 680 },
    { month: 'May', users: 950 },
    { month: 'Jun', users: 1200 }
  ];

  const contentTypeData = [
    { name: 'Anime', value: contentStats.totalAnime, color: colors[0] },
    { name: 'Manga', value: contentStats.totalManga, color: colors[1] }
  ];

  const searchTypeData = [
    { name: 'Database Search', value: searchAnalytics.totalSearches - searchAnalytics.aiSearches },
    { name: 'AI Enhanced', value: searchAnalytics.aiSearches }
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: StatCardProps) => (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{value.toLocaleString()}</h3>
              {trend && (
                <Badge variant={trend > 0 ? 'default' : 'destructive'} className="text-xs">
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={userActivity.totalUsers}
          subtitle={`${userActivity.newUsers} new this month`}
          icon={Users}
          trend={userActivity.userGrowth}
        />
        <StatCard
          title="Active Users"
          value={userActivity.activeUsers}
          subtitle="Last 30 days"
          icon={Eye}
          trend={15.2}
        />
        <StatCard
          title="Total Searches"
          value={searchAnalytics.totalSearches}
          subtitle={`${searchAnalytics.aiSearches} AI enhanced`}
          icon={Search}
          trend={8.3}
        />
        <StatCard
          title="Recommendations"
          value={recommendations.totalRecommendations}
          subtitle={`${recommendations.clickThroughRate}% CTR`}
          icon={Sparkles}
          trend={12.7}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Distribution */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Content Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {contentTypeData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Analytics */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">
                  {searchAnalytics.searchSuccessRate}%
                </span>
              </div>
              <Progress value={searchAnalytics.searchSuccessRate} className="h-2" />
            </div>

            <div>
              <h4 className="font-medium mb-3">Popular Search Terms</h4>
              <div className="space-y-2">
                {searchAnalytics.popularQueries.map((query: string, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{query}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(Math.random() * 500) + 100}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={searchTypeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Popular Content */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Most Popular Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentStats.mostPopular.slice(0, 8).map((anime, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  {anime.image_url && (
                    <img 
                      src={anime.image_url} 
                      alt={anime.title}
                      className="w-8 h-10 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{anime.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ★ {anime.score || 'N/A'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {anime.popularity?.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Insights */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recommendation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {recommendations.clickThroughRate}%
              </div>
              <div className="text-sm text-muted-foreground">Click-through Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">85%</div>
              <div className="text-sm text-muted-foreground">Accuracy Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">2.4</div>
              <div className="text-sm text-muted-foreground">Avg Items/User</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">67%</div>
              <div className="text-sm text-muted-foreground">User Satisfaction</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Top Recommended Genres</h4>
            <div className="flex flex-wrap gap-2">
              {recommendations.topRecommendedGenres.map((genre: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};