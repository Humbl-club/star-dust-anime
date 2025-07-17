import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkingSearchDropdown } from "@/components/WorkingSearchDropdown";
import { cn } from "@/lib/utils";

interface MobileSearchBarProps {
  className?: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export const MobileSearchBar = ({ 
  className,
  onClose,
  autoFocus = true
}: MobileSearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(autoFocus);

  const handleClose = () => {
    setIsExpanded(false);
    onClose?.();
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("touch-friendly", className)}
        onClick={() => setIsExpanded(true)}
      >
        <Search className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/95 backdrop-blur-lg animate-fade-in",
      className
    )}>
      <div className="mobile-safe-padding pt-safe-area-inset-top">
        <div className="flex items-center gap-3 p-4">
          <div className="flex-1">
            <WorkingSearchDropdown 
              placeholder="Search anime & manga..."
              onResultClick={handleClose}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="touch-friendly shrink-0"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};