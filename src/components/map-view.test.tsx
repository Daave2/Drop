/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import MapView from './map-view';

vi.mock('react-map-gl/maplibre', () => ({
  __esModule: true,
  default: ({ children, style }: any) => (
    <div data-testid="map" style={style}>
      {children}
    </div>
  ),
  Marker: ({ children }: any) => <div>{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
}));

const useLocationMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-location', () => ({
  useLocation: useLocationMock,
}));

const useNotesMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-notes', () => ({
  useNotes: useNotesMock,
}));

const useToastMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-toast', () => ({
  useToast: useToastMock,
}));

vi.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({ proximityRadiusM: 100 }),
}));

vi.mock('@/hooks/use-proximity-notifications', () => ({
  useProximityNotifications: () => {},
}));

vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light' }) }));
const useSearchParamsMock = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
vi.mock('next/navigation', () => ({ useSearchParams: useSearchParamsMock }));
vi.mock('./notifications-button', () => ({ NotificationsButton: () => <div /> }));
const NoteSheetContentMock = vi.hoisted(() => vi.fn(() => <div data-testid="note-sheet" />));
vi.mock('./note-sheet-content', () => ({ __esModule: true, default: NoteSheetContentMock }));
vi.mock('./compass-view', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('./theme-toggle', () => ({ ThemeToggle: () => <div /> }));
vi.mock('./auth-button', () => ({ AuthButton: () => <div /> }));
vi.mock('./ui/logo', () => ({ Logo: () => <div /> }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('./ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));
let dialogOnOpenChange: ((open: boolean) => void) | null = null;
vi.mock('./ui/dialog', () => ({
  Dialog: ({ children, onOpenChange }: any) => {
    dialogOnOpenChange = onOpenChange;
    return <div>{children}</div>;
  },
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));

beforeEach(() => {
  useNotesMock.mockReturnValue({ notes: [], fetchNotes: vi.fn(), loading: false, error: null });
  useToastMock.mockReturnValue({ toast: vi.fn() });
  useSearchParamsMock.mockReturnValue(new URLSearchParams());
  useLocationMock.mockReturnValue({ location: null, permissionState: 'granted', requestPermission: vi.fn() });
  NoteSheetContentMock.mockClear();
});

afterEach(() => {
  cleanup();
  useNotesMock.mockReset();
  useToastMock.mockReset();
  window.localStorage.clear();
});

describe('MapView', () => {
  it('renders loader while loading', () => {
    useNotesMock.mockReturnValue({ notes: [], fetchNotes: vi.fn(), loading: true, error: null });
    const { getByTestId } = render(<MapView />);
    const loader = getByTestId('map-loading');
    expect(loader.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows message when no notes', () => {
    const { getByTestId } = render(<MapView />);
    expect(getByTestId('no-notes')).toBeTruthy();
  });

  it('toasts on error', async () => {
    const toastFn = vi.fn();
    useNotesMock.mockReturnValue({ notes: [], fetchNotes: vi.fn(), loading: false, error: 'oops' });
    useToastMock.mockReturnValue({ toast: toastFn });
    render(<MapView />);
    await waitFor(() => expect(toastFn).toHaveBeenCalled());
  });

  it('opens note from search params', async () => {
    const note = {
      id: '1',
      lat: 0,
      lng: 0,
      createdAt: { seconds: 0, nanoseconds: 0 },
      score: 0,
      type: 'text',
    };
    useSearchParamsMock.mockReturnValue(new URLSearchParams('note=1'));
    useNotesMock.mockReturnValue({ notes: [note], fetchNotes: vi.fn(), loading: false, error: null });
    render(<MapView />);
    await waitFor(() =>
      expect(NoteSheetContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ noteId: '1' }),
        expect.anything()
      )
    );
  });

  it('hides note preview when closing compass view out of range', async () => {
    const note = {
      id: '1',
      lat: 10,
      lng: 10,
      createdAt: { seconds: 0, nanoseconds: 0 },
      score: 0,
      type: 'text',
      teaser: 'Teaser',
    };
    useLocationMock.mockReturnValue({
      location: { latitude: 0, longitude: 0 },
      permissionState: 'granted',
      requestPermission: vi.fn(),
    });
    useNotesMock.mockReturnValue({ notes: [note], fetchNotes: vi.fn(), loading: false, error: null });

    const { getByLabelText, queryByText } = render(<MapView />);

    fireEvent.click(getByLabelText('note-marker'));
    expect(queryByText('Teaser')).toBeNull();

    dialogOnOpenChange && dialogOnOpenChange(false);

    await waitFor(() => {
      expect(queryByText('Teaser')).toBeNull();
    });
  });
});

