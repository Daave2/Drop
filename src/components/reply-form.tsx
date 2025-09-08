"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { getOrCreatePseudonym } from "@/lib/pseudonym";
import { db } from "@/lib/firebase";
import { useAuth } from "./auth-provider";

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

const replySchema = z.object({
  text: z
    .string()
    .min(1, "Reply cannot be empty.")
    .max(120, "Reply cannot exceed 120 characters."),
});

export default function ReplyForm({
  noteId,
  noteAuthorUid,
}: {
  noteId: string;
  noteAuthorUid?: string | null;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Not signed in", description: "You must be signed in to reply.", variant: "destructive" });
      return;
    }

    const validation = replySchema.safeParse({ text });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const pseudonym = await getOrCreatePseudonym(user.uid);
      const replyRef = collection(db, "notes", noteId, "replies");

      await addDoc(replyRef, {
        text,
        noteId,
        authorUid: user.uid,
        authorPseudonym: pseudonym,
        createdAt: serverTimestamp(),
      });

      if (noteAuthorUid && noteAuthorUid !== user.uid) {
        const notificationsRef = collection(db, "notifications");
        await addDoc(notificationsRef, {
          userId: noteAuthorUid,
          type: "reply",
          noteId,
          actorUid: user.uid,
          actorPseudonym: pseudonym,
          createdAt: serverTimestamp(),
          read: false,
        });
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: noteAuthorUid,
            title: "New reply",
            body: `${pseudonym} replied to your note`,
            data: { noteId, type: "reply" },
          }),
        }).catch(() => {});
      }

      setText("");
      toast({ title: "Reply posted successfully!" });
    } catch (err: any) {
      console.error("Error submitting reply:", err);
      toast({ title: "Error", description: err.message || "Failed to post reply.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <p className="text-sm text-center text-muted-foreground py-4">Please sign in to reply.</p>;
  }

  return (
    <form id="reply-form" onSubmit={handleSubmit} className="flex items-start gap-2 pt-2">
      <div className="flex-grow space-y-1">
        <Textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          placeholder="Add a reply... (Max 120 chars)"
          maxLength={120}
          rows={1}
          required
          className="flex-grow min-h-0"
        />
        <p className="text-xs text-muted-foreground text-right">{text.length}/120</p>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
      <Button
        type="submit"
        size="icon"
        className="h-full"
        disabled={isSubmitting}
        aria-label="Send reply"
      >
        {isSubmitting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

