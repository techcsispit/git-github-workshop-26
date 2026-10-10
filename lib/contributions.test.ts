import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pr = (login: string | null) => ({ author: login === null ? null : { login } });
const page = (logins: (string | null)[], endCursor: string | null = null) => ({
  data: { search: { pageInfo: { hasNextPage: endCursor !== null, endCursor }, nodes: logins.map(pr) } },
});

let fetchMock: ReturnType<typeof vi.fn>;

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  return import('./contributions');
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('tallyAuthors', () => {
  it('counts merged pull requests per person, ignoring capital letters and deleted accounts', async () => {
    const { tallyAuthors } = await load({});
    expect(tallyAuthors([pr('Riya'), pr('riya'), pr('amy'), pr(null)])).toEqual({ riya: 2, amy: 1 });
  });

  it('adds to an existing tally, page after page', async () => {
    const { tallyAuthors } = await load({});
    expect(tallyAuthors([pr('amy')], { amy: 2 })).toEqual({ amy: 3 });
  });
});

describe('getContributions', () => {
  const env = { GITHUB_REPO: 'techcsispit/git-github-workshop-26', GITHUB_TOKEN: 'secret' };
  const ok = (body: unknown) => ({ ok: true, json: async () => body });

  it('makes one org-wide search, not one request per person, following every page', async () => {
    fetchMock.mockResolvedValueOnce(ok(page(['riya', 'amy'], 'c1'))).mockResolvedValueOnce(ok(page(['Riya'])));
    const { getContributions } = await load(env);

    expect(await getContributions()).toEqual({ riya: 2, amy: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
    expect(bodies[0].variables).toEqual({ q: 'org:techcsispit is:pr is:merged', after: null });
    expect(bodies[1].variables).toEqual({ q: 'org:techcsispit is:pr is:merged', after: 'c1' });
  });

  it('caches the tally between requests', async () => {
    fetchMock.mockResolvedValue(ok(page(['riya'])));
    const { getContributions } = await load(env);
    await getContributions();
    await getContributions();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shares one GitHub call between requests that arrive together', async () => {
    fetchMock.mockResolvedValue(ok(page(['riya'])));
    const { getContributions } = await load(env);
    const [a, b] = await Promise.all([getContributions(), getContributions()]);
    expect(a).toEqual({ riya: 1 });
    expect(b).toEqual({ riya: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives no counts, rather than an error, when GitHub is unavailable', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    const { getContributions } = await load(env);
    await expect(getContributions()).resolves.toBeNull();
  });

  it('gives no counts without a token, and never calls GitHub', async () => {
    const { getContributions } = await load({ GITHUB_REPO: env.GITHUB_REPO, GITHUB_TOKEN: undefined });
    expect(await getContributions()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
