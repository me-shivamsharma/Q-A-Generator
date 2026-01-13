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

    const config = await getAIConfig();
    const aiService = new AIService(config);
    const courseOverview = await aiService.generateCourseOverview({
      transcriptText
    });

    // Save course overview to database
    const savedOverview = await ContentService.createCourseOverview({
      session_id: sessionId,
      overview_text: courseOverview
    });

    return NextResponse.json({
      success: true,
      courseOverview: savedOverview.overview_text
    });
  } catch (error) {
    console.error('Course overview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate course overview' },
      { status: 500 }
    );
  }
}
