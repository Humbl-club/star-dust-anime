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
  Heart,
  Languages,
  Vault
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ProfileMenu } from "@/components/ProfileMenu";
import { NameToggle } from "@/components/NameToggle";
import { useNamePreference } from "@/hooks/useNamePreference";
import aniVaultLogo from "@/assets/anivault-logo.png";

interface NavigationProps {
  onSearch?: (query: string) => void;
}

export const Navigation = ({ onSearch }: NavigationProps) => {
  const { user, loading } = useAuth();
  const { showEnglish, setShowEnglish } = useNamePreference();
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled 
        ? "glass-nav shadow-lg" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={aniVaultLogo} 
              alt="AniVault" 
              className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" 
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              AniVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "apple-transition rounded-full font-medium",
                    item.active && "bg-primary text-primary-foreground shadow-md"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Additional Navigation Items */}
            <Link to="/my-lists">
              <Button
                variant={window.location.pathname === "/my-lists" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "apple-transition rounded-full font-medium",
                  window.location.pathname === "/my-lists" && "bg-primary text-primary-foreground shadow-md"
                )}
              >
                <Star className="w-4 h-4 mr-2" />
                My Lists
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button
                variant={window.location.pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "apple-transition rounded-full font-medium",
                  window.location.pathname === "/dashboard" && "bg-primary text-primary-foreground shadow-md"
                )}
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search anime & manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 apple-input rounded-full"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Name Toggle - integrated into nav */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEnglish(!showEnglish)}
                className="gap-2 text-xs font-medium rounded-full apple-transition"
              >
                <Languages className="w-4 h-4" />
                {showEnglish ? "EN" : "原"}
              </Button>
            </div>

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

                {/* Data Sync */}
                <Link to="/data-sync">
                  <Button variant="ghost" size="icon" title="Data Sync">
                    <Database className="w-4 h-4" />
                  </Button>
                </Link>

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
                  <Button variant="outline" size="sm" className="apple-button-secondary">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="apple-button">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 glass-card m-4 rounded-2xl">
            <div className="py-4 space-y-2">
              {/* Mobile Search */}
              <div className="px-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search anime & manga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 apple-input rounded-full"
                  />
                </div>
              </div>

              {/* Mobile Name Toggle */}
              <div className="px-4 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEnglish(!showEnglish)}
                  className="w-full justify-start gap-3"
                >
                  <Languages className="w-4 h-4" />
                  {showEnglish ? "Show Original Names" : "Show English Names"}
                </Button>
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