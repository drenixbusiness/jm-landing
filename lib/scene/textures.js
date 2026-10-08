// Procedural canvas textures for the highway scene (no image downloads needed).
import * as THREE from 'three';

export const BRAND = '#0a7f6f';
const PX_PER_UNIT = 170; // guide-sign resolution

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// Small deterministic PRNG so textures look the same on every load.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toTexture(c, { repeat, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export function grassTexture() {
  const [c, g] = canvas(512, 512);
  const r = rng(7);
  g.fillStyle = '#56622f';
  g.fillRect(0, 0, 512, 512);
  // Dappled patches, drawn wrapped so the tile repeats seamlessly.
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, rad = 4 + r() * 26;
    const light = r() > 0.5;
    g.fillStyle = light ? `rgba(120,132,70,${0.05 + r() * 0.1})` : `rgba(38,46,20,${0.06 + r() * 0.14})`;
    for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) {
      g.beginPath();
      g.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
      g.fill();
    }
  }
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(150,160,90,.18)' : 'rgba(25,30,12,.22)';
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 3);
  }
  return toTexture(c, { repeat: [260, 260] });
}

// Asphalt texture covers the full road width (x -7 → 5.3) over a 24.4 m tile.
export const ROAD_X0 = -7.0;
export const ROAD_X1 = 5.3;
export const ROAD_TILE = 24.4;
export function asphaltTextures() {
  const W = 1024, H = 2048;
  const [c, g] = canvas(W, H);
  const [b, bg] = canvas(W, H); // bump map (grayscale)
  const r = rng(11);
  const px = (x) => ((x - ROAD_X0) / (ROAD_X1 - ROAD_X0)) * W;

  g.fillStyle = '#2b2f32';
  g.fillRect(0, 0, W, H);
  bg.fillStyle = '#808080';
  bg.fillRect(0, 0, W, H);

  // Lighter shoulders.
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.fillRect(0, 0, px(-5.6), H);
  g.fillRect(px(1.93), 0, W - px(1.93), H);

  // Darker wheel paths in both lanes (oil drip & polish).
  for (const lane of [-3.72, 0.05]) {
    for (const off of [-0.95, 0.95]) {
      const x = px(lane + off);
      const grad = g.createLinearGradient(x - 26, 0, x + 26, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,.22)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(x - 26, 0, 52, H);
    }
    const cx = px(lane);
    const grad = g.createLinearGradient(cx - 18, 0, cx + 18, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(cx - 18, 0, 36, H);
  }

  // Rumble strip on the right shoulder: transverse milled grooves.
  const rx0 = px(2.25), rx1 = px(2.65);
  for (let y = 0; y < H; y += 14) {
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(rx0, y, rx1 - rx0, 7);
    bg.fillStyle = '#3a3a3a';
    bg.fillRect(rx0, y, rx1 - rx0, 7);
  }

  // Aggregate grain.
  for (let i = 0; i < 160000; i++) {
    const x = r() * W, y = r() * H, v = r();
    const a = 0.08 + r() * 0.16;
    g.fillStyle = v > 0.5 ? `rgba(255,255,255,${a * 0.6})` : `rgba(0,0,0,${a})`;
    g.fillRect(x, y, 1.5, 1.5);
    bg.fillStyle = v > 0.5 ? '#a0a0a0' : '#606060';
    bg.fillRect(x, y, 1.5, 1.5);
  }

  // Crack lines (sealed cracks are darker and slightly raised).
  for (let i = 0; i < 26; i++) {
    let x = r() * W, y = r() * H;
    g.strokeStyle = `rgba(10,10,10,${0.35 + r() * 0.3})`;
    g.lineWidth = 1 + r() * 2;
    bg.strokeStyle = '#555';
    bg.lineWidth = g.lineWidth;
    g.beginPath(); bg.beginPath();
    g.moveTo(x, y); bg.moveTo(x, y);
    const transverse = r() > 0.5;
    for (let s = 0; s < 14; s++) {
      x += transverse ? 10 + r() * 14 : (r() - 0.5) * 18;
      y += transverse ? (r() - 0.5) * 12 : 12 + r() * 18;
      g.lineTo(x, y); bg.lineTo(x, y);
    }
    g.stroke(); bg.stroke();
  }

  // Patched sections.
  for (let i = 0; i < 4; i++) {
    const x = r() * W * 0.8, y = r() * H * 0.9;
    g.fillStyle = 'rgba(0,0,0,.14)';
    g.fillRect(x, y, 80 + r() * 160, 60 + r() * 120);
  }

  const map = toTexture(c, { aniso: 16 });
  const bump = toTexture(b, { srgb: false, aniso: 16 });
  for (const t of [map, bump]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}

export function gravelTexture() {
  const [c, g] = canvas(256, 512);
  const r = rng(23);
  g.fillStyle = '#6b665c';
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 70 + r() * 90;
    g.fillStyle = `rgb(${v},${v * 0.96},${v * 0.88})`;
    g.fillRect(r() * 256, r() * 512, 1 + r() * 3, 1 + r() * 3);
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function radialTexture(stops = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], size = 256) {
  const [c, g] = canvas(size, size);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return toTexture(c);
}

// Headlight pool: bright near the lamp, long soft falloff ahead.
// Headlight pool: brightest at the lamp (bottom of the texture), soft falloff to zero on every edge.
export function beamTexture() {
  const W = 64, H = 256;
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = 1 - y / (H - 1); // 0 at the lamp end, 1 at the far end
    const along = Math.pow(1 - v, 1.6) * Math.min(1, v / 0.06);
    for (let x = 0; x < W; x++) {
      const u = (x / (W - 1)) * 2 - 1;
      const spread = 0.35 + 0.65 * v; // the beam widens with distance
      const across = Math.max(0, 1 - (u * u) / (spread * spread));
      const a = along * across * across;
      const i = (y * W + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 242; img.data[i + 2] = 215;
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  return toTexture(c);
}

/* ------------------------------------------------------------------ */
/* Road signs                                                          */
/* ------------------------------------------------------------------ */

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function weather(g, w, h, seed) {
  const r = rng(seed);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)';
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
  // Grime streaks from the top edge.
  for (let i = 0; i < 18; i++) {
    const x = r() * w;
    const grad = g.createLinearGradient(0, 0, 0, h * (0.2 + r() * 0.5));
    grad.addColorStop(0, 'rgba(0,0,0,.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x, 0, 2 + r() * 6, h);
  }
}

function guidePlate(g, w, h, u) {
  roundRect(g, 0, 0, w, h, 0.22 * u);
  g.fillStyle = BRAND;
  g.fill();
  roundRect(g, 0.09 * u, 0.09 * u, w - 0.18 * u, h - 0.18 * u, 0.16 * u);
  g.lineWidth = 0.075 * u;
  g.strokeStyle = '#fff';
  g.stroke();
}

// Interstate shield: red top band "INTERSTATE", blue body with the route number.
export function drawShield(g, cx, top, size, num = '88') {
  const w = size, h = size * 1.04;
  const x = cx - w / 2;
  const path = () => {
    g.beginPath();
    g.moveTo(x + w * 0.04, top + h * 0.06);
    g.quadraticCurveTo(x + w * 0.25, top + h * 0.12, x + w / 2, top);
    g.quadraticCurveTo(x + w * 0.75, top + h * 0.12, x + w * 0.96, top + h * 0.06);
    g.bezierCurveTo(x + w * 1.06, top + h * 0.5, x + w * 0.86, top + h * 0.82, x + w / 2, top + h);
    g.bezierCurveTo(x + w * 0.14, top + h * 0.82, x - w * 0.06, top + h * 0.5, x + w * 0.04, top + h * 0.06);
    g.closePath();
  };
  path();
  g.fillStyle = '#fff';
  g.fill();
  g.save();
  g.translate(cx, top + h * 0.5);
  g.scale(0.9, 0.9);
  g.translate(-cx, -(top + h * 0.5));
  path();
  g.clip();
  g.fillStyle = '#1b3f94';
  g.fillRect(x - 10, top, w + 20, h + 10);
  g.fillStyle = '#c8202f';
  g.fillRect(x - 10, top, w + 20, h * 0.27);
  g.fillStyle = '#fff';
  g.fillRect(x - 10, top + h * 0.27, w + 20, h * 0.035);
  g.restore();
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${size * 0.13}px ${SIGN_FONT.family}`;
  g.fillText('INTERSTATE', cx, top + h * 0.15);
  g.font = `800 ${size * 0.5}px ${SIGN_FONT.family}`;
  g.fillText(num, cx, top + h * 0.62);
}

function arrowDown(g, cx, top, len, u) {
  const sw = 0.2 * u;
  g.fillStyle = '#fff';
  g.fillRect(cx - sw / 2, top, sw, len - 0.4 * u);
  g.beginPath();
  g.moveTo(cx - 0.42 * u, top + len - 0.5 * u);
  g.lineTo(cx + 0.42 * u, top + len - 0.5 * u);
  g.lineTo(cx, top + len);
  g.closePath();
  g.fill();
}

export const SIGN_FONT = { family: 'Overpass, "Arial Narrow", Arial, sans-serif' };

function text(g, str, x, y, sizePx, weight = 800, align = 'center') {
  g.font = `${weight} ${sizePx}px ${SIGN_FONT.family}`;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  g.fillText(str, x, y);
}

function fitText(g, str, maxW, sizePx, weight = 800) {
  g.font = `${weight} ${sizePx}px ${SIGN_FONT.family}`;
  const w = g.measureText(str).width;
  return w > maxW ? sizePx * (maxW / w) : sizePx;
}

// Guide sign size in world units for each design.
export const SIGN_SIZES = [
  [5.0, 3.4],
  [5.0, 3.1],
  [5.0, 3.1],
  [5.0, 3.4],
];

export function guideSignTexture(kind, logo) {
  const [wu, hu] = SIGN_SIZES[kind];
  const u = PX_PER_UNIT;
  const W = Math.round(wu * u), H = Math.round(hu * u);
  const [c, g] = canvas(W, H);
  const draw = () => {
    g.clearRect(0, 0, W, H);
    guidePlate(g, W, H, u);
    const cx = W / 2;
    if (kind === 0) {
      drawShield(g, W * 0.24, 0.32 * u, 1.15 * u);
      text(g, 'WEST', W * 0.24, 1.95 * u, 0.42 * u);
      text(g, 'Oswego', W * 0.66, 0.95 * u, 0.62 * u);
      text(g, 'Owner Operator', W * 0.66, 1.6 * u, fitText(g, 'Owner Operator', 2.6 * u, 0.42 * u));
      text(g, 'Yard', W * 0.66, 2.1 * u, 0.42 * u);
      arrowDown(g, W * 0.24, 2.2 * u, 0.9 * u, u);
      arrowDown(g, W * 0.66, 2.3 * u, 0.8 * u, u);
    } else if (kind === 1) {
      if (logo) {
        const lw = 2.3 * u, lh = lw * (logo.height / logo.width);
        g.drawImage(logo, cx - lw / 2, 0.32 * u, lw, lh);
      }
      text(g, 'Owner Operators', cx, 2.05 * u, fitText(g, 'Owner Operators', 4.3 * u, 0.6 * u));
      text(g, '$9K–$14K / Week', cx, 2.8 * u, fitText(g, '$9K–$14K / Week', 4.3 * u, 0.56 * u));
    } else if (kind === 2) {
      text(g, 'Call 24/7', cx, 0.95 * u, 0.6 * u);
      text(g, '(331) 264-8196', cx, 1.85 * u, fitText(g, '(331) 264-8196', 4.4 * u, 0.78 * u));
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.fillRect(0.6 * u, 2.12 * u, W - 1.2 * u, 0.04 * u);
      text(g, 'Dedicated Dispatcher', cx, 2.75 * u, fitText(g, 'Dedicated Dispatcher', 4.3 * u, 0.46 * u));
    } else {
      drawShield(g, W * 0.2, 0.32 * u, 1.05 * u);
      text(g, 'WEST', W * 0.2, 1.85 * u, 0.4 * u);
      text(g, '$2.80–$4.00', W * 0.62, 1.05 * u, fitText(g, '$2.80–$4.00', 2.9 * u, 0.7 * u));
      text(g, '/ Mile', W * 0.62, 1.75 * u, 0.5 * u);
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.fillRect(0.45 * u, 2.3 * u, W - 0.9 * u, 0.04 * u);
      text(g, 'No Trailer Fee · No Escrow', cx, 3.05 * u, fitText(g, 'No Trailer Fee · No Escrow', 4.3 * u, 0.44 * u));
    }
    weather(g, W, H, 31 + kind);
  };
  draw();
  const tex = toTexture(c, { aniso: 8 });
  tex.redraw = (img) => {
    if (img) logo = img;
    draw();
    tex.needsUpdate = true;
  };
  return tex;
}

export function speedLimitTexture() {
  const u = 200;
  const [c, g] = canvas(Math.round(1.6 * u), Math.round(2.0 * u));
  const W = c.width, H = c.height;
  roundRect(g, 0, 0, W, H, 0.12 * u);
  g.fillStyle = '#f4f4f0';
  g.fill();
  roundRect(g, 0.06 * u, 0.06 * u, W - 0.12 * u, H - 0.12 * u, 0.09 * u);
  g.lineWidth = 0.05 * u;
  g.strokeStyle = '#111';
  g.stroke();
  g.fillStyle = '#111';
  g.textAlign = 'center';
  g.font = `800 ${0.34 * u}px ${SIGN_FONT.family}`;
  g.fillText('SPEED', W / 2, 0.52 * u);
  g.fillText('LIMIT', W / 2, 0.9 * u);
  g.font = `800 ${0.95 * u}px ${SIGN_FONT.family}`;
  g.fillText('65', W / 2, 1.78 * u);
  weather(g, W, H, 77);
  return toTexture(c);
}

export function routeMarkerTexture() {
  const u = 200;
  const [c, g] = canvas(Math.round(1.3 * u), Math.round(1.9 * u));
  const W = c.width;
  // "WEST" cardinal plate above the shield.
  roundRect(g, 0, 0, W, 0.5 * u, 0.06 * u);
  g.fillStyle = '#f4f4f0';
  g.fill();
  g.fillStyle = '#111';
  g.textAlign = 'center';
  g.font = `800 ${0.36 * u}px ${SIGN_FONT.family}`;
  g.fillText('WEST', W / 2, 0.39 * u);
  drawShield(g, W / 2, 0.6 * u, 1.22 * u);
  return toTexture(c);
}

/* ------------------------------------------------------------------ */
/* Trailer graphics                                                    */
/* ------------------------------------------------------------------ */

export function trailerSideTexture(logo) {
  const W = 3072, H = 552; // 16.15 m × 2.9 m
  const [c, g] = canvas(W, H);
  const draw = () => {
    g.fillStyle = '#f3f4f2';
    g.fillRect(0, 0, W, H);
    // Subtle panel seams + post ribs.
    for (let x = 0; x < W; x += 112) {
      g.fillStyle = 'rgba(0,0,0,.06)';
      g.fillRect(x, 0, 3, H);
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.fillRect(x + 3, 0, 2, H);
    }
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,.05)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.08)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // Logo + message (front of trailer is at the left of the texture).
    if (logo) {
      const lh = 230, lw = lh * (logo.width / logo.height);
      g.drawImage(logo, 150, 70, lw, lh);
    }
    g.fillStyle = BRAND;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.font = `800 112px ${SIGN_FONT.family}`;
    g.fillText('OWNER OPERATORS WANTED', 150, 420);
    g.font = `800 112px ${SIGN_FONT.family}`;
    g.fillStyle = '#1d2326';
    const t = '·  (331) 264-8196';
    const w0 = (() => { g.font = `800 112px ${SIGN_FONT.family}`; return g.measureText('OWNER OPERATORS WANTED  ').width; })();
    g.fillText(t, 150 + w0, 420);
    // Accent stripe.
    g.fillStyle = BRAND;
    g.fillRect(150, 448, W - 300, 14);

    // DOT conspicuity tape: alternating red/white along the bottom.
    for (let x = 0; x < W; x += 104) {
      g.fillStyle = (x / 104) % 2 ? '#ffffff' : '#d81f2a';
      g.fillRect(x, H - 40, 104, 26);
    }
  };
  draw();
  const tex = toTexture(c, { aniso: 8 });
  tex.redraw = (img) => { if (img) logo = img; draw(); tex.needsUpdate = true; };
  return tex;
}

export function trailerRearTexture(logo) {
  const W = 512, H = 572; // 2.6 m × 2.9 m
  const [c, g] = canvas(W, H);
  const draw = () => {
    g.fillStyle = '#e9ebe8';
    g.fillRect(0, 0, W, H);
    // Door seam.
    g.fillStyle = '#9aa0a0';
    g.fillRect(W / 2 - 2, 0, 4, H);
    // Hinges.
    for (const y of [60, 200, 370, 510]) {
      g.fillStyle = '#8b9193';
      g.fillRect(0, y - 10, 34, 20);
      g.fillRect(W - 34, y - 10, 34, 20);
    }
    // Lock rods (2 per door).
    for (const x of [70, 196, 316, 442]) {
      g.fillStyle = '#7c8284';
      g.fillRect(x - 5, 10, 10, H - 20);
      g.fillStyle = '#5c6264';
      g.fillRect(x - 12, 300, 24, 16);
      g.fillRect(x - 4, 300, 8, 60);
    }
    if (logo) {
      const lw = 190, lh = lw * (logo.height / logo.width);
      g.drawImage(logo, W / 2 - lw / 2, 110, lw, lh);
    }
    // DOT tape along the bottom + vertical corners.
    for (let x = 0; x < W; x += 52) {
      g.fillStyle = (x / 52) % 2 ? '#ffffff' : '#d81f2a';
      g.fillRect(x, H - 34, 52, 22);
    }
    g.fillStyle = '#d81f2a';
    g.fillRect(4, 4, 14, 60);
    g.fillRect(W - 18, 4, 14, 60);
  };
  draw();
  const tex = toTexture(c);
  tex.redraw = (img) => { if (img) logo = img; draw(); tex.needsUpdate = true; };
  return tex;
}

export function grilleTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#15191b';
  g.fillRect(0, 0, 256, 256);
  for (let y = 8; y < 256; y += 22) {
    g.fillStyle = '#b8bfc4';
    g.fillRect(0, y, 256, 8);
    g.fillStyle = '#6e767b';
    g.fillRect(0, y + 8, 256, 3);
  }
  g.fillStyle = '#c9d0d4';
  g.fillRect(0, 0, 256, 6);
  g.fillRect(0, 250, 256, 6);
  return toTexture(c);
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
