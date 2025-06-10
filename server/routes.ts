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

    // Educational content routes
  app.get('/api/education', async (req, res) => {
    try {
      const content = await storage.getAllEducationalContent();
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get('/api/education/:id', async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      const content = await storage.getEducationalContent(contentId);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Crash game routes
  
  // Get the current crash state and history
  app.get('/api/crash/state', async (req, res) => {
    try {
      // In a real implementation, this would come from a persistent store
      // or a shared memory cache across server instances
      
      // Generate 10 previous crash points for the history graph
      const crashHistory = Array.from({ length: 10 }, () => {
        return {
          crashPoint: generateCrashPoint(),
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString() // Random time in the last hour
        };
      }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // For educational purposes, include a verifiable crash seed for the current round
      const currentGameSeed = crypto.randomBytes(16).toString('hex');
      const serverSalt = process.env.CRASH_SALT || 'educasino-crash-salt';
      
      // Calculate the next crash point using the verifiable method
      const nextCrashPoint = generateVerifiableCrashPoint(currentGameSeed, serverSalt);
      
      res.status(200).json({
        gameState: 'waiting', // 'waiting', 'running', or 'crashed'
        history: crashHistory,
        // Include these for verifiable fairness
        currentGameSeed, 
        // Don't expose the server salt, as it's used to generate the crash point
        nextGameHash: crypto.createHash('sha256').update(currentGameSeed + '|next').digest('hex'),
        // Include current active bets (would come from database in real implementation)
        activeBets: []
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Place a bet in the crash game
  app.post('/api/play/crash/bet', authMiddleware, async (req, res) => {
    try {
      const { bet, autoCashoutAt } = req.body;
      
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
      
      // Get crash game ID
      const games = await storage.getAllGames();
      const crashGame = games.find(g => g.type === 'crash');
      
      if (!crashGame) {
        return res.status(404).json({ message: "Crash game not found" });
      }


      // Deduct bet from user balance
      // In a real implementation, this would be handled when the round starts
      await storage.updateUserBalance(userId, -bet);
      
      // In a real implementation, this bet would be saved to a database and
      // associated with the current game round
      
      res.status(200).json({
        message: "Bet placed successfully",
        bet,
        autoCashoutAt: autoCashoutAt || null,
        balance: user.balance - bet
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Cash out from the current crash game
  app.post('/api/play/crash/cashout', authMiddleware, async (req, res) => {
    try {
      const { currentMultiplier } = req.body;
      
      if (!currentMultiplier || typeof currentMultiplier !== 'number' || currentMultiplier < 1) {
        return res.status(400).json({ message: "Valid multiplier is required" });
      }
      
      const userId = req.session.userId as number;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

            // In a real implementation, we would:
      // 1. Verify the user has an active bet in the current round
      // 2. Verify the current multiplier is valid
      // 3. Get the original bet amount
      
      // For this example, we'll simulate a bet of 50 units
      const simulatedBet = 50;
      const payout = simulatedBet * currentMultiplier;
      
      // Get crash game ID
      const games = await storage.getAllGames();
      const crashGame = games.find(g => g.type === 'crash');
      
      if (!crashGame) {
        return res.status(404).json({ message: "Crash game not found" });
      }

            // Update user balance with winnings
      await storage.updateUserBalance(userId, payout);
      
      // Record game history
      await storage.createGameHistory({
        userId,
        gameId: crashGame.id,
        bet: simulatedBet,
        multiplier: currentMultiplier,
        payout,
        result: "win",
        details: JSON.stringify({
          cashoutMultiplier: currentMultiplier
        })
      });
      
      res.status(200).json({
        message: "Cashed out successfully",
        cashoutMultiplier: currentMultiplier,
        payout,
        balance: user.balance + payout
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

    // Create HTTP server to allow direct WebSocket access
  const httpServer = createServer(app);
  
  // Create WebSocket server on a specific path for Crash game
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients and their assigned rooms
  interface ConnectedClient extends WebSocket {
    userId?: number;
    username?: string;
    room?: string;
    isAdmin?: boolean;
  }

    // Map to store connected clients
  const connectedClients = new Map<WebSocket, ConnectedClient>();
  
  // Helper function to broadcast to a specific room
  const broadcastToRoom = (room: string, message: any) => {
    const messageStr = JSON.stringify(message);
    connectedClients.forEach((client) => {
      if (client.room === room && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  };

    // Define types for crash game
  interface CrashActiveBet {
    userId: number;
    username: string;
    bet: number;
    autoCashoutAt: number | null;
    hashedOut: boolean;
  }
  
  interface CrashHistoryEntry {
    crashPoint: number;
    timestamp: string;
  }
  
  interface CrashGameState {
    gameState: 'waiting' | 'running' | 'crashed';
    currentMultiplier: number;
    startTime: number;
    crashPoint: number;
    history: CrashHistoryEntry[];
    activeBets: CrashActiveBet[];
    currentGameSeed: string;
    nextGameHash: string;
  }

    // Store active game state
  let crashGameState: CrashGameState = {
    gameState: 'waiting', // waiting, running, crashed
    currentMultiplier: 1.00,
    startTime: Date.now(),
    crashPoint: generateCrashPoint(),
    history: Array.from({ length: 10 }, () => {
      return {
        crashPoint: generateCrashPoint(),
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString()
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    activeBets: [],
    currentGameSeed: crypto.randomBytes(16).toString('hex'),
    nextGameHash: '',
  };

    // Initialize the next game hash
  const serverSalt = process.env.CRASH_SALT || 'educasino-crash-salt';
  crashGameState.nextGameHash = crypto.createHash('sha256')
    .update(crashGameState.currentGameSeed + '|next')
    .digest('hex');
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    // Cast the WebSocket to our custom interface
    const client = ws as ConnectedClient;
    
    // Send current game state to new client
    ws.send(JSON.stringify({
      type: 'gameState',
      data: crashGameState
    }));

        // Store the client in our connected clients map
    connectedClients.set(ws, client);
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch(data.type) {
          case 'joinRoom':
            // Handle joining chat room
            const { room, userId: chatUserId, username: chatUsername } = data.data;
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Room name is required' }
              }));
              return;
            }

                        // Set client properties
            client.room = room;
            if (chatUserId) client.userId = chatUserId;
            if (chatUsername) client.username = chatUsername;
            
            // If user is authenticated, check if they're an admin
            if (chatUserId) {
              const user = await storage.getUser(chatUserId);
              client.isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
            }
            
            // Get recent messages for the room
            const recentMessages = await storage.getChatMessages(room, 50);
            
            // Send welcome message and recent chat history
            ws.send(JSON.stringify({
              type: 'roomJoined',
              data: {
                room,
                recentMessages
              }
            }));

                        // Notify room of new user if they're authenticated
            if (chatUserId && chatUsername) {
              broadcastToRoom(room, {
                type: 'systemMessage',
                data: {
                  message: `${chatUsername} has joined the room`,
                  timestamp: new Date().toISOString()
                }
              });
            }
            break;
            
          case 'chatMessage':
            // Check if client has joined a room
            if (!client.room) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'You must join a room before sending messages' }
              }));
              return;
            }

                        // Validate message data
            const { content, messageUserId, messageUsername } = data.data;
            if (!content || !messageUserId || !messageUsername) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid message data' }
              }));
              return;
            }
            
            // Create chat message in database
            const chatMessage = await storage.createChatMessage({
              userId: messageUserId,
              username: messageUsername,
              content,
              room: client.room
            });

                        // Broadcast message to all clients in the room
            broadcastToRoom(client.room, {
              type: 'newChatMessage',
              data: chatMessage
            });
            break;
            
          case 'moderateMessage':
            // Check if user is admin
            if (!client.isAdmin) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Unauthorized: Admin privileges required' }
              }));
              return;
            }

                        // Validate moderation data
            const { messageId, action } = data.data;
            if (!messageId || !action) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid moderation data' }
              }));
              return;
            }
            
            // Apply moderation action
            let moderatedMessage;
            if (action === 'delete') {
              moderatedMessage = await storage.moderateChatMessage(messageId, true, true);
            } else if (action === 'flag') {
              moderatedMessage = await storage.moderateChatMessage(messageId, false, true);
            }
            
            // If successful, broadcast moderation action to room
            if (moderatedMessage && client.room) {
              broadcastToRoom(client.room, {
                type: 'messageModerated',
                data: {
                  messageId,
                  action,
                  message: moderatedMessage
                }
              });
            }
            break;
          case 'placeBet':
            if (crashGameState.gameState !== 'waiting') {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Cannot place bet when game is in progress' }
              }));
              return;
            }

                        // Validate bet data
            const { bet, autoCashoutAt, userId } = data.data;
            if (!bet || !userId) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid bet data' }
              }));
              return;
            }
            
            // Check if user already has a bet
            const existingBetIndex = crashGameState.activeBets.findIndex(b => b.userId === userId);
            if (existingBetIndex >= 0) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'You already have an active bet' }
              }));
              return;
            }

                        // Get user
            const playerUser = await storage.getUser(userId);
            if (!playerUser) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'User not found' }
              }));
              return;
            }
            
            // Add bet to active bets
            crashGameState.activeBets.push({
              userId,
              username: playerUser.username,
              bet,
              autoCashoutAt,
              hashedOut: false
            });
            
                        // Broadcast updated active bets to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'activeBetsUpdate',
                  data: {
                    activeBets: crashGameState.activeBets
                  }
                }));
              }
            });
            break;
            
          case 'cashout':
            if (crashGameState.gameState !== 'running') {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Cannot cash out when game is not running' }
              }));
              return;
            }

                        // Validate cashout data
            const { currentMultiplier, userId: cashoutUserId } = data.data;
            if (!cashoutUserId) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid cashout data' }
              }));
              return;
            }
            
            // Find user's bet
            const betIndex = crashGameState.activeBets.findIndex(b => b.userId === cashoutUserId && !b.hashedOut);
            if (betIndex < 0) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'No active bet found or already cashed out' }
              }));
              return;
            }

                        // Mark as cashed out and calculate winnings
            crashGameState.activeBets[betIndex].hashedOut = true;
            const userBet = crashGameState.activeBets[betIndex];
            const payout = userBet.bet * currentMultiplier;
            
            // Update user balance in database
            const cashoutUser = await storage.getUser(cashoutUserId);
            if (cashoutUser) {
              await storage.updateUserBalance(cashoutUserId, payout - userBet.bet);

                          // Create game history entry
              const games = await storage.getAllGames();
              const crashGame = games.find(g => g.type === 'crash');
              
              if (crashGame) {
                await storage.createGameHistory({
                  userId: cashoutUserId,
                  gameId: crashGame.id,
                  bet: userBet.bet,
                  multiplier: currentMultiplier,
                  payout,
                  result: 'win',
                  details: JSON.stringify({
                    cashoutAt: currentMultiplier,
                    originalBet: userBet.bet
                  })
                });
              }
            }
            
                        // Send cashout confirmation to the user
            ws.send(JSON.stringify({
              type: 'cashoutSuccess',
              data: {
                payout,
                multiplier: currentMultiplier
              }
            }));
            
            // Broadcast updated active bets to all clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'activeBetsUpdate',
                  data: {
                    activeBets: crashGameState.activeBets
                  }
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });

        // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      
      // Notify room of user disconnect if they were in a room
      if (client.room && client.username) {
        broadcastToRoom(client.room, {
          type: 'systemMessage',
          data: {
            message: `${client.username} has left the room`,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Remove client from our map
      connectedClients.delete(ws);
    });
  });

    // Start the crash game simulation
  let gameInterval: NodeJS.Timeout | null = null;
  
  // Function to start a new game round
  function startCrashGame() {
    if (crashGameState.gameState !== 'waiting') return;
    
    // Update game state
    crashGameState.gameState = 'running';
    crashGameState.currentMultiplier = 1.00;
    crashGameState.startTime = Date.now();
    
    // Broadcast game start to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'gameStart',
          data: {
            startTime: crashGameState.startTime
          }
        }));
      }
    });