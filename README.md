# sourcestart-profiles

The Source Start contributors board. Add one small file about yourself and your card appears on the board, usually within a minute of your pull request being merged.

**This is a good first pull request.** Everyone adds their own file, so your change can never clash with anyone else's.

## Add yourself

1. Fork this repo.
2. Copy `profiles/_example.json` to a new `.json` file in `profiles/` and fill it in.
3. Commit, push to your fork, and open a pull request.

```json
{
  "name": "Your Name",
  "github_username": "your-github-username",
  "bio": "One line about you, 120 characters at most.",
  "interests": ["Python", "Web Dev"],
  "batch_year": 2029,
  "language": "Python",
  "link": "https://your-site.example",
  "fun_fact": "Something people wouldn't guess about you."
}
```

`language`, `link` and `fun_fact` are optional. Your photo comes from your GitHub account.

A check runs on your pull request. If it fails, click **Details** to see exactly what's wrong with your file.

### Rules for a profile

- The file is a `.json` file, and `github_username` matches your GitHub account.
- `name` is 2 to 50 characters, `bio` at most 120, `fun_fact` at most 100.
- `interests` has 1 to 5 short entries.
- `batch_year` is a number, like `2029`, not `"2029"`.
- `link` starts with `https://`.
- Only change your own file.

You can check it yourself before pushing:

```
npm install
npm run validate
```

## The pages

- `/` — the board: everyone's cards, with search and filters. Click a card to flip it.
- `/live` — a big-screen view, newest cards first, for showing on a screen during events.
- `/u/<username>` — your own card on a page you can share.

## Working on the site

The board is a Next.js app. You need Node 22 or newer.

```
npm install
npm run dev     # http://localhost:3000
npm test
npm run build
```

- `app/` — the pages (`page.tsx`, `live/page.tsx`, `u/[username]/`) and `api/profiles`
- `components/` — the board, the cards, and the background effects (`ShapeWaves` needs WebGPU; `Dither` is used where it isn't available)
- `lib/board.ts` — sorting, search, interest counts, and the live-arrival logic
- `lib/profiles.ts` — loads the profiles
- `scripts/validate.mjs` — the profile rules, used by the check on your pull request and by the site

Ideas if you want to work on the site: filter by batch year, statistics about everyone on the board, a better card design, or contribution counts on the cards. Open an issue with what you have in mind.

## Contributing

Fork the repo, work on a branch, and open a pull request describing what you changed and how you tested it.

If you find a bug, open an issue with the steps to reproduce it, what you expected, and what happened instead.

Part of Source Start by CSI SPIT. MIT licensed.
