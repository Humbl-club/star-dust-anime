import { HexColorPicker } from 'react-colorful';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSettingsStore } from "@/stores/settingsStore";
import { Palette, Sparkles, Type, Eye } from "lucide-react";

export const AppearanceSettings = () => {
  const { settings, updateAppearance, resetCategory } = useSettingsStore();
  const { appearance } = settings;

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme & Colors
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of your interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Color Theme</Label>
              <Select
                value={appearance.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  updateAppearance({ theme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={appearance.fontSize}
                onValueChange={(value: 'small' | 'medium' | 'large') => 
                  updateAppearance({ fontSize: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: appearance.primaryColor }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker
                      color={appearance.primaryColor}
                      onChange={(color) => updateAppearance({ primaryColor: color })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: appearance.accentColor }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <HexColorPicker
                      color={appearance.accentColor}
                      onChange={(color) => updateAppearance({ accentColor: color })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Effects */}
      <Card className="glass-card glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Visual Effects
          </CardTitle>
          <CardDescription>
            Control animations and visual enhancements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="glassmorphism">Glassmorphism Effects</Label>
              <p className="text-sm text-muted-foreground">
                Enable glass-like transparency effects on cards and panels
              </p>
            </div>
            <Switch
              id="glassmorphism"
              checked={appearance.glassmorphism}
              onCheckedChange={(checked) => updateAppearance({ glassmorphism: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="animations">Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable smooth transitions and animations throughout the app
              </p>
            </div>
            <Switch
              id="animations"
              checked={appearance.animations}
              onCheckedChange={(checked) => updateAppearance({ animations: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and use smaller elements for more content density
              </p>
            </div>
            <Switch
              id="compactMode"
              checked={appearance.compactMode}
              onCheckedChange={(checked) => updateAppearance({ compactMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Reset Appearance Settings</h3>
              <p className="text-sm text-muted-foreground">
                Restore all appearance settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => resetCategory('appearance')}
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