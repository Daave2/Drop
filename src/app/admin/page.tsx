
"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableNote, ReportsTab } from "./reports-tab";
import { TestModeTab } from "./TestModeTab";

function AllNotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const notesCollection = collection(db, "notes");
      const q = query(notesCollection, orderBy("createdAt", "desc"), limit(50));
      const notesSnapshot = await getDocs(q);
      const notesList = notesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(notesList);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Notes</CardTitle>
        <CardDescription>
          A list of the most recent 50 notes on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <Skeleton className="h-48 w-full" />}
        {!loading && notes.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No notes found.</p>
        )}
        {notes.map((note) => (
          <EditableNote key={note.id} noteId={note.id} onDelete={fetchNotes} />
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-headline font-bold">Admin Panel</h1>
        <Button asChild variant="ghost">
          <Link href="/">Back to Map</Link>
        </Button>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="all-notes">All Notes</TabsTrigger>
          <TabsTrigger value="test-mode">Test Mode</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-6">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="all-notes" className="mt-6">
          <AllNotesTab />
        </TabsContent>
        <TabsContent value="test-mode" className="mt-6">
          <TestModeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
