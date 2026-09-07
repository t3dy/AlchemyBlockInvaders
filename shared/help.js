// ===================================================================
// THE TEACHING LAYER — shared by all four games
//
// The brief was to err on the side of explaining too much, and to make
// all of it toggleable. So this gives every game three things:
//
//   1. A HINT STRIP down one side, always on by default, listing every
//      control and what it does. This is the thing that answers "how do
//      I fire off a power-up" without the player having to go looking.
//   2. A FULL MANUAL on `?` or `H`: what the game is, what you are
//      trying to do, every control, and the systems behind it.
//   3. A NARRATOR line: games call HELP.say() when something happens and
//      it explains, in words, what just happened and why.
//
// Everything is toggleable and the choice is remembered per game:
//   H or ?  full manual        F1 also works
//   J       hint strip on/off
//   K       narrator on/off
//
// Usage — one call, everything else is automatic:
//   HELP.install({ id:'invaders', title:'...', premise:'...',
//                  goal:'...', controls:[['←  →','move']], systems:[...] })
// ===================================================================

(function () {
  const HELP = {};
  let cfg = null, root = null, strip = null, manual = null, narrator = null;
  let showStrip = true, showNarrator = true, manualOpen = false;
  let narratorTimer = 0, narratorQueue = [];

  function store(k, v) { try { localStorage.setItem('help.' + cfg.id + '.' + k, v ? '1' : '0'); } catch (e) {} }
  function load(k, dflt) {
    try {
      const v = localStorage.getItem('help.' + cfg.id + '.' + k);
      return v === null ? dflt : v === '1';
    } catch (e) { return dflt; }
  }

  const CSS = `
  .help-root { position: fixed; inset: 0; pointer-events: none; z-index: 9000;
    font-family: "Courier New", ui-monospace, monospace; }
  .help-root * { box-sizing: border-box; }

  .help-strip {
    position: fixed; top: 50%; right: 10px; transform: translateY(-50%);
    width: 238px; max-height: 84vh; overflow-y: auto; pointer-events: auto;
    background: rgba(18,16,13,.9); color: #f0e6d2; border: 1px solid #6b5b45;
    padding: 11px 12px 12px; font-size: 11px; line-height: 1.5;
  }
  .help-strip.light { background: rgba(244,241,228,.94); color: #2f3437; border-color: #2f3437; }
  .help-strip h4 { margin: 0 0 7px; font-size: 10px; letter-spacing: .18em; font-weight: normal; opacity: .75; }
  .help-strip .hrow { display: grid; grid-template-columns: 74px 1fr; gap: 3px 8px; margin-bottom: 3px; }
  .help-strip kbd {
    border: 1px solid currentColor; opacity: .95; padding: 0 5px; font: inherit;
    font-size: 10px; white-space: nowrap; display: inline-block; text-align: center;
  }
  .help-strip .sec { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(128,116,92,.5); }
  .help-strip .why { opacity: .8; font-size: 10.5px; margin-top: 8px; }
  .help-strip .foot { margin-top: 10px; font-size: 9.5px; opacity: .6; }

  .help-tabs { position: fixed; top: 10px; right: 10px; display: flex; gap: 6px; pointer-events: auto; z-index: 9002; }
  .help-tab {
    background: rgba(18,16,13,.86); color: #f0e6d2; border: 1px solid #6b5b45;
    font: inherit; font-size: 10px; letter-spacing: .1em; padding: 5px 9px; cursor: pointer;
  }
  .help-tab.light { background: rgba(244,241,228,.94); color: #2f3437; border-color: #2f3437; }
  .help-tab:hover { filter: brightness(1.35); }
  .help-tab.off { opacity: .5; }

  .help-narrator {
    position: fixed; left: 50%; bottom: 92px; transform: translateX(-50%);
    max-width: min(760px, 92vw); pointer-events: none;
    background: rgba(18,16,13,.92); color: #f6ecd8; border: 1px solid #8d7a55;
    padding: 9px 15px; font-size: 12.5px; line-height: 1.5; text-align: center;
    opacity: 0; transition: opacity .18s;
  }
  .help-narrator.light { background: rgba(244,241,228,.96); color: #2f3437; border-color: #2f3437; }
  .help-narrator.show { opacity: 1; }
  .help-narrator b { color: #f5c518; font-weight: normal; }
  .help-narrator.light b { color: #9a6b00; }

  .help-manual {
    position: fixed; inset: 0; display: none; pointer-events: auto; z-index: 9001;
    background: rgba(10,9,7,.93); overflow-y: auto; padding: 40px 20px 70px;
  }
  .help-manual.light { background: rgba(244,241,228,.97); }
  .help-manual.open { display: block; }
  .help-sheet {
    max-width: 880px; margin: 0 auto; color: #f0e6d2; font-size: 13px; line-height: 1.65;
  }
  .help-manual.light .help-sheet { color: #2f3437; }
  .help-sheet h2 { font-size: 21px; letter-spacing: .16em; font-weight: normal; margin: 0 0 6px; }
  .help-sheet .sub { opacity: .72; font-style: italic; margin: 0 0 20px; font-size: 12px; }
  .help-sheet h3 {
    font-size: 11px; letter-spacing: .2em; font-weight: normal; opacity: .8;
    margin: 26px 0 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(140,126,100,.5);
  }
  .help-sheet .kv { display: grid; grid-template-columns: 132px 1fr; gap: 6px 14px; }
  .help-sheet .kv kbd {
    border: 1px solid currentColor; padding: 1px 6px; font: inherit; font-size: 11px;
    text-align: center; white-space: nowrap;
  }
  .help-sheet .note { border-left: 2px solid #8d7a55; padding-left: 12px; opacity: .88; margin: 12px 0; }
  .help-sheet .close { margin-top: 26px; font-size: 11px; opacity: .7; }
  .help-sheet table { border-collapse: collapse; width: 100%; font-size: 12px; }
  .help-sheet td, .help-sheet th {
    border: 1px solid rgba(140,126,100,.45); padding: 5px 8px; text-align: left; vertical-align: top;
  }
  .help-sheet th { font-weight: normal; opacity: .75; letter-spacing: .1em; font-size: 10.5px; }
  @media (max-width: 720px) {
    .help-strip { display: none; }
    .help-sheet .kv { grid-template-columns: 100px 1fr; }
  }
  `;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function lightClass() { return cfg.light ? ' light' : ''; }

  function buildStrip() {
    const rows = cfg.controls.map(c =>
      '<div class="hrow"><kbd>' + c[0] + '</kbd><span>' + c[1] + '</span></div>').join('');
    const extra = (cfg.stripNote ? '<div class="why">' + cfg.stripNote + '</div>' : '');
    strip.innerHTML =
      '<h4>' + (cfg.title || 'CONTROLS') + '</h4>' + rows +
      '<div class="sec"><div class="hrow"><kbd>H</kbd><span>the full manual</span></div>' +
      '<div class="hrow"><kbd>J</kbd><span>hide this panel</span></div>' +
      '<div class="hrow"><kbd>K</kbd><span>narrator on / off</span></div></div>' +
      extra +
      '<div class="foot">Everything here can be switched off. Nothing is hidden from you.</div>';
  }

  function buildManual() {
    const ctrl = cfg.controls.concat([
      ['H  /  ?', 'this manual'],
      ['J', 'the hint panel on the right, on or off'],
      ['K', 'the narrator line at the bottom, on or off']
    ]).map(c => '<span><kbd>' + c[0] + '</kbd></span><span>' + c[1] + '</span>').join('');

    const systems = (cfg.systems || []).map(s =>
      '<h3>' + s.title + '</h3>' + (s.body || '') +
      (s.table ? '<table><tr>' + s.table.head.map(h => '<th>' + h + '</th>').join('') + '</tr>' +
        s.table.rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') +
        '</table>' : '')
    ).join('');

    manual.innerHTML =
      '<div class="help-sheet">' +
        '<h2>' + cfg.title + '</h2>' +
        '<p class="sub">' + (cfg.subtitle || '') + '</p>' +
        '<h3>WHAT THIS IS</h3><p>' + cfg.premise + '</p>' +
        '<h3>WHAT YOU ARE TRYING TO DO</h3><p>' + cfg.goal + '</p>' +
        '<h3>EVERY CONTROL</h3><div class="kv">' + ctrl + '</div>' +
        systems +
        '<p class="close">Press <kbd>H</kbd> or <kbd>Esc</kbd> to close. ' +
        'This manual is always here; you never have to remember anything.</p>' +
      '</div>';
  }

  function render() {
    strip.style.display = showStrip ? '' : 'none';
    const tabs = root.querySelectorAll('.help-tab');
    if (tabs[1]) tabs[1].classList.toggle('off', !showStrip);
    if (tabs[2]) tabs[2].classList.toggle('off', !showNarrator);
    manual.classList.toggle('open', manualOpen);
  }

  HELP.install = function (config) {
    cfg = config;
    if (!document.getElementById('help-style')) {
      const st = el('style'); st.id = 'help-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    showStrip = load('strip', true);
    showNarrator = load('narrator', true);

    root = el('div', 'help-root');
    strip = el('div', 'help-strip' + lightClass());
    narrator = el('div', 'help-narrator' + lightClass());
    manual = el('div', 'help-manual' + lightClass());

    const tabs = el('div', 'help-tabs');
    const mk = (label, fn) => {
      const b = el('button', 'help-tab' + lightClass(), label);
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); b.blur(); });
      return b;
    };
    tabs.appendChild(mk('? MANUAL', () => { manualOpen = !manualOpen; render(); }));
    tabs.appendChild(mk('HINTS', () => { showStrip = !showStrip; store('strip', showStrip); render(); }));
    tabs.appendChild(mk('NARRATOR', () => { showNarrator = !showNarrator; store('narrator', showNarrator); render(); }));

    buildStrip(); buildManual();
    root.appendChild(strip); root.appendChild(narrator); root.appendChild(manual);
    document.body.appendChild(root); document.body.appendChild(tabs);

    manual.addEventListener('click', (e) => { if (e.target === manual) { manualOpen = false; render(); } });

    window.addEventListener('keydown', function (e) {
      const k = (e.key || '').toLowerCase();
      if (k === 'h' || k === '?' || e.key === 'F1') { manualOpen = !manualOpen; render(); e.preventDefault(); }
      else if (k === 'escape' && manualOpen) { manualOpen = false; render(); e.preventDefault(); }
      else if (k === 'j') { showStrip = !showStrip; store('strip', showStrip); render(); }
      else if (k === 'k') { showNarrator = !showNarrator; store('narrator', showNarrator); render(); }
    });

    render();
    if (cfg.opening) HELP.say(cfg.opening, 6);
    return HELP;
  };

  // Games call this when something happens that deserves explaining.
  HELP.say = function (text, seconds) {
    if (!narrator) return;
    narratorQueue.push({ text: text, t: seconds || 3.2 });
    if (narratorTimer <= 0) HELP._next();
  };
  HELP._next = function () {
    const n = narratorQueue.shift();
    if (!n) { narrator.classList.remove('show'); narratorTimer = 0; return; }
    narrator.innerHTML = n.text;
    narrator.classList.toggle('show', showNarrator);
    narratorTimer = n.t;
  };
  // drive from each game's own loop so it obeys pause
  HELP.tick = function (dt) {
    if (narratorTimer > 0) {
      narratorTimer -= dt;
      if (narratorTimer <= 0) HELP._next();
    }
    if (!showNarrator) narrator.classList.remove('show');
  };
  HELP.isManualOpen = function () { return manualOpen; };
  HELP.narratorOn = function () { return showNarrator; };

  window.HELP = HELP;
})();
