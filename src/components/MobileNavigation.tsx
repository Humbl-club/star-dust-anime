import { NavLink } from 'react-router-dom';
import { Home, Search, Bookmark, User, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  className?: string;
}

export const MobileNavigation = ({ className }: MobileNavigationProps) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Home',
      exact: true,
    },
    {
      to: '/anime',
      icon: Search,
      label: 'Browse',
    },
    {
      to: '/my-lists',
      icon: Bookmark,
      label: 'Lists',
      requiresAuth: true,
    },
    {
      to: user ? '/dashboard' : '/auth',
      icon: User,
      label: user ? 'Profile' : 'Login',
    },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      "bg-background/80 backdrop-blur-lg border-t border-border/50",
      "pb-safe-area-inset-bottom",
      className
    )}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.requiresAuth && !user) return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg",
                "text-xs font-medium transition-all duration-200",
                "touch-manipulation select-none",
                "min-w-[60px] relative",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span className="text-[10px] leading-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};