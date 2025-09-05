/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreateNoteForm from './create-note-form';

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', props),
}));

vi.mock('./ui/sheet', () => ({
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetFooter: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

describe('CreateNoteForm', () => {
  it('updates character counter as user types', () => {
    const { getByRole, getByText } = render(
      <CreateNoteForm userLocation={null} onNoteCreated={() => {}} onClose={() => {}} />
    );
    const textarea = getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hi' } });
    expect(getByText('2/800')).toBeTruthy();
    fireEvent.change(textarea, { target: { value: 'Hello there' } });
    expect(getByText('11/800')).toBeTruthy();
  });
});

