"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const replySchema = z.object({
  noteId: z.string(),
  text: z.string().min(1, "Reply cannot be empty.").max(120, "Reply cannot exceed 120 characters."),
});

type FormState = {
    message: string;
    errors?: {
        text?: string[];
        noteId?: string[];
    };
    reset?: boolean;
}

export async function submitReply(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = replySchema.safeParse({
    noteId: formData.get('noteId'),
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }
  
  const { text, noteId } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This reply violates our content policy.'] },
        message: 'Your reply was flagged as inappropriate. Please revise.',
      };
    }
    
    // In a real app, you would save the reply to your database here.
    console.log('Reply is safe, saving to DB:', { noteId, text });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Revalidate the path to show the new reply if you were on a note page
    // revalidatePath(`/note/${noteId}`);

    return { message: 'Reply posted successfully!', errors: {}, reset: true };
    
  } catch (error) {
    console.error("Error submitting reply:", error);
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}
