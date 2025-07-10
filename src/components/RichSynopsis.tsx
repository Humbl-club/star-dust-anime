import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RichSynopsisProps {
  synopsis?: string;
  className?: string;
  allowMarkdown?: boolean;
  maxLength?: number;
}

export const RichSynopsis = ({ 
  synopsis, 
  className = "",
  allowMarkdown = false,
  maxLength = 500
}: RichSynopsisProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!synopsis) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm shadow-lg ${className}`}>
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Synopsis
          </h3>
          <p className="text-muted-foreground leading-relaxed text-lg italic">
            No synopsis available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const shouldTruncate = synopsis.length > maxLength && !isExpanded;
  const displayText = shouldTruncate ? synopsis.slice(0, maxLength) + "..." : synopsis;

  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur-sm shadow-lg ${className}`}>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Synopsis
          </h3>
          
          {synopsis.length > maxLength && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary hover:text-primary-glow"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Read More
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {allowMarkdown ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 text-muted-foreground leading-relaxed text-lg">{children}</p>,
                strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-accent italic">{children}</em>,
              }}
            >
              {displayText}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">
              {displayText}
            </p>
          )}
        </div>
        
        {shouldTruncate && (
          <div className="mt-4 text-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};