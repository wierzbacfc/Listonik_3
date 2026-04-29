import fs from 'fs';
import { createCanvas } from 'canvas';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#10b981'; // bg-emerald-500
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();

  // Simple checkmark
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.5);
  ctx.lineTo(size * 0.45, size * 0.65);
  ctx.lineTo(size * 0.7, size * 0.35);
  ctx.stroke();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
}

drawIcon(192);
drawIcon(512);
drawIcon(144);
