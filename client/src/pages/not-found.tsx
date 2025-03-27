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
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full max-w-md border-border/40 bg-background/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mr-3" />
              <p className="text-sm">
                The requested URL could not be found on this server.
              </p>
            </div>
            
            <div className="grid gap-2 mt-6">
              <div className="flex items-center text-muted-foreground">
                <Search className="h-4 w-4 mr-2" />
                <span className="text-sm">Try searching for something else</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Home className="h-4 w-4 mr-2" />
                <span className="text-sm">Go back to the homepage</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Gamepad2 className="h-4 w-4 mr-2" />
                <span className="text-sm">Try one of our popular games</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 pt-2 pb-6">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Home
              </Link>
            </Button>
            <Button className="flex-1">
              <Link href="/">
                Try a Game
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
