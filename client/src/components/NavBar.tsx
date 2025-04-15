import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/gameUtils";
import { ChevronDown, Home, BarChart2, BookOpen, Menu, X, LogOut, User, DollarSign, Gamepad2, Zap, ShieldCheck, Trophy } from "lucide-react";

export function NavBar() {
    const [location] = useLocation();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

  // Check if window is scrolled for navbar transparency effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: "Home", path: "/", icon: <Home className="w-4 h-4 mr-1" /> },
    { label: "Games", path: "/", icon: <Gamepad2 className="w-4 h-4 mr-1" /> },
    { label: "Leaderboard", path: "/leaderboard", icon: <Trophy className="w-4 h-4 mr-1" /> },
    { label: "Statistics", path: "/statistics", icon: <BarChart2 className="w-4 h-4 mr-1" /> },
    { label: "Education", path: "/education", icon: <BookOpen className="w-4 h-4 mr-1" /> }
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/90 backdrop-blur-md shadow-md' 
          : 'bg-background/50 backdrop-blur-sm'
      }`}
    >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-display font-bold text-2xl gradient-text">
                Kasynoo
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path} className={`
                    group relative flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200
                    ${location === item.path 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }
                  `}>
                    <span className="flex items-center">
                      {item.icon}
                      {item.label}
                    </span>
                    {location === item.path && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                        layoutId="navbar-indicator"
                      />
                    )}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {/* User balance display */}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center px-4 py-1.5 bg-muted rounded-md border border-border animate-glow">

                    <DollarSign className="w-4 h-4 text-primary mr-1.5" />
                      <span className="font-mono font-medium">{formatCurrency(user.balance)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs max-w-xs">
                      Virtual credits for educational purposes only. No real money involved.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* User avatar or login buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center rounded-full h-8 w-8 p-0 overflow-hidden">
                  <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">{user.username.substring(0, 2).toUpperCase()}</span>

                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <span>{user.username}</span>
                      <span className="text-xs text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/statistics" className="flex cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                    </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/statistics" className="flex cursor-pointer items-center">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Statistics</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' || user.role === 'superadmin' ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex cursor-pointer items-center">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-3">
                                <Link href="/login">
                  <Button size="sm" variant="secondary" className="font-medium">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="default" className="font-medium">
                    <Zap className="mr-1 h-4 w-4" />
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
            {user && (
              <div className="mr-2 flex items-center px-2 py-1 bg-muted rounded-md border border-border">
                <DollarSign className="w-3.5 h-3.5 text-primary mr-1" />
                <span className="text-sm font-mono font-medium">{formatCurrency(user.balance)}</span>
              </div>
            )}
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              className="text-foreground"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

    {/* Mobile menu, show/hide with animation */}
    <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
        >
        <motion.div 
              className="px-2 pt-2 pb-3 space-y-1 bg-muted/30 backdrop-blur-md border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, staggerChildren: 0.05 }}
            >
            {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                                      <Link 
                    href={item.path} 
                    className={`
                      flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
                      ${location === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-1">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>                  <Link 
                    href={item.path} 
                    className={`
                      flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
                      ${location === item.path 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-1">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="pt-4 pb-3 border-t border-border bg-muted/30 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {user ? (
                <div className="px-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">{user.username.substring(0, 2).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium">{user.username}</div>
                      <div className="text-sm text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Link 
                      href="/statistics"
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors duration-150"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >