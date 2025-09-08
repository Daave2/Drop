// scripts/task-tools.ts
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

type Task = {
  id: string; title: string; priority: 'P0'|'P1'|'P2';
  status: 'todo'|'doing'|'pr'|'done'|'blocked';
  owner?: string; files?: string[]; steps?: string[]; acceptance?: string[]; tags?: string[];
  notes?: string; branch?: string; pr?: string;
};
type Data = { meta:any; defaults?:any; tasks: Task[] };

const file = path.resolve(process.cwd(), 'todo.yaml');

function load(): Data {
  const raw = fs.readFileSync(file, 'utf8');
  return yaml.load(raw) as Data;
}
function save(data: Data) {
  fs.writeFileSync(file, yaml.dump(data, { lineWidth: 100 }));
}

const cmd = process.argv[2];

if (cmd === 'next') {
  const data = load();
  const next = data.tasks.find(t => t.status === 'todo' && t.priority === 'P0')
           ?? data.tasks.find(t => t.status === 'todo' && t.priority === 'P1')
           ?? data.tasks.find(t => t.status === 'todo');
  if (!next) { console.log('No pending tasks.'); process.exit(0); }
  console.log(JSON.stringify(next, null, 2));
} else if (cmd === 'status') {
  const id = process.argv[3];
  const status = process.argv[4] as Task['status'];
  if (!id || !status) { console.error('usage: ts-node scripts/task-tools.ts status <ID> <status>'); process.exit(1); }
  const data = load();
  const task = data.tasks.find(t => t.id === id);
  if (!task) { console.error('task not found'); process.exit(1); }
  task.status = status;
  save(data);
  console.log(`Updated ${id} ⇒ ${status}`);
} else if (cmd === 'add') {
  const title = process.argv.slice(3).join(' ').trim();
  if (!title) { console.error('usage: ts-node scripts/task-tools.ts add "Title"'); process.exit(1); }
  const data = load();
  const seq = Math.max(0, ...data.tasks.map(t => Number(t.id.split('-')[1]) || 0)) + 1;
  const id = `ND-${String(seq).padStart(3,'0')}`;
  const task: Task = { id, title, priority:'P2', status:'todo' };
  data.tasks.push(task);
  save(data);
  console.log(`Added ${id}: ${title}`);
} else {
  console.log(`Usage:
  ts-node scripts/task-tools.ts next     # print next task JSON
  ts-node scripts/task-tools.ts status ND-001 doing
  ts-node scripts/task-tools.ts add "New follow-up task"
`);
}
