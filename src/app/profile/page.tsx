"use client";

import { AuthButton } from "@/components/auth-button";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-headline font-bold">Profile</h1>
            <Button asChild variant="ghost">
                <Link href="/">Back to Map</Link>
            </Button>
        </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
              <AvatarFallback className="text-3xl">
                {user?.isAnonymous ? <User /> : user?.displayName?.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle className="text-3xl font-headline">
                    {user?.isAnonymous ? "Wandering Wombat" : user?.displayName}
                </CardTitle>
                <CardDescription>
                    {user?.isAnonymous ? "Anonymous User" : user?.email}
                </CardDescription>
            </div>
            <AuthButton />
        </CardHeader>
        <CardContent>
            <Separator className="my-4"/>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Notes Dropped</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-muted-foreground">Notes Revealed</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-3xl font-bold">0.75</p>
                    <p className="text-sm text-muted-foreground">Trust Score</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
