// scripts/task-tools.ts
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

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
  // commits removed in Trailer Mode
};

type Data = { meta?: any; defaults?: any; tasks: Task[] };

const file = path.resolve(process.cwd(), 'todo.yaml');

function load(): Data {
  if (!fs.existsSync(file)) {
    console.error('todo.yaml not found at repo root.');
    process.exit(1);
  }
  const raw = fs.readFileSync(file, 'utf8');
  return yaml.load(raw) as Data;
}

function save(data: Data) {
  fs.writeFileSync(file, yaml.dump(data, { lineWidth: 100 }));
}

function nextId(tasks: Task[]): string {
  const seq = Math.max(0, ...tasks.map(t => Number(t.id.split('-')[1]) || 0)) + 1;
  return `ND-${String(seq).padStart(3, '0')}`;
}

const [,, cmd, ...rest] = process.argv;

if (cmd === 'next') {
  const data = load();
  const next =
    data.tasks.find(t => t.status === 'todo' && t.priority === 'P0') ??
    data.tasks.find(t => t.status === 'todo' && t.priority === 'P1') ??
    data.tasks.find(t => t.status === 'todo');
  console.log(next ? JSON.stringify(next, null, 2) : 'No pending tasks.');
} else if (cmd === 'status') {
  const [id, status] = rest as [string, Status];
  if (!id || !status) {
    console.error('usage: ts-node scripts/task-tools.ts status <ID> <status>');
    process.exit(1);
  }
  const data = load();
  const task = data.tasks.find(t => t.id === id);
  if (!task) { console.error('task not found'); process.exit(1); }
  task.status = status;
  save(data);
  console.log(`Updated ${id} ⇒ ${status}`);
} else if (cmd === 'add') {
  const title = rest.join(' ').trim();
  if (!title) {
    console.error('usage: ts-node scripts/task-tools.ts add "Title"');
    process.exit(1);
  }
  const data = load();
  const id = nextId(data.tasks);
  const task: Task = { id, title, priority: 'P2', status: 'todo' };
  data.tasks.push(task);
  save(data);
  console.log(`Added ${id}: ${title}`);
} else {
  console.log(`Usage:
  ts-node scripts/task-tools.ts next
  ts-node scripts/task-tools.ts status ND-001 doing
  ts-node scripts/task-tools.ts add "New follow-up task"
`);
}

