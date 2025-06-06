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