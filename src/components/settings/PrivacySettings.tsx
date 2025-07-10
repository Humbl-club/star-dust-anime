import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { Shield, Users, Eye, EyeOff, Activity, User } from "lucide-react";

export const PrivacySettings = () => {
  const { settings, updatePrivacy, resetCategory } = useSettingsStore();
  const { privacy } = settings;

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="listVisibility">List Visibility</Label>
            <Select
              value={privacy.listVisibility}
              onValueChange={(value: 'public' | 'private' | 'friends') => 
                updatePrivacy({ listVisibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Public - Anyone can see
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Friends Only
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Private - Only you can see
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="profileVisible">Profile Visible</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find and view your profile
              </p>
            </div>
            <Switch
              id="profileVisible"
              checked={privacy.profileVisible}
              onCheckedChange={(checked) => updatePrivacy({ profileVisible: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Data Sharing
          </CardTitle>
          <CardDescription>
            Choose what information is shared with others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showProgress">Show Progress</Label>
              <p className="text-sm text-muted-foreground">
                Display your episode/chapter progress on your lists
              </p>
            </div>
            <Switch
              id="showProgress"
              checked={privacy.showProgress}
              onCheckedChange={(checked) => updatePrivacy({ showProgress: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="showRatings">Show Ratings</Label>
              <p className="text-sm text-muted-foreground">
                Display your ratings and scores publicly
              </p>
            </div>
            <Switch
              id="showRatings"
              checked={privacy.showRatings}
              onCheckedChange={(checked) => updatePrivacy({ showRatings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="activityVisible">Activity Feed</Label>
              <p className="text-sm text-muted-foreground">
                Show your recent activity in public feeds
              </p>
            </div>
            <Switch
              id="activityVisible"
              checked={privacy.activityVisible}
              onCheckedChange={(checked) => updatePrivacy({ activityVisible: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-primary mb-2">Privacy Protection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We take your privacy seriously. Your data is encrypted and never shared with third parties 
                without your explicit consent. You can delete your account and all associated data at any time 
                from the advanced settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Reset Privacy Settings</h3>
              <p className="text-sm text-muted-foreground">
                Restore all privacy settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => resetCategory('privacy')}
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