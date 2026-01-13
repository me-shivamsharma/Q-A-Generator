import { NextRequest, NextResponse } from 'next/server';
import { PDFProcessor } from '@/lib/pdf-processor';
import { SessionService } from '@/lib/services/session-service';
import { authenticateRequest } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.response;
    }
    const userId = authResult.user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate PDF signature
    if (!PDFProcessor.validatePDF(buffer)) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const processedPDF = await PDFProcessor.extractText(buffer, file.name);
    const cleanedText = PDFProcessor.cleanText(processedPDF.text);

    // Create content session in database
    const contentSession = await SessionService.createContentSession({
      user_id: userId,
      filename: processedPDF.filename,
      file_size: file.size,
      word_count: cleanedText.split(/\s+/).length,
      pages: processedPDF.pages,
      transcript_text: cleanedText
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: contentSession.id,
        text: cleanedText,
        pages: processedPDF.pages,
        filename: processedPDF.filename,
        wordCount: cleanedText.split(/\s+/).length
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}
