import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { TrendingContentSection } from "@/components/TrendingContentSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

const Trending = () => {
  const [contentType, setContentType] = useState<'anime' | 'manga'>('anime');

  return (
    <>
      <Helmet>
        <title>Trending {contentType === 'anime' ? 'Anime' : 'Manga'} | Discover Popular Content</title>
        <meta name="description" content={`Discover the most trending ${contentType} that everyone's talking about. Real-time tracking of currently airing and publishing content.`} />
      </Helmet>
      
      <Navigation />
      
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Hero Header Section */}
          <div className="text-center space-y-6 py-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass-card border border-primary/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live Updates</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Trending Now
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                Real-time trending content based on currently airing anime and publishing manga. 
                Updated daily with smart scoring that considers popularity, ratings, and release status.
              </p>
            </div>
          </div>

          {/* Content Type Toggle */}
          <div className="flex justify-center">
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'anime' | 'manga')} className="w-auto">
              <TabsList className="glass-card border border-primary/20 grid w-full grid-cols-2 h-14 p-1">
                <TabsTrigger 
                  value="anime" 
                  className="text-base font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    🔥 Trending Anime
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="manga" 
                  className="text-base font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    📚 Trending Manga
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="anime" className="mt-8">
                <TrendingContentSection 
                  contentType="anime" 
                  title="Currently Trending Anime" 
                  limit={50}
                />
              </TabsContent>

              <TabsContent value="manga" className="mt-8">
                <TrendingContentSection 
                  contentType="manga" 
                  title="Currently Trending Manga" 
                  limit={50}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <LegalFooter />
    </>
  );
};

export default Trending;