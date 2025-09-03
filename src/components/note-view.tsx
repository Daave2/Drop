"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Flag, Trash2 } from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  runTransaction,
  serverTimestamp,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

import { useToast } from "@/hooks/use-toast";
import { getOrCreatePseudonym } from "@/lib/pseudonym";
import { db } from "@/lib/firebase";
import { Note, Reply } from "@/types";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea } from "./ui/scroll-area";
import { SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";

import ReplyForm from "./reply-form";
import ReportDialog from "./report-dialog";

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

export default function NoteView({
  note: initialNote,
  onClose,
}: {
  note: Note;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState<Note>(initialNote);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const noteRef = doc(db, "notes", initialNote.id);
    const unsubscribeNote = onSnapshot(
      noteRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.visibility === "unlisted" && data.authorUid !== user?.uid) {
            toast({ title: "Note Unavailable", description: "This note is no longer available." });
            onClose();
            return;
          }
          const createdAt =
            data.createdAt instanceof Timestamp
              ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
              : { seconds: Date.now() / 1000, nanoseconds: 0 };
          setNote({ id: docSnap.id, ...data, createdAt } as Note);
        } else {
          toast({ title: "Note Deleted", description: "This note has been removed." });
          onClose();
        }
      },
      (error) => {
        console.error("Snapshot listener error:", error);
        toast({ title: "Network Error", description: "Could not sync with the note." });
        onClose();
      }
    );

    return () => unsubscribeNote();
  }, [initialNote.id, toast, onClose, user?.uid]);

  useEffect(() => {
    if (!user) return;
    const likeId = `${user.uid}_${initialNote.id}`;
    const likeRef = doc(db, "likes", likeId);
    const unsubscribeLike = onSnapshot(likeRef, (docSnap) => {
      setIsLiked(docSnap.exists());
    });
    return () => unsubscribeLike();
  }, [initialNote.id, user]);

  useEffect(() => {
    const repliesRef = collection(db, "notes", initialNote.id, "replies");
    const q = query(repliesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const repliesData = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt =
            data.createdAt instanceof Timestamp
              ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
              : { seconds: Date.now() / 1000, nanoseconds: 0 };
          return { id: docSnap.id, ...data, createdAt } as Reply;
        });
        setReplies(repliesData);
        setLoadingReplies(false);
      },
      (error) => {
        console.error("Error fetching replies:", error);
        setLoadingReplies(false);
      }
    );

    return () => unsubscribe();
  }, [initialNote.id]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast({ title: "Please sign in to like notes.", variant: "destructive" });
      return;
    }
    setIsLiking(true);

    const noteRef = doc(db, "notes", note.id);
    const likeId = `${user.uid}_${note.id}`;
    const likeRef = doc(db, "likes", likeId);

    let addedLike = false;
    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        const noteDoc = await transaction.get(noteRef);

        if (!noteDoc.exists()) {
          throw new Error("Note does not exist!");
        }

        const currentScore = noteDoc.data().score || 0;

        if (likeDoc.exists()) {
          transaction.delete(likeRef);
          transaction.update(noteRef, { score: currentScore - 1 });
        } else {
          transaction.set(likeRef, {
            userId: user.uid,
            noteId: note.id,
            createdAt: serverTimestamp(),
          });
          transaction.update(noteRef, { score: currentScore + 1 });
          addedLike = true;
        }
      });

      if (addedLike && note.authorUid && note.authorUid !== user.uid) {
        const pseudonym = await getOrCreatePseudonym(user.uid);
        await addDoc(collection(db, "notifications"), {
          userId: note.authorUid,
          type: "like",
          noteId: note.id,
          actorUid: user.uid,
          actorPseudonym: pseudonym,
          createdAt: serverTimestamp(),
          read: false,
        });
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: note.authorUid,
            title: "New like",
            body: `${pseudonym} liked your note`,
            data: { noteId: note.id, type: "like" },
          }),
        }).catch(() => {});
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({ title: "Error", description: "Failed to update like.", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (user?.uid !== note.authorUid) {
      toast({ title: "Not Authorized", description: "You can only delete your own notes.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db, "notes", note.id));
      toast({ title: "Note Deleted", description: "Your note has been successfully deleted." });
      onClose();
    } catch (error: any) {
      console.error("Error deleting note: ", error);
      toast({ title: "Error", description: error.message || "Failed to delete the note.", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline text-2xl">Note Revealed!</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 -mx-6">
        <div className="px-6 pt-4 space-y-6">
          {note.media?.[0]?.path && (
            <div className="rounded-lg overflow-hidden aspect-video relative bg-muted">
              <Image src={note.media[0].path} alt="Note media" fill className="object-cover" data-ai-hint="mural street art" />
            </div>
          )}
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{note.text}</p>
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{note.authorPseudonym?.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{note.authorPseudonym}</span>
            </div>
            <span>{note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleLikeToggle} disabled={isLiking || note.authorUid === user?.uid}>
              <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-destructive text-destructive")} />
              {note.score}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)} disabled={note.authorUid === user?.uid}>
              <Flag className="h-4 w-4 mr-2" /> Report
            </Button>
            {note.authorUid === user?.uid && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Badge variant={note.type === "photo" ? "default" : "secondary"}>{note.type}</Badge>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-headline text-xl">Replies ({replies.length})</h3>
            <div className="space-y-4">
              {loadingReplies && <Skeleton className="h-16 w-full" />}
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="h-8 h-8">
                    <AvatarFallback>{reply.authorPseudonym?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg flex-1">
                    <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reply.authorPseudonym} &middot; {new Date(reply.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {!loadingReplies && replies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">Be the first to reply!</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
      <SheetFooter className="pt-2">
        <ReplyForm noteId={note.id} noteAuthorUid={note.authorUid} />
      </SheetFooter>

      <ReportDialog
        note={note}
        open={isReportDialogOpen}
        onOpenChange={setReportDialogOpen}
        onReportSubmit={() => {
          setReportDialogOpen(false);
          onClose();
        }}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note and all of its replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

