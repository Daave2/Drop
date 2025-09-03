"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

export function Pwa() {
  const { isInstallable, promptInstall } = useInstallPrompt();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('Service worker registration failed', err));
    }
  }, []);

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <Button onClick={promptInstall}>Install App</Button>
    </div>
  );
}
