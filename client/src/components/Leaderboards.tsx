import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Leaderboard as LeaderboardType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Zap, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/gameUtils";

interface LeaderboardProps {
    gameId?: number;
    className?: string;
    limit?: number;
    showTitle?: boolean;
    compact?: boolean;
}

export function Leaderboard({ 
    gameId, 
    className = "", 
    limit = 10,
    showTitle = true,
    compact = false 
  }: LeaderboardProps) {
    const [period, setPeriod] = useState("all_time");
    const [category, setCategory] = useState("biggest_win");

const { data: leaderboardData, isLoading } = useQuery<LeaderboardType[]>({
    queryKey: [gameId ? `/api/games/${gameId}/leaderboard` : '/api/leaderboard', { period, limit }],
    refetchInterval: 60000, // Refresh every minute
});

const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case "biggest_win":
        return <Trophy className="h-4 w-4" />;
      case "highest_multiplier":
        return <Zap className="h-4 w-4" />;
      case "total_games":
        return <Award className="h-4 w-4" />;
      case "total_wagered":
        return <Coins className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
};