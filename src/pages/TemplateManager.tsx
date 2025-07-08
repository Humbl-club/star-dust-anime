import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Settings } from "lucide-react";

const TemplateManager = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">
            Template Manager
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your profile templates and settings
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Template management features coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Template management features will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;