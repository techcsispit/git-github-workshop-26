import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkDirectory } from './validate.mjs';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'validate-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const good = { name: 'Riya Shah', github_username: 'riya', bio: 'Hi', interests: ['Go'], batch_year: 2029 };

describe('checkDirectory', () => {
  it('passes a folder of valid profiles', async () => {
    await writeFile(path.join(dir, 'contributor-1.json'), JSON.stringify(good));
    await writeFile(path.join(dir, '_example.json'), '{ ignored }');
    expect(await checkDirectory(dir)).toEqual([]);
  });

  it('reports every problem with the file name', async () => {
    await writeFile(path.join(dir, 'riya.json'), '{ "name": "Riya", }');
    await writeFile(path.join(dir, 'me.txt'), 'hi');
    await writeFile(path.join(dir, 'amy.json'), JSON.stringify({ ...good, github_username: 'amy', batch_year: '2029' }));
    const problems = await checkDirectory(dir);
    expect(problems).toHaveLength(3);
    expect(problems[0]).toMatch(/^amy\.json: "batch_year"/);
    expect(problems[1]).toMatch(/^me\.txt: profiles must be \.json files/);
    expect(problems[2]).toMatch(/^riya\.json: not valid JSON/);
  });
});
