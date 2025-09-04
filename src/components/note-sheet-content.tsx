"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";

import { useToast } from "@/hooks/use-toast";
import { Coordinates } from "@/hooks/use-location";
import { db } from "@/lib/firebase";
import { Note } from "@/types";

import { Skeleton } from "./ui/skeleton";
import CreateNoteForm from "./create-note-form";
import NoteView from "./note-view";
import { SheetHeader, SheetTitle } from "./ui/sheet";

interface NoteSheetContentProps {
  noteId: string | null;
  isCreating: boolean;
  userLocation: Coordinates | null;
  onNoteCreated: () => void;
  onClose: () => void;
}

export default function NoteSheetContent({
  noteId,
  isCreating,
  userLocation,
  onNoteCreated,
  onClose,
}: NoteSheetContentProps) {
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      if (noteId && !isCreating) {
        setLoadingNote(true);
        try {
          const noteDoc = await getDoc(doc(db, "notes", noteId));
          if (noteDoc.exists()) {
            const data = noteDoc.data();
            const createdAt =
              data.createdAt instanceof Timestamp
                ? { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds }
                : { seconds: Date.now() / 1000, nanoseconds: 0 };
            setNote({ id: noteDoc.id, ...data, createdAt } as Note);
          } else {
            toast({ title: "Error", description: "Could not find the selected note.", variant: "destructive" });
            onClose?.();
          }
        } catch (error) {
          console.error("Error fetching document: ", error);
          toast({ title: "Error", description: "Failed to load the note.", variant: "destructive" });
          onClose?.();
        } finally {
          setLoadingNote(false);
        }
      } else {
        setNote(null);
      }
    }
    fetchNote();
  }, [noteId, isCreating, toast, onClose]);

  if (isCreating) {
    return <CreateNoteForm userLocation={userLocation} onNoteCreated={onNoteCreated} onClose={onClose} />;
  }

  if (loadingNote) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Loading Note...</SheetTitle>
        </SheetHeader>
        <div className="p-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </>
    );
  }

  if (!note) {
    return (
      <div className="p-4 text-center">
        <SheetHeader>
          <SheetTitle>Note</SheetTitle>
        </SheetHeader>
        Select a note to view its contents.
      </div>
    );
  }

  return <NoteView note={note} onClose={onClose} />;
}
