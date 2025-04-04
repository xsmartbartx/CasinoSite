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
  