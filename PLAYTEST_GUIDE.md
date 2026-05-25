# Alchemy Block Invaders — Playtest Guide

## Quick Start

### 1. Start the Game Server

```bash
cd C:\Dev\AlchemyBlockInvaders
npx http-server . -p 3002
```

Then open your browser to: **http://localhost:3002**

### 2. Basic Controls

- **Arrow Keys (Left/Right)** — Move your vessel
- **Spacebar** — Fire bullets at descending blocks
- **📖 Tome Button** — Open your spellbook to review discovered reactions

### 3. First 30 Seconds

1. You will see 4 blocks descending (different colored)
2. Press arrow keys to position yourself
3. Press spacebar to fire at each block
4. Each block destroyed adds to your score and affinity
5. Destroy all blocks to advance to Wave 2
6. Click the Tome button to see what you've learned

---

## What to Look For (Testing Checklist)

### Core Gameplay
- ✓ Game starts without console errors
- ✓ Player vessel appears at bottom center
- ✓ Blocks spawn and descend smoothly
- ✓ Blocks are color-coded (fire=red, water=blue, air=yellow, earth=brown)
- ✓ Blocks display emoji symbols (🔥💧🌬️🌍)

### Mechanics
- ✓ Spacebar fires bullets
- ✓ Bullets move upward and collide with blocks
- ✓ When a bullet hits a block, both disappear
- ✓ Score increases by 10 for each hit
- ✓ Affinity dots (top-right) activate as you hit elements

### Waves & Difficulty
- ✓ All blocks destroyed → Wave 2 starts
- ✓ Wave 2 has more enemies (5 vs 4)
- ✓ Enemies move faster in later waves
- ✓ Wave counter increments at top-left

### Game Over
- ✓ If a block reaches the bottom without being destroyed, health decreases
- ✓ Health counter shows at top-left (starts at 3)
- ✓ At 0 health, game over screen appears
- ✓ "Play Again" button resets the game

### Tome System
- ✓ Click 📖 Tome button → modal appears
- ✓ See "Principles" section with 4 elements
- ✓ "Discovered Reactions" section starts empty
- ✓ After hitting fire+water block → reaction appears in Tome
- ✓ Reaction description explains what happened
- ✓ Close button (×) closes the modal
- ✓ Click outside modal → modal closes

### Reactions (Should Discover All 6)
1. **🔥 + 💧** → Steam (Mist Cloud) ✓
2. **🔥 + 🌍** → Ash (Dust Dispersal) ✓
3. **🔥 + 🌬️** → Wildfire (Expansion) ✓
4. **💧 + 🌍** → Mud (Stasis) ✓
5. **💧 + 🌬️** → Mist (Mist Cloud) ✓
6. **🌬️ + 🌍** → Dust (Dispersion) ✓

---

## Expected Progression

### Wave 1-2 (Learning Phase)
- Discover basic reactions
- Learn element colors and symbols
- Understand basic collision mechanics

### Wave 3-4 (Mastery Phase)
- Anticipate reactions
- Understand the pattern of elements
- Experiment with different targeting strategies

### Wave 5+ (Challenge Phase)
- Many enemies on screen
- Fast-paced action required
- Deep affinity tracking

---

## Known Limitations (MVP)

These are intentional for the MVP:
- No particle effects (yet)
- No sound (yet)
- No mobile/touch controls (keyboard only)
- No difficulty settings
- No save/load system
- Reactions are visual-only (no gameplay impact yet)
- No secondary effects fully implemented (noted in code for future)

---

## Feedback to Prioritize

After playtesting, please note:

1. **Difficulty Balance** — Is the game too easy/hard? When should it get challenging?

2. **Reaction Effects** — Which reactions should have visual secondary effects? (clouds, particles, etc.)

3. **Tome Experience** — Is it clear how to access and read the Tome? Is the information useful?

4. **Element Identity** — Are the colors and emoji clear enough? Any confusion about which is which?

5. **Pacing** — Does the game feel balanced between action and learning?

6. **Next Features** — What would make this more interesting for Phase 2? (Planets? More elements? Story?)

---

## Debug Tips

**Console (F12):**
- Check for any JavaScript errors
- Game state is available as `gameState` object
- Tome entries accessible via `TOME.discovered`

**Performance:**
- Target is 60 FPS (smooth animation)
- Watch for stuttering on wave 5+

**Accessibility:**
- Can you play with only keyboard?
- Are colors distinguishable?
- Is text readable on your display?

---

## Session Notes Template

```
Date: [DATE]
Tester: [NAME]
Session Length: [MINUTES]
Highest Wave Reached: [WAVE]

What Worked Well:
- [OBSERVATION]
- [OBSERVATION]

What Felt Confusing:
- [OBSERVATION]
- [OBSERVATION]

Suggestions for Improvement:
- [IDEA]
- [IDEA]

Next Steps I'd Like to See:
- [FEATURE]
- [FEATURE]
```

---

## Resetting the Game

If the game gets stuck:
1. Close the browser tab
2. Refresh the page (Ctrl+R / Cmd+R)
3. Or click "Play Again" on the game over screen

---

*Playtest Guide v1.0*  
*Alchemy Block Invaders MVP*  
*Happy transmuting!*
