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

function generateSlotResult() {
  // Generate a 3x3 grid of symbols
  const grid: string[][] = [
    [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
    [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()],
    [getWeightedRandomSymbol(), getWeightedRandomSymbol(), getWeightedRandomSymbol()]
  ];

    // Convert 2D grid to 1D array for easier pattern matching
  const flatGrid: string[] = grid.flat();
  
  // Find winning lines
  const winningLines: WinLine[] = [];
  let totalMultiplier = 0;
  
  for (const pattern of winningPatterns) {
    // Extract symbols for this pattern
    const lineSymbols = pattern.positions.map(pos => flatGrid[pos]);
    
    // Check if all symbols in line are the same (3 of a kind)
    if (lineSymbols[0] === lineSymbols[1] && lineSymbols[1] === lineSymbols[2]) {
      const symbolType = lineSymbols[0];
      const symbolMultiplier = symbolMultipliers[symbolType as keyof typeof symbolMultipliers];
      
      // Calculate total multiplier for this line: base pattern multiplier * symbol value
      const lineMultiplier = pattern.multiplier * symbolMultiplier;
      
      winningLines.push({
        ...pattern,
        multiplier: lineMultiplier
      });
      
      totalMultiplier += lineMultiplier;
    }
        // Check for 2 of a kind (partial win)
    else if ((lineSymbols[0] === lineSymbols[1] || lineSymbols[1] === lineSymbols[2] || lineSymbols[0] === lineSymbols[2])) {
      // Only award partial wins for high-value symbols (gem, crown, money)
      const hasHighValueSymbol = lineSymbols.some(s => ["gem", "crown", "money"].includes(s));
      
      if (hasHighValueSymbol) {
        // Half multiplier for 2 of a kind
        const lineMultiplier = pattern.multiplier * 0.5;
        
        winningLines.push({
          ...pattern,
          multiplier: lineMultiplier
        });
        
        totalMultiplier += lineMultiplier;
      }
    }
  }
  
  return {
    gridSymbols: grid,
    winningLines,
    totalMultiplier
  };
}

function generateRouletteResult(betType: string, betValue: any) {
  // Using cryptographically secure RNG for roulette (0-36)
  const number = secureRandom(0, 37); 
  const color = number === 0 ? 'green' : (number % 2 === 0 ? 'black' : 'red');
  const isEven = number !== 0 && number % 2 === 0;
  const isLow = number >= 1 && number <= 18;
  
  let win = false;
  let multiplier = 0;
  
  switch (betType) {
    case 'number':
      win = number === parseInt(betValue);
      multiplier = win ? 36 : 0;
      break;
    case 'color':
      win = color === betValue;
      multiplier = win ? 2 : 0;
      break;
    case 'even':
      win = isEven;
      multiplier = win ? 2 : 0;
      break;
    case 'odd':
      win = !isEven && number !== 0;
      multiplier = win ? 2 : 0;
      break;
    case 'low':
      win = isLow;
      multiplier = win ? 2 : 0;
      break;
    case 'high':
      win = number > 18 && number <= 36;
      multiplier = win ? 2 : 0;
      break;
    default:
      multiplier = 0;
  }
  
  return {
    number,
    color,
    multiplier,
    win
  };
}

function generateDiceResult(targetValue: number, betType: string) {
  // Generate a random number between 1-100
  const diceRoll = secureRandom(1, 101); // 1-100 inclusive
  
  let win = false;
  let multiplier = 0;
  
  switch (betType) {
    case 'over':
      win = diceRoll > targetValue;
      // Calculate multiplier based on probability
      // As target increases, probability of winning decreases, so multiplier increases
      if (win) {
        // Calculate fair multiplier with 1.5% house edge
        // For "over" bets: 100/(100-target) * 0.985
        multiplier = (100 / (100 - targetValue)) * 0.985;
      }
      break;
    case 'under':
      win = diceRoll < targetValue;
      // Calculate multiplier based on probability
      // As target decreases, probability of winning decreases, so multiplier increases
      if (win) {
        // Calculate fair multiplier with 1.5% house edge
        // For "under" bets: 100/target * 0.985
        multiplier = (100 / targetValue) * 0.985;
      }
      break;
    case 'exact':
      win = diceRoll === targetValue;
      // Exact matches have 1/100 probability
      multiplier = win ? 98.5 : 0; // 100 * 0.985 (1.5% house edge)
      break;
    default:
      multiplier = 0;
  }

    // Round the multiplier to 2 decimal places for display purposes
  multiplier = Math.round(multiplier * 100) / 100;
  
  return {
    diceRoll,
    targetValue,
    betType,
    multiplier,
    win
  };
}

// Generate a crash point based on cryptographic randomness
// This uses a house edge of 3% and the formula ensures provably fair outcomes
function generateCrashPoint(): number {
  // Generate a secure random value between 0 and 1
  const randomValue = secureRandomFloat();
  
  // Apply crash algorithm with 3% house edge
  // The formula: 99 / (1 - R) where R is from 0 to 1
  // This creates an exponential distribution with 1% of games crashing at 1.00x
  let crashPoint: number;
  
  if (randomValue < 0.01) {
    // 1% of games crash at 1.00x (instant crash)
    crashPoint = 1.00;
  } else {
    // Formula with 3% house edge: 0.97 * 100 / (1 - R)
    crashPoint = Math.floor((0.97 * 100 / (1 - randomValue)) * 100) / 100;
    
    // Cap at 1000x for practical purposes
    crashPoint = Math.min(crashPoint, 1000);
  }
  
  return crashPoint;
}

// Generate a verifiable crash point using a seed and hash
// This is more advanced and allows verifying past crashes
function generateVerifiableCrashPoint(seed: string, salt: string): number {
  // Create a hash using seed and salt
  const hash = crypto
    .createHmac('sha256', salt)
    .update(seed)
    .digest('hex');
    
  // Convert first 8 chars of hash to a number between 0-1
  const hashFloat = parseInt(hash.slice(0, 8), 16) / 0xffffffff;
  
  // Same formula as above but using the hash-derived value
  let crashPoint: number;
  
  if (hashFloat < 0.01) {
    crashPoint = 1.00;
  } else {
    crashPoint = Math.floor((0.97 * 100 / (1 - hashFloat)) * 100) / 100;
    crashPoint = Math.min(crashPoint, 1000);
  }
  
  return crashPoint;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const SessionStore = MemoryStore(session);
  
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'educasino-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

    // Auth middleware
  const authMiddleware = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin middleware - checks if user has admin role
  const adminMiddleware = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

    // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = crypto
        .createHash('sha256')
        .update(validatedData.password)
        .digest('hex');
      
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword
      });
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

            // Hash password for comparison
      const hashedPassword = crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
      
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Exclude password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Exclude password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Game routes
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.status(200).json(games);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.status(200).json(game);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Play game routes
  app.post('/api/play/slot', authMiddleware, async (req, res) => {
    try {
      const { bet } = req.body;
      
      if (!bet || typeof bet !== 'number' || bet <= 0) {
        return res.status(400).json({ message: "Valid bet amount is required" });
      }
      
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

            // Get slot game ID
      const games = await storage.getAllGames();
      const slotGame = games.find(g => g.type === 'slot');
      
      if (!slotGame) {
        return res.status(404).json({ message: "Slot game not found" });
      }
      
      // Generate result
      const result = generateSlotResult();
      const payout = bet * result.totalMultiplier;
      
      // Update user balance
      await storage.updateUserBalance(userId, payout - bet);

            // Record game history
      await storage.createGameHistory({
        userId,
        gameId: slotGame.id,
        bet,
        multiplier: result.totalMultiplier,
        payout,
        result: payout > 0 ? "win" : "loss",
        details: JSON.stringify(result)
      });
      
      res.status(200).json({
        ...result,
        bet,
        payout,
        balance: (user.balance + payout - bet)
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post('/api/play/roulette', authMiddleware, async (req, res) => {
    try {
      const { bet, betType, betValue } = req.body;
      
      if (!bet || typeof bet !== 'number' || bet <= 0) {
        return res.status(400).json({ message: "Valid bet amount is required" });
      }
      
      if (!betType || !betValue) {
        return res.status(400).json({ message: "Bet type and value are required" });
      }
      
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

            // Get roulette game ID
      const games = await storage.getAllGames();
      const rouletteGame = games.find(g => g.type === 'roulette');
      
      if (!rouletteGame) {
        return res.status(404).json({ message: "Roulette game not found" });
      }
      
      // Generate result
      const result = generateRouletteResult(betType, betValue);
      const payout = bet * result.multiplier;
      
      // Update user balance
      await storage.updateUserBalance(userId, payout - bet);
      
      // Record game history
      await storage.createGameHistory({
        userId,
        gameId: rouletteGame.id,
        bet,
        multiplier: result.multiplier,
        payout,
        result: result.win ? "win" : "loss",
        details: JSON.stringify(result)
      });

            res.status(200).json({
        ...result,
        bet,
        payout,
        balance: (user.balance + payout - bet)
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post('/api/play/dice', authMiddleware, async (req, res) => {
    try {
      const { bet, targetValue, betType } = req.body;
      
      if (!bet || typeof bet !== 'number' || bet <= 0) {
        return res.status(400).json({ message: "Valid bet amount is required" });
      }
      
      if (!targetValue || !betType) {
        return res.status(400).json({ message: "Target value and bet type are required" });
      }
      
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < bet) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

            // Get dice game ID
      const games = await storage.getAllGames();
      const diceGame = games.find(g => g.type === 'dice');
      
      if (!diceGame) {
        return res.status(404).json({ message: "Dice game not found" });
      }
      
      // Generate result
      const result = generateDiceResult(targetValue, betType);
      const payout = bet * result.multiplier;
      
      // Update user balance
      await storage.updateUserBalance(userId, payout - bet);
      
      // Record game history
      await storage.createGameHistory({
        userId,
        gameId: diceGame.id,
        bet,
        multiplier: result.multiplier,
        payout,
        result: result.win ? "win" : "loss",
        details: JSON.stringify(result)
      });
      
      res.status(200).json({
        ...result,
        bet,
        payout,
        balance: (user.balance + payout - bet)
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Game history routes
  app.get('/api/history', authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const history = await storage.getGameHistory(userId, limit, offset);
      
      // Enrich with game information
      const enrichedHistory = await Promise.all(history.map(async (h) => {
        const game = await storage.getGame(h.gameId);
        return {
          ...h,
          game: game ? { name: game.name, type: game.type } : undefined
        };
      }));
      
      res.status(200).json(enrichedHistory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Statistics routes
  app.get('/api/statistics', authMiddleware, async (req, res) => {
    try {
      const userId = req.session.userId as number;
      const statistics = await storage.getUserStatistics(userId);
      res.status(200).json(statistics);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });