import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Heart, ThumbsUp, Laugh, AlertTriangle, Edit } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useReviews } from '@/hooks/useReviews';
import { useToast } from '@/hooks/use-toast';
import { FeatureWrapper } from '@/components/FeatureWrapper';

interface EnhancedRatingComponentProps {
  contentId: string;
  contentType: 'anime' | 'manga';
  currentUserRating?: number;
  onRatingUpdate?: (rating: number) => void;
  className?: string;
}

export const EnhancedRatingComponent: React.FC<EnhancedRatingComponentProps> = ({
  contentId,
  contentType,
  currentUserRating = 0,
  onRatingUpdate,
  className = ""
}) => {
  const [rating, setRating] = useState(currentUserRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [spoilerWarning, setSpoilerWarning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { addReview, loading } = useReviews(contentId);
  const { toast } = useToast();

  const handleRatingClick = (value: number) => {
    setRating(value);
    onRatingUpdate?.(value);
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      toast({
        title: "Error",
        description: "Please write a review before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addReview({
        rating,
        title: reviewTitle.trim() || undefined,
        content: reviewContent,
        spoiler_warning: spoilerWarning
      });
      
      toast({
        title: "Success",
        description: "Your review has been submitted!",
      });
      
      setIsDialogOpen(false);
      setReviewTitle('');
      setReviewContent('');
      setSpoilerWarning(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setReviewContent(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const reactionButtons = [
    { type: 'helpful', icon: ThumbsUp, label: 'Helpful', color: 'bg-blue-500' },
    { type: 'love', icon: Heart, label: 'Love', color: 'bg-red-500' },
    { type: 'funny', icon: Laugh, label: 'Funny', color: 'bg-yellow-500' },
    { type: 'unhelpful', icon: AlertTriangle, label: 'Not Helpful', color: 'bg-gray-500' }
  ];

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Rate & Review
        </CardTitle>
        <CardDescription>
          Share your thoughts about this {contentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <FeatureWrapper feature="rate_anime">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8"
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(value)}
              >
                <Star
                  className={`h-4 w-4 ${
                    value <= (hoverRating || rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating > 0 ? `${rating}/10` : 'Rate this'}
            </span>
          </div>
        </FeatureWrapper>

        {/* Write Review Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <FeatureWrapper feature="create_review">
              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </FeatureWrapper>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Write Your Review</DialogTitle>
              <DialogDescription>
                Share your detailed thoughts about this {contentType}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Review Title */}
              <div>
                <label className="text-sm font-medium">Review Title (Optional)</label>
                <Input
                  placeholder="Give your review a catchy title..."
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                />
              </div>

              {/* Review Content */}
              <div>
                <label className="text-sm font-medium">Your Review</label>
                <div className="relative">
                  <Textarea
                    placeholder="Write your detailed review here..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </Button>
                </div>
                
                {showEmojiPicker && (
                  <div className="absolute z-50 mt-2">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>

              {/* Spoiler Warning */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="spoiler"
                  checked={spoilerWarning}
                  onChange={(e) => setSpoilerWarning(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="spoiler" className="text-sm">
                  This review contains spoilers
                </label>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitReview} 
                disabled={loading || !reviewContent.trim()}
                className="w-full"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Reactions */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Reactions:</p>
          <div className="flex gap-2 flex-wrap">
            {reactionButtons.map((reaction) => (
              <Badge
                key={reaction.type}
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors"
                onClick={() => {/* Reaction functionality to be implemented */}}
              >
                <reaction.icon className="h-3 w-3 mr-1" />
                {reaction.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};