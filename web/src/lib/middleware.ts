import { ZodSchema } from "zod";
import { NextResponse } from "next/server";

export function validateBody<T extends ZodSchema>(schema: T) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        const firstError = result.error.errors[0];
        return {
          error: NextResponse.json(
            { error: firstError.message },
            { status: 400 }
          ),
        };
      }

      return { data: result.data };
    } catch {
      return {
        error: NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        ),
      };
    }
  };
}
