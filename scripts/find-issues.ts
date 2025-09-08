// scripts/find-issues.ts
/**
 * Scan the repo for common issues and append fix tasks to todo.yaml.
 * Sources:
 *  - ESLint (JSON)
 *  - TypeScript (tsc --noEmit)
 *  - Vitest (--reporter=json)
 *  - madge (circular dependencies, --json)
 *  - ts-prune (unused exports)
 *  - npm audit (--json)
 *
 * Usage:
 *   ts-node scripts/find-issues.ts
 *
 * Notes:
 *  - Adds tasks only if not already present (dedup by title).
 *  - Priorities: P0 (red tests/TS errors), P1 (eslint errors, circular deps, high audit),
 *                P2 (eslint warnings, unused exports, moderate/low audit).
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { execSync } from 'node:child_process';

type Priority = 'P0' | 'P1' | 'P2';
type Status = 'todo' | 'doing' | 'pr' | 'done' | 'blocked';

type Task = {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  owner?: string;
  tags?: string[];
  files?: string[];
  steps?: string[];
  acceptance?: string[];
  notes?: string;
};

type Data = { meta?: any; defaults?: any; tasks: Task[] };

const ROOT = process.cwd();
const TODO = path.resolve(ROOT, 'todo.yaml');

function loadTodo(): Data {
  if (!fs.existsSync(TODO)) {
    console.error('todo.yaml not found at repo root.');
    process.exit(1);
  }
  const raw = fs.readFileSync(TODO, 'utf8');
  return yaml.load(raw) as Data;
}

function saveTodo(data: Data) {
  fs.writeFileSync(TODO, yaml.dump(data, { lineWidth: 100 }));
}

function nextId(tasks: Task[]): string {
  const seq = Math.max(0, ...tasks.map(t => Number(t.id.split('-')[1]) || 0)) + 1;
  return `ND-${String(seq).padStart(3, '0')}`;
}

function hasTask(data: Data, title: string): boolean {
  return !!data.tasks.find(t => t.title.trim() === title.trim());
}

/** Safely run a shell command and return stdout ('' on error). */
function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e: any) {
    // Many tools exit non-zero on findings; still return stdout/stderr
    const out = (e.stdout?.toString?.() ?? '') + '\n' + (e.stderr?.toString?.() ?? '');
    return out || '';
  }
}

function addTask(data: Data, t: Omit<Task, 'id' | 'status' | 'priority'> & { priority: Priority; status?: Status }) {
  if (hasTask(data, t.title)) return;
  const id = nextId(data.tasks);
  data.tasks.push({
    id,
    title: t.title,
    priority: t.priority,
    status: t.status ?? 'todo',
    tags: t.tags ?? [],
    files: t.files ?? [],
    steps: t.steps ?? [],
    acceptance: t.acceptance ?? [],
    notes: t.notes ?? ''
  });
  console.log(`+ Added ${id}: ${t.title}`);
}

function scanESLint(data: Data) {
  const cmd = 'npx --yes eslint . --ext .ts,.tsx --format json';
  const out = run(cmd).trim();
  if (!out) return;
  let report: any[] = [];
  try { report = JSON.parse(out); } catch { return; }
  const errors: Record<string, number> = {};
  const warnings: Record<string, number> = {};
  const filesErr = new Set<string>();
  const filesWarn = new Set<string>();

  for (const f of report) {
    const filePath = path.relative(ROOT, f.filePath);
    for (const m of f.messages as any[]) {
      const key = `${m.ruleId || m.message}`;
      if (m.severity === 2) {
        errors[key] = (errors[key] || 0) + 1;
        filesErr.add(filePath);
      } else if (m.severity === 1) {
        warnings[key] = (warnings[key] || 0) + 1;
        filesWarn.add(filePath);
      }
    }
  }

  const errTotal = Object.values(errors).reduce((a, b) => a + b, 0);
  const warnTotal = Object.values(warnings).reduce((a, b) => a + b, 0);

  if (errTotal > 0) {
    const title = `Fix ESLint errors (${errTotal}) across ${filesErr.size} files`;
    addTask(data, {
      title,
      priority: 'P1',
      tags: ['lint', 'techdebt'],
      files: Array.from(filesErr),
      steps: ['Resolve ESLint errors (severity=error).'],
      acceptance: ['eslint reports 0 errors'],
      notes: Object.entries(errors).slice(0, 10).map(([k, n]) => `${k}: ${n}`).join(', ')
    });
  }
  if (warnTotal > 0) {
    const title = `Reduce ESLint warnings (${warnTotal}) across ${filesWarn.size} files`;
    addTask(data, {
      title,
      priority: 'P2',
      tags: ['lint', 'techdebt'],
      files: Array.from(filesWarn),
      steps: ['Reduce warnings or justify rule configs.'],
      acceptance: ['eslint warnings significantly reduced or waived']
    });
  }
}

function scanTSC(data: Data) {
  const out = run('npx --yes tsc --noEmit --pretty false');
  // tsc exits non-zero on errors; parse lines like:
  // src/foo.ts(12,4): error TS1234: Message...
  const regex = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;
  let m: RegExpExecArray | null;
  const hits: { file: string; code: string; msg: string }[] = [];
  while ((m = regex.exec(out)) !== null) {
    hits.push({ file: m[1], code: `TS${m[4]}`, msg: m[5] });
  }
  if (!hits.length) return;

  const byFile: Record<string, number> = {};
  hits.forEach(h => { byFile[h.file] = (byFile[h.file] || 0) + 1; });

  const title = `Fix TypeScript compile errors (${hits.length}) in ${Object.keys(byFile).length} files`;
  addTask(data, {
    title,
    priority: 'P0',
    tags: ['typescript', 'build'],
    files: Object.keys(byFile),
    steps: ['Run `tsc --noEmit`, resolve errors.'],
    acceptance: ['tsc passes with 0 errors'],
    notes: hits.slice(0, 10).map(h => `${path.relative(ROOT, h.file)} ${h.code}: ${h.msg}`).join(' | ')
  });
}

function scanVitest(data: Data) {
  const out = run('npx --yes vitest --run --reporter=json');
  if (!out.trim()) return;
  let json: any;
  try { json = JSON.parse(out); } catch { return; }
  const total = json?.numTotalTests ?? 0;
  const failed = json?.numFailedTests ?? json?.failures?.length ?? 0;
  if (!failed) return;

  // Group failures by file
  const fileMap: Record<string, number> = {};
  const tests = json?.testResults ?? [];
  for (const t of tests) {
    if (t.status === 'failed') fileMap[path.relative(ROOT, t.name)] = (fileMap[t.name] || 0) + (t.assertionResults?.filter((a: any) => a.status === 'failed').length || 1);
  }

  const title = `Fix failing tests (${failed}/${total}) in ${Object.keys(fileMap).length} files`;
  addTask(data, {
    title,
    priority: 'P0',
    tags: ['tests'],
    files: Object.keys(fileMap),
    steps: ['Run `npm test`, fix failed assertions.'],
    acceptance: ['All tests pass locally']
  });
}

function scanMadgeCircular(data: Data) {
  // madge src --circular --json
  const out = run('npx --yes madge src --circular --json');
  if (!out.trim()) return;
  let json: any;
  try { json = JSON.parse(out); } catch { return; }
  const cycles: string[][] = json?.circular ?? json ?? [];
  if (!cycles.length) return;

  const title = `Resolve circular dependencies (${cycles.length})`;
  const files = Array.from(new Set(cycles.flat().map((p: string) => path.relative(ROOT, p))));
  addTask(data, {
    title,
    priority: 'P1',
    tags: ['arch', 'build'],
    files,
    steps: ['Break cycles using dependency inversion or local adapters.'],
    acceptance: ['madge reports 0 circular dependencies']
  });
}

function scanTsPrune(data: Data) {
  // ts-prune -p tsconfig.json  -> lines "src/foo.ts:ExportName"
  const out = run('npx --yes ts-prune -p tsconfig.json');
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;

  const byFile: Record<string, number> = {};
  for (const l of lines) {
    const [file] = l.split(':');
    if (!file) continue;
    byFile[file] = (byFile[file] || 0) + 1;
  }

  const title = `Remove unused exports (${lines.length}) across ${Object.keys(byFile).length} files`;
  addTask(data, {
    title,
    priority: 'P2',
    tags: ['cleanup', 'techdebt'],
    files: Object.keys(byFile).map(f => path.relative(ROOT, f)),
    steps: ['Delete unused exports or mark as intentional with // eslint-disable-next-line import/no-unused-modules'],
    acceptance: ['ts-prune reports 0 items (or justified ignores)']
  });
}

function scanNpmAudit(data: Data) {
  const out = run('npm audit --json');
  if (!out.trim()) return;
  let json: any;
  try { json = JSON.parse(out); } catch { return; }

  // npm v8/9 formats vary; try to infer totals
  const advisories = json.vulnerabilities || json.advisories || {};
  let critical = 0, high = 0, moderate = 0, low = 0;
  if (json.metadata?.vulnerabilities) {
    const v = json.metadata.vulnerabilities;
    critical = v.critical || 0;
    high = v.high || 0;
    moderate = v.moderate || 0;
    low = v.low || 0;
  } else if (advisories && typeof advisories === 'object') {
    for (const k of Object.keys(advisories)) {
      const sev = advisories[k]?.severity ?? 'low';
      if (sev === 'critical') critical++;
      else if (sev === 'high') high++;
      else if (sev === 'moderate') moderate++;
      else low++;
    }
  }
  const total = critical + high + moderate + low;
  if (!total) return;

  const title = `Address npm audit issues (crit:${critical} high:${high} mod:${moderate} low:${low})`;
  addTask(data, {
    title,
    priority: critical || high ? 'P1' : 'P2',
    tags: ['security', 'deps'],
    steps: [
      'Review `npm audit` and apply `npm audit fix` when safe.',
      'Pin or replace vulnerable deps; add resolutions where appropriate.'
    ],
    acceptance: ['npm audit reports 0 critical/high (or documented exceptions)']
  });
}

function main() {
  const data = loadTodo();

  console.log('Scanning ESLint…');
  scanESLint(data);

  console.log('Scanning TypeScript…');
  scanTSC(data);

  console.log('Running tests (Vitest)…');
  scanVitest(data);

  console.log('Checking circular dependencies (madge)…');
  scanMadgeCircular(data);

  console.log('Scanning unused exports (ts-prune)…');
  scanTsPrune(data);

  console.log('Auditing dependencies (npm audit)…');
  scanNpmAudit(data);

  saveTodo(data);
  console.log('\nDone. Appended any new tasks to todo.yaml');
}

main();
