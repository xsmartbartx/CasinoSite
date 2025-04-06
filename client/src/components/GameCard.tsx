import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface GameCardProps {
    id: number;
    name: string;
    description: string;
    rtp: number;
    type: string;
    difficulty: string;
    popular: boolean;
    className?: string;
}

export function GameCard({
    id,
    name,
    description,
    rtp,
    type,
    difficulty,
    popular,
    className
}: GameCardProps) {
    const [location, navigate] = useLocation();

// Route mapping for each game type
const gameRoutes: Record<string, string> = {
    slot: `/games/slots/${id}`,
    roulette: `/games/roulette/${id}`,
    dice: `/games/dice/${id}`,
};

  // Icon mapping for game types
const getGameIcon = () => {
    switch (type) {
      case 'slot':
        return <i className="fas fa-gem text-accent-green mr-2 text-2xl"></i>;
      case 'roulette':
        return <i className="fas fa-circle text-accent-green mr-2 text-2xl"></i>;
      case 'dice':
        return <i className="fas fa-dice text-accent-green mr-2 text-2xl"></i>;
      default:
        return <i className="fas fa-gamepad text-accent-green mr-2 text-2xl"></i>;
    }
};

// Game preview content
const renderGamePreview = () => {
    switch (type) {
      case 'slot':
        return (
          <div className="grid grid-cols-3 gap-1 p-2 w-full">
            <div className="slot-reel bg-neutral-dark rounded">
              <div className="slot-symbol text-accent-green text-2xl flex items-center justify-center h-full">
                <i className="fas fa-gem"></i>
              </div>
              </div>
            <div className="slot-reel bg-neutral-dark rounded">
              <div className="slot-symbol text-accent-purple text-2xl flex items-center justify-center h-full">
                <i className="fas fa-crown"></i>
              </div>
            </div>
            <div className="slot-reel bg-neutral-dark rounded">
              <div className="slot-symbol text-accent-green text-2xl flex items-center justify-center h-full">
                <i className="fas fa-gem"></i>
              </div>
            </div>
          </div>
        );
        case 'roulette':
            return (
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-neutral-dark border-4 border-neutral-medium relative roulette-wheel">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neutral-light rounded-full"></div>
                  <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neutral-light rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-neutral-light rounded-full"></div>
                  <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neutral-light rounded-full"></div>