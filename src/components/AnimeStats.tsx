import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Play, 
  Heart, 
  Star, 
  TrendingUp,
  BarChart3,
  Clock,
  Calendar,
  Award,
  Zap
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface AnimeStatsProps {
  anime: any;
  detailedStats?: any;
}

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

export const AnimeStats = ({ anime, detailedStats }: AnimeStatsProps) => {
  const mockStats = {
    watching_count: 45230,
    completed_count: 187450,
    on_hold_count: 12340,
    dropped_count: 8920,
    plan_to_watch_count: 98760,
    score_distribution: {
      "10": 28450,
      "9": 35670,
      "8": 42380,
      "7": 35200,
      "6": 18930,
      "5": 8420,
      "4": 3280,
      "3": 1560,
      "2": 890,
      "1": 1220
    },
    age_demographics: {
      "13-17": 18.5,
      "18-24": 42.3,
      "25-34": 28.7,
      "35-44": 8.2,
      "45+": 2.3
    },
    gender_demographics: {
      "Male": 65.4,
      "Female": 32.1,
      "Other": 2.5
    },
    seasonal_popularity: {
      "Winter 2023": 8.2,
      "Spring 2023": 9.1,
      "Summer 2023": 8.7,
      "Fall 2023": 8.9,
      "Winter 2024": 9.3,
      "Spring 2024": 9.4
    }
  };

  const stats = detailedStats || mockStats;

  const statusData = [
    { name: 'Completed', value: stats.completed_count, color: '#22c55e' },
    { name: 'Watching', value: stats.watching_count, color: '#3b82f6' },
    { name: 'Plan to Watch', value: stats.plan_to_watch_count, color: '#eab308' },
    { name: 'On Hold', value: stats.on_hold_count, color: '#f97316' },
    { name: 'Dropped', value: stats.dropped_count, color: '#ef4444' },
  ];

  const scoreData = Object.entries(stats.score_distribution).map(([score, count]) => ({
    score: `${score}/10`,
    count: count as number
  })).reverse();

  const ageData = Object.entries(stats.age_demographics).map(([age, percentage]) => ({
    age,
    percentage: percentage as number
  }));

  const genderData = Object.entries(stats.gender_demographics).map(([gender, percentage]) => ({
    gender,
    percentage: percentage as number,
    color: gender === 'Male' ? '#3b82f6' : gender === 'Female' ? '#ec4899' : '#8b5cf6'
  }));

  const totalUsers = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Community Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statusData.map((item) => (
              <div key={item.name} className="text-center p-4 rounded-lg bg-muted/20">
                <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
                  {(item.value / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((item.value / totalUsers) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores">Score Distribution</TabsTrigger>
          <TabsTrigger value="status">Watch Status</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="trends">Popularity Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="score" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Watch Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage?.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [(value / 1000).toFixed(0) + 'K', '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Age Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ageData.map((item) => (
                    <div key={item.age} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.age}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="percentage"
                        label={({ gender, percentage }) => `${gender} ${percentage}%`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value.toFixed(1) + '%', '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Seasonal Popularity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(stats.seasonal_popularity).map(([season, score]) => ({ season, score }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="season" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};