import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Languages } from "lucide-react";

interface NameToggleProps {
  showEnglish: boolean;
  onToggle: (showEnglish: boolean) => void;
}

export const NameToggle = ({ showEnglish, onToggle }: NameToggleProps) => {
  return (
    <Card className="fixed top-4 right-4 z-50 p-3 bg-card/90 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="flex items-center space-x-3">
        <Languages className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center space-x-2">
          <Label htmlFor="name-toggle" className="text-sm font-medium">
            {showEnglish ? "English" : "Original"}
          </Label>
          <Switch
            id="name-toggle"
            checked={showEnglish}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </Card>
  );
};