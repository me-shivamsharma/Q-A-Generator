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

    const { transcriptText, sessionId } = await request.json();

    if (!transcriptText || !sessionId) {
      return NextResponse.json(
        { error: 'Transcript text and session ID are required' },
        { status: 400 }
      );
    }

    const aiConfig = await getAIConfig();
    const aiService = new AIService(aiConfig);
    const objective = await aiService.generateLearningObjective({
      transcriptText
    });

    // Save learning objective to database
    const savedObjective = await ContentService.createLearningObjective({
      session_id: sessionId,
      objective_text: objective.objective,
      bloom_level: objective.bloomLevel,
      smart_criteria: objective.smartCriteria
    });

    return NextResponse.json({
      success: true,
      data: savedObjective
    });

  } catch (error) {
    console.error('Learning objective generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate learning objective' },
      { status: 500 }
    );
  }
}
