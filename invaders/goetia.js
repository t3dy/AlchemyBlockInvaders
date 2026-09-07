// ===================================================================
// THE SEVENTY-TWO SPIRITS OF THE GOETIA
//
// Enemies, not decoration. Everything a spirit does on screen is read
// off what the Lemegeton actually says about it:
//
//   RANK      -> how it carries itself. A King advances at its own pace
//                and does not deviate; a Knight charges; a Marquis keeps
//                its distance and goes round you. Seven ranks, seven
//                ways of moving.
//   LEGIONS   -> the size of its retinue. Bael commands 66 legions and
//                arrives with a bodyguard to match; Vassago's 26 is a
//                thinner screen. You must shoot through the retinue
//                before the spirit itself can be touched.
//   OFFICES   -> its special power. This is the part that matters: the
//                office is parsed from the text of the description, so
//                a spirit that "teacheth all Liberal Sciences" reveals
//                the board's weaknesses, one whose office is "to sow
//                Discords" turns its own retinue against itself, and
//                one that "maketh thee go Invisible" cannot be hit
//                while it is unseen.
//   PLANET +  -> its weakness. Every spirit is opened by the matter of
//   ELEMENT      its own attributed planet, or of its own element. Load
//                the wrong thing and you are wasting the encounter.
//
// The verbatim description is in goetia-text.json and is shown when the
// spirit is beaten. Source: the public-domain Mathers/Crowley Goetia of
// 1904. Dr Rudd's Harley MS 6483 is a closely related seventeenth-
// century witness; Skinner and Rankine's edition of Rudd is in
// copyright and nothing from its editorial matter is used here.
// ===================================================================

// ---------- rank: how it moves, and what it is worth ----------
const GOETIC_RANKS = {
  king:      { bearing: 'state',   hp: 26, score: 1500, retinue: 1.00,
               how: 'advances at its own pace and does not deviate' },
  prince:    { bearing: 'surge',   hp: 20, score: 1100, retinue: 0.85,
               how: 'holds, crosses the ground in a rush, holds again' },
  duke:      { bearing: 'weave',   hp: 22, score: 1200, retinue: 0.95,
               how: 'a wide, unhurried weave' },
  marquis:   { bearing: 'circle',  hp: 18, score: 1000, retinue: 0.80,
               how: 'keeps its distance and goes round you' },
  earl:      { bearing: 'dart',    hp: 15, score: 900,  retinue: 0.70,
               how: 'in, strike, and out before you turn' },
  president: { bearing: 'drift',   hp: 16, score: 950,  retinue: 0.75,
               how: 'drifts, and does its work at range' },
  knight:    { bearing: 'charge',  hp: 13, score: 800,  retinue: 0.60,
               how: 'straight at you, and it does not turn aside' }
};

// ---------- planet and element -> what opens it ----------
// A spirit yields to the matter of its own planet, or of its own element.
const PLANET_MATTER = {
  sun: 'sol', moon: 'luna', mercury: 'mercurius', venus: 'water',
  mars: 'fire', jupiter: 'air', saturn: 'earth'
};
const ELEMENT_MATTER = { fire: 'fire', water: 'water', air: 'air', earth: 'earth' };

// ===================================================================
// OFFICES -> POWERS
//
// Each archetype is keyed to words that actually appear in the offices
// and appearance text of the Lemegeton. `test` decides whether a spirit
// has it; the first match in this list wins, so the more particular
// archetypes are listed before the general ones.
// ===================================================================
const OFFICE_POWERS = [
  { id: 'invisible', name: 'THE UNSEEN', glyph: '◌',
    test: t => /invisib/i.test(t),
    teach: 'Its office is to make men invisible, so it goes invisible itself. It cannot be hit while unseen — wait for it to show.',
    effect: 'phases out of sight every few seconds and cannot be struck until it returns' },

  { id: 'discord', name: 'SOWER OF DISCORD', glyph: '⚔',
    test: t => /discord|strife|slay|war\b|battle|contest/i.test(t),
    teach: 'Its office is to sow discord — so it sets its own retinue against each other. Stand back and let it work.',
    effect: 'its retinue damages itself; blocks near it take harm each second' },

  { id: 'raise', name: 'MASTER OF THE DEAD', glyph: '☠',
    test: t => /dead|grave|spirit.{0,18}(rise|raise)|necromanc|resurrect/i.test(t),
    teach: 'Its office concerns the dead, so it raises its fallen retinue back up. Kill the spirit or the killing never ends.',
    effect: 'brings back one destroyed member of its retinue every few seconds' },

  { id: 'tempest', name: 'RAISER OF TEMPESTS', glyph: '🜁',
    test: t => /tempest|storm|wind|water.{0,14}(rush|roar)|flood|sea\b/i.test(t),
    teach: 'Its office is to raise tempests, so the board is blown sideways while it lives.',
    effect: 'a wind shoves every block, and your vessel, toward one side' },

  { id: 'burn', name: 'BEARER OF FLAME', glyph: '🜂',
    test: t => /burn|flame|fire|consume|combust/i.test(t),
    teach: 'Its office involves fire, so it sets the board alight around it.',
    effect: 'ignites blocks near it, and the fire spreads on its own' },

  { id: 'transform', name: 'CHANGER OF SHAPE', glyph: '☿',
    test: t => /transform(eth|s|ing)?\s+(men|man|them|people)|chang(e|eth|es)\s+(men|man|them)|turn(eth|s)?\s+(men|man|them|water|all)/i.test(t),
    teach: 'Its office is transformation, so it changes what opens it. Watch the glyph on its breast and reload.',
    effect: 'changes its own element every few seconds — and so changes its weakness' },

  { id: 'earthquake', name: 'SHAKER OF DIGNITIES', glyph: '♄',
    test: t => /earthquake|destroy.{0,18}dignit|throw.{0,10}down|ruin/i.test(t),
    teach: 'Its office is to cast down dignities and cause earthquakes, so the whole board is shaken down toward you.',
    effect: 'every few seconds the board lurches downward' },

  { id: 'steal', name: 'THE THIEF', glyph: '⚿',
    test: t => /thief|steal|stolen|carry.{0,12}away|take.{0,10}away/i.test(t),
    teach: 'Its office concerns theft. It takes a power-up off you when it strikes — kill it to get them back.',
    effect: 'steals a power-up on contact; killing it returns everything it took' },

  { id: 'love', name: 'PROCURER OF LOVE', glyph: '♀',
    test: t => /procure.{0,20}love|women.{0,20}love|love\s+of\s+(women|men)|maketh.{0,14}love|friendship.{0,14}(between|of)/i.test(t),
    teach: 'Its office is to procure love, so it turns your own matter against you: a struck block joins its retinue.',
    effect: 'blocks it touches change sides and attack you' },

  { id: 'foresee', name: 'TELLER OF THINGS TO COME', glyph: '☽',
    test: t => /things.{0,10}(past|to come)|foretell|prophec|divin|answer.{0,14}truly|question/i.test(t),
    teach: 'Its office is to declare things to come, so it sees your shots coming and steps out of the way.',
    effect: 'evades the first shot of every volley' },

  { id: 'legions', name: 'CAPTAIN OF LEGIONS', glyph: '⚑',
    test: t => /men.{0,14}(arms|war)|soldier|captain|army|host of|men of war|giveth.{0,20}(soldier|servant)/i.test(t),
    teach: 'It commands men in arms, so it calls fresh retinue while it lives.',
    effect: 'summons another of its retinue every few seconds' },

  { id: 'heal', name: 'PHYSICIAN', glyph: '☤',
    test: t => /heal|infirm|cure|physic|disease|herb|stone.{0,12}(virtue|precious)/i.test(t),
    teach: 'Its office is physic and the virtues of herbs and stones, so it mends itself.',
    effect: 'restores its own health steadily; you must out-damage the mending' },

  { id: 'tower', name: 'BUILDER OF TOWERS', glyph: '⌂',
    test: t => /tower|build|castle|wall|fortif|house/i.test(t),
    teach: 'Its office is to build towers and strongholds, so it raises masonry in front of itself.',
    effect: 'raises a wall of blocks between you and it' },

  { id: 'bind', name: 'BINDER', glyph: '⛓',
    test: t => /bind|bond|chain|restrain|hold.{0,10}fast|make.{0,12}stand/i.test(t),
    teach: 'Its office is binding, so it binds you: your vessel slows while it lives.',
    effect: 'your vessel moves at half speed while it lives' },

  // These two are last before the catch-all: their wording is common to a
  // great many of the seventy-two, so anything more particular wins first.
  { id: 'treasure', name: 'KEEPER OF TREASURE', glyph: '◆',
    test: t => /treasure|hidden|hid\b|lost|gold|riches/i.test(t),
    teach: 'Its office is to discover hidden treasure, so it carries it. Breaking this one is worth far more than the rest.',
    effect: 'drops several power capsules instead of one, and scores double' },

  { id: 'teach', name: 'TEACHER OF SCIENCES', glyph: '✒',
    test: t => /teach|scienc|art\b|language|tongue|astronom|logic|philosoph|knowledge|liberal/i.test(t),
    teach: 'Its office is to teach the sciences, and so it does: while it lives, every block on the board shows what opens it.',
    effect: 'reveals the matter that opens every block on the board' },

  // the general case, so every spirit has something
  { id: 'dread', name: 'DREAD PRESENCE', glyph: '☉',
    test: () => true,
    teach: 'A great spirit of the Goetia, and its presence alone is a weight on the work.',
    effect: 'strikes harder than its retinue, and does not flinch' }
];

function powerFor(spirit) {
  // The OFFICE is what the spirit is FOR, so it is matched first and on its own.
  // Matching against the whole description as well would let a word that merely
  // occurs in passing decide the mechanic - Caim "answereth in burning ashes",
  // which is not an office of fire. Only if the office says nothing do we widen
  // to the appearance and then to the full text.
  const office = spirit.offices || '';
  for (const p of OFFICE_POWERS) if (p.id !== 'dread' && p.test(office)) return p;
  const near = office + ' ' + (spirit.appearance || '');
  for (const p of OFFICE_POWERS) if (p.id !== 'dread' && p.test(near)) return p;
  const all = near + ' ' + (spirit.text || '');
  for (const p of OFFICE_POWERS) if (p.test(all)) return p;
  return OFFICE_POWERS[OFFICE_POWERS.length - 1];
}

// ===================================================================
// Build the full roster from the data file
// ===================================================================
function buildGoetia(doc) {
  const out = [];
  for (const sp of doc.spirits) {
    const rank = GOETIC_RANKS[sp.rank] || GOETIC_RANKS.duke;
    const weakPlanet = PLANET_MATTER[sp.planet] || 'fire';
    const weakElement = ELEMENT_MATTER[sp.element] || 'fire';
    const power = powerFor(sp);
    out.push({
      id: sp.id, name: sp.name, rank: sp.rank, rankInfo: rank,
      planet: sp.planet, element: sp.element, direction: sp.direction,
      legions: sp.legions,
      appearance: sp.appearance, offices: sp.offices,
      text: sp.text, repaired: !!sp.repaired,
      // mechanics, all derived above
      hp: rank.hp + Math.round(sp.legions / 6),
      score: rank.score + sp.legions * 10,
      bearing: rank.bearing,
      // 66 legions is a bodyguard; 26 is a screen. Kept playable: 4-10.
      retinue: Math.max(4, Math.min(10, Math.round((sp.legions / 9) * rank.retinue) + 3)),
      opensTo: [weakPlanet, weakElement].filter((v, i, a) => a.indexOf(v) === i),
      power: power
    });
  }
  return out;
}

// how a spirit of each rank moves. Called every frame with the spirit,
// the player and dt; returns nothing, mutates position.
function bearSpirit(s, ship, dt, view) {
  s.t = (s.t || 0) + dt;
  const speed = 46 + s.legions * 0.22;
  switch (s.bearing) {
    case 'state':                                   // King
      s.y += speed * 0.34 * dt;
      s.x += Math.sin(s.t * 0.4) * 14 * dt;
      break;
    case 'surge': {                                 // Prince
      const phase = (s.t % 3.4) / 3.4;
      const rush = phase > 0.62 ? 3.4 : 0.15;
      s.y += speed * 0.3 * rush * dt;
      s.x += (ship.x - s.x) * 0.5 * rush * dt;
      break;
    }
    case 'weave':                                   // Duke
      s.y += speed * 0.3 * dt;
      s.x += Math.cos(s.t * 0.85) * speed * 1.5 * dt;
      break;
    case 'circle': {                                // Marquis
      const r = 150;
      s.x = s.homeX + Math.cos(s.t * 0.85) * r;
      s.y = s.homeY + Math.sin(s.t * 0.85) * r * 0.42;
      break;
    }
    case 'dart': {                                  // Earl
      const p = s.t % 2.3;
      if (p < 0.42) { s.y += speed * 2.6 * dt; s.x += (ship.x - s.x) * 2.2 * dt; }
      else if (p < 0.95) { s.y -= speed * 1.7 * dt; }
      break;
    }
    case 'drift':                                   // President
      s.y += speed * 0.2 * dt;
      s.x += Math.sin(s.t * 0.5) * speed * 0.9 * dt;
      break;
    case 'charge':                                  // Knight
      s.y += speed * 0.72 * dt;
      s.x += Math.sign(ship.x - s.x) * speed * 1.15 * dt;
      break;
  }
  const w = view.w;
  if (s.x < 40) { s.x = 40; s.homeX = Math.min(w - 160, s.homeX + 60); }
  if (s.x > w - 40) { s.x = w - 40; s.homeX = Math.max(160, s.homeX - 60); }
}

if (typeof window !== 'undefined') {
  window.GOETIC_RANKS = GOETIC_RANKS;
  window.OFFICE_POWERS = OFFICE_POWERS;
  window.buildGoetia = buildGoetia;
  window.bearSpirit = bearSpirit;
  window.PLANET_MATTER = PLANET_MATTER;
}
