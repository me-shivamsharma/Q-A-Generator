import { NextResponse } from 'next/server';
import { getAvailableProviders, getAIConfig } from '@/lib/ai-config';

export async function GET() {
  try {
    const availableProviders = await getAvailableProviders();

    if (availableProviders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No AI providers configured',
        availableProviders: [],
        currentProvider: null
      });
    }

    const currentConfig = await getAIConfig();
    
    return NextResponse.json({
      success: true,
      availableProviders,
      currentProvider: currentConfig.provider,
      message: `Using ${currentConfig.provider.toUpperCase()} for AI generation`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check AI configuration',
      availableProviders: [],
      currentProvider: null
    });
  }
}
