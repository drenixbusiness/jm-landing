// Tractor + 53' dry van trailer.
// A procedural Cascadia-style tractor is always available, so the scene never depends on the GLB.
// When /assets/cascadia.glb exists it is loaded, auto-fitted and faded in instead.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { trailerSideTexture, trailerRearTexture, grilleTexture, loadImage } from './textures.js';
import { bakeGeometry } from './merge.js';

export const TRUCK_FRONT_Z = -9.45;
export const WHEEL_R = 0.52;

export const MAT = {
  // Frozen Deep Green Metallic: deep green with metallic flake under a satin ("frozen" / matte) clear coat.
  paint: () => new THREE.MeshPhysicalMaterial({ color: '#0e2a21', metalness: 0.62, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.42, sheen: 0.15, sheenColor: '#2a5c49', sheenRoughness: 0.7 }),
  // 75% tint: only ~25% of light passes through, so the glass reads almost black with sharp reflections.
  glass: () => new THREE.MeshPhysicalMaterial({ color: '#030506', transparent: true, opacity: 0.85, roughness: 0.04, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
  chrome: () => new THREE.MeshStandardMaterial({ color: '#dfe4e8', metalness: 1, roughness: 0.16 }),
  alu: () => new THREE.MeshStandardMaterial({ color: '#c3c8cc', metalness: 0.8, roughness: 0.34 }),
  black: () => new THREE.MeshStandardMaterial({ color: '#121416', roughness: 0.7, metalness: 0.1 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: '#141516', roughness: 0.92 }),
};

function box(w, h, d, mat, x, y, z, rounded = 0) {
  const g = rounded ? new RoundedBoxGeometry(w, h, d, 2, rounded) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Extrude a side profile (u = -z forward, v = y) across the truck width.
function profileMesh(points, width, mat, bevel = 0.08, holes = []) {
  const shape = new THREE.Shape();
  points.forEach((p, i) => {
    if (p.arc) shape.absarc(p.arc[0], p.arc[1], p.arc[2], p.arc[3], p.arc[4], p.arc[5]);
    else if (p.q) shape.quadraticCurveTo(p.q[0], p.q[1], p.q[2], p.q[3]);
    else if (i === 0) shape.moveTo(p[0], p[1]);
    else shape.lineTo(p[0], p[1]);
  });
  holes.forEach((h) => shape.holes.push(h));
  const depth = width - bevel * 2;
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 18 });
  g.rotateY(Math.PI / 2); // shape x → world -z (u = -z), extrusion → world +x
  g.translate(-depth / 2, 0, 0);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function sidePolygon(pts, x, mat) {
  // pts in (u, v); returns two meshes, one per side of the cab.
  const out = [];
  for (const side of [1, -1]) {
    const s = new THREE.Shape();
    pts.forEach(([u, v], i) => (i ? s.lineTo(side * u, v) : s.moveTo(side * u, v)));
    const g = new THREE.ShapeGeometry(s);
    g.rotateY(side * Math.PI / 2);
    const m = new THREE.Mesh(g, mat);
    m.position.x = side * x;
    out.push(m);
  }
  return out;
}

// ---- Realistic truck wheel: lathe-turned tyre (rounded shoulders + tread), dished rim, hub and lug nuts.
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

let WHEEL_MATS = null;
function wheelMats() {
  if (WHEEL_MATS) return WHEEL_MATS;
  // Lathe UVs: u runs around the tyre, v runs across the profile (bead → sidewall → tread → sidewall → bead).
  const treadBump = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    const t0 = h * 0.36, t1 = h * 0.64; // tread band
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, t0, w, t1 - t0);
    g.fillStyle = '#3a3a3a';
    for (const f of [0.43, 0.5, 0.57]) g.fillRect(0, h * f - 1.5, w, 3); // circumferential grooves
    for (let x = 0; x < w; x += 16) { // block sipes
      g.fillRect(x, t0, 3, h * 0.07);
      g.fillRect(x + 8, t1 - h * 0.07, 3, h * 0.07);
    }
    g.fillStyle = '#8c8c8c'; // sidewall lettering ridge
    g.fillRect(0, h * 0.2, w, 2);
    g.fillRect(0, h * 0.8, w, 2);
  }, false);
  const rimMap = canvasTex(512, 128, (g, w, h) => {
    // v = 0 at the hub, 1 at the rim lip.
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#7d858b');
    grad.addColorStop(0.3, '#c3c9cd');
    grad.addColorStop(0.75, '#a9b0b5');
    grad.addColorStop(1, '#d4d9dc');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e2124';
    for (let i = 0; i < 10; i++) { // hand holes
      g.beginPath();
      g.ellipse((i + 0.5) * (w / 10), h * 0.6, w / 42, h * 0.09, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  WHEEL_MATS = {
    rubber: new THREE.MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.94, metalness: 0, bumpMap: treadBump, bumpScale: 2.2, side: THREE.DoubleSide }),
    rim: new THREE.MeshStandardMaterial({ map: rimMap, metalness: 0.95, roughness: 0.22, side: THREE.DoubleSide }),
    hub: new THREE.MeshStandardMaterial({ color: '#3a3f43', metalness: 0.7, roughness: 0.45 }),
    lug: new THREE.MeshStandardMaterial({ color: '#e6eaed', metalness: 1, roughness: 0.2 }),
  };
  return WHEEL_MATS;
}

const wheelGeoCache = new Map();
function wheelGeos(width) {
  const key = width.toFixed(3);
  if (wheelGeoCache.has(key)) return wheelGeoCache.get(key);
  const R = WHEEL_R, h = width / 2;
  const tyreProfile = [
    [0.3, -h * 0.82], [0.36, -h * 0.97], [0.43, -h], [0.48, -h * 0.96], [R - 0.012, -h * 0.82], [R - 0.002, -h * 0.62],
    [R, -h * 0.3], [R, h * 0.3], [R - 0.002, h * 0.62], [R - 0.012, h * 0.82], [0.48, h * 0.96], [0.43, h], [0.36, h * 0.97], [0.3, h * 0.82],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tyre = new THREE.LatheGeometry(tyreProfile, 48).rotateZ(-Math.PI / 2); // axis → x
  const d = h * 0.55; // rim face sits recessed inside the tyre
  const rimProfile = [[0.001, d + 0.02], [0.085, d + 0.02], [0.1, d], [0.17, d - 0.02], [0.26, d - 0.045], [0.295, d - 0.03], [0.305, d - 0.07], [0.3, -d]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const rim = new THREE.LatheGeometry(rimProfile, 40).rotateZ(-Math.PI / 2);
  const hub = new THREE.CylinderGeometry(0.075, 0.085, 0.07, 20).rotateZ(Math.PI / 2).translate(d + 0.05, 0, 0);
  const lugs = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    lugs.push(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 6).rotateZ(Math.PI / 2).translate(d + 0.035, Math.cos(a) * 0.115, Math.sin(a) * 0.115));
  }
  const geos = { tyre, rim, hub, lugs: mergeGeometries(lugs) };
  wheelGeoCache.set(key, geos);
  return geos;
}

// outward = +1 when the wheel's face points to +x (right side), -1 for the left side.
function wheel(_mats, width = 0.3, outward = 1) {
  const m = wheelMats();
  const geo = wheelGeos(width);
  const g = new THREE.Group();
  const add = (geometry, mat, shadow = false) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    if (outward < 0) mesh.rotation.y = Math.PI;
    g.add(mesh);
  };
  add(geo.tyre, m.rubber, true);
  add(geo.rim, m.rim);
  add(geo.hub, m.hub);
  add(geo.lugs, m.lug);
  return g;
}

export function buildTractor() {
  const mats = {
    paint: MAT.paint(),
    glass: MAT.glass(),
    chrome: MAT.chrome(),
    alu: MAT.alu(),
    black: MAT.black(),
    rubber: MAT.rubber(),
    head: new THREE.MeshStandardMaterial({ color: '#cfd6da', emissive: '#fff4dc', emissiveIntensity: 0, metalness: 0.6, roughness: 0.2 }),
    lens: new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.02, clearcoat: 1, emissive: '#fff4dc', emissiveIntensity: 0, depthWrite: false }),
    marker: new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ff9d00', emissiveIntensity: 0.4 }),
    grille: new THREE.MeshStandardMaterial({ map: grilleTexture(), metalness: 0.7, roughness: 0.3 }),
  };
  const truck = new THREE.Group();
  truck.name = 'tractor';
  const wheels = [];

  // Frame rails.
  truck.add(box(0.2, 0.3, 8.6, mats.black, -0.46, 0.98, -4.85));
  truck.add(box(0.2, 0.3, 8.6, mats.black, 0.46, 0.98, -4.85));

  // Hood with front wheel arches.
  const arch = { arc: [8.1, 0.55, 0.7, Math.PI, 0, true] };
  const hood = profileMesh([
    [9.42, 0.6], [9.42, 1.7], { q: [9.4, 1.98, 8.85, 2.04] }, [7.0, 2.3], [7.0, 0.6], [7.4, 0.6], arch, [9.42, 0.6],
  ], 2.42, mats.paint, 0.12);
  truck.add(hood);

  // Cab + raised-roof sleeper.
  const cab = profileMesh([
    [7.02, 1.15], [7.02, 2.3], [6.95, 2.34], [5.95, 3.16], { q: [5.78, 3.27, 5.45, 3.28] }, [5.05, 3.3],
    { q: [4.6, 3.42, 4.35, 3.97] }, [4.1, 4.0], [4.0, 3.9], [4.0, 1.15], [7.02, 1.15],
  ], 2.48, mats.paint, 0.1);
  truck.add(cab);

  // Windshield (raked) and side glass.
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.32), mats.glass);
  ws.name = 'parabrisa';
  ws.position.set(0, 2.75, -6.43);
  ws.rotation.x = -(Math.PI / 2 + Math.atan2(0.82, 1.0));
  ws.position.y += 0.035;
  ws.position.z -= 0.03;
  truck.add(ws);
  sidePolygon([[6.86, 2.42], [6.02, 3.08], [5.18, 3.08], [5.18, 2.34]], 1.245, mats.glass).forEach((m) => truck.add(m));
  sidePolygon([[4.85, 2.62], [4.85, 2.98], [4.35, 2.98], [4.35, 2.62]], 1.245, mats.glass).forEach((m) => truck.add(m));
  // Door seams.
  sidePolygon([[6.95, 1.2], [6.95, 2.36], [6.9, 2.36], [6.9, 1.2]], 1.246, mats.black).forEach((m) => truck.add(m));
  sidePolygon([[5.1, 1.2], [5.1, 3.12], [5.06, 3.12], [5.06, 1.2]], 1.246, mats.black).forEach((m) => truck.add(m));

  // Sun visor.
  truck.add(box(2.3, 0.07, 0.36, mats.paint, 0, 3.25, -6.0, 0.02));

  // Grille + chrome surround.
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.82), mats.grille);
  grille.position.set(0, 1.3, -9.555);
  grille.rotation.y = Math.PI;
  truck.add(grille);
  truck.add(box(1.36, 0.08, 0.08, mats.chrome, 0, 1.75, -9.52));
  truck.add(box(1.36, 0.08, 0.08, mats.chrome, 0, 0.87, -9.52));
  truck.add(box(0.07, 0.95, 0.08, mats.chrome, -0.67, 1.31, -9.52));
  truck.add(box(0.07, 0.95, 0.08, mats.chrome, 0.67, 1.31, -9.52));

  // Bumper.
  truck.add(box(2.52, 0.48, 0.34, mats.chrome, 0, 0.6, -9.42, 0.08));

  // Swept headlights (named like the GLB so the scene treats both the same).
  for (const s of [-1, 1]) {
    const h = box(0.42, 0.24, 0.14, mats.head, s * 0.9, 1.22, -9.5, 0.04);
    h.name = `head_light_${s > 0 ? 'R' : 'L'}`;
    truck.add(h);
    const lens = box(0.48, 0.3, 0.2, mats.lens, s * 0.9, 1.22, -9.52, 0.06);
    lens.name = `glass_lighting_${s > 0 ? 'R' : 'L'}`;
    lens.castShadow = false;
    truck.add(lens);
    // Cab-roof amber markers.
    truck.add(box(0.12, 0.05, 0.06, mats.marker, s * 0.35, 3.32, -6.17));
    truck.add(box(0.12, 0.05, 0.06, mats.marker, s * 0.7, 3.32, -6.17));
  }
  truck.add(box(0.12, 0.05, 0.06, mats.marker, 0, 3.32, -6.17));

  // Mirrors.
  for (const s of [-1, 1]) {
    truck.add(box(0.26, 0.04, 0.04, mats.black, s * 1.36, 2.42, -6.72));
    truck.add(box(0.06, 0.5, 0.2, mats.black, s * 1.5, 2.55, -6.72, 0.02));
    truck.add(box(0.03, 0.06, 0.22, mats.chrome, s * 1.25, 1.8, -5.6));
  }

  // Chassis skirts (between front and drive wheels) and cab extenders.
  for (const s of [-1, 1]) {
    truck.add(box(0.06, 0.82, 3.55, mats.paint, s * 1.2, 0.78, -5.15, 0.025));
    truck.add(box(0.05, 2.5, 0.9, mats.paint, s * 1.2, 2.65, -3.55, 0.02));
    // Steps.
    truck.add(box(0.12, 0.05, 0.5, mats.alu, s * 1.24, 0.62, -6.3));
  }

  // Fifth wheel.
  truck.add(box(1.5, 0.12, 1.2, mats.black, 0, 1.2, -1.95));

  // Mud flaps.
  for (const s of [-1, 1]) truck.add(box(0.55, 0.72, 0.03, mats.black, s * 0.95, 0.6, -0.68));

  // Wheels: steer axle + tandem drive axles with duals.
  for (const s of [-1, 1]) {
    const w = wheel(mats, 0.32, s);
    w.position.set(s * 1.02, WHEEL_R, -8.1);
    truck.add(w);
    wheels.push(w);
    for (const z of [-2.6, -1.3]) {
      for (const x of [0.74, 1.06]) {
        const d = wheel(mats, 0.28, s);
        d.position.set(s * x, WHEEL_R, z);
        truck.add(d);
        wheels.push(d);
      }
    }
  }

  truck.userData = { wheels, headMats: [mats.head], lensMats: [mats.lens] };
  return truck;
}

export function buildTrailer(logoColorSrc) {
  const sideTex = trailerSideTexture(null);
  const rearTex = trailerRearTexture(null);
  if (logoColorSrc) {
    loadImage(logoColorSrc).then((img) => { sideTex.redraw(img); rearTex.redraw(img); }).catch(() => {});
  }
  const white = new THREE.MeshStandardMaterial({ color: '#f3f4f2', roughness: 0.45, metalness: 0.05 });
  const side = new THREE.MeshStandardMaterial({ map: sideTex, color: '#e4e6e4', roughness: 0.42, metalness: 0.08 });
  const rear = new THREE.MeshStandardMaterial({ map: rearTex, roughness: 0.5, metalness: 0.1 });
  const under = new THREE.MeshStandardMaterial({ color: '#4a4f52', roughness: 0.8 });
  const mats = { alu: MAT.alu(), black: MAT.black(), rubber: MAT.rubber() };
  const tail = new THREE.MeshStandardMaterial({ color: '#7a0b10', emissive: '#ff1a1a', emissiveIntensity: 0.6 });

  const L = 16.15, z0 = -2.85, zc = z0 + L / 2, zr = z0 + L;
  const t = new THREE.Group();
  t.name = 'trailer';
  const wheels = [];

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.9, L), [side, side, white, under, rear, white]);
  body.position.set(0, 1.27 + 1.45, zc);
  body.castShadow = true;
  body.receiveShadow = true;
  t.add(body);

  // Aluminium top + bottom rails, rear corner posts.
  for (const s of [-1, 1]) {
    t.add(box(0.06, 0.08, L, mats.alu, s * 1.31, 4.15, zc));
    t.add(box(0.06, 0.18, L, mats.alu, s * 1.31, 1.33, zc));
    t.add(box(0.1, 2.9, 0.1, mats.alu, s * 1.27, 2.72, zr - 0.02));
  }
  t.add(box(2.64, 0.12, 0.1, mats.alu, 0, 4.14, zr - 0.02));
  t.add(box(2.64, 0.16, 0.1, mats.alu, 0, 1.32, zr - 0.02));

  // Aero side skirts.
  for (const s of [-1, 1]) t.add(box(0.03, 0.68, 8.6, white, s * 1.26, 0.85, 5.9));

  // Landing gear.
  for (const s of [-1, 1]) {
    t.add(box(0.12, 0.95, 0.12, mats.black, s * 0.85, 0.72, 0.9));
    t.add(box(0.3, 0.05, 0.3, mats.black, s * 0.85, 0.25, 0.9));
  }

  // Sliding tandem subframe + axles with duals.
  t.add(box(1.2, 0.3, 3.4, mats.black, 0, 1.1, 11.6));
  for (const z of [11.0, 12.25]) {
    t.add(box(1.9, 0.12, 0.12, mats.black, 0, WHEEL_R, z));
    for (const s of [-1, 1]) {
      for (const x of [0.78, 1.08]) {
        const w = wheel(mats, 0.28, s);
        w.position.set(s * x, WHEEL_R, z);
        t.add(w);
        wheels.push(w);
      }
    }
  }
  for (const s of [-1, 1]) t.add(box(0.6, 0.7, 0.03, mats.black, s * 0.95, 0.55, 12.95));

  // ICC (rear impact guard) bumper.
  const icc = box(2.3, 0.12, 0.12, mats.alu, 0, 0.6, zr - 0.1);
  t.add(icc);
  for (const s of [-1, 1]) t.add(box(0.1, 0.6, 0.1, mats.alu, s * 0.7, 0.92, zr - 0.15));
  const tape = new THREE.MeshStandardMaterial({ color: '#d81f2a', emissive: '#ff2a2a', emissiveIntensity: 0.15 });
  t.add(box(2.3, 0.05, 0.02, tape, 0, 0.6, zr - 0.035));

  // LED tail lights + top clearance lights.
  for (const s of [-1, 1]) {
    for (const x of [0.92, 1.1]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), tail);
      l.rotation.x = Math.PI / 2;
      l.position.set(s * x, 1.62, zr + 0.015);
      t.add(l);
    }
  }
  for (const x of [-0.18, 0, 0.18]) t.add(box(0.08, 0.04, 0.03, tail, x, 4.05, zr + 0.01));

  t.userData = { wheels, tailMat: tail };
  return t;
}

/* ------------------------------------------------------------------ */
/* GLB loading + auto-fit                                              */
/* ------------------------------------------------------------------ */

export async function loadCascadia(url, { mobile = false } = {}) {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js'),
  ]);
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  return fitModel(gltf.scene, mobile);
}

// Sketchfab exports put the meaningful name on a parent node ("head light casca _4" → "Object_13"),
// so match against the whole ancestor chain plus the material name.
const pathName = (o) => {
  let s = Array.isArray(o.material) ? o.material.map((m) => m.name).join(' ') : o.material?.name || '';
  for (let p = o; p; p = p.parent) s += ' ' + (p.name || '');
  return s;
};

const RE_GLASS = /parabrisa|vidrio\s*0|glass\s*0*03|glass1/i;
const RE_HEAD = /head\s*_?light/i;
const RE_LENS = /glass\s*_?lighting/i;
const RE_TIRE = /rueda|wheel|llanta|neumatic|tire|tyre/i;
const RE_HUB = /torus/i;

function meshCenter(o, root) {
  const box = new THREE.Box3().setFromObject(o);
  return root.worldToLocal(box.getCenter(new THREE.Vector3()));
}

function fitModel(model, mobile) {
  const root = new THREE.Group();
  root.add(model);
  model.updateMatrixWorld(true);
  let b = new THREE.Box3().setFromObject(model);
  let size = b.getSize(new THREE.Vector3());
  if (size.x > size.z) {
    model.rotation.y = Math.PI / 2;
    model.updateMatrixWorld(true);
    b = new THREE.Box3().setFromObject(model);
    size = b.getSize(new THREE.Vector3());
  }
  const withTrailer = size.z / Math.max(size.x, 0.001) > 5;
  const s = (withTrailer ? 22.8 : 8.9) / size.z;
  model.scale.multiplyScalar(s);
  model.updateMatrixWorld(true);
  b = new THREE.Box3().setFromObject(model);
  const midZ = (b.min.z + b.max.z) / 2;

  // Which end is the hood? Prefer the windshield (it sits ahead of centre on a conventional tractor),
  // then the axle layout (single steer axle at the front), then the lower end.
  let frontSign = 0;
  const shields = [], hubs = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    const n = pathName(o);
    if (/parabrisa/i.test(n)) shields.push(o);
    if (RE_HUB.test(n)) hubs.push(o);
  });
  if (shields.length) {
    const c = new THREE.Box3().setFromObject(shields[0]).getCenter(new THREE.Vector3());
    frontSign = c.z < midZ ? -1 : 1;
  } else if (hubs.length >= 4) {
    const zs = hubs.map((h) => new THREE.Box3().setFromObject(h).getCenter(new THREE.Vector3()).z);
    const lo = zs.filter((z) => z < midZ).length, hi = zs.length - lo;
    frontSign = lo < hi ? -1 : 1;
  } else {
    const span = b.max.z - b.min.z;
    let topMin = -Infinity, topMax = -Infinity;
    const v = new THREE.Vector3();
    model.traverse((o) => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 3000));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        if (v.z < b.min.z + span * 0.35) topMin = Math.max(topMin, v.y);
        else if (v.z > b.max.z - span * 0.35) topMax = Math.max(topMax, v.y);
      }
    });
    frontSign = topMin <= topMax ? -1 : 1;
  }
  if (frontSign > 0) model.rotation.y += Math.PI; // hood was at +z; make it face -z
  model.updateMatrixWorld(true);
  b = new THREE.Box3().setFromObject(model);
  model.position.x -= (b.min.x + b.max.x) / 2;
  model.position.y -= b.min.y;
  model.position.z += TRUCK_FRONT_Z - b.min.z;
  model.updateMatrixWorld(true);
  root.updateMatrixWorld(true);

  const headMats = [], lensMats = [], tires = [], hubMeshes = [];
  let tyreMat = null, rimMat = null;
  const paint = mobile
    ? new THREE.MeshStandardMaterial({ color: '#0e2a21', metalness: 0.62, roughness: 0.5 })
    : MAT.paint();
  const glass = MAT.glass();
  const lensMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, roughness: 0.05, emissive: '#fff4dc', emissiveIntensity: 0, depthWrite: false });
  lensMats.push(lensMat);

  // Physical extras (transmission especially) cost a full extra render pass — strip them.
  const simplify = (m) => {
    if (!m || !m.isMeshPhysicalMaterial) return m;
    if (m.transmission > 0) return glass;
    if (!mobile) return m;
    const st = new THREE.MeshStandardMaterial();
    THREE.MeshStandardMaterial.prototype.copy.call(st, m);
    return st;
  };

  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !mobile;
    o.receiveShadow = !mobile;
    const n = pathName(o);
    if (RE_GLASS.test(n)) {
      o.material = glass;
      o.castShadow = false;
      return;
    }
    if (RE_LENS.test(n)) {
      o.material = lensMat;
      o.castShadow = false;
      return;
    }
    if (RE_HEAD.test(n)) {
      o.material = simplify(o.material).clone();
      o.material.emissive = new THREE.Color('#fff4dc');
      o.material.emissiveIntensity = 0;
      headMats.push(o.material);
      return;
    }
    const mats = (Array.isArray(o.material) ? o.material : [o.material]).map((m0) => {
      const m = simplify(m0);
      // Tyres: the photo texture is light grey; multiply it down to real rubber black.
      if (m.name === 'Standardmaterial') return (tyreMat ||= Object.assign(m.clone(), { color: new THREE.Color('#3b3c3d'), roughness: 0.93, metalness: 0 }));
      // Rims: the source texture is rusty white steel — swap for clean polished aluminium.
      if (m.name === 'Material_41') return (rimMat ||= new THREE.MeshStandardMaterial({ name: 'rim-alu', color: '#d9dde0', metalness: 0.9, roughness: 0.24 }));
      const c = m.color;
      // Red body paint → brand paint. (Orange marker lamps stay orange.)
      if (c && !m.map && c.r > 0.25 && c.r > 1.8 * c.g && c.r > 1.8 * c.b && c.g < 0.12) return paint;
      return m;
    });
    o.material = Array.isArray(o.material) ? mats : mats[0];
    if (RE_HUB.test(n)) hubMeshes.push(o);
    else if (RE_TIRE.test(n)) tires.push(o);
  });

  // Wheel spin. Hubs (one torus per wheel) give the wheel centres; the combined tyre mesh is split
  // per wheel by nearest hub so every wheel rotates around its own axle.
  const centers = hubMeshes.map((h) => ({ mesh: h, c: meshCenter(h, root) })).filter((h) => h.c.y < 1.2);
  const pivots = [];
  const pivotAt = (c) => {
    const p = new THREE.Group();
    p.position.copy(c);
    root.add(p);
    pivots.push(p);
    return p;
  };
  const inv = new THREE.Matrix4();
  if (centers.length) {
    const groups = centers.map((h) => ({ c: h.c, pivot: pivotAt(h.c) }));
    for (const h of centers) groups.find((g) => g.c === h.c).pivot.attach(h.mesh);
    inv.copy(root.matrixWorld).invert();
    // A triangle belongs to a wheel only if it sits inside that wheel's cylinder (radius + tyre width).
    // Everything else under the "wheels" node — suspension, mudflaps, axle housings — stays static.
    const R = 0.54, HALF_W = 0.21;
    const keep = new Map(); // material → static leftover geometries
    for (const t of tires) {
      const g = bakeGeometry(t.geometry, new THREE.Matrix4().multiplyMatrices(inv, t.matrixWorld)).toNonIndexed();
      const pos = g.attributes.position;
      const buckets = groups.map(() => []);
      const rest = [];
      const a = new THREE.Vector3(), bb = new THREE.Vector3(), cc = new THREE.Vector3();
      for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i); bb.fromBufferAttribute(pos, i + 1); cc.fromBufferAttribute(pos, i + 2);
        a.add(bb).add(cc).multiplyScalar(1 / 3);
        let best = -1, bd = Infinity;
        groups.forEach((gr, k) => {
          const dx = Math.abs(gr.c.x - a.x);
          const dr = Math.hypot(gr.c.y - a.y, gr.c.z - a.z);
          if (dx <= HALF_W && dr <= R && dx + dr < bd) { bd = dx + dr; best = k; }
        });
        (best >= 0 ? buckets[best] : rest).push(i);
      }
      const pick = (idx, offset) => {
        const sub = new THREE.BufferGeometry();
        for (const [name, attr] of Object.entries(g.attributes)) {
          const out = new Float32Array(idx.length * 3 * attr.itemSize);
          let w = 0;
          for (const i of idx) for (let v = 0; v < 3; v++) for (let c = 0; c < attr.itemSize; c++) out[w++] = attr.getComponent(i + v, c);
          sub.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize));
        }
        if (offset) sub.translate(-offset.x, -offset.y, -offset.z);
        return sub;
      };
      groups.forEach((gr, k) => {
        if (!buckets[k].length) return;
        const piece = new THREE.Mesh(pick(buckets[k], gr.c), t.material);
        piece.castShadow = t.castShadow;
        gr.pivot.add(piece);
      });
      if (rest.length) {
        if (!keep.has(t.material)) keep.set(t.material, []);
        keep.get(t.material).push(pick(rest));
      }
      t.removeFromParent();
      g.dispose();
    }
    for (const [mat, geos] of keep) {
      for (const geo of geos) {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = !mobile;
        m.receiveShadow = !mobile;
        root.add(m);
      }
    }
  }

  root.userData = { wheels: pivots, headMats, lensMats, withTrailer };
  return root;
}
