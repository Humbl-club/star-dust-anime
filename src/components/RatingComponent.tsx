import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingComponentProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RatingComponent = ({
  value = 0,
  onChange,
  readonly = false,
  size = "md",
  className = ""
}: RatingComponentProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const starSize = sizeClasses[size];
  const displayRating = isHovering ? hoverRating : value;

  const handleStarClick = (rating: number) => {
    if (readonly || !onChange) return;
    onChange(rating);
  };

  const handleStarHover = (rating: number) => {
    if (readonly) return;
    setHoverRating(rating);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoverRating(0);
  };

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={readonly}
          onClick={() => handleStarClick(rating)}
          onMouseEnter={() => handleStarHover(rating)}
          className={cn(
            "transition-all duration-150",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors duration-150",
              displayRating >= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-300"
            )}
          />
        </button>
      ))}
      
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value}/10
        </span>
      )}
    </div>
  );
};