import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Home, AlertTriangle, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-block relative">
          <div className="absolute inset-0 blur-xl opacity-20 bg-primary rounded-full"></div>
          <span className="relative text-9xl font-bold gradient-text">404</span>
        </div>
        <h1 className="text-3xl font-bold mt-4">Page Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          We couldn't find the page you were looking for. 
          It might have been moved or doesn't exist.
        </p>
      </motion.div>