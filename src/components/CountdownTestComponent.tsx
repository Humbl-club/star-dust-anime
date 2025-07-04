import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CountdownDisplay } from "./CountdownDisplay";
import { CountdownGrid } from "./CountdownGrid";
import { PersonalizedCountdowns } from "./PersonalizedCountdowns";
import { countdownService, CountdownData } from "@/services/countdownService";
import { toast } from "sonner";
import { Timer, TestTube, Plus, Calendar, Zap } from "lucide-react";

export const CountdownTestComponent = () => {
  const [testTitle, setTestTitle] = useState("Test Anime Episode");
  const [testMinutes, setTestMinutes] = useState(5);
  const [customCountdowns, setCustomCountdowns] = useState<CountdownData[]>([]);

  const createTestCountdown = () => {
    const releaseDate = new Date();
    releaseDate.setMinutes(releaseDate.getMinutes() + testMinutes);

    const countdown: CountdownData = {
      id: `test-${Date.now()}`,
      title: testTitle,
      type: 'anime',
      releaseDate,
      episodeNumber: Math.floor(Math.random() * 24) + 1,
      status: 'upcoming',
      timeZone: 'UTC'
    };

    setCustomCountdowns(prev => [...prev, countdown]);
    toast.success(`Test countdown created for ${testMinutes} minutes from now!`);
  };

  const createLiveCountdown = () => {
    const releaseDate = new Date();
    releaseDate.setSeconds(releaseDate.getSeconds() - 30); // 30 seconds ago (live)

    const countdown: CountdownData = {
      id: `live-${Date.now()}`,
      title: "Live Release Test",
      type: 'manga',
      releaseDate,
      chapterNumber: 42,
      status: 'live',
      timeZone: 'UTC'
    };

    setCustomCountdowns(prev => [...prev, countdown]);
    toast.success("Live countdown created!");
  };

  const clearCustomCountdowns = () => {
    // Clean up any registered countdowns
    customCountdowns.forEach(countdown => {
      countdownService.unregisterCountdown(countdown.id);
    });
    
    setCustomCountdowns([]);
    toast.success("Custom countdowns cleared!");
  };

  const testNotificationMessage = () => {
    const testCountdown: CountdownData = {
      id: 'notification-test',
      title: 'Attack on Titan Final Season',
      type: 'anime',
      releaseDate: new Date(),
      episodeNumber: 24,
      status: 'live',
      timeZone: 'UTC'
    };

    const timeRemaining = countdownService.calculateTimeRemaining(testCountdown.releaseDate);
    const message = countdownService.generateNotificationMessage(testCountdown, timeRemaining);
    
    toast.success(message, { duration: 10000 });
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Phase 6: Countdown Timer Testing
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Create Test Countdown */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Create Test Countdown
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title:</label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter countdown title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Minutes from now:</label>
                <Input
                  type="number"
                  value={testMinutes}
                  onChange={(e) => setTestMinutes(parseInt(e.target.value) || 1)}
                  min="1"
                  max="60"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={createTestCountdown} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Test Countdown
              </Button>
              
              <Button onClick={createLiveCountdown} variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Create Live Test
              </Button>
              
              <Button onClick={testNotificationMessage} variant="ghost" size="sm">
                Test Notification
              </Button>
            </div>
          </div>

          {/* Custom Countdowns Display */}
          {customCountdowns.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Test Countdowns</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {customCountdowns.length} active
                  </Badge>
                  <Button onClick={clearCustomCountdowns} variant="ghost" size="sm">
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {customCountdowns.map((countdown, index) => (
                  <div 
                    key={countdown.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CountdownDisplay 
                      countdown={countdown}
                      showNotifications={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm">System Information</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">User Timezone:</span>
                <p className="text-muted-foreground">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
              <div>
                <span className="font-medium">Current Offset:</span>
                <p className="text-muted-foreground">
                  {countdownService.getTimeZoneOffset()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Countdown Grid Component */}
      <CountdownGrid 
        maxItems={6}
        showSearch={true}
        showFilter={true}
        autoRefresh={true}
      />

      {/* Personalized Countdowns */}
      <PersonalizedCountdowns />
    </div>
  );
};