import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertGameHistorySchema } from "@shared/schema";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { WebSocketServer, WebSocket } from "ws";

// Game algorithms
// Defines a winning line pattern for 3x3 slot grid
interface WinLine {
  positions: number[]; // Array of positions (0-8) that form a winning line
  multiplier: number; // Multiplier for this winning line
  color?: string; // Optional color for visual representation
  name: string; // Name of the winning pattern
}

// Cryptographically secure random number generator
function secureRandom(min: number, max: number): number {
  // Ensures a secure, fair distribution of random numbers
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxNum = Math.pow(256, bytesNeeded);
  const cutoff = maxNum - (maxNum % range);
  
  let randomNum;
  let randomBytes;

    // Rejection sampling to ensure uniform distribution
  do {
    randomBytes = crypto.randomBytes(bytesNeeded);
    randomNum = 0;
    
    for (let i = 0; i < bytesNeeded; i++) {
      randomNum = (randomNum << 8) | randomBytes[i];
    }
  } while (randomNum >= cutoff);
  
  return min + (randomNum % range);
}

// Get a secure random float between 0 and 1
function secureRandomFloat(): number {
  // Generate 4 bytes (32 bits) of randomness
  const randomBytes = crypto.randomBytes(4);
  
  // Convert to a 32-bit unsigned integer
  const randomInt = randomBytes.readUInt32BE(0);
  
  // Divide by maximum 32-bit unsigned int to get value between 0 and 1
  return randomInt / 0xFFFFFFFF;
}

// Helper to get weighted random symbols with different probabilities using cryptographically secure RNG
function getWeightedRandomSymbol(): string {
  const symbols = ["gem", "crown", "star", "dice", "money"];
  // Define weights (probability distribution) for each symbol
  // Higher value = lower probability
  const weights = {
    "gem": 15,    // rare, high payout
    "crown": 10,  // rare, highest payout
    "star": 5,    // common, medium payout
    "dice": 3,    // very common, low payout
    "money": 8    // moderately common, good payout
  };

    // Calculate total weight
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  // Generate a cryptographically secure random number between 0 and total weight
  let random = secureRandomFloat() * totalWeight;
  
  // Find the symbol based on weight distribution
  for (const symbol of symbols) {
    random -= weights[symbol as keyof typeof weights];
    if (random <= 0) {
      return symbol;
    }
  }

    // Fallback (should never happen)
  return symbols[secureRandom(0, symbols.length)];
}

// Symbol multiplier values
const symbolMultipliers = {
  "gem": 10,
  "crown": 15,
  "star": 5,
  "dice": 3,
  "money": 8
};

// Define all possible winning line patterns on a 3x3 grid
const winningPatterns: WinLine[] = [
  // Horizontal lines
  { positions: [0, 1, 2], multiplier: 1, color: "border-blue-500", name: "Top Row" },
  { positions: [3, 4, 5], multiplier: 1, color: "border-green-500", name: "Middle Row" },
  { positions: [6, 7, 8], multiplier: 1, color: "border-red-500", name: "Bottom Row" },
  
  // Vertical lines
  { positions: [0, 3, 6], multiplier: 1, color: "border-yellow-500", name: "Left Column" },
  { positions: [1, 4, 7], multiplier: 1, color: "border-purple-500", name: "Middle Column" },
  { positions: [2, 5, 8], multiplier: 1, color: "border-pink-500", name: "Right Column" },
  
  // Diagonal lines
  { positions: [0, 4, 8], multiplier: 1.5, color: "border-orange-500", name: "Diagonal \\" },
  { positions: [2, 4, 6], multiplier: 1.5, color: "border-cyan-500", name: "Diagonal /" },
  
  // V-shapes
  { positions: [0, 4, 2], multiplier: 2, color: "border-indigo-500", name: "V-Shape Top" },
  { positions: [6, 4, 8], multiplier: 2, color: "border-amber-500", name: "V-Shape Bottom" },
];