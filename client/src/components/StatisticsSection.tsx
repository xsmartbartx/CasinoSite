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