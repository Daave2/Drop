/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportDialog from './report-dialog';
import type { Note } from '@/types';

const toast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('@/lib/reporting', () => ({ calculateReportUpdate: vi.fn(() => ({ newCount: 1, hide: false })) }));
vi.mock('./auth-provider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('./ui/label', () => ({ Label: ({ children }: any) => <label>{children}</label> }));
vi.mock('./ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }));

import { runTransaction } from 'firebase/firestore';

describe('ReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const note: Note = {
    id: '1',
    createdAt: { seconds: 0, nanoseconds: 0 },
    authorUid: 'a1',
    text: 'note',
    type: 'text',
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

  function getElements(container: HTMLElement) {
    const textareas = container.querySelectorAll('textarea');
    const buttons = Array.from(container.querySelectorAll('button')).filter(b =>
      /submit report/i.test(b.textContent || '')
    );
    return {
      textarea: textareas[textareas.length - 1] as HTMLTextAreaElement,
      button: buttons[buttons.length - 1] as HTMLButtonElement,
    };
  }

  it('disables submit if reason too short', () => {
    const { container } = render(
      <ReportDialog note={note} open={true} onOpenChange={() => {}} onReportSubmit={() => {}} />
    );
    const { textarea, button } = getElements(container);
    fireEvent.change(textarea, { target: { value: 'short' } });
    expect(button.disabled).toBe(true);
  });

  it('disables submit while pending', async () => {
    let resolveTxn: (value?: unknown) => void = () => {};
    (runTransaction as any).mockImplementation(() => new Promise(res => { resolveTxn = res; }));

    const { container } = render(
      <ReportDialog note={note} open={true} onOpenChange={() => {}} onReportSubmit={() => {}} />
    );
    const { textarea, button } = getElements(container);
    fireEvent.change(textarea, { target: { value: 'valid reason text' } });
    fireEvent.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    resolveTxn();
  });

  it('calls onReportSubmit on success', async () => {
    (runTransaction as any).mockResolvedValue(undefined);
    const onReportSubmit = vi.fn();

    const { container } = render(
      <ReportDialog note={note} open={true} onOpenChange={() => {}} onReportSubmit={onReportSubmit} />
    );
    const { textarea, button } = getElements(container);
    fireEvent.change(textarea, { target: { value: 'valid reason text' } });
    fireEvent.click(button);
    await waitFor(() => expect(onReportSubmit).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Report Submitted' }));
  });
});

