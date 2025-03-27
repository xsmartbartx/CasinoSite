import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameHistory, type GameHistory, type InsertGameHistory,
  educationalContent, type EducationalContent, type InsertEducationalContent
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  
  // Game methods
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGamesByType(type: string): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Game history methods
  getGameHistory(userId: number, limit?: number, offset?: number): Promise<GameHistory[]>;
  getGameHistoryByGame(userId: number, gameId: number, limit?: number, offset?: number): Promise<GameHistory[]>;
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  
  // Educational content methods
  getAllEducationalContent(): Promise<EducationalContent[]>;
  getEducationalContent(id: number): Promise<EducationalContent | undefined>;
  getEducationalContentByCategory(category: string): Promise<EducationalContent[]>;
  createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent>;
  
  // Statistics methods
  getUserStatistics(userId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gameHistories: Map<number, GameHistory>;
  private educationalContents: Map<number, EducationalContent>;
  
  private userIdCounter: number;
  private gameIdCounter: number;
  private gameHistoryIdCounter: number;
  private educationalContentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameHistories = new Map();
    this.educationalContents = new Map();
    
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.gameHistoryIdCounter = 1;
    this.educationalContentIdCounter = 1;
    
    // Initialize with default games
    this.initializeDefaultData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 10000,
      createdAt
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      balance: user.balance + amount
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGamesByType(type: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.type === type
    );
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    // Ensure required fields are non-null
    const game: Game = { 
      ...insertGame, 
      id,
      popular: insertGame.popular ?? false, 
      difficulty: insertGame.difficulty ?? 'beginner' 
    };
    this.games.set(id, game);
    return game;
  }
  
  async getGameHistory(userId: number, limit = 10, offset = 0): Promise<GameHistory[]> {
    const history = Array.from(this.gameHistories.values())
      .filter(h => h.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return history.slice(offset, offset + limit);
  }
  
  async getGameHistoryByGame(userId: number, gameId: number, limit = 10, offset = 0): Promise<GameHistory[]> {
    const history = Array.from(this.gameHistories.values())
      .filter(h => h.userId === userId && h.gameId === gameId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return history.slice(offset, offset + limit);
  }
  
  async createGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const id = this.gameHistoryIdCounter++;
    const createdAt = new Date();
    const history: GameHistory = { 
      ...insertHistory, 
      id, 
      createdAt,
      details: insertHistory.details ?? null 
    };
    this.gameHistories.set(id, history);
    return history;
  }
  
  async getAllEducationalContent(): Promise<EducationalContent[]> {
    return Array.from(this.educationalContents.values());
  }
  
  async getEducationalContent(id: number): Promise<EducationalContent | undefined> {
    return this.educationalContents.get(id);
  }
  
  async getEducationalContentByCategory(category: string): Promise<EducationalContent[]> {
    return Array.from(this.educationalContents.values())
      .filter(content => content.category === category);
  }
  
  async createEducationalContent(insertContent: InsertEducationalContent): Promise<EducationalContent> {
    const id = this.educationalContentIdCounter++;
    const createdAt = new Date();
    const content: EducationalContent = { ...insertContent, id, createdAt };
    this.educationalContents.set(id, content);
    return content;
  }
  
  async getUserStatistics(userId: number): Promise<any> {
    const history = Array.from(this.gameHistories.values())
      .filter(h => h.userId === userId);
    
    const totalWagered = history.reduce((sum, h) => sum + h.bet, 0);
    const totalWon = history.reduce((sum, h) => sum + h.payout, 0);
    const profitLoss = totalWon - totalWagered;
    const rtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
    const gamesPlayed = history.length;
    const avgBet = gamesPlayed > 0 ? totalWagered / gamesPlayed : 0;
    
    // Game-specific stats
    const gameTypes = Array.from(new Set(history.map(h => {
      const game = this.games.get(h.gameId);
      return game ? game.type : null;
    }).filter(Boolean)));
    
    const gameStats = gameTypes.map(type => {
      const gameHistories = history.filter(h => {
        const game = this.games.get(h.gameId);
        return game && game.type === type;
      });
      
      const totalBet = gameHistories.reduce((sum, h) => sum + h.bet, 0);
      const totalPayout = gameHistories.reduce((sum, h) => sum + h.payout, 0);
      const profit = totalPayout - totalBet;
      const gameRtp = totalBet > 0 ? (totalPayout / totalBet) * 100 : 0;
      const count = gameHistories.length;
      
      return {
        type,
        totalBet,
        totalPayout,
        profit,
        rtp: gameRtp,
        count
      };
    });
    
    return {
      totalWagered,
      totalWon,
      profitLoss,
      rtp,
      gamesPlayed,
      avgBet,
      gameStats
    };
  }
  
  private initializeDefaultData() {
    // Default games
    this.createGame({
      name: "Slots",
      description: "Learn about probability distributions and random number generation.",
      rtp: 96.5,
      type: "slot",
      popular: true,
      difficulty: "intermediate"
    });
    
    this.createGame({
      name: "Roulette",
      description: "Explore probability, expected value, and betting strategies.",
      rtp: 97.3,
      type: "roulette",
      popular: false,
      difficulty: "educational"
    });
    
    this.createGame({
      name: "Dice",
      description: "Understand fundamental probability with dice combinations.",
      rtp: 98.5,
      type: "dice",
      popular: false,
      difficulty: "beginner"
    });
    
    // Default educational content
    this.createEducationalContent({
      title: "Probability Basics",
      content: "Learn the fundamental concepts of probability theory that underlie all casino games.",
      category: "probability",
      readTime: 5,
      icon: "fa-calculator"
    });
    
    this.createEducationalContent({
      title: "Expected Value",
      content: "Understand how to calculate the average outcome of a random variable over many trials.",
      category: "expected_value",
      readTime: 8,
      icon: "fa-chart-line"
    });
    
    this.createEducationalContent({
      title: "Random Number Generation",
      content: "Explore how computers generate random numbers and why true randomness matters in games.",
      category: "rng",
      readTime: 10,
      icon: "fa-random"
    });
  }
}

export class PgStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Create a postgres client
    const client = postgres(process.env.DATABASE_URL as string);
    // Create a drizzle instance using the postgres client
    this.db = drizzle(client);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users)
      .values({
        ...user,
        balance: 10000
      })
      .returning();
    return result[0];
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const result = await this.db.update(users)
      .set({ balance: user.balance + amount })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllGames(): Promise<Game[]> {
    return this.db.select().from(games);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await this.db.select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return result[0];
  }

  async getGamesByType(type: string): Promise<Game[]> {
    return this.db.select()
      .from(games)
      .where(eq(games.type, type));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const result = await this.db.insert(games)
      .values(game)
      .returning();
    return result[0];
  }

  async getGameHistory(userId: number, limit = 10, offset = 0): Promise<GameHistory[]> {
    return this.db.select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getGameHistoryByGame(userId: number, gameId: number, limit = 10, offset = 0): Promise<GameHistory[]> {
    return this.db.select()
      .from(gameHistory)
      .where(
        and(
          eq(gameHistory.userId, userId),
          eq(gameHistory.gameId, gameId)
        )
      )
      .orderBy(desc(gameHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createGameHistory(history: InsertGameHistory): Promise<GameHistory> {
    const result = await this.db.insert(gameHistory)
      .values(history)
      .returning();
    return result[0];
  }

  async getAllEducationalContent(): Promise<EducationalContent[]> {
    return this.db.select().from(educationalContent);
  }

  async getEducationalContent(id: number): Promise<EducationalContent | undefined> {
    const result = await this.db.select()
      .from(educationalContent)
      .where(eq(educationalContent.id, id))
      .limit(1);
    return result[0];
  }

  async getEducationalContentByCategory(category: string): Promise<EducationalContent[]> {
    return this.db.select()
      .from(educationalContent)
      .where(eq(educationalContent.category, category));
  }

  async createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent> {
    const result = await this.db.insert(educationalContent)
      .values(content)
      .returning();
    return result[0];
  }

  async getUserStatistics(userId: number): Promise<any> {
    // Get all user game history
    const history = await this.db.select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId));
    
    // Calculate basic stats
    const totalWagered = history.reduce((sum, h) => sum + h.bet, 0);
    const totalWon = history.reduce((sum, h) => sum + h.payout, 0);
    const profitLoss = totalWon - totalWagered;
    const rtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
    const gamesPlayed = history.length;
    const avgBet = gamesPlayed > 0 ? totalWagered / gamesPlayed : 0;
    
    // Get game types with a join query
    const gameStats = await this.db.execute(sql`
      SELECT 
        g.type, 
        SUM(gh.bet) as "totalBet", 
        SUM(gh.payout) as "totalPayout",
        SUM(gh.payout) - SUM(gh.bet) as "profit",
        CASE 
          WHEN SUM(gh.bet) > 0 THEN (SUM(gh.payout) / SUM(gh.bet)) * 100 
          ELSE 0 
        END as "rtp",
        COUNT(*) as "count"
      FROM 
        game_history gh
      JOIN 
        games g ON gh.game_id = g.id
      WHERE 
        gh.user_id = ${userId}
      GROUP BY 
        g.type
    `);
    
    return {
      totalWagered,
      totalWon,
      profitLoss,
      rtp,
      gamesPlayed,
      avgBet,
      gameStats: gameStats
    };
  }

  // Method to seed the database with initial data
  async seedInitialData(): Promise<void> {
    // Check if games already exist
    const existingGames = await this.getAllGames();
    if (existingGames.length === 0) {
      // Create default games
      await this.createGame({
        name: "Slots",
        description: "Learn about probability distributions and random number generation.",
        rtp: 96.5,
        type: "slot",
        popular: true,
        difficulty: "intermediate"
      });
      
      await this.createGame({
        name: "Roulette",
        description: "Explore probability, expected value, and betting strategies.",
        rtp: 97.3,
        type: "roulette",
        popular: false,
        difficulty: "educational"
      });
      
      await this.createGame({
        name: "Dice",
        description: "Understand fundamental probability with dice combinations.",
        rtp: 98.5,
        type: "dice",
        popular: false,
        difficulty: "beginner"
      });
      
      await this.createGame({
        name: "Crash",
        description: "Test your risk management skills in this thrilling multiplier game with realtime decisions.",
        rtp: 97.0,
        type: "crash",
        popular: true,
        difficulty: "intermediate"
      });
    }
    
    // Check if educational content already exists
    const existingContent = await this.getAllEducationalContent();
    if (existingContent.length === 0) {
      // Create default educational content
      await this.createEducationalContent({
        title: "Probability Basics",
        content: "Learn the fundamental concepts of probability theory that underlie all casino games.",
        category: "probability",
        readTime: 5,
        icon: "fa-calculator"
      });
      
      await this.createEducationalContent({
        title: "Expected Value",
        content: "Understand how to calculate the average outcome of a random variable over many trials.",
        category: "expected_value",
        readTime: 8,
        icon: "fa-chart-line"
      });
      
      await this.createEducationalContent({
        title: "Random Number Generation",
        content: "Explore how computers generate random numbers and why true randomness matters in games.",
        category: "rng",
        readTime: 10,
        icon: "fa-random"
      });
      
      await this.createEducationalContent({
        title: "Verifiable Randomness",
        content: "Learn how cryptographic techniques can be used to create provably fair and verifiable random results in games.",
        category: "provable_fairness",
        readTime: 7,
        icon: "fa-shield-alt"
      });
      
      await this.createEducationalContent({
        title: "Risk Management",
        content: "Understand how to manage risk in games of chance, particularly those with multipliers like Crash.",
        category: "strategy",
        readTime: 5,
        icon: "fa-chart-bar"
      });
    }
  }
}

// Initialize storage
export const storage = new PgStorage();
