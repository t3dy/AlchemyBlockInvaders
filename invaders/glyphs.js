// ===================================================================
// THE TWENTY-SIX GLYPHS AND WHAT THEY DO
//
// Every block in this game is one of the twenty-six glyphs of the art:
// four elements, three principles, seven planets, twelve zodiacal
// operations. None of them is a reskin. Each one behaves the way its
// own symbolism says it should behave, and the behaviour is the lesson.
//
// The rule the whole file obeys: IF YOU KNOW WHAT THE GLYPH MEANS, YOU
// CAN PREDICT WHAT THE BLOCK DOES. Tin is the metal of Jupiter, Jupiter
// is the greater benefic and the principle of expansion, so the Jupiter
// block swells when you shoot it and shoves its neighbours aside. Gold
// is incorruptible, so nothing marks the Sun block but gold itself.
// Quicksilver is the volatile spirit, so the Mercury block will not be
// caught — it flees to somewhere else on the board.
//
// `onHit` returns a list of EFFECTS for the cascade engine to resolve.
// It never mutates anything itself, which is what lets one shot set off
// a chain seventy blocks long without the code turning to soup.
// ===================================================================

const REGISTERS = {
  element:   { name: 'ELEMENTAL',     tint: '#d98f2a', blurb: 'the four qualities of matter' },
  principle: { name: 'PRINCIPLE',     tint: '#c9a227', blurb: 'the three that compose every body' },
  planet:    { name: 'PLANETARY',     tint: '#7fb2d9', blurb: 'the seven metals and their governors' },
  operation: { name: 'ZODIACAL',      tint: '#a88fd9', blurb: 'the twelve operations of the Great Work' }
};

// An effect is {kind, ...}. The engine in cascade.js knows how to run each.
const FX = {
  destroy:   (t)          => ({ kind: 'destroy', target: t }),
  damage:    (t, n)       => ({ kind: 'damage', target: t, amount: n }),
  ignite:    (t)          => ({ kind: 'ignite', target: t }),
  harden:    (t, n)       => ({ kind: 'harden', target: t, amount: n }),
  freeze:    (t, s)       => ({ kind: 'freeze', target: t, seconds: s }),
  shove:     (t, dx, dy)  => ({ kind: 'shove', target: t, dx: dx, dy: dy }),
  grow:      (t, f)       => ({ kind: 'grow', target: t, factor: f }),
  transmute: (t, g)       => ({ kind: 'transmute', target: t, glyph: g }),
  spawn:     (g, x, y)    => ({ kind: 'spawn', glyph: g, x: x, y: y }),
  teleport:  (t)          => ({ kind: 'teleport', target: t }),
  reflect:   (t, s)       => ({ kind: 'reflect', target: t, shot: s }),
  ring:      (t, r)       => ({ kind: 'ring', target: t, radius: r }),
  slow:      (t, f, s)    => ({ kind: 'slow', target: t, factor: f, seconds: s }),
  pierce:    (t)          => ({ kind: 'pierce', target: t }),
  infect:    (t)          => ({ kind: 'infect', target: t }),
  score:     (n)          => ({ kind: 'score', amount: n }),
  say:       (s)          => ({ kind: 'say', text: s })
};

// ===================================================================
// THE FOUR ELEMENTS — the qualities. These are the simplest blocks and
// the ones the tutorial opens with, because everything later is built
// out of the four behaviours introduced here.
// ===================================================================
const ELEMENT_GLYPHS = {
  fire: {
    glyph: '🜂', name: 'FIRE', register: 'element', color: '#d64933', hp: 2,
    doctrine: 'Hot and dry. The active principle: it does not change, it changes others.',
    behaviour: 'IGNITES ITS NEIGHBOURS — the burning spreads outward on its own',
    teach: 'Fire is the agent of calcination. Shoot it and it does not simply die: it sets light to whatever is beside it, and that fire spreads again. This is the cheapest chain in the game.',
    onHit: (b, shot, world) => [
      FX.damage(b, shot.power),
      ...world.neighbours(b, 1).map(n => FX.ignite(n)),
      FX.say('🜂 CALCINATIO — the fire takes hold and runs')
    ]
  },
  water: {
    glyph: '🜄', name: 'WATER', register: 'element', color: '#3d8fd1', hp: 2,
    doctrine: 'Cold and wet. The universal solvent; the mirror; that which finds its level.',
    behaviour: 'DISSOLVES ARMOUR — strips the hardening off everything near it',
    teach: 'Water dissolves. A salt pillar or a hardened wall that will not break to anything else becomes soft when water touches it. Use water to open what has closed itself.',
    onHit: (b, shot, world) => [
      FX.damage(b, shot.power),
      ...world.neighbours(b, 2).map(n => FX.harden(n, -2)),
      FX.say('🜄 SOLUTIO — what was fixed is loosened')
    ]
  },
  air: {
    glyph: '🜁', name: 'AIR', register: 'element', color: '#8fb8c9', hp: 1,
    doctrine: 'Hot and wet. The volatile, the breath, that which rises and carries.',
    behaviour: 'BLOWS THINGS SIDEWAYS — the blast shoves its neighbours apart',
    teach: 'Air is the vehicle. It is the frailest block on the board and it moves everything around it, which makes it the tool for opening a lane through a wall you cannot break.',
    onHit: (b, shot, world) => {
      const out = [FX.destroy(b), FX.say('🜁 SUBLIMATIO — the blast opens a lane')];
      for (const n of world.neighbours(b, 1)) {
        out.push(FX.shove(n, Math.sign(n.x - b.x) || 1, 0));
      }
      return out;
    }
  },
  earth: {
    glyph: '🜃', name: 'EARTH', register: 'element', color: '#8b6f47', hp: 4,
    doctrine: 'Cold and dry. The fixed, the heavy, that which seeks the centre and stays.',
    behaviour: 'FALLS AND CRUSHES — drops straight down through whatever is beneath',
    teach: 'Earth is heavy and it is stubborn: four points of damage before it yields. When it does yield it does not vanish, it falls, and it destroys everything under it on the way down.',
    onHit: (b, shot, world) => [
      FX.damage(b, shot.power),
      ...world.below(b).slice(0, 3).map(n => FX.damage(n, 3)),
      FX.say('🜃 the earth settles, and takes the floor with it')
    ]
  }
};

// ===================================================================
// THE THREE PRINCIPLES — Paracelsus. Every body is sulphur, salt and
// mercury: what burns, what remains, what evaporates. So the three
// blocks are one that spreads fire, one that will not move, and one
// that refuses to be hit at all.
// ===================================================================
const PRINCIPLE_GLYPHS = {
  sulphur: {
    glyph: '🜍', name: 'SULPHUR', register: 'principle', color: '#d99a2a', hp: 2,
    doctrine: 'The soul: the combustible principle, that in a body which can burn.',
    behaviour: 'BURNS EVERYTHING OF ITS OWN COLOUR, wherever it is on the board',
    teach: 'Sulphur is the soul of a substance, and soul answers to soul. Break one and every block sharing its register catches light at once — not the ones beside it, the ones LIKE it. This is the longest-range effect in the game.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.sameRegister(b).map(n => FX.ignite(n)),
      FX.say('🜍 the soul answers to its own kind — everywhere at once')
    ]
  },
  salt: {
    glyph: '🜔', name: 'SALT', register: 'principle', color: '#e8e2d0', hp: 3,
    doctrine: 'The body: the fixed principle, the ash that remains when all else has gone.',
    behaviour: 'GROWS INSTEAD OF BREAKING — hitting it makes MORE of it',
    teach: 'Salt is what is left after burning, and it does not burn twice. Shooting it hardens its neighbours and grows a new pillar. Do not shoot salt unless you want more salt: dissolve it with water instead.',
    onHit: (b, shot, world) => {
      if (shot.glyph === 'water') {
        return [FX.destroy(b), FX.say('🜔 SOLUTIO — only water unmakes the salt')];
      }
      const gap = world.emptyBeside(b);
      const out = [
        FX.harden(b, 1),
        ...world.neighbours(b, 1).map(n => FX.harden(n, 1)),
        FX.say('🜔 the fixed will not burn — it CRYSTALLISES. Try water.')
      ];
      if (gap) out.push(FX.spawn('salt', gap.x, gap.y));
      return out;
    }
  },
  mercury: {
    glyph: '☿', name: 'MERCURY', register: 'principle', color: '#c8ccd0', hp: 1,
    doctrine: 'The spirit: the volatile principle, that which flies off in the heat.',
    behaviour: 'WILL NOT BE CAUGHT — flees to somewhere else on the board',
    teach: 'The volatile spirit escapes the vessel. Every hit teleports it instead of killing it. To fix the volatile you must first COAGULATE it — freeze it in place with the spell — and then it can be struck.',
    onHit: (b, shot, world) => {
      if (b.frozen > 0) {
        return [FX.destroy(b), FX.score(250),
                FX.say('☿ FIXED AND STRUCK — the volatile caught at last')];
      }
      return [FX.teleport(b), FX.say('☿ the spirit flies off — COAGULA first (press E)')];
    }
  }
};

// ===================================================================
// THE SEVEN PLANETS AND THEIR METALS — the heart of the cascade system.
// Copper is the bell, iron is the explosion, tin swells, lead deadens,
// silver reflects, quicksilver divides, and gold is untouchable.
// ===================================================================
const PLANET_GLYPHS = {
  sol: {
    glyph: '☉', name: 'SOL · GOLD', register: 'planet', color: '#e8b923', hp: 6,
    doctrine: 'Gold. The perfected metal, incorruptible: it does not rust, tarnish or burn.',
    behaviour: 'IMMUNE TO EVERYTHING BUT GOLD — nothing else marks it',
    teach: 'Gold answers to nothing but itself. Every other shot is absorbed without effect. Load SOL, or cast PROJECTIO, or leave it alone — and note that gold is what the whole art is FOR, so it is always worth the most.',
    onHit: (b, shot, world) => {
      if (shot.glyph === 'sol') {
        return [FX.destroy(b), FX.score(500),
                FX.say('☉ gold answers to nothing but itself — and you brought gold')];
      }
      return [FX.say('☉ INCORRUPTIBLE — absorbed. Only SOL opens the gold.')];
    }
  },
  luna: {
    glyph: '☽', name: 'LUNA · SILVER', register: 'planet', color: '#d5dbe0', hp: 3,
    doctrine: 'Silver. The mirror of the sun; it has no light of its own, it returns yours.',
    behaviour: 'REFLECTS YOUR SHOT BACK AT YOU — unless the shot is silver',
    teach: 'The moon gives back what it is given. Anything but LUNA comes straight back down the lane at your vessel, so either load silver, or shoot it from an angle where the return will miss you.',
    onHit: (b, shot, world) => {
      if (shot.glyph === 'luna') {
        return [FX.destroy(b), FX.say('☽ silver passes through silver unreflected')];
      }
      return [FX.reflect(b, shot), FX.say('☽ REFLECTED — that is coming back at you')];
    }
  },
  mercurius: {
    glyph: '☿', name: 'MERCURIUS · QUICKSILVER', register: 'planet', color: '#b9c0c7', hp: 2,
    doctrine: 'Quicksilver. The metal that is a liquid; it beads, divides, and runs together again.',
    behaviour: 'SPLITS IN TWO when struck — the multiplication of the volatile',
    teach: 'Break a bead of quicksilver and you have two beads. Each is smaller and weaker than the first, but there are more of them. Clear the small ones fast or the board fills.',
    onHit: (b, shot, world) => {
      const out = [FX.destroy(b), FX.say('☿ the bead divides — now there are two')];
      const seats = world.emptyAround(b, 1).slice(0, 2);
      for (const s of seats) out.push(FX.spawn('mercurius', s.x, s.y));
      return out;
    }
  },
  venus: {
    glyph: '♀', name: 'VENUS · COPPER', register: 'planet', color: '#4aa96c', hp: 2,
    doctrine: 'Copper. The metal of bells and mirrors; it rings, and the ring carries.',
    behaviour: 'RINGS LIKE A BELL — sets off EVERY block within three cells',
    teach: 'This is the great starter of chains. Copper does not destroy its neighbours, it TRIGGERS them: each one does its own thing, and theirs trigger more. One copper bell in a crowded board is the longest cascade you will get.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      FX.ring(b, 3),
      FX.say('♀ CAMPANA — the bell rings and everything near it answers')
    ]
  },
  mars: {
    glyph: '♂', name: 'MARS · IRON', register: 'planet', color: '#b5342a', hp: 4,
    doctrine: 'Iron. The metal of war and of the blade; violent, and it goes straight through.',
    behaviour: 'EXPLODES IN A CROSS — the whole row and the whole column',
    teach: 'Iron is the war metal. It does not spread like fire or ring like copper; it detonates, and the blast runs the length of its row and the height of its column at once. Aim it where the board is thickest.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.row(b).map(n => FX.damage(n, 3)),
      ...world.column(b).map(n => FX.damage(n, 3)),
      FX.say('♂ the iron detonates along the cross')
    ]
  },
  jupiter: {
    glyph: '♃', name: 'JUPITER · TIN', register: 'planet', color: '#4062bb', hp: 3,
    doctrine: 'Tin. Jupiter is the Greater Benefic, the principle of increase, expansion and largesse.',
    behaviour: 'SWELLS WHEN SHOT — grows bigger and shoves its neighbours aside',
    teach: 'Jupiter expands. Every hit makes the block LARGER, not smaller, and the swelling pushes whatever is beside it outward — which is often how you open a wall you could not shoot through. Three swellings and it bursts, and the burst is enormous.',
    onHit: (b, shot, world) => {
      const swell = (b.swell || 0) + 1;
      if (swell >= 3) {
        return [FX.destroy(b),
                ...world.neighbours(b, 2).map(n => FX.damage(n, 4)),
                FX.score(300),
                FX.say('♃ THE EXPANSION BURSTS — largesse, spent all at once')];
      }
      return [
        FX.grow(b, 1 + swell * 0.35),
        ...world.neighbours(b, 1).map(n => FX.shove(n, Math.sign(n.x - b.x) || 1, 0)),
        FX.say('♃ EXPANSIO — it swells rather than breaks (' + swell + '/3)')
      ];
    }
  },
  saturn: {
    glyph: '♄', name: 'SATURN · LEAD', register: 'planet', color: '#5d5a52', hp: 8,
    doctrine: 'Lead. The heaviest and basest metal; Saturn is the Greater Malefic, and he is old, cold and slow.',
    behaviour: 'DEADENS — absorbs the shot and slows everything around it to a crawl',
    teach: 'Lead is where the work begins and it is the hardest thing on the board: eight points, and it soaks damage rather than chaining. What it gives you is TIME — everything near a struck Saturn slows down, which is how you survive a wave you cannot clear.',
    onHit: (b, shot, world) => [
      FX.damage(b, Math.max(1, shot.power - 1)),
      ...world.neighbours(b, 3).map(n => FX.slow(n, 0.35, 3)),
      FX.say('♄ the leaden hour — everything near it slows')
    ]
  }
};

// ===================================================================
// THE TWELVE OPERATIONS — the zodiac as the stages of the Great Work.
// These are the strangest blocks, and each one is a verb.
// ===================================================================
const OPERATION_GLYPHS = {
  aries: {
    glyph: '♈', name: 'ARIES · CALCINATIO', register: 'operation', color: '#c4453a', hp: 2,
    doctrine: 'The first fire. Reduction to ash — everything accidental is burned away.',
    behaviour: 'BURNS THE PROPERTIES OFF its neighbours, leaving plain matter',
    teach: 'Calcination strips a substance back to its ash. Blocks it touches keep their bodies but lose their powers — useful when the board is full of things you do not want going off.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.neighbours(b, 1).map(n => FX.transmute(n, 'earth')),
      FX.say('♈ CALCINATIO — reduced to ash, and ash does nothing')
    ]
  },
  taurus: {
    glyph: '♉', name: 'TAURUS · CONGELATIO', register: 'operation', color: '#7a8c4a', hp: 3,
    doctrine: 'The fixed earth. That which sets, stiffens and will not be hurried.',
    behaviour: 'FREEZES THE BOARD NEARBY — nothing in range descends',
    teach: 'The bull does not move. Everything within four cells stops dead for five seconds — and remember that a FROZEN Mercury is a Mercury that can finally be killed.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.neighbours(b, 4).map(n => FX.freeze(n, 5)),
      FX.say('♉ CONGELATIO — held fast. Now strike the volatile.')
    ]
  },
  gemini: {
    glyph: '♊', name: 'GEMINI · SEPARATIO', register: 'operation', color: '#c9b458', hp: 2,
    doctrine: 'The twins. One thing divided into two that are alike but opposite.',
    behaviour: 'MAKES A TWIN of itself, mirrored across the board',
    teach: 'Separation divides. Hit a Gemini and a second one appears mirrored on the far side — kill them in the wrong order and you will be doing this all day. Kill the twin first.',
    onHit: (b, shot, world) => {
      if (b.twinned) return [FX.destroy(b), FX.score(200), FX.say('♊ the twin is undone with its brother')];
      const m = world.mirrorOf(b);
      const out = [FX.damage(b, shot.power), FX.say('♊ SEPARATIO — it divides, and there are two')];
      if (m) out.push(FX.spawn('gemini', m.x, m.y));
      return out;
    }
  },
  cancer: {
    glyph: '♋', name: 'CANCER · SOLUTIO', register: 'operation', color: '#4a8cae', hp: 2,
    doctrine: 'The moon-ruled water. The bath in which the body is dissolved.',
    behaviour: 'FLOODS ITS ROW — everything in it is washed downward, fast',
    teach: 'The dissolving bath. Its whole row surges toward you — which clears the board quickly and is extremely dangerous if you are not ready to meet what arrives.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.row(b).map(n => FX.shove(n, 0, 2)),
      ...world.row(b).map(n => FX.harden(n, -1)),
      FX.say('♋ SOLUTIO — the bath floods and the row comes down')
    ]
  },
  leo: {
    glyph: '♌', name: 'LEO · DIGESTIO', register: 'operation', color: '#d99b2a', hp: 4,
    doctrine: 'The lion. The slow heat of the stomach; the green lion devours the sun.',
    behaviour: 'EATS THE BLOCK BESIDE IT and takes on its power',
    teach: 'The green lion devours. Leave it alone and it will consume its neighbours one by one, growing stronger and inheriting whatever they could do. It is the only block that gets worse the longer you ignore it.',
    onHit: (b, shot, world) => {
      const prey = world.neighbours(b, 1)[0];
      if (!prey) return [FX.damage(b, shot.power), FX.say('♌ nothing left to devour')];
      return [FX.destroy(prey), FX.transmute(b, prey.glyphKey),
              FX.say('♌ DIGESTIO — the lion devours the ' + (prey.def ? prey.def.name : 'block') + ' and becomes it')];
    }
  },
  virgo: {
    glyph: '♍', name: 'VIRGO · DISTILLATIO', register: 'operation', color: '#8aa87a', hp: 2,
    doctrine: 'The pure vessel. What rises is the spirit; what stays behind is the dead head.',
    behaviour: 'SEPARATES INTO TWO — a spirit that rises and a residue that falls',
    teach: 'Distillation parts the fine from the gross. One block becomes an Air above and an Earth below, and those two behave completely differently — which is the whole point of distilling anything.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      FX.spawn('air', b.x, b.y - 1),
      FX.spawn('earth', b.x, b.y + 1),
      FX.say('♍ DISTILLATIO — spirit above, caput mortuum below')
    ]
  },
  libra: {
    glyph: '♎', name: 'LIBRA · SUBLIMATIO', register: 'operation', color: '#b0a8cc', hp: 2,
    doctrine: 'The balance. What is heavy is raised and what is high is brought down.',
    behaviour: 'SWAPS PLACES with the block furthest from it',
    teach: 'The scale equalises. Libra exchanges itself with the most distant block on the board — which can drag something dangerous into your lap, or lift a wall out of your way. It is the least predictable block and the most useful when the board is lopsided.',
    onHit: (b, shot, world) => {
      const far = world.furthestFrom(b);
      if (!far) return [FX.destroy(b), FX.say('♎ nothing to weigh against')];
      return [{ kind: 'swap', target: b, other: far },
              FX.say('♎ SUBLIMATIO — the balance is restored, elsewhere')];
    }
  },
  scorpio: {
    glyph: '♏', name: 'SCORPIO · PUTREFACTIO', register: 'operation', color: '#6b4a7a', hp: 3,
    doctrine: 'The sting, and the rot. Nothing is reborn that has not first been corrupted.',
    behaviour: 'INFECTS its neighbours — and the infection spreads on its own',
    teach: 'Putrefaction is the blackening, and it is contagious. Infected blocks rot away and infect theirs in turn. Slow, unstoppable, and it will clear a whole quarter of the board if you give it time.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.neighbours(b, 1).map(n => FX.infect(n)),
      FX.say('♏ PUTREFACTIO — the blackening spreads of its own accord')
    ]
  },
  sagittarius: {
    glyph: '♐', name: 'SAGITTARIUS · INCINERATIO', register: 'operation', color: '#c96f2a', hp: 2,
    doctrine: 'The archer. The fire that is aimed, and that does not stop at the first thing it meets.',
    behaviour: 'LOOSES AN ARROW straight down the column, piercing everything',
    teach: 'The archer fires through. Everything below it in the column takes the shot, however many blocks deep the stack is. Line it up over the thickest part of the board.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.column(b).filter(n => n.y > b.y).map(n => FX.pierce(n)),
      FX.say('♐ INCINERATIO — the arrow goes through them all')
    ]
  },
  capricorn: {
    glyph: '♑', name: 'CAPRICORN · FERMENTATIO', register: 'operation', color: '#5a6b4a', hp: 3,
    doctrine: 'The goat at the gate of the year. The ferment that quickens dead matter.',
    behaviour: 'QUICKENS THE DEAD — raises destroyed blocks back up as gold',
    teach: 'Fermentation brings the dead matter to life again. Break a Capricorn and the last few blocks you destroyed come back — as GOLD, which is worth a great deal and answers to nothing but SOL. A gift and a problem at once.',
    onHit: (b, shot, world) => {
      const graves = world.recentDead(3);
      return [FX.destroy(b),
              ...graves.map(g => FX.spawn('sol', g.x, g.y)),
              FX.say('♑ FERMENTATIO — the dead matter quickens, and comes back gold')];
    }
  },
  aquarius: {
    glyph: '♒', name: 'AQUARIUS · MULTIPLICATIO', register: 'operation', color: '#4aa8c9', hp: 2,
    doctrine: 'The water-bearer. The elixir, once made, is poured out and increases without end.',
    behaviour: 'POURS OUT COPIES of whatever it is standing next to',
    teach: 'Multiplication increases the elixir. Aquarius copies its neighbours rather than itself, so what it does depends entirely on what is beside it — next to a copper bell it is a gift, next to a salt pillar it is a disaster.',
    onHit: (b, shot, world) => {
      const src = world.neighbours(b, 1)[0];
      const seats = world.emptyAround(b, 2).slice(0, 2);
      const out = [FX.destroy(b), FX.say('♒ MULTIPLICATIO — the elixir is poured out')];
      if (src) for (const s of seats) out.push(FX.spawn(src.glyphKey, s.x, s.y));
      return out;
    }
  },
  pisces: {
    glyph: '♓', name: 'PISCES · PROJECTIO', register: 'operation', color: '#c9a8d9', hp: 5,
    doctrine: 'The last operation. The stone is cast upon the base metal and the work is finished.',
    behaviour: 'TRANSMUTES EVERYTHING AROUND IT INTO GOLD',
    teach: 'Projection is the end of the Great Work: the completed stone thrown onto base metal, which becomes gold. Everything within three cells turns to SOL — worth a fortune, and now immune to everything except a gold shot. The best and worst thing that can happen to a crowded board.',
    onHit: (b, shot, world) => [
      FX.destroy(b),
      ...world.neighbours(b, 3).map(n => FX.transmute(n, 'sol')),
      FX.score(400),
      FX.say('♓ PROJECTIO — THE WORK IS FINISHED. It is all gold now.')
    ]
  }
};

// one table to look anything up in
const GLYPHS = Object.assign({}, ELEMENT_GLYPHS, PRINCIPLE_GLYPHS, PLANET_GLYPHS, OPERATION_GLYPHS);
const GLYPH_KEYS = Object.keys(GLYPHS);
for (const k of GLYPH_KEYS) GLYPHS[k].key = k;

// the order the tutorial introduces them in: simplest behaviour first
const TUTORIAL_ORDER = [
  'fire', 'water', 'air', 'earth',
  'sulphur', 'salt', 'mercury',
  'venus', 'mars', 'jupiter', 'saturn', 'luna', 'mercurius', 'sol',
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

const REGISTER_OF = {};
for (const k of GLYPH_KEYS) REGISTER_OF[k] = GLYPHS[k].register;

// what the player can load and fire. Elements and the three metals that
// matter mechanically (gold opens gold, silver passes silver).
const AMMUNITION = ['fire', 'water', 'air', 'earth', 'sol', 'luna', 'mercurius'];

if (typeof window !== 'undefined') {
  window.GLYPHS = GLYPHS;
  window.GLYPH_KEYS = GLYPH_KEYS;
  window.REGISTERS = REGISTERS;
  window.TUTORIAL_ORDER = TUTORIAL_ORDER;
  window.AMMUNITION = AMMUNITION;
  window.FX = FX;
}
