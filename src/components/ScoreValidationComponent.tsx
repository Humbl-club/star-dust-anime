import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star, MessageCircle } from "lucide-react";
import { useScoreValidation, VALIDATION_LABELS, VALIDATION_ORDER } from "@/hooks/useScoreValidation";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface ScoreValidationComponentProps {
  titleId: string;
  anilistScore?: number;
  className?: string;
}

const VALIDATION_COLORS = {
  hidden_gem: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  undervalued: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300",
  accurate_af: "bg-gradient-to-r from-green-500/20 to-lime-500/20 border-green-500/30 text-green-700 dark:text-green-300",
  overhyped: "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-700 dark:text-orange-300",
  bot_farm: "bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/30 text-red-700 dark:text-red-300"
} as const;

export const ScoreValidationComponent = ({ 
  titleId, 
  anilistScore,
  className = "" 
}: ScoreValidationComponentProps) => {
  const { validationStats, userValidation, loading, submitting, submitValidation, removeValidation } = useScoreValidation(titleId);
  const { user } = useAuth();
  const [selectedValidation, setSelectedValidation] = useState<keyof typeof VALIDATION_LABELS | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentField, setShowCommentField] = useState(false);

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading validations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleValidationClick = (validationType: keyof typeof VALIDATION_LABELS) => {
    if (userValidation?.validation_type === validationType) {
      // If clicking the same validation, remove it
      handleRemoveValidation();
    } else {
      // Set selected validation and show comment field
      setSelectedValidation(validationType);
      setShowCommentField(true);
    }
  };

  const handleSubmitValidation = async () => {
    if (!selectedValidation) return;
    
    await submitValidation(selectedValidation, comment);
    
    // Reset state
    setSelectedValidation(null);
    setComment("");
    setShowCommentField(false);
  };

  const handleRemoveValidation = async () => {
    await removeValidation();
    setSelectedValidation(null);
    setComment("");
    setShowCommentField(false);
  };

  const handleCancelComment = () => {
    setSelectedValidation(null);
    setComment("");
    setShowCommentField(false);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* AniList Score Display */}
        {anilistScore && (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="h-5 w-5 text-primary" fill="currentColor" />
              <span className="text-2xl font-bold text-primary">{anilistScore}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground">AniList Community Score</p>
          </div>
        )}

        {/* Validation Question */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">How accurate is this score?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {user ? "Share your opinion with the community" : "Sign in to validate scores"}
          </p>
        </div>

        {/* Validation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {VALIDATION_ORDER.map((validationType) => {
            const stats = validationStats[validationType];
            const isSelected = userValidation?.validation_type === validationType;
            const isDisabled = !user || submitting;
            
            return (
              <Button
                key={validationType}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                disabled={isDisabled}
                onClick={() => handleValidationClick(validationType)}
                className={`
                  flex flex-col items-center space-y-1 h-auto py-3 transition-all duration-200
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  ${!isDisabled ? 'hover:scale-105' : ''}
                `}
              >
                {submitting && userValidation?.validation_type === validationType ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className="font-medium text-xs">
                      {VALIDATION_LABELS[validationType]}
                    </span>
                    {stats.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-1 py-0 min-w-0"
                      >
                        {stats.percentage}%
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>

        {/* Comment Field */}
        {showCommentField && selectedValidation && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Share your thoughts on why this is {VALIDATION_LABELS[selectedValidation]}
              </span>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            
            <Textarea
              placeholder="Share your reasoning or additional thoughts..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {comment.length}/500 characters
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelComment}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitValidation}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    `Submit ${VALIDATION_LABELS[selectedValidation]}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Stats Summary */}
        {validationStats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Community Consensus</span>
              <span className="font-medium">{validationStats.total} votes</span>
            </div>
            
            {/* Top validation type */}
            {VALIDATION_ORDER.map((validationType) => {
              const stats = validationStats[validationType];
              if (stats.count === 0) return null;
              
              return (
                <div key={validationType} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${VALIDATION_COLORS[validationType].split(' ')[0]} border`} />
                    <span>{VALIDATION_LABELS[validationType]}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">{stats.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.percentage}%
                    </Badge>
                  </div>
                </div>
              );
            }).filter(Boolean).slice(0, 3)} {/* Show top 3 validations */}
          </div>
        )}

        {/* User's Current Validation */}
        {userValidation && (
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${VALIDATION_COLORS[userValidation.validation_type]}`}>
              <span className="text-sm font-medium">
                You voted: {VALIDATION_LABELS[userValidation.validation_type]}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
