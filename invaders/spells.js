// ===================================================================
// SPELLS AND THE POWER BAR
//
// Two separate systems, deliberately, because they answer two different
// questions and players confuse them when a game merges them:
//
//   AZOTH + SPELLS — three operations on three keys, each costing from
//   a pool that refills on its own. This is the "special weapon" button.
//
//   THE POWER BAR — Gradius. Destroyed blocks drop capsules, each capsule
//   advances a cursor along a row of slots, and SHIFT spends the cursor
//   on whatever slot it is standing on. Salamandra uses exactly the same
//   gesture, so learning it once covers both games.
// ===================================================================

const AZOTH_MAX = 100;
const AZOTH_REGEN = 7.5;        // per second

// ---------- the three operations ----------
// Solve et coagula, and then the projection. The whole art in three keys.
const SPELLS = {
  solve: {
    key: 'Z', name: 'SOLVE', glyph: '🜄', cost: 30, color: '#3d8fd1',
    tagline: 'dissolve what has hardened',
    teach: 'SOLVE is the universal solvent. Every hardened or armoured block on the board goes soft, and salt pillars are unmade outright. Cast it when the board has crystallised and nothing you shoot is breaking.',
    cast(g) {
      let n = 0;
      for (const b of g.blocks) {
        if (!b.alive) continue;
        if (b.armour) { b.armour = 0; b.flash = 0.3; n++; }
        // Setting hp to 0 is not enough: nothing re-reads hp outside the cascade,
        // so the pillar has to be struck dead here or SOLVE silently does nothing.
        if (b.glyphKey === 'salt') { b.hp = 0; b.alive = false; b.flash = 0.4; n++; }
      }
      return { text: '🜄 SOLVE — ' + n + ' bodies loosened', shake: 6 };
    }
  },
  coagula: {
    key: 'X', name: 'COAGULA', glyph: '🜔', cost: 40, color: '#e8e2d0',
    tagline: 'fix the volatile in place',
    teach: 'COAGULA fixes what will not hold still. Everything on the board freezes for six seconds — and a FROZEN Mercury is the only Mercury you can actually kill, because normally it teleports away from every shot.',
    cast(g) {
      let n = 0;
      for (const b of g.blocks) if (b.alive) { b.frozen = 6; b.flash = 0.2; n++; }
      return { text: '🜔 COAGULA — ' + n + ' held fast. Now strike the volatile.', shake: 4 };
    }
  },
  projectio: {
    key: 'C', name: 'PROJECTIO', glyph: '☉', cost: 75, color: '#e8b923',
    tagline: 'cast the stone — the base metal becomes gold',
    teach: 'PROJECTIO is the end of the Great Work: the stone thrown upon base metal. The lowest row becomes gold, worth a fortune — but gold answers to nothing but SOL, so load gold before you cast this or you will have built yourself a wall.',
    cast(g) {
      const live = g.blocks.filter(b => b.alive);
      if (!live.length) return { text: '☉ nothing to transmute', shake: 0 };
      const lowest = Math.max.apply(null, live.map(b => b.gy));
      let n = 0;
      for (const b of live) {
        if (b.gy >= lowest - 1 && b.glyphKey !== 'sol') {
          b.glyphKey = 'sol'; b.def = GLYPHS.sol; b.hp = GLYPHS.sol.hp; b.flash = 0.5; n++;
        }
      }
      return { text: '☉ PROJECTIO — ' + n + ' turned to gold. Load SOL (key 5) to open it.', shake: 10 };
    }
  }
};
const SPELL_ORDER = ['solve', 'coagula', 'projectio'];

// ---------- the Gradius bar ----------
// Left to right, cheapest first. The cursor walks along it as you collect
// capsules; SHIFT spends the cursor where it stands.
const POWER_SLOTS = [
  { id: 'speed',  name: 'SPEED',   glyph: '☿', max: 3,
    teach: 'Your vessel moves faster. Stacks three times.' },
  { id: 'twin',   name: 'TWIN',    glyph: '♊', max: 1,
    teach: 'A second barrel: every shot is fired twice, slightly apart.' },
  { id: 'pierce', name: 'LANCE',   glyph: '♐', max: 1,
    teach: 'Shots pass THROUGH the first block instead of stopping at it.' },
  { id: 'wide',   name: 'SPREAD',  glyph: '🜁', max: 1,
    teach: 'A three-way spread. Covers lanes you are not aimed at.' },
  { id: 'shield', name: 'AEGIS',   glyph: '🜔', max: 2,
    teach: 'Restores a broken shield beneath you.' },
  { id: 'azoth',  name: 'AZOTH',   glyph: '🜍', max: 4,
    teach: 'Your spell pool refills faster, for ever. Take this if you like casting.' }
];

function makeArsenal() {
  return {
    azoth: AZOTH_MAX,
    cursor: -1,              // -1 = nothing banked
    owned: {},               // slot id -> stacks
    lastCast: null,
    castFlash: 0
  };
}

// a capsule advances the cursor one slot along the bar, wrapping
function takeCapsule(ars) {
  ars.cursor = (ars.cursor + 1) % POWER_SLOTS.length;
}

// SHIFT — spend the cursor
function spendBar(ars) {
  if (ars.cursor < 0) return { ok: false, text: 'no capsule banked — destroy blocks to fill the bar' };
  const slot = POWER_SLOTS[ars.cursor];
  const have = ars.owned[slot.id] || 0;
  if (have >= slot.max) return { ok: false, text: slot.name + ' is already at maximum' };
  ars.owned[slot.id] = have + 1;
  ars.cursor = -1;
  return { ok: true, text: slot.glyph + ' ' + slot.name + ' taken — ' + slot.teach, slot: slot };
}

function castSpell(ars, id, game) {
  const sp = SPELLS[id];
  if (!sp) return { ok: false, text: 'no such operation' };
  if (ars.azoth < sp.cost) {
    return { ok: false, text: sp.name + ' needs ' + sp.cost + ' azoth — you have ' + Math.floor(ars.azoth) };
  }
  ars.azoth -= sp.cost;
  ars.lastCast = id;
  ars.castFlash = 0.6;
  const r = sp.cast(game);
  return { ok: true, text: r.text, shake: r.shake || 0, spell: sp };
}

function regenAzoth(ars, dt) {
  const bonus = 1 + 0.45 * (ars.owned.azoth || 0);
  ars.azoth = Math.min(AZOTH_MAX, ars.azoth + AZOTH_REGEN * bonus * dt);
}

if (typeof window !== 'undefined') {
  window.SPELLS = SPELLS;
  window.SPELL_ORDER = SPELL_ORDER;
  window.POWER_SLOTS = POWER_SLOTS;
  window.makeArsenal = makeArsenal;
  window.takeCapsule = takeCapsule;
  window.spendBar = spendBar;
  window.castSpell = castSpell;
  window.regenAzoth = regenAzoth;
  window.AZOTH_MAX = AZOTH_MAX;
}
