# Alchemy Block Invaders — Claude Project Instructions

## Project Overview

**Alchemy Block Invaders** is an educational Space Invaders-style game that teaches alchemical correspondences through gameplay. Players shoot descending blocks representing the four elements (Fire, Water, Air, Earth) and discover how they interact through a Tome (spellbook) system.

## File Structure

```
AlchemyBlockInvaders/
├── index.html           # Main HTML: game canvas, HUD, Tome modal, game-over screen
├── game.js              # Complete game logic: engine, element system, reactions, tome
├── .claude/
│   └── launch.json      # Dev server config (npx serve)
├── README.md            # User-facing gameplay guide
├── DESIGN.md            # Complete design document with system details
├── TOME_ENTRIES.md      # All text content for the Spellbook
└── CLAUDE.md            # This file
```

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
