import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserService } from './services/user-service';
import { SessionService } from './services/session-service';
import { DevUserService } from './services/dev-user-service';
import { UserWithoutPassword } from '../types/database';

// Use development service if DATABASE_URL is not properly configured
const isDevelopment = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('sqlite:');

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: UserWithoutPassword;
  error?: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private static readonly JWT_EXPIRES_IN = '7d'; // 7 days
  private static readonly SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  /**
   * Generate JWT token for user
   */
  static async generateToken(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<string> {
    // Create session in database
    const expiresAt = new Date(Date.now() + this.SESSION_EXPIRES_IN);
    const token = jwt.sign(
      { userId, email, sessionId: 'temp' },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const tokenHash = await SessionService.hashToken(token);
    
    const session = await SessionService.createUserSession({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Generate final token with actual session ID
    const finalToken = jwt.sign(
      { userId, email, sessionId: session.id },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    // Update session with final token hash
    await SessionService.deleteSession(tokenHash);
    await SessionService.createUserSession({
      user_id: userId,
      token_hash: await SessionService.hashToken(finalToken),
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return finalToken;
  }

  /**
   * Verify JWT token and return user
   */
  static async verifyToken(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      if (isDevelopment) {
        // Use development service
        const user = await DevUserService.findById(decoded.userId);
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        return { success: true, user };
      } else {
        // Use production service
        const tokenHash = await SessionService.hashToken(token);
        const session = await SessionService.findSessionByTokenHash(tokenHash);

        if (!session) {
          return { success: false, error: 'Session not found or expired' };
        }

        const user = await UserService.findById(decoded.userId);
        if (!user || !user.is_active) {
          return { success: false, error: 'User not found or inactive' };
        }

        return { success: true, user };
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { success: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { success: false, error: 'Invalid token' };
      }
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Extract token from request headers
   */
  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check cookies
    const tokenCookie = request.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  /**
   * Authenticate request and return user
   */
  static async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    return this.verifyToken(token);
  }

  /**
   * Logout user (invalidate token)
   */
  static async logout(token: string): Promise<boolean> {
    try {
      const tokenHash = await SessionService.hashToken(token);
      return await SessionService.deleteSession(tokenHash);
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Logout all sessions for a user
   */
  static async logoutAllSessions(userId: string): Promise<number> {
    return await SessionService.deleteAllUserSessions(userId);
  }

  /**
   * Register new user
   */
  static async register(email: string, password: string, firstName?: string, lastName?: string): Promise<{
    success: boolean;
    user?: UserWithoutPassword;
    token?: string;
    error?: string;
  }> {
    try {
      if (isDevelopment) {
        // Use development service
        const user = await DevUserService.createUser(email, password, firstName, lastName);

        // Generate simple JWT token for development
        const token = jwt.sign(
          { userId: user.id, email: user.email, sessionId: 'dev-session' },
          this.JWT_SECRET,
          { expiresIn: this.JWT_EXPIRES_IN }
        );

        return { success: true, user, token };
      } else {
        // Use production service
        const existingUser = await UserService.findByEmail(email);
        if (existingUser) {
          return { success: false, error: 'Email already registered' };
        }

        const passwordHash = await UserService.hashPassword(password);
        const verificationToken = UserService.generateVerificationToken();

        const user = await UserService.createUser({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          verification_token: verificationToken
        });

        const token = await this.generateToken(user.id, user.email);
        return { success: true, user, token };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<{
    success: boolean;
    user?: UserWithoutPassword;
    token?: string;
    error?: string;
  }> {
    try {
      if (isDevelopment) {
        // Use development service
        const user = await DevUserService.authenticate(email, password);
        if (!user) {
          return { success: false, error: 'Invalid email or password' };
        }

        // Generate simple JWT token for development
        const token = jwt.sign(
          { userId: user.id, email: user.email, sessionId: 'dev-session' },
          this.JWT_SECRET,
          { expiresIn: this.JWT_EXPIRES_IN }
        );

        return { success: true, user, token };
      } else {
        // Use production service
        const user = await UserService.verifyPassword(email, password);
        if (!user) {
          return { success: false, error: 'Invalid email or password' };
        }

        if (!user.is_active) {
          return { success: false, error: 'Account is deactivated' };
        }

        const token = await this.generateToken(user.id, user.email, ipAddress, userAgent);
        const { password_hash, ...userWithoutPassword } = user;

        return { success: true, user: userWithoutPassword, token };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }
}
