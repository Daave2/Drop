"use client";

import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef, ViewState } from 'react-map-gl/maplibre';
import { Plus, MapPin, Compass, LocateFixed } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';
import { Button } from '@/components/ui/button';
import { GhostNote } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import NoteSheetContent from './note-sheet-content';
import { Logo } from './ui/logo';
import { AuthButton } from './auth-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from './ui/badge';
import CompassView from './compass-view';
import { useAuth } from './auth-provider';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

const MAP_STYLE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const DEFAULT_CENTER = { latitude: 34.052235, longitude: -118.243683 };
const DEFAULT_ZOOM = 16;


export default function MapView() {
  const { location, error: locationError, permissionState, requestPermission } = useLocation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<GhostNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [selectedNote, setSelectedNote] = useState<GhostNote | null>(null);
  const [revealedNoteId, setRevealedNoteId] = useState<string | null>(null);
  const [isNoteSheetOpen, setNoteSheetOpen] = useState(false);
  const [isCreatingNote, setCreatingNote] = useState(false);
  const [isCompassViewOpen, setCompassViewOpen] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 45,
  });

  useEffect(() => {
    const q = query(collection(db, "notes"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setLoadingNotes(true);
        const notesData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Firestore Timestamps need to be handled carefully
            const createdAtTimestamp = data.createdAt as Timestamp | null;
            return {
                id: doc.id,
                lat: data.lat,
                lng: data.lng,
                teaser: data.teaser,
                type: data.type,
                score: data.score,
                // Provide a default or handle null timestamps
                createdAt: createdAtTimestamp ? { seconds: createdAtTimestamp.seconds, nanoseconds: createdAtTimestamp.nanoseconds } : { seconds: Date.now() / 1000, nanoseconds: 0 },
            } as GhostNote
        });
        setNotes(notesData);
        setLoadingNotes(false);
    }, (error) => {
        console.error("Error fetching notes: ", error);
        setLoadingNotes(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(location && mapRef.current?.getCenter().lng.toFixed(4) === DEFAULT_CENTER.longitude.toFixed(4)) {
        // Fly to user's location only once when it becomes available
        mapRef.current?.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 17,
            duration: 2000
        });
    }
  }, [location]);

  const handleMarkerClick = (note: GhostNote) => {
    if (!location) return;
    const distance = getDistance(
        location,
        { latitude: note.lat, longitude: note.lng }
    );
    setSelectedNote(note);

    if (distance <= 35 || revealedNoteId === note.id) { // Proximity check passed or already revealed
        setRevealedNoteId(note.id);
        setCreatingNote(false);
        setNoteSheetOpen(true);
    } else {
        setCompassViewOpen(true);
    }
  };

  const handleCenterMap = () => {
    if (location && mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 17,
        duration: 2000
      });
    }
  };
  
  const handleNoteCreated = () => {
    // No longer needed, onSnapshot will update the notes list
  };

  if (permissionState !== 'granted') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary/50 p-4 text-center">
        <Logo className="mb-8 text-3xl"/>
        <Compass className="w-16 h-16 text-primary mb-4"/>
        <h2 className="text-2xl font-headline font-bold mb-2">Enable Location to Explore</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">NoteDrop uses your location to show you nearby notes and allow you to reveal their content.</p>
        {permissionState === 'prompt' && <Button onClick={requestPermission}>Grant Location Access</Button>}
        {permissionState === 'denied' && <p className="text-destructive-foreground bg-destructive p-3 rounded-md">Location access was denied. Please enable it in your browser settings to use NoteDrop.</p>}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={{
            version: 8,
            sources: {
                'osm-tiles': {
                    type: 'raster',
                    tiles: [MAP_STYLE],
                    tileSize: 256,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
            },
            layers: [{
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm-tiles'
            }]
        }}
      >
        {location && (
          <Marker longitude={location.longitude} latitude={location.latitude}>
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}
        {!loadingNotes ? notes.map(note => (
            <Marker key={note.id} longitude={note.lng} latitude={note.lat} onClick={() => handleMarkerClick(note)}>
                <button className="transform hover:scale-110 transition-transform">
                    <MapPin className={`h-8 w-8 drop-shadow-lg ${note.id === revealedNoteId ? 'text-accent' : 'text-primary/70'}`} fill="currentColor" />
                </button>
            </Marker>
        )) : (
          <Marker longitude={viewState.longitude!} latitude={viewState.latitude!}>
            <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
          </Marker>
        )}

        {selectedNote && !isCompassViewOpen && !isNoteSheetOpen && (
            <Popup
                longitude={selectedNote.lng}
                latitude={selectedNote.lat}
                onClose={() => setSelectedNote(null)}
                closeButton={false}
                className="font-body"
                maxWidth="200px"
            >
                <div className="p-1">
                    <h3 className="font-bold font-headline">{selectedNote.teaser || "A mysterious note"}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(selectedNote.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    <Badge variant={selectedNote.id === revealedNoteId ? 'default' : 'secondary'} className="mt-1">{selectedNote.type}</Badge>
                </div>
            </Popup>
        )}
      </Map>

      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent">
        <Logo />
        <AuthButton />
      </header>

      <Button
        className="absolute bottom-24 right-4 rounded-full w-14 h-14 shadow-lg"
        onClick={() => {
            setCreatingNote(true);
            setSelectedNote(null);
            setNoteSheetOpen(true);
        }}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-40 right-4 rounded-full w-14 h-14 shadow-lg"
        onClick={handleCenterMap}
        disabled={!location}
      >
        <LocateFixed className="w-6 h-6" />
      </Button>

      <Sheet open={isNoteSheetOpen} onOpenChange={setNoteSheetOpen}>
        <SheetContent side="bottom" className="md:max-w-md md:right-0 md:left-auto md:top-0 md:h-full md:rounded-l-2xl">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">
              {isCreatingNote ? "Drop a New Note" : "Note Revealed!"}
            </SheetTitle>
          </SheetHeader>
          <NoteSheetContent
            noteId={selectedNote?.id ?? null} 
            isCreating={isCreatingNote} 
            userLocation={location}
            onNoteCreated={handleNoteCreated}
            onClose={() => setNoteSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={isCompassViewOpen} onOpenChange={setCompassViewOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Get Closer to Reveal</DialogTitle>
                <DialogDescription>
                    You need to be within 35 meters and align your view to unlock this note.
                </DialogDescription>
            </DialogHeader>
            {selectedNote && <CompassView
                userLocation={location}
                targetLocation={{latitude: selectedNote.lat, longitude: selectedNote.lng}}
                onAlignedAndClose={() => {
                    setCompassViewOpen(false);
                    setRevealedNoteId(selectedNote.id);
                    setCreatingNote(false);
                    setNoteSheetOpen(true);
                }}
            />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Haversine distance function
function getDistance(coords1: {latitude: number, longitude: number}, coords2: {latitude: number, longitude: number}) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // metres
  
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c;
  }