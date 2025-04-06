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