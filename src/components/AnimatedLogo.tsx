import { useState, useEffect } from "react";
import { Zap, Star, Circle } from "lucide-react";

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
      className={`${sizeClasses[size]} relative flex items-center justify-center glass-card group-hover:scale-110 transition-all duration-500 cursor-pointer`}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300" />
      
      {/* Main central icon */}
      <div className="relative z-10">
        <Zap 
          className={`${iconSizes[size]} text-primary transition-all duration-300 ${
            isAnimating ? 'animate-bounce text-accent' : ''
          }`} 
        />
      </div>

      {/* Orbiting elements */}
      <div className="absolute inset-0">
        <Star 
          className={`w-2 h-2 text-secondary absolute top-1 right-1 transition-all duration-500 ${
            isAnimating ? 'animate-spin' : 'animate-pulse'
          }`}
        />
        <Circle 
          className={`w-1.5 h-1.5 text-accent absolute bottom-1 left-1 transition-all duration-700 ${
            isAnimating ? 'animate-bounce' : 'animate-pulse'
          }`}
          style={{ animationDelay: '0.2s' }}
        />
        <div 
          className={`w-1 h-1 bg-primary-glow rounded-full absolute top-1 left-1 transition-all duration-500 ${
            isAnimating ? 'animate-ping' : 'animate-pulse'
          }`}
          style={{ animationDelay: '0.4s' }}
        />
      </div>

      {/* Rotating ring */}
      <div 
        className={`absolute inset-0 border border-primary/30 rounded-xl transition-all duration-1000 ${
          isAnimating ? 'rotate-180 border-accent/50' : 'rotate-0'
        }`}
      />
    </div>
  );
};