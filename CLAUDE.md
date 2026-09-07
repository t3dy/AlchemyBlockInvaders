# Alchemy Block Invaders — Claude Project Instructions

## Project Overview

**Alchemy Block Invaders** is an educational Space Invaders-style game that teaches alchemical correspondences through gameplay. Players shoot descending blocks representing the four elements (Fire, Water, Air, Earth) and discover how they interact through a Tome (spellbook) system.

## File Structure

```
AlchemyBlockInvaders/
├── index.html           # THE HUB. The site's front door: what the four games are
│                        # trying to do, and the controls for each. Links to the
│                        # four folders below. Not a game itself.
├── invaders/
│   ├── index.html       # Alchemy Block Invaders
│   ├── game-v2.js       # THE SCRIPT THAT PAGE ACTUALLY LOADS. Shields, glyph
│   │                    # selection, XP, the full alchemical system. Loaded with
│   │                    # a ?v= query - bump it whenever this file changes, or a
│   │                    # browser holding an earlier build keeps running it.
│   ├── game.js          # The superseded MVP script. Nothing loads it. Kept for
│   │                    # reference only; the line numbers quoted further down
│   │                    # this document refer to IT, not to game-v2.js.
│   └── test.html        # standalone assertions over the MVP script
├── novaheat/            # Nova Heat        (game.js, classic script)
├── circulatio/          # Circulatio       (src/*.js, ES modules + three.js)
├── salamandra/          # Salamandra       (game.js, classic script)
├── .claude/
│   └── launch.json      # Dev servers, all with -c-1 so edits are never cached
├── DEPLOY_STATE.md      # canonical URL, host, and the base-path gotcha. Read first
├── VERIFIED.md          # Verification record: what was driven, and what it showed
├── README.md            # User-facing gameplay guide
├── DESIGN.md            # Complete design document with system details
├── TOME_ENTRIES.md      # All text content for the Spellbook
└── CLAUDE.md            # This file
```

**Every link on the hub is relative** (`invaders/`, `novaheat/`, ...), never
root-absolute (`/invaders/`). GitHub Pages serves this repo from a subpath, so a
leading slash resolves to the wrong place and 404s the whole site. See
`DEPLOY_STATE.md`.

## The other three games in this folder

This directory holds four separate games, not one. The three below are independent, have
their own loops, and are served from the same root.

| folder | game | port | what it is |
|---|---|---|---|
| `invaders/` | **Alchemy Block Invaders** | 3001 | the original: shields, glyphs, the Tome |
| `novaheat/` | **Nova Heat** | 3003 | Metatron's Cube; charge the circles, light the lines, hold back the Nova Mob. A Burroughs cut-up as a power |
| `circulatio/` | **Circulatio** | 3004 | a bounce/golf engine whose **physics is a metaphysics** - Aristotelian, Paracelsian, Pythagorean and Lettrist rulesets change gravity, rebound and grip |
| `salamandra/` | **Salamandra** | 3005 | a side-scrolling flight through the athanor; eleven kinds of matter against ten kinds of masonry |

The root server on 3001 serves the whole directory, so the hub and all four games are
reachable from it (`/`, `/invaders/`, `/novaheat/`, `/circulatio/`, `/salamandra/`) without
starting the others.

**Salamandra exposes `window.SAL` and Circulatio exposes `window.CIRC`** for headless
verification. Read them through getters or live objects - see VERIFIED.md for why a captured
reference goes stale, and for how to step these loops correctly.

## READ THESE FIRST

| file | why |
|---|---|
| **`PROMPTSTOFEATURES.md`** | every requirement Ted has given, unpacked into features with status, plus the standing instructions and the engineering rules learned from real bugs. **This is the spec.** |
| `CLAUDECONVO1.md` | the verbatim session record those requirements come from |
| `VERIFIED.md` | what has actually been driven and what it showed — including how to drive these loops without the harness lying to you |
| `DEPLOY_STATE.md` | the live URL, the host, and the two ways this site breaks |
| `C:\Dev\PIPELINE.md` | where the research corpus is and how a source becomes a mechanic |
| `C:\Dev\AGENTS.md` | agent roles and handover contracts |

## The invaders game is now v3

`invaders/` is no longer a four-element shooter. It is built from four files:

| file | what |
|---|---|
| `glyphs.js` | **the 26 glyph blocks and their behaviours.** Elements, principles, planets, zodiacal operations. Each `onHit` returns a list of *effects* and mutates nothing — that purity is what lets a chain of forty resolve without the code turning to soup. |
| `cascade.js` | the effect resolver. A work queue, not recursion; one trigger per block per chain; a 400-effect cap. This is the Rube Goldberg machine. |
| `spells.js` | the three operations (SOLVE / COAGULA / PROJECTIO) on `Z` `X` `C`, and the Gradius power bar spent with `Shift`. |
| `game-v3.js` | the engine: THE CABINET (exhibition of all 26) and WAVES. |

**`game-v2.js` is superseded and nothing loads it.** The old line numbers quoted further down
this document refer to the original `game.js`, which is older still. Treat both as history.

**The rule for new blocks:** the behaviour must follow from the symbolism. Jupiter expands
because Jupiter is the principle of increase. If you cannot state that sentence for a block
you are adding, the block is not ready.

## Game Architecture

### Core Systems

**1. Element System** (`game.js` — lines 15-43)
- 4 elements: Fire, Water, Air, Earth
- Each has color, emoji, and behavior
- Elements are immutable; reactivity is the only interaction

**2. Interaction/Reaction System** (`game.js` — lines 45-68)
- 6 defined reactions (fire hitting water/earth/air, water hitting air/earth, air hitting earth)
- Each reaction has a description and secondary effect
- Reactions are one-directional (fire bullet → enemy element)
- Tome entries are auto-discovered on first collision

**3. Tome System** (`game.js` — lines 70-88)
- Discovered entries are stored in `TOME.discovered` object
- Entries are rendered dynamically in the modal
- Sections: Principles (always visible) + Discovered Reactions

**4. Game State** (`game.js` — lines 90-101)
- Score, health, wave, gameOver, elementalAffinity
- All mutations flow through game loop
- HUD updates every frame

**5. Entity Systems**
- **Player** (lines 103-124): Vessel, fixed position, movement
- **Bullets** (lines 126-148): Fired by player, auto-destroy off-screen
- **Enemies** (lines 150-183): Spawn each wave, move down, hurt player on collision

### Collision & Reaction Resolution

When a bullet collides with an enemy:
1. Interaction is looked up in `INTERACTIONS` object
2. Affinity is updated (`elementalAffinity[element]++`)
3. Tome entry is discovered and stored
4. Score is updated
5. Bullet and enemy are destroyed

---

## Development Workflow

### Running the Game

```bash
cd C:\Dev\AlchemyBlockInvaders
npx serve . --port 3002
# Navigate to http://localhost:3002
```

### Adding New Content

#### New Reaction
1. Add entry to `INTERACTIONS` in `game.js` (use format `'element1-element2'`)
2. Add description and `secondaryEffect` field
3. Add corresponding Tome entry in `game.js` TOME.entries
4. Add full text to `TOME_ENTRIES.md`
5. Test by colliding those elements in-game

#### New Element (Future)
1. Add to `ELEMENTS` object
2. Add color to `ELEMENT_COLORS`
3. Add emoji to `ELEMENT_EMOJI`
4. Add Principle entry to Tome
5. Define all reactions with existing elements in `INTERACTIONS`
6. Add spawn logic to `enemySystem.spawn()`

#### Balance Adjustments
- **Enemy count:** Change `3 + gameState.wave` in `enemySystem.spawn()` (line 160)
- **Enemy speed:** Change `2 + gameState.wave * 0.5` in spawn loop (line 165)
- **Player speed:** Change `player.speed` (line 113)
- **Bullet speed:** Change `bullets[i].speed` spawn value (line 140)
- **Starting health:** Change `gameState.health` initialization (line 96)

---

## Game Loop Flow

```
1. Clear canvas
2. Player.update() — read input, move player
3. Bullet.update() — move bullets, remove off-screen
4. Enemy.update() — move enemies, check defeat/wave clear
5. checkCollisions() — detect bullet-enemy hits, trigger reactions
6. Player.draw() — render player
7. Bullets.draw() — render bullets
8. Enemies.draw() — render enemies + emoji
9. updateHUD() — refresh score/health/wave display
10. requestAnimationFrame(gameLoop) — repeat
```

## Design Philosophy

### MVP First
- Start with 4 elements, 6 reactions
- No planets, no zodiac, no Paracelsian principles yet
- Focus on core loop: see block → shoot → learn reaction → affinity grows

### Pedagogy Over Mechanics
- Tome entries are the primary learning tool
- Every game mechanic teaches something about alchemy
- Reactions are thematically correct before mechanically flashy

### Discoverable, Not Instructed
- Players learn by doing, not by reading tutorials
- Tome is optional; observation is the primary teacher
- Each collision teaches something new

---

## Future Phases

### Phase 2: Planets & Metals
- 7 new block types (Sun/Gold, Moon/Silver, etc.)
- 3×7 = 21 new reactions
- Planetary color shifts and transformations
- New Tome sections for planetary principles

### Phase 3: Zodiacal Processes
- 12 process-based effects
- Time-based transformations
- Multi-wave cascading effects
- Astrological timing mechanics

### Phase 4: Full Paracelsian System
- 3 Principles as modifiers (Sulfur, Salt, Mercury)
- 4 Elements as blocks
- 7 Planets as special encounters
- 12 Zodiacal processes
- 3-element reactions

### Phase 5: Campaign & Story
- Narrative campaign with progression
- Boss encounters with special properties
- Ultimate transmutation event
- New Game+ with additional challenges

---

## Testing Checklist

When modifying the game, verify:

- [ ] Game starts without errors
- [ ] Player can move left/right
- [ ] Player can fire bullets (spacebar)
- [ ] Enemies spawn and descend
- [ ] Collision detection works (all element pairs)
- [ ] Score increases on hits
- [ ] Health decreases when enemies reach bottom
- [ ] Wave counter increments
- [ ] Affinity indicators activate on first element interaction
- [ ] Tome button opens/closes modal
- [ ] New reactions appear in Tome when first discovered
- [ ] Game Over screen appears at 0 health
- [ ] Can restart via "Play Again" button

---

## Key Variables & Constants

### Game State
- `gameState.score` — Player points (int)
- `gameState.health` — Lives remaining (1-3)
- `gameState.wave` — Current difficulty wave (1+)
- `gameState.gameOver` — Boolean flag
- `gameState.elementalAffinity` — Object with fire/water/air/earth counts

### Collections
- `bullets` — Array of active bullets
- `enemies` — Array of active enemies
- `TOME.discovered` — Object of discovered tome keys
- `TOME.entries` — Object of all tome text entries

### Configuration
- Canvas: `window.innerWidth × window.innerHeight`
- Colors: `ELEMENT_COLORS` object
- Emojis: `ELEMENT_EMOJI` object
- Interactions: `INTERACTIONS` object with reaction definitions

---

## Notes for Future Contributors

1. **Immutability mindset:** Game state should be treated as immutable; create new objects rather than mutating existing ones where possible.

2. **Particle effects:** Current implementation uses simple rectangle clears. Real particle effects would improve visuals significantly.

3. **Audio:** The game is currently silent. Adding element-themed sound effects for each reaction would greatly enhance the experience.

4. **Mobile support:** Keyboard controls don't work on touch devices. Consider adding button-based controls or touch-and-drag mechanics.

5. **Accessibility:** Color-blind palette needs verification. Emoji provide redundancy, but colorblind testing would be valuable.

6. **Scaling:** For Phase 2+, consider refactoring the reaction system into a more scalable lookup table or generator function.

---

*Project Initialized: 2026-05-24*  
*Current Phase: MVP (4 Elements, 6 Reactions)*  
*Status: Playable, awaiting user feedback for Phase 2 direction*
