"use client";

import React, { useEffect, useRef } from "react";
import { GhostNote } from "@/types";
import { useLocation } from "@/hooks/use-location";
import { useOrientation } from "@/hooks/use-orientation";
import { Button } from "./ui/button";

interface ARViewProps {
  notes: GhostNote[];
}

export default function ARView({ notes }: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { location } = useLocation();
  const { orientation, permissionGranted, requestPermission } =
    useOrientation();

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
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

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const heading = orientation.alpha;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;

  const getBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  return (
    <div className="absolute inset-0 z-50">
      <video
        ref={videoRef}
        className="object-cover w-full h-full"
        autoPlay
        playsInline
        muted
      />
      {permissionGranted && heading !== null && location && (
        <div className="absolute inset-0 pointer-events-none">
          {notes.map((note) => {
            const bearing = getBearing(
              location.latitude,
              location.longitude,
              note.lat,
              note.lng,
            );
            const diff = ((bearing - heading + 540) % 360) - 180;
            const fov = 60;
            const left = 50 + (diff / fov) * 50;
            if (left < 0 || left > 100) return null;
            return (
              <div
                key={note.id}
                className="absolute top-10 bg-background/80 text-foreground p-2 rounded -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                {note.teaser || "Note"}
              </div>
            );
          })}
        </div>
      )}
      {!permissionGranted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Button onClick={requestPermission} className="pointer-events-auto">
            Enable Motion Sensors
          </Button>
        </div>
      )}
    </div>
  );
}
