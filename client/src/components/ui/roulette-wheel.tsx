import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RouletteWheelProps {
  spinning?: boolean;
  result?: number;
  onSpinEnd?: (result: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RouletteWheel({
  spinning = false,
  result = 0,
  onSpinEnd,
  size = "md",
  className
}: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(spinning);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [currentResult, setCurrentResult] = useState(result);
  
  // European roulette numbers in order
  const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  
  // Map number to color
  const getNumberColor = (num: number) => {
    if (num === 0) return "bg-green-600";
    return num % 2 === 0 ? "bg-black" : "bg-red-600";
  };
  
  useEffect(() => {
    if (spinning) {
      setIsSpinning(true);
      
      // Calculate the ending rotation
      // Each number spans 360 / 37 = ~9.73 degrees
      // We need to rotate to position the result at the top (0 degrees)
      const resultIndex = numbers.indexOf(result);
      const segmentDegrees = 360 / numbers.length;
      
      // Final rotation = result position + random offset + multiple full rotations
      const finalRotation = (resultIndex * segmentDegrees) + 
                            (Math.random() * (segmentDegrees / 2)) + 
                            (360 * (4 + Math.floor(Math.random() * 4))); // 4-8 full rotations
      
      // Set initial fast rotation
      setRotationDegree(finalRotation);
      
      // Spin end timeout
      setTimeout(() => {
        setIsSpinning(false);
        setCurrentResult(result);
        if (onSpinEnd) onSpinEnd(result);
      }, 4000); // Match transition duration
    }
  }, [spinning, result, onSpinEnd, numbers]);
  
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64"
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Wheel */}
      <div 
        className={cn(
          "relative rounded-full border-4 border-neutral-600",
          sizeClasses[size]
        )}
        style={{
          transform: `rotate(${rotationDegree}deg)`,
          transition: isSpinning ? "transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none"
        }}
      >
        {/* Wheel segments */}
        {numbers.map((num, index) => {
          const segmentDegrees = 360 / numbers.length;
          const rotation = index * segmentDegrees;
          return (
            <div 
              key={num}
              className={cn(
                "absolute top-0 left-1/2 -ml-1 h-1/2 origin-bottom",
                getNumberColor(num)
              )}
              style={{
                transform: `rotate(${rotation}deg)`,
                width: "2px"
              }}
            />
          );
        })}
        
        {/* Wheel center */}
        <div className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full bg-neutral-800 flex items-center justify-center">
          <div className="w-2/3 h-2/3 rounded-full bg-neutral-700 flex items-center justify-center">
            <div className="w-1/2 h-1/2 rounded-full bg-neutral-600"></div>
          </div>
        </div>
      </div>
      
      {/* Marker at the top */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md z-10"></div>
      
      {/* Display the current result */}
      <div className="absolute bottom-0 right-0 flex">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-mono",
          getNumberColor(currentResult)
        )}>
          {currentResult}
        </div>
      </div>
    </div>
  );
}
