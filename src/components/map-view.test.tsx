/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
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

const enterARHandler = vi.hoisted(() => vi.fn());
vi.mock('./ar-view', () => {
  const MockARView = React.forwardRef(
    ({ onReturnToMap, style }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ enterAR: enterARHandler }));
      return <div data-testid="arview" style={style} onClick={onReturnToMap}></div>;
    }
  );
  MockARView.displayName = 'MockARView';
  return { __esModule: true, default: MockARView };
});
vi.mock('./notifications-button', () => ({ NotificationsButton: () => <div /> }));
vi.mock('./note-sheet-content', () => ({ __esModule: true, default: () => <div /> }));
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
  useARModeMock.mockReturnValue({ permissionGranted: false, requestPermission: vi.fn(), arError: null, setArError: vi.fn() });
});

afterEach(() => {
  cleanup();
  useARModeMock.mockReset();
  useNotesMock.mockReset();
  useToastMock.mockReset();
  enterARHandler.mockReset();
  window.localStorage.clear();
});

describe('MapView', () => {
  it('enters AR view when permission granted and enable AR clicked', async () => {
    const requestPermission = vi.fn().mockResolvedValue(true);
    useARModeMock.mockReturnValue({ permissionGranted: false, requestPermission, arError: null, setArError: vi.fn() });
    const { getAllByTestId, getByText, getByTestId, queryByTestId } = render(<MapView />);
    fireEvent.click(getByTestId('onboarding-overlay'));
    await waitFor(() => expect(() => getByTestId('onboarding-overlay')).toThrow());
    await act(async () => {
      fireEvent.click(getByText('Enable AR'));
    });
    await waitFor(() => expect(enterARHandler).toHaveBeenCalled());
    await waitFor(() => expect(getByTestId('arview')).toBeTruthy());
    const maps = getAllByTestId('map');
    const map = maps[maps.length - 1] as HTMLDivElement;
    expect(map.style.display).toBe('none');
    expect(queryByTestId('arview')).toBeTruthy();
  });

  it('keeps map visible when AR permission denied', async () => {
    const requestPermission = vi.fn().mockResolvedValue(false);
    useARModeMock.mockReturnValue({ permissionGranted: false, requestPermission, arError: null, setArError: vi.fn() });
    const { getAllByTestId, getByText, getByTestId, queryByTestId } = render(<MapView />);
    fireEvent.click(getByTestId('onboarding-overlay'));
    await waitFor(() => expect(() => getByTestId('onboarding-overlay')).toThrow());
    await act(async () => {
      fireEvent.click(getByText('Enable AR'));
    });
    await waitFor(() => {
      const maps = getAllByTestId('map');
      const map = maps[maps.length - 1] as HTMLDivElement;
      expect(map.style.display).toBe('block');
      expect(queryByTestId('arview')).toBeNull();
    });
  });

  it('shows map after returning from AR view', async () => {
    const requestPermission = vi.fn().mockResolvedValue(true);
    useARModeMock.mockReturnValue({ permissionGranted: false, requestPermission, arError: null, setArError: vi.fn() });
    const { getAllByTestId, getByText, getByTestId, queryByTestId } = render(<MapView />);
    fireEvent.click(getByTestId('onboarding-overlay'));
    await waitFor(() => expect(() => getByTestId('onboarding-overlay')).toThrow());
    await act(async () => {
      fireEvent.click(getByText('Enable AR'));
    });
    await waitFor(() => expect(getByTestId('arview')).toBeTruthy());
    fireEvent.click(getByTestId('arview'));
    await waitFor(() => expect(queryByTestId('arview')).toBeNull());
    const maps = getAllByTestId('map');
    const map = maps[maps.length - 1] as HTMLDivElement;
    expect(map.style.display).toBe('block');
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

