"use client";

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Camera, Heart, Flag, Send, CornerUpLeft } from 'lucide-react';
import { Note, Reply } from '@/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { submitReply } from '@/app/actions';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Coordinates } from '@/hooks/use-location';

// Mock data
const mockNote: Note = {
  id: '2',
  lat: 34.053,
  lng: -118.244,
  score: 12,
  teaser: 'Cool Mural',
  type: 'photo',
  text: 'Found this amazing mural in an alley. The colors are so vibrant! A true hidden gem of the city. Worth the detour.',
  authorPseudonym: 'ArtsyAlpaca',
  createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 },
  geohash: '',
  visibility: 'public',
  trust: 0.8,
  placeMaskMeters: 5,
  revealMode: 'proximity+sightline',
  revealRadiusM: 35,
  revealAngleDeg: 20,
  peekable: false,
  dmAllowed: false,
  media: [{ path: `https://picsum.photos/600/800`, w: 600, h: 800, type: 'image' }]
};
const mockReplies: Reply[] = [
    {id: 'r1', noteId: '2', text: 'Wow, I walk past here all the time and never noticed!', authorPseudonym: 'SpeedySparrow', createdAt: {seconds: Date.now()/1000 - 3600, nanoseconds: 0}},
    {id: 'r2', noteId: '2', text: 'Thanks for sharing!', authorPseudonym: 'CuriousCapybara', createdAt: {seconds: Date.now()/1000 - 1800, nanoseconds: 0}},
];


interface NoteSheetContentProps {
  noteId: string | null;
  isCreating: boolean;
  userLocation: Coordinates | null;
}

export default function NoteSheetContent({ noteId, isCreating, userLocation }: NoteSheetContentProps) {
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  
  const [formState, formAction] = useFormState(submitReply, { message: '', errors: {} });
  const { pending } = useFormStatus();

  useEffect(() => {
    if (noteId && !isCreating) {
      // In a real app, fetch note details and replies here
      setNote(mockNote);
      setReplies(mockReplies);
    }
  }, [noteId, isCreating]);

  useEffect(() => {
    if(formState.message && !formState.errors?.text) {
        toast({ title: formState.message });
        if(formState.reset){
            const form = document.getElementById('reply-form') as HTMLFormElement;
            form?.reset();
        }
    }
  }, [formState, toast]);

  if (isCreating) {
    return (
      <div className="p-4 space-y-6">
        <form className="space-y-4">
            <Textarea placeholder="What's on your mind? (Max 800 chars)" maxLength={800} rows={5} />
            <div className="flex items-center justify-between">
                <Button variant="outline" size="icon">
                    <Camera className="h-4 w-4"/>
                </Button>
                <Button>Drop Note</Button>
            </div>
            <p className="text-xs text-muted-foreground">Location: {userLocation?.latitude.toFixed(5)}, {userLocation?.longitude.toFixed(5)}</p>
        </form>
      </div>
    );
  }

  if (!note) return <div className="p-4 text-center">Loading note...</div>;

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
            <span>{new Date(note.createdAt.seconds * 1000).toLocaleDateString()}</span>
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
            
            <form id="reply-form" action={formAction} className="flex items-start gap-2">
                <input type="hidden" name="noteId" value={note.id} />
                <Textarea 
                    name="text"
                    placeholder="Add a reply... (Max 120 chars)" 
                    maxLength={120} 
                    rows={1} 
                    className="flex-grow min-h-0"
                />
                <Button type="submit" size="icon" aria-label="Send Reply" disabled={pending}>
                    {pending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send className="h-4 w-4" />}
                </Button>
            </form>
            {formState.errors?.text && <p className="text-sm text-destructive">{formState.errors.text[0]}</p>}

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
