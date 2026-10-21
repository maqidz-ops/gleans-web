import "server-only";
import { z } from "zod";
const fileSchema = z.object({ key: z.string(), url: z.string().url(), size: z.number().int().positive() });
// Some backend releases return `data` although SDK 1.5.2 declares `objects`.
export function uploadedFiles(response: unknown) {
  const parsed = z.object({ objects: z.array(fileSchema).optional(), data: z.array(fileSchema).optional() }).parse(response);
  return parsed.objects ?? parsed.data ?? [];
}
