import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RouletteWheel } from "@/components/ui/roulette-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, parseBetAmount, getRouletteColor } from "@/lib/gameUtils";
import { useAuth } from "@/hooks/useAuth";
import { GameHistory } from "@/components/GameHistory";

type BetType = "number" | "color" | "even" | "odd" | "low" | "high";

interface BetOption {
  type: BetType;
  label: string;
  odds: number;
  valueOptions?: { value: string; label: string }[];
}

export default function RouletteGame() {
  const { id } = useParams();
  const { user, updateBalance } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

    const [bet, setBet] = useState("50.00");
  const [spinning, setSpinning] = useState(false);
  const [betType, setBetType] = useState<BetType>("color");
  const [betValue, setBetValue] = useState<string>("red");
  const [result, setResult] = useState<number | undefined>(undefined);
  const [lastWin, setLastWin] = useState<number | null>(null);
  
  // Bet options
  const betOptions: BetOption[] = [
    { 
      type: "number", 
      label: "Straight Up (Number 0-36)", 
      odds: 36,
      valueOptions: Array.from({ length: 37 }, (_, i) => ({ 
        value: i.toString(), 
        label: i.toString() 
      }))
    },
    { 
      type: "color", 
      label: "Color", 
      odds: 2,
      valueOptions: [
        { value: "red", label: "Red" },
        { value: "black", label: "Black" }
      ]
    },
    { type: "even", label: "Even", odds: 2 },
    { type: "odd", label: "Odd", odds: 2 },
    { type: "low", label: "Low (1-18)", odds: 2 },
    { type: "high", label: "High (19-36)", odds: 2 }
  ];

    // Fetch game info
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: [`/api/games/${id}`],
    enabled: !!id
  });
  
  // Find currently selected bet option
  const selectedBetOption = betOptions.find(option => option.type === betType);
  
  // Spin mutation
  const spinMutation = useMutation({
    mutationFn: async (params: { bet: number; betType: string; betValue: any }) => {
      const res = await apiRequest("POST", "/api/play/roulette", params);
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the results from the server response
      setResult(data.number);
      setLastWin(data.payout);

            // Update user balance
      if (user) {
        updateBalance(data.balance);
      }
      
      // Invalidate game history
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      // Show toast for wins
      if (data.win) {
        toast({
          title: "You Won!",
          description: `The ball landed on ${data.number} (${data.color}). You won ${formatCurrency(data.payout)}!`,
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Spin failed",
        description: error.message || "Could not process your bet",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Stop spinning animation
      setTimeout(() => {
        setSpinning(false);
      }, 4000); // Wait for the animation to complete
    }
  });

    const handleSpin = () => {
    const betAmount = parseBetAmount(bet);
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to play",
        variant: "destructive",
      });
      return;
    }
    
    if (!betAmount) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    if (user.balance < betAmount) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to place this bet",
        variant: "destructive",
      });
      return;
    }

        // Handle bet value for different bet types
    let value = betValue;
    
    // For bet types that don't need a specific value (like even/odd)
    if (!selectedBetOption?.valueOptions) {
      value = betType;
    }
    
    // Start spinning animation
    setSpinning(true);
    setLastWin(null);
    
    // Send the spin request
    spinMutation.mutate({ 
      bet: betAmount, 
      betType, 
      betValue: value 
    });
  };

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBet(e.target.value);
  };
  
  const handleBetTypeChange = (value: string) => {
    setBetType(value as BetType);
    
    // Reset bet value when type changes
    const option = betOptions.find(opt => opt.type === value);
    if (option?.valueOptions) {
      setBetValue(option.valueOptions[0].value);
    } else {
      setBetValue(value);
    }
  };

    const adjustBet = (amount: number) => {
    const currentBet = parseBetAmount(bet) || 0;
    const newBet = Math.max(0.01, currentBet + amount);
    setBet(newBet.toFixed(2));
  };
  
  if (gameLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-secondary rounded-lg border border-neutral-dark animate-pulse h-96"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <section className="mb-10">
        <div className="bg-secondary rounded-lg border border-neutral-dark overflow-hidden">
          <div className="bg-neutral-dark px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h2 className="font-display text-xl font-semibold">{game?.name || "Roulette"}</h2>
              <span className="ml-3 px-2 py-0.5 bg-primary rounded-full text-xs text-neutral-light">Educational Mode</span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Game container */}
            <div className="flex flex-col lg:flex-row">
              {/* Game display area */}
              <div className="flex-grow mb-6 lg:mb-0 lg:mr-6">
                <div className="bg-primary p-4 rounded-lg"></div>
                                  {/* Roulette display */}
                  <div className="flex items-center justify-center mb-6 py-8">
                    <RouletteWheel 
                      spinning={spinning}
                      result={result}
                      size="lg"
                    />
                  </div>
                  
                  {/* Betting controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Bet type */}
                    <div>
                      <label className="text-sm text-neutral-light mb-1 block">Bet Type</label>
                      <Select value={betType} onValueChange={handleBetTypeChange} disabled={spinning}>
                        <SelectTrigger className="bg-neutral-dark border-neutral-medium w-full">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-dark border-neutral-medium">
                          {betOptions.map(option => (
                            <SelectItem key={option.type} value={option.type}>
                              {option.label} ({option.odds}:1)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Bet value (if applicable) */}
                    {selectedBetOption?.valueOptions && (
                      <div>
                        <label className="text-sm text-neutral-light mb-1 block">
                          {betType === "number" ? "Number" : "Color"}
                        </label>
                        <Select value={betValue} onValueChange={setBetValue} disabled={spinning}>
                          <SelectTrigger className="bg-neutral-dark border-neutral-medium w-full">
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-dark border-neutral-medium">
                            {selectedBetOption.valueOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                                        {/* Bet amount */}
                    <div>
                      <label className="text-sm text-neutral-light mb-1 block">Bet Amount</label>
                      <div className="flex bg-neutral-dark rounded-md overflow-hidden">
                        <button 
                          className="px-2 py-1 text-neutral-light hover:bg-neutral-medium"
                          onClick={() => adjustBet(-10)}
                          disabled={spinning}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <Input 
                          type="text"
                          value={bet}
                          onChange={handleBetChange}
                          className="flex-grow bg-neutral-dark border-none text-center text-white font-mono"
                          disabled={spinning}
                        />
                        <button 
                          className="px-2 py-1 text-neutral-light hover:bg-neutral-medium"
                          onClick={() => adjustBet(10)}
                          disabled={spinning}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Win display and spin button */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="bg-neutral-dark rounded-md p-3 text-center w-full md:w-auto">
                      <div className="text-sm text-neutral-light mb-1">Win Amount</div>
                      <div className="font-mono text-2xl font-medium text-accent-green">
                        {lastWin !== null ? formatCurrency(lastWin) : "$0.00"}
                      </div>
                    </div>
                    
                    <div className="bg-neutral-dark rounded-md p-3 text-center w-full md:w-auto">
                      <div className="text-sm text-neutral-light mb-1">Potential Win</div>
                      <div className="font-mono text-lg font-medium text-accent-purple">
                        {formatCurrency((parseBetAmount(bet) || 0) * (selectedBetOption?.odds || 0))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleSpin}
                      className="bg-accent-green hover:bg-opacity-80 text-black font-medium py-3 px-8 rounded-md w-full md:w-auto"
                      disabled={spinning}
                    >
                      <i className="fas fa-play mr-2"></i> Spin
                    </Button>
                  </div>
                </div>
              </div>

                            {/* Game information area */}
              <div className="w-full lg:w-80 bg-primary rounded-lg p-4">
                <h3 className="font-display font-semibold mb-3">Game Information</h3>
                
                {/* Roulette layout mini-display */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Roulette Layout</h4>
                  <div className="bg-neutral-dark p-3 rounded-md mb-3">
                    <div className="grid grid-cols-6 gap-1">
                      <div className="col-span-1 bg-green-600 text-white text-xs font-mono h-6 flex items-center justify-center rounded">0</div>
                      {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                        <div 
                          key={num} 
                          className={`text-white text-xs font-mono h-6 flex items-center justify-center rounded ${
                            num % 2 === 0 ? 'bg-black' : 'bg-red-600'
                          }`}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                                {/* Educational information */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Did You Know?</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    European roulette has a house edge of 2.7% due to the zero. This means for every $100 wagered, the expected return is $97.30.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-neutral-dark p-3 rounded-md mb-3 cursor-help">
                          <h5 className="text-xs font-medium text-neutral-light mb-1">Probability Formula</h5>
                          <div className="bg-black bg-opacity-30 p-2 rounded font-mono text-xs">
                            P(red) = 18/37 = 48.65%
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 bg-neutral-dark">
                        <p className="text-xs">
                          In European roulette, there are 18 red numbers, 18 black numbers, and 1 green zero.
                          Therefore, the probability of hitting red is 18/37 ≈ 48.65%, not 50% as many believe.
                          This small difference creates the house edge.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                                {/* Betting strategies */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Betting Strategies</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    No betting strategy can overcome the house edge in the long run. Each spin is an independent event with the same probabilities.
                  </p>
                  <div className="text-xs text-neutral-light">
                    <div className="mb-1"><strong>Martingale:</strong> Double your bet after each loss</div>
                    <div className="mb-1"><strong>D'Alembert:</strong> Increase bet by one unit after loss, decrease by one after win</div>
                    <div><strong>Fibonacci:</strong> Follow the Fibonacci sequence for bet sizes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Game History */}
      {user && (
        <section className="mb-10">
          <GameHistory limit={5} />
        </section>
      )}
    </div>
  );
}