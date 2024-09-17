import { z } from "zod";
import { DB } from "../lib/db";

export const docSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  uploadedTime: z.number(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["NOT_UPLOADED", "UPLOADED", "PROCESSING", "READY","ERROR"]),
  files: z
    .object({
      "720p": z.string().optional(),
      "360p": z.string().optional(),
      "240p": z.string().optional(),
    })
    .optional(),
});

type PartialAttrs = Partial<Omit<z.infer<typeof docSchema>, "id">>;

export class VideoDB extends DB<z.infer<typeof docSchema>> {
  changes: PartialAttrs = {};
  collectChanges(attrs: PartialAttrs) {
    this.changes = {
      ...this.changes,
      ...attrs,
    };
  }

  addFiles(files: PartialAttrs["files"]) {
    this.changes.files = {
      ...this.changes.files,
      ...files,
    };
  }
}
