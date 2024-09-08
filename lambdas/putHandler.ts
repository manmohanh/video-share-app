import { APIGatewayProxyHandler } from "aws-lambda";
import { DB } from "../lib/db";
import { z } from "zod";
import { S3 } from "../lib/s3";

import { v4 } from "uuid";
import { video } from "../entity/Video";

const db = new DB({
  tableName: "video-share",
  region: "ap-south-1",
});
const s3 = new S3();

const bodySchema = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const handler: APIGatewayProxyHandler = async (e) => {
  const body = JSON.parse(e.body || "{}");

  try {
    const { userId, title, description, tags } = bodySchema.parse(body);
    const videoDoc: z.infer<typeof video> = {
      id: v4(),
      userId,
      title,
      description,
      uploadedTime: Date.now(),
      tags,
      status: "NOT_UPLOADED",
    };

    await db.save(videoDoc);

    const url = s3.getUploadUrl();

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: url,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: "validation failed",
    };
  }
};
