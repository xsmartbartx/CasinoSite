import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import { formatCurrency, parseBetAmount, calculateProbability } from "@/lib/gameUtils";
import { useAuth } from "@/hooks/useAuth";
import { GameHistory } from "@/components/GameHistory";

type BetType = "over" | "under" | "exact";

export default function DiceGame() {
  const { id } = useParams();
  const { user, updateBalance } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bet, setBet] = useState("50.00");
  const [rolling, setRolling] = useState(false);
  const [betType, setBetType] = useState<BetType>("over");
  const [targetValue, setTargetValue] = useState<number>(50);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

    // Fetch game info
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: [`/api/games/${id}`],
    enabled: !!id
  });
  
  // Calculate probability and payout based on bet type and target
  const getProbabilityAndMultiplier = () => {
    let probability = 0;
    let multiplier = 0;
    
    switch (betType) {
      case "over":
        // For "over", probability is (100 - targetValue)/100
        probability = (100 - targetValue) / 100;
        // Fair multiplier with 1.5% house edge
        multiplier = probability > 0 ? (1 / probability) * 0.985 : 0;
        break;
      case "under":
        // For "under", probability is targetValue/100
        probability = targetValue / 100;
        // Fair multiplier with 1.5% house edge
        multiplier = probability > 0 ? (1 / probability) * 0.985 : 0;
        break;
      case "exact":
        // For "exact", probability is 1/100
        probability = 0.01;
        // Fair multiplier with 1.5% house edge
        multiplier = 98.5; // (1/0.01) * 0.985
        break;
    }

        // Convert to percentage and round to 2 decimal places
    probability = Math.round(probability * 10000) / 100;
    multiplier = Math.round(multiplier * 100) / 100;
    
    return { probability, multiplier };
  };
  
  const { probability, multiplier } = getProbabilityAndMultiplier();
  
  // The target value for the slider
  const target = targetValue;
  
  // Roll mutation
  const rollMutation = useMutation({
    mutationFn: async (params: { bet: number; targetValue: number; betType: string }) => {
      const res = await apiRequest("POST", "/api/play/dice", params);
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the results from the server response
      setLastRoll(data.diceRoll);
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
          description: `Dice roll: ${data.diceRoll}. You won ${formatCurrency(data.payout)}!`,
          variant: "default",
        });
      } else {
        toast({
          title: "You Lost",
          description: `Dice roll: ${data.diceRoll}. Better luck next time!`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Roll failed",
        description: error.message || "Could not process your bet",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Stop rolling animation
      setTimeout(() => {
        setRolling(false);
      }, 1000); 
    }
  });
  
  const handleRoll = () => {
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
    
    // Start rolling animation
    setRolling(true);
    setLastWin(null);
    
    // Send the roll request
    rollMutation.mutate({
      bet: betAmount,
      targetValue,
      betType
    });
  };
  
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBet(e.target.value);
  };
  
  const handleBetTypeChange = (value: string) => {
    setBetType(value as BetType);
    
    // Reset target value to appropriate default
    if (value === "over") setTargetValue(50);
    else if (value === "under") setTargetValue(50);
    else setTargetValue(50);
  };
  
  const handleTargetChange = (value: number[]) => {
    setTargetValue(value[0]);
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
              <h2 className="font-display text-xl font-semibold">{game?.name || "Dice"}</h2>
              <span className="ml-3 px-2 py-0.5 bg-primary rounded-full text-xs text-neutral-light">Educational Mode</span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Game container */}
            <div className="flex flex-col lg:flex-row">
              {/* Game display area */}
              <div className="flex-grow mb-6 lg:mb-0 lg:mr-6">
                <div className="bg-primary p-4 rounded-lg">
                  {/* Dice roll display */}
                  <div className="flex items-center justify-center mb-6 py-8">
                    <div className="bg-neutral-dark rounded-md p-6 text-center w-full max-w-xs">
                      <div className="text-sm text-neutral-light mb-2">Dice Roll (1-100)</div>
                      {rolling ? (
                        <div className="font-mono text-4xl font-bold text-accent-green animate-pulse">
                          ...
                        </div>
                      ) : (
                        <div className="font-mono text-4xl font-bold text-accent-green">
                          {lastRoll !== null ? lastRoll : "?"}
                        </div>
                      )}
                    </div>
                  </div>

                                    {/* Betting controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Bet type */}
                    <div>
                      <label className="text-sm text-neutral-light mb-1 block">Bet Type</label>
                      <Select value={betType} onValueChange={handleBetTypeChange} disabled={rolling}>
                        <SelectTrigger className="bg-neutral-dark border-neutral-medium w-full">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-dark border-neutral-medium">
                          <SelectItem value="over">Over {target}</SelectItem>
                          <SelectItem value="under">Under {target}</SelectItem>
                          <SelectItem value="exact">Exactly {target}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Bet amount */}
                    <div>
                      <label className="text-sm text-neutral-light mb-1 block">Bet Amount</label>
                      <div className="flex bg-neutral-dark rounded-md overflow-hidden">
                        <button 
                          className="px-2 py-1 text-neutral-light hover:bg-neutral-medium"
                          onClick={() => adjustBet(-10)}
                          disabled={rolling}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <Input 
                          type="text"
                          value={bet}
                          onChange={handleBetChange}
                          className="flex-grow bg-neutral-dark border-none text-center text-white font-mono"
                          disabled={rolling}
                        />
                        <button 
                          className="px-2 py-1 text-neutral-light hover:bg-neutral-medium"
                          onClick={() => adjustBet(10)}
                          disabled={rolling}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Target value slider */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-neutral-light">Target Value: {target}</label>
                      <div className="text-xs text-neutral-light">
                        Win Chance: <span className="text-white font-mono">{probability.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Slider
                      value={[targetValue]}
                      min={1}
                      max={99}
                      step={1}
                      onValueChange={handleTargetChange}
                      disabled={rolling}
                      className="mb-1"
                    />
                    <div className="flex justify-between text-xs text-neutral-light">
                      <span>1</span>
                      <span>50</span>
                      <span>99</span>
                    </div>
                  </div>
                  
                  {/* Win display and roll button */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="bg-neutral-dark rounded-md p-3 text-center w-full md:w-auto">
                      <div className="text-sm text-neutral-light mb-1">Win Amount</div>
                      <div className="font-mono text-2xl font-medium text-accent-green">
                        {lastWin !== null ? formatCurrency(lastWin) : "$0.00"}
                      </div>
                    </div>
                    
                    <div className="bg-neutral-dark rounded-md p-3 text-center w-full md:w-auto">
                      <div className="text-sm text-neutral-light mb-1">Multiplier</div>
                      <div className="font-mono text-lg font-medium text-accent-purple">
                        {multiplier.toFixed(2)}x
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleRoll}
                      className="bg-accent-green hover:bg-opacity-80 text-black font-medium py-3 px-8 rounded-md w-full md:w-auto"
                      disabled={rolling}
                    >
                      <i className="fas fa-dice mr-2"></i> Roll
                    </Button>
                  </div>
                </div>
              </div>

                            {/* Game information area */}
              <div className="w-full lg:w-80 bg-primary rounded-lg p-4">
                <h3 className="font-display font-semibold mb-3">Game Information</h3>
                
                {/* Dice Rules */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Game Rules</h4>
                  <div className="bg-neutral-dark p-3 rounded-md mb-3">
                    <ul className="text-xs text-gray-400 space-y-2">
                      <li>• A random number between 1-100 is generated</li>
                      <li>• <b>Over:</b> You win if the roll is higher than your target</li>
                      <li>• <b>Under:</b> You win if the roll is lower than your target</li>
                      <li>• <b>Exact:</b> You win if the roll matches your target exactly</li>
                    </ul>
                  </div>
                </div>
                
                {/* Educational information */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Win Probability</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    The probability of winning changes as you adjust your target value.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-neutral-dark p-3 rounded-md mb-3 cursor-help">
                          <h5 className="text-xs font-medium text-neutral-light mb-1">Probability Formula</h5>
                          <div className="bg-black bg-opacity-30 p-2 rounded font-mono text-xs">
                            {betType === "over" ? `P(win) = (100 - ${target})/100 = ${probability}%` : 
                             betType === "under" ? `P(win) = ${target}/100 = ${probability}%` : 
                             `P(win) = 1/100 = 1%`}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 bg-neutral-dark">
                        <p className="text-xs">
                          {betType === "over" 
                            ? `For "Over ${target}" bets, you win when the dice rolls ${target+1} through 100. That's ${100-target} favorable outcomes out of 100 possible outcomes, giving a probability of ${probability}%.`
                            : betType === "under"
                            ? `For "Under ${target}" bets, you win when the dice rolls 1 through ${target-1}. That's ${target-1} favorable outcomes out of 100 possible outcomes, giving a probability of ${probability}%.`
                            : `For "Exactly ${target}" bets, you win only when the dice rolls exactly ${target}. That's 1 favorable outcome out of 100 possible outcomes, giving a probability of 1%.`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                                {/* Multiplier explanation */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Multiplier Explanation</h4>
                  <div className="bg-neutral-dark p-3 rounded-md">
                    <p className="text-xs text-gray-400 mb-2">
                      The multiplier is calculated based on the probability of winning. The lower the chances, the higher the multiplier.
                    </p>
                    <div className="text-xs bg-black bg-opacity-30 p-2 rounded font-mono">
                      multiplier = (1 / probability) * 0.985
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      A 1.5% house edge is included in the multiplier calculation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Game history section */}
      <section>
        <div className="bg-secondary rounded-lg border border-neutral-dark overflow-hidden">
          <div className="bg-neutral-dark px-6 py-4">
            <h2 className="font-display text-xl font-semibold">Your Game History</h2>
          </div>
          <div className="p-6">
            <GameHistory showTitle={false} />
          </div>
        </div>
      </section>
    </div>
  );
}