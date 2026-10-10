import { afterEach, describe, expect, it, vi } from 'vitest';

const getContributions = vi.fn();
vi.mock('@/lib/contributions', () => ({ getContributions: () => getContributions() }));

afterEach(() => getContributions.mockReset());

describe('GET /api/contributions', () => {
  it('returns the merged pull request counts and is never cached by the browser', async () => {
    getContributions.mockResolvedValue({ riya: 3 });
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ counts: { riya: 3 } });
  });

  it('returns no counts when GitHub is unavailable', async () => {
    getContributions.mockResolvedValue(null);
    const { GET } = await import('./route');
    expect(await (await GET()).json()).toEqual({ counts: null });
  });
});
