import { query, transaction } from '../database';
import { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  UserWithoutPassword,
  DatabaseError 
} from '../../types/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<UserWithoutPassword> {
    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, verification_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, is_active, is_verified, created_at, updated_at`,
        [
          userData.email.toLowerCase(),
          userData.password_hash,
          userData.first_name,
          userData.last_name,
          userData.verification_token
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<UserWithoutPassword | null> {
    const result = await query(
      `SELECT id, email, first_name, last_name, is_active, is_verified, 
              created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Update user
   */
  static async updateUser(id: string, updates: UpdateUserData): Promise<UserWithoutPassword | null> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${setClause.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, is_active, is_verified, 
                created_at, updated_at, last_login`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateUser(user.id, { last_login: new Date() });

    return user;
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
   * Verify user account
   */
  static async verifyAccount(token: string): Promise<boolean> {
    const result = await query(
      `UPDATE users SET is_verified = true, verification_token = NULL
       WHERE verification_token = $1 AND is_verified = false`,
      [token]
    );

    return result.rowCount > 0;
  }

  /**
   * Set password reset token
   */
  static async setPasswordResetToken(email: string): Promise<string | null> {
    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    const result = await query(
      `UPDATE users SET reset_password_token = $1, reset_password_expires = $2
       WHERE email = $3 AND is_active = true`,
      [token, expires, email.toLowerCase()]
    );

    return result.rowCount > 0 ? token : null;
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(newPassword);

    const result = await query(
      `UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE reset_password_token = $2 AND reset_password_expires > NOW()`,
      [hashedPassword, token]
    );

    return result.rowCount > 0;
  }

  /**
   * Delete user (soft delete by setting is_active = false)
   */
  static async deleteUser(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }
}
