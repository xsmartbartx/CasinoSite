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