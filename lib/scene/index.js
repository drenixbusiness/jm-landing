// Shared 3D highway scene.
// initScene(canvas, { ids, keys, timeOfDay, reduce, glbUrl, fontFamily }) → teardown()
// The returned teardown function also carries live controls: setSections(ids, keys), setPaused(bool).
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { buildWorld } from './world.js';
import { buildTractor, buildTrailer, loadCascadia, WHEEL_R } from './truck.js';
import { SIGN_FONT, beamTexture, loadImage, radialTexture } from './textures.js';
import { optimizeRig } from './merge.js';

// Truck-relative camera keyframes (-z is forward).
const KEYS = [
  // Rear-left 3/4 from the shoulder (left side of the rig at an angle), framed to the right of the hero copy.
  // shift = lens shift in screen widths (+ moves the subject right) — same placement on every aspect ratio.
  { pos: [-4.6, 3.8, 28.5], look: [1.0, 3.35, -40], fov: 55, portrait: { pos: [-3.2, 4.2, 31], look: [-0.6, 2.4, -12] } },
  { pos: [24, 3.4, 4], look: [0, 2.5, 12] }, // right profile of the trailer
  { pos: [0.6, 44, 2.5], look: [0, 0, 2] }, // top-down
  { pos: [7.5, 2.3, -25], look: [-5, 2.5, -5] }, // low front 3/4
  { pos: [-24, 3.4, 1], look: [0, 2.5, 11] }, // left profile
  { pos: [9, 10, 31], look: [-4, 1.5, 0] }, // high rear chase
  { pos: [-8.5, 2.6, -27], look: [5, 2.8, -6] }, // front-left hero
];

const TOD_HOURS = { sunrise: 7.4, day: 12.5, sunset: 18.3, night: 21.5 };
const BASE_SPEED = 26;
const MAX_BOOST = 14; // scroll adds at most ~12 mph — enough to feel, not enough to look like a glitch

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- Sun position from the clock ---------------- */
// East = +z (behind the truck), west = -z (ahead, I-88 westbound), north = +x.
export function sunFromHour(h) {
  let elev, hx, hz;
  if (h >= 7 && h <= 19) {
    const p = (h - 7) / 12;
    elev = 46 * Math.sin(Math.PI * p) + 1.5;
    hx = -Math.sin(Math.PI * p); // south at noon
    hz = Math.cos(Math.PI * p);
  } else {
    const q = (((h - 19) % 24) + 24) % 24 / 12;
    elev = 1.5 - 17.5 * Math.sin(Math.PI * q); // bottoms out at -16°
    hx = Math.sin(Math.PI * q);
    hz = -Math.cos(Math.PI * q);
  }
  const e = THREE.MathUtils.degToRad(elev);
  const dir = new THREE.Vector3(hx * Math.cos(e), Math.sin(e), hz * Math.cos(e)).normalize();
  return { elev, dir };
}

function phaseLabel(h, elev) {
  if (elev < -3) return 'NIGHT RUN';
  if (elev < 12) return h < 13 ? 'SUNRISE RUN' : 'SUNSET RUN';
  return 'DAY RUN';
}

/* ---------------- Procedural clouds ---------------- */
function cloudDome(octaves = 7) {
  const mat = new THREE.ShaderMaterial({
    defines: { OCTAVES: octaves },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color('#ffffff') },
      uLight: { value: new THREE.Color('#ffffff') },
      uDark: { value: new THREE.Color('#8a96a3') },
      uAlpha: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww; // pin to the far plane
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uLight;
      uniform vec3 uDark;
      uniform float uAlpha;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
        return v;
      }
      void main() {
        vec3 dir = normalize(vDir);
        if (dir.y <= 0.0) discard;
        vec2 uv = dir.xz / (dir.y + 0.1) * 1.4;
        uv += vec2(uTime * 0.006, uTime * 0.018);
        float n = fbm(uv);
        float cov = smoothstep(0.5, 0.82, n);
        if (cov < 0.002) discard;
        vec2 toSun = normalize(uSunDir.xz + vec2(1e-4));
        float n2 = fbm(uv + toSun * 0.09);
        float lit = clamp(0.55 + (n - n2) * 5.0, 0.0, 1.0);
        float mu = max(dot(dir, uSunDir), 0.0);
        float scatter = pow(mu, 6.0) * 0.6 + pow(mu, 32.0) * 1.4;
        vec3 col = mix(uDark, uLight, lit) + uSunColor * scatter * (1.0 - cov * 0.55);
        float fade = smoothstep(0.0, 0.14, dir.y);
        gl_FragColor = vec4(col, cov * fade * uAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1600, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;
  return mesh;
}

function starDome() {
  const N = 1500;
  const p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(1 - Math.random() * 0.95); // upper hemisphere
    p[i * 3] = Math.sin(v) * Math.cos(u) * 1500;
    p[i * 3 + 1] = Math.cos(v) * 1500;
    p[i * 3 + 2] = Math.sin(v) * Math.sin(u) * 1500;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = -2;
  pts.frustumCulled = false;
  return pts;
}

export async function initScene(canvas, opts = {}) {
  const {
    timeOfDay = 'auto',
    reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    glbUrl = null,
    fontFamily,
    logoWhite = '/assets/jm-mark-white.png',
    logoColor = '/assets/jm-lockup.png',
  } = opts;
  let ids = opts.ids || [];
  let keys = opts.keys || ids.map((_, i) => i % KEYS.length);
  if (fontFamily) SIGN_FONT.family = `${fontFamily}, "Arial Narrow", Arial, sans-serif`;

  // "Lite" tier: phones/tablets and low-core machines get a cheaper pipeline.
  const mobile =
    matchMedia('(max-width: 900px), (pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;

  // Sign textures need the road-sign font before drawing.
  try {
    await Promise.race([
      Promise.all([document.fonts.load(`800 64px ${SIGN_FONT.family}`), document.fonts.load(`700 64px ${SIGN_FONT.family}`)]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch { /* fall back to system fonts */ }

  /* ---------------- Renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', stencil: false });
  // Resolution is adaptive: start at the cap and step down/up with measured frame time.
  const dprCap = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  const dprMin = mobile ? 0.7 : 1;
  let dpr = mobile ? Math.min(dprCap, 1.25) : dprCap;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = !mobile;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#8696a3', 160, 1400);
  // near = 0.5 (not 0.1) keeps depth precision high enough that coplanar sign faces never flicker.
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2400);

  /* ---------------- Sky, clouds, stars ---------------- */
  const sky = new Sky();
  sky.scale.setScalar(1800);
  const su = sky.material.uniforms;
  su.turbidity.value = 3.2;
  su.rayleigh.value = 1.35;
  su.mieCoefficient.value = 0.0045;
  su.mieDirectionalG.value = 0.82;
  if (su.cloudCoverage) su.cloudCoverage.value = 0; // we draw our own animated clouds
  sky.renderOrder = -3;
  sky.frustumCulled = false;
  scene.add(sky);
  const stars = starDome();
  const clouds = cloudDome(mobile ? 4 : 7);
  scene.add(stars, clouds);

  // Environment lighting baked from a sky-only scene; re-baked whenever the sun moves.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(1000);
  Object.assign(envSky.material.uniforms.turbidity, { value: 3.2 });
  envSky.material.uniforms.rayleigh.value = 1.35;
  envSky.material.uniforms.mieCoefficient.value = 0.0045;
  envSky.material.uniforms.mieDirectionalG.value = 0.82;
  if (envSky.material.uniforms.cloudCoverage) envSky.material.uniforms.cloudCoverage.value = 0;
  if (envSky.material.uniforms.showSunDisc) envSky.material.uniforms.showSunDisc.value = 0;
  envScene.add(envSky);
  let envRT = null;

  /* ---------------- Lights ---------------- */
  const hemi = new THREE.HemisphereLight('#bcd4e6', '#3a3a26', 0.5);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 3);
  key.castShadow = !mobile;
  const sm = 2048;
  key.shadow.mapSize.set(sm, sm);
  Object.assign(key.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 320 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.target.position.set(0, 0, 2);
  scene.add(key, key.target);

  /* ---------------- World ---------------- */
  const logoWhiteP = loadImage(logoWhite);
  logoWhiteP.catch(() => {});
  const world = buildWorld(scene, { mobile, logoWhite: logoWhiteP });

  /* ---------------- Truck ---------------- */
  const truck = new THREE.Group();
  scene.add(truck);
  const trailer = buildTrailer(logoColor);
  trailer.userData.wheels = optimizeRig(trailer, trailer.userData.wheels);
  let tractor = null;
  let rig = { wheels: [], headMats: [], lensMats: [] };
  let rigReady = false;
  let intro = 0;
  const INTRO_Z = 45;
  truck.position.z = INTRO_Z; // parked behind the camera until the rig is ready
  // Compile shaders off the main path (KHR_parallel_shader_compile) before showing the rig,
  // so the model appearing never causes a frame hitch.
  const fadeIn = async (obj) => {
    try { await renderer.compileAsync(obj, camera, scene); } catch { /* compile on first draw */ }
    rigReady = true;
  };

  const mountTractor = (obj, withTrailer = false) => {
    if (tractor) truck.remove(tractor);
    obj.userData.wheels = optimizeRig(obj, obj.userData.wheels || []); // ~160 draw calls → ~25
    tractor = obj;
    truck.add(obj);
    trailer.visible = !withTrailer;
    rig = {
      wheels: [...(obj.userData.wheels || []), ...(withTrailer ? [] : trailer.userData.wheels)],
      headMats: obj.userData.headMats || [],
      lensMats: obj.userData.lensMats || [],
    };
    placeLamps();
  };

  // Headlamp glow: a soft flare on each lamp (front-facing only) + the beam pools follow the real lamp positions.
  const flareTex = radialTexture([[0, 'rgba(255,252,240,1)'], [0.12, 'rgba(255,244,220,.9)'], [0.35, 'rgba(255,232,195,.28)'], [1, 'rgba(255,225,185,0)']]);
  const flareMat = new THREE.SpriteMaterial({ map: flareTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, fog: false });
  const lamps = []; // { pos: Vector3 (truck-local), flare: Sprite }
  let pools = []; // headlight ground pools (created below)
  const lampGroup = new THREE.Group();
  truck.add(lampGroup);
  function placeLamps() {
    lampGroup.clear();
    lamps.length = 0;
    truck.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(truck.matrixWorld).invert();
    const sides = { '-1': new THREE.Box3(), '1': new THREE.Box3() };
    const v = new THREE.Vector3();
    truck.traverse((o) => {
      if (!o.isMesh || !rig.headMats.includes(o.material)) return;
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        sides[v.x < 0 ? '-1' : '1'].expandByPoint(v);
      }
    });
    for (const b of Object.values(sides)) {
      if (b.isEmpty()) continue;
      const c = b.getCenter(new THREE.Vector3());
      const pos = new THREE.Vector3(c.x, c.y, b.min.z - 0.06);
      const flare = new THREE.Sprite(flareMat);
      flare.position.copy(pos);
      flare.scale.setScalar(1.25);
      flare.renderOrder = 5;
      lampGroup.add(flare);
      lamps.push({ pos, flare });
    }
    // Pools start right at the bumper under each lamp.
    lamps.forEach((l, i) => {
      if (pools[i]) pools[i].position.set(l.pos.x, 0.03, l.pos.z - 5.4);
    });
  }

  truck.add(trailer);

  // Soft contact shadow under the rig (the only shadow on the lite tier, a grounding cue on desktop).
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 25).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(0,0,0,.75)'], [0.55, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]),
      transparent: true, depthWrite: false, opacity: mobile ? 0.9 : 0.5,
    }),
  );
  contact.position.set(0, 0.02, 1.9);
  contact.renderOrder = 1;
  truck.add(contact);

  let disposed = false;
  const showProcedural = () => {
    if (disposed) return;
    trailer.visible = true;
    mountTractor(buildTractor());
    fadeIn(truck);
  };
  if (glbUrl) {
    trailer.visible = false;
    // Probe first so a missing model is a quiet fallback, not a loader error.
    // The lite tier prefers the decimated cascadia-mobile.glb when it exists.
    const candidates = mobile ? [glbUrl.replace(/\.glb$/, '-mobile.glb'), glbUrl] : [glbUrl];
    (async () => {
      for (const url of candidates) {
        const r = await fetch(url, { method: 'HEAD' }).catch(() => null);
        if (r?.ok) return url;
      }
      throw new Error('GLB 404');
    })()
      .then((url) => loadCascadia(url, { mobile }))
      .then((model) => {
        if (disposed) return;
        mountTractor(model, model.userData.withTrailer);
        fadeIn(truck);
        if (mobile) renderer.shadowMap.needsUpdate = true;
      })
      .catch((err) => {
        if (!/GLB 404/.test(String(err))) console.warn('[scene] truck GLB failed to load, using procedural tractor', err);
        showProcedural();
      });
  } else {
    showProcedural();
  }

  // Night headlights: ground pools in front of each lamp, a faint long beam and a spotlight.
  const beamTex = beamTexture();
  const poolMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const longMat = poolMat.clone();
  const headFx = new THREE.Group();
  pools = [-1, 1].map((s) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 11).rotateX(-Math.PI / 2), poolMat);
    p.position.set(s * 0.95, 0.03, -9.45 - 5.6);
    p.renderOrder = 4;
    headFx.add(p);
    return p;
  });
  const long = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 46).rotateX(-Math.PI / 2), longMat);
  long.position.set(0, 0.025, -9.45 - 24);
  long.renderOrder = 4;
  headFx.add(long);
  // The spotlight stays in the scene at all times (toggling lights recompiles every shader);
  // the lite tier relies on the additive pools only.
  const spot = mobile ? null : new THREE.SpotLight('#fff4dc', 0, 140, 0.42, 0.6, 1);
  if (spot) {
    spot.position.set(0, 1.25, -9.6);
    spot.target.position.set(0, 0, -45);
    truck.add(spot, spot.target);
  }
  truck.add(headFx);

  // Real light from the streetlights onto the rig: a few spot lights snap to the lamp heads nearest the truck,
  // so light sweeps over the trailer as it passes under each pole. The count is fixed (no shader recompiles).
  const STREET_SPOTS = mobile ? 2 : 4;
  const streetSpots = Array.from({ length: STREET_SPOTS }, () => {
    const l = new THREE.SpotLight('#ffc98f', 0, 60, 1.05, 0.9, 1.4);
    l.castShadow = false;
    scene.add(l, l.target);
    return l;
  });

  // Tail + marker lamps: small red flares visible from behind.
  const tailFlareMat = new THREE.SpriteMaterial({
    map: radialTexture([[0, 'rgba(255,90,80,1)'], [0.2, 'rgba(255,40,30,.7)'], [1, 'rgba(255,0,0,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, fog: false,
  });
  const tailFlares = [];
  for (const [x, y, sc] of [[-1.01, 1.62, 0.75], [1.01, 1.62, 0.75], [-0.18, 4.05, 0.32], [0, 4.05, 0.32], [0.18, 4.05, 0.32]]) {
    const f = new THREE.Sprite(tailFlareMat);
    f.position.set(x, y, 13.36);
    f.scale.setScalar(sc);
    f.userData.base = sc;
    f.renderOrder = 5;
    trailer.add(f);
    tailFlares.push(f);
  }

  /* ---------------- Time of day ---------------- */
  const fogNight = new THREE.Color('#0c131b');
  const fogDay = new THREE.Color('#8696a3');
  const fogWarm = new THREE.Color('#c79474');
  const sunWarm = new THREE.Color('#ff8c47');
  const sunWhite = new THREE.Color('#fff4e6');
  const moon = new THREE.Color('#9db2d2');
  const moonDir = new THREE.Vector3(0.35, 0.85, -0.45).normalize(); // high, over the right shoulder
  const tmpC = new THREE.Color();
  let night = 0;
  let label = 'DAY RUN';

  const currentHour = () => {
    if (timeOfDay !== 'auto' && TOD_HOURS[timeOfDay] != null) return TOD_HOURS[timeOfDay];
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };

  function applyTime() {
    const h = currentHour();
    const { elev, dir } = sunFromHour(h);
    const day = smoothstep(-4, 22, elev);
    const low = elev > -7 ? Math.exp(-(((elev - 2) / 9) ** 2)) : 0;
    night = 1 - smoothstep(-3, 7, elev);
    label = phaseLabel(h, elev);

    su.sunPosition.value.copy(dir);
    envSky.material.uniforms.sunPosition.value.copy(dir);
    // Night is darker overall so the streetlights and headlamps carry the scene.
    renderer.toneMappingExposure = lerp(1.4, 0.46, day);

    if (elev > -2) {
      key.color.copy(sunWhite).lerp(sunWarm, Math.min(1, low * 0.75));
      key.intensity = 4.2 * day;
      key.position.copy(dir).multiplyScalar(140).add(key.target.position);
    }
    if (elev <= -2 || key.intensity < 0.7) {
      key.color.copy(moon);
      key.intensity = Math.max(key.intensity, 0.3 * night);
      if (elev <= -2) key.position.copy(moonDir).multiplyScalar(140).add(key.target.position);
    }

    hemi.intensity = 0.5 + 0.25 * day;
    hemi.color.set('#4f6488').lerp(tmpC.set('#bcd4e6'), day); // moonlit blue at night
    scene.environmentIntensity = 0.22 + 0.2 * day;

    scene.fog.color.copy(fogNight).lerp(fogDay, day).lerp(fogWarm, low * 0.55);
    scene.fog.near = lerp(120, 200, day);
    scene.fog.far = 1400;

    stars.material.opacity = 0.85 * night;
    const cu = clouds.material.uniforms;
    cu.uSunDir.value.copy(dir);
    cu.uSunColor.value.copy(sunWhite).lerp(sunWarm, low).multiplyScalar(day * 0.9);
    cu.uLight.value.set('#1b2433').lerp(tmpC.set('#f4f6f8'), day).lerp(tmpC.set('#ffc9a0'), low * 0.6);
    cu.uDark.value.set('#0b1018').lerp(tmpC.set('#8d99a6'), day).lerp(tmpC.set('#8a6a66'), low * 0.5);
    cu.uAlpha.value = lerp(0.55, 1, day);

    world.setNight(night);

    // Re-bake environment reflections for the new sun.
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
    scene.environment = envRT.texture;
  }
  applyTime();
  const clockTimer = setInterval(applyTime, 60_000);

  /* ---------------- Camera choreography ---------------- */
  let stops = [];
  const measure = () => {
    stops = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return el.getBoundingClientRect().top + scrollY - innerHeight * 0.35;
    }).filter((v) => v != null);
    // The first section's keyframe holds exactly at the top of the page (its raw stop is negative),
    // and every later stop must come after the previous one.
    if (stops.length) stops[0] = 0;
    for (let i = 1; i < stops.length; i++) stops[i] = Math.max(stops[i], stops[i - 1] + 1);
  };
  measure();
  const measureTimer = setInterval(measure, 700);

  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  let wantShift = 0, camShift = 0;
  let wantFov = 40, camFov = 40;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), D = new THREE.Vector3();
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let truckX = 0;
  const _lampW = new THREE.Vector3(), _lampD = new THREE.Vector3();

  // A keyframe's pose for the current orientation. Portrait screens use the key's own portrait framing
  // when it has one; otherwise the camera backs off and centres on the rig.
  function keyPose(k, portrait, pos, look) {
    if (portrait && k.portrait) {
      pos.fromArray(k.portrait.pos);
      look.fromArray(k.portrait.look);
      return;
    }
    pos.fromArray(k.pos);
    look.fromArray(k.look);
    if (!portrait) return;
    const onRoad = pos.x > -10.2 && pos.y < 8;
    look.x *= 0.25;
    pos.sub(look).multiplyScalar(1.5).add(look);
    // Keep low road-level cameras inside the guardrails (outside them the lamp poles block the view).
    if (onRoad) pos.x = Math.max(-9.8, Math.min(5.8, pos.x));
  }

  function desired() {
    const y = scrollY;
    const ks = keys.length ? keys : [0];
    const n = Math.min(stops.length, ks.length);
    let i = 0, t = 0;
    if (n > 1) {
      if (y <= stops[0]) { i = 0; t = 0; }
      else if (y >= stops[n - 1]) { i = n - 1; t = 0; }
      else {
        while (i < n - 1 && y >= stops[i + 1]) i++;
        t = smoothstep(0, 1, (y - stops[i]) / Math.max(1, stops[i + 1] - stops[i]));
      }
    }
    const k0 = KEYS[ks[i] ?? 0], k1 = KEYS[ks[Math.min(i + 1, ks.length - 1)] ?? 0];
    const portrait = camera.aspect < 0.9;
    keyPose(k0, portrait, A, C);
    keyPose(k1, portrait, B, D);
    wantPos.lerpVectors(A, B, t);
    wantLook.lerpVectors(C, D, t);
    wantShift = portrait ? 0 : lerp(k0.shift || 0, k1.shift || 0, t);
    wantFov = lerp(k0.fov || 40, k1.fov || 40, t);
    wantPos.x += truckX + mouse.sx * 1.6;
    wantPos.y += mouse.sy * 0.8;
    wantLook.x += truckX;
  }
  desired();
  camPos.copy(wantPos);
  camLook.copy(wantLook);
  camFov = wantFov;
  camera.fov = camFov;
  camera.updateProjectionMatrix();

  const onPointer = (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  };
  addEventListener('pointermove', onPointer, { passive: true });

  // The canvas is sized in CSS to the *large* viewport, so a mobile address bar showing/hiding
  // never re-allocates the drawing buffer mid-scroll (that was a big source of jank).
  let sizeW = 0, sizeH = 0;
  const resize = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    if (w === sizeW && Math.abs(h - sizeH) < (mobile ? 160 : 1)) return;
    sizeW = w;
    sizeH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
  };
  resize();
  const onResize = () => { measure(); resize(); };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);

  /* ---------------- Loop ---------------- */
  let travel = 0;
  let boost = 0;
  let lastScroll = scrollY;
  let odo = 412860.0;
  let paused = false;
  let raf = 0;
  let last = performance.now();
  let hudT = 0;
  let elapsed = 0;
  let frameEma = 16;
  let perfT = 0;
  let goodSecs = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (paused) return;
    elapsed += dt;

    // Scroll velocity → speed boost.
    const sy = scrollY;
    const v = Math.abs(sy - lastScroll) / Math.max(dt, 1e-3);
    lastScroll = sy;
    const target = Math.min(MAX_BOOST, v * 0.012);
    boost += (target - boost) * (target > boost ? 1 - Math.exp(-2.5 * dt) : 1 - Math.exp(-0.9 * dt));
    const speed = reduce ? 0 : BASE_SPEED + boost;
    travel += speed * dt;
    world.update(travel);

    // Truck motion.
    for (const w of rig.wheels) w.rotation.x -= (speed * dt) / WHEEL_R;
    if (!reduce) {
      // Lane keeping: a slow, small wander; heading follows the lateral velocity (no rigid wobble).
      truckX = Math.sin(elapsed * 0.13) * 0.12 + Math.sin(elapsed * 0.047 + 1.3) * 0.07;
      const vx = Math.cos(elapsed * 0.13) * 0.0156 + Math.cos(elapsed * 0.047 + 1.3) * 0.0033;
      truck.position.x = truckX;
      // Road texture: two small out-of-phase bumps + a hint of pitch and roll.
      truck.position.y = Math.sin(elapsed * 7.3) * 0.005 + Math.sin(elapsed * 11.7 + 1) * 0.003;
      truck.rotation.x = Math.sin(elapsed * 5.1) * 0.0012;
      truck.rotation.z = Math.sin(elapsed * 1.1) * 0.0018 - vx * 0.05;
      truck.rotation.y = -Math.atan2(vx, Math.max(speed, 1));
    }

    // Night lighting on the rig.
    for (const m of rig.headMats) m.emissiveIntensity = 4 * night;
    for (const m of rig.lensMats) m.emissiveIntensity = 0.08 + 2.2 * night;
    if (trailer.userData.tailMat) trailer.userData.tailMat.emissiveIntensity = 0.6 + 1.6 * night;
    poolMat.opacity = 0.4 * night;
    longMat.opacity = 0.1 * night;
    // Street spot lights follow the nearest lamp heads.
    if (night > 0.01) {
      const near = world.nearestLamps(STREET_SPOTS, truck.position.z + 2);
      streetSpots.forEach((l, i) => {
        const p = near[i];
        if (!p) return;
        l.position.set(p.x, p.y - 0.3, p.z);
        l.target.position.set(p.x + (p.x > 0 ? -2.2 : 2.2), 0, p.z);
        // Fade with distance so a light never pops when it hands over to the next pole.
        const fall = Math.max(0, 1 - Math.abs(p.z - (truck.position.z + 2)) / 58);
        l.intensity = 300 * night * fall;
      });
    } else streetSpots.forEach((l) => { l.intensity = 0; });
    // Tail flares read from behind only.
    {
      const behind = Math.min(1, Math.max(0, (camera.position.z - (truck.position.z + 13.3)) / 6 + 0.2));
      tailFlareMat.opacity = (0.25 + 0.75 * night) * behind;
    }
    // Flares only read from in front of the lamps.
    for (const l of lamps) {
      const wp = l.flare.getWorldPosition(_lampW);
      const d = _lampD.subVectors(camera.position, wp);
      const facing = Math.min(1, Math.max(0, (-d.z / Math.max(d.length(), 1e-3) + 0.1) / 0.55));
      l.flare.material.opacity = night * 0.95;
      l.flare.visible = night > 0.01 && facing > 0.02;
      l.flare.scale.setScalar(1.25 * facing);
    }
    headFx.visible = night > 0.01;
    if (spot) spot.intensity = 140 * night;

    // Truck entrance: the rig drives up from behind the camera once it's ready.
    if (intro < 1 && rigReady) {
      intro = reduce ? 1 : Math.min(1, intro + dt / 2.6);
      const e = 1 - Math.pow(1 - intro, 3);
      truck.position.z = (1 - e) * INTRO_Z;
      if (mobile && renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true;
    }

    // Adaptive resolution: drop pixel ratio when frames run long, recover slowly.
    if (dt < 0.1) {
      frameEma += (dt * 1000 - frameEma) * 0.08;
      perfT += dt;
      if (perfT > 1) {
        perfT = 0;
        if (frameEma > 22 && dpr > dprMin) {
          dpr = Math.max(dprMin, +(dpr - 0.15).toFixed(2));
          renderer.setPixelRatio(dpr);
          goodSecs = 0;
        } else if (frameEma < 14 && dpr < dprCap) {
          if (++goodSecs >= 4) {
            dpr = Math.min(dprCap, +(dpr + 0.1).toFixed(2));
            renderer.setPixelRatio(dpr);
            goodSecs = 0;
          }
        } else goodSecs = 0;
      }
    }

    // Camera.
    mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-2.5 * dt));
    mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-2.5 * dt));
    desired();
    const k = reduce ? 1 : 1 - Math.exp(-3.2 * dt);
    camPos.lerp(wantPos, k);
    camShift += (wantShift - camShift) * k;
    camFov += (wantFov - camFov) * k;
    if (Math.abs(camera.fov - camFov) > 1e-3) { camera.fov = camFov; camera.updateProjectionMatrix(); }
    camLook.lerp(wantLook, k);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    // Lens shift: slide the image sideways without changing perspective (filmOffset is in film mm).
    const fo = -camShift * camera.getFilmWidth();
    if (Math.abs(fo - camera.filmOffset) > 1e-4) {
      camera.filmOffset = fo;
      camera.updateProjectionMatrix();
    }

    sky.position.copy(camera.position);
    clouds.position.copy(camera.position);
    stars.position.copy(camera.position);
    clouds.material.uniforms.uTime.value = reduce ? 0 : elapsed;

    renderer.render(scene, camera);

    // HUD feed (≈4 Hz).
    const mph = reduce ? 0 : 58 + boost * 0.9;
    odo += (mph * dt) / 3600;
    hudT += dt;
    if (hudT > 0.25) {
      hudT = 0;
      dispatchEvent(new CustomEvent('jm-scene', { detail: { label, speed: Math.round(mph), odo } }));
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    // Dev-only handle; step() advances frames manually (useful when the tab is in the background).
    window.__jm = {
      scene, truck, trailer, renderer, camera,
      get rig() { return rig; },
      get dpr() { return dpr; },
      step(n = 60) { for (let i = 0; i < n; i++) { cancelAnimationFrame(raf); frame(last + 16.7); } },
    };
  }

  // Warm every shader before the first visible frame (the canvas fades in after this resolves).
  world.update(0);
  try { await renderer.compileAsync(scene, camera); } catch { /* falls back to lazy compile */ }
  raf = requestAnimationFrame(frame);

  const teardown = () => {
    cancelAnimationFrame(raf);
    clearInterval(clockTimer);
    clearInterval(measureTimer);
    removeEventListener('pointermove', onPointer);
    removeEventListener('resize', onResize);
    removeEventListener('orientationchange', onResize);
    disposed = true;
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
        m.dispose();
      }
    });
    envRT?.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
  teardown.setSections = (nextIds, nextKeys) => {
    ids = nextIds || [];
    keys = nextKeys || ids.map((_, i) => i % KEYS.length);
    measure();
  };
  teardown.setPaused = (p) => {
    paused = p;
    last = performance.now();
    lastScroll = scrollY;
  };
  teardown.label = () => label;
  return teardown;
}
