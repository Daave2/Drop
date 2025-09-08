"use client";

import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/utils";

/**
 * Displays a warning banner when the app is offline.
 */
export function OfflineBanner() {
  const { isOnline } = useOnline();
  if (isOnline) return null;
  return (
    <div className={cn("bg-yellow-500 text-black text-center text-sm py-2")}
         role="status">
      You are offline. Some actions are disabled.
    </div>
  );
}
