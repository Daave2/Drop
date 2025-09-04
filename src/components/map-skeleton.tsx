import React from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface MapSkeletonProps {
  className?: string;
}

export function MapSkeleton({ className }: MapSkeletonProps) {
  return (
    <div className={cn('relative h-full w-full bg-background', className)}>
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-2 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-full w-full" />
        ))}
      </div>
      <Skeleton className="absolute top-1/3 left-1/3 h-5 w-5 rounded-full" />
      <Skeleton className="absolute top-2/3 left-1/2 h-6 w-6 rounded-full" />
      <Skeleton className="absolute top-1/2 left-2/3 h-4 w-4 rounded-full" />
    </div>
  );
}
