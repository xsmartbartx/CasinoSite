import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: doublePrecision("balance").notNull().default(10000),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;
