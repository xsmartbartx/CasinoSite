import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SlotSymbol {
  id: string;
  icon: React.ReactNode;
  value: string;
}

interface SlotMachineProps {
  symbols: SlotSymbol[];
  spinning?: boolean;
  results?: string[];
  onSpinEnd?: () => void;
  reelCount?: number;
  className?: string;
}

export function SlotMachine({
  symbols,
  spinning = false,
  results = [],
  onSpinEnd,
  reelCount = 3,
  className
}: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(spinning);
  const [reelResults, setReelResults] = useState<string[]>(Array(reelCount).fill(symbols[0]?.value || ""));
  const spinTimeouts = useRef<number[]>([]);
  
  useEffect(() => {
    if (spinning) {
      setIsSpinning(true);
      
      // Clear any existing timeouts
      spinTimeouts.current.forEach(timeout => clearTimeout(timeout));
      spinTimeouts.current = [];
      
      // Spin each reel with staggered stop times
      for (let i = 0; i < reelCount; i++) {
        const spinTime = 1000 + (i * 500); // Staggered stop times
        
        const timeout = window.setTimeout(() => {
          // Set the result for this reel if provided, otherwise random
          const result = results && results[i] 
            ? results[i] 
            : symbols[Math.floor(Math.random() * symbols.length)].value;
          
          setReelResults(prev => {
            const newResults = [...prev];
            newResults[i] = result;
            return newResults;
          });
          
          // If last reel, mark as done spinning
          if (i === reelCount - 1) {
            setIsSpinning(false);
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
  }, [spinning, symbols, reelCount, results, onSpinEnd]);
  
  // Get symbol by value
  const getSymbol = (value: string) => {
    return symbols.find(s => s.value === value) || symbols[0];
  };
  
  return (
    <div className={cn("grid gap-2", `grid-cols-${reelCount}`, className)}>
      {Array.from({ length: reelCount }).map((_, index) => (
        <div 
          key={index}
          className="slot-reel bg-neutral-800 rounded-md h-32 flex items-center justify-center overflow-hidden"
        >
          {isSpinning && index === reelCount - 1 ? (
            <div className="animate-spin">
              {getSymbol(reelResults[index])?.icon}
            </div>
          ) : isSpinning ? (
            <div className="animate-spin">
              {symbols[Math.floor(Math.random() * symbols.length)].icon}
            </div>
          ) : (
            <div className="transition-all duration-200">
              {getSymbol(reelResults[index])?.icon}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
