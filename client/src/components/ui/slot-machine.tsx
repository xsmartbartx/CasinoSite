import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SlotSymbol {
  id: string;
  icon: React.ReactNode;
  value: string;
}

// Defines a winning line on the 3x3 grid
export interface WinLine {
  positions: number[]; // Array of positions (0-8) that form a winning line
  multiplier: number; // Multiplier for this winning line
  color?: string; // Optional color for visual representation
  name?: string; // Name of the winning pattern (e.g., "Horizontal", "Diagonal", "V-Shape")
}

export interface SlotResults {
  gridSymbols: string[][]; // 3x3 grid of symbols
  winningLines: WinLine[];  // Array of winning lines
  totalMultiplier: number;  // Total multiplier for all winning lines
}

interface SlotMachineProps {
  symbols: SlotSymbol[];
  spinning?: boolean;
  results?: SlotResults;
  onSpinEnd?: () => void;
  className?: string;
}

export function SlotMachine({
  symbols,
  spinning = false,
  results,
  onSpinEnd,
  className
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(spinning);
  const [gridResults, setGridResults] = useState<string[][]>(
    Array(3).fill(null).map(() => Array(3).fill(symbols[0]?.value || ""))
  );
  const [winningLines, setWinningLines] = useState<WinLine[]>([]);
  const [highlightedLine, setHighlightedLine] = useState<number>(-1);
  const spinTimeouts = useRef<number[]>([]);
  const highlightInterval = useRef<number | null>(null);
  
  // Clean up any running intervals
  useEffect(() => {
    return () => {
      if (highlightInterval.current) {
        clearInterval(highlightInterval.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (spinning) {
      setIsSpinning(true);
      setWinningLines([]);
      
      // Clear any existing timeouts and intervals
      spinTimeouts.current.forEach(timeout => clearTimeout(timeout));
      spinTimeouts.current = [];
      
      if (highlightInterval.current) {
        clearInterval(highlightInterval.current);
        highlightInterval.current = null;
      }
      
      // Generate temporary random symbols for the "spinning" effect
      const tempGrid = Array(3).fill(null).map(() => 
        Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)].value)
      );
      setGridResults(tempGrid);
      
      // Staggered stop times for rows
      const rowStopTimes = [1000, 1500, 2000];
      
      // Spin each row with staggered stop times
      for (let row = 0; row < 3; row++) {
        const spinTime = rowStopTimes[row];
        
        const timeout = window.setTimeout(() => {
          // If we have server results, use them, otherwise generate random
          let newRow: string[];
          
          if (results && results.gridSymbols && results.gridSymbols[row]) {
            newRow = [...results.gridSymbols[row]];
          } else {
            newRow = Array(3).fill(null).map(() => 
              symbols[Math.floor(Math.random() * symbols.length)].value
            );
          }
          
          setGridResults(prev => {
            const newGrid = [...prev];
            newGrid[row] = newRow;
            return newGrid;
          });
          
          // If last row, mark as done spinning and process winning lines
          if (row === 2) {
            setIsSpinning(false);
            
            if (results && results.winningLines) {
              setWinningLines(results.winningLines);
              
              // Set up interval to cycle through highlighting winning lines
              if (results.winningLines.length > 0) {
                setHighlightedLine(0);
                
                if (results.winningLines.length > 1) {
                  highlightInterval.current = window.setInterval(() => {
                    setHighlightedLine(current => {
                      const next = (current + 1) % results.winningLines.length;
                      return next;
                    });
                  }, 1500); // Change highlight every 1.5 seconds
                }
              }
            }
            
            if (onSpinEnd) onSpinEnd();
          }
        }, spinTime);
        
        spinTimeouts.current.push(timeout);
      }
    }
    
    return () => {
      // Cleanup timeouts
      spinTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [spinning, symbols, results, onSpinEnd]);
  
  // Get symbol by value
  const getSymbol = (value: string) => {
    return symbols.find(s => s.value === value) || symbols[0];
  };
  
  // Convert a position number (0-8) to row, col for the 3x3 grid
  const positionToRowCol = (position: number): [number, number] => {
    const row = Math.floor(position / 3);
    const col = position % 3;
    return [row, col];
  };
  
  // Check if a position is part of the currently highlighted winning line
  const isHighlighted = (row: number, col: number): boolean => {
    if (highlightedLine === -1 || !winningLines[highlightedLine]) return false;
    
    const position = row * 3 + col;
    return winningLines[highlightedLine].positions.includes(position);
  };
  
  // Define the color for the highlight border
  const getHighlightColor = (): string => {
    if (highlightedLine === -1 || !winningLines[highlightedLine]) return 'border-accent-green';
    return winningLines[highlightedLine].color || 'border-accent-green';
  };
  
  return (
    <div className={className}>
      <div className="relative bg-neutral-dark p-3 rounded-lg shadow-inner overflow-hidden">
        {/* Win Effects - only shown when there are winning lines */}
        {!isSpinning && winningLines.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/10 to-transparent z-0"></div>
            {/* Additional particle effects could be added here */}
          </div>
        )}
        
        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 relative z-0">
          {gridResults.map((row, rowIndex) => (
            row.map((symbolValue, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "slot-cell bg-neutral-800 rounded-md aspect-square flex items-center justify-center overflow-hidden transition-all",
                  isHighlighted(rowIndex, colIndex) && `border-4 ${getHighlightColor()} scale-105 z-10 shadow-glow`,
                  isHighlighted(rowIndex, colIndex) && "animate-winning-pulse"
                )}
              >
                {isSpinning ? (
                  <div className={cn(
                    "transition-transform",
                    rowIndex === 0 ? "animate-slot-spin-fast" : 
                    rowIndex === 1 ? "animate-slot-spin-medium" : 
                    "animate-slot-spin-slow"
                  )}>
                    {symbols[Math.floor(Math.random() * symbols.length)].icon}
                  </div>
                ) : (
                  <div className={cn(
                    "transition-all duration-200",
                    isHighlighted(rowIndex, colIndex) && "scale-110"
                  )}>
                    {getSymbol(symbolValue)?.icon}
                  </div>
                )}
              </div>
            ))
          ))}
        </div>
      </div>
      
      {/* Winning lines information */}
      {!isSpinning && winningLines.length > 0 && (
        <div className="mt-3 p-2 bg-neutral-800 rounded-md border border-accent-green/30">
          <div className="text-xs text-center text-neutral-300 mb-2">Winning Combinations</div>
          <div className="grid grid-cols-3 gap-2">
            {winningLines.map((line, index) => (
              <div 
                key={index}
                className={cn(
                  "p-2 rounded-md text-center cursor-pointer transition-all",
                  highlightedLine === index 
                    ? "bg-accent-green bg-opacity-20 border border-accent-green" 
                    : "bg-neutral-700 hover:bg-neutral-600 border border-transparent"
                )}
                onClick={() => setHighlightedLine(index)}
              >
                <div className="text-xs font-medium truncate">
                  {line.name || `Line ${index + 1}`}
                </div>
                <div className={cn(
                  "text-sm font-mono mt-1",
                  line.multiplier >= 10 ? "text-accent-purple" : 
                  line.multiplier >= 5 ? "text-accent-green" : 
                  "text-accent-blue"
                )}>
                  ×{line.multiplier.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Total multiplier summary */}
          <div className="mt-2 pt-2 border-t border-neutral-700 flex justify-between items-center">
            <span className="text-xs text-neutral-400">Total Multiplier:</span>
            <span className="text-lg font-mono font-semibold text-accent-green">
              ×{winningLines.reduce((sum, line) => sum + line.multiplier, 0).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
