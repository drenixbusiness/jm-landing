// Canvas textures for the Christmas / New Year scene.
import * as THREE from 'three';
import { BRAND, SIGN_FONT, rng } from '@/lib/scene/textures';
import { PHONE_MAIN, PHONE_OO } from '@/lib/site';

export const RED = '#c8202f';
export const GOLD = '#f2b632';
export const PINE = '#0f4a2c';
export const BULBS = ['#ff3346', '#ffcc33', '#3fb6ff', '#5cff8a', '#ff8a2a', '#ffffff'];
export const NEW_YEAR = new Date().getMonth() === 0 ? new Date().getFullYear() : new Date().getFullYear() + 1;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// Draw `fn(dx, dy)` at every wrap offset so splats crossing an edge continue on the other side.
function wrapped(w, h, fn) {
  for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) fn(dx, dy);
}

/* ------------------------------------------------------------------ */
/* Ground                                                              */
/* ------------------------------------------------------------------ */

// Repaints the grass tile in place (keeps its repeat/offset/scroll logic) as fresh snow cover.
export function paintSnowField(tex) {
  const c = tex.image;
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const r = rng(1207);
  g.fillStyle = '#e4ebf1';
  g.fillRect(0, 0, W, H);
  // Wind-shaped drifts: soft blue shadows and bright crests.
  for (let i = 0; i < 520; i++) {
    const x = r() * W, y = r() * H, rad = 6 + r() * 30;
    const shade = r() > 0.55;
    g.fillStyle = shade ? `rgba(120,145,175,${0.05 + r() * 0.09})` : `rgba(255,255,255,${0.15 + r() * 0.25})`;
    wrapped(W, H, (dx, dy) => {
      g.beginPath();
      g.ellipse(x + dx, y + dy, rad * 1.6, rad, r() * 0.4, 0, Math.PI * 2);
      g.fill();
    });
  }
  // Dry grass and twigs poking through.
  for (let i = 0; i < 420; i++) {
    const x = r() * W, y = r() * H;
    g.strokeStyle = r() > 0.4 ? 'rgba(92,86,52,.55)' : 'rgba(48,52,30,.5)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 4, y - 2 - r() * 5);
    g.stroke();
  }
  // Fine grain + sparkle.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(150,170,195,.16)';
    g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  tex.needsUpdate = true;
}

// Repaints the gravel shoulder tile: packed snow with grey slush where plough and tyres have been.
export function paintSnowShoulder(tex) {
  const c = tex.image;
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  const r = rng(77);
  g.fillStyle = '#d9e1e8';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) {
    const x = r() * W, y = r() * H, rw = 6 + r() * 26, rh = 10 + r() * 50;
    g.fillStyle = `rgba(${90 + r() * 30},${92 + r() * 30},${96 + r() * 30},${0.12 + r() * 0.22})`;
    wrapped(W, H, (dx, dy) => {
      g.beginPath();
      g.ellipse(x + dx, y + dy, rw, rh, 0, 0, Math.PI * 2);
      g.fill();
    });
  }
  for (let i = 0; i < 5000; i++) {
    const v = 90 + r() * 120;
    g.fillStyle = r() > 0.7 ? `rgba(${v},${v * 0.97},${v * 0.92},.6)` : 'rgba(255,255,255,.55)';
    g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  tex.needsUpdate = true;
}

// Plough windrow along a road edge: u = 0 on the travelled-lane side (transparent), u = 1 at the pavement edge.
export function roadDriftTexture() {
  const W = 128, H = 1024;
  const [c, g] = canvas(W, H);
  const r = rng(404);
  const img = g.createImageData(W, H);
  // 1-D value noise along v so the drift edge wanders.
  const N = 48, knots = Array.from({ length: N }, () => r());
  const noise = (v) => {
    const f = v * N, i = Math.floor(f), t = f - i;
    const a = knots[i % N], b = knots[(i + 1) % N];
    return a + (b - a) * t * t * (3 - 2 * t);
  };
  for (let y = 0; y < H; y++) {
    const v = y / H;
    const edge = 0.25 + noise(v) * 0.35 + noise(v * 3.7 % 1) * 0.12; // where the drift starts
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      let a = Math.min(1, Math.max(0, (u - edge) / 0.22));
      a = a * a * (3 - 2 * a);
      const grain = 0.85 + r() * 0.15;
      const i = (y * W + x) * 4;
      const shade = 225 + 30 * a;
      img.data[i] = shade * 0.94 * grain; img.data[i + 1] = shade * 0.97 * grain; img.data[i + 2] = shade * grain;
      img.data[i + 3] = Math.round(255 * a * (0.75 + 0.25 * grain));
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ */
/* Decorations drawn on canvases                                       */
/* ------------------------------------------------------------------ */

export function bulb(g, x, y, rad, color) {
  const glow = g.createRadialGradient(x, y, 0, x, y, rad * 3.2);
  glow.addColorStop(0, color);
  glow.addColorStop(0.35, color + '55');
  glow.addColorStop(1, color + '00');
  g.fillStyle = glow;
  g.fillRect(x - rad * 3.2, y - rad * 3.2, rad * 6.4, rad * 6.4);
  g.fillStyle = '#2a2f2c';
  g.fillRect(x - rad * 0.45, y - rad * 1.55, rad * 0.9, rad * 0.6); // socket
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rad * 0.75, rad, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.beginPath();
  g.ellipse(x - rad * 0.25, y - rad * 0.35, rad * 0.18, rad * 0.3, -0.4, 0, Math.PI * 2);
  g.fill();
}

export function snowflake(g, x, y, s, color = 'rgba(120,170,215,.55)', rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.5, s * 0.09);
  g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    g.rotate(Math.PI / 3);
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(0, -s);
    g.moveTo(0, -s * 0.55); g.lineTo(-s * 0.22, -s * 0.75);
    g.moveTo(0, -s * 0.55); g.lineTo(s * 0.22, -s * 0.75);
    g.stroke();
  }
  g.restore();
}

function holly(g, x, y, s) {
  g.save();
  g.translate(x, y);
  for (const [a, flip] of [[-0.5, 1], [0.6, -1]]) {
    g.save();
    g.rotate(a);
    g.fillStyle = '#1d6b3a';
    g.beginPath();
    g.moveTo(0, 0);
    // scalloped leaf
    for (let i = 0; i <= 4; i++) g.quadraticCurveTo(flip * (i % 2 ? s * 0.42 : s * 0.22), -s * (i + 0.5) / 4.4, 0, -s * (i + 1) / 4.4);
    for (let i = 4; i >= 0; i--) g.quadraticCurveTo(-flip * (i % 2 ? s * 0.42 : s * 0.22), -s * (i + 0.5) / 4.4, 0, -s * i / 4.4);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 0.95); g.stroke();
    g.restore();
  }
  for (const [bx, by] of [[-s * 0.12, -s * 0.05], [s * 0.12, -s * 0.08], [0, s * 0.1]]) {
    g.fillStyle = RED;
    g.beginPath(); g.arc(bx, by, s * 0.11, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)';
    g.beginPath(); g.arc(bx - s * 0.035, by - s * 0.035, s * 0.03, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// Pine garland swags with bulbs hanging along the top edge, a cap of snow above.
function topGarland(g, W, swag, sag, r) {
  // Snow lip on the roof edge.
  g.fillStyle = '#ffffff';
  for (let x = -20; x < W + 20; x += 18 + r() * 18) {
    g.beginPath();
    g.ellipse(x, 2, 18 + r() * 16, 8 + r() * 10, 0, 0, Math.PI * 2);
    g.fill();
  }
  let k = 0;
  for (let x0 = 0; x0 < W; x0 += swag, k++) {
    const x1 = x0 + swag, mid = (x0 + x1) / 2;
    // needles along the swag
    for (let t = 0; t <= 1; t += 0.02) {
      const x = x0 + (x1 - x0) * t;
      const y = 14 + 4 * sag * t * (1 - t);
      g.strokeStyle = t * 997 % 2 > 1 ? PINE : '#1b6a3c';
      g.lineWidth = 3;
      for (let n = 0; n < 5; n++) {
        const a = r() * Math.PI * 2, l = 8 + r() * 10;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }
    bulb(g, mid, 14 + sag + 22, 11, BULBS[k % BULBS.length]);
    // little red bow at each hook
    g.fillStyle = RED;
    g.beginPath(); g.ellipse(x0 - 10, 16, 12, 7, -0.4, 0, Math.PI * 2); g.ellipse(x0 + 10, 16, 12, 7, 0.4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x0, 16, 6, 0, Math.PI * 2); g.fill();
  }
}

function fit(g, str, maxW, size, weight = 800) {
  g.font = `${weight} ${size}px ${SIGN_FONT.family}`;
  const w = g.measureText(str).width;
  return w > maxW ? size * (maxW / w) : size;
}

/* ------------------------------------------------------------------ */
/* Trailer                                                             */
/* ------------------------------------------------------------------ */

// Same 16.15 m × 2.9 m layout as the stock trailer side, dressed for the holidays.
export function christmasTrailerSide(logo) {
  const W = 3072, H = 552;
  const [c, g] = canvas(W, H);
  const draw = () => {
    const r = rng(2027);
    g.fillStyle = '#f3f4f2';
    g.fillRect(0, 0, W, H);
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

    // Background snowflakes.
    for (let i = 0; i < 46; i++) snowflake(g, r() * W, 80 + r() * 300, 14 + r() * 26, 'rgba(110,165,215,.28)', r());

    topGarland(g, W, 256, 16, r);

    // Logo block.
    const lx = 140, ly = 96;
    let lw = 0;
    if (logo) {
      const lh = 190;
      lw = lh * (logo.width / logo.height);
      g.drawImage(logo, lx, ly, lw, lh);
    }

    // Greeting.
    const tx = lx + Math.max(lw, 900) + 110, maxW = W - tx - 120;
    const yearStr = ` ${NEW_YEAR}`;
    const head = 'HAPPY NEW YEAR';
    const size = fit(g, head + yearStr + '!', maxW, 168);
    g.font = `800 ${size}px ${SIGN_FONT.family}`;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillStyle = RED;
    g.fillText(head, tx, 250);
    const hw = g.measureText(head).width;
    g.fillStyle = BRAND;
    g.fillText(yearStr + '!', tx + hw, 250);
    g.font = `700 ${size * 0.36}px ${SIGN_FONT.family}`;
    g.fillStyle = '#3a4246';
    g.fillText('MERRY CHRISTMAS & SAFE MILES FROM OUR FAMILY TO YOURS', tx + 6, 320);
    holly(g, tx - 52, 190, 90);

    // Contacts.
    const line = `CALL 24/7  ${PHONE_MAIN.label}   ·   OWNER OPERATORS  ${PHONE_OO.label}   ·   JOSHUA-LLC.COM`;
    const cs = fit(g, line, W - 300, 74);
    g.font = `800 ${cs}px ${SIGN_FONT.family}`;
    g.fillStyle = '#1d2326';
    g.fillText(line, 150, 432);

    // Candy-cane accent stripe.
    g.save();
    g.beginPath();
    g.rect(150, 452, W - 300, 16);
    g.clip();
    g.fillStyle = '#ffffff';
    g.fillRect(150, 452, W - 300, 16);
    g.fillStyle = RED;
    for (let x = 150 - 40; x < W; x += 40) {
      g.beginPath();
      g.moveTo(x, 468); g.lineTo(x + 16, 452); g.lineTo(x + 32, 452); g.lineTo(x + 16, 468);
      g.fill();
    }
    g.restore();

    // DOT conspicuity tape stays (it's a legal requirement, not decoration).
    for (let x = 0; x < W; x += 104) {
      g.fillStyle = (x / 104) % 2 ? '#ffffff' : '#d81f2a';
      g.fillRect(x, H - 40, 104, 26);
    }
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.redraw = (img) => { if (img) logo = img; draw(); tex.needsUpdate = true; };
  return tex;
}

// 2.6 m × 2.9 m rear doors: logo, greeting, phone + a garland across the top.
export function christmasTrailerRear(logo) {
  const W = 512, H = 572;
  const [c, g] = canvas(W, H);
  const draw = () => {
    const r = rng(1231);
    g.fillStyle = '#e9ebe8';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#9aa0a0';
    g.fillRect(W / 2 - 2, 0, 4, H);
    for (const y of [60, 200, 370, 510]) {
      g.fillStyle = '#8b9193';
      g.fillRect(0, y - 10, 34, 20);
      g.fillRect(W - 34, y - 10, 34, 20);
    }
    for (const x of [70, 196, 316, 442]) {
      g.fillStyle = '#7c8284';
      g.fillRect(x - 5, 10, 10, H - 20);
      g.fillStyle = '#5c6264';
      g.fillRect(x - 12, 330, 24, 16);
      g.fillRect(x - 4, 330, 8, 50);
    }
    for (let i = 0; i < 10; i++) snowflake(g, 40 + r() * (W - 80), 300 + r() * 200, 8 + r() * 10, 'rgba(110,165,215,.35)', r());
    topGarland(g, W, 128, 10, r);

    if (logo) {
      const lw = 300, lh = lw * (logo.height / logo.width);
      g.fillStyle = 'rgba(233,235,232,.9)';
      g.fillRect(W / 2 - lw / 2 - 10, 92, lw + 20, lh + 16);
      g.drawImage(logo, W / 2 - lw / 2, 100, lw, lh);
    }
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(233,235,232,.92)';
    g.fillRect(40, 168, W - 80, 150);
    g.fillStyle = RED;
    g.font = `800 ${fit(g, 'HAPPY NEW YEAR', W - 100, 62)}px ${SIGN_FONT.family}`;
    g.fillText('HAPPY NEW YEAR', W / 2, 228);
    g.fillStyle = BRAND;
    g.font = `800 66px ${SIGN_FONT.family}`;
    g.fillText(String(NEW_YEAR), W / 2, 298);

    g.fillStyle = 'rgba(233,235,232,.92)';
    g.fillRect(40, 392, W - 80, 104);
    g.fillStyle = '#1d2326';
    g.font = `800 ${fit(g, PHONE_MAIN.label, W - 110, 44)}px ${SIGN_FONT.family}`;
    g.fillText(PHONE_MAIN.label, W / 2, 440);
    g.font = `700 28px ${SIGN_FONT.family}`;
    g.fillText('joshua-llc.com  ·  24/7', W / 2, 482);

    for (let x = 0; x < W; x += 52) {
      g.fillStyle = (x / 52) % 2 ? '#ffffff' : '#d81f2a';
      g.fillRect(x, H - 34, 52, 22);
    }
    g.fillStyle = '#d81f2a';
    g.fillRect(4, 40, 14, 60);
    g.fillRect(W - 18, 40, 14, 60);
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.redraw = (img) => { if (img) logo = img; draw(); tex.needsUpdate = true; };
  return tex;
}
