// ===================================================================
// THE DEVICES OF THE SEVENTY-TWO — drawn, not copied
//
// Why these are drawn rather than scanned:
//
// `GoetiaRevEng` holds extracted seals from a public-domain plate, and
// the plate's copyright is not in question. The problem is ACCURACY.
// The extraction's rows are misaligned against their labels, and the
// misalignment is not constant:
//
//     the row labelled  1 Bael    carries a seal captioned "10. Buer"
//     the row labelled 20 Purson  carries a seal captioned "27. Ronove"
//
// Nine, then seven. A constant offset could be corrected; a varying one
// cannot, not without re-cutting all seventy-two from a clean scan and
// checking each caption. So shipping those images would put the wrong
// seal on most of the hierarchy, in a project whose entire claim is
// fidelity to its sources. Recorded as a task in the pipeline instead.
//
// What is drawn here is therefore OUR OWN DEVICE for each spirit, and
// the game says so. It is not a reproduction and does not pretend to
// be. But it is not arbitrary either: every element of it is read off
// that spirit's attested attributes, so the device is a diagram of what
// the spirit IS —
//
//     the ring          the circle of art, always
//     the spokes        one per five legions, so Bael's 66 bristle and
//                       a thin command shows a sparse device
//     the terminals     the RANK: a king's spokes end in crowned bars,
//                       a marquis's in hooks, a knight's in blades
//     the ground        the ELEMENT, as the alchemical triangle
//     the centre        the PLANET's own glyph
//     the limbs         a deterministic flourish from the spirit's
//                       number, so no two devices are alike
//
// Deterministic: spirit N always draws the same device.
// ===================================================================

// a small deterministic PRNG, so a spirit's device never changes
function sealRand(seed) {
  let s = seed * 9301 + 49297;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const RANK_TERMINAL = {
  king:      'crown',
  prince:    'orb',
  duke:      'fork',
  marquis:   'hook',
  earl:      'arrow',
  president: 'dot',
  knight:    'blade'
};

const PLANET_GLYPH = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀',
  mars: '♂', jupiter: '♃', saturn: '♄'
};

// the four elements as the alchemical triangles
function drawElementGround(ctx, el, r) {
  ctx.beginPath();
  const h = r * 0.92;
  if (el === 'fire' || el === 'air') {
    ctx.moveTo(0, -h); ctx.lineTo(h * 0.87, h * 0.5); ctx.lineTo(-h * 0.87, h * 0.5);
  } else {
    ctx.moveTo(0, h); ctx.lineTo(h * 0.87, -h * 0.5); ctx.lineTo(-h * 0.87, -h * 0.5);
  }
  ctx.closePath();
  ctx.stroke();
  // air and earth carry the bar
  if (el === 'air' || el === 'earth') {
    ctx.beginPath();
    const y = el === 'air' ? -h * 0.12 : h * 0.12;
    ctx.moveTo(-h * 0.52, y); ctx.lineTo(h * 0.52, y);
    ctx.stroke();
  }
}

function drawTerminal(ctx, kind, len) {
  ctx.beginPath();
  switch (kind) {
    case 'crown':                                   // King
      ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0);
      ctx.moveTo(-4.5, -3.5); ctx.lineTo(4.5, -3.5);
      ctx.moveTo(0, -3.5); ctx.lineTo(0, 3.5);
      break;
    case 'orb':                                     // Prince
      ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
      break;
    case 'fork':                                    // Duke
      ctx.moveTo(0, 0); ctx.lineTo(-4, -5);
      ctx.moveTo(0, 0); ctx.lineTo(4, -5);
      break;
    case 'hook':                                    // Marquis
      ctx.arc(0, -3, 3.4, Math.PI * 0.35, Math.PI * 1.75);
      break;
    case 'arrow':                                   // Earl
      ctx.moveTo(-3.6, 2.4); ctx.lineTo(0, -3.6); ctx.lineTo(3.6, 2.4);
      break;
    case 'dot':                                     // President
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      return;
    case 'blade':                                   // Knight
      ctx.moveTo(-2.6, 3); ctx.lineTo(0, -5.5); ctx.lineTo(2.6, 3);
      ctx.closePath();
      break;
  }
  ctx.stroke();
}

// ===================================================================
// drawSeal — the whole device, centred on (0,0), radius R
// ===================================================================
function drawSeal(ctx, spirit, R, opts) {
  opts = opts || {};
  const ink = opts.ink || '#f0e6d2';
  const rnd = sealRand(spirit.id * 37 + 11);
  const spokes = Math.max(5, Math.min(14, Math.round(spirit.legions / 5)));
  const terminal = RANK_TERMINAL[spirit.rank] || 'dot';

  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = opts.lineWidth || Math.max(1, R * 0.045);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // the circle of art
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2);
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // the legions, as spokes with the rank's terminal
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const inner = R * (0.9 + rnd() * 0.02);
    const outer = R * (1.16 + rnd() * 0.16);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
    ctx.save();
    ctx.translate(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.rotate(a + Math.PI / 2);
    drawTerminal(ctx, terminal, R * 0.2);
    ctx.restore();
  }

  // the elemental ground
  ctx.globalAlpha = 0.75;
  drawElementGround(ctx, spirit.element, R * 0.62);
  ctx.globalAlpha = 1;

  // the flourish: two or three limbs unique to this spirit's number
  const limbs = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < limbs; i++) {
    const a0 = rnd() * Math.PI * 2;
    const a1 = a0 + (0.7 + rnd() * 1.6) * (rnd() < 0.5 ? 1 : -1);
    const r0 = R * (0.2 + rnd() * 0.3);
    const r1 = R * (0.45 + rnd() * 0.35);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
    ctx.quadraticCurveTo(
      Math.cos((a0 + a1) / 2) * R * 0.95, Math.sin((a0 + a1) / 2) * R * 0.95,
      Math.cos(a1) * r1, Math.sin(a1) * r1);
    ctx.stroke();
    // a terminal ring on some limbs, as the seals have
    if (rnd() < 0.55) {
      ctx.beginPath();
      ctx.arc(Math.cos(a1) * r1, Math.sin(a1) * r1, R * 0.075, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // the planet at the centre
  const g = PLANET_GLYPH[spirit.planet] || '✦';
  ctx.font = Math.round(R * 0.62) + 'px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(g, 0, R * 0.02);

  ctx.restore();
}

// render a device to a data URL, for the HTML panels
function sealDataURL(spirit, size, ink, bg) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, size, size); }
  x.translate(size / 2, size / 2);
  drawSeal(x, spirit, size * 0.34, { ink: ink || '#f0e6d2', lineWidth: Math.max(1, size * 0.014) });
  return c.toDataURL('image/png');
}

if (typeof window !== 'undefined') {
  window.drawSeal = drawSeal;
  window.sealDataURL = sealDataURL;
  window.RANK_TERMINAL = RANK_TERMINAL;
}
