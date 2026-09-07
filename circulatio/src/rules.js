// ===================================================================
// CIRCULATIO / rulesets, powers, letters
//
// The central idea, taken from the lettrist-engine notes: a historical
// metaphysical system is not a skin on the physics, it IS the physics.
// Selecting a ruleset swaps gravity, restitution, friction and drag, so
// the same course plays as a different puzzle - and a line that solves
// it under one system can be impossible under another.
//
// PROVENANCE is tracked on every entry, following the discipline in
// TurkaGame: never let a good mechanic pass itself off as a source.
//   SOURCE         historically attested doctrine
//   INTERPRETATION our reading of an attested doctrine
//   GAME FICTION   invented here, for play
// ===================================================================

export const PROV = {
  SOURCE: 'SOURCE',
  INTERPRETATION: 'INTERPRETATION',
  FICTION: 'GAME FICTION'
};

// Every ruleset must supply this whole shape; physics.js reads it directly.
const BASE = {
  gravity: 22,
  restitution: 1.0,     // multiplies the surface material
  friction: 1.0,        // multiplies the surface material
  airDrag: 0.0015,      // per 1/60 s
  rollDrag: 1.60,       // rolling friction coefficient; decel = mu * this * gravity
  magnus: 0.9,          // how hard sidespin curves the path
  spinBite: 0.5,        // how much english survives a wall bounce
  spinDecay: 0.985,
  settleSpeed: 0.9,     // below this normal speed, a contact settles instead of bouncing
  stopSpeed: 0.45,      // below this, the ball is considered at rest
  stopTime: 0.28,
  quantize: null
};

function ruleset(o) { return Object.assign({}, BASE, o); }

export const RULESETS = {
  aristotelian: ruleset({
    id: 'aristotelian',
    name: 'ARISTOTELIAN',
    subtitle: 'Four elements, natural place',
    provenance: PROV.INTERPRETATION,
    note:
      'Heavy bodies seek the centre; motion is toward a natural place and stops when it ' +
      'arrives. Read as physics: strong gravity, dead bounces, ground that grips. The ball ' +
      'wants to be still, and rest is not failure but arrival.',
    source: 'Aristotle, Physics IV and De Caelo, as received in the Latin and Arabic commentary traditions.',
    gravity: 30, restitution: 0.72, friction: 1.35, rollDrag: 1.25, magnus: 0.45
  }),

  paracelsian: ruleset({
    id: 'paracelsian',
    name: 'PARACELSIAN',
    subtitle: 'Sulphur, Salt, Mercury',
    provenance: PROV.INTERPRETATION,
    note:
      'Three principles rather than four elements: Sulphur the combustible, Salt the fixed, ' +
      'Mercury the volatile and fugitive. Mercury dominates the reading here - the world is ' +
      'slippery and rebounds hard. Long lines are possible; stopping where you meant to is not.',
    source: 'Paracelsus, tria prima, as set out in the Opus Paramirum and its later expositors.',
    gravity: 19, restitution: 1.32, friction: 0.55, rollDrag: 3.00, magnus: 1.25, spinBite: 0.8
  }),

  pythagorean: ruleset({
    id: 'pythagorean',
    name: 'IKHWAN / PYTHAGOREAN',
    subtitle: 'Number governs proportion',
    provenance: PROV.INTERPRETATION,
    note:
      'The Brethren of Purity treat number and consonant ratio as the armature of the cosmos. ' +
      'Read as physics: every rebound is snapped to a musical ratio - 1:2, 2:3, 3:4, 8:9 - so ' +
      'bounce heights walk a scale instead of decaying smoothly. Rebounds become predictable ' +
      'in a way no other ruleset allows, which makes long bounce chains plannable.',
    source: 'Rasaʼil Ikhwan al-Safaʼ, the epistles on arithmetic and music.',
    gravity: 21, restitution: 1.0, friction: 0.9, rollDrag: 1.60,
    quantize: [0.125, 0.25, 0.375, 0.5, 0.667, 0.75, 0.889, 1.0]
  }),

  lettrist: ruleset({
    id: 'lettrist',
    name: 'LETTRIST',
    subtitle: 'ʿilm al-ḥurūf — the world is written',
    provenance: PROV.FICTION,
    note:
      'The science of letters holds that the alphabet is the substrate of creation, not a ' +
      'description of it. Read as physics, and this is our invention rather than any source: ' +
      'the global constants go slack and LOCAL law is whatever letter is written on the tile ' +
      'you are touching. Inscribe the course and you have rewritten how it behaves.',
    source: 'Framing after the ʿilm al-ḥurūf tradition and Melvin-Koushki\'s work on ' +
            'Timurid and Ottoman lettrism; the physical mapping is ours.',
    gravity: 21, restitution: 1.0, friction: 1.0, rollDrag: 1.70,
    // resolved per-contact against whatever letter is inscribed on the collider
    materialOverride: function (collider) { return collider.letterMat || collider.mat; }
  })
};

export const RULESET_ORDER = ['aristotelian', 'paracelsian', 'pythagorean', 'lettrist'];

// ===================================================================
// Letters - the lettrist ruleset's instruction set, slice 1.
//
// Per the notes: data-driven, several property layers, multiple possible
// affordances, provenance marked. Right now a letter's game operation is
// to rewrite the SURFACE LAW of the tile it is inscribed on. That is
// deliberately the shallowest rung of the ladder in those notes (letters
// manipulate materials); the deeper rungs - letters manipulating
// processes and rules - hang off the same table.
// ===================================================================

export const LETTERS = {
  alif: {
    glyph: 'ا', name: 'alif', translit: 'a', abjad: 1,
    element: 'fire', temperament: 'hot / dry',
    provenance: PROV.SOURCE,
    gloss:
      'First letter, numerical value 1, written as a single upright stroke. Standardly the ' +
      'letter of unity and of the vertical - the pillar, the beginning of the count.',
    operation: 'Makes the tile AETHER: almost frictionless, almost perfectly elastic. The ball keeps what it has.',
    opProvenance: PROV.FICTION,
    mat: 'aether'
  },
  ba: {
    glyph: 'ب', name: 'bāʼ', translit: 'b', abjad: 2,
    element: 'earth', temperament: 'cold / dry',
    provenance: PROV.SOURCE,
    gloss:
      'Value 2, one dot below. The first letter of the Basmala, and in several lettrist ' +
      'readings the letter of the created world - the point at which unity becomes duality.',
    operation: 'Makes the tile CHALK: heavy grip, dead rebound. Written where you need the ball to stop.',
    opProvenance: PROV.FICTION,
    mat: 'chalk'
  },
  jim: {
    glyph: 'ج', name: 'jīm', translit: 'j', abjad: 3,
    element: 'water', temperament: 'cold / moist',
    provenance: PROV.SOURCE,
    gloss:
      'Value 3, one dot within. Grouped with the watery letters in the standard elemental ' +
      'assignments of the four-fold letter tables.',
    operation: 'Makes the tile GLASS: slick, so the ball slides on rather than settling.',
    opProvenance: PROV.FICTION,
    mat: 'glass'
  },
  mim: {
    glyph: 'م', name: 'mīm', translit: 'm', abjad: 40,
    element: 'water', temperament: 'cold / moist',
    provenance: PROV.SOURCE,
    gloss:
      'Value 40, a closed loop on the line. Associated with the material and the maternal in ' +
      'much of the tradition; the closed form is read as enclosure and containment.',
    operation: 'Makes the tile PITCH: it swallows momentum outright. A written trap.',
    opProvenance: PROV.FICTION,
    mat: 'pitch'
  },
  nun: {
    glyph: 'ن', name: 'nūn', translit: 'n', abjad: 50,
    element: 'air', temperament: 'hot / moist',
    provenance: PROV.SOURCE,
    gloss:
      'Value 50, a bowl with a single dot above - read across the tradition as the vessel, ' +
      'and by extension the inkwell and the fish.',
    operation: 'Makes the tile a BUMPER surface: it returns more than it receives.',
    opProvenance: PROV.FICTION,
    mat: 'bumper'
  }
};

export const LETTER_ORDER = ['alif', 'ba', 'jim', 'mim', 'nun'];

// ===================================================================
// Powers. Alchemical operations and sacred-geometry figures, each of
// which changes what a shot can do rather than adding a number.
// ===================================================================

export const POWERS = {
  calcinatio: {
    id: 'calcinatio', name: 'CALCINATIO', glyph: 'F525', symbol: '△',
    family: 'operation', color: '#e8402a',
    provenance: PROV.INTERPRETATION,
    gloss:
      'Calcination: reduction by fire to a dry ash. The first operation of the work, and the ' +
      'one that destroys in order to begin.',
    effect: 'The next shot burns through brittle blocks instead of bouncing off them.',
    apply: function (shot) { shot.burn = true; }
  },
  solutio: {
    id: 'solutio', name: 'SOLUTIO', symbol: '▽',
    family: 'operation', color: '#29a8e0',
    provenance: PROV.INTERPRETATION,
    gloss: 'Dissolution: the fixed made fluid, the body returned to water.',
    effect: 'The next shot ignores friction entirely. Nothing grips you; nothing stops you either.',
    apply: function (shot) { shot.frictionless = true; }
  },
  sublimatio: {
    id: 'sublimatio', name: 'SUBLIMATIO', symbol: '△̵',
    family: 'operation', color: '#f5c518',
    provenance: PROV.INTERPRETATION,
    gloss:
      'Sublimation: the solid passing to vapour without melting, rising to the head of the vessel.',
    effect: 'One upward impulse in mid-flight, on command. The second jump.',
    apply: function (shot) { shot.lift = 1; }
  },
  coagulatio: {
    id: 'coagulatio', name: 'COAGULATIO', symbol: '▽̵',
    family: 'operation', color: '#6b4423',
    provenance: PROV.INTERPRETATION,
    gloss: 'Coagulation: the volatile fixed, the spirit given a body. The end of the work.',
    effect: 'The ball becomes heavy: no rebound at all, and it stops nearly where it lands.',
    apply: function (shot) { shot.heavy = true; }
  },
  vesica: {
    id: 'vesica', name: 'VESICA', symbol: '○○',
    family: 'figure', color: '#2f3437',
    provenance: PROV.INTERPRETATION,
    gloss:
      'The vesica piscis: two circles of equal radius each passing through the other’s ' +
      'centre, the generative figure of the whole Flower of Life construction.',
    effect: 'The shot splits into two mirrored balls. Either may take the cup.',
    apply: function (shot) { shot.split = 12; }   // degrees of separation
  },
  merkaba: {
    id: 'merkaba', name: 'MER-KA-BA', symbol: '✡',
    family: 'figure', color: '#29a8e0',
    provenance: PROV.FICTION,
    gloss:
      'Two counter-rotating tetrahedra, taken from the modern sacred-geometry literature rather ' +
      'than from any pre-modern source.',
    effect: 'Gravity is suspended for one second of flight. The ball travels the straight line.',
    apply: function (shot) { shot.hover = 1.0; }
  }
};

export const POWER_ORDER = ['calcinatio', 'solutio', 'sublimatio', 'coagulatio', 'vesica', 'merkaba'];

// A shot's powers are applied on top of the ruleset, not baked into it,
// so a power reads the same under every metaphysics.
export function applyPowers(rules, shot) {
  const r = Object.assign({}, rules);
  if (shot.frictionless) { r.friction = 0.25; r.rollDrag = 0.60; }
  if (shot.heavy) { r.restitution = 0.0; r.friction = r.friction * 2.2; r.rollDrag = r.rollDrag * 1.6; r.gravity = r.gravity * 1.5; }
  return r;
}
