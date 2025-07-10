import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RatingComponent } from '@/components/RatingComponent';
import { 
  Check, 
  X, 
  Trash2, 
  Star,
  Play,
  Pause,
  Clock,
  Eye,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listStatuses } from '@/data/animeData';

interface BulkActionsToolbarProps {
  selectedCount: number;
  contentType: 'anime' | 'manga';
  onStatusUpdate: (status: string) => void;
  onRatingUpdate: (rating: number) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  contentType,
  onStatusUpdate,
  onRatingUpdate,
  onDelete,
  onClearSelection
}: BulkActionsToolbarProps) {
  const statuses = contentType === 'anime' ? listStatuses.anime : listStatuses.manga;

  const statusIcons = {
    watching: Play,
    reading: Eye,
    completed: Check,
    on_hold: Pause,
    dropped: X,
    plan_to_watch: Clock,
    plan_to_read: Clock
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="p-4 bg-card border shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {selectedCount} selected
                </Badge>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Status Update */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Select onValueChange={onStatusUpdate}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Change to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => {
                      const Icon = statusIcons[status.value as keyof typeof statusIcons];
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Rating Update */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Rating:</span>
                <RatingComponent
                  value={0}
                  onChange={onRatingUpdate}
                  size="sm"
                />
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}