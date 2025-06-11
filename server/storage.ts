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