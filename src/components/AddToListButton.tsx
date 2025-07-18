import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Check, 
  Edit, 
  Trash2,
  Play,
  Pause,
  Clock,
  X,
  Eye,
  Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserLists, type UserAnimeListEntry, type UserMangaListEntry } from "@/hooks/useUserLists";
import { FeatureWrapper } from "@/components/FeatureWrapper";
import { type Anime, type Manga } from "@/data/animeData";
import { toast } from "sonner";
import { AddToListButtonProps, StatusConfigMap } from "@/types/components";
import { isNumber } from "@/types/guards";

const statusConfig: StatusConfigMap = {
  anime: {
    watching: { label: "Watching", icon: Play, color: "bg-green-500/90" },
    completed: { label: "Completed", icon: Check, color: "bg-blue-500/90" },
    on_hold: { label: "On Hold", icon: Pause, color: "bg-yellow-500/90" },
    dropped: { label: "Dropped", icon: X, color: "bg-red-500/90" },
    plan_to_watch: { label: "Plan to Watch", icon: Clock, color: "bg-muted/90" }
  },
  manga: {
    reading: { label: "Reading", icon: Eye, color: "bg-green-500/90" },
    completed: { label: "Completed", icon: Check, color: "bg-blue-500/90" },
    on_hold: { label: "On Hold", icon: Pause, color: "bg-yellow-500/90" },
    dropped: { label: "Dropped", icon: X, color: "bg-red-500/90" },
    plan_to_read: { label: "Plan to Read", icon: Clock, color: "bg-muted/90" }
  }
};

export const AddToListButton = ({ 
  item, 
  type, 
  variant = "outline", 
  size = "sm",
  className = ""
}: AddToListButtonProps) => {
  const { user } = useAuth();
  const { 
    addToAnimeList, 
    addToMangaList, 
    updateAnimeListEntry, 
    updateMangaListEntry,
    removeFromAnimeList,
    removeFromMangaList,
    getAnimeListEntry, 
    getMangaListEntry 
  } = useUserLists();
  
  const [loading, setLoading] = useState(false);

  // Use anilist_id for lookup since that's what we store in the normalized schema
  const anilistId = 'anilist_id' in item && isNumber(item.anilist_id) 
    ? item.anilist_id 
    : item.id;
  const listEntry = type === "anime" 
    ? getAnimeListEntry(anilistId) 
    : getMangaListEntry(anilistId);

  const handleAddToList = async (status: UserAnimeListEntry['status'] | UserMangaListEntry['status']) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // For the normalized schema, we need to find the detail ID first
      // This is a simplified approach - in production you'd want to fetch detail IDs properly
      const detailId = `detail_${anilistId}`;
      
      if (type === "anime") {
        await addToAnimeList(detailId, status as UserAnimeListEntry['status']);
      } else {
        await addToMangaList(detailId, status as UserMangaListEntry['status']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: UserAnimeListEntry['status'] | UserMangaListEntry['status']) => {
    if (!listEntry) return;
    
    setLoading(true);
    try {
      if (type === "anime") {
        await updateAnimeListEntry(listEntry.id, { status: status as UserAnimeListEntry['status'] });
      } else {
        await updateMangaListEntry(listEntry.id, { status: status as UserMangaListEntry['status'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async () => {
    if (!listEntry) return;
    
    setLoading(true);
    try {
      if (type === "anime") {
        await removeFromAnimeList(listEntry.id);
      } else {
        await removeFromMangaList(listEntry.id);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Plus className="w-4 h-4 mr-2" />
        Sign in to Add
      </Button>
    );
  }

  const statusOptions = statusConfig[type];

  const content = listEntry ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${className} gap-2`}
          disabled={loading}
        >
          <Badge variant="secondary" className={`${statusOptions[listEntry.status as keyof typeof statusOptions].color} text-white text-xs`}>
            {(() => {
              const StatusIcon = statusOptions[listEntry.status as keyof typeof statusOptions].icon;
              return <StatusIcon className="w-3 h-3 mr-1" />;
            })()}
            {statusOptions[listEntry.status as keyof typeof statusOptions].label}
          </Badge>
          <Edit className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-48 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl z-50">
        <div className="p-2 text-sm font-medium text-muted-foreground">
          Change Status
        </div>
        <DropdownMenuSeparator />
        
        {Object.entries(statusOptions).map(([status, config]) => {
          const Icon = config.icon;
          const isActive = listEntry.status === status;
          
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleUpdateStatus(status as UserAnimeListEntry['status'] | UserMangaListEntry['status'])}
              className={`cursor-pointer ${isActive ? 'bg-primary/10' : ''}`}
            >
              <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
              <Icon className="w-4 h-4 mr-2" />
              {config.label}
              {isActive && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleRemoveFromList}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove from List
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to List
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-48 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl z-50">
        <div className="p-2 text-sm font-medium text-muted-foreground">
          Add to {type === "anime" ? "Anime" : "Manga"} List
        </div>
        <DropdownMenuSeparator />
        
        {Object.entries(statusOptions).map(([status, config]) => {
          const Icon = config.icon;
          
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleAddToList(status as UserAnimeListEntry['status'] | UserMangaListEntry['status'])}
              className="cursor-pointer"
            >
              <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
              <Icon className="w-4 h-4 mr-2" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <FeatureWrapper feature="add_to_list">
      {content}
    </FeatureWrapper>
  );
};