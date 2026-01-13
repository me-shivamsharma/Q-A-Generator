import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { getAIConfig } from '@/lib/ai-config';
import { ContentService } from '@/lib/services/content-service';
import { authenticateRequest } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { transcriptText, previousTerms, sessionId } = await request.json();

    if (!transcriptText || !sessionId) {
      return NextResponse.json(
        { error: 'Transcript text and session ID are required' },
        { status: 400 }
      );
    }

    const aiConfig = await getAIConfig();
    const aiService = new AIService(aiConfig);
    const glossary = await aiService.generateGlossary({
      transcriptText,
      previousTerms: previousTerms || []
    });

    // Save glossary terms to database
    const glossaryTermsData = glossary.map(term => ({
      session_id: sessionId,
      term: term.term,
      definition: term.definition
    }));

    const savedTerms = await ContentService.createGlossaryTerms(glossaryTermsData);

    return NextResponse.json({
      success: true,
      data: savedTerms
    });

  } catch (error) {
    console.error('Glossary generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate glossary. Please check your AI API configuration.' },
      { status: 500 }
    );
  }
}
