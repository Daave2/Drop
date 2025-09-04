
"use client";

import MapView from "@/components/map-view";
import { Suspense, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function Home() {
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
      "DeviceOrientationEvent" in window &&
      (navigator as any).xr;
    if (!supported) {
      setUnsupported(true);
      trackEvent("ar_launch_failed", { reason: "unsupported_environment" });
    }
  }, []);

  return (
    <>
      <Suspense>
        <MapView />
      </Suspense>
      <Dialog open={unsupported}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AR Not Supported</DialogTitle>
            <DialogDescription>
              Your device or browser lacks camera or motion sensor support required for AR mode.
            </DialogDescription>
            <Link href="/" className="underline mt-4 block">
              Return to Map
            </Link>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
