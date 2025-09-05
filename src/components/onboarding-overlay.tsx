'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface OnboardingOverlayHandle {
  show: () => void;
}

const OnboardingOverlay = forwardRef<OnboardingOverlayHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    show: () => setVisible(true),
  }));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = window.localStorage.getItem('onboardingSeen');
      if (seen !== 'true') {
        setVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingSeen', 'true');
    }
  };

  if (!visible) return null;

  return (
    <div
      data-testid="onboarding-overlay"
      className="absolute inset-0 z-30"
      onClick={handleDismiss}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="pointer-events-none">
        <div className="absolute bottom-40 right-20 text-right">
          <div className="bg-background/90 text-foreground text-xs px-2 py-1 rounded-md shadow">
            Center on your location
          </div>
        </div>
        <div className="absolute bottom-24 right-20 text-right">
          <div className="bg-background/90 text-foreground text-xs px-2 py-1 rounded-md shadow">
            Create a note
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/90 text-foreground px-4 py-2 rounded-md shadow">
            Tap anywhere to start
          </div>
        </div>
      </div>
    </div>
  );
});

OnboardingOverlay.displayName = 'OnboardingOverlay';

export default OnboardingOverlay;

