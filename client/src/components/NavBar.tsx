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