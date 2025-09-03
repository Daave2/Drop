import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import vm from 'vm';

// Simple service worker environment
function setupSW() {
  const listeners: Record<string, (event: any) => void> = {};
  (globalThis as any).self = {
    addEventListener: (type: string, cb: (event: any) => void) => {
      listeners[type] = cb;
    },
    clients: { claim: vi.fn() },
  };

  const cachesStore = new Map<string, Map<string, Response>>();
  (globalThis as any).caches = {
    open: async (name: string) => {
      if (!cachesStore.has(name)) cachesStore.set(name, new Map());
      const store = cachesStore.get(name)!;
      return {
        match: async (req: Request) => store.get(req.url),
        put: async (req: Request, res: Response) => {
          store.set(req.url, res);
        },
        delete: async (req: Request) => {
          store.delete(req.url);
        },
      };
    },
    match: async (req: Request) => {
      for (const store of cachesStore.values()) {
        const found = store.get(req.url);
        if (found) return found;
      }
      return undefined;
    },
    keys: async () => Array.from(cachesStore.keys()),
    delete: async (name: string) => {
      cachesStore.delete(name);
    },
  };

  const code = readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8');
  vm.runInNewContext(code, {
    self: (globalThis as any).self,
    caches: (globalThis as any).caches,
    fetch: (...args: any[]) => (globalThis as any).fetch(...args),
    URL,
    Request,
    Response,
  });

  return listeners;
}

describe('service worker caching', () => {
  let listeners: Record<string, (event: any) => void>;

  beforeEach(() => {
    listeners = setupSW();
  });

  it('caches map tiles with cache-first strategy', async () => {
    const fetchMock = vi.fn(async () => new Response('tile'));
    (globalThis as any).fetch = fetchMock;

    const request = new Request('https://tile.openstreetmap.org/0/0/0.png');
    let resPromise: Promise<Response> | undefined;
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => {
        resPromise = p;
      },
    });
    await resPromise!;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second request should hit cache
    fetchMock.mockClear();
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => {
        resPromise = p;
      },
    });
    await resPromise!;
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves cached note API responses when offline', async () => {
    const fetchMock = vi.fn(async () => new Response('note-data'));
    (globalThis as any).fetch = fetchMock;

    const request = new Request('https://example.com/api/notes');
    let resPromise: Promise<Response> | undefined;
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => {
        resPromise = p;
      },
    });
    await resPromise!;
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Offline: network fails, should return cached response
    fetchMock.mockRejectedValueOnce(new Error('Network fail'));
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => {
        resPromise = p;
      },
    });
    const res = await resPromise!;
    expect(await res.text()).toBe('note-data');
  });
});
