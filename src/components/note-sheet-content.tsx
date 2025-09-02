"use client";

import { useEffect, useState, useActionState, useRef } from 'react';
import { Camera, Heart, Flag, Send } from 'lucide-react';
import { Note, Reply } from '@/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { submitReply, createNote } from '@/app/actions';
import { ScrollArea } from './ui/scroll-area';
import { Coordinates } from '@/hooks/use-location';
import { useFormStatus } from 'react-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { useAuth } from './auth-provider';


function SubmitButton({label, pendingLabel}: {label: string, pendingLabel: string}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {pendingLabel}
        </>
      ) : label}
    </Button>
  );
}

function CreateNoteForm({ userLocation, onClose }: { userLocation: Coordinates | null, onClose: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    
    const initialState = { message: '', errors: {}, success: false };
    const [state, formAction] = useActionState(createNote, initialState);

    useEffect(() => {
        if (state.success) {
            toast({ title: "Success!", description: state.message });
            formRef.current?.reset();
            onClose();
        } else if (state.message) {
            const description = state.errors?.server?.[0] || state.errors?.text?.[0] || 'Please check the form and try again.';
            toast({ title: state.message, description, variant: 'destructive' });
        }
    }, [state, toast, onClose]);

    if (!user) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          You must be signed in to drop a note.
        </div>
      );
    }

    return (
        <form ref={formRef} action={formAction} className="p-4 space-y-4">
            <input type="hidden" name="lat" value={userLocation?.latitude ?? 0} />
            <input type="hidden" name="lng" value={userLocation?.longitude ?? 0} />
            <input type="hidden" name="authorUid" value={user.uid} />
            <input type="hidden" name="authorDisplayName" value={user.displayName ?? ''} />
            <Textarea name="text" placeholder="What's on your mind? (Max 800 chars)" maxLength={800} rows={5} required />
            {state.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}
            {state.errors?.server && <p className="text-sm text-destructive">{state.errors.server[0]}</p>}

            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" type="button" disabled>
                    <Camera className="h-4 w-4"/>
                </Button>
                <SubmitButton label="Drop Note" pendingLabel="Dropping..." />
            </div>
            {userLocation && <p className="text-xs text-muted-foreground">Location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}</p>}
            {state.errors?.lat && <p className="text-sm text-destructive">Could not determine your location.</p>}
        </form>
    );
}


function ReplyForm({ noteId }: { noteId: string }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const initialState = { message: '', errors: {}, success: false };
    const [state, formAction] = useActionState(submitReply, initialState);

    useEffect(() => {
        if (state.message) {
            if (!state.success) {
                 toast({ title: state.message, description: state.errors?.text?.[0], variant: 'destructive' });
            } else {
                toast({ title: state.message });
                if (state.success) {
                    formRef.current?.reset();
                }
            }
        }
    }, [state, toast]);

    return (
        <form id="reply-form" ref={formRef} action={formAction} className="flex items-start gap-2">
            <input type="hidden" name="noteId" value={noteId} />
            <div className="flex-grow space-y-1">
                <Textarea 
                    name="text"
                    placeholder="Add a reply... (Max 120 chars)" 
                    maxLength={120} 
                    rows={1} 
                    required
                    className="flex-grow min-h-0"
                />
                {state.errors?.text && <p className="text-sm text-destructive mt-1">{state.errors.text[0]}</p>}
            </div>
            <Button type="submit" size="icon" className="h-full">
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
}

function NoteView({ note }: {note: Note}) {
    const [replies] = useState<Reply[]>([]); // Mock replies for now
    return (
        <ScrollArea className="h-[calc(100vh-10rem)] md:h-full">
            <div className="p-4 space-y-6">
                {note.media?.[0] && (
                    <div className="rounded-lg overflow-hidden">
                        <img src={note.media[0].path} alt="Note media" className="w-full h-auto object-cover" data-ai-hint="mural street art" />
                    </div>
                )}
                <p className="text-lg leading-relaxed">{note.text}</p>
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>{note.authorPseudonym?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span>{note.authorPseudonym}</span>
                    </div>
                    <span>{note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"><Heart className="h-4 w-4 mr-2"/> {note.score}</Button>
                    <Button variant="outline" size="sm"><Flag className="h-4 w-4 mr-2"/> Report</Button>
                    <Badge variant="secondary">{note.type}</Badge>
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="font-headline text-xl">Replies ({replies.length})</h3>
                    <ReplyForm noteId={note.id} />
                    <div className="space-y-4">
                        {replies.map(reply => (
                            <div key={reply.id} className="flex gap-3">
                                <Avatar className="h-8 h-8">
                                    <AvatarFallback>{reply.authorPseudonym?.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted p-3 rounded-lg flex-1">
                                    <p className="text-sm">{reply.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{reply.authorPseudonym} &middot; {new Date(reply.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {replies.length === 0 && <p className="text-sm text-muted-foreground text-center">Be the first to reply!</p>}
                    </div>
                </div>
            </div>
        </ScrollArea>
    )
}

interface NoteSheetContentProps {
  noteId: string | null;
  isCreating: boolean;
  userLocation: Coordinates | null;
  onNoteCreated: () => void;
  onClose: () => void;
}

export default function NoteSheetContent({ noteId, isCreating, userLocation, onNoteCreated, onClose }: NoteSheetContentProps) {
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      if (noteId && !isCreating) {
        setLoadingNote(true);
        try {
          const noteDoc = await getDoc(doc(db, 'notes', noteId));
          if (noteDoc.exists()) {
            const data = noteDoc.data();
            const createdAt = data.createdAt instanceof Timestamp ? 
                { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds } : 
                { seconds: Date.now() / 1000, nanoseconds: 0 };
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
    return <CreateNoteForm userLocation={userLocation} onClose={() => {
        onNoteCreated();
        onClose();
    }} />;
  }

  if (loadingNote) {
    return (
        <div className="p-4 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
  }

  if (!note) return <div className="p-4 text-center">Select a note to view its contents.</div>;

  return <NoteView note={note} />;
}
