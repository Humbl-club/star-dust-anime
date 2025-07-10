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
  BarChart3,
  X,
  Palette,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { useConsolidatedSearch } from "@/hooks/useConsolidatedSearch";
import { useNativeSetup } from "@/hooks/useNativeSetup";
import { useNativeActions } from "@/hooks/useNativeActions";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { WorkingSearchDropdown } from "@/components/WorkingSearchDropdown";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { Switch } from "@/components/ui/switch";

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export const Navigation = ({ onSearch }: NavigationProps) => {
  const { user, loading } = useAuth();
  const { stats } = useSimpleGameification();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish } = useNamePreference();
  const { canUseFeature } = useEmailVerification();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { performSearch, isSearching, searchResults, clearSearch } = useConsolidatedSearch();
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
        await performSearch(searchQuery.trim(), 'both');
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
    console.log('Input changed:', value);
    setSearchQuery(value);
    if (value.trim().length > 2) {
      console.log('Triggering search for:', value.trim());
      setShowResults(true);
      performSearch(value.trim(), 'both');
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 mt-2",
      isScrolled 
        ? "glass-nav" 
        : "bg-transparent",
      isNative && "pt-safe-area-inset-top",
      keyboardVisible && isNative && "pb-0"
    )}>
      <div className="container mx-auto mobile-safe-padding">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group touch-friendly">
            <AnimatedLogo size="md" />
            <div className="flex flex-col">
              <span className="text-xl font-bold group-hover:opacity-80 transition-opacity">
                <span className="text-accent">Ani</span>
                <span className="text-gradient-primary">thing</span>
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Discover Everything
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Enhanced */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "spring-bounce touch-friendly glass-button",
                    item.active && "shadow-glow-primary bg-gradient-primary border-primary/30"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Compact Navigation for medium screens */}
          <div className="hidden md:lg:hidden flex items-center space-x-2">
            {navItems.slice(0, 3).map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "spring-bounce touch-friendly glass-button",
                    item.active && "shadow-glow-primary bg-gradient-primary border-primary/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>

          {/* Search Bar with Real-time Dropdown - Only on large screens */}
          <div className="hidden xl:flex items-center space-x-4 flex-1 max-w-xs mx-4">
            <WorkingSearchDropdown placeholder="Search anime..." />
          </div>

          {/* Language Toggle */}
          <div className="hidden lg:flex items-center space-x-2 mr-4">
            <div className="flex items-center space-x-2 glass-card border border-primary/20 px-3 py-1.5 rounded-full">
              <Languages className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {showEnglish ? "EN" : "JP"}
              </span>
              <Switch
                checked={showEnglish}
                onCheckedChange={setShowEnglish}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Right Side Actions - Condensed */}
          <div className="flex items-center space-x-1">
            {!loading && user && (
              <>

                {/* Username Display */}
                <div className="hidden md:flex items-center gap-3">
                  {stats?.currentUsername && (
                    <div className="glass-card border border-primary/20 px-3 py-1.5 rounded-full">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse" />
                        <span className={cn(
                          "text-sm font-medium",
                          `username-${stats.usernameTier?.toLowerCase() || 'common'}`
                        )}>
                          {stats.currentUsername}
                        </span>
                      </div>
                    </div>
                  )}
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
              className="lg:hidden touch-friendly"
              onClick={async () => {
                await triggerHaptic('light');
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 glass-card animate-fade-in">
            <div className="py-6 space-y-3">
              {/* Mobile Search */}
              <div className="px-4 mb-4">
                <WorkingSearchDropdown 
                  placeholder="Search anime..." 
                  onResultClick={() => setIsMobileMenuOpen(false)}
                />
              </div>

              {/* Mobile Language Toggle */}
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between p-3 glass-card border border-primary/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Language</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {showEnglish ? "English" : "Original"}
                    </span>
                    <Switch
                      checked={showEnglish}
                      onCheckedChange={setShowEnglish}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Nav Items */}
              {navItems.map((item) => (
                <Link key={item.label} to={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className="w-full justify-start px-6 py-3 touch-friendly text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5 mr-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {/* Additional Mobile Nav Items */}
              <Link to="/my-lists">
                <Button
                  variant={window.location.pathname === "/my-lists" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start px-4",
                    !canUseFeature('my_lists') && "feature-muted"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  disabled={!canUseFeature('my_lists')}
                >
                  <Heart className="w-4 h-4 mr-3" />
                  My Lists
                  {!canUseFeature('my_lists') && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Verify Email
                    </Badge>
                  )}
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

              <Link to="/analytics">
                <Button
                  variant={window.location.pathname === "/analytics" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Analytics
                </Button>
              </Link>

              <Link to="/gamification">
                <Button
                  variant={window.location.pathname === "/gamification" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Sparkles className="w-4 h-4 mr-3" />
                  Gamification
                </Button>
              </Link>

              <Link to="/settings">
                <Button
                  variant={window.location.pathname === "/settings" ? "default" : "ghost"}
                  className="w-full justify-start px-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
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