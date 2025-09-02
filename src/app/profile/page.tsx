"use client";

import { AuthButton } from "@/components/auth-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Edit } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { z } from "zod";

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


export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<{pseudonym?: string} | null>(null);

  useEffect(() => {
      if (user) {
          const profileRef = doc(db, 'profiles', user.uid);
          const unsubscribe = onSnapshot(profileRef, (doc) => {
              if (doc.exists()) {
                  setProfileData(doc.data());
              }
          });
          return () => unsubscribe();
      }
  }, [user]);

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
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Notes Dropped</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-muted-foreground">Notes Revealed</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">0.75</p>
                    <p className="text-sm text-muted-foreground">Trust Score</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
