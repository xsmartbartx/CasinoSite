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