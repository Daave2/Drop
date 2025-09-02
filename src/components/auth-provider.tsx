
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

let hasAttemptedAnonymousSignIn = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      toast({
        title: 'Authentication Error',
        description: 'Firebase is not configured. Sign-in is unavailable.',
        variant: 'destructive',
      });
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        hasAttemptedAnonymousSignIn = true; // A user is present, no need for anonymous sign-in
      } else if (!hasAttemptedAnonymousSignIn) {
        hasAttemptedAnonymousSignIn = true;
        try {
          // Try to sign in anonymously only once per session
          await signInAnonymously(auth);
          // The listener will re-run with the new user, setting state appropriately.
        } catch (error: any) {
          // If anonymous sign-in is disabled, we expect this error.
          if (error.code === 'auth/operation-not-allowed') {
             toast({
              title: "Authentication Error",
              description: "Anonymous sign-in is not enabled in your Firebase project. Please enable it in the Firebase console.",
              variant: "destructive",
            });
          } else if (error.code === 'auth/requests-to-this-api-are-blocked' || error.code === 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.authenticationservice.signup-are-blocked') {
            toast({
              title: "Configuration Required",
              description: "The Identity Platform API is not enabled. Please enable it in your Google Cloud project to use Firebase Authentication.",
              variant: "destructive",
              duration: 10000,
            });
          } else {
            // For other unexpected errors
            console.error("Anonymous sign-in error:", error);
            toast({
              title: "Authentication Error",
              description: "An unexpected error occurred during sign-in.",
              variant: "destructive",
            });
          }
          // In any error case, stop loading and proceed without a user.
          setUser(null);
          setLoading(false);
        }
      } else {
        // No user and we've already tried anonymous sign-in (or one was already present and signed out)
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  if (loading) {
      return (
          <div className="w-full h-screen flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
              </div>
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
