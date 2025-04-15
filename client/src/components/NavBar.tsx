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