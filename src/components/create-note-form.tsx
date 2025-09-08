"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { geohashForLocation } from "geofire-common";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
  type UploadTaskSnapshot,
} from "firebase/storage";
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
import { Progress } from "./ui/progress";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [text, setText] = useState("");
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const canceledByUserRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userLocation) {
      toast({ title: "Error", description: "User or location not available.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const noteText = text;

    try {
      const validation = noteSchema.safeParse({ text: noteText, image: imageFile });
      if (!validation.success) {
        toast({ title: "Invalid Input", description: validation.error.errors[0].message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const pseudonym = await getOrCreatePseudonym(user.uid);
      const geohash = geohashForLocation([userLocation.latitude, userLocation.longitude]);

      const newNote: Omit<Note, "id" | "createdAt"> & {
        createdAt: ReturnType<typeof serverTimestamp>;
      } = {
        text: noteText,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        geohash,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
        authorPseudonym: pseudonym,
        type: imageFile ? "photo" : "text",
        score: 0,
        teaser: noteText.substring(0, 30) + (noteText.length > 30 ? "..." : ""),
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
          toast({
            title: "Image too large",
            description: "Image must be less than 5MB.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        const storageRef = ref(storage, `notes/${user.uid}/${Date.now()}-${imageFile.name}`);

        const UPLOAD_TIMEOUT = 30000;
        let timedOut = false;
        setIsUploading(true);
        setUploadProgress(0);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        uploadTaskRef.current = uploadTask;
        const timeoutId = setTimeout(() => {
          timedOut = true;
          uploadTask.cancel();
        }, UPLOAD_TIMEOUT);

        try {
          const snapshot = await new Promise<UploadTaskSnapshot>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snap) => {
                setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100);
              },
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              },
              () => {
                clearTimeout(timeoutId);
                resolve(uploadTask.snapshot);
              }
            );
          });
          const downloadURL = await getDownloadURL(snapshot.ref);

          newNote.media = [
            {
              path: downloadURL,
              type: "image",
              w: imageDimensions?.w ?? 0,
              h: imageDimensions?.h ?? 0,
            },
          ];
        } catch (uploadError: any) {
          if (uploadError.code === "storage/canceled") {
            if (timedOut) {
              toast({
                title: "Image upload timed out",
                description: "Please check your network connection and try again.",
                variant: "destructive",
              });
            } else if (canceledByUserRef.current) {
              toast({
                title: "Upload canceled",
                description: "Image upload was canceled.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Image upload canceled",
                description: "Upload was canceled.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Image upload failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive",
            });
          }
          console.error("Upload failed:", uploadError);
          uploadTaskRef.current = null;
          canceledByUserRef.current = false;
          setUploadProgress(0);
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        uploadTaskRef.current = null;
        canceledByUserRef.current = false;
        setIsUploading(false);
      }

      await addDoc(collection(db, "notes"), newNote);

      toast({ title: "Success!", description: "Note dropped successfully!" });
      formRef.current?.reset();
      setText("");
      setImagePreview(null);
      setImageFile(null);
      setUploadProgress(0);
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
    if (uploadTaskRef.current) {
      canceledByUserRef.current = true;
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
      setUploadProgress(0);
      setIsUploading(false);
      setIsSubmitting(false);
    }
    setImagePreview(null);
    setImageFile(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelUpload = () => {
    if (uploadTaskRef.current) {
      canceledByUserRef.current = true;
      uploadTaskRef.current.cancel();
    }
  };

  // Cancel any ongoing upload if the component unmounts
  useEffect(() => {
    return () => {
      if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel();
      }
    };
  }, []);

  if (!user) {
    return (
      <>
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Sign In Required</SheetTitle>
        </SheetHeader>
        <div className="p-4 text-center text-muted-foreground">
          You must be signed in to drop a note.
        </div>
      </>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline text-2xl">Drop a New Note</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1 -mx-6">
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 pt-4 space-y-4" id="create-note-form">
          <Textarea
            name="text"
            placeholder="What's on your mind? (Max 800 chars)"
            maxLength={800}
            rows={5}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{text.length}/800</p>

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
                aria-label="Remove image"
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
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </form>
      </ScrollArea>
      <SheetFooter className="pt-4">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            aria-label="Add image"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Input
            type="file"
            name="image"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/png, image/jpeg, image/gif"
            disabled={isSubmitting}
          />
          {isUploading ? (
            <Button variant="destructive" type="button" onClick={handleCancelUpload}>
              Cancel
            </Button>
          ) : (
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
          )}
        </div>
      </SheetFooter>
    </>
  );
}
