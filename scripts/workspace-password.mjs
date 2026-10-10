import { readFileSync } from 'node:fs';

// Local utility: do not run in CI or deployment logs.
try {
  const entry = readFileSync('.env', 'utf8').split(/\r?\n/).find((line) => line.startsWith('TASKFLOW_ACCESS_KEY='));
  const password = entry?.slice('TASKFLOW_ACCESS_KEY='.length);
  if (!password) throw new Error('Missing password');
  console.log(password);
} catch {
  console.error('No workspace password in local .env. Check TASKFLOW_ACCESS_KEY in Netlify settings.');
  process.exitCode = 1;
}
