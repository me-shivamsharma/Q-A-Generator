import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { getAIConfig } from '@/lib/ai-config';
import { ContentService } from '@/lib/services/content-service';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { transcriptText, numQuestions, sessionId } = await request.json();

    if (!transcriptText || !sessionId) {
      return NextResponse.json(
        { error: 'Transcript text and session ID are required' },
        { status: 400 }
      );
    }

    if (numQuestions && (numQuestions < 1 || numQuestions > 50)) {
      return NextResponse.json(
        { error: 'Number of questions must be between 1 and 50' },
        { status: 400 }
      );
    }

    const aiConfig = await getAIConfig();
    const aiService = new AIService(aiConfig);
    const questions = await aiService.generateReviewQuestions({
      transcriptText,
      numQuestions: numQuestions || 5
    });

    // Save questions to database
    const questionsData = questions.map(question => ({
      session_id: sessionId,
      question_type: 'review' as const,
      question_text: question.question,
      correct_answer: question.correctAnswer,
      options: question.options,
      explanation: question.explanation
    }));

    const savedQuestions = await ContentService.createQuestions(questionsData);

    return NextResponse.json({
      success: true,
      data: savedQuestions
    });

  } catch (error) {
    console.error('Review questions generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate review questions' },
      { status: 500 }
    );
  }
}
