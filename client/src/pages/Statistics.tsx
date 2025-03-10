import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/gameUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GameHistory } from "@/components/GameHistory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatisticCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatisticCard({ title, value, subtitle, change, isLoading }: StatisticCardProps) {
  return (
    <Card className="bg-secondary border-neutral-dark">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-neutral-light text-sm">{title}</div>
          {subtitle && (
            <div className="text-xs bg-neutral-dark px-2 py-0.5 rounded-full">{subtitle}</div>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4 bg-neutral-dark" />
        ) : (
          <div className="font-mono text-2xl font-medium">{value}</div>
        )}
        {change && (
          <div className="text-xs text-neutral-light mt-1">
            <span className={change.isPositive ? "text-status-success" : "text-status-error"}>
              <i className={`fas fa-arrow-${change.isPositive ? 'up' : 'down'}`}></i> {Math.abs(change.value)}%
            </span>
            {" "}from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Statistics() {
  const { user } = useAuth();
  const [gameFilter, setGameFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("7days");
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: statistics, isLoading } = useQuery({
    queryKey: ['/api/statistics', { game: gameFilter, time: timeFilter }],
    enabled: !!user
  });
  
  // Generate demo data for charts if needed
  const prepareChartData = () => {
    if (!statistics || !statistics.gameStats) return [];
    
    return statistics.gameStats.map((stat: any) => ({
      name: stat.type.charAt(0).toUpperCase() + stat.type.slice(1),
      total: stat.totalBet,
      won: stat.totalPayout,
      profit: stat.profit
    }));
  };
  
  // Prepare data for RTP comparison chart
  const prepareRTPData = () => {
    if (!statistics || !statistics.gameStats) return [];
    
    return statistics.gameStats.map((stat: any) => ({
      name: stat.type.charAt(0).toUpperCase() + stat.type.slice(1),
      rtp: parseFloat(stat.rtp.toFixed(1))
    }));
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Your Statistics</h1>
        <p className="text-neutral-light mt-2">
          Track your gaming results and understand the mathematics behind your gameplay.
        </p>
      </div>
      
      <div className="flex justify-end items-center mb-6 space-x-2">
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="bg-neutral-dark text-white text-sm rounded-md border-none w-32">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-dark border-neutral-medium">
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="slot">Slots</SelectItem>
            <SelectItem value="roulette">Roulette</SelectItem>
            <SelectItem value="dice">Dice</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="bg-neutral-dark text-white text-sm rounded-md border-none w-36">
            <SelectValue placeholder="Last 7 Days" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-dark border-neutral-medium">
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="alltime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-neutral-dark">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      
        <TabsContent value="overview" className="mt-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatisticCard
              title="Total Wagered"
              value={statistics ? formatCurrency(statistics.totalWagered) : "$0.00"}
              subtitle={gameFilter === "all" ? "All Games" : gameFilter.charAt(0).toUpperCase() + gameFilter.slice(1)}
              change={statistics ? { value: 12.5, isPositive: true } : undefined}
              isLoading={isLoading}
            />
            
            <StatisticCard
              title="Total Won"
              value={statistics ? formatCurrency(statistics.totalWon) : "$0.00"}
              subtitle={gameFilter === "all" ? "All Games" : gameFilter.charAt(0).toUpperCase() + gameFilter.slice(1)}
              change={statistics ? { value: 8.3, isPositive: true } : undefined}
              isLoading={isLoading}
            />
            
            <StatisticCard
              title="Profit/Loss"
              value={statistics ? (
                <span className={statistics.profitLoss >= 0 ? "text-status-success" : "text-status-error"}>
                  {formatCurrency(statistics.profitLoss)}
                </span>
              ) : "$0.00"}
              subtitle={gameFilter === "all" ? "All Games" : gameFilter.charAt(0).toUpperCase() + gameFilter.slice(1)}
              isLoading={isLoading}
            />
            
            <StatisticCard
              title="Games Played"
              value={statistics ? statistics.gamesPlayed : 0}
              subtitle={gameFilter === "all" ? "All Games" : gameFilter.charAt(0).toUpperCase() + gameFilter.slice(1)}
              isLoading={isLoading}
            />
          </div>
          
          {/* Additional Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-secondary border-neutral-dark">
              <CardContent className="p-4">
                <h3 className="font-display font-medium mb-3">Return to Player (RTP)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall RTP</span>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20 bg-neutral-dark" />
                    ) : (
                      <span className="font-mono text-lg">{statistics?.rtp?.toFixed(1) || 0}%</span>
                    )}
                  </div>
                  
                  {statistics?.gameStats && statistics.gameStats.map((game: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{game.type.charAt(0).toUpperCase() + game.type.slice(1)}</span>
                      <span className="font-mono">{game.rtp.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary border-neutral-dark">
              <CardContent className="p-4">
                <h3 className="font-display font-medium mb-3">Performance by Game</h3>
                <div className="space-y-3">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-5 w-1/3 bg-neutral-dark" />
                        <Skeleton className="h-3 w-full bg-neutral-dark" />
                      </div>
                    ))
                  ) : statistics?.gameStats ? (
                    statistics.gameStats.map((game: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{game.type.charAt(0).toUpperCase() + game.type.slice(1)}</span>
                          <span className={`text-sm ${game.profit >= 0 ? "text-status-success" : "text-status-error"}`}>
                            {formatCurrency(game.profit)}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-dark rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${game.profit >= 0 ? "bg-status-success" : "bg-status-error"}`}
                            style={{ width: `${Math.min(100, Math.abs(game.profit / game.totalBet * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-light text-sm">No game data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Game History */}
          <GameHistory limit={5} showTitle={true} />
        </TabsContent>
        
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="bg-secondary border-neutral-dark">
              <CardContent className="p-4">
                <h3 className="font-display font-medium mb-3">Wagered vs Won by Game</h3>
                <div className="h-80">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-neutral-light">Loading chart data...</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fill: '#777' }} />
                        <YAxis tick={{ fill: '#777' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1D2C', borderColor: '#333' }}
                          formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="total" name="Wagered" fill="hsl(var(--chart-1))" />
                        <Bar dataKey="won" name="Won" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary border-neutral-dark">
              <CardContent className="p-4">
                <h3 className="font-display font-medium mb-3">Return to Player (RTP) by Game</h3>
                <div className="h-80">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-neutral-light">Loading chart data...</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareRTPData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fill: '#777' }} />
                        <YAxis tick={{ fill: '#777' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1D2C', borderColor: '#333' }}
                          formatter={(value: any) => [`${value}%`, 'RTP']}
                        />
                        <Bar dataKey="rtp" name="RTP %" fill="hsl(var(--chart-3))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-secondary border-neutral-dark mb-8">
            <CardContent className="p-4">
              <h3 className="font-display font-medium mb-2">Understanding These Statistics</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  <strong>Return to Player (RTP):</strong> This is the percentage of all wagers that are paid back to players over time. 
                  For example, an RTP of 96% means that for every $100 wagered, on average $96 will be returned to players.
                </p>
                <p>
                  <strong>House Edge:</strong> The mathematical advantage that the casino has over you as a player. 
                  It's calculated as 100% - RTP. For example, if the RTP is 96%, the house edge is 4%.
                </p>
                <p>
                  <strong>Variance/Volatility:</strong> This describes how your results will vary from the expected RTP in the short term. 
                  High volatility games have more extreme wins and losses, while low volatility games have more consistent results.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <GameHistory limit={10} showPagination={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
