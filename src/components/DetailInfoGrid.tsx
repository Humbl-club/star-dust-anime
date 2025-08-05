
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Calendar, Award, BookOpen, FileText } from 'lucide-react';

interface DetailInfoItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  bgColor?: string;
}

interface DetailInfoGridProps {
  items: DetailInfoItem[];
  title?: string;
  animationDelay?: string;
}

export const DetailInfoGrid = ({ items, title = "Details", animationDelay = '0.5s' }: DetailInfoGridProps) => {
  if (items.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay }}>
      <CardContent className="p-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          {title}
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className={`p-2 ${item.bgColor || 'bg-primary/10'} rounded-lg`}>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground block">{item.label}</span>
                  <span className="font-semibold text-lg">{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
