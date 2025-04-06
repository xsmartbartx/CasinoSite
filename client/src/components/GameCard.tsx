import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface GameCardProps {
    id: number;
    name: string;
    description: string;
    rtp: number;
    type: string;
    difficulty: string;
    popular: boolean;
    className?: string;
}