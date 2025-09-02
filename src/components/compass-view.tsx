
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useOrientation } from '@/hooks/use-orientation';
import { Coordinates } from '@/hooks/use-location';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface CompassViewProps {
  userLocation: Coordinates | null;
  targetLocation: Coordinates;
  onAlignedAndClose: () => void;
}

const REVEAL_RADIUS_M = 35;
const REVEAL_ANGLE_DEG = 20;

export default function CompassView({ userLocation, targetLocation, onAlignedAndClose }: CompassViewProps) {
  const { orientation, permissionGranted, requestPermission } = useOrientation();
  const [alignmentProgress, setAlignmentProgress] = useState(0);

  const { distance, bearing } = useMemo(() => {
    if (!userLocation) return { distance: Infinity, bearing: 0 };

    const toRad = (x: number) => (x * Math.PI) / 180;
    const toDeg = (x: number) => (x * 180) / Math.PI;
    const R = 6371e3; // metres

    const lat1 = toRad(userLocation.latitude);
    const lat2 = toRad(targetLocation.latitude);
    const dLon = toRad(targetLocation.longitude - userLocation.longitude);

    // Distance
    const dLat = toRad(targetLocation.latitude - userLocation.latitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    // Bearing
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    
    return {
      distance: dist,
      bearing: (brng + 360) % 360,
    };
  }, [userLocation, targetLocation]);

  const isWithinRange = distance <= REVEAL_RADIUS_M;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWithinRange && orientation.alpha !== null) {
        const heading = orientation.alpha;
        const angleDifference = Math.abs(((bearing - heading + 180) % 360) - 180);
        
        if (angleDifference <= REVEAL_ANGLE_DEG) {
            timer = setInterval(() => {
                setAlignmentProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        onAlignedAndClose();
                        return 100;
                    }
                    return prev + 10; // Fills up in 2 seconds
                });
            }, 200);
        } else {
            setAlignmentProgress(0);
        }
    } else {
        setAlignmentProgress(0);
    }
    return () => {
        if (timer) clearInterval(timer);
    };
  }, [isWithinRange, orientation, bearing, onAlignedAndClose]);

  if (!permissionGranted) {
    return (
        <div className="text-center p-4">
          <h3 className="font-bold mb-2">Enable Motion Sensors</h3>
          <p className="text-muted-foreground mb-4">NoteDrop needs access to your device&apos;s motion sensors for the compass feature.</p>
          <Button onClick={requestPermission}>Enable Sensors</Button>
        </div>
    );
  }
  
  const rotation = orientation.alpha !== null ? bearing - orientation.alpha : 0;

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-6">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Compass background */}
        <div className="absolute w-full h-full border-4 border-muted rounded-full"/>
        <div className="absolute w-1 h-4 bg-foreground top-0 left-1/2 -ml-0.5 rounded-b-full"></div>
        <div className="absolute text-xs font-bold top-5">N</div>

        {/* Compass Arrow */}
        <div className="w-full h-full transition-transform duration-500" style={{ transform: `rotate(${rotation}deg)` }}>
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-primary">
            <path d="M50 0 L65 50 L50 40 L35 50 Z" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <p className="text-4xl font-bold font-headline">{distance.toFixed(0)}m</p>
        <p className="text-muted-foreground">away</p>
      </div>

      <div className="w-full space-y-2">
          {!isWithinRange && <p className="text-center text-accent font-semibold">Get closer to align!</p>}
          {isWithinRange && <p className="text-center text-primary font-semibold">You&apos;re in range! Align your view.</p>}
        <Progress value={alignmentProgress} className="h-2" />
      </div>
    </div>
  );
}
