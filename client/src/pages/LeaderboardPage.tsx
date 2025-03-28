import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { Helmet } from "react-helmet-async";
import { Leaderboard } from "@/components/Leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const [selectedGame, setSelectedGame] = useState<string>("all");
  
  const { data: games, isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  const handleGameChange = (value: string) => {
    setSelectedGame(value);
  };
  
  return (
    <>
      <Helmet>
        <title>Leaderboards | EduCasino</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold flex items-center">
              <Trophy className="h-8 w-8 mr-2 text-yellow-500" />
              Leaderboards
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Compete with other players across different games and time periods. Can you climb to the top?
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Select value={selectedGame} onValueChange={handleGameChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {games?.map((game) => (
                  <SelectItem key={game.id} value={game.id.toString()}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <Leaderboard 
            gameId={selectedGame !== "all" ? parseInt(selectedGame) : undefined}
            showTitle={false}
            limit={20}
          />
          
          <Card className="bg-secondary/70 border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-display font-semibold mb-4">About Leaderboards</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Leaderboards show the top performers in our educational casino platform across different games and time periods.
                </p>
                <p>
                  <strong>Time Periods:</strong>
                  <ul className="list-disc pl-6 mt-1">
                    <li><strong>Today</strong> - Rankings reset daily at midnight UTC</li>
                    <li><strong>This Week</strong> - Rankings reset weekly on Monday at midnight UTC</li>
                    <li><strong>This Month</strong> - Rankings reset monthly on the 1st of each month at midnight UTC</li>
                    <li><strong>All Time</strong> - Permanent rankings since the platform's inception</li>
                  </ul>
                </p>
                <p>
                  <strong>Categories:</strong>
                  <ul className="list-disc pl-6 mt-1">
                    <li><strong>Biggest Wins</strong> - Players with the highest single payouts</li>
                    <li><strong>Highest Multipliers</strong> - Players who've hit the largest multipliers</li>
                    <li><strong>Most Games Played</strong> - Players who've played the most games</li>
                    <li><strong>Most Wagered</strong> - Players who've wagered the most virtual currency</li>
                  </ul>
                </p>
                <p className="italic">
                  Remember, EduCasino uses virtual currency for educational purposes only. No real money is involved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}