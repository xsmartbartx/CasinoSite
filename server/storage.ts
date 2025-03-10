import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameHistory, type GameHistory, type InsertGameHistory,
  educationalContent, type EducationalContent, type InsertEducationalContent
} from "@shared/schema";

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
    const game: Game = { ...insertGame, id };
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
    const history: GameHistory = { ...insertHistory, id, createdAt };
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

export const storage = new MemStorage();
