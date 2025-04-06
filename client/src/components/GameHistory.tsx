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

const getGameIcon = (type: string) => {
    switch (type) {
        case 'slot':
            return <i className="fas fa-gem text-accent-green mr-2"></i>;
        case 'roulette':
            return <i className="fas fa-circle text-accent-green mr-2"></i>;
        case 'dice':
            return <i className="fas fa-dice text-accent-green mr-2"></i>;
        default:
            return <i className="fas fa-gamepad text-accent-green mr-2"></i>;
    }
};

return (
    <div className={`bg-secondary rounded-lg border border-neutral-dark overflow-hidden ${className}`}>
      {showTitle && (
        <div className="px-6 py-4 border-b border-neutral-dark">
          <h3 className="font-display font-medium">Recent Game History</h3>
        </div>
    )}

<div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              <TableHead className="text-neutral-light">Game</TableHead>
              <TableHead className="text-neutral-light">Time</TableHead>
              <TableHead className="text-neutral-light">Bet</TableHead>
              <TableHead className="text-neutral-light">Multiplier</TableHead>
              <TableHead className="text-neutral-light">Payout</TableHead>
              <TableHead className="text-neutral-light">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-secondary divide-y divide-neutral-dark">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : !history || history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No game history found. Play a game to see your results here!
                </TableCell>
              </TableRow>
            ) : (
                history.map((entry: GameHistoryEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {entry.game && getGameIcon(entry.game.type)}
                          <span>{entry.game?.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-light">
                        {formatTimestamp(entry.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(entry.bet)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {entry.multiplier.toFixed(2)}x
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(entry.payout)}
                      </TableCell>
                      <TableCell>