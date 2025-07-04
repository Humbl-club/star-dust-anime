import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Users, EyeOff } from "lucide-react";

interface ContentRatingBadgeProps {
  rating?: string;
  size?: "sm" | "default" | "lg";
}

const ratingConfig = {
  all: {
    label: "All Ages",
    icon: Users,
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    description: "Suitable for all audiences"
  },
  teen: {
    label: "Teen",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    description: "Ages 13+ - May contain mild themes"
  },
  mature: {
    label: "Mature",
    icon: AlertTriangle,
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    description: "Ages 17+ - Contains mature themes"
  },
  adult: {
    label: "Adult",
    icon: EyeOff,
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    description: "Ages 18+ - Adult content"
  }
};

export const ContentRatingBadge = ({ rating = "all", size = "default" }: ContentRatingBadgeProps) => {
  const config = ratingConfig[rating.toLowerCase() as keyof typeof ratingConfig] || ratingConfig.all;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    default: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <Badge 
      className={`${config.color} ${sizeClasses[size]} flex items-center gap-1 font-medium border`}
      title={config.description}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
};