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
                