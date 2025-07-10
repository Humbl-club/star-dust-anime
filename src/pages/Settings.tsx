import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settingsStore";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { BehaviorSettings } from "@/components/settings/BehaviorSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { AdvancedSettings } from "@/components/settings/AdvancedSettings";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Activity, 
  Shield, 
  Code, 
  Save, 
  RefreshCw, 
  Download, 
  Upload,
  AlertTriangle
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { 
    hasChanges, 
    isLoading, 
    resetSettings, 
    exportSettings, 
    importSettings,
    saveToSupabase,
    markSaved 
  } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState("appearance");
  const [importText, setImportText] = useState("");

  const handleSave = async () => {
    try {
      await saveToSupabase();
      markSaved();
      toast({
        title: "Settings saved",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const handleExport = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anithing-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Your settings have been downloaded as a JSON file.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importSettings(content)) {
          toast({
            title: "Settings imported",
            description: "Your settings have been imported successfully.",
          });
        } else {
          toast({
            title: "Import failed",
            description: "Invalid settings file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <div className="relative pt-24 pb-12 mb-8">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="relative container mx-auto px-4">
          <div className="glass-card p-8 border border-primary/20 glow-primary">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <SettingsIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gradient-primary">
                  Settings
                </h1>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Customize your <span className="text-gradient-primary font-semibold">Anithing</span> experience to match your preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mobile-safe-padding py-6 md:py-8">
        {/* Quick Actions */}
        <Card className="mb-8 glass-card glow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quick Actions</span>
              {hasChanges && (
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isLoading}
                className="bg-gradient-primary hover:shadow-glow-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <label className="inline-flex">
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto mb-8 bg-card/50 backdrop-blur-md border border-border/30 p-2 rounded-xl">
            <TabsTrigger 
              value="appearance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              <Palette className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="behavior"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Behavior</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              <Code className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="behavior">
            <BehaviorSettings />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;