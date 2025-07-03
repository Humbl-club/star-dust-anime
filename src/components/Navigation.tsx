import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Menu, 
  Home, 
  TrendingUp, 
  BookOpen, 
  Play, 
  User,
  Bell,
  Settings,
  Database,
  Star,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AnimatedLogo } from "@/components/AnimatedLogo";

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export const Navigation = ({ onSearch }: NavigationProps) => {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/", active: window.location.pathname === "/" },
    { icon: TrendingUp, label: "Trending", href: "/trending", active: window.location.pathname === "/trending" },
    { icon: Play, label: "Anime", href: "/anime", active: window.location.pathname === "/anime" },
    { icon: BookOpen, label: "Manga", href: "/manga", active: window.location.pathname === "/manga" },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      isScrolled 
        ? "glass-nav" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <AnimatedLogo size="md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient-primary group-hover:opacity-80 transition-opacity">
                AniVault
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Premium Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Condensed */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200 hover:scale-105",
                    item.active && "shadow-glow-primary bg-gradient-primary"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Compact Navigation for medium screens */}
          <div className="hidden md:lg:hidden flex items-center space-x-1">
            {navItems.slice(0, 3).map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-all duration-200 hover:scale-105",
                    item.active && "shadow-glow-primary bg-gradient-primary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>

          {/* Search Bar - Only on large screens */}
          <div className="hidden xl:flex items-center space-x-4 flex-1 max-w-md mx-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 glass-input"
              />
            </div>
          </div>

          {/* Right Side Actions - Condensed */}
          <div className="flex items-center space-x-1">
            {!loading && user && (
              <>
                {/* Quick Actions */}
                <div className="hidden lg:flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-4 h-4" />
                    <Badge 
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 bg-accent text-xs"
                    >
                      3
                    </Badge>
                  </Button>

                  <Link to="/data-sync">
                    <Button variant="ghost" size="icon" title="Data Sync">
                      <Database className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                {/* Profile Menu */}
                <div className="hidden sm:block">
                  <ProfileMenu />
                </div>
              </>
            )}

            {!loading && !user && (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 glass-card">
            <div className="py-4 space-y-2">
              {/* Mobile Search */}
              <div className="px-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Find anime, manga & more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 glass-input"
                  />
                </div>
              </div>

              {/* Mobile Nav Items */}
              {navItems.map((item) => (
                <Link key={item.label} to={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className="w-full justify-start px-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Additional Mobile Nav Items */}
              <Link to="/my-lists">
                <Button
                  variant={window.location.pathname === "/my-lists" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4 mr-3" />
                  My Lists
                </Button>
              </Link>
              
              <Link to="/dashboard">
                <Button
                  variant={window.location.pathname === "/dashboard" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Dashboard
                </Button>
              </Link>

              {/* Mobile Auth/Profile */}
              <div className="border-t border-border/50 pt-4 px-4">
                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Welcome back!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/auth">
                      <Button variant="outline" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="hero" className="w-full justify-start">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};