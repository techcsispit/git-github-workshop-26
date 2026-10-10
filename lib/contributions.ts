import 'server-only';
import { graphql } from './profiles';

// Merged pull requests per person across every repo in the organisation that
// owns GITHUB_REPO, keyed by lower-case GitHub username. One search query for
// everyone (paged), not one per person, cached on the server for a few minutes.
export type Contributions = Record<string, number>;

const REPO = process.env.GITHUB_REPO; // "owner/name"
const TOKEN = process.env.GITHUB_TOKEN;
const TTL_MS = 5 * 60_000;
const MAX_PAGES = 10; // GitHub search returns at most 1,000 results

let cache: { at: number; counts: Contributions | null } | null = null;
let inflight: Promise<Contributions | null> | null = null;

export function tallyAuthors(nodes: { author?: { login: string } | null }[], into: Contributions = {}): Contributions {
  for (const node of nodes) {
    const login = node.author?.login?.toLowerCase();
    if (login) into[login] = (into[login] ?? 0) + 1; // a deleted account has no author
  }
  return into;
}

async function fromGitHub(): Promise<Contributions> {
  const q = `org:${REPO!.split('/')[0]} is:pr is:merged`;
  const counts: Contributions = {};
  let after: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const data = await graphql(
      `query($q: String!, $after: String) {
        search(query: $q, type: ISSUE, first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { ... on PullRequest { author { login } } }
        }
      }`,
      { q, after },
    );
    tallyAuthors(data.search.nodes, counts);
    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  }
  return counts;
}

// null means "no counts": GitHub isn't configured or didn't answer. The board
// then shows no numbers instead of failing.
export async function getContributions(): Promise<Contributions | null> {
  if (!REPO || !TOKEN) return null;
  if (cache && Date.now() - cache.at < TTL_MS) return cache.counts;
  inflight ??= refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function refresh(): Promise<Contributions | null> {
  try {
    cache = { at: Date.now(), counts: await fromGitHub() };
  } catch (error) {
    console.error('Could not count contributions:', error);
    // Keep the last good tally if there is one; either way, don't retry on every request.
    cache = { at: Date.now(), counts: cache?.counts ?? null };
  }
  return cache.counts;
}
