import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Heart,
  Loader2, 
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import { useNativeSetup } from "@/hooks/useNativeSetup";
import { useNativeActions } from "@/hooks/useNativeActions";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AnimatedLogo } from "@/components/AnimatedLogo";

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export const Navigation = ({ onSearch }: NavigationProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { debouncedSearch, isSearching, searchResults, lastSearchInfo, clearSearch, recentSearches } = useOptimizedSearch();
  const { isNative, keyboardVisible } = useNativeSetup();
  const { triggerHaptic } = useNativeActions();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        setShowResults(true);
        await debouncedSearch(searchQuery.trim(), 'anime', 12, 100);
      }
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await handleSearch();
    }
  };

  // Handle real-time search as user types
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 2) {
      setShowResults(true);
      debouncedSearch(value.trim(), 'anime', 12);
    } else if (value.trim().length === 0) {
      setShowResults(false);
      clearSearch();
    }
  };

  const handleAnimeClick = (anime: any) => {
    navigate(`/anime/${anime.id}`);
    setShowResults(false);
    clearSearch();
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };

    if (showResults) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showResults]);

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
        : "bg-transparent",
      isNative && "pt-safe-area-inset-top",
      keyboardVisible && isNative && "pb-0"
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

          {/* Search Bar with AI - Only on large screens */}
          <div className="hidden xl:flex items-center space-x-4 flex-1 max-w-md mx-6 relative" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search anime instantly..."
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchQuery.trim().length > 2 && setShowResults(true)}
                className="pl-10 pr-4 glass-input group-hover:border-primary/50 transition-colors"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
              )}
            </div>

            {/* AI Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">AI is searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    {lastSearchInfo?.totalResults && lastSearchInfo.totalResults > searchResults.length && (
                      <div className="px-3 py-2 mb-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Showing {searchResults.length} of {lastSearchInfo.totalResults} results</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      {searchResults.map((anime) => (
                        <div 
                          key={anime.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                          onClick={() => handleAnimeClick(anime)}
                        >
                          <img 
                            src={anime.image_url} 
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">{anime.title}</h4>
                            {anime.title_english && anime.title_english !== anime.title && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{anime.title_english}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {anime.score && (
                                <Badge variant="secondary" className="text-xs">
                                  ★ {anime.score}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {anime.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchQuery.trim() && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
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

                  <Link to="/sync-dashboard">
                    <Button variant="ghost" size="icon" title="Sync Dashboard">
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
              onClick={async () => {
                await triggerHaptic('light');
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
                    placeholder="Search anime instantly..."
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
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
              
              <Link to="/sync-dashboard">
                <Button
                  variant={window.location.pathname === "/sync-dashboard" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Database className="w-4 h-4 mr-3" />
                  Sync Dashboard
                </Button>
              </Link>

              {/* Legal Pages */}
              <div className="border-t border-border/50 pt-2 space-y-1">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Legal
                </div>
                <Link to="/legal/privacy_policy">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs px-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Privacy Policy
                  </Button>
                </Link>
                <Link to="/legal/terms_of_service">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs px-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Terms of Service
                  </Button>
                </Link>
                <Link to="/legal/attributions">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs px-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Data Sources
                  </Button>
                </Link>
              </div>

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