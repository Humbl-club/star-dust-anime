import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Scale, Shield, FileText, Copyright } from "lucide-react";

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  last_updated: string;
}

interface ApiAttribution {
  id: string;
  service_name: string;
  attribution_text: string;
  license_url?: string;
  terms_url?: string;
}

const pageIcons = {
  privacy_policy: Shield,
  terms_of_service: Scale,
  content_policy: FileText,
  copyright_policy: Copyright,
};

const pageNames = {
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service", 
  content_policy: "Content Policy",
  copyright_policy: "Copyright Policy",
};

const LegalPages = () => {
  const { pageType } = useParams<{ pageType: string }>();
  const navigate = useNavigate();
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const [apiAttributions, setApiAttributions] = useState<ApiAttribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (pageType && pageType !== 'attributions') {
          // Fetch specific legal page
          const { data: pageData, error: pageError } = await supabase
            .from('legal_pages')
            .select('*')
            .eq('page_type', pageType)
            .single();

          if (pageError) throw pageError;
          setLegalPage(pageData);
        }

        // Always fetch API attributions for the attributions section
        const { data: attributionsData, error: attributionsError } = await supabase
          .from('api_attributions')
          .select('*')
          .eq('is_active', true)
          .order('service_name');

        if (attributionsError) throw attributionsError;
        setApiAttributions(attributionsData || []);

      } catch (err: any) {
        console.error('Error fetching legal content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pageType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Attributions page
  if (pageType === 'attributions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copyright className="w-6 h-6" />
                  Data Sources & Attributions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  This application uses data from various third-party services. 
                  We acknowledge and thank these providers for making anime and manga 
                  information publicly available.
                </p>

                <Separator />

                <div className="space-y-4">
                  {apiAttributions.map((attribution) => (
                    <div key={attribution.id} className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg">{attribution.service_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {attribution.attribution_text}
                      </p>
                      
                      {(attribution.terms_url || attribution.license_url) && (
                        <div className="flex gap-2 flex-wrap">
                          {attribution.terms_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attribution.terms_url, '_blank')}
                            >
                              Terms of Service
                            </Button>
                          )}
                          {attribution.license_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attribution.license_url, '_blank')}
                            >
                              License
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Disclaimer:</strong> All anime and manga content, including 
                    images, titles, descriptions, and metadata, remains the property of 
                    their respective copyright holders.
                  </p>
                  <p>
                    This application is not affiliated with MyAnimeList, AniList, or any 
                    anime/manga publishers. All data is used for informational purposes only.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Individual legal page
  if (!legalPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-4xl mx-auto">
            <Alert>
              <AlertDescription>Legal page not found.</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = pageIcons[legalPage.page_type as keyof typeof pageIcons] || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="w-6 h-6" />
                {legalPage.title}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Version {legalPage.version} • 
                Last updated: {new Date(legalPage.last_updated).toLocaleDateString()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {legalPage.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalPages;