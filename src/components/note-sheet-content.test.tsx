/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import NoteSheetContent from './note-sheet-content';
import { getDoc } from 'firebase/firestore';

vi.mock('./create-note-form', () => ({ __esModule: true, default: () => <div>CreateNoteForm</div> }));
vi.mock('./note-view', () => ({ __esModule: true, default: () => <div>NoteView</div> }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  Timestamp: class {},
}));
vi.mock('./ui/sheet', () => ({
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));

describe('NoteSheetContent', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
  const noop = () => {};

  it('renders create note form when creating', () => {
    render(
      <NoteSheetContent
        noteId={null}
        isCreating={true}
        userLocation={null}
        onNoteCreated={noop}
        onClose={noop}
      />
    );
    expect(screen.getByText('CreateNoteForm')).toBeTruthy();
  });

  it('renders placeholder when no note selected', () => {
    render(
      <NoteSheetContent
        noteId={null}
        isCreating={false}
        userLocation={null}
        onNoteCreated={noop}
        onClose={noop}
      />
    );
    expect(screen.getAllByText('Select a note to view its contents.').length).toBeGreaterThan(0);
  });

  it('renders note view when note is loaded', async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      id: '1',
      data: () => ({ text: 'hello' }),
    });
    render(
      <NoteSheetContent
        noteId={'1'}
        isCreating={false}
        userLocation={null}
        onNoteCreated={noop}
        onClose={noop}
      />
    );
    await waitFor(() => expect(screen.getByText('NoteView')).toBeTruthy());
  });
});
