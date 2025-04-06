import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatTimestamp } from "@/lib/gameUtils";
import { useAuth } from "@/hooks/useAuth";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export interface GameHistoryEntry {
    id: number;
    gameId: number;
    userId: number;
    bet: number;
    multiplier: number;
    payout: number;
    result: "win" | "loss";
    details: string;
    createdAt: string;
    game?: {
      name: string;
      type: string;
    };
}

interface GameHistoryProps {
    limit?: number;
    showTitle?: boolean;
    showPagination?: boolean;
    className?: string;
}

export function GameHistory({ 
    limit = 10,
    showTitle = true,
    showPagination = true,
    className
}: GameHistoryProps) {
    const { user } = useAuth();
    const [page, setPage] = React.useState(1);

    const { data: history, isLoading } = useQuery({
        queryKey: ['/api/history', { limit, offset: (page - 1) * limit }],
        enabled: !!user
    });