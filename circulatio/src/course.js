// ===================================================================
// CIRCULATIO / courses
//
// A course is a text height-map plus a short list of features. Two
// authoring paths are supported on purpose, because both are wanted:
//   - hand-written character grids (THE TABLET), editable in any editor
//   - generated grids (THE VESSEL), for shapes a grid is bad at
// Both compile down to the same collider set.
//
// Grid characters
//   .        void - no floor, the ball falls through
//   0-9      floor height, in UNIT steps
// Material grid (optional, same dimensions)
//   . or ' ' stone (default)
//   g glass   c chalk   p pitch   a aether
// ===================================================================

import { box, cylinder, ramp, V } from './physics.js';

export const UNIT = 0.7;          // world height of one map step
export const TILE = 1.0;          // world size of one map cell
const BASE_Y = -2.5;              // how far the columns extend downward

const MAT_CHARS = { g: 'glass', c: 'chalk', p: 'pitch', a: 'aether' };

// ---------------------------------------------------------------
// THE VESSEL - generated: a round flask floor with a raised rim,
// an inner shelf, and a hole through the middle.
// ---------------------------------------------------------------
function vesselMap(size) {
  const rows = [];
  const c = (size - 1) / 2;
  for (let z = 0; z < size; z++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, z - c);
      if (d > c + 0.35) row += '.';           // outside the flask
      else if (d > c - 0.8) row += '4';       // rim
      else if (d < 1.6) row += '.';           // the hole at the centre
      else if (d < 3.1) row += '2';           // inner shelf - ONE step up, so a
      else row += '1';                        // ground shot can still climb it

    }
    rows.push(row);
  }
  return rows;
}

const VESSEL_SIZE = 17;

export const COURSES = [
  {
    id: 'vessel',
    name: 'THE VESSEL',
    subtitle: 'Circulatio — the matter rises and falls until it is fixed',
    par: 5,
    map: vesselMap(VESSEL_SIZE),
    spawn: { x: 8, z: 13 },
    bumpers: [
      { x: 4.5, z: 6.5, r: 0.55, h: 2.0 },
      { x: 12.5, z: 6.5, r: 0.55, h: 2.0 },
      { x: 8.5, z: 3.2, r: 0.55, h: 2.0 }
    ],
    ramps: [
      { x: 7, z: 10, w: 2, d: 2, axis: 'z', dir: -1, y0: 1, y1: 2 },
      { x: 7, z: 5, w: 2, d: 2, axis: 'z', dir: 1, y0: 1, y1: 2 }
    ],
    enemies: [
      { x: 4.5, z: 10.5, kind: 'salt' },
      { x: 12.5, z: 10.5, kind: 'sulphur' },
      { x: 8.5, z: 6.5, kind: 'mercury' },
      { x: 5.5, z: 4.5, kind: 'salt' },
      { x: 11.5, z: 4.5, kind: 'sulphur' }
    ],
    powers: [
      { x: 3.5, z: 8.5, id: 'sublimatio' },
      { x: 13.5, z: 8.5, id: 'merkaba' },
      { x: 8.5, z: 12.5, id: 'coagulatio' }
    ]
  },
  {
    id: 'tablet',
    name: 'THE TABLET',
    subtitle: 'A hand-written grid — the whole level is twelve characters wide',
    par: 4,
    map: [
      '444444444444',
      '411111111114',
      '411222222114',
      '412..1111124',
      '412..1111124',
      '411222222114',
      '411111111114',
      '444444444444'
    ],
    mats: [
      '............',
      '..gg........',
      '............',
      '..........c.',
      '..........c.',
      '............',
      '........pp..',
      '............'
    ],
    spawn: { x: 1.5, z: 1.5 },   // NOT z 4.5: the pit sits square between that and every body
    bumpers: [{ x: 6.5, z: 1.5, r: 0.5, h: 1.8 }],
    ramps: [],
    enemies: [
      { x: 6.5, z: 3.5, kind: 'salt' },
      { x: 9.5, z: 6.5, kind: 'mercury' },
      { x: 3.5, z: 2.5, kind: 'sulphur' }
    ],
    powers: [
      { x: 8.5, z: 1.5, id: 'vesica' },
      { x: 2.5, z: 6.5, id: 'calcinatio' }
    ]
  }
];

// ---------------------------------------------------------------
// Grid queries
// ---------------------------------------------------------------
export function gridSize(course) {
  return { w: course.map[0].length, d: course.map.length };
}

export function heightAt(course, tx, tz) {
  if (tz < 0 || tz >= course.map.length) return null;
  const row = course.map[tz];
  if (tx < 0 || tx >= row.length) return null;
  const ch = row[tx];
  if (ch === '.' || ch === ' ') return null;      // void
  const n = parseInt(ch, 10);
  return isNaN(n) ? null : n * UNIT;
}

export function matAt(course, tx, tz) {
  if (!course.mats) return 'stone';
  const row = course.mats[tz];
  if (!row) return 'stone';
  return MAT_CHARS[row[tx]] || 'stone';
}

// World height under a world-space x/z, for placing things on the floor.
export function surfaceY(course, x, z) {
  const h = heightAt(course, Math.floor(x / TILE), Math.floor(z / TILE));
  return h === null ? -999 : h;
}

// ---------------------------------------------------------------
// Compile a course to colliders.
// One box per tile, deliberately unmerged: a lettrist inscription
// rewrites a single tile's law, so tiles must stay addressable.
// ---------------------------------------------------------------
export function buildColliders(course) {
  const { w, d } = gridSize(course);
  const out = [];
  for (let z = 0; z < d; z++) {
    for (let x = 0; x < w; x++) {
      const h = heightAt(course, x, z);
      if (h === null) continue;
      const b = box({ x: x * TILE, y: BASE_Y, z: z * TILE },
                    { x: (x + 1) * TILE, y: h, z: (z + 1) * TILE },
                    matAt(course, x, z));
      b.tile = { x, z };
      b.top = h;
      out.push(b);
    }
  }
  for (const bp of (course.bumpers || [])) {
    const base = surfaceY(course, bp.x, bp.z);
    out.push(cylinder(bp.x, bp.z, bp.r, base, base + bp.h, 'bumper'));
  }
  for (const rp of (course.ramps || [])) {
    out.push(ramp(
      { x: rp.x * TILE, y: rp.y0 * UNIT, z: rp.z * TILE },
      { x: (rp.x + rp.w) * TILE, y: rp.y1 * UNIT, z: (rp.z + rp.d) * TILE },
      rp.axis, rp.dir, rp.mat || 'stone'
    ));
  }
  return out;
}

// ---------------------------------------------------------------
// Broadphase. Without this the shot preview - which runs several
// hundred real simulation steps every time the aim changes - would
// test every collider on the course at every one of them.
// ---------------------------------------------------------------
export function buildWorld(course) {
  const colliders = buildColliders(course);
  const cell = 2.0;
  const index = new Map();
  const key = (gx, gz) => gx + ',' + gz;

  function insert(i, minX, minZ, maxX, maxZ) {
    for (let gx = Math.floor(minX / cell); gx <= Math.floor(maxX / cell); gx++) {
      for (let gz = Math.floor(minZ / cell); gz <= Math.floor(maxZ / cell); gz++) {
        const k = key(gx, gz);
        let list = index.get(k);
        if (!list) { list = []; index.set(k, list); }
        list.push(i);
      }
    }
  }

  colliders.forEach(function (c, i) {
    if (c.kind === 'cyl') insert(i, c.cx - c.r, c.cz - c.r, c.cx + c.r, c.cz + c.r);
    else insert(i, c.min.x, c.min.z, c.max.x, c.max.z);
  });

  const scratch = [];
  const seen = new Set();

  return {
    all: colliders,
    course: course,
    query: function (pos, r) {
      scratch.length = 0;
      seen.clear();
      const gx0 = Math.floor((pos.x - r) / cell), gx1 = Math.floor((pos.x + r) / cell);
      const gz0 = Math.floor((pos.z - r) / cell), gz1 = Math.floor((pos.z + r) / cell);
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gz = gz0; gz <= gz1; gz++) {
          const list = index.get(key(gx, gz));
          if (!list) continue;
          for (let i = 0; i < list.length; i++) {
            if (seen.has(list[i])) continue;
            seen.add(list[i]);
            scratch.push(colliders[list[i]]);
          }
        }
      }
      return scratch;
    },
    tileCollider: function (tx, tz) {
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.tile && c.tile.x === tx && c.tile.z === tz) return c;
      }
      return null;
    }
  };
}

export function spawnPoint(course, ballR) {
  const y = surfaceY(course, course.spawn.x, course.spawn.z);
  return { x: course.spawn.x, y: y + (ballR || 0.32) + 0.02, z: course.spawn.z };
}

export function courseBounds(course) {
  const { w, d } = gridSize(course);
  return { w: w * TILE, d: d * TILE, cx: (w * TILE) / 2, cz: (d * TILE) / 2 };
}
