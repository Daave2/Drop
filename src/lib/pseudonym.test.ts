import { describe, expect, test, vi, beforeEach } from 'vitest';
import { generatePseudonym, getOrCreatePseudonym } from './pseudonym';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('./firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: () => 'timestamp',
}));

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

describe('getOrCreatePseudonym', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns existing pseudonym', async () => {
    (getDoc as unknown as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ pseudonym: 'Existing' }),
    });
    const name = await getOrCreatePseudonym('uid1');
    expect(name).toBe('Existing');
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('honors requested name', async () => {
    (getDoc as unknown as any).mockResolvedValue({ exists: () => false });
    const name = await getOrCreatePseudonym('uid1', 'Requested');
    expect(name).toBe('Requested');
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { pseudonym: 'Requested', uid: 'uid1', createdAt: 'timestamp' },
      { merge: true },
    );
  });

  test('creates new pseudonym when none exists', async () => {
    (getDoc as unknown as any).mockResolvedValue({ exists: () => false });
    vi.spyOn(global.Math, 'random').mockReturnValue(0);
    const name = await getOrCreatePseudonym('uid1');
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { pseudonym: 'Whispering Wombat', uid: 'uid1', createdAt: 'timestamp' },
      { merge: true },
    );
    expect(name).toBe('Whispering Wombat');
  });

  test('falls back to default on error', async () => {
    (getDoc as unknown as any).mockRejectedValue(new Error('fail'));
    const name = await getOrCreatePseudonym('uid1');
    expect(name).toBe('Anonymous Adventurer');
  });
});

