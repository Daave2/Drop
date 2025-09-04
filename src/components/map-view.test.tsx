/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

vi.mock('@/hooks/use-notes', () => ({
  useNotes: () => ({ notes: [], fetchNotes: vi.fn() }),
}));

vi.mock('@/hooks/use-settings', () => ({
  useSettings: () => ({ proximityRadiusM: 100 }),
}));

vi.mock('@/hooks/use-proximity-notifications', () => ({
  useProximityNotifications: () => {},
}));

vi.mock('@/hooks/use-ar-mode', () => ({
  useARMode: () => ({ isARActive: true, permissionGranted: true, requestPermission: vi.fn() }),
}));

vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light' }) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));

vi.mock('./ar-view', () => ({ __esModule: true, default: () => <div data-testid="arview" /> }));
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


describe('MapView', () => {
  it('hides map when AR is active', () => {
    const { getByTestId } = render(<MapView />);
    const map = getByTestId('map') as HTMLDivElement;
    expect(map.style.display).toBe('none');
    // Ensure AR view is rendered
    expect(getByTestId('arview')).toBeTruthy();
  });
});

