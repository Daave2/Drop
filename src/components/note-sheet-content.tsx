
"use client";

import { useEffect, useState, useRef } from 'react';
import { Camera, Heart, Flag, Send, X } from 'lucide-react';
import { Note, Reply } from '@/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Coordinates } from '@/hooks/use-location';
import { doc, getDoc, Timestamp, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Skeleton } from './ui/skeleton';
import { useAuth } from './auth-provider';
import { z } from 'zod';
import { moderateContent } from '@/ai/flows/content-moderation';
import { Input } from './ui/input';
import Image from 'next/image';
import { toggleLikeNote } from '@/app/actions';
import { cn } from '@/lib/utils';


async function getOrCreateClientSidePseudonym(uid: string): Promise<string> {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists() && profileSnap.data().pseudonym) {
        return profileSnap.data().pseudonym;
    }

    const adjectives = ["Whispering", "Wandering", "Silent", "Hidden", "Forgotten", "Lost", "Secret", "Phantom"];
    const nouns = ["Wombat", "Voyager", "Pilgrim", "Ghost", "Scribe", "Oracle", "Nomad", "Dreamer"];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const newPseudonym = `${randomAdjective} ${randomNoun}`;
    
    await setDoc(profileRef, { pseudonym: newPseudonym, uid, createdAt: serverTimestamp() }, { merge: true });

    return newPseudonym;
}


function SubmitButton({label, pendingLabel, isSubmitting}: {label: string, pendingLabel: string, isSubmitting: boolean}) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {pendingLabel}
        </>
      ) : label}
    </Button>
  );
}

const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty.").max(800, "Note cannot exceed 800 characters."),
  image: z.instanceof(File).optional(),
});


function CreateNoteForm({ userLocation, onClose }: { userLocation: Coordinates | null, onClose: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !userLocation) {
            toast({ title: "Error", description: "User or location not available.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const text = formData.get('text') as string;

        try {
            // 1. Validate content
            const validation = noteSchema.safeParse({ text, image: imageFile });
            if (!validation.success) {
                toast({ title: "Invalid Input", description: validation.error.errors[0].message, variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            // 2. Moderate content
            const moderationResult = await moderateContent({ text });
            if (!moderationResult.isSafe) {
                toast({ title: "Inappropriate Content", description: moderationResult.reason || "This note violates our content policy.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            // 3. Get user pseudonym
            const pseudonym = await getOrCreateClientSidePseudonym(user.uid);
            
            // 4. Prepare base note data
             const newNote: Omit<Note, 'id' | 'createdAt'> & { createdAt: any } = {
              text,
              lat: userLocation.latitude,
              lng: userLocation.longitude,
              authorUid: user.uid,
              createdAt: serverTimestamp(),
              authorPseudonym: pseudonym,
              type: imageFile ? 'photo' : 'text',
              score: 0,
              teaser: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
              visibility: 'public',
              trust: 0.5,
              placeMaskMeters: 10,
              revealMode: 'proximity+sightline',
              revealRadiusM: 35,
              revealAngleDeg: 20,
              peekable: false,
              dmAllowed: false,
              media: [],
            };

            // 5. Handle image upload if present
            if (imageFile) {
                if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                    toast({ title: "Image too large", description: "Image must be less than 5MB.", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                const storageRef = ref(storage, `notes/${user.uid}/${Date.now()}-${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                const downloadURL = await getDownloadURL(snapshot.ref);

                // This is a placeholder for actual image dimension detection
                const imageDimensions = { w: 600, h: 400 };

                newNote.media = [{
                    path: downloadURL,
                    type: 'image',
                    w: imageDimensions.w,
                    h: imageDimensions.h,
                }];
            }

            // 6. Save note to Firestore
            await addDoc(collection(db, 'notes'), newNote);
            
            toast({ title: "Success!", description: "Note dropped successfully!" });
            formRef.current?.reset();
            setImagePreview(null);
            setImageFile(null);
            onClose();

        } catch (error: any) {
            console.error("Error creating note:", error);
            toast({ title: "Error creating note", description: error.message || "An unknown error occurred.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
            setImageFile(null);
        }
    };
    
    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    if (!user) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          You must be signed in to drop a note.
        </div>
      );
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
            <Textarea name="text" placeholder="What's on your mind? (Max 800 chars)" maxLength={800} rows={5} required />
            
            {imagePreview && (
                <div className="relative">
                    <Image width={400} height={300} src={imagePreview} alt="Image preview" className="rounded-md w-full object-cover aspect-video" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleRemoveImage}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex items-center justify-between">
                 <Button variant="outline" size="icon" type="button" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4"/>
                </Button>
                <Input
                    type="file"
                    name="image"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/gif"
                />
                <SubmitButton label="Drop Note" pendingLabel="Dropping..." isSubmitting={isSubmitting} />
            </div>
            {userLocation && <p className="text-xs text-muted-foreground">Location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}</p>}
        </form>
    );
}

const replySchema = z.object({
  text: z.string().min(1, "Reply cannot be empty.").max(120, "Reply cannot exceed 120 characters."),
});

function ReplyForm({ noteId }: { noteId: string }) {
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
            const moderationResult = await moderateContent({ text });
            if (!moderationResult.isSafe) {
                toast({
                    title: "Inappropriate Content",
                    description: moderationResult.reason || "This reply violates our content policy. Please revise.",
                    variant: "destructive"
                });
                setError(moderationResult.reason || "This reply violates our content policy.");
                setIsSubmitting(false);
                return;
            }

            const pseudonym = await getOrCreateClientSidePseudonym(user.uid);
            const replyRef = collection(db, 'notes', noteId, 'replies');
            
            await addDoc(replyRef, {
                text,
                noteId,
                authorUid: user.uid,
                authorPseudonym: pseudonym,
                createdAt: serverTimestamp(),
            });

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
        return <p className="text-sm text-center text-muted-foreground py-4">Please sign in to reply.</p>
    }

    return (
        <form id="reply-form" onSubmit={handleSubmit} className="flex items-start gap-2 p-4">
            <div className="flex-grow space-y-1">
                <Textarea 
                    name="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add a reply... (Max 120 chars)" 
                    maxLength={120} 
                    rows={1} 
                    required
                    className="flex-grow min-h-0"
                />
                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <Button type="submit" size="icon" className="h-full" disabled={isSubmitting}>
                 {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <Send className="h-4 w-4" />}
            </Button>
        </form>
    );
}

function NoteView({ note: initialNote }: {note: Note}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [note, setNote] = useState<Note>(initialNote);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(true);

    useEffect(() => {
        const noteRef = doc(db, 'notes', initialNote.id);
        const unsubscribeNote = onSnapshot(noteRef, (doc) => {
            if (doc.exists()) {
                 const data = doc.data();
                 const createdAt = data.createdAt instanceof Timestamp ? 
                    { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds } : 
                    { seconds: Date.now() / 1000, nanoseconds: 0 };
                setNote({ id: doc.id, ...data, createdAt } as Note);
            }
        });
        
        return () => unsubscribeNote();
    }, [initialNote.id]);
    
    useEffect(() => {
        if (!user) return;
        const likeRef = doc(db, 'notes', initialNote.id, 'likes', user.uid);
        const unsubscribeLike = onSnapshot(likeRef, (doc) => {
            setIsLiked(doc.exists());
        });
        return () => unsubscribeLike();
    }, [initialNote.id, user]);

    useEffect(() => {
        const repliesRef = collection(db, 'notes', initialNote.id, 'replies');
        const q = query(repliesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const repliesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt instanceof Timestamp ? 
                    { seconds: data.createdAt.seconds, nanoseconds: data.createdAt.nanoseconds } : 
                    { seconds: Date.now() / 1000, nanoseconds: 0 };
                return { id: doc.id, ...data, createdAt } as Reply;
            });
            setReplies(repliesData);
            setLoadingReplies(false);
        }, (error) => {
            console.error("Error fetching replies:", error);
            setLoadingReplies(false);
        });

        return () => unsubscribe();
    }, [initialNote.id]);

    const handleLikeToggle = async () => {
        if (!user) {
            toast({ title: "Please sign in to like notes.", variant: "destructive"});
            return;
        }
        setIsLiking(true);
        const result = await toggleLikeNote(note.id, user.uid);
        if (!result.success) {
            toast({ title: "Error", description: result.error || "Failed to update like status.", variant: "destructive" });
        }
        setIsLiking(false);
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {note.media?.[0]?.path && (
                        <div className="rounded-lg overflow-hidden aspect-video relative bg-muted">
                            <Image src={note.media[0].path} alt="Note media" layout="fill" className="object-cover" data-ai-hint="mural street art" />
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
                        <Button variant="outline" size="sm" onClick={handleLikeToggle} disabled={isLiking}>
                            <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-destructive text-destructive")} /> 
                            {note.score}
                        </Button>
                        <Button variant="outline" size="sm"><Flag className="h-4 w-4 mr-2"/> Report</Button>
                        <Badge variant={note.type === 'photo' ? 'default' : 'secondary'}>{note.type}</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="font-headline text-xl">Replies ({replies.length})</h3>
                        <div className="space-y-4">
                            {loadingReplies && <Skeleton className="h-16 w-full" />}
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
                            {!loadingReplies && replies.length === 0 && <p className="text-sm text-muted-foreground text-center">Be the first to reply!</p>}
                        </div>
                    </div>
                </div>
            </ScrollArea>
             <Separator />
            <ReplyForm noteId={note.id} />
        </div>
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
