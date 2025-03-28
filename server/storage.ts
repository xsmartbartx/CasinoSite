import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameHistory, type GameHistory, type InsertGameHistory,
  educationalContent, type EducationalContent, type InsertEducationalContent,
  gameSettings, type GameSettings, type InsertGameSettings,
  analytics, type Analytics, type InsertAnalytics,
  chatMessages, type ChatMessage, type InsertChatMessage,
  leaderboards, type Leaderboard, type InsertLeaderboard,
  userRoles
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  
  // Admin User methods
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserStatus(id: number, isActive: boolean): Promise<User | undefined>;
  resetUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  
  // Game methods
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGamesByType(type: string): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  
  // Game settings methods
  getGameSettings(gameId: number): Promise<GameSettings | undefined>;
  createGameSettings(settings: InsertGameSettings): Promise<GameSettings>;
  updateGameSettings(id: number, settings: Partial<InsertGameSettings>): Promise<GameSettings | undefined>;
  
  // Game history methods
  getGameHistory(userId: number, limit?: number, offset?: number): Promise<GameHistory[]>;
  getGameHistoryByGame(userId: number, gameId: number, limit?: number, offset?: number): Promise<GameHistory[]>;
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  
  // Educational content methods
  getAllEducationalContent(): Promise<EducationalContent[]>;
  getEducationalContent(id: number): Promise<EducationalContent | undefined>;
  getEducationalContentByCategory(category: string): Promise<EducationalContent[]>;
  createEducationalContent(content: InsertEducationalContent): Promise<EducationalContent>;
  
  // Analytics methods
  getLatestAnalytics(): Promise<Analytics | undefined>;
  getDailyAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]>;
  createAnalyticsSnapshot(): Promise<Analytics>;
  
  // Statistics methods
  getUserStatistics(userId: number): Promise<any>;
  getGlobalStatistics(): Promise<any>;
  
  // Chat methods
  getChatMessages(room: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  moderateChatMessage(id: number, isDeleted?: boolean, isModerated?: boolean): Promise<ChatMessage | undefined>;
  
  // Leaderboard methods
  getLeaderboard(period: string, category: string, gameId?: number, limit?: number): Promise<Leaderboard[]>;
  updateLeaderboard(
    userId: number, 
    username: string,
    gameId: number | null, 
    bet: number, 
    multiplier: number,
    payout: number,
    period: string
  ): Promise<void>;
  getUserRank(userId: number, period: string, category: string, gameId?: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gameHistories: Map<number, GameHistory>;
  private educationalContents: Map<number, EducationalContent>;
  private chatMessages: Map<number, ChatMessage>;
  private leaderboards: Map<number, Leaderboard>;
  
  private userIdCounter: number;
  private gameIdCounter: number;
  private gameHistoryIdCounter: number;
  private educationalContentIdCounter: number;
  private chatMessageIdCounter: number;
  private leaderboardIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameHistories = new Map();
    this.educationalContents = new Map();
    this.chatMessages = new Map();
    this.leaderboards = new Map();
    
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.gameHistoryIdCounter = 1;
    this.educationalContentIdCounter = 1;
    this.chatMessageIdCounter = 1;
    this.leaderboardIdCounter = 1;
    
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
      createdAt,
      role: insertUser.role || 'user',
      lastLogin: null,
      isActive: true,
      email: insertUser.email || null
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
  
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    const users = Array.from(this.users.values())
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return users.slice(offset, offset + limit);
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // Validate role
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      throw new Error("Invalid role");
    }
    
    const updatedUser = { 
      ...user, 
      role: role as 'user' | 'admin' | 'superadmin'
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isActive
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async resetUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      password: newPassword
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
  
  async getGlobalStatistics(): Promise<any> {
    const allHistory = Array.from(this.gameHistories.values());
    const allUsers = Array.from(this.users.values());
    
    // General platform stats
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.isActive !== false).length; // If isActive is undefined, consider it true
    const totalWagered = allHistory.reduce((sum, h) => sum + h.bet, 0);
    const totalWon = allHistory.reduce((sum, h) => sum + h.payout, 0);
    const platformProfit = totalWagered - totalWon;
    const overallRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
    const totalGamesPlayed = allHistory.length;
    
    // Game-specific stats
    const gameTypes = Array.from(new Set(this.games.values().map(g => g.type)));
    const gameStats = gameTypes.map(type => {
      const gameHistories = allHistory.filter(h => {
        const game = this.games.get(h.gameId);
        return game && game.type === type;
      });
      
      const totalBet = gameHistories.reduce((sum, h) => sum + h.bet, 0);
      const totalPayout = gameHistories.reduce((sum, h) => sum + h.payout, 0);
      const profit = totalBet - totalPayout;
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
      totalUsers,
      activeUsers,
      totalWagered,
      totalWon,
      platformProfit,
      overallRtp,
      totalGamesPlayed,
      gameStats
    };
  }
  
  async getGameSettings(gameId: number): Promise<GameSettings | undefined> {
    // Since MemStorage doesn't persistently store game settings,
    // we'll return a default settings object
    return {
      id: 1,
      gameId,
      houseEdge: 0.03,
      minBet: 1,
      maxBet: 1000,
      maxWin: 10000,
      isEnabled: true,
      config: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async createGameSettings(settings: InsertGameSettings): Promise<GameSettings> {
    // For MemStorage, just return a mock settings object
    return {
      id: 1,
      ...settings,
      minBet: settings.minBet ?? 1,
      maxBet: settings.maxBet ?? 1000,
      houseEdge: settings.houseEdge ?? 0.03,
      maxWin: settings.maxWin ?? 10000,
      isEnabled: settings.isEnabled ?? true,
      config: settings.config ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async updateGameSettings(id: number, settings: Partial<InsertGameSettings>): Promise<GameSettings | undefined> {
    // For MemStorage, return an updated mock settings object
    return {
      id,
      gameId: settings.gameId || 1,
      houseEdge: settings.houseEdge ?? 0.03,
      minBet: settings.minBet ?? 1,
      maxBet: settings.maxBet ?? 1000,
      maxWin: settings.maxWin ?? 10000,
      isEnabled: settings.isEnabled ?? true,
      config: settings.config ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async getLatestAnalytics(): Promise<Analytics | undefined> {
    // For MemStorage, create a mock analytics snapshot
    return this.createAnalyticsSnapshot();
  }
  
  async createAnalyticsSnapshot(): Promise<Analytics> {
    // Generate snapshot based on current state
    const stats = await this.getGlobalStatistics();
    const dailyActiveUsers = Math.floor(stats.activeUsers * 0.6); // Simulate daily active users
    const newUsersToday = Math.floor(Math.random() * 15); // Simulate new user signups
    
    // Create simulated hourly user activity data for heatmap
    const hourlyActivity = Array.from({length: 24}, (_, hour) => {
      // More users during peak hours (simulated pattern)
      const baseUsers = hour >= 8 && hour <= 23 ? 10 + Math.floor(Math.random() * 30) : 2 + Math.floor(Math.random() * 8);
      return { hour, count: baseUsers };
    });
    
    // Create financial projections (simple linear projection for demo)
    const projections = {
      nextDay: stats.platformProfit * 1.02,
      nextWeek: stats.platformProfit * 7 * 1.05,
      nextMonth: stats.platformProfit * 30 * 1.1,
      growth: 0.1 + (Math.random() * 0.15)
    };
    
    // Risk metrics based on current platform state
    const riskMetrics = {
      largeWinRisk: 0.01 + (Math.random() * 0.03),
      payoutRatio: stats.totalWon / stats.totalWagered,
      volatilityIndex: 0.2 + (Math.random() * 0.4),
      highRiskUsers: Math.floor(stats.activeUsers * 0.03),
      potentialLiability: stats.totalWagered * 0.8
    };
    
    return {
      id: 1,
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      newUsers: newUsersToday,
      totalBets: stats.totalGamesPlayed,
      totalWagered: stats.totalWagered,
      totalPayout: stats.totalWon,
      houseProfit: stats.platformProfit,
      gameBreakdown: JSON.stringify(stats.gameStats),
      userActivity: JSON.stringify(hourlyActivity),
      financialProjections: JSON.stringify(projections),
      riskMetrics: JSON.stringify(riskMetrics),
      createdAt: new Date(),
      date: new Date()
    };
  }
  
  async getDailyAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    // Generate a mock analytics snapshot for memory storage
    const snapshot = await this.createAnalyticsSnapshot();
    return [snapshot];
  }
  
  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existingGame = await this.getGame(id);
    if (!existingGame) return undefined;
    
    const updatedGame: Game = {
      ...existingGame,
      ...game
    };
    
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  // Chat methods
  async getChatMessages(room: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.room === room && !msg.isDeleted)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return messages.slice(offset, offset + limit);
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const createdAt = new Date();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      isDeleted: false,
      isModerated: false,
      createdAt
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  async moderateChatMessage(id: number, isDeleted = false, isModerated = true): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: ChatMessage = {
      ...message,
      isDeleted,
      isModerated
    };
    this.chatMessages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Leaderboard methods
  async getLeaderboard(
    period: "daily" | "weekly" | "monthly" | "all_time",
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    gameId?: number,
    limit = 10
  ): Promise<Leaderboard[]> {
    let leaderboardData = Array.from(this.leaderboards.values())
      .filter(entry => entry.period === period && entry.category === category);
      
    // Apply game filter if specified
    if (gameId !== undefined) {
      leaderboardData = leaderboardData.filter(entry => entry.gameId === gameId);
    }
    
    // Sort by score in descending order
    return leaderboardData
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, limit);
  }
  
  async updateLeaderboard(
    userId: number, 
    username: string,
    gameId: number | null, 
    bet: number, 
    multiplier: number,
    payout: number,
    period: "daily" | "weekly" | "monthly" | "all_time"
  ): Promise<void> {
    // Update each category
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "biggest_win", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "highest_multiplier", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "total_games", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "total_wagered", period);
    
    // Update all time leaderboard too
    if (period !== "all_time") {
      await this.updateLeaderboard(userId, username, gameId, bet, multiplier, payout, "all_time");
    }
  }
  
  private async updateLeaderboardCategory(
    userId: number, 
    username: string,
    gameId: number | null, 
    bet: number, 
    multiplier: number,
    payout: number,
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    period: "daily" | "weekly" | "monthly" | "all_time"
  ): Promise<void> {
    // Find existing entry for this user/game/period/category combination
    const existingEntryArray = Array.from(this.leaderboards.values())
      .filter(entry => 
        entry.userId === userId && 
        entry.period === period && 
        entry.gameId === gameId &&
        entry.category === category
      );
    
    let existingEntry = existingEntryArray.length > 0 ? existingEntryArray[0] : null;
    
    // Set the score based on category
    let score = 0;
    switch(category) {
      case "biggest_win":
        score = payout;
        break;
      case "highest_multiplier":
        score = multiplier;
        break;
      case "total_games":
        score = 1; // Will be added to existing score
        break;
      case "total_wagered":
        score = bet;
        break;
    }
    
    if (existingEntry) {
      // Update existing entry
      const updatedEntry: Leaderboard = {
        ...existingEntry,
        username, // Update username in case it changed
        // Update metrics based on category
        highestMultiplier: Math.max(existingEntry.highestMultiplier || 0, multiplier),
        biggestWin: Math.max(existingEntry.biggestWin || 0, payout),
        totalWagered: (existingEntry.totalWagered || 0) + bet,
        totalGames: (existingEntry.totalGames || 0) + 1,
        // Set score based on category
        score: category === "biggest_win" ? Math.max(existingEntry.score, score) : 
               category === "highest_multiplier" ? Math.max(existingEntry.score, score) :
               existingEntry.score + score, // For total_games and total_wagered, add to existing score
        updatedAt: new Date()
      };
      this.leaderboards.set(existingEntry.id, updatedEntry);
    } else {
      // Create new entry
      const id = this.leaderboardIdCounter++;
      const newEntry: Leaderboard = {
        id,
        userId,
        username,
        gameId,
        category,
        score,
        highestMultiplier: multiplier,
        biggestWin: payout,
        totalWagered: bet,
        totalGames: 1,
        period,
        rank: null,
        updatedAt: new Date()
      };
      this.leaderboards.set(id, newEntry);
    }
    
    // Update ranks for this category/period/game combination
    await this.updateLeaderboardRanks(category, period, gameId);
  }
  
  private async updateLeaderboardRanks(
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    period: "daily" | "weekly" | "monthly" | "all_time",
    gameId: number | null
  ): Promise<void> {
    // Get all entries for this category/period/game combination
    let entries = Array.from(this.leaderboards.values())
      .filter(entry => 
        entry.category === category && 
        entry.period === period &&
        (gameId === null || entry.gameId === gameId)
      )
      .sort((a, b) => Number(b.score) - Number(a.score));
    
    // Update ranks
    entries.forEach((entry, index) => {
      const updatedEntry = { ...entry, rank: index + 1 };
      this.leaderboards.set(entry.id, updatedEntry);
    });
  }
  
  async getUserRank(
    userId: number,
    period: "daily" | "weekly" | "monthly" | "all_time",
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    gameId?: number
  ): Promise<number> {
    // Get leaderboard filtered by period, category and optionally gameId
    let leaderboard = Array.from(this.leaderboards.values())
      .filter(entry => entry.period === period && entry.category === category);
      
    if (gameId !== undefined) {
      leaderboard = leaderboard.filter(entry => entry.gameId === gameId);
    }
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => Number(b.score) - Number(a.score));
    
    // Find user's position
    const position = leaderboard.findIndex(entry => entry.userId === userId);
    
    // Position + 1 = rank (1-based indexing), or -1 if not found
    return position >= 0 ? position + 1 : -1;
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
  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return this.db.select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    // Validate role
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      throw new Error("Invalid role");
    }
    
    const typedRole = role as 'user' | 'admin' | 'superadmin';
    
    const result = await this.db.update(users)
      .set({ role: typedRole })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateUserStatus(id: number, isActive: boolean): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({ isActive })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async resetUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const result = await this.db.update(games)
      .set(game)
      .where(eq(games.id, id))
      .returning();
    
    return result[0];
  }
  
  async getGameSettings(gameId: number): Promise<GameSettings | undefined> {
    const result = await this.db.select()
      .from(gameSettings)
      .where(eq(gameSettings.gameId, gameId))
      .limit(1);
    
    return result[0];
  }
  
  async createGameSettings(settings: InsertGameSettings): Promise<GameSettings> {
    const result = await this.db.insert(gameSettings)
      .values(settings)
      .returning();
    
    return result[0];
  }
  
  async updateGameSettings(id: number, settings: Partial<InsertGameSettings>): Promise<GameSettings | undefined> {
    const result = await this.db.update(gameSettings)
      .set(settings)
      .where(eq(gameSettings.id, id))
      .returning();
    
    return result[0];
  }
  
  async getGlobalStatistics(): Promise<any> {
    // General platform stats
    const usersResult = await this.db.select({ 
      count: sql`count(*)`,
      activeCount: sql`count(*) filter (where is_active = true)` 
    }).from(users);
    
    const totalUsers = parseInt(String(usersResult[0]?.count) || '0');
    const activeUsers = parseInt(String(usersResult[0]?.activeCount) || '0');
    
    // Game stats
    const gameStats = await this.db.execute(sql`
      SELECT 
        g.type, 
        SUM(gh.bet) as "totalBet", 
        SUM(gh.payout) as "totalPayout",
        SUM(gh.bet) - SUM(gh.payout) as "profit",
        CASE 
          WHEN SUM(gh.bet) > 0 THEN (SUM(gh.payout) / SUM(gh.bet)) * 100 
          ELSE 0 
        END as "rtp",
        COUNT(*) as "count"
      FROM 
        game_history gh
      JOIN 
        games g ON gh.game_id = g.id
      GROUP BY 
        g.type
    `);
    
    // Calculate totals
    const totalStats = await this.db.execute(sql`
      SELECT 
        SUM(bet) as "totalWagered",
        SUM(payout) as "totalWon",
        COUNT(*) as "totalGamesPlayed"
      FROM 
        game_history
    `);
    
    const totalWagered = parseFloat(String(totalStats[0]?.totalWagered || '0'));
    const totalWon = parseFloat(String(totalStats[0]?.totalWon || '0'));
    const platformProfit = totalWagered - totalWon;
    const overallRtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
    const totalGamesPlayed = parseInt(String(totalStats[0]?.totalGamesPlayed || '0'));
    
    return {
      totalUsers,
      activeUsers,
      totalWagered,
      totalWon,
      platformProfit,
      overallRtp,
      totalGamesPlayed,
      gameStats
    };
  }
  
  async getLatestAnalytics(): Promise<Analytics | undefined> {
    const result = await this.db.select()
      .from(analytics)
      .orderBy(desc(analytics.date))
      .limit(1);
    
    return result[0];
  }
  
  async createAnalyticsSnapshot(): Promise<Analytics> {
    // Generate snapshot based on current statistics
    const stats = await this.getGlobalStatistics();
    
    // Get daily active users (simplified approach)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const dailyUsers = await this.db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as "dailyActiveUsers"
      FROM game_history
      WHERE created_at >= ${oneDayAgo.toISOString()}
    `);
    
    // Type-safe conversion
    const dailyActiveUsersValue = dailyUsers && dailyUsers[0] && 
      typeof dailyUsers[0].dailyActiveUsers === 'string' ? 
      parseInt(dailyUsers[0].dailyActiveUsers) : 0;
    
    // Count new users in the last day
    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);
    
    const newUsersResult = await this.db.select({
      count: sql`count(*)`
    })
    .from(users)
    .where(gte(users.createdAt, lastDay));
    
    const newUsers = parseInt(String(newUsersResult[0]?.count) || '0');
    
    // Generate hourly activity pattern for heatmap
    // More realistic implementation would analyze actual db records by hour
    const hourlyActivity = await this.generateHourlyActivityData();
    
    // Generate financial projections based on current data
    const projections = {
      nextDay: stats.platformProfit * 1.02,
      nextWeek: stats.platformProfit * 7 * 1.05,
      nextMonth: stats.platformProfit * 30 * 1.1,
      growth: 0.1 + (Math.random() * 0.15)
    };
    
    // Generate risk analysis metrics
    const riskMetrics = {
      largeWinRisk: 0.01 + (Math.random() * 0.03),
      payoutRatio: stats.totalWon / stats.totalWagered,
      volatilityIndex: 0.2 + (Math.random() * 0.4),
      highRiskUsers: Math.floor(stats.activeUsers * 0.03),
      potentialLiability: stats.totalWagered * 0.8
    };
    
    // Create a valid analytics record
    const result = await this.db.insert(analytics)
      .values({
        totalBets: stats.totalGamesPlayed,
        totalWagered: stats.totalWagered,
        totalPayout: stats.totalWon,
        houseProfit: stats.platformProfit,
        gameBreakdown: JSON.stringify(stats.gameStats),
        activeUsers: stats.activeUsers,
        newUsers: newUsers,
        userActivity: JSON.stringify(hourlyActivity),
        financialProjections: JSON.stringify(projections),
        riskMetrics: JSON.stringify(riskMetrics),
        date: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getDailyAnalytics(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return this.db.select()
      .from(analytics)
      .where(
        and(
          gte(analytics.date, startDate),
          lte(analytics.date, endDate)
        )
      )
      .orderBy(analytics.date);
  }
  
  // Generate hourly activity data for heatmap visualization
  private async generateHourlyActivityData(): Promise<any[]> {
    // In a production environment, we would query the database to get actual hourly data
    // For this demo, we'll generate simulated data with a realistic pattern
    const now = new Date();
    const currentHour = now.getHours();
    
    return Array.from({length: 24}, (_, hour) => {
      // Create a realistic pattern: low activity at night, peaks in evening
      let baseActivity;
      
      if (hour >= 0 && hour < 6) {
        // Night hours: low activity
        baseActivity = 5 + Math.floor(Math.random() * 10);
      } else if (hour >= 6 && hour < 12) {
        // Morning hours: medium activity
        baseActivity = 15 + Math.floor(Math.random() * 15);
      } else if (hour >= 12 && hour < 18) {
        // Afternoon hours: high activity
        baseActivity = 30 + Math.floor(Math.random() * 20);
      } else {
        // Evening hours: peak activity
        baseActivity = 40 + Math.floor(Math.random() * 25);
      }
      
      // Add recency effect - hours closer to current hour have more accurate data
      const recencyFactor = 1 - (Math.abs(currentHour - hour) / 24);
      const finalActivity = Math.round(baseActivity * (0.8 + (recencyFactor * 0.4)));
      
      return {
        hour,
        count: finalActivity,
        // Optionally add more metrics like new users, conversion rate, etc.
      };
    });
  }
  
  // Chat methods
  async getChatMessages(room: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    return this.db.select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.room, room),
          eq(chatMessages.isDeleted, false)
        )
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await this.db.insert(chatMessages)
      .values({
        ...message,
        isDeleted: false,
        isModerated: false
      })
      .returning();
    return result[0];
  }
  
  async moderateChatMessage(id: number, isDeleted = false, isModerated = true): Promise<ChatMessage | undefined> {
    const result = await this.db.update(chatMessages)
      .set({
        isDeleted,
        isModerated
      })
      .where(eq(chatMessages.id, id))
      .returning();
    return result[0];
  }
  
  // Leaderboard methods
  async getLeaderboard(
    period: "daily" | "weekly" | "monthly" | "all_time",
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    gameId?: number,
    limit = 10
  ): Promise<Leaderboard[]> {
    let query = this.db.select()
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.period, period),
          eq(leaderboards.category, category)
        )
      )
      .orderBy(desc(leaderboards.score))
      .limit(limit);
    
    if (gameId !== undefined) {
      query = this.db.select()
        .from(leaderboards)
        .where(
          and(
            eq(leaderboards.period, period),
            eq(leaderboards.category, category),
            eq(leaderboards.gameId, gameId)
          )
        )
        .orderBy(desc(leaderboards.score))
        .limit(limit);
    }
    
    return query;
  }
  
  async updateLeaderboard(
    userId: number, 
    username: string,
    gameId: number | null, 
    bet: number, 
    multiplier: number,
    payout: number,
    period: "daily" | "weekly" | "monthly" | "all_time"
  ): Promise<void> {
    // Update each category
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "biggest_win", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "highest_multiplier", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "total_games", period);
    await this.updateLeaderboardCategory(userId, username, gameId, bet, multiplier, payout, "total_wagered", period);
    
    // Update all time leaderboard too
    if (period !== "all_time") {
      await this.updateLeaderboard(userId, username, gameId, bet, multiplier, payout, "all_time");
    }
  }
  
  private async updateLeaderboardCategory(
    userId: number, 
    username: string,
    gameId: number | null, 
    bet: number, 
    multiplier: number,
    payout: number,
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    period: "daily" | "weekly" | "monthly" | "all_time"
  ): Promise<void> {
    // Try to find existing entry
    const existingEntry = await this.db.select()
      .from(leaderboards)
      .where(
        and(
          eq(leaderboards.userId, userId),
          eq(leaderboards.period, period),
          eq(leaderboards.category, category),
          gameId !== null 
            ? eq(leaderboards.gameId, gameId)
            : sql`leaderboards.game_id IS NULL`
        )
      )
      .limit(1);
    
    // Set the score based on category
    let score = 0;
    switch(category) {
      case "biggest_win":
        score = payout;
        break;
      case "highest_multiplier":
        score = multiplier;
        break;
      case "total_games":
        score = 1; // Will be added to existing score
        break;
      case "total_wagered":
        score = bet;
        break;
    }
    
    if (existingEntry.length > 0) {
      // Update existing entry
      const entry = existingEntry[0];
      
      // Update the entry based on category
      await this.db.update(leaderboards)
        .set({
          username, // Update username in case it changed
          // Update metrics based on category
          highestMultiplier: Math.max(entry.highestMultiplier || 0, multiplier),
          biggestWin: Math.max(entry.biggestWin || 0, payout),
          totalWagered: (entry.totalWagered || 0) + bet,
          totalGames: (entry.totalGames || 0) + 1,
          // Set score based on category
          score: category === "biggest_win" ? Math.max(entry.score, score) : 
                 category === "highest_multiplier" ? Math.max(entry.score, score) :
                 entry.score + score, // For total_games and total_wagered, add to existing score
          updatedAt: new Date()
        })
        .where(eq(leaderboards.id, entry.id));
      
    } else {
      // Create new entry
      await this.db.insert(leaderboards)
        .values({
          userId,
          username,
          gameId,
          category,
          score,
          highestMultiplier: multiplier,
          biggestWin: payout,
          totalWagered: bet,
          totalGames: 1,
          period,
          rank: null,
          updatedAt: new Date()
        });
    }
    
    // Update the ranks for this category/period/game combination
    await this.updateLeaderboardRanks(category, period, gameId);
  }
  
  private async updateLeaderboardRanks(
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    period: "daily" | "weekly" | "monthly" | "all_time",
    gameId: number | null
  ): Promise<void> {
    // Get all entries for this category/period/game combination
    const gameIdParam = gameId === null ? undefined : gameId;
    const entries = await this.getLeaderboard(period, category, gameIdParam, 1000);
    
    // Update ranks for each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      
      // Only update if rank has changed
      if (entry.rank !== rank) {
        await this.db.update(leaderboards)
          .set({ rank })
          .where(eq(leaderboards.id, entry.id));
      }
    }
  }
  
  async getUserRank(
    userId: number,
    period: "daily" | "weekly" | "monthly" | "all_time",
    category: "biggest_win" | "highest_multiplier" | "total_games" | "total_wagered",
    gameId?: number
  ): Promise<number> {
    // Get full leaderboard to calculate rank
    const leaderboard = await this.getLeaderboard(period, category, gameId, 1000);
    
    // Find user's position
    const userIndex = leaderboard.findIndex(entry => entry.userId === userId);
    
    // Return user's rank (1-based) or -1 if not found
    return userIndex >= 0 ? userIndex + 1 : -1;
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
