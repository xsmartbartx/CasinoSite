import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SlotMachine, SlotResults, WinLine } from "@/components/ui/slot-machine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, parseBetAmount } from "@/lib/gameUtils";
import { useAuth } from "@/hooks/useAuth";
import { GameHistory } from "@/components/GameHistory";

export default function SlotGame() {
  const { id } = useParams();
  const { user, updateBalance } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bet, setBet] = useState("50.00");
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<SlotResults | undefined>(undefined);
  const [lastWin, setLastWin] = useState<number | null>(null);

    // Fetch game info
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: [`/api/games/${id}`],
    enabled: !!id
  });
  
  const symbols = [
    { id: "gem", value: "gem", icon: <i className="fas fa-gem text-accent-green text-4xl"></i> },
    { id: "crown", value: "crown", icon: <i className="fas fa-crown text-accent-purple text-4xl"></i> },
    { id: "star", value: "star", icon: <i className="fas fa-star text-accent-green text-4xl"></i> },
    { id: "dice", value: "dice", icon: <i className="fas fa-dice text-white text-4xl"></i> },
    { id: "money", value: "money", icon: <i className="fas fa-money-bill-wave text-accent-green text-4xl"></i> }
  ];

    // Spin mutation
  const spinMutation = useMutation({
    mutationFn: async (betAmount: number) => {
      const res = await apiRequest("POST", "/api/play/slot", { bet: betAmount });
      return await res.json();
    },
    onSuccess: (data) => {
      // Update the results from the server response
      setResults({
        gridSymbols: data.gridSymbols,
        winningLines: data.winningLines,
        totalMultiplier: data.totalMultiplier
      });
      setLastWin(data.payout);
      
      // Update user balance
      if (user) {
        updateBalance(data.balance);
      }

            // Invalidate game history
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
      
      // Show toast for big wins
      if (data.payout > parseFloat(bet) * 5) {
        toast({
          title: "Big Win!",
          description: `You won ${formatCurrency(data.payout)}!`,
          variant: "default",
        });
      }
      
            // For multiple winning lines, show a special message
      if (data.winningLines && data.winningLines.length > 1) {
        toast({
          title: "Multiple Winning Lines!",
          description: `You hit ${data.winningLines.length} winning combinations!`,
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
      // Stop spinning animation is now handled by the SlotMachine component
      // when it finishes displaying the results
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

        // Start spinning animation
    setSpinning(true);
    setLastWin(null);
    
    // Send the spin request
    spinMutation.mutate(betAmount);
  };
  
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBet(e.target.value);
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
              <h2 className="font-display text-xl font-semibold">{game?.name || "Slots"}</h2>
              <span className="ml-3 px-2 py-0.5 bg-primary rounded-full text-xs text-neutral-light">Educational Mode</span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Game container */}
            <div className="flex flex-col lg:flex-row">
              {/* Game display area */}
              <div className="flex-grow mb-6 lg:mb-0 lg:mr-6">
                <div className="bg-primary p-4 rounded-lg">
                  {/* Slot machine display */}
                  <SlotMachine 
                    symbols={symbols}
                    spinning={spinning}
                    results={results}
                    onSpinEnd={() => setSpinning(false)}
                    className="mb-4"
                  />

                                    {/* Win display */}
                  <div className="bg-neutral-dark rounded-md p-3 mb-4 text-center">
                    <div className="text-sm text-neutral-light mb-1">Win Amount</div>
                    <div className="font-mono text-2xl font-medium text-accent-green">
                      {lastWin !== null ? formatCurrency(lastWin) : "$0.00"}
                    </div>
                  </div>
                  
                  {/* Control buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <label className="text-sm text-neutral-light mr-2">Bet:</label>
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
                          className="w-16 bg-neutral-dark border-none text-center text-white font-mono"
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
                    
                    <Button
                      onClick={handleSpin}
                      className="bg-accent-green hover:bg-opacity-80 text-black font-medium py-2 px-8 rounded-md"
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
                
                {/* Symbol Paytable */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Symbol Values</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <i className="fas fa-gem text-accent-green mr-1"></i>
                        <i className="fas fa-gem text-accent-green mr-1"></i>
                        <i className="fas fa-gem text-accent-green"></i>
                      </div>
                      <span className="font-mono">x10</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <i className="fas fa-crown text-accent-purple mr-1"></i>
                        <i className="fas fa-crown text-accent-purple mr-1"></i>
                        <i className="fas fa-crown text-accent-purple"></i>
                      </div>
                      <span className="font-mono">x15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <i className="fas fa-star text-accent-green mr-1"></i>
                        <i className="fas fa-star text-accent-green mr-1"></i>
                        <i className="fas fa-star text-accent-green"></i>
                      </div>
                      <span className="font-mono">x5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <i className="fas fa-dice text-white mr-1"></i>
                        <i className="fas fa-dice text-white mr-1"></i>
                        <i className="fas fa-dice text-white"></i>
                      </div>
                      <span className="font-mono">x3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <i className="fas fa-money-bill-wave text-accent-green mr-1"></i>
                        <i className="fas fa-money-bill-wave text-accent-green mr-1"></i>
                        <i className="fas fa-money-bill-wave text-accent-green"></i>
                      </div>
                      <span className="font-mono">x8</span>
                    </div>
                  </div>
                </div>

                                {/* Win Patterns */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Win Patterns</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-neutral-light mb-1">Horizontal Lines (x1)</div>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div className="bg-blue-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-blue-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-blue-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div className="bg-green-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-green-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-green-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="bg-red-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-red-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-red-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-light mb-1">Vertical Lines (x1)</div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="bg-yellow-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-purple-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-pink-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-yellow-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-purple-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-pink-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-yellow-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-purple-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="bg-pink-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-light mb-1">Diagonal Lines (x1.5)</div>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div className="bg-orange-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="bg-orange-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="bg-orange-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="bg-cyan-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-cyan-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-cyan-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-light mb-1">V-Shapes (x2)</div>
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div className="bg-indigo-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-indigo-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-indigo-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="h-5"></div>
                        <div className="bg-amber-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-amber-500 bg-opacity-50 h-5 rounded"></div>
                        <div className="h-5"></div>
                        <div className="bg-amber-500 bg-opacity-50 h-5 rounded"></div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-neutral-light">
                      <p>• Three matching symbols in a line = Full win</p>
                      <p>• Two matching high-value symbols in a line = Half win</p>
                      <p>• Multiple winning lines combine their values!</p>
                    </div>
                  </div>
                </div>

                                {/* Educational information */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-light mb-2">Did You Know?</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Each symbol appears with different probability. The RTP (Return to Player) of this game is {game?.rtp || 96.5}%.
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-neutral-dark p-3 rounded-md mb-3 cursor-help">
                          <h5 className="text-xs font-medium text-neutral-light mb-1">Probability Formula</h5>
                          <div className="bg-black bg-opacity-30 p-2 rounded font-mono text-xs">
                            P(win) = (winning combinations) / (total combinations)
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-80 bg-neutral-dark">
                        <p className="text-xs">
                          For a slot machine with 5 symbols on each of 3 reels, there are 5³ = 125 possible combinations.
                          The probability of hitting 3 identical symbols is (5 × 1 × 1) / 125 = 5/125 = 4%.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                                {/* Security information */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-light mb-2">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-shield-alt text-accent-green"></i> Security Features
                    </span>
                  </h4>
                  <div className="bg-neutral-dark p-3 rounded-md">
                    <p className="text-xs text-gray-400 mb-2">
                      This game uses cryptographic randomness to ensure fair outcomes:
                    </p>
                    <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                      <li>Cryptographically secure random number generation (CSPRNG)</li>
                      <li>Uniform distribution for truly fair outcomes</li>
                      <li>Tampering resistance through algorithmic fairness</li>
                    </ul>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-black bg-opacity-30 p-2 rounded font-mono text-xs mt-2 cursor-help">
                            <span className="text-accent-green">crypto.randomBytes()</span> &gt; Math.random()
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="w-80 bg-neutral-dark">
                          <p className="text-xs">
                            Unlike standard Math.random() which uses a predictable algorithm, our games use Node.js crypto.randomBytes() which produces high-quality randomness from your operating system's entropy sources. This makes outcomes truly unpredictable and fair.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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