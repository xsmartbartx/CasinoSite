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