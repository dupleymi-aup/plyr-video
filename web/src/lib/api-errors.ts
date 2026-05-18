import { NextResponse } from "next/server";

/**
 * Consistent error response for API routes.
 * Logs the error on the server and returns a generic 500 response.
 * In development, includes the error message for easier debugging.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const prefix = context ? `[${context}]` : "[API]";

  if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }

  return NextResponse.json(
    { error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}

/**
 * Wrapper for API handlers that automatically catches and handles errors.
 * Usage: withErrorHandler(async (req) => { ... })(req)
 */
export function withErrorHandler<T extends Request, R>(
  handler: (req: T) => Promise<R>,
  context?: string
) {
  return async (req: T): Promise<NextResponse> => {
    try {
      const result = await handler(req);
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}
