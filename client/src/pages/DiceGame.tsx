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

    