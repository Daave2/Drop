
"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, Timestamp, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface Report {
    id: string;
    noteId: string;
    noteAuthorUid: string;
    reporterUid: string;
    reason: string;
    createdAt: Timestamp;
    status: 'pending_review' | 'resolved';
}

function EditableNote({ noteId, onDelete }: { noteId: string, onDelete?: () => void }) {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newScore, setNewScore] = useState('');
    const { toast } = useToast();

    const fetchNote = async () => {
        setLoading(true);
        setError(null);
        try {
            const noteRef = doc(db, 'notes', noteId);
            const noteSnap = await getDoc(noteRef);
            if (noteSnap.exists()) {
                const noteData = { id: noteSnap.id, ...noteSnap.data() } as Note;
                setNote(noteData);
                setNewScore(noteData.score.toString());
            } else {
                setError("The reported note has been deleted.");
            }
        } catch (err) {
            console.error("Error fetching reported note:", err);
            setError("Failed to fetch the reported note.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteId]);

    const handleUpdateScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note) return;

        const scoreValue = parseInt(newScore, 10);
        if (isNaN(scoreValue)) {
            toast({ title: "Invalid Score", description: "Please enter a valid number.", variant: "destructive" });
            return;
        }

        try {
            const noteRef = doc(db, 'notes', note.id);
            await updateDoc(noteRef, { score: scoreValue });
            toast({ title: "Score Updated", description: `Note score has been set to ${scoreValue}.` });
            setNote(prev => prev ? { ...prev, score: scoreValue } : null);
        } catch (error) {
            console.error("Error updating score:", error);
            toast({ title: "Error", description: "Could not update the score.", variant: "destructive" });
        }
    };
    
    const handleDeleteNote = async () => {
        if (!note) return;
        try {
            await deleteDoc(doc(db, 'notes', note.id));
            toast({ title: "Note Deleted", description: "The note has been deleted." });
            if (onDelete) {
                onDelete();
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            toast({ title: "Error", description: "Could not delete the note.", variant: "destructive" });
        }
    }

    if (loading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (error) {
        return <p className="text-destructive">{error}</p>;
    }

    if (!note) {
        return <p className="text-muted-foreground">Note not found.</p>;
    }

    return (
        <div className="bg-muted p-4 rounded-lg space-y-4">
            <div>
                <h4 className="font-bold">Note Content:</h4>
                <p className="whitespace-pre-wrap mt-2">{note.text}</p>
                {note.media?.[0]?.path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={note.media[0].path} alt="Reported media" className="mt-2 rounded-md max-h-48" />
                )}
            </div>
            <div className="text-sm text-muted-foreground">
                <p>Author: {note.authorPseudonym} ({note.authorUid})</p>
                <p>Created: {new Date(note.createdAt.seconds * 1000).toLocaleString()}</p>
            </div>
            <Separator />
            <div className="flex justify-between items-end gap-2">
                <form onSubmit={handleUpdateScore} className="flex items-end gap-2 flex-grow">
                    <div className="flex-grow">
                        <Label htmlFor={`score-${note.id}`}>Score (Likes)</Label>
                        <Input
                            id={`score-${note.id}`}
                            type="number"
                            value={newScore}
                            onChange={(e) => setNewScore(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <Button type="submit">Update Score</Button>
                </form>
                 <Button variant="destructive" onClick={handleDeleteNote}>Delete Note</Button>
            </div>
        </div>
    );
}

export function ReportsTab() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchReports = async () => {
        setLoading(true);
        try {
            const reportsCollection = collection(db, 'reports');
            const q = query(
                reportsCollection,
                where('status', '==', 'pending_review'),
                orderBy('createdAt', 'desc')
            );
            const reportSnapshot = await getDocs(q);
            const reportsList = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(reportsList);
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast({
                title: "Error",
                description: "Failed to fetch reports.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDismissReport = async (reportId: string, noteId: string) => {
        try {
            const batch = writeBatch(db);
            const reportRef = doc(db, 'reports', reportId);
            batch.delete(reportRef);

            const noteRef = doc(db, 'notes', noteId);
            batch.update(noteRef, { visibility: 'public' });

            await batch.commit();

            toast({ title: "Report Dismissed", description: "The note is now public again." });
            fetchReports();
        } catch (error) {
            console.error("Error dismissing report:", error);
            toast({ title: "Error", description: "Could not dismiss the report.", variant: "destructive" });
        }
    };

    const handleDeleteNoteFromReport = async (reportId: string, noteId: string) => {
        try {
            const batch = writeBatch(db);
            
            const reportRef = doc(db, 'reports', reportId);
            batch.delete(reportRef);

            const noteRef = doc(db, 'notes', noteId);
            batch.delete(noteRef);

            await batch.commit();
            
            toast({ title: "Note Deleted", description: "The note and its report have been deleted." });
            fetchReports();
        } catch (error) {
            console.error("Error deleting note:", error);
            toast({ title: "Error", description: "Could not delete the note.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                    Notes that have been flagged by users for review.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {loading && <Skeleton className="h-48 w-full" />}
                {!loading && reports.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No reports pending review.</p>
                )}
                {reports.map((report) => (
                    <div key={report.id} className="border p-4 rounded-lg space-y-4">
                        <div>
                            <p><strong>Reason for report:</strong> {report.reason}</p>
                            <p className="text-sm text-muted-foreground">
                                Reported by: {report.reporterUid} on {report.createdAt.toDate().toLocaleDateString()}
                            </p>
                        </div>
                        <Separator />
                        <EditableNote noteId={report.noteId} onDelete={fetchReports} />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => handleDismissReport(report.id, report.noteId)}>Dismiss Report</Button>
                            <Button variant="destructive" onClick={() => handleDeleteNoteFromReport(report.id, report.noteId)}>Delete Note & Report</Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function AllNotesTab() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const notesCollection = collection(db, 'notes');
            const q = query(notesCollection, orderBy('createdAt', 'desc'), limit(50));
            const notesSnapshot = await getDocs(q);
            const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
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
                   <EditableNote key={note.id} noteId={note.id} onDelete={fetchNotes}/>
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="all-notes">All Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="reports" className="mt-6">
                    <ReportsTab />
                </TabsContent>
                <TabsContent value="all-notes" className="mt-6">
                    <AllNotesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

  