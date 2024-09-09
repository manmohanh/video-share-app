import { z } from "zod";

export const docSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  uploadedTime: z.number(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["NOT_UPLOADED", "UPLOADED", "PROCESSING", "READY"]),
});


export const createDoc = (props:z.infer<typeof docSchema>) => {
  return props
}