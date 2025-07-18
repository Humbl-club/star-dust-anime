import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsStore } from "@/stores/settingsStore";
import { useToast } from "@/hooks/use-toast";
import { initializePerformanceOptimizations, clearPerformanceObservers } from "@/utils/performanceOptimizations";
import { 
  Code, 
  Database, 
  Zap, 
  Bug, 
  Trash2, 
  AlertTriangle,
  Cpu,
  HardDrive,
  Clock,
  Activity
} from "lucide-react";

export const AdvancedSettings = () => {
  const { toast } = useToast();
  const { settings, updateAdvanced, resetCategory, exportSettings } = useSettingsStore();
  const { advanced } = settings;
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [performanceMonitoring, setPerformanceMonitoring] = useState(
    localStorage.getItem('enable-performance-monitoring') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('enable-performance-monitoring', performanceMonitoring.toString());
  }, [performanceMonitoring]);

  const handlePerformanceToggle = (enabled: boolean) => {
    setPerformanceMonitoring(enabled);
    
    if (enabled) {
      initializePerformanceOptimizations();
      toast({
        title: "Performance monitoring enabled",
        description: "Web vitals and performance metrics are now being tracked.",
      });
    } else {
      clearPerformanceObservers();
      toast({
        title: "Performance monitoring disabled", 
        description: "Performance tracking has been stopped.",
      });
    }
  };

  const handleClearCache = () => {
    // Clear various caches
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB caches if any
    if ('indexedDB' in window) {
      // Implementation would go here
    }
    
    toast({
      title: "Cache cleared",
      description: "All cached data has been removed. The app will reload.",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getDebugInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      currentSettings: settings,
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
      timestamp: new Date().toISOString(),
    };
  };

  const copyDebugInfo = () => {
    const debugInfo = JSON.stringify(getDebugInfo(), null, 2);
    navigator.clipboard.writeText(debugInfo);
    toast({
      title: "Debug info copied",
      description: "Debug information has been copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Performance */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Performance
          </CardTitle>
          <CardDescription>
            Optimize app performance and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="virtualScrolling">Virtual Scrolling</Label>
              <p className="text-sm text-muted-foreground">
                Enable virtual scrolling for large lists to improve performance
              </p>
            </div>
            <Switch
              id="virtualScrolling"
              checked={advanced.virtualScrolling}
              onCheckedChange={(checked) => updateAdvanced({ virtualScrolling: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="performanceMonitoring">Performance Monitoring</Label>
              <p className="text-sm text-muted-foreground">
                Enable Web Vitals tracking and performance metrics
              </p>
            </div>
            <Switch
              id="performanceMonitoring"
              checked={performanceMonitoring}
              onCheckedChange={handlePerformanceToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="preloadImages">Preload Images</Label>
              <p className="text-sm text-muted-foreground">
                Preload images for smoother browsing experience
              </p>
            </div>
            <Switch
              id="preloadImages"
              checked={advanced.preloadImages}
              onCheckedChange={(checked) => updateAdvanced({ preloadImages: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cacheSize">Cache Size (MB)</Label>
            <div className="px-3">
              <Slider
                value={[advanced.cacheSize]}
                onValueChange={(value) => updateAdvanced({ cacheSize: value[0] })}
                max={500}
                min={50}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>50MB</span>
                <span>{advanced.cacheSize}MB</span>
                <span>500MB</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
            <div className="px-3">
              <Slider
                value={[advanced.syncInterval]}
                onValueChange={(value) => updateAdvanced({ syncInterval: value[0] })}
                max={120}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>5 min</span>
                <span>{advanced.syncInterval} min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Options */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Developer Options
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
              Advanced
            </Badge>
          </CardTitle>
          <CardDescription>
            Options for developers and advanced users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="debugMode">Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable debug logging and development features
              </p>
            </div>
            <Switch
              id="debugMode"
              checked={advanced.debugMode}
              onCheckedChange={(checked) => updateAdvanced({ debugMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="experimentalFeatures">Experimental Features</Label>
              <p className="text-sm text-muted-foreground">
                Enable experimental features (may be unstable)
              </p>
            </div>
            <Switch
              id="experimentalFeatures"
              checked={advanced.experimentalFeatures}
              onCheckedChange={(checked) => updateAdvanced({ experimentalFeatures: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Debug Information</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Bug className="w-4 h-4 mr-2" />
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </Button>
            </div>
            
            {showDebugInfo && (
              <div className="space-y-2">
                <Textarea
                  value={JSON.stringify(getDebugInfo(), null, 2)}
                  readOnly
                  className="h-40 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDebugInfo}
                  className="w-full"
                >
                  Copy Debug Info
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your data and storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Cache Size</p>
                <p className="text-sm text-muted-foreground">{advanced.cacheSize}MB allocated</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/50">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sync Frequency</p>
                <p className="text-sm text-muted-foreground">Every {advanced.syncInterval} minutes</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleClearCache}
            className="w-full border-orange-500/50 text-orange-300 hover:bg-orange-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Cache & Data
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10">
            <h3 className="font-medium text-destructive mb-2">Account Deletion</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                toast({
                  title: "Feature not implemented",
                  description: "Account deletion is not yet available. Contact support if needed.",
                });
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Reset Advanced Settings</h3>
              <p className="text-sm text-muted-foreground">
                Restore all advanced settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => resetCategory('advanced')}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};