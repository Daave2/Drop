
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, writeBatch, Timestamp, updateDoc } from 'firebase/firestore';
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

interface Report {
    id: string;
    noteId: string;
    noteAuthorUid: string;
    reporterUid: string;
    reason: string;
    createdAt: Timestamp;
    status: 'pending_review' | 'resolved';
}

function ReportedNote({ noteId }: { noteId: string }) {
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newScore, setNewScore] = useState('');
    const { toast } = useToast();

    const fetchNote = async () => {
        setLoading(true);
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
            // Re-fetch note to show updated data, though local state update is faster
            setNote(prev => prev ? { ...prev, score: scoreValue } : null);
        } catch (error) {
            console.error("Error updating score:", error);
            toast({ title: "Error", description: "Could not update the score.", variant: "destructive" });
        }
    };

    if (loading) {
        return <Skeleton className="h-40 w-full" />;
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
                <h4 className="font-bold">Reported Note Content:</h4>
                <p className="whitespace-pre-wrap mt-2">{note.text}</p>
                {note.media?.[0]?.path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={note.media[0].path} alt="Reported media" className="mt-2 rounded-md max-h-48" />
                )}
            </div>
            <Separator />
            <form onSubmit={handleUpdateScore} className="flex items-end gap-2">
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
        </div>
    );
}

export default function AdminPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchReports = async () => {
        setLoading(true);
        try {
            const reportsCollection = collection(db, 'reports');
            const reportSnapshot = await getDocs(reportsCollection);
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

            // Delete the report
            const reportRef = doc(db, 'reports', reportId);
            batch.delete(reportRef);

            // Restore the note's visibility
            const noteRef = doc(db, 'notes', noteId);
            batch.update(noteRef, { visibility: 'public' });

            await batch.commit();

            toast({ title: "Report Dismissed", description: "The note is now public again." });
            fetchReports(); // Refresh the list
        } catch (error) {
            console.error("Error dismissing report:", error);
            toast({ title: "Error", description: "Could not dismiss the report.", variant: "destructive" });
        }
    };

    const handleDeleteNote = async (reportId: string, noteId: string) => {
        try {
            const batch = writeBatch(db);
            
            const reportRef = doc(db, 'reports', reportId);
            batch.delete(reportRef);

            const noteRef = doc(db, 'notes', noteId);
            batch.delete(noteRef);

            await batch.commit();
            
            toast({ title: "Note Deleted", description: "The note and its report have been deleted." });
            fetchReports(); // Refresh the list
        } catch (error) {
            console.error("Error deleting note:", error);
            toast({ title: "Error", description: "Could not delete the note.", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-headline font-bold">Admin - Reports</h1>
                 <Button asChild variant="ghost">
                    <Link href="/">Back to Map</Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Pending Reviews</CardTitle>
                    <CardDescription>
                        Here are the notes that have been flagged by users for review.
                        Please review them and take appropriate action.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading && <Skeleton className="h-48 w-full" />}
                    {!loading && reports.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No pending reports. Great job!</p>
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
                            <ReportedNote noteId={report.noteId} />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => handleDismissReport(report.id, report.noteId)}>Dismiss Report</Button>
                                <Button variant="destructive" onClick={() => handleDeleteNote(report.id, report.noteId)}>Delete Note</Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
