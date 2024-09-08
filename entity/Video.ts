import { z } from "zod";

export const video = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  uploadedTime: z.number(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["NOT_UPLOADED", "UPLOADED", "PROCESSING", "READY"]),
});
