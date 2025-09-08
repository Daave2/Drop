/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    AlertDialogContent: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogHeader: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogTitle: ({ children }: any) => React.createElement('div', null, children),
    AlertDialogDescription: ({ children }: any) => React.createElement('div', null, children),
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

  it('shows error when reason too short', () => {
    const { getByText, getByLabelText } = render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={() => {}} />
    );
    fireEvent.change(getByLabelText(/Reason for reporting/), { target: { value: 'short' } });
    fireEvent.click(getByText('Submit Report'));
    expect(runTransactionMock).not.toHaveBeenCalled();
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

    const { getByLabelText, getByRole } = render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={() => {}} />
    );
    const textarea = getByLabelText(/Reason for reporting/);
    fireEvent.change(textarea, { target: { value: 'Valid reason text' } });
    const button = getByRole('button', { name: 'Submit Report' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Submitting...');
    resolve();
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveTextContent('Submit Report');
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
    const { getByLabelText, getByText, getByRole } = render(
      <ReportDialog note={note} open onOpenChange={() => {}} onReportSubmit={onReportSubmit} />
    );
    fireEvent.change(getByLabelText(/Reason for reporting/), {
      target: { value: 'Valid reason text' },
    });
    fireEvent.click(getByRole('button', { name: 'Submit Report' }));
    await waitFor(() => expect(onReportSubmit).toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Report Submitted' })
    );
    expect(getByText('Submit Report')).not.toBeDisabled();
  });
});
