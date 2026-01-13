import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for development
const users: any[] = [];
const sessions: any[] = [];

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export class DevUserService {
  /**
   * Create a new user
   */
  static async createUser(email: string, password: string, firstName?: string, lastName?: string): Promise<UserWithoutPassword> {
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password_hash,
      first_name: firstName,
      last_name: lastName,
      is_verified: true, // Auto-verify for development
      created_at: new Date(),
      updated_at: new Date()
    };

    users.push(user);

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = users.find(u => u.id === id);
    if (!user) return null;

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate user
   */
  static async authenticate(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Update last login
    user.last_login = new Date();
    user.updated_at = new Date();

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate verification token
   */
  static generateVerificationToken(): string {
    return uuidv4();
  }

  /**
   * Create session
   */
  static async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<string> {
    const sessionId = uuidv4();
    
    sessions.push({
      id: sessionId,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: new Date()
    });

    return sessionId;
  }

  /**
   * Find session by token hash
   */
  static async findSessionByTokenHash(tokenHash: string): Promise<any | null> {
    return sessions.find(s => s.token_hash === tokenHash && new Date() < s.expires_at) || null;
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index > -1) {
      sessions.splice(index, 1);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].expires_at <= now) {
        sessions.splice(i, 1);
      }
    }
  }

  /**
   * Get all users (development only)
   */
  static async getAllUsers(): Promise<UserWithoutPassword[]> {
    return users.map(user => {
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Clear all data (development only)
   */
  static clearAll(): void {
    users.length = 0;
    sessions.length = 0;
  }
}
