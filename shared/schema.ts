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