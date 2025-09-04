import React from "react";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface MapSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MapSkeleton({ className, ...props }: MapSkeletonProps) {
  const markerPositions = [
    { top: "30%", left: "40%" },
    { top: "55%", left: "65%" },
    { top: "70%", left: "25%" },
  ];

  return (
    <div className={cn("bg-background", className)} {...props}>
      <div className="grid h-full w-full grid-cols-4 gap-px">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-full w-full rounded-none" />
        ))}
      </div>
      {markerPositions.map((pos, i) => (
        <Skeleton
          key={i}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ top: pos.top, left: pos.left }}
        />
      ))}
    </div>
  );
}

export default MapSkeleton;
