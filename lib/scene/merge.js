// Draw-call reduction: bake static meshes that share a material into one mesh.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const ATTRS = ['position', 'normal', 'uv'];

// Plain Float32 copy (de-quantized) with the transform baked in, so any geometry can be merged.
export function bakeGeometry(geo, matrix) {
  const src = geo.index ? geo : geo;
  const count = src.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const name of ATTRS) {
    const a = src.attributes[name];
    const size = name === 'uv' ? 2 : 3;
    const arr = new Float32Array(count * size);
    if (a) {
      for (let i = 0; i < count; i++) {
        arr[i * size] = a.getX(i);
        arr[i * size + 1] = a.getY(i);
        if (size === 3) arr[i * size + 2] = a.getZ(i);
      }
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  if (!src.attributes.normal) out.computeVertexNormals();
  let index;
  if (src.index) index = Uint32Array.from(src.index.array);
  else index = Uint32Array.from({ length: count }, (_, i) => i);
  // A mirrored transform flips triangle winding; swap two corners to keep faces pointing out.
  if (matrix.determinant() < 0) {
    for (let i = 0; i < index.length; i += 3) {
      const t = index[i + 1];
      index[i + 1] = index[i + 2];
      index[i + 2] = t;
    }
  }
  out.setIndex(new THREE.BufferAttribute(index, 1));
  out.applyMatrix4(matrix);
  return out;
}

/**
 * Merge every plain Mesh under `root` (in root-local space) that shares a material.
 * Subtrees listed in `skip` (e.g. spinning wheel pivots) are left alone.
 */
export function mergeStatic(root, skip = []) {
  const skipSet = new Set(skip);
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  const visit = (o) => {
    if (o !== root && skipSet.has(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.visible && !o.morphTargetInfluences) {
      const key = `${o.material.uuid}|${o.renderOrder}|${o.castShadow}|${o.receiveShadow}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(o);
    }
    for (const c of [...o.children]) visit(c);
  };
  visit(root);

  let removed = 0;
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const geos = meshes.map((m) => bakeGeometry(m.geometry, new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const first = meshes[0];
    const mesh = new THREE.Mesh(merged, first.material);
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    mesh.renderOrder = first.renderOrder;
    mesh.name = `merged:${first.material.name || first.material.type}`;
    root.add(mesh);
    for (const m of meshes) {
      m.removeFromParent();
      removed++;
    }
  }
  // Drop now-empty helper groups.
  const prune = (o) => {
    for (const c of [...o.children]) {
      prune(c);
      if (!c.isMesh && !c.isLight && !c.isPoints && c.children.length === 0 && !skipSet.has(c) && c.type === 'Group') c.removeFromParent();
      else if (c.type === 'Object3D' && c.children.length === 0) c.removeFromParent();
    }
  };
  prune(root);
  return removed;
}

// Wheels on the same axle share a rotation axis, so they can live in one pivot.
// Returns the new pivots (one per axle), positioned at x = 0 on the axle line.
function groupAxles(root, wheels) {
  root.updateMatrixWorld(true);
  const axles = new Map();
  const p = new THREE.Vector3();
  for (const w of wheels) {
    root.worldToLocal(w.getWorldPosition(p));
    const key = `${p.y.toFixed(1)}|${p.z.toFixed(1)}`;
    if (!axles.has(key)) {
      const pivot = new THREE.Group();
      pivot.position.set(0, p.y, p.z);
      root.add(pivot);
      pivot.updateMatrixWorld(true);
      axles.set(key, pivot);
    }
    const pivot = axles.get(key);
    w.rotation.x = 0;
    w.updateMatrixWorld(true);
    pivot.attach(w);
  }
  return [...axles.values()];
}

// Merge a rig: static body in one pass, then each axle on its own (so it can still spin).
// Returns the axle pivots to spin.
export function optimizeRig(root, wheels = []) {
  const axles = wheels.length ? groupAxles(root, wheels) : [];
  mergeStatic(root, axles);
  for (const a of axles) mergeStatic(a);
  return axles;
}
