import * as THREE from 'three';
import type { Mood } from './behavior';

export function faceTexture(mood: Mood | 'blink' | 'squeeze', light = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ellipse = (x: number, y: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };
  const ink = light ? '#ffffff' : '#060709';
  ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 8;
  for (const x of [87, 169]) {
    ctx.lineWidth = 8;
    if (mood === 'dizzy') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 80; i++) {
        const t = i / 79, a = t * Math.PI * 3.2, r = 3 + t * 23;
        const px = x + Math.cos(a) * r, py = 80 + Math.sin(a) * r;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else if (mood === 'love') {
      ctx.beginPath(); ctx.moveTo(x, 100);
      ctx.bezierCurveTo(x - 33, 78, x - 20, 55, x, 71);
      ctx.bezierCurveTo(x + 20, 55, x + 33, 78, x, 100); ctx.fill();
    } else if (mood === 'excited') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 10 : 25;
        const px = x + Math.cos(angle) * radius, py = 80 + Math.sin(angle) * radius;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    } else if (mood === 'surprised') {
      ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, 80, 20, 26, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (mood === 'grumpy') {
      const side = x < 128 ? 1 : -1;
      ctx.save(); ctx.translate(x, 83); ctx.rotate(side * .23); ellipse(0, 0, 18, 10, ink); ctx.restore();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - side * 18, 65); ctx.lineTo(x + side * 15, 72); ctx.stroke();
    } else if (mood === 'scared') {
      ellipse(x, 83, 19, 22, ink);
      const shine = light ? '#756094' : '#ffffff';
      ellipse(x - 5, 75, 7, 8, shine); ellipse(x + 5, 93, 8, 6, shine);
      const side = x < 128 ? 1 : -1;
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - side * 19, 57); ctx.quadraticCurveTo(x, 58, x + side * 13, 49); ctx.stroke();
    } else if (mood === 'sleepy') {
      ellipse(x, 85, 17, 7, ink);
    } else if (mood === 'relaxed') {
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 17, 81); ctx.quadraticCurveTo(x, 92, x + 17, 81); ctx.stroke();
    } else if (mood === 'happy' || mood === 'blink' || (mood === 'wink' && x < 128)) {
      if (mood === 'happy') ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x - 14, 80);
      ctx.quadraticCurveTo(x, mood === 'happy' ? 53 : 89, x + 14, 80); ctx.stroke();
    } else if (mood === 'squeeze') {
      const side = x < 128 ? 1 : -1;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - side * 16, 70); ctx.lineTo(x + side * 12, 80); ctx.lineTo(x - side * 16, 90); ctx.stroke();
    } else if (mood === 'held') {
      ellipse(x, 80, 16, 24, ink);
    } else {
      ellipse(x, 80, mood === 'curious' ? 19 : 17, mood === 'curious' ? 24 : 22, ink);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function tearTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  const fill = ctx.createLinearGradient(0, 8, 0, 65);
  fill.addColorStop(0, '#d8f9ff'); fill.addColorStop(1, '#6bc9f4');
  ctx.fillStyle = fill; ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(24, 5); ctx.bezierCurveTo(20, 27, 6, 37, 7, 51);
  ctx.bezierCurveTo(8, 73, 40, 73, 41, 51); ctx.bezierCurveTo(42, 37, 28, 27, 24, 5);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffffb3'; ctx.beginPath(); ctx.ellipse(17, 49, 4, 9, .3, 0, Math.PI * 2); ctx.fill();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function softTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, '#48583b4d'); gradient.addColorStop(.5, '#48583b24'); gradient.addColorStop(.8, '#48583b08'); gradient.addColorStop(1, '#48583b00');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
