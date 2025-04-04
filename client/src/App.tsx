import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import SlotGame from "@/pages/SlotGame";
import RouletteGame from "@/pages/RouletteGame";
import DiceGame from "@/pages/DiceGame";
import CrashGame from "@/pages/CrashGame";
import Statistics from "@/pages/Statistics";
import Education from "@/pages/Education";
import Admin from "@/pages/Admin";
import LeaderboardPage from "@/pages/LeaderboardPage";


// Page transition variants
const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -10,
    },
  };
  
  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  
// Wrapper component to add animation to each page
const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    );
  };
  
function Router() {
    const [location] = useLocation();
    // Ensure the page scrolls to top on navigation
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [location]);
    
    return (
        <AnimatePresence mode="wait">
          <Switch key={location}>
            <Route path="/">
              <AnimatedPage>
                <Home />
              </AnimatedPage>
            </Route>
            <Route path="/register">
              <AnimatedPage>
                <Register />
              </AnimatedPage>
            </Route>
            <Route path="/login">
              <AnimatedPage>
                <Login />
              </AnimatedPage>
            </Route>
            <Route path="/games/slots/:id">
              {(params) => (
                <AnimatedPage>
                  <SlotGame />
                </AnimatedPage>
              )}
            </Route>
            <Route path="/games/roulette/:id">
              {(params) => (
                <AnimatedPage>
                  <RouletteGame />
                </AnimatedPage>
              )}
            </Route>
            <Route path="/games/dice/:id">
              {(params) => (
                <AnimatedPage>
                  <DiceGame />
                </AnimatedPage>
              )}
            </Route>
            <Route path="/games/crash/:id">
              {(params) => (
                <AnimatedPage>
                  <CrashGame />
                </AnimatedPage>
              )}
            </Route>
            <Route path="/statistics">
              <AnimatedPage>
                <Statistics />
              </AnimatedPage>
            </Route>
            <Route path="/education">
              <AnimatedPage>
                <Education />
              </AnimatedPage>
            </Route>
            <Route path="/education/:id">
              {(params) => (
                <AnimatedPage>
                  <Education />
                </AnimatedPage>
              )}
            </Route>
            <Route path="/admin">
              <AnimatedPage>
                <Admin />
              </AnimatedPage>
            </Route>
            <Route path="/leaderboard">
              <AnimatedPage>
                <LeaderboardPage />
              </AnimatedPage>
            </Route>
            {/* Fallback to 404 */}
            <Route>
              <AnimatedPage>
                <NotFound />
              </AnimatedPage>
            </Route>
          </Switch>
        </AnimatePresence>
      );
    }

function App() {
    // Loading state for initial application load
    const [isLoading, setIsLoading] = useState(true);
      
    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

if (isLoading) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <h2 className="text-xl font-medium animate-pulse">Loading EduCasino...</h2>
            </div>
        </div>
    );
}


return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-background">
            <NavBar />
            <main className="flex-grow pt-16"> {/* Add padding for fixed navbar */}
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
