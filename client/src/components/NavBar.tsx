import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/gameUtils";

export function NavBar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { label: "Home", path: "/" },
    { label: "Games", path: "/games" },
    { label: "Statistics", path: "/statistics" },
    { label: "Education", path: "/education" }
  ];
  
  return (
    <nav className="bg-secondary border-b border-neutral-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="font-display font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-accent-purple">
                  EduCasino
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a className={`
                    ${location === item.path ? 'border-accent-green text-white' : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'} 
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                  `}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* User balance display */}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center px-3 py-1 bg-neutral-dark rounded-lg">
                      <span className="text-accent-green font-mono font-medium">{formatCurrency(user.balance)}</span>
                      <i className="fas fa-info-circle text-xs text-neutral-light ml-1"></i>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-neutral-dark border-neutral-medium">
                    <p className="text-xs">
                      Virtual credits for educational purposes only. No real money involved.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* User avatar or login buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-neutral-dark flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-green">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-accent-purple flex items-center justify-center">
                    <span className="text-white font-medium">{user.username.substring(0, 2).toUpperCase()}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-neutral-dark border-neutral-medium">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { navigate("/statistics"); }}>
                    Statistics
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login">
                  <Button className="bg-accent-green hover:bg-opacity-80 text-black font-medium py-2 px-4 rounded-md transition-colors duration-200">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="bg-transparent border border-accent-green text-accent-green hover:bg-accent-green hover:bg-opacity-10 font-medium py-2 px-4 rounded-md transition-colors duration-200">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className={`
                    ${location === item.path 
                      ? 'bg-neutral-dark text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                    block px-3 py-2 rounded-md text-base font-medium
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-neutral-dark">
            {user ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-accent-purple flex items-center justify-center">
                    <span className="text-white font-medium">{user.username.substring(0, 2).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.username}</div>
                  <div className="text-sm font-medium text-accent-green">{formatCurrency(user.balance)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-4">
                <Link href="/login">
                  <Button className="bg-accent-green hover:bg-opacity-80 text-black font-medium w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="bg-transparent border border-accent-green text-accent-green hover:bg-accent-green hover:bg-opacity-10 font-medium w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
            
            {user && (
              <div className="mt-3 px-2 space-y-1">
                <Link href="/statistics">
                  <a 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Statistics
                  </a>
                </Link>
                <button
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
