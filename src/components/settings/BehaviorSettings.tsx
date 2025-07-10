import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSettingsStore } from "@/stores/settingsStore";
import { Activity, RefreshCw, Bell, Volume2, Grid, List } from "lucide-react";

export const BehaviorSettings = () => {
  const { settings, updateBehavior, resetCategory } = useSettingsStore();
  const { behavior } = settings;

  return (
    <div className="space-y-6">
      {/* Sync & Data */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Sync & Data
          </CardTitle>
          <CardDescription>
            Control how your data is synchronized and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoSync">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync your lists and progress across devices
              </p>
            </div>
            <Switch
              id="autoSync"
              checked={behavior.autoSync}
              onCheckedChange={(checked) => updateBehavior({ autoSync: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autoAddSequels">Auto Add Sequels</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add sequels to your plan-to-watch list
              </p>
            </div>
            <Switch
              id="autoAddSequels"
              checked={behavior.autoAddSequels}
              onCheckedChange={(checked) => updateBehavior({ autoAddSequels: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultListStatus">Default List Status</Label>
            <Select
              value={behavior.defaultListStatus}
              onValueChange={(value) => updateBehavior({ defaultListStatus: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                <SelectItem value="watching">Watching</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Audio */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications & Audio
          </CardTitle>
          <CardDescription>
            Manage notifications and sound preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new episodes, updates, and recommendations
              </p>
            </div>
            <Switch
              id="notificationsEnabled"
              checked={behavior.notificationsEnabled}
              onCheckedChange={(checked) => updateBehavior({ notificationsEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="soundEffects">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sound effects for interactions and notifications
              </p>
            </div>
            <Switch
              id="soundEffects"
              checked={behavior.soundEffects}
              onCheckedChange={(checked) => updateBehavior({ soundEffects: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display & Layout */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-primary" />
            Display & Layout
          </CardTitle>
          <CardDescription>
            Customize how content is displayed and organized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultView">Default View</Label>
              <Select
                value={behavior.defaultView}
                onValueChange={(value: 'grid' | 'list') => 
                  updateBehavior({ defaultView: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4" />
                      Grid View
                    </div>
                  </SelectItem>
                  <SelectItem value="list">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      List View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <div className="px-3">
                <Slider
                  value={[behavior.itemsPerPage]}
                  onValueChange={(value) => updateBehavior({ itemsPerPage: value[0] })}
                  max={100}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>10</span>
                  <span>{behavior.itemsPerPage}</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showAdultContent">Show Adult Content</Label>
              <p className="text-sm text-muted-foreground">
                Display content marked as adult or mature
              </p>
            </div>
            <Switch
              id="showAdultContent"
              checked={behavior.showAdultContent}
              onCheckedChange={(checked) => updateBehavior({ showAdultContent: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Reset Behavior Settings</h3>
              <p className="text-sm text-muted-foreground">
                Restore all behavior settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => resetCategory('behavior')}
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