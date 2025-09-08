"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useOnline() {
  const { toast } = useToast();
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (!navigator.onLine) {
        toast({ description: 'You are offline.' });
        return Promise.reject(new Error('Offline'));
      }
      return originalFetch(...args);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [toast]);

  const requireOnline = useCallback(() => {
    if (!online) {
      toast({ description: 'You are offline.' });
    }
    return online;
  }, [online, toast]);

  return { online, requireOnline };
}
