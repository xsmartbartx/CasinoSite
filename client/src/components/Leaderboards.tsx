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

const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case "biggest_win":
        return "Biggest Wins";
      case "highest_multiplier":
        return "Highest Multipliers";
      case "total_games":
        return "Most Games Played";
      case "total_wagered":
        return "Most Wagered";
      default:
        return "Leaderboard";
    }
};

const formatValue = (value: number | null, cat: string) => {
    if (value === null) return "0";
    
    switch(cat) {
      case "biggest_win":
      case "total_wagered":
        return formatCurrency(Number(value));
      case "highest_multiplier":
        return `${Number(value).toFixed(2)}x`;
      case "total_games":
        return value.toString();
      default:
        return value.toString();
    }
};

const handlePeriodChange = (value: string) => {
    setPeriod(value);
};

const handleCategoryChange = (value: string) => {
    setCategory(value);
};
  
return (
    <Card className={`${className} bg-secondary/70 border-border`}>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            {getCategoryIcon(category)}
            <span className="ml-2">{getCategoryLabel(category)} Leaderboard</span>
          </CardTitle>
        </CardHeader>
)}

<CardContent className="p-3 pb-4">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <Tabs 
              value={category} 
              onValueChange={handleCategoryChange}
              className="w-full md:w-auto"
            >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="biggest_win" className="text-xs flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Biggest</span> Wins
                </TabsTrigger>
                <TabsTrigger value="highest_multiplier" className="text-xs flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Highest</span> Multipliers
                </TabsTrigger>
                <TabsTrigger value="total_games" className="text-xs flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Most</span> Games
                </TabsTrigger>
                <TabsTrigger value="total_wagered" className="text-xs flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Most</span> Wagered
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs 
              value={period} 
              onValueChange={handlePeriodChange}
              className="w-full md:w-auto"
            >
            <TabsList className="grid grid-cols-3 md:grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="daily" className="text-xs">
                  Today
                </TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs">
                  This Week
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">
                  This Month
                </TabsTrigger>
                <TabsTrigger value="all_time" className="text-xs">
                  All Time
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: compact ? 5 : 10 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
        ) : (
            <div className="space-y-1">
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData
                  .filter(entry => entry.category === category)
                  .slice(0, compact ? 5 : limit)
                  .map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className={`flex items-center justify-between p-2 rounded-md ${
                        index % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
                      } ${index === 0 ? 'bg-primary/10 border border-primary/20' : ''}`}
                    >
                                              <div className="flex items-center">
                        <div className={`flex items-center justify-center h-7 w-7 rounded-full mr-2 ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                          index === 1 ? 'bg-slate-300/20 text-slate-300' : 
                          index === 2 ? 'bg-amber-700/20 text-amber-700' : 
                          'bg-muted/50 text-muted-foreground'
                        }`}>
                            {entry.rank || index + 1}