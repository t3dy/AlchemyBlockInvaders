# Alchemy Block Invaders

A Space Invaders-style game where enemies are alchemical blocks, and players learn the secrets of the four elements and their reactions through gameplay.

## Overview

In **Alchemy Block Invaders**, descending blocks embody the four fundamental elements of Paracelsian alchemy: **Fire** (🔥), **Water** (💧), **Air** (🌬️), and **Earth** (🌍). As you shoot each block, you trigger alchemical reactions that transform the blocks and produce cascading effects. Your "Tome" (spellbook) accumulates knowledge of each reaction, unlocking descriptions of what happens when elements meet.

## Gameplay

- **Arrow Keys** — Move left/right
- **Spacebar** — Fire bullets
- **📖 Tome Button** — Open your spellbook to review discovered reactions

## Mechanics

### Core System
- Descending blocks represent the four elements
- Fire bullets transform enemy blocks through alchemical reactions
- Each reaction produces secondary effects and grants affinity
- Kill all enemies to advance to the next wave
- Health decreases if a block reaches the bottom
- Game ends when health reaches 0

### Elements & Their Natures

**Fire** 🔥 — The active principle of transformation. When you fire a bullet, you activate the nature of fire within the block, consuming and transmuting.

**Water** 💧 — The solvent and the mirror. Water responds to fire's heat and binds with earth. It moves where fire is rigid.

**Air** 🌬️ — The medium and messenger. Air rises and disperses. It carries what fire releases and water cannot hold.

**Earth** 🌍 — The vessel and foundation. Earth is stable, heavy, and contains. All transformations eventually settle into earth form.

## Reactions

Each interaction between Fire (your bullet) and an enemy element produces a unique alchemical reaction with secondary effects:

- **Fire + Water** → Steam (Mist Cloud)
- **Fire + Earth** → Ash (Dust)
- **Fire + Air** → Wildfire (Expansion)
- **Water + Earth** → Mud (Stasis)
- **Water + Air** → Mist (Mist Cloud)
- **Air + Earth** → Dust (Dispersion)

## The Tome

Your Tome (accessed via the 📖 button) contains:

1. **Principles** — The fundamental nature of each element
2. **Discovered Reactions** — Descriptions of interactions you've witnessed

As you shoot blocks, new reactions appear in your Tome, revealing the secrets of alchemical transformation.

## Character Sheet

The top-right HUD displays your **Elemental Affinity**, showing how much of each element you've worked with:

- Fire affinity increases when you use fire bullets
- Each element's affinity grows as you interact with it
- Your affinities track your progress as an alchemist

## Scoring & Progression

- **Score** — Points awarded for each block destroyed
- **Health** — Decreases when blocks reach bottom; 0 = Game Over
- **Wave** — Difficulty increases with each wave; more enemies spawn
- **Affinity** — Tracks your mastery of each element

## Installation & Running

```bash
npm install serve --save-dev
npx serve .
```

Then navigate to `http://localhost:3000` (or your server's port).

## Project Structure

```
AlchemyBlockInvaders/
├── index.html           # Main game UI and layout
├── game.js              # Game logic, element system, reactions
├── README.md            # This file
├── DESIGN.md            # Detailed design and correspondence system
└── TOME_ENTRIES.md      # All tome entries and interaction descriptions
```
