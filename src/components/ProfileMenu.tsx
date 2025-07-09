import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Star, BookOpen, Coins, Crown, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export const ProfileMenu = () => {
  const { user, signOut } = useAuth();
  const { stats } = useSimpleGameification();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error("Error signing out");
    }
  };

  if (!user || loading) {
    return null;
  }

  const displayName = profile?.full_name || profile?.username || 'User';
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full spring-bounce">
          <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-glow-primary">
            <AvatarImage 
              src={profile?.avatar_url || ''} 
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 glass-dropdown border border-primary/20 animate-fade-in" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse" />
              <p className="text-base font-semibold leading-none">{displayName}</p>
            </div>
            <p className="text-sm leading-none text-muted-foreground">
              {user.email}
            </p>
            {stats?.currentUsername && (
              <div className="glass-card border border-primary/20 px-3 py-2 rounded-lg mt-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className={cn(
                    "text-sm font-semibold",
                    `username-${stats.usernameTier?.toLowerCase() || 'common'}`
                  )}>
                    {stats.currentUsername}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <Link to="/dashboard">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 spring-bounce py-3">
            <User className="mr-3 h-4 w-4 text-primary" />
            <span className="font-medium">Dashboard</span>
          </DropdownMenuItem>
        </Link>
        
        <Link to="/my-lists">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 spring-bounce py-3">
            <BookOpen className="mr-3 h-4 w-4 text-blue-500" />
            <span className="font-medium">My Lists</span>
          </DropdownMenuItem>
        </Link>
        
        <Link to="/recommendations">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 spring-bounce py-3">
            <Star className="mr-3 h-4 w-4 text-yellow-500" />
            <span className="font-medium">Recommendations</span>
          </DropdownMenuItem>
        </Link>
        
        <Link to="/gamification">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 spring-bounce py-3">
            <Crown className="mr-3 h-4 w-4 text-purple-500" />
            <span className="font-medium">Gamification</span>
          </DropdownMenuItem>
        </Link>
        
        <Link to="/social">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 spring-bounce py-3">
            <Settings className="mr-3 h-4 w-4 text-green-500" />
            <span className="font-medium">Social</span>
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/5 spring-bounce py-3"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};