import { query } from '../database';
import { 
  UserSession, 
  CreateSessionData,
  ContentSession,
  CreateContentSessionData,
  ContentSessionWithContent
} from '../../types/database';
// Using Web Crypto API for Edge Runtime compatibility

export class SessionService {
  /**
   * Create a new user session
   */
  static async createUserSession(sessionData: CreateSessionData): Promise<UserSession> {
    const result = await query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        sessionData.user_id,
        sessionData.token_hash,
        sessionData.expires_at,
        sessionData.ip_address,
        sessionData.user_agent
      ]
    );

    return result.rows[0];
  }

  /**
   * Find session by token hash
   */
  static async findSessionByTokenHash(tokenHash: string): Promise<UserSession | null> {
    const result = await query(
      'SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete session
   */
  static async deleteSession(tokenHash: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM user_sessions WHERE token_hash = $1',
      [tokenHash]
    );

    return result.rowCount > 0;
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteAllUserSessions(userId: string): Promise<number> {
    const result = await query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );

    return result.rowCount;
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await query('SELECT cleanup_expired_sessions()');
    return result.rows[0].cleanup_expired_sessions;
  }

  /**
   * Hash token for storage using Web Crypto API
   */
  static async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a new content session
   */
  static async createContentSession(sessionData: CreateContentSessionData): Promise<ContentSession> {
    const result = await query(
      `INSERT INTO content_sessions (user_id, filename, file_size, word_count, pages, transcript_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sessionData.user_id,
        sessionData.filename,
        sessionData.file_size,
        sessionData.word_count,
        sessionData.pages,
        sessionData.transcript_text
      ]
    );

    return result.rows[0];
  }

  /**
   * Find content session by ID
   */
  static async findContentSessionById(id: string, userId?: string): Promise<ContentSession | null> {
    let queryText = 'SELECT * FROM content_sessions WHERE id = $1';
    const params = [id];

    if (userId) {
      queryText += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await query(queryText, params);
    return result.rows[0] || null;
  }

  /**
   * Get content session with all generated content
   */
  static async getContentSessionWithContent(id: string, userId?: string): Promise<ContentSessionWithContent | null> {
    const session = await this.findContentSessionById(id, userId);
    if (!session) {
      return null;
    }

    // Get all related content
    const [glossaryResult, questionsResult, objectivesResult, overviewsResult] = await Promise.all([
      query('SELECT * FROM glossary_terms WHERE session_id = $1 ORDER BY term', [id]),
      query('SELECT * FROM questions WHERE session_id = $1 ORDER BY question_type, created_at', [id]),
      query('SELECT * FROM learning_objectives WHERE session_id = $1 ORDER BY created_at', [id]),
      query('SELECT * FROM course_overviews WHERE session_id = $1 ORDER BY created_at', [id])
    ]);

    return {
      ...session,
      glossary_terms: glossaryResult.rows,
      questions: questionsResult.rows,
      learning_objectives: objectivesResult.rows,
      course_overviews: overviewsResult.rows
    };
  }

  /**
   * Get user's content sessions
   */
  static async getUserContentSessions(userId: string, limit: number = 10, offset: number = 0): Promise<ContentSession[]> {
    const result = await query(
      `SELECT * FROM content_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Delete content session and all related content
   */
  static async deleteContentSession(id: string, userId?: string): Promise<boolean> {
    let queryText = 'DELETE FROM content_sessions WHERE id = $1';
    const params = [id];

    if (userId) {
      queryText += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await query(queryText, params);
    return result.rowCount > 0;
  }

  /**
   * Update content session
   */
  static async updateContentSession(id: string, updates: Partial<CreateContentSessionData>, userId?: string): Promise<ContentSession | null> {
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
      return this.findContentSessionById(id, userId);
    }

    values.push(id);
    let queryText = `UPDATE content_sessions SET ${setClause.join(', ')} WHERE id = $${paramCount}`;
    
    if (userId) {
      paramCount++;
      queryText += ` AND user_id = $${paramCount}`;
      values.push(userId);
    }

    queryText += ' RETURNING *';

    const result = await query(queryText, values);
    return result.rows[0] || null;
  }
}
