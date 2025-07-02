import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  Bell, 
  Settings,
  Menu
} from "lucide-react";
import { Link } from "react-router-dom";

export function AppLayout() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results or trigger search
      console.log("Searching for:", searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-secondary/5">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search anime, manga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 w-80"
                  />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {!loading && user && (
                <>
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-4 h-4" />
                    <Badge 
                      className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-accent text-xs"
                    >
                      3
                    </Badge>
                  </Button>

                  {/* Settings */}
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>

                  {/* Profile Menu */}
                  <div className="hidden sm:block">
                    <ProfileMenu />
                  </div>
                </>
              )}

              {!loading && !user && (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm" className="hidden sm:flex bg-gradient-primary hover:opacity-90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}