/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NoteView from './note-view';
import type { Note } from '@/types';

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt || ''} {...props} />;
  },
}));

vi.mock('lucide-react', () => ({
  Heart: () => <svg />, 
  Flag: () => <svg />, 
  Trash2: () => <svg />,
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(),
  deleteDoc: vi.fn(),
  Timestamp: class {},
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/pseudonym', () => ({ getOrCreatePseudonym: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('./auth-provider', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/utils', () => ({ cn: (...classes: any[]) => classes.filter(Boolean).join(' ') }));
vi.mock('./ui/button', () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('./ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));
vi.mock('./ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./ui/separator', () => ({ Separator: () => <div /> }));
vi.mock('./ui/skeleton', () => ({ Skeleton: () => <div /> }));
vi.mock('./ui/scroll-area', () => ({ ScrollArea: ({ children }: any) => <div>{children}</div> }));
vi.mock('./ui/sheet', () => ({
  SheetFooter: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./reply-form', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('./report-dialog', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
}));

describe('NoteView', () => {
  const baseNote: Note = {
    id: '1',
    createdAt: { seconds: 0, nanoseconds: 0 },
    text: '',
    type: 'photo',
    media: [{ path: '/test.jpg', w: 100, h: 100, type: 'image' }],
    lat: 0,
    lng: 0,
    visibility: 'public',
    score: 0,
    trust: 0,
    placeMaskMeters: 0,
    revealMode: 'proximity+sightline',
    revealRadiusM: 0,
    revealAngleDeg: 0,
    peekable: false,
    dmAllowed: false,
  };

  it('uses note text for image alt text', () => {
    const note: Note = { ...baseNote, text: 'Hello world', teaser: null };
    const { getByAltText } = render(<NoteView note={note} onClose={() => {}} />);
    expect(getByAltText('Hello world')).toBeTruthy();
  });

  it('falls back to teaser for image alt text', () => {
    const note: Note = { ...baseNote, text: '', teaser: 'Preview text' };
    const { getByAltText } = render(<NoteView note={note} onClose={() => {}} />);
    expect(getByAltText('Preview text')).toBeTruthy();
  });

  it('uses generic alt text when no text or teaser', () => {
    const note: Note = { ...baseNote, text: '', teaser: null };
    const { getByAltText } = render(<NoteView note={note} onClose={() => {}} />);
    expect(getByAltText('Note image')).toBeTruthy();
  });
});

