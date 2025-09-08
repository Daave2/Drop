// scripts/task-trailers.ts
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type Task = { id: string; title: string; status: string; priority: string };

function loadTasks(): Task[] {
  const file = path.resolve(process.cwd(), 'todo.yaml');
  const raw = fs.readFileSync(file, 'utf8');
  const data = yaml.load(raw) as any;
  return (data.tasks ?? []) as Task[];
}

function getAllCommitsRaw(): string {
  // subject, trailers, and body (so we catch trailers even if not parsed)
  return execSync('git log --pretty=format:%H%n%s%n%b%n---END---', { encoding: 'utf8' });
}

function parseCommitsByTask(tasks: Task[]) {
  const raw = getAllCommitsRaw();
  const chunks = raw.split('---END---\n').filter(Boolean);
  const map: Record<string, { sha: string; subject: string }[]> = {};
  const idSet = new Set(tasks.map(t => t.id));
  for (const c of chunks) {
    const lines = c.trimEnd().split('\n');
    const sha = lines.shift() || '';
    const subject = (lines.shift() || '').trim();
    const body = lines.join('\n');
    // Find Task-ID trailer anywhere in subject/body
    const match = (subject + '\n' + body).match(/Task-ID:\s*(ND-\d{3})/i);
    if (!match) continue;
    const id = match[1].toUpperCase();
    if (!idSet.has(id)) continue;
    (map[id] = map[id] || []).push({ sha, subject });
  }
  return map;
}

function report() {
  const tasks = loadTasks();
  const commitsByTask = parseCommitsByTask(tasks);
  for (const t of tasks) {
    const list = commitsByTask[t.id] || [];
    console.log(`\n${t.id} — ${t.title} [${t.status}/${t.priority}]`);
    if (!list.length) {
      console.log('  (no commits found with trailer Task-ID)');
      continue;
    }
    for (const c of list) {
      console.log(`  • ${c.sha.slice(0, 8)}  ${c.subject}`);
    }
  }
}

function verify() {
  const tasks = loadTasks();
  const commitsByTask = parseCommitsByTask(tasks);
  let ok = true;
  for (const t of tasks) {
    if ((t.status === 'doing' || t.status === 'done') && !(commitsByTask[t.id]?.length)) {
      ok = false;
      console.log(`WARN: ${t.id} is ${t.status} but has no commits with trailer Task-ID.`);
    }
  }
  if (ok) console.log('All doing/done tasks have at least one commit with Task-ID trailer.');
}

const [, , cmd] = process.argv;
if (cmd === 'report') report();
else if (cmd === 'verify') verify();
else {
  console.log(`Usage:
  ts-node scripts/task-trailers.ts report   # list commits per task
  ts-node scripts/task-trailers.ts verify   # warn if doing/done tasks lack commits
`);
}

