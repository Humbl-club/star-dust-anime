import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flag, CheckCircle } from "lucide-react";

interface ContentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'anime' | 'manga' | 'review' | 'post' | 'comment' | 'user';
  contentId: string;
  contentTitle?: string;
}

const reportReasons = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'copyright_violation', label: 'Copyright Violation' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

export const ContentReportModal = ({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentTitle 
}: ContentReportModalProps) => {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to report content");

      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_user_id: user.id,
          reported_content_type: contentType,
          reported_content_id: contentId,
          report_reason: reason,
          description: description.trim() || null
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this content. We'll review it shortly.",
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setReason("");
        setDescription("");
      }, 2000);

    } catch (error: unknown) {
      console.error('Report submission error:', error);
      toast({
        title: "Error",
        description: (error instanceof Error ? error.message : "Unknown error") || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason("");
      setDescription("");
      setIsSubmitted(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Report Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for helping keep our community safe. 
                We'll review your report and take appropriate action.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {contentTitle && (
            <Alert>
              <AlertDescription>
                Reporting: <strong>{contentTitle}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-sm font-medium">Why are you reporting this content?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((reportReason) => (
                <div key={reportReason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reportReason.value} id={reportReason.value} />
                  <Label htmlFor={reportReason.value} className="text-sm">
                    {reportReason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional context about why you're reporting this content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Reports are reviewed by our moderation team</p>
            <p>• False reports may result in account restrictions</p>
            <p>• Serious violations may be reported to authorities</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};