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