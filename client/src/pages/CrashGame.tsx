import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, parseBetAmount } from "@/lib/gameUtils";
import { useAuth } from "@/hooks/useAuth";
import { GameHistory } from "@/components/GameHistory";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

// Game states
type GameState = "waiting" | "running" | "crashed";

// Type for crash history entry
interface CrashHistoryEntry {
  crashPoint: number;
  timestamp: string;
}

// Active bet type
interface ActiveBet {
  userId: number;
  username: string;
  bet: number;
  autoCashoutAt: number | null;
  hashedOut: boolean;
}

export default function CrashGame() {
  const { id } = useParams();
  const { user, updateBalance } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

    // Game state and refs
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [crashHistory, setCrashHistory] = useState<CrashHistoryEntry[]>([]);
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const multiplierRef = useRef<number>(1.00);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);