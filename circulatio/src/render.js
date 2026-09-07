// ===================================================================
// CIRCULATIO / rendering
//
// Paper-diorama look, deliberately continuous with the other games in
// this repo: cream ground, ink linework, four flat colours. Flat
// Lambert materials and an orthographic camera at the true isometric
// elevation (35.264 degrees), so the course reads as a drawing that
// happens to have depth.
// ===================================================================

import * as THREE from 'three';
import { UNIT, TILE, gridSize, heightAt, matAt, courseBounds, surfaceY } from './course.js';
import { rampSurface } from './physics.js';

export const PAL = {
  paper:  0xf4f1e4,
  ink:    0x2f3437,
  red:    0xe8402a,
  cyan:   0x29a8e0,
  yellow: 0xf5c518,
  brown:  0x6b4423
};

const MAT_COLOR = {
  stone:  0xece7d4,
  chalk:  0xf6f2e2,
  glass:  0xc7dfe8,
  pitch:  0x4a4038,
  aether: 0xdcd2e6,
  bumper: 0xe8402a
};

const ENEMY_COLOR = { salt: 0x29a8e0, sulphur: 0xe8402a, mercury: 0x6b4423 };

const ISO_ELEVATION = Math.atan(1 / Math.SQRT2);   // 35.264 degrees

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.paper);

  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, -80, 200);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcdc4ad, 1.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff6e2, 0.55);
  sun.position.set(-14, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 70;
  scene.add(sun);
  scene.add(sun.target);

  return { renderer, scene, camera, sun };
}

// ---------------------------------------------------------------
// Camera: orthographic, four fixed quarter-turns like the cabinet
// games this borrows from.
// ---------------------------------------------------------------
export function placeCamera(view, course, quarter, zoom) {
  const b = courseBounds(course);
  const cam = view.camera;
  const span = Math.max(b.w, b.d) * 0.62 * (zoom || 1);
  const aspect = view.aspect || 1;
  cam.left = -span * aspect; cam.right = span * aspect;
  cam.top = span; cam.bottom = -span;

  const az = Math.PI / 4 + quarter * Math.PI / 2;
  const dist = 40;
  const cx = b.cx, cz = b.cz;
  cam.position.set(
    cx + Math.cos(az) * Math.cos(ISO_ELEVATION) * dist,
    Math.sin(ISO_ELEVATION) * dist,
    cz + Math.sin(az) * Math.cos(ISO_ELEVATION) * dist
  );
  cam.lookAt(cx, 0, cz);
  cam.updateProjectionMatrix();

  view.sun.position.set(cx - 14, 24, cz + 10);
  view.sun.target.position.set(cx, 0, cz);
  view.sun.target.updateMatrixWorld();
}

export function resize(view, w, h) {
  view.aspect = w / h;
  view.renderer.setSize(w, h, false);
}

// ---------------------------------------------------------------
// Build the course. Tiles go into one InstancedMesh; their top edges
// into one LineSegments, which is what gives the drawn-on-paper grid.
// ---------------------------------------------------------------
export function buildCourseMeshes(scene, course) {
  const group = new THREE.Group();
  const { w, d } = gridSize(course);

  const cells = [];
  for (let z = 0; z < d; z++) {
    for (let x = 0; x < w; x++) {
      const h = heightAt(course, x, z);
      if (h === null) continue;
      cells.push({ x, z, h, mat: matAt(course, x, z) });
    }
  }

  const depth = 3.2;
  const geo = new THREE.BoxGeometry(TILE, 1, TILE);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: false });
  const tiles = new THREE.InstancedMesh(geo, mat, cells.length);
  tiles.castShadow = true;
  tiles.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cells.forEach(function (c, i) {
    dummy.position.set(c.x * TILE + TILE / 2, c.h - depth / 2, c.z * TILE + TILE / 2);
    dummy.scale.set(1, depth, 1);
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
    color.setHex(MAT_COLOR[c.mat] || MAT_COLOR.stone);
    tiles.setColorAt(i, color);
  });
  tiles.instanceMatrix.needsUpdate = true;
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  group.add(tiles);
  group.userData.tiles = tiles;
  group.userData.cells = cells;

  // ink outline of every tile top
  const pts = [];
  const eps = 0.006;
  for (const c of cells) {
    const x0 = c.x * TILE, x1 = x0 + TILE, z0 = c.z * TILE, z1 = z0 + TILE, y = c.h + eps;
    pts.push(x0, y, z0, x1, y, z0);
    pts.push(x1, y, z0, x1, y, z1);
    pts.push(x1, y, z1, x0, y, z1);
    pts.push(x0, y, z1, x0, y, z0);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.22 })
  );
  group.add(lines);

  // bumpers
  for (const bp of (course.bumpers || [])) {
    const base = surfaceY(course, bp.x, bp.z);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(bp.r, bp.r * 1.05, bp.h, 20),
      new THREE.MeshLambertMaterial({ color: PAL.red })
    );
    m.position.set(bp.x, base + bp.h / 2, bp.z);
    m.castShadow = true;
    group.add(m);
  }

  // ramps, as wedges built from their own surface function
  for (const rp of (course.ramps || [])) {
    group.add(buildRampMesh(rp));
  }

  scene.add(group);
  return group;
}

function buildRampMesh(rp) {
  const x0 = rp.x * TILE, x1 = (rp.x + rp.w) * TILE;
  const z0 = rp.z * TILE, z1 = (rp.z + rp.d) * TILE;
  const fake = {
    kind: 'ramp', axis: rp.axis, dir: rp.dir,
    min: { x: x0, y: rp.y0 * UNIT, z: z0 },
    max: { x: x1, y: rp.y1 * UNIT, z: z1 }
  };
  const yA = rampSurface(fake, x0, z0).y;
  const yB = rampSurface(fake, x1, z0).y;
  const yC = rampSurface(fake, x1, z1).y;
  const yD = rampSurface(fake, x0, z1).y;
  const low = rp.y0 * UNIT - 3.0;

  const v = [
    x0, yA, z0,  x1, yB, z0,  x1, yC, z1,  x0, yD, z1,   // top
    x0, low, z0, x1, low, z0, x1, low, z1, x0, low, z1   // bottom
  ];
  const idx = [
    0, 1, 2, 0, 2, 3,      // top
    4, 6, 5, 4, 7, 6,      // bottom
    0, 4, 5, 0, 5, 1,      // -z side
    1, 5, 6, 1, 6, 2,      // +x side
    2, 6, 7, 2, 7, 3,      // +z side
    3, 7, 4, 3, 4, 0       // -x side
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xd8d0b8 }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------
// Actors
// ---------------------------------------------------------------
export function makeBall(r) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(r, 28, 20),
    new THREE.MeshLambertMaterial({ color: 0xfbf7ea })
  );
  body.castShadow = true;
  g.add(body);
  // a band, so spin and roll are legible
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(r * 0.99, r * 0.10, 8, 32),
    new THREE.MeshBasicMaterial({ color: PAL.ink })
  );
  band.rotation.x = Math.PI / 2;
  g.add(band);
  g.userData.body = body;
  return g;
}

export function makeEnemy(kind) {
  const color = ENEMY_COLOR[kind] || PAL.ink;
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.52, 0),
    new THREE.MeshLambertMaterial({ color: color })
  );
  m.castShadow = true;
  g.add(m);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.04, 6, 24),
    new THREE.MeshBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.55 })
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.userData.core = m;
  g.userData.ring = ring;
  return g;
}

export function makeCup() {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.07, 10, 32),
    new THREE.MeshLambertMaterial({ color: PAL.yellow })
  );
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const well = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 28),
    new THREE.MeshBasicMaterial({ color: PAL.ink })
  );
  well.rotation.x = -Math.PI / 2;
  well.position.y = 0.005;
  g.add(well);
  g.userData.rim = rim;
  return g;
}

export function makePower(color) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.3, 0),
    new THREE.MeshLambertMaterial({ color: color })
  );
  m.castShadow = true;
  g.add(m);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.025, 6, 24),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 })
  );
  halo.rotation.x = Math.PI / 2;
  g.add(halo);
  g.userData.core = m;
  return g;
}

// ---------------------------------------------------------------
// Shot preview: the path the ball will actually take.
// ---------------------------------------------------------------
export function makePreview() {
  const g = new THREE.Group();
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * 1200), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.75 }));
  line.frustumCulled = false;
  g.add(line);

  const dotGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: PAL.red });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, 40);
  dots.frustumCulled = false;
  g.add(dots);

  const endRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.035, 6, 20),
    new THREE.MeshBasicMaterial({ color: PAL.ink })
  );
  endRing.rotation.x = Math.PI / 2;
  g.add(endRing);

  g.userData = { line, dots, endRing, lineGeo };
  return g;
}

export function updatePreview(preview, result) {
  const { line, dots, endRing, lineGeo } = preview.userData;
  const pos = lineGeo.attributes.position;
  const n = Math.min(result.path.length, 1200);
  for (let i = 0; i < n; i++) {
    pos.setXYZ(i, result.path[i].x, result.path[i].y, result.path[i].z);
  }
  // collapse the tail onto the last real point rather than leaving stale data
  for (let i = n; i < 1200; i++) {
    const p = result.path[n - 1] || { x: 0, y: -50, z: 0 };
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
  lineGeo.setDrawRange(0, Math.max(2, n));

  const dummy = new THREE.Object3D();
  const count = Math.min(result.impacts.length, 40);
  for (let i = 0; i < 40; i++) {
    if (i < count) {
      const p = result.impacts[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(1);
    } else {
      dummy.position.set(0, -999, 0);
      dummy.scale.setScalar(0.001);
    }
    dummy.updateMatrix();
    dots.setMatrixAt(i, dummy.matrix);
  }
  dots.instanceMatrix.needsUpdate = true;
  dots.count = 40;

  endRing.position.set(result.end.x, result.end.y - 0.25, result.end.z);
  endRing.visible = result.settled;
}

export function makeAimArrow() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.07, 1.5),
    new THREE.MeshBasicMaterial({ color: PAL.ink })
  );
  shaft.position.z = 0.85;
  g.add(shaft);
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.36, 4),
    new THREE.MeshBasicMaterial({ color: PAL.red })
  );
  head.rotation.x = Math.PI / 2;
  head.position.z = 1.75;
  g.add(head);
  return g;
}
