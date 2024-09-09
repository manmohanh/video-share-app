import { APIGatewayProxyHandler } from "aws-lambda";
import { DB } from "../lib/db";
import { z } from "zod";
import { S3 } from "../lib/s3";
import { v4 } from "uuid";
import { createDoc as createVideoDoc } from "../entity/Video";
import { withBodyValidation } from "../lib/handlers/api";

const db = new DB({
  tableName: "video-share",
  region: "ap-south-1",
});
const s3 = new S3({
  region: "ap-south-1",
  bucketName: "video-share-app-bucket",
});

export const handler = withBodyValidation({
  schema: z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  async handler({ userId, title, description, tags }) {
    const id = v4();

    await db.save(
      createVideoDoc({
        id,
        userId,
        title,
        description,
        uploadedTime: Date.now(),
        tags,
        status: "NOT_UPLOADED",
      })
    );

    return {
      uploadUrl: await s3.getUploadUrl({
        key: id,
        expiresIn: 60 * 10,
      }),
    };
  },
});
