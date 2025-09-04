
"use client";

import MapView from "@/components/map-view";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Suspense>
        <MapView />
      </Suspense>
    </>
  );
}
