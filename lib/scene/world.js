// Static landscape + scrolling roadside furniture for the I-88 scene.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeStatic } from './merge.js';
import {
  rng, grassTexture, asphaltTextures, gravelTexture, radialTexture, ROAD_X0, ROAD_X1, ROAD_TILE,
  guideSignTexture, SIGN_SIZES, speedLimitTexture, routeMarkerTexture,
} from './textures.js';

// Everything that scrolls lives between Z_FAR and Z_NEAR and wraps around.
export const Z_NEAR = 260;
const ROAD_LEN = 1400;
const ROAD_Z0 = Z_NEAR - ROAD_LEN; // far end of the road

export const wrapZ = (base, travel, span) => Z_NEAR - span + ((((base + travel) - (Z_NEAR - span)) % span) + span) % span;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Terrain height: flat verge, rolling near hills from |x| 14 → 150, big ridges from 170 → 520.
export function terrainHeight(x, z) {
  const ax = Math.abs(x);
  const near = smooth(14, 150, ax) * 10 * (0.55 + 0.3 * Math.sin(z * 0.011 + x * 0.021) + 0.15 * Math.sin(z * 0.037 - x * 0.05));
  const far = smooth(170, 520, ax) * 95 * (0.5 + 0.22 * Math.sin(z * 0.0042 + x * 0.003) + 0.16 * Math.sin(z * 0.013 + 1.7 + x * 0.008) + 0.12 * Math.sin(z * 0.029 + x * 0.02));
  return -0.04 + near + far;
}

const galvanized = () => new THREE.MeshStandardMaterial({ color: '#b5bcc0', metalness: 0.7, roughness: 0.38 });

function instanced(geo, mat, count, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, count);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.castShadow = shadow;
  m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3();
function memberMatrix(a, b, r) {
  _dir.subVectors(b, a);
  const len = _dir.length();
  _q.setFromUnitVectors(_up, _dir.normalize());
  _p.addVectors(a, b).multiplyScalar(0.5);
  _s.set(r, len, r);
  return new THREE.Matrix4().compose(_p.clone(), _q.clone(), _s.clone());
}

export function buildWorld(scene, { mobile, logoWhite }) {
  const updaters = [];
  const glowMats = []; // materials that fade in at night: { mat, base, night }
  const disposables = [];

  /* ---------------- Terrain ---------------- */
  const grass = grassTexture();
  // The landscape scrolls with the road: heights are evaluated in the vertex shader at (x, z − travel),
  // so hills, trees and grass all move together instead of the ground sliding under static hills.
  const tg = new THREE.PlaneGeometry(3000, 3000, mobile ? 140 : 300, mobile ? 140 : 300);
  tg.rotateX(-Math.PI / 2);
  const terrainMat = new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95, color: '#ffffff' });
  const uTravel = { value: 0 };
  terrainMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTravel = uTravel;
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTravel;
        float terrainH(vec2 p) {
          float x = p.x, z = p.y, ax = abs(x);
          float nearH = smoothstep(14.0, 150.0, ax) * 10.0 * (0.55 + 0.3 * sin(z * 0.011 + x * 0.021) + 0.15 * sin(z * 0.037 - x * 0.05));
          float farH = smoothstep(170.0, 520.0, ax) * 95.0 * (0.5 + 0.22 * sin(z * 0.0042 + x * 0.003) + 0.16 * sin(z * 0.013 + 1.7 + x * 0.008) + 0.12 * sin(z * 0.029 + x * 0.02));
          return -0.04 + nearH + farH;
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `vec2 tp = vec2(position.x, position.z - uTravel);
        const float te = 2.0;
        vec3 objectNormal = normalize(vec3(
          terrainH(tp - vec2(te, 0.0)) - terrainH(tp + vec2(te, 0.0)),
          2.0 * te,
          terrainH(tp - vec2(0.0, te)) - terrainH(tp + vec2(0.0, te))));`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.x, terrainH(tp), position.z);');
  };
  const terrain = new THREE.Mesh(tg, terrainMat);
  terrain.receiveShadow = true;
  terrain.frustumCulled = false;
  scene.add(terrain);
  const grassTile = 3000 / 260;
  updaters.push((travel) => {
    uTravel.value = travel;
    grass.offset.y = (travel / grassTile) % 1;
  });

  /* ---------------- Pine trees ---------------- */
  const r = rng(99);
  const cones = [];
  const tiers = [[2.3, 4.2, 3.0], [1.75, 3.6, 5.4], [1.15, 3.0, 7.6]];
  for (const [rad, h, y] of tiers) {
    const c = new THREE.ConeGeometry(rad, h, 10, 1, true);
    const p = c.attributes.position;
    for (let i = 11; i < p.count; i++) {
      const j = (i - 11) % 10; // bottom ring; the seam vertex shares j = 0
      const k = j % 2 ? 1.18 : 0.82; // jagged skirt
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
      p.setY(i, p.getY(i) + (j % 3) * 0.12);
    }
    c.translate(0, y, 0);
    cones.push(c);
  }
  const foliageGeo = mergeGeometries(cones.map((c) => c.toNonIndexed()));
  foliageGeo.computeVertexNormals();
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 2.2, 6).translate(0, 1.1, 0);
  const TREE_N = mobile ? 300 : 520;
  const foliage = instanced(foliageGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true, side: THREE.DoubleSide }), TREE_N);
  const trunks = instanced(trunkGeo, new THREE.MeshStandardMaterial({ color: '#2d2118', roughness: 1 }), TREE_N, false);
  const trees = [];
  const col = new THREE.Color();
  const TREE_SPAN = ROAD_LEN;
  for (let i = 0; i < TREE_N; i++) {
    const side = r() > 0.5 ? 1 : -1;
    const x = side * (28 + Math.pow(r(), 1.7) * 192);
    trees.push({ x, z: -r() * TREE_SPAN, s: 0.7 + r() * 0.9, rot: r() * Math.PI * 2 });
    col.setHSL(0.26 + r() * 0.07, 0.2 + r() * 0.12, 0.045 + r() * 0.055);
    foliage.setColorAt(i, col);
  }
  scene.add(foliage, trunks);
  updaters.push((travel) => {
    for (let i = 0; i < TREE_N; i++) {
      const t = trees[i];
      const z = wrapZ(t.z, travel, TREE_SPAN);
      _q.setFromAxisAngle(_up, t.rot);
      _m.compose(_p.set(t.x, terrainHeight(t.x, z - travel) - 0.2, z), _q, _s.setScalar(t.s));
      foliage.setMatrixAt(i, _m);
      trunks.setMatrixAt(i, _m);
    }
    foliage.instanceMatrix.needsUpdate = true;
    trunks.instanceMatrix.needsUpdate = true;
  });

  /* ---------------- Road ---------------- */
  const { map: asphalt, bump } = asphaltTextures();
  const roadW = ROAD_X1 - ROAD_X0;
  const rep = ROAD_LEN / ROAD_TILE;
  asphalt.repeat.set(1, rep);
  bump.repeat.set(1, rep);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(roadW, ROAD_LEN).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: asphalt, bumpMap: bump, bumpScale: 1.2, roughness: 0.88, metalness: 0 }),
  );
  road.position.set((ROAD_X0 + ROAD_X1) / 2, 0, ROAD_Z0 + ROAD_LEN / 2);
  road.receiveShadow = true;
  scene.add(road);
  updaters.push((travel) => {
    const o = (travel / ROAD_TILE) % 1;
    asphalt.offset.y = o;
    bump.offset.y = o;
  });

  // Gravel shoulders beyond the paved edge.
  const gravel = gravelTexture();
  const gravelTile = 6;
  gravel.repeat.set(1, ROAD_LEN / gravelTile);
  const gravelMat = new THREE.MeshStandardMaterial({ map: gravel, roughness: 1 });
  // Wide left (median-side) shoulder, like a real interstate — also gives the hero camera room inside the rail.
  for (const [x0, x1] of [[-11.2, ROAD_X0], [ROAD_X1, 7.3]]) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, ROAD_LEN).rotateX(-Math.PI / 2), gravelMat);
    g.position.set((x0 + x1) / 2, -0.012, ROAD_Z0 + ROAD_LEN / 2);
    g.receiveShadow = true;
    scene.add(g);
  }
  updaters.push((travel) => { gravel.offset.y = (travel / gravelTile) % 1; });

  // Lane markings.
  const yellow = new THREE.MeshStandardMaterial({ color: '#e8b923', roughness: 0.55, emissive: '#e8b923', emissiveIntensity: 0 });
  const white = new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.55, emissive: '#ffffff', emissiveIntensity: 0 });
  glowMats.push({ mat: yellow, base: 0, night: 0.12 }, { mat: white, base: 0, night: 0.1 });
  for (const [x, mat] of [[-5.6, yellow], [1.93, white]]) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, ROAD_LEN).rotateX(-Math.PI / 2), mat);
    l.position.set(x, 0.008, ROAD_Z0 + ROAD_LEN / 2);
    l.receiveShadow = true;
    scene.add(l);
  }
  const DASH_P = 12.2;
  const DASH_N = Math.ceil(ROAD_LEN / DASH_P);
  const DASH_SPAN = DASH_N * DASH_P;
  const dashes = instanced(new THREE.PlaneGeometry(0.15, 3).rotateX(-Math.PI / 2), white, DASH_N, false);
  scene.add(dashes);
  updaters.push((travel) => {
    for (let i = 0; i < DASH_N; i++) {
      _m.makeTranslation(-1.83, 0.008, wrapZ(-i * DASH_P, travel, DASH_SPAN));
      dashes.setMatrixAt(i, _m);
    }
    dashes.instanceMatrix.needsUpdate = true;
  });

  /* ---------------- W-beam guardrails ---------------- */
  const wShape = new THREE.Shape();
  const prof = [[0, 0], [0.075, 0.04], [0.075, 0.11], [0.028, 0.155], [0.075, 0.2], [0.075, 0.27], [0, 0.31]];
  prof.forEach(([x, y], i) => (i ? wShape.lineTo(x, y) : wShape.moveTo(x, y)));
  [...prof].reverse().forEach(([x, y]) => wShape.lineTo(x - 0.012, y));
  const railGeo = new THREE.ExtrudeGeometry(wShape, { depth: ROAD_LEN, bevelEnabled: false, steps: 1 });
  railGeo.translate(0, 0, ROAD_Z0);
  const steel = galvanized();
  disposables.push(steel);
  const railR = new THREE.Mesh(railGeo, steel);
  railR.position.set(6.62, 0.42, 0);
  railR.scale.x = -1; // corrugations face the road
  const railL = new THREE.Mesh(railGeo, steel);
  railL.position.set(-10.62, 0.42, 0);
  for (const rl of [railR, railL]) { rl.castShadow = true; rl.receiveShadow = true; scene.add(rl); }

  const POST_P = 1.905, POST_N = mobile ? 240 : 320;
  const POST_SPAN = POST_N * POST_P;
  const postGeo = mergeGeometries([
    new THREE.BoxGeometry(0.15, 0.82, 0.15).translate(0, 0.41, 0),
    new THREE.BoxGeometry(0.16, 0.3, 0.12).translate(0, 0.57, 0), // blockout
  ]);
  const posts = instanced(postGeo, steel, POST_N * 2);
  scene.add(posts);
  updaters.push((travel) => {
    for (let i = 0; i < POST_N; i++) {
      const z = wrapZ(-i * POST_P, travel, POST_SPAN);
      _m.makeTranslation(6.82, 0, z); posts.setMatrixAt(i * 2, _m);
      _m.makeTranslation(-10.82, 0, z); posts.setMatrixAt(i * 2 + 1, _m);
    }
    posts.instanceMatrix.needsUpdate = true;
  });

  /* ---------------- Delineators ---------------- */
  const DEL_P = 40, DEL_N = 18, DEL_SPAN = DEL_P * DEL_N;
  const delPosts = instanced(new THREE.BoxGeometry(0.08, 1.2, 0.05).translate(0, 0.6, 0), new THREE.MeshStandardMaterial({ color: '#e9ecea', roughness: 0.6 }), DEL_N * 2, false);
  const reflMat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.2 });
  glowMats.push({ mat: reflMat, base: 0, night: 1.6 });
  const refl = instanced(new THREE.PlaneGeometry(0.075, 0.16).translate(0, 1.02, 0.03), reflMat, DEL_N * 2, false);
  scene.add(delPosts, refl);
  updaters.push((travel) => {
    for (let i = 0; i < DEL_N; i++) {
      const z = wrapZ(-i * DEL_P, travel, DEL_SPAN);
      _m.makeTranslation(7.15, 0, z); delPosts.setMatrixAt(i * 2, _m); refl.setMatrixAt(i * 2, _m);
      _m.makeTranslation(-11.05, 0, z + 20); delPosts.setMatrixAt(i * 2 + 1, _m); refl.setMatrixAt(i * 2 + 1, _m);
    }
    delPosts.instanceMatrix.needsUpdate = true;
    refl.instanceMatrix.needsUpdate = true;
  });

  /* ---------------- Streetlights ---------------- */
  // Local frame: pole at origin, arm reaches toward +x.
  const armCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 11.3, 0), new THREE.Vector3(0.05, 12.35, 0), new THREE.Vector3(2.7, 12.05, 0));
  const headGeo = new THREE.SphereGeometry(1, mobile ? 10 : 16, mobile ? 6 : 10);
  headGeo.scale(0.62, 0.17, 0.3);
  headGeo.translate(3.05, 11.98, 0);
  const lampGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.085, 0.17, 12, mobile ? 7 : 12, 1, true).translate(0, 6, 0),
    new THREE.CylinderGeometry(0.3, 0.34, 0.25, 12).translate(0, 0.12, 0), // base plate
    new THREE.TubeGeometry(armCurve, mobile ? 10 : 20, 0.06, mobile ? 5 : 8, false),
    headGeo,
  ]);
  const lensGeo = new THREE.CircleGeometry(1, 20).rotateX(Math.PI / 2);
  lensGeo.scale(0.5, 1, 0.22);
  lensGeo.translate(3.1, 11.86, 0);
  const LIGHT_P = 64, LIGHT_N = mobile ? 14 : 20, LIGHT_SPAN = LIGHT_P * LIGHT_N;
  const lamps = instanced(lampGeo, steel, LIGHT_N * 2);
  const lensMat = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffd9a0', emissiveIntensity: 0.1, side: THREE.DoubleSide });
  glowMats.push({ mat: lensMat, base: 0.1, night: 6 });
  const lenses = instanced(lensGeo, lensMat, LIGHT_N * 2, false);
  const poolTex = radialTexture([[0, 'rgba(255,214,150,.55)'], [0.45, 'rgba(255,200,130,.22)'], [1, 'rgba(255,190,120,0)']]);
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false });
  glowMats.push({ mat: poolMat, base: 0, night: 1, opacity: true });
  const pools = instanced(new THREE.PlaneGeometry(15, 15).rotateX(-Math.PI / 2), poolMat, LIGHT_N * 2, false);
  pools.renderOrder = 2;
  const glowGeo = new THREE.BufferGeometry();
  const glowPos = new Float32Array(LIGHT_N * 2 * 3);
  glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  const glowMat = new THREE.PointsMaterial({
    map: radialTexture([[0, 'rgba(255,236,200,1)'], [0.18, 'rgba(255,214,160,.6)'], [1, 'rgba(255,190,120,0)']]),
    size: 4.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false,
  });
  glowMats.push({ mat: glowMat, base: 0, night: 1, opacity: true });
  const glows = new THREE.Points(glowGeo, glowMat);
  glows.frustumCulled = false;
  glows.renderOrder = 3;
  scene.add(lamps, lenses, pools, glows);
  const rotR = new THREE.Quaternion().setFromAxisAngle(_up, Math.PI);
  const rotL = new THREE.Quaternion();
  updaters.push((travel) => {
    for (let i = 0; i < LIGHT_N; i++) {
      for (let s = 0; s < 2; s++) {
        const right = s === 0;
        const z = wrapZ(-i * LIGHT_P - (right ? 0 : LIGHT_P / 2), travel, LIGHT_SPAN);
        const x = right ? 7.75 : -11.75;
        const k = i * 2 + s;
        _m.compose(_p.set(x, 0, z), right ? rotR : rotL, _s.set(1, 1, 1));
        lamps.setMatrixAt(k, _m);
        lenses.setMatrixAt(k, _m);
        const hx = x + (right ? -3.1 : 3.1);
        _m.makeTranslation(hx + (right ? -0.6 : 0.6), 0.015 + k * 0.0004, z);
        pools.setMatrixAt(k, _m);
        glowPos[k * 3] = hx;
        glowPos[k * 3 + 1] = 11.75;
        glowPos[k * 3 + 2] = z;
      }
    }
    lamps.instanceMatrix.needsUpdate = true;
    lenses.instanceMatrix.needsUpdate = true;
    pools.instanceMatrix.needsUpdate = true;
    glowGeo.attributes.position.needsUpdate = true;
  });

  /* ---------------- Overhead sign gantries ---------------- */
  const signTex = [0, 1, 2, 3].map((k) => guideSignTexture(k, null));
  if (logoWhite) logoWhite.then((img) => signTex[1].redraw(img)).catch(() => {});
  const signMats = signTex.map((t) => {
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.04, roughness: 0.5, metalness: 0.05, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    glowMats.push({ mat: m, base: 0.04, night: 0.55 });
    return m;
  });
  const boardMat = new THREE.MeshStandardMaterial({ color: '#7d8589', metalness: 0.6, roughness: 0.45 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#a7a49c', roughness: 0.95 });

  const members = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const XL = -12.2, XR = 8.4, Y0 = 7.0, Y1 = 8.0, ZH = 0.45;
  // Truss chords.
  for (const y of [Y0, Y1]) for (const z of [-ZH, ZH]) members.push([V(XL, y, z), V(XR, y, z), 0.075]);
  // Verticals + diagonals on the front/back faces; struts on top/bottom faces.
  const bays = 16, bw = (XR - XL) / bays;
  for (let i = 0; i <= bays; i++) {
    const x = XL + i * bw;
    for (const z of [-ZH, ZH]) members.push([V(x, Y0, z), V(x, Y1, z), 0.035]);
    for (const y of [Y0, Y1]) members.push([V(x, y, -ZH), V(x, y, ZH), 0.03]);
    if (i < bays) {
      const x2 = x + bw;
      for (const z of [-ZH, ZH]) members.push([V(x, i % 2 ? Y0 : Y1, z), V(x2, i % 2 ? Y1 : Y0, z), 0.03]);
      members.push([V(x, Y1, -ZH), V(x2, Y1, ZH), 0.025]);
    }
  }
  // Lattice towers on both ends.
  for (const tx of [XL, XR]) {
    const legs = [[-0.35, -ZH], [0.35, -ZH], [0.35, ZH], [-0.35, ZH]];
    for (const [dx, dz] of legs) members.push([V(tx + dx, 0.6, dz), V(tx + dx, Y1 + 0.2, dz), 0.07]);
    for (let y = 0.6; y < Y1; y += 0.9) {
      for (let j = 0; j < 4; j++) {
        const [ax, az] = legs[j], [bx, bz] = legs[(j + 1) % 4];
        members.push([V(tx + ax, y, az), V(tx + bx, y, bz), 0.025]);
        members.push([V(tx + ax, y, az), V(tx + bx, Math.min(y + 0.9, Y1), bz), 0.02]);
      }
    }
  }
  const memberGeo = new THREE.CylinderGeometry(1, 1, 1, mobile ? 5 : 7, 1, true);
  const gantries = [];
  // One gantry every 300 m (real interstate guide signs are sparse; 170 m read as cluttered).
  const GANTRY_P = 300, GANTRY_N = mobile ? 4 : 5, GANTRY_SPAN = GANTRY_P * GANTRY_N;
  for (let gi = 0; gi < GANTRY_N; gi++) {
    const g = new THREE.Group();
    const im = new THREE.InstancedMesh(memberGeo, steel, members.length);
    members.forEach(([a, b, rad], i) => im.setMatrixAt(i, memberMatrix(a, b, rad)));
    im.castShadow = true;
    im.receiveShadow = true;
    g.add(im);
    for (const tx of [XL, XR]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.5), concrete);
      f.position.set(tx, 0.3, 0);
      f.receiveShadow = true;
      g.add(f);
    }
    // Two double-faced guide signs per gantry, hung over each lane.
    // Signs sit side by side with a clear gap (they used to overlap by ~1.8 m and z-fight).
    for (const [k, x] of [[(gi * 2) % 4, -4.25], [(gi * 2 + 1) % 4, 1.4]]) {
      const [w, h] = SIGN_SIZES[k];
      const y = Y0 + 0.5 - h / 2 + 1.2;
      const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), boardMat);
      board.position.set(x, y, ZH + 0.25);
      board.castShadow = true;
      g.add(board);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMats[k]);
      front.position.set(x, y, ZH + 0.33);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), signMats[k]);
      back.rotation.y = Math.PI;
      back.position.set(x, y, ZH + 0.17);
      g.add(front, back);
      // Sign brackets.
      for (const bx of [-w / 3, w / 3]) {
        const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.08), steel);
        br.position.set(x + bx, y, ZH + 0.14);
        g.add(br);
      }
    }
    mergeStatic(g, [im]); // boards, brackets, footings, sign faces → one mesh per material
    scene.add(g);
    gantries.push({ g, base: -120 - gi * GANTRY_P });
  }
  updaters.push((travel) => {
    for (const it of gantries) it.g.position.z = wrapZ(it.base, travel, GANTRY_SPAN);
  });

  /* ---------------- Roadside signs on posts ---------------- */
  const roadside = [];
  const ROADSIDE_SPAN = 820;
  const mkPostSign = (tex, w, h, base) => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.03, roughness: 0.5 });
    glowMats.push({ mat, base: 0.03, night: 0.4 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const back = front.clone();
    back.rotation.y = Math.PI;
    front.position.set(0, 2.3 + h / 2, 0.045);
    back.position.set(0, 2.3 + h / 2, -0.045);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), boardMat);
    plate.position.set(0, 2.3 + h / 2, 0);
    for (const px of [-w * 0.28, w * 0.28]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3 + h, 0.08), steel);
      p.position.set(px, (2.3 + h) / 2, -0.06);
      p.castShadow = true;
      g.add(p);
    }
    g.add(plate, front, back);
    g.position.x = 8.4;
    scene.add(g);
    roadside.push({ g, base });
  };
  mkPostSign(speedLimitTexture(), 1.25, 1.56, -95);
  mkPostSign(routeMarkerTexture(), 1.2, 1.75, -95 - ROADSIDE_SPAN / 2);
  updaters.push((travel) => {
    for (const it of roadside) it.g.position.z = wrapZ(it.base, travel, ROADSIDE_SPAN);
  });

  return {
    // Streetlight heads (world space) sorted by distance to zRef — used to drive real spot lights near the truck.
    nearestLamps(n, zRef) {
      const out = [];
      for (let k = 0; k < glowPos.length / 3; k++) out.push({ x: glowPos[k * 3], y: glowPos[k * 3 + 1], z: glowPos[k * 3 + 2] });
      out.sort((a, b) => Math.abs(a.z - zRef) - Math.abs(b.z - zRef));
      return out.slice(0, n);
    },
    update(travel) { for (const u of updaters) u(travel); },
    setNight(glow) {
      for (const g of glowMats) {
        const v = g.base + (g.night - g.base) * glow;
        if (g.opacity) g.mat.opacity = v;
        else g.mat.emissiveIntensity = v;
      }
    },
    terrainHeight,
  };
}
