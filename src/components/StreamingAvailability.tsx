import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ExternalLink, Play, Clock, Globe, Tv } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamingPlatform {
  name: string;
  url: string;
  type: 'subscription' | 'rent' | 'buy';
  price?: string;
  quality?: 'HD' | '4K';
  region: string;
}

interface StreamingAvailabilityProps {
  titleId: string;
  titleName: string;
  region?: string;
  className?: string;
}

export const StreamingAvailability: React.FC<StreamingAvailabilityProps> = ({
  titleId,
  titleName,
  region = 'US',
  className = ''
}) => {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState(region);

  const {
    data: streamingData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['streaming-availability', titleId, selectedRegion],
    queryFn: async () => {
      console.log(`🔍 Checking streaming availability for ${titleName} in ${selectedRegion}`);
      
      const { data, error } = await supabase.functions.invoke('check-streaming-availability', {
        body: {
          titleId,
          titleName,
          region: selectedRegion
        }
      });

      if (error) {
        console.error('Streaming availability error:', error);
        throw new Error(error.message || 'Failed to check streaming availability');
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!titleId && !!titleName,
    retry: 2,
  });

  const supportedRegions = [
    { code: 'US', name: '🇺🇸 United States' },
    { code: 'CA', name: '🇨🇦 Canada' },
    { code: 'UK', name: '🇬🇧 United Kingdom' },
    { code: 'AU', name: '🇦🇺 Australia' },
  ];

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'Crunchyroll': '🧡',
      'Funimation': '💜',
      'Netflix': '🔴',
      'Hulu': '🟢',
      'Amazon Prime Video': '🔵',
      'VRV': '🟠',
      'Hidive': '💙',
      'YouTube': '🔴',
    };
    return icons[platform] || '📺';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'subscription': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'rent': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'buy': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const handlePlatformClick = (platform: StreamingPlatform) => {
    window.open(platform.url, '_blank', 'noopener,noreferrer');
    toast({
      title: "Opening streaming platform",
      description: `Redirecting to ${platform.name}...`,
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            Streaming Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner size="sm" />
          <p className="text-sm text-muted-foreground mt-2">
            Checking streaming platforms...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            Streaming Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Unable to check streaming availability. This might be due to rate limiting or temporary service issues.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="mt-3"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Streaming Availability
        </CardTitle>
        
        {/* Region Selector */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {supportedRegions.map((region) => (
              <Button
                key={region.code}
                variant={selectedRegion === region.code ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegion(region.code)}
                className="text-xs h-7"
              >
                {region.name}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {streamingData?.available ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                ✅ Available to stream
              </Badge>
              <span className="text-xs text-muted-foreground">
                in {supportedRegions.find(r => r.code === selectedRegion)?.name}
              </span>
            </div>

            <div className="grid gap-3">
              {streamingData.platforms.map((platform: StreamingPlatform, index: number) => (
                <div
                  key={`${platform.name}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handlePlatformClick(platform)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPlatformIcon(platform.name)}</span>
                    <div>
                      <div className="font-medium">{platform.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(platform.type)}`}
                        >
                          {platform.type}
                        </Badge>
                        {platform.quality && (
                          <Badge variant="outline" className="text-xs">
                            {platform.quality}
                          </Badge>
                        )}
                        {platform.price && (
                          <span className="font-medium text-foreground">
                            {platform.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3" />
              Last checked: {new Date(streamingData.lastChecked).toLocaleString()}
              <span className="ml-2">•</span>
              <span className="capitalize">Source: {streamingData.dataSource}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">😔</div>
            <div className="font-medium text-foreground mb-1">
              Not available for streaming
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              This title isn't currently available on major streaming platforms in {selectedRegion}.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              Check Again
            </Button>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-4 border-t mt-4">
              <Clock className="h-3 w-3" />
              Last checked: {new Date(streamingData?.lastChecked || new Date()).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};