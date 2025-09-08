import { z } from 'zod';

export const notifySchema = z.union([
  z.object({
    token: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1).max(2048),
  }),
  z.object({
    userId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1).max(2048),
    data: z.record(z.string()).optional(),
  }),
]);
