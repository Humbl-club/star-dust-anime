import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface DragDropListItemProps {
  id: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  isDragDisabled?: boolean;
  className?: string;
}

export function DragDropListItem({
  id,
  children,
  isSelected = false,
  onSelect,
  isDragDisabled = false,
  className = ''
}: DragDropListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isDragDisabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        relative group border-border/50 bg-card/80 backdrop-blur-sm
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="pt-6 pl-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        )}

        {/* Drag Handle */}
        {!isDragDisabled && (
          <div
            {...attributes}
            {...listeners}
            className="pt-6 pl-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </Card>
  );
}