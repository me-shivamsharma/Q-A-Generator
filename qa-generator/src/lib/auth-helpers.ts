import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';

/**
 * Authenticate a request and return user info or error response
 */
export async function authenticateRequest(request: NextRequest) {
  const authResult = await AuthService.authenticateRequest(request);

  if (!authResult.success) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    };
  }

  return {
    success: true,
    user: authResult.user!
  };
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return authResult.response;
    }

    return handler(request, authResult.user, ...args);
  };
}
