'use client';

import { useState, useEffect } from 'react';
import { Bot, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIStatus {
  success: boolean;
  availableProviders: string[];
  currentProvider: string | null;
  message?: string;
  error?: string;
}

export function AIProviderStatus() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await fetch('/api/ai-status');
        const data = await response.json();
        setStatus(data);
      } catch {
        setStatus({
          success: false,
          availableProviders: [],
          currentProvider: null,
          error: 'Failed to check AI configuration'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAIStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking AI configuration...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI GPT-4';
      case 'gemini':
        return 'Google Gemini';
      default:
        return provider;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Bot className="w-4 h-4 text-blue-600" />
      
      {status.success ? (
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">
            AI Provider: <span className="font-medium text-green-700">
              {getProviderDisplayName(status.currentProvider!)}
            </span>
          </span>
          {status.availableProviders.length > 1 && (
            <span className="text-xs text-gray-500">
              (+{status.availableProviders.length - 1} more available)
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-700">
            {status.error || 'No AI provider configured'}
          </span>
        </div>
      )}
    </div>
  );
}
