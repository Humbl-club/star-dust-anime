import { Helmet } from "react-helmet-async";
import { deepLinkingService } from "@/services/deepLinking";

interface SEOMetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  canonicalUrl?: string;
}

export const SEOMetaTags = ({
  title = "AniVault - Your Ultimate Anime & Manga Companion",
  description = "Discover, track, and share your favorite anime and manga. Join the ultimate AniVault community.",
  image = "/placeholder.svg",
  url,
  type = "website",
  siteName = "AniVault",
  twitterCard = "summary_large_image",
  noIndex = false,
  canonicalUrl
}: SEOMetaTagsProps) => {
  const currentUrl = url || window.location.href;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;
  const canonical = canonicalUrl || currentUrl.split('?')[0]; // Remove query params for canonical

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content={siteName} />
      <meta name="publisher" content={siteName} />
      
      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebSite',
          "name": title,
          "description": description,
          "url": currentUrl,
          "image": fullImageUrl,
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "url": window.location.origin
          },
          ...(type === 'website' && {
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${window.location.origin}/anime?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        })}
      </script>
    </Helmet>
  );
};

// Specific meta tag components for different page types
export const AnimeMetaTags = ({ anime }: { anime: any }) => {
  const metadata = deepLinkingService.generateShareableMetadata(anime, 'anime');
  
  return (
    <SEOMetaTags
      title={metadata.title}
      description={metadata.description}
      image={metadata.image}
      url={metadata.url}
      type="article"
    />
  );
};

export const MangaMetaTags = ({ manga }: { manga: any }) => {
  const metadata = deepLinkingService.generateShareableMetadata(manga, 'manga');
  
  return (
    <SEOMetaTags
      title={metadata.title}
      description={metadata.description}
      image={metadata.image}
      url={metadata.url}
      type="article"
    />
  );
};

export const SearchMetaTags = ({ query, type }: { query: string; type: 'anime' | 'manga' }) => {
  return (
    <SEOMetaTags
      title={`Search results for "${query}" - ${type === 'anime' ? 'Anime' : 'Manga'} - AniVault`}
      description={`Discover ${type} related to "${query}". Browse our comprehensive database.`}
      url={deepLinkingService.generateSearchLink(query, type)}
      noIndex={true} // Don't index search result pages
    />
  );
};