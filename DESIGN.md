# Alchemy Block Invaders — Design Document

## Vision

Transform the Space Invaders archetype into a pedagogical game where players learn alchemical correspondences through gameplay. Each block enemy embodies one of the four elements; each reaction teaches something about their natures and interactions. The game becomes a grimoire—a living textbook of elemental alchemy.

## System Architecture

### Element System

The game implements a **four-element correspondence system** derived from Paracelsian alchemy:

| Element | Emoji | Color | Nature |
|---------|-------|-------|--------|
| Fire | 🔥 | #ff6b6b (red) | Active, transformative, consuming |
| Water | 💧 | #4dabf7 (blue) | Solvent, flowing, reflective |
| Air | 🌬️ | #ffd43b (yellow) | Dispersive, volatile, medium |
| Earth | 🌍 | #8b6f47 (brown) | Stable, foundational, vessel |

### Reaction System

When Fire (player bullet) collides with an enemy block, an alchemical reaction occurs based on element pairs. Six primary reactions have been defined:

#### Reaction: Fire + Water → Steam

**Description:**
"Flames meet the deluge. Water extinguishes fire, producing steam that rises and obscures."

**Mechanic:** Mist Cloud
- Visual: Small expanding cloud at impact point
- Effect: Temporary visual obscuring; affects surrounding blocks
- Affinity Gain: +1 Fire, +1 Water

**Why This Reaction:**
In classical alchemy, fire and water are primary opposites. Their meeting produces neither—fire is quenched, water is volatilized. The alchemist witnesses transmutation: from two elements emerges a third state (steam/vapor). This teaches the principle of combination and loss of original forms.

---

#### Reaction: Fire + Earth → Ash

**Description:**
"Fire consumes the earth, leaving ash. Ash is dispersed by wind, becoming dust."

**Mechanic:** Dust / Dispersion
- Visual: Particles dissipate upward and outward
- Effect: Block breaks into smaller pieces; may trigger secondary effects with nearby elements
- Affinity Gain: +1 Fire, +1 Earth

**Why This Reaction:**
Fire and earth interact in combustion. Earth (matter) is consumed by fire's transformative heat, leaving ash (residue). This teaches the principle of sacrifice and transformation—matter yields its essence to fire.

---

#### Reaction: Fire + Air → Wildfire

**Description:**
"Fire ignites the air itself. The element feeds upon itself, growing wild and untamed."

**Mechanic:** Expansion
- Visual: The block grows larger, burns brighter
- Effect: Block becomes more dangerous; affects larger area; may split into multiple smaller fires
- Affinity Gain: +1 Fire, +1 Air

**Why This Reaction:**
Fire and air are both volatile and ascendant. Air feeds fire (oxygen); fire volatilizes air. Their union creates expansion and growth—the alchemical principle of multiplication. This is the most aggressive reaction, teaching students that some combinations amplify rather than resolve.

---

#### Reaction: Water + Earth → Mud

**Description:**
"Water binds with earth, forming mud. The mud settles and hardens."

**Mechanic:** Stasis
- Visual: Block slows or becomes immobilized
- Effect: Block becomes heavier, slower to descend; harder to destroy
- Affinity Gain: +1 Water, +1 Earth

**Why This Reaction:**
Water and earth combine to create density and inertia. This teaches the principle of fixation—the combination of liquid and solid creates something that resists change. In alchemical theory, this represents the nigredo (blackening/death) phase where materials bind and coagulate.

---

#### Reaction: Water + Air → Mist

**Description:**
"Water rises into the air as mist, becoming ethereal and dispersed."

**Mechanic:** Mist Cloud
- Visual: Cloud forms, obscures view
- Effect: Creates visual obscuring; reduces clarity for player and enemies
- Affinity Gain: +1 Water, +1 Air

**Why This Reaction:**
Water and air are the two "mobile" elements. Their union produces volatilization—matter becomes spirit. This teaches the principle of ascension and rarefaction, the transition from material to ethereal.

---

#### Reaction: Air + Earth → Dust

**Description:**
"Air scatters the earth, breaking it into fine dust that floats away."

**Mechanic:** Dispersion
- Visual: Block shatters into floating particles
- Effect: Particles disperse; some particles may trigger chain reactions with other elements
- Affinity Gain: +1 Air, +1 Earth

**Why This Reaction:**
Air and earth meet in erosion and scattering. Air breaks down earth's solidity into fine particles. This teaches the principle of dissolution and separation—air's mobility overcomes earth's stability, transforming solid matter into dispersed essence.

---

## Advanced Systems (Potential Extensions)

### Secondary Cascading Reactions

When two elements interact, the resulting product (steam, ash, mud, etc.) becomes a temporary entity that can trigger further reactions. For example:

- **Ash (Fire + Earth) + Water** → Creates a sludge that adheres to other blocks
- **Steam (Fire + Water) + Air** → Amplifies the dispersion effect
- **Dust (Air + Earth) + Fire** → Creates secondary micro-explosions

### Planetary Correspondence Layer (Future)

The seven classical planets correspond to seven metals and colors:

| Planet | Metal | Color | Symbol |
|--------|-------|-------|--------|
| Sun | Gold | Yellow | ☉ |
| Moon | Silver | White | ☽ |
| Mercury | Mercury | Green | ☿ |
| Venus | Copper | Green | ♀ |
| Mars | Iron | Red | ♂ |
| Jupiter | Tin | Blue | ♃ |
| Saturn | Lead | Black | ♄ |

When introduced, these metals would appear as special block types with unique reactions. Gold (Sun) + Fire might produce expansion and purification. Silver (Moon) + Water might produce reflection and doubling.

### Zodiacal Processes (Future)

The twelve zodiac signs correspond to alchemical processes in the Great Work:

- **Aries** — Calcination (burning to ash)
- **Taurus** — Dissolution (breaking down)
- **Gemini** — Separation (splitting elements)
- **Cancer** — Conjunction (combining elements)
- **Leo** — Fermentation (transformation through time)
- **Virgo** — Distillation (purification)
- And so on...

These could trigger temporal effects or multi-stage transformations.

### Paracelsian Principles (Future)

The three principles of matter (Sulfur, Salt, Mercury) could be added as special modifiers:

- **Sulfur** — Adds heat and combustion properties
- **Salt** — Adds binding and stability
- **Mercury** — Adds volatility and transmutation

Blocks might be tagged with principles, adding depth to the reaction system.

## Tome System Design

The Tome serves as both UI and pedagogy:

1. **Automatic Discovery** — Players unlock tome entries by witnessing reactions
2. **Learning Through Play** — Rather than reading instructions, players discover mechanics by engaging with them
3. **Reflection & Mastery** — Opening the Tome between waves allows players to review and internalize what they've learned
4. **Character Building** — The Tome serves as a permanent record of the player's journey and discoveries

### Tome Structure

```
TOME (Player's Spellbook)
├── Principles
│   ├── The Principle of Fire
│   ├── The Principle of Water
│   ├── The Principle of Air
│   └── The Principle of Earth
└── Discovered Reactions
    ├── Reaction: 🔥 + 💧
    ├── Reaction: 🔥 + 🌍
    └── ... (all discovered reactions)
```

New reactions are automatically added to the Tome as the player experiences them.

## Game Balance

### Difficulty Curve

- **Wave 1:** 4 enemies, speed 2.5
- **Wave 2:** 5 enemies, speed 3.0
- **Wave 3:** 6 enemies, speed 3.5
- And so on, +1 enemy per wave, +0.5 speed

### Pacing

- Early waves teach element recognition
- Mid-game waves introduce common reactions
- Late waves create complex reaction chains
- Each death teaches a lesson; no failure is without meaning

### Affinity System

Elemental affinity tracks the player's engagement with each element. Higher affinity could eventually unlock:
- Bonus effects for specific reactions
- Character transformations
- New gameplay mechanics (future versions)

## Art Direction

### Visual Language

- **Color as Signal** — Each element has a distinct color for immediate visual recognition
- **Emoji as Symbol** — Unicode emojis provide universally recognizable glyph for elements
- **Particle Effects** — Reactions create visual feedback: clouds, dust, expansion effects
- **Minimalist UI** — Clean, alchemical aesthetic with teal accents (mercury/wisdom color)

### Color Palette

```
Background: #0a1929 (dark blue-black - void/prima materia)
Accent: #5eead4 (cyan - mercury/wisdom)
Fire: #ff6b6b (red - heat, passion)
Water: #4dabf7 (blue - flow, reflection)
Air: #ffd43b (yellow - light, spirit)
Earth: #8b6f47 (brown - matter, foundation)
```

## Educational Value

This game teaches:

1. **Elemental Correspondences** — What each element represents
2. **Reaction Logic** — How elements interact and transform
3. **Systems Thinking** — How simple rules create complex outcomes
4. **Alchemical Philosophy** — The Great Work as transformation
5. **Observation & Reflection** — Learning through play and review

## Future Directions

### Phase 2: Planets & Metals
- Add 7 planetary metals as special block types
- Introduce 3-element reactions (Fire + Water + Earth, etc.)
- Add planetary color shifts and transformations

### Phase 3: Zodiacal Processes
- Implement time-based processes
- Multi-turn reactions that evolve over waves
- Astrological timing mechanics

### Phase 4: Full Paracelsian System
- 3 Principles (Sulfur, Salt, Mercury) as modifiers
- 4 Elements as blocks
- 7 Planets as special encounters
- 12 Zodiacal processes as meta-game layers

### Phase 5: Campaign & Story
- Narrative wrapper around gameplay
- Progressive unlock system
- Boss encounters with special elemental properties
- Ultimate transmutation event

## Technical Considerations

### Performance
- Particle effects are optimized for 60 FPS
- Enemy count scales but remains playable
- Canvas rendering is cleared and redrawn each frame

### Accessibility
- Keyboard controls are standard (arrows + space)
- Color-blind friendly with emoji redundancy
- Text scaling responds to viewport size

### State Management
- Game state is immutable between frames
- Tome entries are discoverable once and persist
- Affinity values accumulate and never reset

---

*Design Document Version 1.0*  
*Created for Alchemy Block Invaders*  
*A game about learning through transformation*
