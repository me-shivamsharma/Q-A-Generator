// Database model types for the Q&A Generator application

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  verification_token?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  verification_token?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  last_login?: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface CreateSessionData {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface ContentSession {
  id: string;
  user_id: string;
  filename: string;
  file_size?: number;
  word_count?: number;
  pages?: number;
  transcript_text: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentSessionData {
  user_id: string;
  filename: string;
  file_size?: number;
  word_count?: number;
  pages?: number;
  transcript_text: string;
}

export interface GlossaryTerm {
  id: string;
  session_id: string;
  term: string;
  definition: string;
  created_at: Date;
}

export interface CreateGlossaryTermData {
  session_id: string;
  term: string;
  definition: string;
}

export interface Question {
  id: string;
  session_id: string;
  question_type: 'review' | 'assessment';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation_a: string;
  explanation_b: string;
  explanation_c: string;
  explanation_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  created_at: Date;
}

export interface CreateQuestionData {
  session_id: string;
  question_type: 'review' | 'assessment';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation_a: string;
  explanation_b: string;
  explanation_c: string;
  explanation_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
}

export interface LearningObjective {
  id: string;
  session_id: string;
  objective_text: string;
  character_count: number;
  created_at: Date;
}

export interface CreateLearningObjectiveData {
  session_id: string;
  objective_text: string;
  character_count: number;
}

export interface CourseOverview {
  id: string;
  session_id: string;
  overview_text: string;
  created_at: Date;
}

export interface CreateCourseOverviewData {
  session_id: string;
  overview_text: string;
}

// Combined types for API responses
export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

export interface ContentSessionWithContent extends ContentSession {
  glossary_terms?: GlossaryTerm[];
  questions?: Question[];
  learning_objectives?: LearningObjective[];
  course_overviews?: CourseOverview[];
}

export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}
