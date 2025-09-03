
"use client";

import { GoogleAuthProvider, signInWithPopup, signOut, signInWithRedirect } from "firebase/auth";
import { LogIn, LogOut, User as UserIcon, UserCog } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function AuthButton() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!auth) {
      console.error("Firebase is not configured. Unable to sign in.");
      toast({
        title: "Authentication Error",
        description: "Firebase is not configured.",
        variant: "destructive",
      });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorCode = error.code as string | undefined;

      if (errorCode === 'auth/cancelled-popup-request' || errorCode === 'auth/popup-closed-by-user') {
        // Silently ignore user cancelling the sign-in
        return;
      }
      
      if (errorCode === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error(
            `Error signing in with redirect (${redirectError.code}):`,
            redirectError
          );
          toast({
            title: "Authentication Error",
            description: "Unable to sign in.",
            variant: "destructive",
          });
        }
      } else {
        const errorMessages: Record<string, string> = {
          "auth/unauthorized-domain": "This domain is not authorized for sign-in.",
          "auth/operation-not-supported-in-this-environment": "Sign-in is not supported in this environment.",
        };

        console.error(`Error signing in with Google (${errorCode}):`, error);
        toast({
          title: "Authentication Error",
          description:
            errorMessages[errorCode ?? ""] ||
            "Unable to sign in with Google.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      console.error("Firebase is not configured. Unable to sign out.");
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (!user) {
    return <Button onClick={handleSignIn} variant="outline" size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
      </Button>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
            <AvatarFallback>
                {user.isAnonymous ? <UserIcon /> : user.displayName?.charAt(0) || <UserIcon />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.isAnonymous ? "Anonymous User" : user.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.isAnonymous ? "Sign in for more features" : user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCog className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isAnonymous ? (
            <DropdownMenuItem onClick={handleSignIn}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign in with Google</span>
            </DropdownMenuItem>
        ) : (
            <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
