// ===================================================================
// THE CASCADE ENGINE
//
// One shot produces a list of effects. Resolving an effect can produce
// more effects. That is the whole Rube Goldberg machine, and it is a
// work queue, not recursion — recursion here would blow the stack the
// first time a copper bell rang next to a sulphur block.
//
// Two rules keep a chain from running for ever:
//   * a block may be TRIGGERED only once per cascade (`seen`), so a
//     bell that rings a bell that rings the first bell terminates;
//   * the queue is capped, so a pathological board cannot hang the tab.
//
// Everything the effects need to ask about the board goes through the
// `world` façade, which is the only thing that knows how blocks are
// actually stored. Keeping that in one place is what let the twenty-six
// glyph behaviours be written as pure data.
// ===================================================================

const CASCADE_CAP = 400;      // hard ceiling on effects resolved in one chain

function makeWorld(blocks, cfg) {
  const cell = cfg.cell;
  const at = (x, y) => blocks.find(b => b.alive && b.gx === x && b.gy === y) || null;
  const occupied = (x, y) => !!at(x, y);

  return {
    all: () => blocks.filter(b => b.alive),

    // every live block within `r` cells (Chebyshev), nearest first
    neighbours(b, r) {
      return blocks
        .filter(n => n.alive && n !== b &&
                     Math.max(Math.abs(n.gx - b.gx), Math.abs(n.gy - b.gy)) <= r)
        .sort((p, q) => (Math.abs(p.gx - b.gx) + Math.abs(p.gy - b.gy)) -
                        (Math.abs(q.gx - b.gx) + Math.abs(q.gy - b.gy)));
    },
    row(b)    { return blocks.filter(n => n.alive && n !== b && n.gy === b.gy); },
    column(b) { return blocks.filter(n => n.alive && n !== b && n.gx === b.gx); },
    below(b)  { return blocks.filter(n => n.alive && n.gx === b.gx && n.gy > b.gy)
                             .sort((p, q) => p.gy - q.gy); },

    sameRegister(b) {
      const reg = b.def && b.def.register;
      return blocks.filter(n => n.alive && n !== b && n.def && n.def.register === reg);
    },

    emptyBeside(b) {
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const x = b.gx + dx, y = b.gy + dy;
        if (x >= 0 && x < cfg.cols && y >= 0 && !occupied(x, y)) return { x, y };
      }
      return null;
    },
    emptyAround(b, r) {
      const out = [];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (!dx && !dy) continue;
        const x = b.gx + dx, y = b.gy + dy;
        if (x >= 0 && x < cfg.cols && y >= 0 && !occupied(x, y)) out.push({ x, y });
      }
      return out;
    },
    mirrorOf(b) {
      const x = (cfg.cols - 1) - b.gx;
      return occupied(x, b.gy) ? null : { x, y: b.gy };
    },
    furthestFrom(b) {
      let best = null, bd = -1;
      for (const n of blocks) {
        if (!n.alive || n === b) continue;
        const d = Math.abs(n.gx - b.gx) + Math.abs(n.gy - b.gy);
        if (d > bd) { bd = d; best = n; }
      }
      return best;
    },
    recentDead: (n) => cfg.graveyard.slice(-n)
  };
}

// ===================================================================
// resolveCascade — the queue
//
// Returns a report the HUD can narrate: how long the chain was, what
// the biggest single link did, and every line of teaching text the
// glyphs emitted along the way.
// ===================================================================
function resolveCascade(seedEffects, ctxIn) {
  const ctx = ctxIn;
  const world = makeWorld(ctx.blocks, ctx.cfg);
  const queue = seedEffects.slice();
  const triggered = new Set();     // blocks that have already gone off
  const lines = [];
  let resolved = 0, destroyed = 0, scored = 0, depth = 0;

  // A block "goes off" — runs its own onHit — at most once per chain.
  function trigger(b, shot) {
    if (!b || !b.alive || triggered.has(b)) return;
    triggered.add(b);
    const def = b.def;
    if (!def || typeof def.onHit !== 'function') { queue.push({ kind: 'destroy', target: b }); return; }
    let produced = [];
    try { produced = def.onHit(b, shot, world) || []; }
    catch (e) { produced = [{ kind: 'destroy', target: b }]; }
    for (const e of produced) queue.push(e);
    depth++;
  }

  // the shot that started it all
  if (ctx.seedBlock) trigger(ctx.seedBlock, ctx.shot);

  while (queue.length && resolved < CASCADE_CAP) {
    const e = queue.shift();
    resolved++;
    const t = e.target;

    switch (e.kind) {
      case 'destroy':
        if (t && t.alive) { kill(t); }
        break;

      case 'damage':
        if (t && t.alive) {
          t.hp -= e.amount;
          t.flash = 0.2;
          if (t.hp <= 0) kill(t);
        }
        break;

      case 'ignite':
        if (t && t.alive && !t.burning) {
          t.burning = 1.4;
          // a burning block goes off itself when the fire eats through it
          queue.push({ kind: 'triggerBlock', target: t });
        }
        break;

      case 'triggerBlock':
        trigger(t, ctx.shot);
        break;

      case 'ring':
        for (const n of world.neighbours(t, e.radius)) queue.push({ kind: 'triggerBlock', target: n });
        break;

      case 'harden':
        if (t && t.alive) {
          t.armour = Math.max(0, (t.armour || 0) + e.amount);
          t.flash = 0.2;
        }
        break;

      case 'freeze':
        if (t && t.alive) { t.frozen = Math.max(t.frozen || 0, e.seconds); }
        break;

      case 'slow':
        if (t && t.alive) { t.slow = e.factor; t.slowFor = e.seconds; }
        break;

      case 'shove':
        if (t && t.alive) {
          t.gx = Math.max(0, Math.min(ctx.cfg.cols - 1, t.gx + e.dx));
          t.gy = Math.max(0, t.gy + e.dy);
          t.x = ctx.cfg.originX + t.gx * ctx.cfg.cell + ctx.cfg.cell / 2;
          t.y = t.y + e.dy * ctx.cfg.cell;
        }
        break;

      case 'grow':
        if (t && t.alive) { t.swell = (t.swell || 0) + 1; t.scale = e.factor; t.flash = 0.25; }
        break;

      case 'transmute':
        if (t && t.alive && GLYPHS[e.glyph]) {
          t.glyphKey = e.glyph;
          t.def = GLYPHS[e.glyph];
          t.hp = t.def.hp;
          t.flash = 0.35;
        }
        break;

      case 'spawn':
        if (ctx.spawn && GLYPHS[e.glyph] && ctx.blocks.length < ctx.cfg.maxBlocks) {
          ctx.spawn(e.glyph, e.x, e.y);
        }
        break;

      case 'teleport':
        if (t && t.alive) {
          const seat = world.emptyAround(t, 6)[Math.floor(Math.random() * 8)] ||
                       world.emptyAround(t, 6)[0];
          if (seat) {
            t.gx = seat.x; t.gy = seat.y;
            t.x = ctx.cfg.originX + t.gx * ctx.cfg.cell + ctx.cfg.cell / 2;
          }
          t.flash = 0.4;
        }
        break;

      case 'swap':
        if (t && t.alive && e.other && e.other.alive) {
          const gx = t.gx, gy = t.gy, x = t.x, y = t.y;
          t.gx = e.other.gx; t.gy = e.other.gy; t.x = e.other.x; t.y = e.other.y;
          e.other.gx = gx; e.other.gy = gy; e.other.x = x; e.other.y = y;
        }
        break;

      case 'infect':
        if (t && t.alive && !t.infected) {
          t.infected = 2.2;                  // rots, then infects its own neighbours
        }
        break;

      case 'pierce':
        if (t && t.alive) { t.hp -= 4; t.flash = 0.25; if (t.hp <= 0) kill(t); }
        break;

      case 'reflect':
        if (ctx.reflect) ctx.reflect(t, e.shot);
        break;

      case 'score':
        scored += e.amount;
        break;

      case 'say':
        if (lines.length < 6) lines.push(e.text);
        break;
    }
  }

  function kill(b) {
    if (!b.alive) return;
    b.alive = false;
    destroyed++;
    scored += 40 + (b.def && b.def.register === 'operation' ? 60 : 0);
    ctx.cfg.graveyard.push({ x: b.gx, y: b.gy });
    if (ctx.cfg.graveyard.length > 24) ctx.cfg.graveyard.shift();
    if (ctx.onKill) ctx.onKill(b);
    // a dying block that has not yet gone off still gets its say
    if (!triggered.has(b) && b.def && typeof b.def.onHit === 'function') {
      // only for blocks whose whole point is what happens when they die
      const posthumous = ['venus', 'mars', 'scorpio', 'pisces', 'sulphur', 'aquarius'];
      if (posthumous.indexOf(b.glyphKey) >= 0) {
        triggered.add(b);
        try { for (const fx of b.def.onHit(b, ctx.shot, world) || []) {
          if (fx.kind !== 'destroy') queue.push(fx);
        } } catch (err) {}
      }
    }
  }

  return { destroyed, scored, depth, lines, capped: resolved >= CASCADE_CAP };
}

if (typeof window !== 'undefined') {
  window.resolveCascade = resolveCascade;
  window.makeWorld = makeWorld;
}
