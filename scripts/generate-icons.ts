import { createCanvas, createCanvasForNode } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

function generateIcon(size: number, outputPath: string) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, size, size);

  const radius = size * 0.15;
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.roundRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8, radius);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

const iconsDir = path.join(process.cwd(), 'public/icons');
generateIcon(192, path.join(iconsDir, 'icon-192.png'));
generateIcon(512, path.join(iconsDir, 'icon-512.png'));
