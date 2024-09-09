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
      const body = schema.parse(JSON.parse(e.body || ""));
      const res = await handler(body, e);
      return {
        body: JSON.stringify(res),
        statusCode: 200
      };
    } catch (error) {

      if(error instanceof ZodError){
        return {
          statusCode: 400,
          body: error.errors.reduce((a,c) => {
            a += `${c.path} - ${c.message}`
            return a
          },"")
        }
      }

      return {
        body: "Something went wrong",
        statusCode: 400
      };
    }
  };

  return apiGatewayProxyHandler;
};
