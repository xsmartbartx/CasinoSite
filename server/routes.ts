import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertGameHistorySchema } from "@shared/schema";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";

// Game algorithms
function generateSlotResult() {
  const symbols = ["gem", "crown", "star", "dice", "money"];
  const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
  const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
  const reel3 = symbols[Math.floor(Math.random() * symbols.length)];
  
  let multiplier = 0;
  
  if (reel1 === reel2 && reel2 === reel3) {
    // All symbols match
    if (reel1 === "gem") multiplier = 10;
    else if (reel1 === "crown") multiplier = 15;
    else if (reel1 === "star") multiplier = 5;
    else if (reel1 === "dice") multiplier = 3;
    else if (reel1 === "money") multiplier = 8;
  } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
    // Two symbols match
    multiplier = 0.5;
  }
  
  return {
    reels: [reel1, reel2, reel3],
    multiplier
  };
}

function generateRouletteResult(betType: string, betValue: any) {
  const number = Math.floor(Math.random() * 37); // 0-36
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
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const sum = dice1 + dice2;
  
  let win = false;
  let multiplier = 0;
  
  switch (betType) {
    case 'over':
      win = sum > targetValue;
      // Probability decreases as target increases, so multiplier increases
      multiplier = win ? (12 - targetValue) / 3 : 0;
      break;
    case 'under':
      win = sum < targetValue;
      // Probability decreases as target decreases, so multiplier increases
      multiplier = win ? targetValue / 3 : 0;
      break;
    case 'exact':
      win = sum === targetValue;
      // Exact matches have specific probabilities
      if (targetValue === 2 || targetValue === 12) {
        multiplier = win ? 35 : 0;
      } else if (targetValue === 3 || targetValue === 11) {
        multiplier = win ? 17 : 0;
      } else if (targetValue === 4 || targetValue === 10) {
        multiplier = win ? 11 : 0;
      } else if (targetValue === 5 || targetValue === 9) {
        multiplier = win ? 8 : 0;
      } else if (targetValue === 6 || targetValue === 8) {
        multiplier = win ? 6 : 0;
      } else if (targetValue === 7) {
        multiplier = win ? 5 : 0;
      }
      break;
    default:
      multiplier = 0;
  }
  
  return {
    dice: [dice1, dice2],
    sum,
    multiplier,
    win
  };
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
      const payout = bet * result.multiplier;
      
      // Update user balance
      await storage.updateUserBalance(userId, payout - bet);
      
      // Record game history
      await storage.createGameHistory({
        userId,
        gameId: slotGame.id,
        bet,
        multiplier: result.multiplier,
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

  const httpServer = createServer(app);

  return httpServer;
}
