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