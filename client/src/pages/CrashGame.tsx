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

    // User input state
  const [betAmount, setBetAmount] = useState<string>("50.00");
  const [autoCashoutAt, setAutoCashoutAt] = useState<number>(2.00);
  const [enableAutoCashout, setEnableAutoCashout] = useState<boolean>(false);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);

    // Define the game response type
  interface GameResponse {
    id: number;
    name: string;
    description: string;
    type: string;
    rtp: number;
    difficulty: string;
  }

    // Fetch game info
  const { data: game, isLoading: gameLoading } = useQuery<GameResponse>({
    queryKey: [`/api/games/${id}`],
    enabled: !!id
  });

    // Define the crash state response type
  interface CrashStateResponse {
    gameState: GameState;
    currentMultiplier: number;
    history: CrashHistoryEntry[];
    activeBets: ActiveBet[];
    nextGameHash?: string;
  }

    // Fetch crash state
  const { data: crashState, isLoading: crashStateLoading, refetch: refetchCrashState } = useQuery<CrashStateResponse>({
    queryKey: ['/api/crash/state'],
    refetchInterval: gameState === "waiting" ? 5000 : false // Poll every 5 seconds when waiting
  });

    // When crash state is loaded, update our local state
  useEffect(() => {
    if (crashState) {
      setCrashHistory(crashState.history || []);
      setActiveBets(crashState.activeBets || []);
      
      // If game state is different, update it
      if (crashState.gameState !== gameState) {
        setGameState(crashState.gameState as GameState);
        
        // If the game is now running and we weren't running before, start the animation
        if (crashState.gameState === "running" && gameState !== "running") {
          startCrashAnimation();
        }
      }
    }
  }, [crashState, gameState]);

    // Bet mutation
  const betMutation = useMutation({
    mutationFn: async (params: { bet: number; autoCashoutAt: number | null }) => {
      const res = await apiRequest("POST", "/api/play/crash/bet", params);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bet placed",
        description: `Bet of ${formatCurrency(data.bet)} placed successfully`,
        variant: "default",
      });
      
      // Update user balance
      if (user) {
        updateBalance(data.balance);
      }
      
      setHasBet(true);
      setIsCashedOut(false);
      
      // Refetch crash state to show updated active bets
      refetchCrashState();
    },
    onError: (error: any) => {
      toast({
        title: "Bet failed",
        description: error.message || "Could not place your bet",
        variant: "destructive",
      });
    }
  });

    // Cashout mutation
  const cashoutMutation = useMutation({
    mutationFn: async (params: { currentMultiplier: number }) => {
      const res = await apiRequest("POST", "/api/play/crash/cashout", params);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cashed Out!",
        description: `Cashed out at ${data.cashoutMultiplier.toFixed(2)}x and won ${formatCurrency(data.payout)}!`,
        variant: "default",
      });

            // Update user balance
      if (user) {
        updateBalance(data.balance);
      }
      
      setIsCashedOut(true);
      
      // Invalidate game history
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cashout failed",
        description: error.message || "Could not process your cashout",
        variant: "destructive",
      });
    }
  });

    // Start crash animation
  const startCrashAnimation = () => {
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Reset state
    setCurrentMultiplier(1.00);
    setCrashPoint(null);
    setIsCashedOut(false);

        // Set start time
    startTimeRef.current = Date.now();
    multiplierRef.current = 1.00;
    
    // Start animation loop
    animateMultiplier();
  };

    // Animation loop for the multiplier
  const animateMultiplier = () => {
    if (!startTimeRef.current) return;
    
    // Calculate elapsed time and update multiplier
    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    
    // Exponential growth formula for multiplier
    // Use a growth rate that makes it approximately double every 6.5 seconds
    const growthRate = Math.pow(2, 1/6.5);
    multiplierRef.current = Math.pow(growthRate, elapsedSec);
    
    // Round to 2 decimal places and update state
    const roundedMultiplier = Math.floor(multiplierRef.current * 100) / 100;
    setCurrentMultiplier(roundedMultiplier);
    
    // Check for auto-cashout
    if (enableAutoCashout && hasBet && !isCashedOut && roundedMultiplier >= autoCashoutAt) {
      handleCashout();
    }

        // Check for crash (in a real implementation this would come from the server)
    // For demo purposes, let's say we crash randomly when multiplier > 2
    if (roundedMultiplier > 2 && Math.random() < 0.003) {
      // Crashed!
      setCrashPoint(roundedMultiplier);
      setGameState("crashed");
      setHasBet(false);
      
      // Show crash message
      toast({
        title: "Crashed!",
        description: `The game crashed at ${roundedMultiplier.toFixed(2)}x`,
        variant: "destructive",
      });
      
      // Wait 5 seconds and reset to waiting state
      setTimeout(() => {
        setGameState("waiting");
        
        // Add this crash to history
        setCrashHistory(prev => [
          ...prev, 
          { 
            crashPoint: roundedMultiplier,
            timestamp: new Date().toISOString()
          }
        ].slice(-10)); // Keep last 10 entries

                // Refetch crash state
        refetchCrashState();
      }, 5000);
      
      return;
    }

        // Continue animation if not crashed
    if (gameState === "running") {
      animationFrameRef.current = requestAnimationFrame(animateMultiplier);
    }
  };
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'gameState':
          // Initial game state
          setCrashHistory(data.data.history || []);
          setActiveBets(data.data.activeBets || []);
          setGameState(data.data.gameState as GameState);
          if (data.data.gameState === 'running') {
            startCrashAnimation();
          }
          break;
          
        case 'gameStart':
          // Game started
          setGameState('running');
          startTimeRef.current = data.data.startTime;
          startCrashAnimation();
          break;
          
        case 'multiplierUpdate':
          // Update multiplier (server-driven)
          setCurrentMultiplier(data.data.multiplier);
          break;
          
        case 'gameCrash':
          // Game crashed
          setCrashPoint(data.data.crashPoint);
          setGameState('crashed');
          setHasBet(false);
          
          // Add to history
          setCrashHistory(data.data.history);
          
          // Show crash message
          toast({
            title: "Crashed!",
            description: `The game crashed at ${data.data.crashPoint.toFixed(2)}x`,
            variant: "destructive",
          });

                    // Cancel animation
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          break;
          
        case 'waitingForNext':
          // Waiting for next game
          setGameState('waiting');
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [toast]);

    // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    // Store reference
    webSocketRef.current = socket;
    
    // Setup event handlers
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onmessage = handleWebSocketMessage;
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Could not connect to game server. Please refresh the page.",
        variant: "destructive",
      });
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

        // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [handleWebSocketMessage, toast]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Handle bet button click
  const handleBet = () => {
    const bet = parseBetAmount(betAmount);
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to play",
        variant: "destructive",
      });
      return;
    }
    
    if (!bet) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }
    
    if (user.balance < bet) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to place this bet",
        variant: "destructive",
      });
      return;
    }
    
    // Send bet to server via WebSocket if connected
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'placeBet',
        data: {
          bet,
          autoCashoutAt: enableAutoCashout ? autoCashoutAt : null,
          userId: user.id
        }
      }));
    }
    
    // Also call the API for the backend to process the bet
    betMutation.mutate({
      bet,
      autoCashoutAt: enableAutoCashout ? autoCashoutAt : null
    });
  };

    // Handle cashout button click
  const handleCashout = () => {
    if (!hasBet || isCashedOut) return;
    
    // Send cashout to server via WebSocket if connected
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'cashout',
        data: {
          currentMultiplier,
          userId: user?.id
        }
      }));
    }

        // Also call the API for the backend to process the cashout
    cashoutMutation.mutate({
      currentMultiplier
    });
  };
  
  // Handle bet amount change
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(e.target.value);
  };
  
  // Handle auto-cashout change
  const handleAutoCashoutChange = (value: number[]) => {
    setAutoCashoutAt(value[0]);
  };
  
  // Handle auto-cashout toggle
  const handleAutoCashoutToggle = (checked: boolean) => {
    setEnableAutoCashout(checked);
  };

    // Adjust bet amount
  const adjustBet = (amount: number) => {
    const currentBet = parseBetAmount(betAmount) || 0;
    const newBet = Math.max(0.01, currentBet + amount);
    setBetAmount(newBet.toFixed(2));
  };
  
  // Format time for chart
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Prepare chart data
  const chartData = crashHistory.map(entry => ({
    time: formatTime(entry.timestamp),
    multiplier: entry.crashPoint
  }));