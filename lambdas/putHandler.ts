import { DB } from "../lib/db";
import { z } from "zod";
import { S3 } from "../lib/s3";
import { v4 } from "uuid";
import { createDoc as createVideoDoc } from "../entity/Video";
import { withBodyValidation } from "../lib/handlers/api";
import {PutHandler as Env} from "./../lib/lambdaEnv"

const env = process.env as Env

const db = new DB({
  tableName: env.VIDEO_TABLE_NAME || "test-table",
  region: env.VIDEO_TABLE_REGION || "ap-south-1",
});
const s3 = new S3({
  region: env.UPLOAD_BUCKET_REGION ||"ap-south-1",
  bucketName: env.UPLOAD_BUCKET_NAME || "test-bucket",
});

export const handler = withBodyValidation({
  schema: z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional()
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
