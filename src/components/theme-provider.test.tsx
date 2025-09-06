/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { ThemeProvider } from './theme-provider';
import { useTheme } from 'next-themes';

function TestButton() {
  const { setTheme } = useTheme();
  return <button onClick={() => setTheme('sketch')}>switch</button>;
}

describe('ThemeProvider', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme attribute when sketch is selected', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <TestButton />
      </ThemeProvider>
    );
    fireEvent.click(getByText('switch'));
    await waitFor(() =>
      expect(document.documentElement.getAttribute('data-theme')).toBe('sketch')
    );
  });
});
