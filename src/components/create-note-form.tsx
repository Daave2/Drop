"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { geohashForLocation } from "geofire-common";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

import { Coordinates } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";
import { getOrCreatePseudonym } from "@/lib/pseudonym";
import { db, storage } from "@/lib/firebase";
import { Note } from "@/types";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { useAuth } from "./auth-provider";

const noteSchema = z.object({
  text: z
    .string()
    .min(1, "Note cannot be empty.")
    .max(800, "Note cannot exceed 800 characters."),
  image: z.instanceof(File).nullish(),
});

export default function CreateNoteForm({
  userLocation,
  onNoteCreated,
  onClose,
}: {
  userLocation: Coordinates | null;
  onNoteCreated: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userLocation) {
      toast({ title: "Error", description: "User or location not available.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;

    try {
      const validation = noteSchema.safeParse({ text, image: imageFile });
      if (!validation.success) {
        toast({ title: "Invalid Input", description: validation.error.errors[0].message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const pseudonym = await getOrCreatePseudonym(user.uid);
      const geohash = geohashForLocation([userLocation.latitude, userLocation.longitude]);

      const newNote: Omit<Note, "id" | "createdAt"> & { createdAt: any } = {
        text,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        geohash,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        authorPseudonym: pseudonym,
        type: imageFile ? "photo" : "text",
        score: 0,
        teaser: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
        visibility: "public",
        trust: 0.5,
        placeMaskMeters: 10,
        revealMode: "proximity+sightline",
        revealRadiusM: 35,
        revealAngleDeg: 20,
        peekable: false,
        dmAllowed: false,
        media: [],
      };

      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          toast({ title: "Image too large", description: "Image must be less than 5MB.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        const storageRef = ref(storage, `notes/${user.uid}/${Date.now()}-${imageFile.name}`);

        const UPLOAD_TIMEOUT = 30000;
        const uploadPromise = uploadBytes(storageRef, imageFile);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Upload timeout")), UPLOAD_TIMEOUT)
        );

        try {
          const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
          const downloadURL = await getDownloadURL((snapshot as any).ref);

          newNote.media = [
            {
              path: downloadURL,
              type: "image",
              w: imageDimensions?.w ?? 0,
              h: imageDimensions?.h ?? 0,
            },
          ];
        } catch (uploadError: any) {
          if (uploadError.message === "Upload timeout") {
            toast({
              title: "Image upload timed out",
              description: "Please check your network connection and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Image upload failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive",
            });
          }
          console.error("Upload failed:", uploadError);
          setIsSubmitting(false);
          return;
        }
      }

      await addDoc(collection(db, "notes"), newNote);

      toast({ title: "Success!", description: "Note dropped successfully!" });
      formRef.current?.reset();
      setImagePreview(null);
      setImageFile(null);
      onNoteCreated();
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({
        title: "Error creating note",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setImageFile(null);
      setImageDimensions(null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        You must be signed in to drop a note.
      </div>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline text-2xl">Drop a New Note</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 -mx-6">
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 pt-4 space-y-4">
          <Textarea name="text" placeholder="What's on your mind? (Max 800 chars)" maxLength={800} rows={5} required />

          {imagePreview && (
            <div className="relative">
              <Image
                width={400}
                height={300}
                src={imagePreview}
                alt="Image preview"
                className="rounded-md w-full object-cover aspect-video"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {userLocation && (
            <p className="text-xs text-muted-foreground">
              Location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
            </p>
          )}
        </form>
      </ScrollArea>
      <SheetFooter className="pt-4">
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="icon" type="button" onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-4 w-4" />
          </Button>
          <Input
            type="file"
            name="image"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/png, image/jpeg, image/gif"
          />
          <Button form="create-note-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Dropping...
              </>
            ) : (
              "Drop Note"
            )}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

