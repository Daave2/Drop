"use client";

import { useEffect, useState, useActionState, useRef } from 'react';
import { Camera, Heart, Flag, Send } from 'lucide-react';
import { Note, Reply, GhostNote } from '@/types';
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';


// Mock data
const mockReplies: Reply[] = [
    {id: 'r1', noteId: '2', text: 'Wow, I walk past here all the time and never noticed!', authorPseudonym: 'SpeedySparrow', createdAt: {seconds: Date.now()/1000 - 3600, nanoseconds: 0}},
    {id: 'r2', noteId: '2', text: 'Thanks for sharing!', authorPseudonym: 'CuriousCapybara', createdAt: {seconds: Date.now()/1000 - 1800, nanoseconds: 0}},
];

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

interface NoteSheetContentProps {
  noteId: string | null;
  isCreating: boolean;
  userLocation: Coordinates | null;
  onNoteCreated?: (newNote: GhostNote) => void;
  onClose?: () => void;
}

export default function NoteSheetContent({ noteId, isCreating, userLocation, onNoteCreated, onClose }: NoteSheetContentProps) {
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingNote, setLoadingNote] = useState(false);
  const replyFormRef = useRef<HTMLFormElement>(null);
  const createNoteFormRef = useRef<HTMLFormElement>(null);
  
  const [replyFormState, replyFormAction] = useActionState(submitReply, { message: '', errors: {} });
  const [createNoteState, createNoteAction] = useActionState(createNote, { message: '', errors: {} });

  useEffect(() => {
    async function fetchNote() {
      if (noteId && !isCreating) {
        setLoadingNote(true);
        try {
          const noteDoc = await getDoc(doc(db, 'notes', noteId));
          if (noteDoc.exists()) {
            setNote({ id: noteDoc.id, ...noteDoc.data() } as Note);
            // In a real app, fetch replies here too
            setReplies(mockReplies);
          } else {
            console.error("No such document!");
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

  useEffect(() => {
    if(replyFormState.message && !replyFormState.errors?.text) {
        toast({ title: replyFormState.message });
        if(replyFormState.reset){
          replyFormRef.current?.reset();
        }
    }
  }, [replyFormState, toast]);

  useEffect(() => {
    if(createNoteState.message) {
      if (Object.keys(createNoteState.errors ?? {}).length > 0) {
        toast({ title: createNoteState.message, variant: 'destructive' });
      } else {
        toast({ title: createNoteState.message });
      }
      
      if(createNoteState.reset && createNoteState.note){
        onNoteCreated?.(createNoteState.note);
      }
    }
  }, [createNoteState, toast, onNoteCreated]);

  if (isCreating) {
    return (
      <div className="p-4 space-y-6">
        <form ref={createNoteFormRef} action={createNoteAction} className="space-y-4">
            <input type="hidden" name="lat" value={userLocation?.latitude ?? 0} />
            <input type="hidden" name="lng" value={userLocation?.longitude ?? 0} />
            <Textarea name="text" placeholder="What's on your mind? (Max 800 chars)" maxLength={800} rows={5} required />
            {createNoteState.errors?.text && <p className="text-sm text-destructive">{createNoteState.errors.text[0]}</p>}

            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" type="button">
                    <Camera className="h-4 w-4"/>
                </Button>
                <SubmitButton label="Drop Note" pendingLabel="Dropping..." />
            </div>
            {userLocation && <p className="text-xs text-muted-foreground">Location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}</p>}
        </form>
      </div>
    );
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

  if (!note) return <div className="p-4 text-center">Note not found.</div>;

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
            <span>{note.createdAt ? new Date((note.createdAt as any).seconds * 1000).toLocaleDateString() : 'Just now'}</span>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Heart className="h-4 w-4 mr-2"/> {note.score}</Button>
            <Button variant="outline" size="sm"><Flag className="h-4 w-4 mr-2"/> Report</Button>
            <Badge variant="secondary">{note.type}</Badge>
        </div>

        <Separator />

        {/* Replies Section */}
        <div className="space-y-4">
            <h3 className="font-headline text-xl">Replies ({replies.length})</h3>
            
            <form id="reply-form" ref={replyFormRef} action={replyFormAction} className="flex items-start gap-2">
                <input type="hidden" name="noteId" value={note.id} />
                <Textarea 
                    name="text"
                    placeholder="Add a reply... (Max 120 chars)" 
                    maxLength={120} 
                    rows={1} 
                    required
                    className="flex-grow min-h-0"
                />
                <Button type="submit" size="icon" className="h-full">
                  <Send className="h-4 w-4" />
                </Button>
            </form>
            {replyFormState.errors?.text && <p className="text-sm text-destructive">{replyFormState.errors.text[0]}</p>}

            <div className="space-y-4">
                {replies.map(reply => (
                    <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{reply.authorPseudonym?.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted p-3 rounded-lg flex-1">
                            <p className="text-sm">{reply.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{reply.authorPseudonym} &middot; {new Date(reply.createdAt.seconds * 1000).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </div>
    </ScrollArea>
  );
}
