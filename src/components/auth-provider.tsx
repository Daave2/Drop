"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
          // We can inform the user and then proceed without a signed-in user.
          if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
            toast({
              title: "Anonymous Sign-In Disabled",
              description: "For full functionality, please sign in with Google.",
              variant: "default",
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