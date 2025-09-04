/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

vi.mock('@/hooks/use-location', () => ({
  useLocation: () => ({ location: null, permissionState: 'granted', requestPermission: vi.fn() }),
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

const useARModeMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-ar-mode', () => ({
  useARMode: useARModeMock,
}));

vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));

vi.mock('./ar-view', () => ({
  __esModule: true,
  default: ({ onReturnToMap }: any) => (
    <div data-testid="arview" onClick={onReturnToMap} />
  ),
}));
vi.mock('./notifications-button', () => ({ NotificationsButton: () => <div /> }));
vi.mock('./note-sheet-content', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('./compass-view', () => ({ __esModule: true, default: () => <div /> }));
vi.mock('./theme-toggle', () => ({ ThemeToggle: () => <div /> }));
vi.mock('./auth-button', () => ({ AuthButton: () => <div /> }));
vi.mock('./ui/logo', () => ({ Logo: () => <div /> }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children }: any) => <button>{children}</button> }));
vi.mock('./ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));

beforeEach(() => {
  useNotesMock.mockReturnValue({ notes: [], fetchNotes: vi.fn(), loading: false, error: null });
  useToastMock.mockReturnValue({ toast: vi.fn() });
  useARModeMock.mockReturnValue({ isARActive: false, permissionGranted: false, requestPermission: vi.fn() });
});

afterEach(() => {
  cleanup();
  useARModeMock.mockReset();
  useNotesMock.mockReset();
  useToastMock.mockReset();
});

describe('MapView', () => {
  it('hides map when AR is active and permissions granted', () => {
    useARModeMock.mockReturnValue({ isARActive: true, permissionGranted: true, requestPermission: vi.fn() });
    const { getAllByTestId } = render(<MapView />);
    const maps = getAllByTestId('map');
    const map = maps[maps.length - 1] as HTMLDivElement;
    expect(map.style.display).toBe('none');
    expect(getAllByTestId('arview').length).toBeGreaterThan(0);
  });

  it('shows map when AR permissions are denied', () => {
    useARModeMock.mockReturnValue({ isARActive: true, permissionGranted: false, requestPermission: vi.fn() });
    const { getAllByTestId, queryAllByTestId } = render(<MapView />);
    const maps = getAllByTestId('map');
    const map = maps[maps.length - 1] as HTMLDivElement;
    expect(map.style.display).toBe('block');
    expect(queryAllByTestId('arview')).toHaveLength(0);
  });

  it('shows map after returning from AR view', () => {
    useARModeMock.mockReturnValue({ isARActive: true, permissionGranted: true, requestPermission: vi.fn() });
    const { getAllByTestId, queryAllByTestId } = render(<MapView />);
    const maps = getAllByTestId('map');
    const map = maps[maps.length - 1] as HTMLDivElement;
    expect(map.style.display).toBe('none');
    getAllByTestId('arview').forEach(el => fireEvent.click(el));
    expect(queryAllByTestId('arview')).toHaveLength(0);
    const updatedMaps = getAllByTestId('map');
    const updatedMap = updatedMaps[updatedMaps.length - 1] as HTMLDivElement;
    expect(updatedMap.style.display).toBe('block');
  });

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
});

