"use client";

import { useState } from "react";
import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";

import { useToast } from "@/hooks/use-toast";
import { calculateReportUpdate } from "@/lib/reporting";
import { db } from "@/lib/firebase";
import { Note } from "@/types";
import { useAuth } from "./auth-provider";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export default function ReportDialog({
  note,
  open,
  onOpenChange,
  onReportSubmit,
}: {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportSubmit: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Not signed in", description: "You must be signed in to report.", variant: "destructive" });
      return;
    }
    if (reason.length < 10) {
      toast({ title: "Reason too short", description: "Please provide a more detailed reason.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const noteRef = doc(db, "notes", note.id);
        const noteSnap = await transaction.get(noteRef);
        const { newCount, hide } = calculateReportUpdate(noteSnap.data()?.reportCount ?? 0);
        const updates: any = { reportCount: newCount };
        if (hide) {
          updates.visibility = "unlisted";
        }
        transaction.update(noteRef, updates);

        const reportRef = doc(collection(db, "reports"));
        transaction.set(reportRef, {
          noteId: note.id,
          noteAuthorUid: note.authorUid,
          reporterUid: user.uid,
          reason: reason,
          createdAt: serverTimestamp(),
          status: "pending_review",
        });
      });

      toast({
        title: "Report Submitted",
        description: "Thank you. The note has been flagged for review.",
      });
      onReportSubmit();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({ title: "Error", description: error.message || "Failed to submit report.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report Note</AlertDialogTitle>
          <AlertDialogDescription>
            Why are you reporting this note? Please provide a brief explanation. Your report is anonymous to other users.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reason">Reason for reporting</Label>
          <Textarea
            id="reason"
            placeholder="e.g., This note contains harassment."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            required
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting || reason.length < 10}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

