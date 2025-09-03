"use client";

import React, { useEffect, useRef } from "react";
import { GhostNote } from "@/types";

interface ARViewProps {
  notes: GhostNote[];
}

export default function ARView({ notes }: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera", err);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex">
      <video ref={videoRef} className="object-cover w-full h-full" autoPlay playsInline muted />
      <div className="absolute top-0 left-0 right-0 h-2/3 p-4 space-y-2 pointer-events-none">
        {notes.map((note) => (
          <div key={note.id} className="bg-background/80 text-foreground p-2 rounded">
            {note.teaser || "Note"}
          </div>
        ))}
      </div>
    </div>
  );
}

