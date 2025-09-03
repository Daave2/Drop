"use client";

import { useEffect, useState } from "react";
import { useOrientation } from "./use-orientation";

export function useARMode(threshold: number = 60) {
  const { orientation, permissionGranted, requestPermission } = useOrientation();
  const [isARActive, setIsARActive] = useState(false);

  useEffect(() => {
    if (orientation.beta !== null) {
      setIsARActive(orientation.beta > threshold);
    }
  }, [orientation.beta, threshold]);

  return { isARActive, permissionGranted, requestPermission };
}

