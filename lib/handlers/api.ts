import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { z, ZodError, ZodSchema } from "zod";

export const withBodyValidation = <T extends ZodSchema>({
  schema,
  handler,
}: {
  schema: T;
  handler: (body: z.infer<T>, e: APIGatewayEvent) => Promise<any>;
}) => {
  const apiGatewayProxyHandler: APIGatewayProxyHandler = async (e) => {
    try {
      const body = schema.parse(JSON.parse(e.body || "{}"));
      const res = await handler(body, e);
      return {
        body: JSON.stringify(res),
        statusCode: 200
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            errors: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          })
        };
      }

      return {
        body: JSON.stringify({ error: `${error}` }),
        statusCode: 500
      };
    }
  };

  return apiGatewayProxyHandler;
};