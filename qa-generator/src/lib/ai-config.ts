import { AIConfig, AIProvider } from './ai-service';
import { getSecretManager } from './gcp-secret-manager';

// Cache for API keys to avoid repeated Secret Manager calls
let cachedApiKey: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAIConfig(): Promise<AIConfig> {
  try {
    // First, try to get API key from GCP Secret Manager
    const apiKey = await getOpenAIApiKeyFromSecretManager();
    if (apiKey) {
      return {
        provider: 'openai',
        apiKey: apiKey
      };
    }
  } catch (error) {
    console.warn('Failed to retrieve API key from GCP Secret Manager:', error);
    console.log('Falling back to environment variables...');
  }

  // Fallback to environment variables (for development)
  return getAIConfigFromEnv();
}

async function getOpenAIApiKeyFromSecretManager(): Promise<string | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedApiKey && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Using cached API key');
      return cachedApiKey;
    }

    console.log('Fetching API key from GCP Secret Manager...');
    const secretManager = getSecretManager();
    const apiKey = await secretManager.getOpenAIApiKey();

    // Cache the key
    cachedApiKey = apiKey;
    cacheTimestamp = now;

    console.log('Successfully retrieved API key from Secret Manager');
    return apiKey;
  } catch (error) {
    console.error('Error retrieving API key from Secret Manager:', error);
    return null;
  }
}

function getAIConfigFromEnv(): AIConfig {
  // Check for OpenAI API key first
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    console.log('Using OpenAI API key from environment variables');
    return {
      provider: 'openai',
      apiKey: openaiKey
    };
  }

  // Check for Gemini API key
  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    console.log('Using Gemini API key from environment variables');
    return {
      provider: 'gemini',
      apiKey: geminiKey
    };
  }

  // Check for alternative environment variable names
  const googleKey = process.env.GEMINI_API_KEY;
  if (googleKey) {
    console.log('Using Gemini API key from environment variables (alternative name)');
    return {
      provider: 'gemini',
      apiKey: googleKey
    };
  }

  throw new Error('No AI API key configured. Please configure GCP Secret Manager or set OPENAI_API_KEY/GOOGLE_AI_API_KEY in your environment variables.');
}

export async function getAvailableProviders(): Promise<AIProvider[]> {
  const providers: AIProvider[] = [];

  // Check if we can get OpenAI key from Secret Manager or env
  try {
    const config = await getAIConfig();
    if (config.provider === 'openai') {
      providers.push('openai');
    } else if (config.provider === 'gemini') {
      providers.push('gemini');
    }
  } catch (error) {
    console.warn('No AI providers available:', error);
  }

  return providers;
}

// Synchronous version for backward compatibility (checks only env vars)
export function getAvailableProvidersSync(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push('openai');
  }

  if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    providers.push('gemini');
  }

  return providers;
}
