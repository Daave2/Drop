import { describe, expect, test } from 'vitest';
import { generatePseudonym } from './pseudonym';

describe('generatePseudonym', () => {
  test('produces first adjective and noun when random is 0', () => {
    const name = generatePseudonym(() => 0);
    expect(name).toBe('Whispering Wombat');
  });

  test('produces last adjective and noun when random is near 1', () => {
    const name = generatePseudonym(() => 0.9999);
    expect(name).toBe('Phantom Dreamer');
  });
});

