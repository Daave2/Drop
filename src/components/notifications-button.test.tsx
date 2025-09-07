/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsButton } from './notifications-button';

const useNotificationsMock = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: useNotificationsMock,
}));

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock('@/components/auth-provider', () => ({
  useAuth: useAuthMock,
}));

const pushMock = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: any) => (
    <div onClick={onSelect}>{children}</div>
  ),
}));

vi.mock('lucide-react', () => ({ Bell: () => <div /> }));

beforeEach(() => {
  pushMock.mockReset();
});

describe('NotificationsButton', () => {
  it('renders accessible label for screen readers', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'user1' } });
    useNotificationsMock.mockReturnValue({
      notifications: [],
      markAllAsRead: vi.fn(),
    });

    const { getByRole } = render(<NotificationsButton />);
    const button = getByRole('button', { name: /notifications/i });
    expect(button).toBeTruthy();
  });

  it('navigates to note when notification is selected', () => {
    const notification = {
      id: 'notif1',
      userId: 'user1',
      type: 'like',
      noteId: 'note1',
      actorUid: 'actor1',
      actorPseudonym: 'Alice',
      createdAt: { seconds: 0, nanoseconds: 0 },
      read: false,
    };
    useAuthMock.mockReturnValue({ user: { uid: 'user1' } });
    useNotificationsMock.mockReturnValue({
      notifications: [notification],
      markAllAsRead: vi.fn(),
    });

    const { getByText } = render(<NotificationsButton />);
    fireEvent.click(getByText(/liked your note/));
    expect(pushMock).toHaveBeenCalledWith('/?note=note1');
  });
});
