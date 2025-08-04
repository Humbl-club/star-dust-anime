import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Tv } from 'lucide-react';

interface StreamingPlatformFilterProps {
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
  className?: string;
}

const STREAMING_PLATFORMS = [
  { id: 'crunchyroll', name: 'Crunchyroll', color: 'bg-orange-500' },
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'hulu', name: 'Hulu', color: 'bg-green-500' },
  { id: 'funimation', name: 'Funimation', color: 'bg-purple-600' },
  { id: 'amazon-prime', name: 'Amazon Prime Video', color: 'bg-blue-600' },
  { id: 'disney-plus', name: 'Disney Plus', color: 'bg-blue-800' },
  { id: 'animelab', name: 'AnimeLab', color: 'bg-pink-500' },
  { id: 'wakanim', name: 'Wakanim', color: 'bg-indigo-500' },
  { id: 'hidive', name: 'HIDIVE', color: 'bg-yellow-500' },
  { id: 'viz', name: 'VIZ', color: 'bg-gray-700' }
];

export function StreamingPlatformFilter({ 
  selectedPlatforms, 
  onPlatformChange, 
  className = '' 
}: StreamingPlatformFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePlatformSelect = (platformId: string) => {
    if (!selectedPlatforms.includes(platformId)) {
      onPlatformChange([...selectedPlatforms, platformId]);
    }
    setIsOpen(false);
  };

  const handlePlatformRemove = (platformId: string) => {
    onPlatformChange(selectedPlatforms.filter(id => id !== platformId));
  };

  const availablePlatforms = STREAMING_PLATFORMS.filter(
    platform => !selectedPlatforms.includes(platform.id)
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Tv className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Streaming Platforms</span>
      </div>

      {/* Selected platforms */}
      {selectedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlatforms.map(platformId => {
            const platform = STREAMING_PLATFORMS.find(p => p.id === platformId);
            if (!platform) return null;
            
            return (
              <Badge 
                key={platformId}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <div className={`w-2 h-2 rounded-full ${platform.color}`} />
                {platform.name}
                <button
                  onClick={() => handlePlatformRemove(platformId)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Platform selector */}
      {availablePlatforms.length > 0 && (
        <Select open={isOpen} onOpenChange={setIsOpen} onValueChange={handlePlatformSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add streaming platform filter..." />
          </SelectTrigger>
          <SelectContent>
            {availablePlatforms.map(platform => (
              <SelectItem key={platform.id} value={platform.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                  {platform.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedPlatforms.length > 0 && (
        <button
          onClick={() => onPlatformChange([])}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all platforms
        </button>
      )}
    </div>
  );
}