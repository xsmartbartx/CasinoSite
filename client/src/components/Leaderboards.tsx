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

