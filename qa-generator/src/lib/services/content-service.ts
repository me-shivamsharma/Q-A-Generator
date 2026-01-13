import { query, transaction } from '../database';
import { 
  GlossaryTerm,
  CreateGlossaryTermData,
  Question,
  CreateQuestionData,
  LearningObjective,
  CreateLearningObjectiveData,
  CourseOverview,
  CreateCourseOverviewData
} from '../../types/database';

export class ContentService {
  /**
   * Create glossary terms
   */
  static async createGlossaryTerms(terms: CreateGlossaryTermData[]): Promise<GlossaryTerm[]> {
    if (terms.length === 0) return [];

    const values = [];
    const placeholders = [];
    
    for (let i = 0; i < terms.length; i++) {
      const offset = i * 3;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
      values.push(terms[i].session_id, terms[i].term, terms[i].definition);
    }

    const result = await query(
      `INSERT INTO glossary_terms (session_id, term, definition)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return result.rows;
  }

  /**
   * Get glossary terms for a session
   */
  static async getGlossaryTerms(sessionId: string): Promise<GlossaryTerm[]> {
    const result = await query(
      'SELECT * FROM glossary_terms WHERE session_id = $1 ORDER BY term',
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Delete glossary term
   */
  static async deleteGlossaryTerm(id: string, sessionId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM glossary_terms WHERE id = $1 AND session_id = $2',
      [id, sessionId]
    );

    return result.rowCount > 0;
  }

  /**
   * Create questions
   */
  static async createQuestions(questions: CreateQuestionData[]): Promise<Question[]> {
    if (questions.length === 0) return [];

    const values = [];
    const placeholders = [];
    
    for (let i = 0; i < questions.length; i++) {
      const offset = i * 12;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`);
      values.push(
        questions[i].session_id,
        questions[i].question_type,
        questions[i].question_text,
        questions[i].option_a,
        questions[i].option_b,
        questions[i].option_c,
        questions[i].option_d,
        questions[i].explanation_a,
        questions[i].explanation_b,
        questions[i].explanation_c,
        questions[i].explanation_d,
        questions[i].correct_answer
      );
    }

    const result = await query(
      `INSERT INTO questions (session_id, question_type, question_text, option_a, option_b, option_c, option_d, explanation_a, explanation_b, explanation_c, explanation_d, correct_answer)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return result.rows;
  }

  /**
   * Get questions for a session
   */
  static async getQuestions(sessionId: string, questionType?: 'review' | 'assessment'): Promise<Question[]> {
    let queryText = 'SELECT * FROM questions WHERE session_id = $1';
    const params = [sessionId];

    if (questionType) {
      queryText += ' AND question_type = $2';
      params.push(questionType);
    }

    queryText += ' ORDER BY question_type, created_at';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Delete question
   */
  static async deleteQuestion(id: string, sessionId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM questions WHERE id = $1 AND session_id = $2',
      [id, sessionId]
    );

    return result.rowCount > 0;
  }

  /**
   * Create learning objective
   */
  static async createLearningObjective(objective: CreateLearningObjectiveData): Promise<LearningObjective> {
    const result = await query(
      `INSERT INTO learning_objectives (session_id, objective_text, character_count)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [objective.session_id, objective.objective_text, objective.character_count]
    );

    return result.rows[0];
  }

  /**
   * Get learning objectives for a session
   */
  static async getLearningObjectives(sessionId: string): Promise<LearningObjective[]> {
    const result = await query(
      'SELECT * FROM learning_objectives WHERE session_id = $1 ORDER BY created_at',
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Create course overview
   */
  static async createCourseOverview(overview: CreateCourseOverviewData): Promise<CourseOverview> {
    const result = await query(
      `INSERT INTO course_overviews (session_id, overview_text)
       VALUES ($1, $2)
       RETURNING *`,
      [overview.session_id, overview.overview_text]
    );

    return result.rows[0];
  }

  /**
   * Get course overviews for a session
   */
  static async getCourseOverviews(sessionId: string): Promise<CourseOverview[]> {
    const result = await query(
      'SELECT * FROM course_overviews WHERE session_id = $1 ORDER BY created_at',
      [sessionId]
    );

    return result.rows;
  }

  /**
   * Delete all content for a session
   */
  static async deleteAllSessionContent(sessionId: string): Promise<void> {
    await transaction(async (client) => {
      await client.query('DELETE FROM glossary_terms WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM questions WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM learning_objectives WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM course_overviews WHERE session_id = $1', [sessionId]);
    });
  }

  /**
   * Get content statistics for a session
   */
  static async getSessionStats(sessionId: string): Promise<{
    glossary_count: number;
    review_questions_count: number;
    assessment_questions_count: number;
    learning_objectives_count: number;
    course_overviews_count: number;
  }> {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM glossary_terms WHERE session_id = $1) as glossary_count,
        (SELECT COUNT(*) FROM questions WHERE session_id = $1 AND question_type = 'review') as review_questions_count,
        (SELECT COUNT(*) FROM questions WHERE session_id = $1 AND question_type = 'assessment') as assessment_questions_count,
        (SELECT COUNT(*) FROM learning_objectives WHERE session_id = $1) as learning_objectives_count,
        (SELECT COUNT(*) FROM course_overviews WHERE session_id = $1) as course_overviews_count`,
      [sessionId]
    );

    return result.rows[0];
  }
}
