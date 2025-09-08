"use client";

import { useOnline } from '@/hooks/use-online';

export function OfflineBanner() {
  const { online } = useOnline();
  if (online) return null;
  return (
    <div className="bg-destructive text-destructive-foreground text-center text-sm py-2" role="status">
      You are offline
    </div>
  );
}

export default OfflineBanner;
