 import { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
 import { Search, Menu, X, Ticket, User, ShoppingCart, LogOut, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
 import { useUser, useClerk } from '@clerk/clerk-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
   const location = useLocation();
   const navigate = useNavigate();
   const { user, isLoaded } = useUser();
   const { signOut } = useClerk();

   const handleSignOut = async () => {
     await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  // Memoize user display name to prevent re-renders
  const userDisplayName = useMemo(() => {
    if (!user) return '';
    return user.firstName?.charAt(0) ||
           user.primaryEmailAddress?.emailAddress?.charAt(0)?.toUpperCase() ||
           'U';
  }, [user?.firstName, user?.primaryEmailAddress?.emailAddress]);

  // Memoize navigation handlers to prevent re-renders
  const handleNavigateToBookings = useMemo(() => () => navigate('/my-bookings'), [navigate]);
  const handleNavigateToFavorites = useMemo(() => () => navigate('/favorites'), [navigate]);

  // Memoize the user menu component to prevent re-renders
  const UserMenu = useMemo(() => {
    if (!isLoaded || !user) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
               <span className="text-primary-foreground font-semibold text-sm">
                 {userDisplayName}
               </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-strong">
          <div className="px-2 py-1.5">
             <p className="text-sm font-medium text-foreground">{user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleNavigateToBookings}>
             <History className="w-4 h-4 mr-2" />
             My Bookings
           </DropdownMenuItem>
           <DropdownMenuItem onClick={handleNavigateToFavorites}>
             <Ticket className="w-4 h-4 mr-2" />
             My Favorites
           </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Settings className="w-4 h-4 mr-2" />
            Admin Panel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, [isLoaded, user, userDisplayName, handleNavigateToBookings, handleNavigateToFavorites, handleSignOut]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/community-events', label: 'Community' },
    { href: '/movies', label: 'Movies' },
    { href: '/concerts', label: 'Concerts' },
    { href: '/sports', label: 'Sports' },
    { href: '/comedy', label: 'Comedy' },
  ];

  // Memoize active link check to prevent re-renders
  const isActiveLink = useCallback((href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href;
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/Logo1.png"
              alt="EVENTEASE logo"
              className="w-20 h-20 object-contain transition-all duration-300 group-hover:scale-110"
            />
            <span className="font-display text-xl font-bold gradient-text hidden sm:block">
              EVENTEASE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all duration-300',
                  isActiveLink(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events, movies..."
                className="w-64 pl-10 bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Link to="/checkout">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>

            {/* User Menu */}
            {UserMenu || (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {/* Book Tickets CTA */}
            <Link to="/movies">
              <Button className="hidden sm:flex btn-primary">
                <Ticket className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events, movies..."
                className="w-full pl-10 bg-muted/50 border-border/50"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg font-medium transition-all duration-300',
                    isActiveLink(link.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg font-medium text-primary bg-primary/10 mt-2"
                >
                  Sign In / Sign Up
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
