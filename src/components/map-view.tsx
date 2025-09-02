"use client";

import { useState, useMemo, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
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

const MAP_STYLE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Mock data for initial notes
const initialNotes: GhostNote[] = [
  { id: '1', lat: 34.052235, lng: -118.243683, score: 5, teaser: 'Secret Garden', type: 'tip', createdAt: {seconds: Date.now()/1000 - 3600, nanoseconds: 0}},
  { id: '2', lat: 34.053, lng: -118.244, score: 12, teaser: 'Cool Mural', type: 'photo', createdAt: {seconds: Date.now()/1000 - 86400, nanoseconds: 0} },
  { id: '3', lat: 34.051, lng: -118.245, score: 2, teaser: 'Hidden Gem', type: 'review', createdAt: {seconds: Date.now()/1000 - 604800, nanoseconds: 0} },
];

export default function MapView() {
  const { location, error, permissionState, requestPermission } = useLocation();
  const [notes, setNotes] = useState<GhostNote[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<GhostNote | null>(null);
  const [revealedNoteId, setRevealedNoteId] = useState<string | null>(null);
  const [isNoteSheetOpen, setNoteSheetOpen] = useState(false);
  const [isCreatingNote, setCreatingNote] = useState(false);
  const [isCompassViewOpen, setCompassViewOpen] = useState(false);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);

  const initialViewState = useMemo(() => ({
    longitude: location?.longitude || -118.243683,
    latitude: location?.latitude || 34.052235,
    zoom: 16,
    pitch: 45,
  }), [location]);

  useEffect(() => {
    if(location && mapRef) {
        // Fetch nearby notes when location changes
        // console.log("Fetching notes near:", location);
    }
  }, [location, mapRef]);

  const handleMarkerClick = (note: GhostNote) => {
    const distance = getDistance(
        { latitude: location?.latitude ?? 0, longitude: location?.longitude ?? 0 },
        { latitude: note.lat, longitude: note.lng }
    );
    setSelectedNote(note);

    if (distance <= 35) { // Proximity check passed
        setRevealedNoteId(note.id);
        setCreatingNote(false);
        setNoteSheetOpen(true);
    } else {
        setCompassViewOpen(true);
    }
  };

  const handleCenterMap = () => {
    if (location && mapRef) {
      mapRef.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 17,
        duration: 2000
      });
    }
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
        ref={setMapRef}
        initialViewState={initialViewState}
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
        {notes.map(note => (
            <Marker key={note.id} longitude={note.lng} latitude={note.lat} onClick={() => handleMarkerClick(note)}>
                <button className="transform hover:scale-110 transition-transform">
                    <MapPin className={`h-8 w-8 drop-shadow-lg ${note.type === 'tip' ? 'text-accent' : 'text-primary/70'}`} fill="currentColor" />
                </button>
            </Marker>
        ))}

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
                    <Badge variant={selectedNote.type === 'tip' ? 'destructive' : 'secondary'} className="mt-1">{selectedNote.type}</Badge>
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
          <NoteSheetContent noteId={revealedNoteId} isCreating={isCreatingNote} userLocation={location} />
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
