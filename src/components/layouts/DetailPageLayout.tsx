
import React from 'react';
import { Navigation } from '@/components/Navigation';

interface DetailPageLayoutProps {
  children: React.ReactNode;
  backgroundImage?: string;
  colorTheme?: string;
  seoComponent?: React.ReactNode;
}

export const DetailPageLayout = ({ 
  children, 
  backgroundImage, 
  colorTheme,
  seoComponent 
}: DetailPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 relative overflow-hidden">
      {seoComponent}
      
      <Navigation />
      
      {/* Hero Background with blurred cover */}
      {backgroundImage && (
        <div className="absolute inset-0 overflow-hidden z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              filter: 'blur(20px) brightness(0.3)',
              transform: 'scale(1.1)'
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: colorTheme 
                ? `linear-gradient(to bottom, ${colorTheme}10, rgba(0,0,0,0.9))` 
                : 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.9))'
            }}
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        {children}
      </div>
    </div>
  );
};
