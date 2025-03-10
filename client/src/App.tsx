import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import SlotGame from "@/pages/SlotGame";
import RouletteGame from "@/pages/RouletteGame";
import DiceGame from "@/pages/DiceGame";
import Statistics from "@/pages/Statistics";
import Education from "@/pages/Education";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/games/slots/:id" component={SlotGame} />
      <Route path="/games/roulette/:id" component={RouletteGame} />
      <Route path="/games/dice/:id" component={DiceGame} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/education" component={Education} />
      <Route path="/education/:id" component={Education} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
