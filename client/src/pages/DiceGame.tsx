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