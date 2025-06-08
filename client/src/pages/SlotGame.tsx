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