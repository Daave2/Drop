import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const svg = await fs.readFile(svgPath);
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
}
