import { z } from 'zod';

export const notifySchema = z.object({
  token: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1).max(2048),
});
