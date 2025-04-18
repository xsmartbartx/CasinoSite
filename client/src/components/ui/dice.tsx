import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DiceProps {
  value: number;
  rolling?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  backgroundColor?: string;
  dotColor?: string;
}

export function Dice({
  value,
  rolling = false,
  size = "md",
  className,
  backgroundColor = "white",
  dotColor = "black"
}: DiceProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isRolling, setIsRolling] = useState(rolling);

  useEffect(() => {
    if (rolling) {
      setIsRolling(true);
      const interval = setInterval(() => {
        setCurrentValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setIsRolling(false);
        setCurrentValue(value);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCurrentValue(value);
    }
  }, [value, rolling]);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20"
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5"
  };

  const renderDots = () => {
    // Different dot patterns based on dice value
    switch (currentValue) {
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </div>
        );
      case 2:
        return (
          <>
            <div className={cn("absolute top-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </>
        );
      case 3:
        return (
          <>
            <div className={cn("absolute top-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </>
        );
      case 4:
        return (
          <>
            <div className={cn("absolute top-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </>
        );
      case 5:
        return (
          <>
            <div className={cn("absolute top-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </>
        );
      case 6:
        return (
          <>
            <div className={cn("absolute top-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/2 left-1/4 -translate-y-1/2 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute top-1/2 right-1/4 -translate-y-1/2 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 left-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
            <div className={cn("absolute bottom-1/4 right-1/4 rounded-full", dotSizeClasses[size])} style={{ backgroundColor: dotColor }}></div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "relative rounded-lg flex items-center justify-center shadow-md",
        isRolling && "animate-bounce",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {renderDots()}
    </div>
  );
}
