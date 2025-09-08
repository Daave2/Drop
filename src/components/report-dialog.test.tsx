/**
 * @vitest-environment jsdom
 */
import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  within,
  screen,
  cleanup,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportDialog from './report-dialog';

const toastMock = vi.hoisted(() => vi.fn());
const runTransactionMock = vi.hoisted(() => vi.fn());

vi.mock('@/components/auth-provider', () => ({
  useAuth: () => ({ user: { uid: 'user1' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('firebase/firestore', () => ({
  runTransaction: runTransactionMock,
  doc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('@/lib/reporting', () => ({
  calculateReportUpdate: () => ({ newCount: 1, hide: false }),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));

vi.mock('@/components/ui/alert-dialog', () => {
  const React = require('react');
  return {
    AlertDialog: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogContent: ({ children, ...props }: any) =>
      React.createElement('div', { ...props }, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogTitle: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogDescription: ({ children }: any) =>
      React.createElement('div', null, children),
    AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogAction: (props: any) => React.createElement('button', props),
    AlertDialogCancel: (props: any) => React.createElement('button', props),
  };
});

describe('ReportDialog', () => {
  const note = { id: 'n1', authorUid: 'u2' } as any;

  beforeEach(() => {
    toastMock.mockReset();
    runTransactionMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('does not submit when reason too short', () => {
    const onReportSubmit = vi.fn();
    render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={onReportSubmit} />
    );
    const dialog = within(screen.getByRole('dialog', { name: /report note/i }));
    fireEvent.change(dialog.getByLabelText(/reason for reporting/i), {
      target: { value: 'short' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /submit report/i }));
    expect(runTransactionMock).not.toHaveBeenCalled();
    expect(onReportSubmit).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Reason too short' })
    );
  });

  it('disables submit while pending', async () => {
    let resolve!: () => void;
    runTransactionMock.mockImplementation((_db: unknown, fn: any) => {
      fn({
        get: vi.fn(() => ({ data: () => ({ reportCount: 0 }) })),
        update: vi.fn(),
        set: vi.fn(),
      });
      return new Promise<void>((res) => {
        resolve = res;
      });
    });

    render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={() => {}} />
    );
    const dialog = within(screen.getByRole('dialog', { name: /report note/i }));
    fireEvent.change(dialog.getByLabelText(/reason for reporting/i), {
      target: { value: 'Valid reason text' },
    });
    const button = dialog.getByRole('button', { name: /submit report/i }) as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Submitting…');
    resolve();
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(button.textContent).toBe('Submit Report');
  });

  it('calls onReportSubmit on success', async () => {
    runTransactionMock.mockImplementation((_db: unknown, fn: any) => {
      fn({
        get: vi.fn(() => ({ data: () => ({ reportCount: 0 }) })),
        update: vi.fn(),
        set: vi.fn(),
      });
      return Promise.resolve();
    });
    const onReportSubmit = vi.fn();
    render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={onReportSubmit} />
    );
    const dialog = within(screen.getByRole('dialog', { name: /report note/i }));
    fireEvent.change(dialog.getByLabelText(/reason for reporting/i), {
      target: { value: 'Valid reason text' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /submit report/i }));
    await waitFor(() => expect(onReportSubmit).toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Report Submitted' })
    );
  });
});

