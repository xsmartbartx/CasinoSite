import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = pgEnum("user_role", ["user", "admin", "superadmin"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  balance: doublePrecision("balance").notNull().default(10000),
  role: userRoles("role").default("user").notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  isActive: true,
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rtp: doublePrecision("rtp").notNull(),
  type: text("type").notNull(), // "slot", "roulette", "dice"
  popular: boolean("popular").default(false),
  difficulty: text("difficulty").default("intermediate"), // "beginner", "intermediate", "advanced"
});

export const insertGameSchema = createInsertSchema(games).pick({
  name: true,
  description: true,
  rtp: true,
  type: true,
  popular: true,
  difficulty: true,
});

// Game history table
export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => games.id),
  bet: doublePrecision("bet").notNull(),
  multiplier: doublePrecision("multiplier").notNull(),
  payout: doublePrecision("payout").notNull(),
  result: text("result").notNull(), // "win", "loss"
  details: text("details"), // JSON string with game-specific details
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).pick({
  userId: true,
  gameId: true,
  bet: true,
  multiplier: true,
  payout: true,
  result: true,
  details: true,
});

// Educational content
export const educationalContent = pgTable("educational_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // "probability", "expected_value", "rng", etc.
  readTime: integer("read_time").notNull(), // in minutes
  icon: text("icon").notNull(), // Font Awesome icon class
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEducationalContentSchema = createInsertSchema(educationalContent).pick({
  title: true,
  content: true,
  category: true,
  readTime: true,
  icon: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;

// Game settings for admin control
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  minBet: doublePrecision("min_bet").notNull().default(1),
  maxBet: doublePrecision("max_bet").notNull().default(1000),
  houseEdge: doublePrecision("house_edge").notNull().default(0.05),
  maxWin: doublePrecision("max_win").notNull().default(10000),
  isEnabled: boolean("is_enabled").notNull().default(true),
  // Advanced game-specific settings stored as JSON
  // Examples:
  // - Slot: symbolFrequencies, payoutMultipliers
  // - Roulette: betTypeLimits
  // - Dice: probabilityRanges, targetValues
  // - Crash: crashPointDistribution, waitTimes, speedParameters
  config: text("config"), // JSON string with game-specific advanced settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGameSettingsSchema = createInsertSchema(gameSettings).pick({
  gameId: true,
  minBet: true,
  maxBet: true,
  houseEdge: true,
  maxWin: true,
  isEnabled: true,
  config: true,
});

export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;

// Analytics data for dashboard
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  totalUsers: integer("total_users").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  newUsers: integer("new_users").default(0),
  totalBets: integer("total_bets").notNull().default(0),
  totalWagered: doublePrecision("total_wagered").notNull().default(0),
  totalPayout: doublePrecision("total_payout").notNull().default(0),
  houseProfit: doublePrecision("house_profit").notNull().default(0),
  gameBreakdown: text("game_breakdown"), // JSON string with per-game stats
  userActivity: text("user_activity"), // JSON string with hourly user activity for heatmap
  financialProjections: text("financial_projections"), // JSON string with projections
  riskMetrics: text("risk_metrics"), // JSON with risk analysis data
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  date: true,
  totalUsers: true,
  activeUsers: true,
  newUsers: true,
  totalBets: true,
  totalWagered: true,
  totalPayout: true,
  houseProfit: true,
  gameBreakdown: true,
  userActivity: true,
  financialProjections: true,
  riskMetrics: true,
});

export type GameSettings = typeof gameSettings.$inferSelect;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: text("username").notNull(), // Username for display in the chat
  room: text("room").notNull(), // 'global' or game-specific rooms like 'slot', 'dice', etc.
  content: text("content").notNull(), // The actual message content
  isDeleted: boolean("is_deleted").default(false).notNull(),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  username: true,
  room: true,
  content: true,
});