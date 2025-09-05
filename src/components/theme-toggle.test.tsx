/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTheme } from 'next-themes';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  it('allows selecting sketch theme', async () => {
    const setTheme = vi.fn();
    const useThemeMock = useTheme as unknown as ReturnType<typeof vi.fn>;
    useThemeMock.mockReturnValue({ setTheme });
    const { getByText } = render(<ThemeToggle />);
    fireEvent.click(getByText('Sketch'));
    expect(setTheme).toHaveBeenCalledWith('sketch');
  });
});
