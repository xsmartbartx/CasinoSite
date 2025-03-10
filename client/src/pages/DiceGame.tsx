import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dice } from "@/components/ui/dice";
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
  const [targetValue, setTargetValue] = useState<number>(7);
  const [dice, setDice] = useState<number[]>([1, 1]);
  const [lastSum, setLastSum] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  
  // Fetch game info
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: [`/api/games/${id}`],
    enabled: !!id
  });
  
  // Calculate probability and payout based on bet type and target
  const getProbabilityAndMultiplier = () => {
    // Possible dice sums and their frequencies
    // Sum:         2  3  4  5  6  7  8  9 10 11 12
    // Frequency:   1  2  3  4  5  6  5  4  3  2  1
    const totalOutcomes = 36; // 6×6 possible dice combinations
    
    let favorableOutcomes = 0;
    let multiplier = 0;
    
    switch (betType) {
      case "over":
        // Sum > target
        for (let sum = target + 1; sum <= 12; sum++) {
          favorableOutcomes += getFrequency(sum);
        }
        multiplier = favorableOutcomes > 0 ? (12 - targetValue) / 3 : 0;
        break;
      case "under":
        // Sum < target
        for (let sum = 2; sum < target; sum++) {
          favorableOutcomes += getFrequency(sum);
        }
        multiplier = favorableOutcomes > 0 ? targetValue / 3 : 0;
        break;
      case "exact":
        // Sum = target
        favorableOutcomes = getFrequency(target);
        // Set multiplier based on the probability
        if (target === 2 || target === 12) multiplier = 35;
        else if (target === 3 || target === 11) multiplier = 17;
        else if (target === 4 || target === 10) multiplier = 11;
        else if (target === 5 || target === 9) multiplier = 8;
        else if (target === 6 || target === 8) multiplier = 6;
        else if (target === 7) multiplier = 5;
        break;
    }
    
    const probability = (favorableOutcomes / totalOutcomes) * 100;
    
    return { probability, multiplier };
  };
  
  // Get frequency of a dice sum (how many ways to get this sum)
  const getFrequency = (sum: number) => {
    if (sum < 2 || sum > 12) return 0;
    return sum <= 7 ? sum - 1 : 13 - sum;
  };
  
  const { probability, multiplier } = getProbabilityAndMultiplier();
  
  // The target value for the slider (depends on bet type)
  const target = targetValue;
  
  // Roll mutation
  const rollMutation = useMutation({
    mutationFn: async (params: { bet: number; targetValue: number; betType: string }) => {
      const res = await apiRequest("POST", "/api/play/dice", params);
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the results from the server response
      setDice(data.dice);
      setLastSum(data.sum);
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
          description: `Dice sum: ${data.sum}. You won ${formatCurrency(data.payout)}!`,
          variant: "default",
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
      }, 1500); // Wait for the animation to complete
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
    if (value === "over") setTargetValue(7);
    else if (value === "under") setTargetValue(7);
    else setTargetValue(7);
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
                  {/* Dice display */}
                  <div className="flex items-center justify-center mb-6 py-8">
                    <div className="flex space-x-6">
                      <Dice 
                        value={dice[0]} 
                        rolling={rolling}
                        size="lg"
                      />
                      <Dice 
                        value={dice[1]} 
                        rolling={rolling}
                        size="lg"
                      />
                    </div>
                    {lastSum !== null && (
                      <div className="ml-4 bg-neutral-dark px-4 py-2 rounded text-accent-green font-mono text-xl">
                        {lastSum}
                      </div>
                    )}
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
                      min={2}
                      max={12}
                      step={1}
                      onValueChange={handleTargetChange}
                      disabled={rolling}
                      className="mb-1"
                    />
                    <div className="flex justify-between text-xs text-neutral-light">
                      <span>2</span>
                      <span>7</span>
                      <span>12</span>
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
                
                {/* Dice combinations */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Dice Combinations</h4>
                  <div className="bg-neutral-dark p-3 rounded-md mb-3">
                    <div className="text-xs text-neutral-light mb-2">Ways to get each sum:</div>
                    <div className="grid grid-cols-11 gap-1 text-center">
                      {Array.from({ length: 11 }, (_, i) => i + 2).map(sum => (
                        <div key={sum} className="text-xs">
                          <div className="font-bold">{sum}</div>
                          <div className="text-accent-green">{getFrequency(sum)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Educational information */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Did You Know?</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    The most common dice sum is 7, with 6 different ways to roll it. The least common are 2 and 12, with only 1 way each.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-neutral-dark p-3 rounded-md mb-3 cursor-help">
                          <h5 className="text-xs font-medium text-neutral-light mb-1">Probability Formula</h5>
                          <div className="bg-black bg-opacity-30 p-2 rounded font-mono text-xs">
                            P(sum=7) = 6/36 = 1/6 = 16.67%
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 bg-neutral-dark">
                        <p className="text-xs">
                          With two dice, there are 36 possible combinations (6 × 6).
                          The sum 7 can be achieved with: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1).
                          That's 6 ways out of 36 possible outcomes, giving a probability of 6/36 = 1/6 ≈ 16.67%.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Multiplier explanation */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Multiplier Explanation</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    The multiplier is based on probability. The less likely an outcome, the higher the multiplier to balance risk and reward.
                  </p>
                  <div className="text-xs text-neutral-light">
                    <div className="flex justify-between mb-1">
                      <span>Exactly 7:</span>
                      <span className="font-mono">5.0x (16.7% chance)</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Exactly 2 or 12:</span>
                      <span className="font-mono">35.0x (2.8% chance)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Over/Under:</span>
                      <span className="font-mono">Varies by target value</span>
                    </div>
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
