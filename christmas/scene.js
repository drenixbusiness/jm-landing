// Winter dressing for the 3D highway: snow cover, snow-capped pines, plough drifts, snow on the
// guardrails and the trailer roof, falling snow, string lights on the trailer and a holiday trailer wrap.
// applyChristmas(...) is called once by lib/scene/index.js; its update() runs every frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RAILS, ROAD_LEN, ROAD_Z0, TREE_TIERS } from '@/lib/scene/world';
import { ROAD_X0, ROAD_X1, loadImage, radialTexture, rng } from '@/lib/scene/textures';
import { BULBS, christmasTrailerRear, christmasTrailerSide, paintSnowField, paintSnowShoulder, roadDriftTexture } from './textures';

const SNOW = '#f3f7fb';

/* ---------------- Snow caps for the pines ---------------- */
// One cap per tier: a jagged cone hugging the top ~60 % of each tier, slightly proud of the needles.
function snowCapGeometry() {
  const r = rng(5);
  const caps = TREE_TIERS.map(([rad, h, y]) => {
    const ch = h * 0.62, cr = rad * 0.7;
    const c = new THREE.ConeGeometry(cr, ch, 10, 2, true);
    const p = c.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vy = p.getY(i);
      if (vy < -ch / 2 + 1e-3) {
        // drippy lower rim
        const k = 0.9 + r() * 0.22;
        p.setX(i, p.getX(i) * k);
        p.setZ(i, p.getZ(i) * k);
        p.setY(i, vy - r() * 0.28);
      } else if (vy < ch / 2 - 1e-3) {
        const k = 1.04 + r() * 0.05;
        p.setX(i, p.getX(i) * k);
        p.setZ(i, p.getZ(i) * k);
      }
    }
    c.translate(0, y + h / 2 - ch / 2 + 0.06, 0);
    return c.toNonIndexed();
  });
  const g = mergeGeometries(caps);
  g.computeVertexNormals();
  return g;
}

/* ---------------- Falling snow ---------------- */
function snowfall(count) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3);
  for (let i = 0; i < p.length; i++) p[i] = Math.random();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(70, 32, 90) },
      uSize: { value: 0.075 },
      uScale: { value: 600 },
      uBright: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uTravel, uSize, uScale;
      uniform vec3 uCam, uBox;
      varying float vAlpha;
      void main() {
        vec3 b = position;
        vec3 p = b * uBox;
        float speed = 1.3 + fract(b.z * 13.7) * 1.4;
        p.y -= uTime * speed;
        p.x += sin(uTime * (0.4 + b.y) + b.z * 40.0) * 0.9;
        p.z += sin(uTime * 0.7 + b.x * 30.0) * 0.5 + uTravel;
        vec3 origin = uCam - uBox * 0.5;
        p = origin + mod(p - origin, uBox);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSize * (0.6 + fract(b.x * 91.3)) * uScale / max(-mv.z, 0.1), 1.0, 26.0);
        float d = length(p - uCam);
        vAlpha = smoothstep(uBox.z * 0.5, uBox.z * 0.3, d) * smoothstep(0.6, 2.0, -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uBright;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.12, d) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(uBright), a * 0.9);
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  return pts;
}

/* ---------------- String lights on the trailer ---------------- */
function trailerLights(trailer) {
  // Trailer box: x ±1.3, roof at y ≈ 4.19, front z = -2.85, rear z = 13.3 (see buildTrailer in lib/scene/truck.js).
  const pts = [];
  for (const s of [-1, 1]) for (let z = -2.6; z <= 13.2; z += 0.55) pts.push([s * 1.345, 4.12 + Math.sin(z * 5.7) * 0.03, z]);
  for (let x = -1.2; x <= 1.21; x += 0.3) pts.push([x, 4.12, 13.38]);
  for (const s of [-1, 1]) for (let y = 1.55; y < 4.0; y += 0.3) pts.push([s * 1.32, y, 13.38]);

  const n = pts.length;
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), n);
  const glowGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const m = new THREE.Matrix4();
  const base = [];
  pts.forEach(([x, y, z], i) => {
    m.makeTranslation(x, y, z);
    mesh.setMatrixAt(i, m);
    pos.set([x, y, z], i * 3);
    base.push(new THREE.Color(BULBS[i % BULBS.length]));
    mesh.setColorAt(i, base[i]);
  });
  glowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  glowGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const glowMat = new THREE.PointsMaterial({
    map: radialTexture([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']], 64),
    size: 0.55, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const glow = new THREE.Points(glowGeo, glowMat);
  glow.frustumCulled = false;
  glow.renderOrder = 5;
  mesh.frustumCulled = false;
  trailer.add(mesh, glow);

  const tmp = new THREE.Color();
  return (elapsed, night) => {
    for (let i = 0; i < n; i++) {
      // Two chases running in opposite directions + a slow breathing.
      const tw = 0.55 + 0.45 * Math.max(Math.sin(elapsed * 2.2 - i * 0.55), Math.sin(elapsed * 1.3 + i * 0.9) * 0.8);
      tmp.copy(base[i]).multiplyScalar(0.35 + 0.95 * tw);
      mesh.setColorAt(i, tmp);
      const gk = (0.25 + 0.75 * night) * tw;
      col[i * 3] = base[i].r * gk; col[i * 3 + 1] = base[i].g * gk; col[i * 3 + 2] = base[i].b * gk;
    }
    mesh.instanceColor.needsUpdate = true;
    glowGeo.attributes.color.needsUpdate = true;
  };
}

export function applyChristmas({ scene, world, trailer, hemi, mobile, reduce, logoColor }) {
  const { grass, gravel, foliage } = world.parts;

  // Snow on the ground and the shoulders (the textures keep their scroll logic).
  paintSnowField(grass);
  paintSnowShoulder(gravel);
  // Bright snow bounces light back up under the rig.
  hemi.groundColor.set('#9eabb9');

  // Plough windrows along both pavement edges.
  const driftTex = roadDriftTexture();
  const DRIFT_TILE = 30;
  driftTex.repeat.set(1, ROAD_LEN / DRIFT_TILE);
  const driftMat = new THREE.MeshStandardMaterial({
    map: driftTex, transparent: true, depthWrite: false, roughness: 0.9,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  for (const [x0, x1, flip] of [[2.6, ROAD_X1 + 0.02, false], [ROAD_X0 - 0.02, -5.85, true]]) {
    const geo = new THREE.PlaneGeometry(x1 - x0, ROAD_LEN).rotateX(-Math.PI / 2);
    if (flip) { // drift thickens towards the outer edge on both sides
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    }
    const d = new THREE.Mesh(geo, driftMat);
    d.position.set((x0 + x1) / 2, 0.012, ROAD_Z0 + ROAD_LEN / 2);
    d.receiveShadow = true;
    d.renderOrder = 1;
    scene.add(d);
  }

  // Snow lying on top of both guardrails.
  const snowMat = new THREE.MeshStandardMaterial({ color: SNOW, roughness: 0.92 });
  const railSnowGeo = new THREE.CylinderGeometry(0.07, 0.07, ROAD_LEN, 6, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2);
  railSnowGeo.scale(1.15, 0.7, 1);
  for (const [x, dx] of [[RAILS.right, -0.04], [RAILS.left, 0.04]]) {
    const s = new THREE.Mesh(railSnowGeo, snowMat);
    s.position.set(x + dx, RAILS.y + RAILS.height + 0.005, ROAD_Z0 + ROAD_LEN / 2);
    s.receiveShadow = true;
    scene.add(s);
  }

  // Snow caps riding on every pine instance.
  const caps = new THREE.InstancedMesh(snowCapGeometry(), new THREE.MeshStandardMaterial({ color: SNOW, roughness: 0.85, flatShading: true }), foliage.count);
  caps.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  caps.castShadow = !mobile;
  caps.receiveShadow = true;
  caps.frustumCulled = false;
  scene.add(caps);

  // Trailer: holiday wrap on the sides and rear doors, snow on the roof, string lights around the box.
  const { sideMat, rearMat } = trailer.userData;
  const sideTex = christmasTrailerSide(null);
  const rearTex = christmasTrailerRear(null);
  if (sideMat) { sideMat.map?.dispose(); sideMat.map = sideTex; sideMat.color.set('#ececea'); sideMat.needsUpdate = true; }
  if (rearMat) { rearMat.map?.dispose(); rearMat.map = rearTex; rearMat.needsUpdate = true; }
  if (logoColor) loadImage(logoColor).then((img) => { sideTex.redraw(img); rearTex.redraw(img); }).catch(() => {});

  const roofGeo = new THREE.BoxGeometry(2.5, 0.12, 15.9, 6, 1, 40);
  {
    const r = rng(9);
    const p = roofGeo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + r() * 0.06);
    roofGeo.computeVertexNormals();
  }
  const roof = new THREE.Mesh(roofGeo, snowMat);
  roof.position.set(0, 4.25, -2.85 + 16.15 / 2);
  roof.castShadow = !mobile;
  roof.receiveShadow = true;
  trailer.add(roof);
  const updateLights = trailerLights(trailer);

  // Falling snow around the camera.
  const flakes = snowfall(mobile ? 1600 : 4500);
  scene.add(flakes);
  const fu = flakes.material.uniforms;

  return {
    update({ elapsed, travel, camera, night }) {
      caps.instanceMatrix.array.set(foliage.instanceMatrix.array);
      caps.instanceMatrix.needsUpdate = true;
      driftTex.offset.y = (travel / DRIFT_TILE) % 1;
      updateLights(elapsed, night);
      fu.uTime.value = reduce ? 0 : elapsed;
      fu.uTravel.value = travel % fu.uBox.value.z;
      fu.uCam.value.copy(camera.position);
      fu.uScale.value = (innerHeight * Math.min(devicePixelRatio || 1, 2)) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      fu.uBright.value = 0.95 - 0.45 * night;
    },
  };
}
