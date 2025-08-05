import React from 'react';
import { useContentMetadata } from '@/hooks/useContentMetadata';
import { GenreDisplay } from './GenreDisplay';
import { TagCloud } from './TagCloud';
import { CreatorsList } from './CreatorsList';
import { StudiosList } from './StudiosList';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

interface MetadataPanelProps {
  titleId: string;
  contentType: 'anime' | 'manga';
  variant?: 'sidebar' | 'full';
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  titleId,
  contentType,
  variant = 'sidebar'
}) => {
  const { data: metadata, isLoading } = useContentMetadata(titleId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!metadata) return null;

  const handleGenreClick = (slug: string) => {
    navigate(`/browse?genre=${slug}&type=${contentType}`);
  };

  const handleTagClick = (slug: string) => {
    navigate(`/browse?tag=${slug}&type=${contentType}`);
  };

  const handleCreatorClick = (slug: string) => {
    navigate(`/creator/${slug}`);
  };

  const handleStudioClick = (slug: string) => {
    navigate(`/studio/${slug}`);
  };

  if (variant === 'full') {
    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          {contentType === 'anime' && <TabsTrigger value="characters">Characters</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GenreDisplay
            genres={metadata.genres}
            variant="detailed"
            interactive={true}
          />
          {contentType === 'anime' && metadata.studios.length > 0 && (
            <StudiosList
              studios={metadata.studios}
              onStudioClick={handleStudioClick}
            />
          )}
          {metadata.creators.length > 0 && (
            <CreatorsList
              creators={metadata.creators}
              variant="compact"
              onCreatorClick={handleCreatorClick}
            />
          )}
        </TabsContent>

        <TabsContent value="tags">
          <TagCloud
            tags={metadata.tags}
            onTagClick={handleTagClick}
          />
        </TabsContent>

        <TabsContent value="staff">
          <CreatorsList
            creators={metadata.creators}
            variant="detailed"
            onCreatorClick={handleCreatorClick}
          />
        </TabsContent>

        {contentType === 'anime' && (
          <TabsContent value="characters">
            {/* Character display component would go here */}
            <div className="text-muted-foreground">
              Character information coming soon...
            </div>
          </TabsContent>
        )}
      </Tabs>
    );
  }

  // Sidebar variant
  return (
    <div className="space-y-6">
      {metadata.genres.length > 0 && (
        <GenreDisplay
          genres={metadata.genres}
          interactive={true}
        />
      )}
      
      {contentType === 'anime' && metadata.studios.length > 0 && (
        <StudiosList
          studios={metadata.studios}
          onStudioClick={handleStudioClick}
        />
      )}

      {metadata.creators.length > 0 && (
        <CreatorsList
          creators={metadata.creators}
          variant="compact"
          onCreatorClick={handleCreatorClick}
        />
      )}

      {metadata.tags.length > 0 && (
        <TagCloud
          tags={metadata.tags.slice(0, 15)} // Limit tags in sidebar
          onTagClick={handleTagClick}
        />
      )}
    </div>
  );
};