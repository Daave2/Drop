import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'sw.js');
  const file = await fs.readFile(filePath, 'utf8');
  return new Response(file, {
    headers: { 'Content-Type': 'application/javascript' },
  });
}
