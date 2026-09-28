// Checks the files in profiles/. Run with `npm run validate`.
// The site uses checkProfile() too, and leaves out any profile that fails it.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USERNAME = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const REQUIRED = ['name', 'github_username', 'bio', 'interests', 'batch_year'];
const OPTIONAL = ['language', 'link', 'fun_fact'];

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function checkProfile(p, fileName) {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return ['the file should contain one { ... } object'];

  const errors = [];
  for (const key of REQUIRED) if (!(key in p)) errors.push(`missing "${key}"`);
  for (const key of Object.keys(p)) {
    if (!REQUIRED.includes(key) && !OPTIONAL.includes(key)) errors.push(`unknown field "${key}" (check the spelling)`);
  }
  if (errors.length) return errors;

  if (!isText(p.name, 50) || p.name.trim().length < 2) errors.push('"name" must be 2-50 characters');
  if (typeof p.github_username !== 'string' || !USERNAME.test(p.github_username)) {
    errors.push('"github_username" is not a valid GitHub username');
  }
  if (!isText(p.bio, 120)) errors.push('"bio" must be 1-120 characters');
  if (!Array.isArray(p.interests) || p.interests.length < 1 || p.interests.length > 5 || !p.interests.every(i => isText(i, 24))) {
    errors.push('"interests" must be a list of 1-5 short words, like ["Python", "Music"]');
  }
  if (!Number.isInteger(p.batch_year) || p.batch_year < 2020 || p.batch_year > 2035) {
    errors.push('"batch_year" must be a number like 2029, without quotes');
  }
  if ('language' in p && !isText(p.language, 20)) errors.push('"language" must be 1-20 characters');
  if ('fun_fact' in p && !isText(p.fun_fact, 100)) errors.push('"fun_fact" must be 1-100 characters');
  if ('link' in p && !(typeof p.link === 'string' && /^https:\/\/[^\s]+$/.test(p.link))) {
    errors.push('"link" must start with https://');
  }
  return errors;
}

export async function checkDirectory(dir) {
  const problems = [];
  for (const file of (await readdir(dir)).sort()) {
    if (file.startsWith('_') || file.startsWith('.')) continue;
    if (!file.endsWith('.json')) {
      problems.push(`${file}: profiles must be .json files`);
      continue;
    }
    let profile;
    try {
      profile = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
    } catch (e) {
      problems.push(`${file}: not valid JSON (${e.message}). Look for a missing comma or quote.`);
      continue;
    }
    for (const error of checkProfile(profile, file)) problems.push(`${file}: ${error}`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.env.PROFILES_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'profiles');
  const problems = await checkDirectory(dir);
  for (const p of problems) console.log(p);
  if (problems.length) process.exit(1);
  console.log('All profiles are valid.');
}
