
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef, ViewState, MapStyle } from 'react-map-gl/maplibre';
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
} from '@/components/ui/dialog';
import { Badge } from './ui/badge';
import CompassView from './compass-view';
import { useAuth } from './auth-provider';
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
  Timestamp,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";


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
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 45,
  });

  // Haversine distance function
  const getDistance = (coords1: {latitude: number, longitude: number}, coords2: {latitude: number, longitude: number}) => {
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

  const fetchNotesForView = useCallback((center: [number, number]) => {
    if (!db) return;
    setLoadingNotes(true);
    console.log("Fetching notes for center:", center);

    const radiusInM = 5000; // 5km search radius
    const bounds = geohashQueryBounds(center, radiusInM);
    const MAX_NOTES = 50;

    const promises = bounds.map((b: [string, string]) =>
      getDocs(
        query(
          collection(db, "notes"),
          orderBy("geohash"),
          startAt(b[0]),
          endAt(b[1]),
          limit(MAX_NOTES)
        )
      )
    );

    Promise.all(promises)
      .then((snapshots: QuerySnapshot<DocumentData>[]) => {
        const notesData: GhostNote[] = [];
        const seen = new Set<string>();

        snapshots.forEach((snap: QuerySnapshot<DocumentData>) => {
          snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            if (seen.has(doc.id)) return;
            const data = doc.data();
            const distanceInKm = distanceBetween(
              [data.lat, data.lng],
              center
            );
            if (distanceInKm * 1000 <= radiusInM) {
              seen.add(doc.id);
              const createdAtTimestamp = data.createdAt as Timestamp | null;
              notesData.push({
                id: doc.id,
                lat: data.lat,
                lng: data.lng,
                teaser: data.teaser,
                type: data.type,
                score: data.score,
                createdAt: createdAtTimestamp
                  ? { seconds: createdAtTimestamp.seconds, nanoseconds: createdAtTimestamp.nanoseconds }
                  : { seconds: Date.now() / 1000, nanoseconds: 0 },
              });
            }
          });
        });

        console.log(`Fetched ${notesData.length} notes.`);
        setNotes(notesData.slice(0, MAX_NOTES));
      })
      .catch((error) => {
        console.error("Error fetching notes: ", error);
      }).finally(() => {
        setLoadingNotes(false);
      });
  }, []);

  // Effect to fetch notes when the map view changes
  useEffect(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      if (viewState.latitude && viewState.longitude) {
        fetchNotesForView([viewState.latitude, viewState.longitude]);
      }
    }, 500); // Debounce for 500ms
  
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, [viewState.latitude, viewState.longitude, fetchNotesForView]);
  

  // Effect to center map on user location when it becomes available for the first time
  useEffect(() => {
    if (location && mapRef.current) {
      // Check if the map is still at the default location
      if (
        viewState.longitude === DEFAULT_CENTER.longitude &&
        viewState.latitude === DEFAULT_CENTER.latitude
      ) {
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 17,
          duration: 2000,
        });
      }
    }
  }, [location, viewState.longitude, viewState.latitude]);


  const handleMarkerClick = (note: GhostNote) => {
    if (!location) {
        // If location is not available, just show the note sheet.
        // This can happen if user denies permission.
        setSelectedNote(note);
        setRevealedNoteId(note.id);
        setCreatingNote(false);
        setNoteSheetOpen(true);
        return;
    };
    
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
    if (viewState.latitude && viewState.longitude) {
      fetchNotesForView([viewState.latitude, viewState.longitude]);
    }
  };

  if (permissionState !== 'granted' && permissionState !== 'prompt') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-secondary/50 p-4 text-center">
        <Logo className="mb-8 text-3xl"/>
        <Compass className="w-16 h-16 text-primary mb-4"/>
        <h2 className="text-2xl font-headline font-bold mb-2">Enable Location to Explore</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">NoteDrop uses your location to show you nearby notes and allow you to reveal their content.</p>
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
        mapStyle={MAP_STYLE as MapStyle}
      >
        {location && (
          <Marker longitude={location.longitude} latitude={location.latitude}>
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}
        {notes.map(note => (
            <Marker key={note.id} longitude={note.lng} latitude={note.lat} onClick={() => handleMarkerClick(note)}>
                <button className="transform hover:scale-110 transition-transform">
                    <MapPin className={`h-8 w-8 drop-shadow-lg ${note.id === revealedNoteId ? 'text-accent' : 'text-primary/70'}`} fill="currentColor" />
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
                    <Badge variant={selectedNote.id === revealedNoteId ? 'default' : 'secondary'} className="mt-1">{selectedNote.type}</Badge>
                </div>
            </Popup>
        )}
      </Map>

      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent">
        <Logo />
        <div className="flex items-center gap-2">
            {permissionState === 'prompt' && <Button onClick={requestPermission} size="sm" variant="secondary">Enable Location</Button>}
            <AuthButton />
        </div>
      </header>

      <Button
        className="absolute right-4 rounded-full w-12 h-12 shadow-lg bottom-20 sm:bottom-24 sm:w-14 sm:h-14"
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
        className="absolute right-4 rounded-full w-12 h-12 shadow-lg bottom-36 sm:bottom-40 sm:w-14 sm:h-14"
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
            onNoteCreated={() => {
              handleNoteCreated();
              setNoteSheetOpen(false);
            }}
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
                targetLocation={{latitude: selectedNote.lat, longitude: selectedNote.lng, accuracy: 0}}
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
