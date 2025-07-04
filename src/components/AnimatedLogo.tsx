import { useState, useEffect } from "react";
import { Zap, Star, Circle, Sparkles } from "lucide-react";

export const AnimatedLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={`${sizeClasses[size]} relative flex items-center justify-center glass-card hover-scale transition-all duration-500 cursor-pointer touch-friendly`}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl opacity-30 blur-sm hover:opacity-50 transition-opacity duration-300" />
      
      {/* Main central icon - Updated for Anithing */}
      <div className="relative z-10">
        <Sparkles 
          className={`${iconSizes[size]} text-accent transition-all duration-300 ${
            isAnimating ? 'animate-spin text-primary' : ''
          }`} 
        />
      </div>

      {/* Orbiting elements - Enhanced animation */}
      <div className="absolute inset-0">
        <Star 
          className={`w-2 h-2 text-primary absolute top-1 right-1 transition-all duration-500 ${
            isAnimating ? 'animate-spin scale-125' : 'animate-pulse'
          }`}
        />
        <Circle 
          className={`w-1.5 h-1.5 text-accent absolute bottom-1 left-1 transition-all duration-700 ${
            isAnimating ? 'animate-bounce scale-110' : 'animate-pulse'
          }`}
          style={{ animationDelay: '0.2s' }}
        />
        <div 
          className={`w-1 h-1 bg-primary-glow rounded-full absolute top-1 left-1 transition-all duration-500 ${
            isAnimating ? 'animate-ping scale-150' : 'animate-pulse'
          }`}
          style={{ animationDelay: '0.4s' }}
        />
        <Zap 
          className={`w-1.5 h-1.5 text-secondary absolute bottom-1 right-1 transition-all duration-600 ${
            isAnimating ? 'animate-bounce rotate-12' : 'animate-pulse'
          }`}
          style={{ animationDelay: '0.6s' }}
        />
      </div>

      {/* Rotating rings */}
      <div 
        className={`absolute inset-0 border border-accent/30 rounded-xl transition-all duration-1000 ${
          isAnimating ? 'rotate-180 border-primary/50 scale-110' : 'rotate-0'
        }`}
      />
      <div 
        className={`absolute inset-1 border border-primary/20 rounded-lg transition-all duration-1500 ${
          isAnimating ? '-rotate-90 border-accent/40 scale-90' : 'rotate-0'
        }`}
      />
    </div>
  );
};