"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface SettingsContextType {
  proximityRadiusM: number;
  setProximityRadiusM: (value: number) => void;
}

const DEFAULT_RADIUS = Number(process.env.NEXT_PUBLIC_PROXIMITY_RADIUS_M ?? 50);

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [proximityRadiusM, setProximityRadiusMState] = useState(DEFAULT_RADIUS);

  useEffect(() => {
    const stored = window.localStorage.getItem("proximityRadiusM");
    if (stored !== null) {
      const value = Number(stored);
      if (!Number.isNaN(value)) {
        setProximityRadiusMState(value);
      }
    }
  }, []);

  const setProximityRadiusM = useCallback((value: number) => {
    setProximityRadiusMState(value);
    window.localStorage.setItem("proximityRadiusM", String(value));
  }, []);

  return (
    <SettingsContext.Provider value={{ proximityRadiusM, setProximityRadiusM }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

