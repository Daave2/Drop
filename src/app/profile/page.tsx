
"use client";

import { AuthButton } from "@/components/auth-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Edit, MessageSquare, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { doc, onSnapshot, setDoc, collection, query, where, getCountFromServer, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/types";
import { useUserNotes } from "@/hooks/use-user-notes";

const profileSchema = z.object({
    displayName: z.string().min(3, "Display name must be at least 3 characters.").max(50, "Display name cannot exceed 50 characters."),
});

function UpdateProfileForm({ uid, currentDisplayName }: { uid: string, currentDisplayName: string }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(currentDisplayName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset display name when editing is cancelled or current name changes
    useEffect(() => {
        setDisplayName(currentDisplayName);
    }, [currentDisplayName]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const validation = profileSchema.safeParse({ displayName });
        if (!validation.success) {
            setError(validation.error.errors[0].message);
            toast({ title: "Invalid Name", description: validation.error.errors[0].message, variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const profileRef = doc(db, 'profiles', uid);
            // We use `uid` in the document body to satisfy security rules if needed,
            // and to keep a record of the owner.
            await setDoc(profileRef, { pseudonym: displayName, uid: uid }, { merge: true });
            toast({ title: "Success!", description: "Display name updated successfully!" });
            setIsEditing(false);
        } catch (err: any) {
            console.error("Error updating display name:", err);
            toast({ title: "Error", description: err.message || "Failed to update display name.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isEditing) {
        return (
            <Button variant="ghost" size="sm" onClick={() => {
                setIsEditing(true);
                setError(null);
             }} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Change Display Name</span>
            </Button>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <Input
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your new display name"
                required
                minLength={3}
                maxLength={50}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    )
}

function StatCard({ title, value, isLoading }: { title: string, value: number | string, isLoading: boolean }) {
    return (
        <div className="bg-muted p-4 rounded-lg">
            {isLoading ? (
                <Skeleton className="h-9 w-1/2 mx-auto" />
            ) : (
                <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    )
}

function MyNotesList({ uid }: { uid: string }) {
    const { notes, loading, hasMore, loadMore } = useUserNotes(uid);

    useEffect(() => {
        loadMore();
    }, [loadMore]);

    if (loading && notes.length === 0) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    if (!loading && notes.length === 0) {
        return <p className="text-muted-foreground text-center py-4">You haven&apos;t dropped any notes yet.</p>
    }

    return (
        <div className="space-y-3">
            {notes.map(note => (
                <div key={note.id} className="bg-muted/50 p-3 rounded-lg">
                    <p className="truncate">{note.text}</p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                        <span>{new Date(note.createdAt.seconds * 1000).toLocaleDateString()}</span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {note.score}</span>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/?lat=${note.lat}&lng=${note.lng}&zoom=18`}>
                                    <MapPin className="h-4 w-4 mr-1" /> View on Map
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {hasMore && (
                <Button onClick={loadMore} disabled={loading} className="w-full" variant="outline">
                    {loading ? 'Loading...' : 'Load more'}
                </Button>
            )}
        </div>
    )
}


export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{pseudonym?: string, createdAt?: Timestamp} | null>(null);
  const [notesDropped, setNotesDropped] = useState(0);
  const [notesRevealed, setNotesRevealed] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
      if (user) {
          const profileRef = doc(db, 'profiles', user.uid);
          const unsubscribe = onSnapshot(profileRef, (doc) => {
              if (doc.exists()) {
                  setProfileData(doc.data());
              }
          });

          const fetchStats = async () => {
            if (!user) return;
            setLoadingStats(true);
            try {
                // Fetch notes dropped
                const notesRef = collection(db, 'notes');
                const droppedQuery = query(notesRef, where("authorUid", "==", user.uid));
                const droppedSnapshot = await getCountFromServer(droppedQuery);
                setNotesDropped(droppedSnapshot.data().count);

                // Fetch notes revealed (liked)
                const likesRef = collection(db, 'likes');
                const revealedQuery = query(likesRef, where("userId", "==", user.uid));
                const revealedSnapshot = await getCountFromServer(revealedQuery);
                setNotesRevealed(revealedSnapshot.data().count);

            } catch (error: any) {
                console.error("Failed to fetch stats:", error);
                toast({
                    title: "Error fetching stats",
                    description: "Could not load your profile statistics. Please check your Firestore security rules.",
                    variant: "destructive",
                });
            } finally {
                setLoadingStats(false);
            }
          }
          fetchStats();

          return () => unsubscribe();
      }
  }, [user, toast]);
  
  const communityStanding = useMemo(() => {
    if (!user || !profileData) return 0;
    
    // Base score for being a member
    let score = 0.1;
    
    // Add points for notes dropped
    score += notesDropped * 0.05;
    
    // Add points for notes revealed
    score += notesRevealed * 0.02;

    // Add points for account age
    if (profileData.createdAt) {
        const accountAgeDays = (Date.now() - profileData.createdAt.toMillis()) / (1000 * 60 * 60 * 24);
        score += Math.min(accountAgeDays * 0.005, 0.2); // Cap tenure bonus
    }

    // Return score between 0 and 1, formatted to 2 decimal places.
    return Math.min(score, 1).toFixed(2);
  }, [user, profileData, notesDropped, notesRevealed]);


  const displayName = profileData?.pseudonym || user?.displayName || "Wandering Wombat";

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-headline font-bold">Profile</h1>
            <Button asChild variant="ghost">
                <Link href="/">Back to Map</Link>
            </Button>
        </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
              <AvatarFallback className="text-3xl">
                {user?.isAnonymous ? <User /> : displayName.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle className="text-3xl font-headline">
                    {user?.isAnonymous ? "Wandering Wombat" : displayName}
                </CardTitle>
                <CardDescription>
                    {user?.isAnonymous ? "Anonymous User" : user?.email}
                </CardDescription>
            </div>
            <AuthButton />
        </CardHeader>
        <CardContent>
            {user && !user.isAnonymous && (
                <>
                    <Separator className="my-4"/>
                    <UpdateProfileForm uid={user.uid} currentDisplayName={displayName} />
                </>
            )}
            <Separator className="my-4"/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <StatCard title="Notes Dropped" value={notesDropped} isLoading={loadingStats} />
                <StatCard title="Notes Revealed" value={notesRevealed} isLoading={loadingStats} />
                <StatCard title="Community Standing" value={communityStanding} isLoading={loadingStats} />
            </div>
        </CardContent>
      </Card>

        {user && (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>My Notes</CardTitle>
                    <CardDescription>A list of all the notes you have dropped.</CardDescription>
                </CardHeader>
                <CardContent>
                    <MyNotesList uid={user.uid} />
                </CardContent>
            </Card>
        )}
    </div>
  );
}
