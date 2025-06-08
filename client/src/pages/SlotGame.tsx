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