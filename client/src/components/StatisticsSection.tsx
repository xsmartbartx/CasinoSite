import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/gameUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameHistory } from "@/components/GameHistory";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticCardProps {
    title: string;
    value: string | number;
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
   
export function StatisticsSection() {
    const { user } = useAuth();
    const [gameFilter, setGameFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("7days");
    
    const { data: statistics, isLoading } = useQuery({
      queryKey: ['/api/statistics', { game: gameFilter, time: timeFilter }],
      enabled: !!user
    });

    return (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl font-semibold">Your Statistics</h2>
            <div className="flex space-x-2">
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