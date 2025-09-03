export interface Note {
  id: string;
  createdAt: { seconds: number; nanoseconds: number };
  expiresAt?: { seconds: number; nanoseconds: number } | null;
  authorUid?: string | null;
  authorPseudonym?: string | null;
  text: string;
  type: "text" | "photo" | "tip" | "review" | "clue";
  media?: { path: string; w: number; h: number; type: "image" }[];
  lat: number;
  lng: number;
  geohash?: string;
  visibility: "public" | "group" | "unlisted";
  groupId?: string | null;
  score: number;
  tags?: string[];
  trust: number;
  placeMaskMeters: number;
  revealMode: "proximity+sightline";
  revealRadiusM: number;
  revealAngleDeg: number;
  teaser?: string | null;
  peekable: boolean;
  limitedDrop?: { enabled: boolean; endsAt?: any } | null;
  dmAllowed: boolean;
}

export interface GhostNote {
  id: string;
  lat: number;
  lng: number;
  createdAt: { seconds: number; nanoseconds: number };
  type: Note['type'];
  teaser?: string | null;
  score: number;
}

export interface Reply {
  id: string;
  noteId: string;
  authorUid?: string | null;
  authorPseudonym?: string;
  text: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'reply';
  noteId: string;
  actorUid: string;
  actorPseudonym: string;
  createdAt: { seconds: number; nanoseconds: number };
  read: boolean;
}

export interface Profile {
  uid: string;
  createdAt: { seconds: number; nanoseconds: number };
  pseudonym: string;
  trust: number;
  lastNoteAt?: { seconds: number; nanoseconds: number } | null;
}
