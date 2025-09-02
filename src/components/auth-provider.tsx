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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let anonymousSignInAttempted = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        if (!anonymousSignInAttempted) {
          anonymousSignInAttempted = true;
          // Automatically sign in users anonymously
          try {
            await signInAnonymously(auth);
            // The onAuthStateChanged listener will handle setting the user and loading state
          } catch (error: any) {
              if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
                  toast({
                      title: "Anonymous Sign-In Disabled",
                      description: "For full functionality, please sign in with Google.",
                      variant: "default"
                  });
              } else {
                   toast({
                      title: "Authentication Error",
                      description: "Could not sign in anonymously. Please check your Firebase setup.",
                      variant: "destructive"
                  });
              }
              console.error("Anonymous sign-in error:", error);
              // If anon sign-in fails, stop loading and let user proceed without a user object
              setLoading(false); 
          }
        } else {
            // If anon sign-in was already attempted and failed, just stop loading
            setLoading(false);
        }
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
