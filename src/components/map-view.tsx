
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef, ViewState } from 'react-map-gl/maplibre';
import { Plus, Compass, LocateFixed, CircleHelp } from 'lucide-react';
import { useLocation, Coordinates } from '@/hooks/use-location';
import { useNotes } from '@/hooks/use-notes';
import { useToast } from '@/hooks/use-toast';
import { useProximityNotifications } from '@/hooks/use-proximity-notifications';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { GhostNote } from '@/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
import { distanceBetween } from 'geofire-common';
import { useSearchParams } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { NotificationsButton } from './notifications-button';
import OnboardingOverlay, { type OnboardingOverlayHandle } from './onboarding-overlay';
import { MapSkeleton } from './map-skeleton';
import { NdIcon } from './ui/nd-icon';

const DEFAULT_CENTER = { latitude: 34.052235, longitude: -118.243683 };
const DEFAULT_ZOOM = 16;
const BASE_REVEAL_RADIUS_M = 35;
const HOT_POST_THRESHOLD = 50;

function MapViewContent() {
  const { location, permissionState, requestPermission: requestLocationPermission } = useLocation();
  const { notes, fetchNotes, loading, error } = useNotes();
  const { proximityRadiusM } = useSettings();
  const { toast } = useToast();
  useProximityNotifications(notes, location, proximityRadiusM);
  const [selectedNote, setSelectedNote] = useState<GhostNote | null>(null);
  const [revealedNoteId, setRevealedNoteId] = useState<string | null>(null);
  const [isNoteSheetOpen, setNoteSheetOpen] = useState(false);
  const [isCreatingNote, setCreatingNote] = useState(false);
  const [newNoteLocation, setNewNoteLocation] = useState<Coordinates | null>(null);
  const [isCompassViewOpen, setCompassViewOpen] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const onboardingRef = useRef<OnboardingOverlayHandle>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchCenterRef = useRef<[number, number] | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to fetch notes',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 45,
    bearing: -17.6,
  });
  
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');
    if (lat && lng && mapRef.current) {
        mapRef.current.flyTo({
            center: [parseFloat(lng), parseFloat(lat)],
            zoom: zoom ? parseInt(zoom) : 17,
            duration: 2000,
        });
    }
  }, [searchParams]);

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

  const getNoteDynamicProps = (score: number) => {
    const size = Math.round(8 + Math.log(score + 1) * 2);
    const revealRadius = Math.min(BASE_REVEAL_RADIUS_M + Math.log(score + 1) * 50, 500);

    return {
        sizeClass: `h-${size} w-${size}`,
        revealRadius,
    };
  };


  useEffect(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      if (viewState.latitude && viewState.longitude) {
        const newCenter: [number, number] = [viewState.latitude, viewState.longitude];
        const prevCenter = lastFetchCenterRef.current;
        const movedMeters =
          prevCenter ? distanceBetween(prevCenter, newCenter) * 1000 : Infinity;
        if (movedMeters >= 50) {
          lastFetchCenterRef.current = newCenter;
          const now = Date.now();
          const elapsed = now - lastFetchTimeRef.current;
          if (elapsed > 5000) {
            lastFetchTimeRef.current = now;
            fetchNotes(newCenter);
          } else {
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              lastFetchTimeRef.current = Date.now();
              if (lastFetchCenterRef.current) {
                fetchNotes(lastFetchCenterRef.current);
              }
            }, 5000 - elapsed);
          }
        }
      }
    }, 500);

    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [viewState.latitude, viewState.longitude, fetchNotes]);
  

  useEffect(() => {
    if (location && mapRef.current) {
      if (
        !searchParams.get('lat') &&
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
  }, [location, viewState.longitude, viewState.latitude, searchParams]);

  const handleMarkerClick = (note: GhostNote) => {
    if (!location) {
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

    const { revealRadius } = getNoteDynamicProps(note.score);

    if (distance <= revealRadius || revealedNoteId === note.id) {
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
      fetchNotes([viewState.latitude, viewState.longitude]);
    }
    setNoteSheetOpen(false);
    setNewNoteLocation(null);
  };

  const handleCloseSheet = useCallback(() => {
    setNoteSheetOpen(false);
    setNewNoteLocation(null);
  }, []);

  const mapStyleUrl = theme === 'dark' 
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

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
        mapStyle={mapStyleUrl}
        antialias={true}
      >
        {location && (
          <Marker longitude={location.longitude} latitude={location.latitude}>
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}
        {notes.map(note => {
            const { sizeClass } = getNoteDynamicProps(note.score);
            const isHot = note.score >= HOT_POST_THRESHOLD;
            return (
                <Marker key={note.id} longitude={note.lng} latitude={note.lat} onClick={() => handleMarkerClick(note)}>
                    <button className="transform hover:scale-110 transition-transform relative">
                        <NdIcon
                            name={note.id === revealedNoteId ? 'pin-selected' : 'pin-default'}
                            className={cn('drop-shadow-lg',
                                sizeClass,
                                isHot && 'animate-flame-flicker'
                            )}
                        />
                    </button>
                </Marker>
            );
        })}

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

      <OnboardingOverlay ref={onboardingRef} />

      {loading && (
        <div data-testid="map-loading" className="absolute inset-0 z-20">
          <MapSkeleton />
        </div>
      )}

      {!loading && notes.length === 0 && (
        <div
          data-testid="no-notes"
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <p className="rounded-md bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            No notes nearby yet
          </p>
        </div>
      )}

      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent">
        <Logo />
        <div className="flex items-center gap-2 bg-background/80 p-1 rounded-full">
          {permissionState === 'prompt' && (
            <Button onClick={requestLocationPermission} size="sm" variant="secondary">
              Enable Location
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('onboardingSeen', 'false');
              }
              onboardingRef.current?.show();
            }}
          >
            <CircleHelp className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>
          <ThemeToggle />
          <NotificationsButton />
          <AuthButton />
        </div>
      </header>

      <Button
        className="absolute right-4 rounded-full w-12 h-12 shadow-lg bottom-20 sm:bottom-24 sm:w-14 sm:h-14"
        onClick={() => {
            setCreatingNote(true);
            setSelectedNote(null);
            setNewNoteLocation(location);
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
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto md:max-h-none md:right-0 md:left-auto md:top-0 md:h-full md:rounded-l-2xl md:max-w-md lg:max-w-lg xl:max-w-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <NoteSheetContent
            noteId={selectedNote?.id ?? null}
            isCreating={isCreatingNote}
            userLocation={isCreatingNote ? newNoteLocation : null}
            onNoteCreated={handleNoteCreated}
            onClose={handleCloseSheet}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={isCompassViewOpen} onOpenChange={setCompassViewOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Get Closer to Reveal</DialogTitle>
                <DialogDescription>
                    You need to be within {selectedNote && getNoteDynamicProps(selectedNote.score).revealRadius.toFixed(0)} meters and align your view to unlock this note.
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
                revealRadius={getNoteDynamicProps(selectedNote.score).revealRadius}
            />}
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function MapView() {
    return (
        <React.Suspense fallback={<MapSkeleton className="h-screen w-screen" />}>
            <MapViewContent />
        </React.Suspense>
    )
}
