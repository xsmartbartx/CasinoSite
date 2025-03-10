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
              
              <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-neutral-medium flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-accent-green"></div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 flex">
              <div className="roulette-number bg-red-600 text-white text-xs font-mono mr-1 w-6 h-6 rounded-full flex items-center justify-center">3</div>
              <div className="roulette-number bg-black text-white text-xs font-mono mr-1 w-6 h-6 rounded-full flex items-center justify-center">26</div>
              <div className="roulette-number bg-red-600 text-white text-xs font-mono w-6 h-6 rounded-full flex items-center justify-center">14</div>
            </div>
          </div>
        );
      case 'dice':
        return (
          <div className="flex space-x-4 items-center justify-center">
            <div className="dice w-12 h-12 bg-white rounded-lg flex items-center justify-center relative">
              <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full"></div>
            </div>
            <div className="dice w-12 h-12 bg-white rounded-lg flex items-center justify-center relative">
              <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 bg-black rounded-full"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center">
            <i className="fas fa-gamepad text-accent-green text-4xl"></i>
          </div>
        );
    }
  };
  
  // RTP tooltip explanation based on game type
  const getRtpExplanation = () => {
    switch (type) {
      case 'slot':
        return "Return to Player: The theoretical percentage of wagered money that is paid back to players over time.";
      case 'roulette':
        return "The European roulette has a house edge of 2.7%, meaning for every $100 wagered, the expected return is $97.30 over time.";
      case 'dice':
        return "The theoretical return to player varies based on the type of bet placed.";
      default:
        return "Return to Player: The theoretical percentage of wagered money that is paid back to players over time.";
    }
  };
  
  const handlePlay = () => {
    const route = gameRoutes[type] || '/games';
    navigate(route);
  };
  
  return (
    <div className={cn(
      "game-card bg-secondary rounded-lg overflow-hidden border border-neutral-dark hover:shadow-glow transition-all duration-300",
      className
    )}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-semibold text-lg">{name}</h3>
          {popular ? (
            <span className="text-xs px-2 py-1 bg-neutral-dark rounded-full">Popular</span>
          ) : (
            <span className="text-xs px-2 py-1 bg-neutral-dark rounded-full">{difficulty}</span>
          )}
        </div>
        <div className="relative h-40 bg-primary rounded-md overflow-hidden mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            {renderGamePreview()}
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          {description}
        </p>
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-neutral-light">RTP:</span>
            <span className="text-white ml-1 font-mono">{rtp}%</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block ml-1 cursor-help">
                    <i className="fas fa-info-circle text-xs text-neutral-light"></i>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="w-56 bg-neutral-dark border border-neutral-medium">
                  <p className="text-xs">{getRtpExplanation()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            onClick={handlePlay}
            className="bg-accent-green hover:bg-opacity-80 text-black text-sm font-medium py-1.5 px-4 rounded"
          >
            Play
          </Button>
        </div>
      </div>
    </div>
  );
}
