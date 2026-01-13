import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSecretManager } from './gcp-secret-manager';

export interface GenerationOptions {
  transcriptText: string;
  numQuestions?: number;
  previousTerms?: string[];
}

export type AIProvider = 'openai' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface MCQQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  explanations: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
}

export interface LearningObjective {
  objective: string;
  characterCount: number;
}

export class AIService {
  private openai?: OpenAI;
  private gemini?: GoogleGenerativeAI;
  private provider: AIProvider;

  constructor(config: AIConfig) {
    this.provider = config.provider;

    if (config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
      });
    } else if (config.provider === 'gemini') {
      this.gemini = new GoogleGenerativeAI(config.apiKey);
    }
  }

  private async generateWithAI(prompt: string, maxTokens: number = 1500): Promise<string> {
    if (this.provider === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      return response.choices[0]?.message?.content || '';
    } else if (this.provider === 'gemini' && this.gemini) {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }
    throw new Error(`Unsupported AI provider: ${this.provider}`);
  }

  async generateGlossary(options: GenerationOptions): Promise<GlossaryTerm[]> {
    const { transcriptText, previousTerms = [] } = options;
    
    const previousTermsText = previousTerms.length > 0 
      ? `\n\nPreviously used terms to avoid: ${previousTerms.join(', ')}`
      : '';

    const prompt = `
Extract 10-12 technical terms from the following transcript and create a glossary. Follow these requirements:

1. Extract technical terms, jargon, and difficult-to-understand words directly from the transcript
2. Provide 2-3 line definitions for each term
3. Present terms in alphabetical order
4. Focus on standalone, difficult words and jargons
5. Include full forms for all abbreviations and acronyms
6. Exclude CPA-related terminology and meanings
7. Do not repeat any of these previously used terms: ${previousTerms.join(', ')}
8. When extracting glossary terms from the transcript, only include words or recognized phrases that are commonly used as standalone key terms. Do not merge two separate words into a single entry unless the combined form is widely recognized as an established concept. For example, 'AI' and 'strategy' should remain separate entries (not 'AI strategy'). However, terms like 'machine learning' or 'blockchain technology' can be included as they are established phrases. Always check whether the phrase would realistically appear in a glossary or dictionary before including it.

Format each entry as: **Term.** Definition text on same line

Transcript:
${transcriptText}${previousTermsText}

Return only the glossary entries, one per line.`;

    try {
      const content = await this.generateWithAI(prompt, 1500);
      return this.parseGlossary(content);
    } catch (error) {
      console.error('Error generating glossary:', error);
      throw new Error('Failed to generate glossary');
    }
  }

  private parseGlossary(content: string): GlossaryTerm[] {
    const lines = content.split('\n').filter(line => line.trim());
    const terms: GlossaryTerm[] = [];

    for (const line of lines) {
      const match = line.match(/\*\*(.+?)\.\*\*\s*(.+)/);
      if (match) {
        terms.push({
          term: match[1].trim(),
          definition: match[2].trim()
        });
      }
    }

    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }

  async generateReviewQuestions(options: GenerationOptions): Promise<MCQQuestion[]> {
    const { transcriptText, numQuestions = 5 } = options;
    
    const prompt = `
CRITICAL: You MUST generate EXACTLY ${numQuestions} questions. Not ${numQuestions - 1}, not ${numQuestions + 1}, but EXACTLY ${numQuestions} questions.

Generate ${numQuestions} easy-level multiple choice questions from the following transcript. Follow these requirements:

1. MUST generate EXACTLY ${numQuestions} complete questions - count them before responding
2. Create questions that test basic comprehension and recall of key concepts from the transcript
3. Each question should have 4 contextually relevant answer options based on the course content
4. For True/False style questions: Do NOT include "True or false:" prefix in the question text
5. ALL questions MUST have exactly 4 answer options (a-d) - no exceptions
6. Make answer options specific to the course content, not generic (avoid "Yes/No/Maybe/Not mentioned" patterns)
7. No question repetition or rephrasing
8. Number each question (1., 2., 3., etc.)
9. Options indented with single space before letter
10. "**Answer Explanation:**" on its own line (bold formatting)
11. Each explanation starts with "Incorrect –" or "**Correct –**" (bold for correct)
12. Use **bold** markdown formatting for "Answer Explanation:" heading and correct answer text
13. All text in same color

IMPORTANT: Create diverse, content-specific answer options. Do NOT use generic patterns like:
- Yes/No/Maybe/Not mentioned
- True/False/Partially true/Cannot determine
- Always/Never/Sometimes/Rarely

Instead, create 4 distinct options that are relevant to the specific question and course content.

Format each question as:
1. Question text here?
 a) Option A
 b) Option B
 c) Option C
 d) Option D
**Answer Explanation:**
 a) Incorrect – Explanation for option A
 b) **Correct – Explanation for option B**
 c) Incorrect – Explanation for option C
 d) Incorrect – Explanation for option D

IMPORTANT: Generate ALL ${numQuestions} questions in a single response. Do not truncate or stop early.

Transcript:
${transcriptText}`;

    try {
      const content = await this.generateWithAI(prompt, 4000);
      const questions = this.parseMCQQuestions(content);

      // Verify we got the correct number
      if (questions.length < numQuestions) {
        console.warn(`Generated ${questions.length} questions but ${numQuestions} were requested`);
      }

      return questions;
    } catch (error) {
      console.error('Error generating review questions:', error);
      throw new Error('Failed to generate review questions');
    }
  }

  async generateAssessmentQuestions(options: GenerationOptions): Promise<MCQQuestion[]> {
    const { transcriptText, numQuestions = 5 } = options;

    const prompt = `
CRITICAL: You MUST generate EXACTLY ${numQuestions} questions. Not ${numQuestions - 1}, not ${numQuestions + 1}, but EXACTLY ${numQuestions} questions.

Generate ${numQuestions} moderate-level multiple choice questions from the following transcript. Follow these requirements:

1. MUST generate EXACTLY ${numQuestions} complete questions - count them before responding
2. NO True/False or Yes/No questions allowed
3. Must be unique and different from basic review questions
4. Higher difficulty level than review questions
5. ALL questions MUST have exactly 4 answer options (a-d) - no exceptions
6. Number each question (1., 2., 3., etc.)
7. Options indented with single space before letter
8. "**Answer Explanation:**" on its own line (bold formatting)
9. Each explanation starts with "Incorrect –" or "**Correct –**" (bold for correct)
10. Use **bold** markdown formatting for "Answer Explanation:" heading and correct answer text
11. All text in same color
12. Do NOT include phrases like "as stated in the transcript", "as mentioned in the transcript", or similar references to the source material in explanations
12. Do NOT include phrases like "as stated in the transcript", "as mentioned in the transcript", or similar references to the source material in explanations

Format each question as:
1. Question text here?
 a) Option A
 b) Option B
 c) Option C
 d) Option D
**Answer Explanation:**
 a) Incorrect – Explanation for option A
 b) **Correct – Explanation for option B**
 c) Incorrect – Explanation for option C
 d) Incorrect – Explanation for option D

IMPORTANT: Generate ALL ${numQuestions} questions in a single response. Do not truncate or stop early.

Transcript:
${transcriptText}`;

    try {
      const content = await this.generateWithAI(prompt, 4000);
      const questions = this.parseMCQQuestions(content);

      // Verify we got the correct number
      if (questions.length < numQuestions) {
        console.warn(`Generated ${questions.length} questions but ${numQuestions} were requested`);
      }

      return questions;
    } catch (error) {
      console.error('Error generating assessment questions:', error);
      throw new Error('Failed to generate assessment questions');
    }
  }

  private parseMCQQuestions(content: string): MCQQuestion[] {
    const questions: MCQQuestion[] = [];
    const questionBlocks = content.split(/(?=^[^a-d\)\s].*\?$)/m).filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length < 10) continue; // Need at least question + 4 options + 4 explanations

      const question = lines[0];
      const options = {
        a: lines[1]?.replace(/^a\)\s*/, '') || '',
        b: lines[2]?.replace(/^b\)\s*/, '') || '',
        c: lines[3]?.replace(/^c\)\s*/, '') || '',
        d: lines[4]?.replace(/^d\)\s*/, '') || ''
      };

      // Find explanations section
      const explanationStart = lines.findIndex(line => line.includes('Answer Explanation:'));
      if (explanationStart === -1) continue;

      const explanations = {
        a: '',
        b: '',
        c: '',
        d: ''
      };

      let correctAnswer: 'a' | 'b' | 'c' | 'd' = 'a';

      // Parse explanations - they come after "Answer Explanation:" without option letters
      const explanationLines = lines.slice(explanationStart + 1);
      const optionKeys = ['a', 'b', 'c', 'd'] as const;

      for (let i = 0; i < explanationLines.length && i < 4; i++) {
        const line = explanationLines[i];
        if (line) {
          const optionKey = optionKeys[i];
          explanations[optionKey] = line;

          // Check if this explanation indicates the correct answer
          if (line.includes('**Correct') || line.includes('Correct –')) {
            correctAnswer = optionKey;
          }
        }
      }

      if (question && options.a && options.b && options.c && options.d) {
        questions.push({
          question,
          options,
          explanations,
          correctAnswer
        });
      }
    }

    return questions;
  }

  async generateLearningObjective(options: GenerationOptions): Promise<LearningObjective> {
    const { transcriptText } = options;
    
    const prompt = `
Generate a single learning objective (max 160 characters) from the following transcript. Follow these requirements:

1. Cover 75% of the assessment question content
2. Follow Bloom's Taxonomy Levels 2 & 3 and SMART format
3. Use "course" instead of "masterclass"
4. Use only 1 action verb per objective
5. Allowed action verbs: Determine, Compare, Discuss, Identify, Recognize, Select, Distinguish, Differentiate
6. Prohibited action verbs: Analyze, Apply, Create, Explain, Illustrate, Propose

Return only the learning objective text, nothing else.

Transcript:
${transcriptText}`;

    try {
      const objective = await this.generateWithAI(prompt, 200);
      const trimmedObjective = objective.trim();

      return {
        objective: trimmedObjective.substring(0, 160),
        characterCount: trimmedObjective.length
      };
    } catch (error) {
      console.error('Error generating learning objective:', error);
      throw new Error('Failed to generate learning objective');
    }
  }

  async generateCourseOverview(options: GenerationOptions): Promise<string> {
    const { transcriptText } = options;

    const prompt = `
Generate a course overview of 2-3 paragraphs for the following transcript. Follow these requirements:

CRITICAL FORMAT REQUIREMENTS:
1. Begin with the course title (extract from transcript)
2. Immediately follow with "by [Author Name]" in the SAME SENTENCE as the title
3. Then continue with the 2-3 paragraph overview

EXAMPLE FORMAT:
"Every Touchpoint Tells a Story by Dr. Jill Schiefelbein invites you to examine the entire customer journey..."

OTHER REQUIREMENTS:
- 2-3 well-structured paragraphs total
- Include the speaker's name and title/credentials
- Avoid using the word "masterclass" - use "course" instead
- Provide a comprehensive overview of the content covered
- Highlight key learning points and takeaways
- Professional and engaging tone

Transcript:
${transcriptText}

Return only the course overview text in 2-3 paragraphs, starting with "[Course Title] by [Author Name]...".`;

    try {
      const content = await this.generateWithAI(prompt, 800);
      return content.trim();
    } catch (error) {
      console.error('Error generating course overview:', error);
      throw new Error('Failed to generate course overview');
    }
  }

  async generateShortDescription(options: GenerationOptions): Promise<string> {
    const { transcriptText } = options;

    const prompt = `
Generate a short course description that gives a brief overview of this transcript.

CRITICAL REQUIREMENTS:
- Maximum 140 characters (including spaces and punctuation)
- Must be a complete, coherent statement that ends naturally
- Must end with proper punctuation (period, exclamation mark, etc.)
- Do NOT cut off mid-word or mid-sentence
- The description should be concise but complete
- Do NOT include phrases like "by the end of the course" or any learning outcomes
- It should ONLY describe what the course covers
- Be purely descriptive, not promotional
- No mention of what students will learn or achieve

IMPORTANT: Ensure the entire description forms a complete thought and reads naturally. If you need to stay under 140 characters, use shorter words or simpler phrasing, but always maintain completeness and proper ending punctuation.

Transcript:
${transcriptText}`;

    try {
      const content = await this.generateWithAI(prompt, 200);
      const description = content.trim();

      // If the description is over 140 characters, try to find a natural breaking point
      if (description.length > 140) {
        // First, try to find the last complete sentence within 140 characters
        const sentences = description.split(/[.!?]+/);
        let result = '';

        for (const sentence of sentences) {
          const potentialResult = result + sentence.trim() + '.';
          if (potentialResult.length <= 140) {
            result = potentialResult;
          } else {
            break;
          }
        }

        // If we found a complete sentence within the limit, use it
        if (result.length > 0 && result.length <= 140) {
          return result;
        }

        // Otherwise, find the last complete word within 137 characters and add ellipsis
        const words = description.split(' ');
        result = '';

        for (const word of words) {
          const potentialResult = result + (result ? ' ' : '') + word;
          if (potentialResult.length <= 137) {
            result = potentialResult;
          } else {
            break;
          }
        }

        return result + '...';
      }

      return description;
    } catch (error) {
      console.error('Error generating short description:', error);
      throw new Error('Failed to generate short description');
    }
  }

  async generateTopics(options: GenerationOptions): Promise<string> {
    const { transcriptText } = options;

    const prompt = `
Generate exactly 5 main topics that are covered in this transcript.

CRITICAL REQUIREMENTS:
- EXACTLY 5 topics, no more, no less
- Each topic should be only 1-2 words, like headings or keywords
- Return them as a comma-separated list
- No explanations, just the topic names
- Topics should be concise and descriptive

Example format: "I-Verb Framework, Confident Speaking, Remove Fillers, Executive Presence, Intentional Pauses"

Transcript:
${transcriptText}`;

    try {
      const content = await this.generateWithAI(prompt, 150);
      return content.trim();
    } catch (error) {
      console.error('Error generating topics:', error);
      throw new Error('Failed to generate topics');
    }
  }
}
