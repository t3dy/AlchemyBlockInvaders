// ===== ALCHEMY BLOCK INVADERS v2 =====
// Complete alchemical correspondence system with shields, glyphs, and cascading reactions

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== INITIALIZATION =====
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ===== GAME STATE MACHINE =====
let gamePhase = 'preGame'; // preGame, playing, gameOver

// ===== ALCHEMICAL SYSTEM DEFINITION =====
const ALCHEMY = {
  elements: {
    fire: { emoji: '🔥', color: '#ff6b6b', name: 'Fire' },
    water: { emoji: '💧', color: '#4dabf7', name: 'Water' },
    air: { emoji: '🌬️', color: '#ffd43b', name: 'Air' },
    earth: { emoji: '🌍', color: '#8b6f47', name: 'Earth' }
  },
  planets: {
    sun: { emoji: '☉', color: '#ffd700', name: 'Sun', metal: 'Gold' },
    moon: { emoji: '☽', color: '#c0c0c0', name: 'Moon', metal: 'Silver' },
    mercury: { emoji: '☿', color: '#00ff00', name: 'Mercury', metal: 'Mercury' },
    venus: { emoji: '♀', color: '#00cc00', name: 'Venus', metal: 'Copper' },
    mars: { emoji: '♂', color: '#cc0000', name: 'Mars', metal: 'Iron' },
    jupiter: { emoji: '♃', color: '#3333ff', name: 'Jupiter', metal: 'Tin' },
    saturn: { emoji: '♄', color: '#333333', name: 'Saturn', metal: 'Lead' }
  },
  zodiac: [
    { symbol: '♈', name: 'Aries', process: 'Calcination', number: 1 },
    { symbol: '♉', name: 'Taurus', process: 'Dissolution', number: 2 },
    { symbol: '♊', name: 'Gemini', process: 'Separation', number: 3 },
    { symbol: '♋', name: 'Cancer', process: 'Conjunction', number: 4 },
    { symbol: '♌', name: 'Leo', process: 'Fermentation', number: 5 },
    { symbol: '♍', name: 'Virgo', process: 'Distillation', number: 6 },
    { symbol: '♎', name: 'Libra', process: 'Coagulation', number: 7 },
    { symbol: '♏', name: 'Scorpio', process: 'Putrefaction', number: 8 },
    { symbol: '♐', name: 'Sagittarius', process: 'Fermentation Cont', number: 9 },
    { symbol: '♑', name: 'Capricorn', process: 'Fixation', number: 10 },
    { symbol: '♒', name: 'Aquarius', process: 'Multiplication', number: 11 },
    { symbol: '♓', name: 'Pisces', process: 'Dissolution Final', number: 12 }
  ],
  principles: {
    sulfur: { name: 'Sulfur', nature: 'Hot, Dry', symbol: '♁' },
    salt: { name: 'Salt', nature: 'Cold, Wet', symbol: '⚛' },
    mercury: { name: 'Mercury', nature: 'Neutral', symbol: '☿' }
  }
};

// ===== GAME STATE =====
let gameState = {
  selectedGlyph: null,
  xp: 0,
  initiationLevel: 0,
  wave: 0,
  currentZodiac: 0,
  health: 3,
  gameOver: false,
  score: 0,
  discoveredReactions: {},
  affinities: {
    fire: 0, water: 0, air: 0, earth: 0,
    sun: 0, moon: 0, mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0
  }
};

const INITIATION_LEVELS = [
  { name: 'Apprentice Initiate', xpRequired: 0 },
  { name: 'Journeyman Initiate', xpRequired: 100 },
  { name: 'Adept of the Planets', xpRequired: 350 },
  { name: 'Master of the Zodiac', xpRequired: 750 },
  { name: 'Magus of the Great Work', xpRequired: 1500 }
];

// ===== PRE-GAME GLYPH SELECTION =====
const glyphButtons = document.querySelectorAll('.glyph-button');
const startButton = document.getElementById('startButton');

glyphButtons.forEach(button => {
  button.addEventListener('click', () => {
    glyphButtons.forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    gameState.selectedGlyph = button.dataset.glyph;
    startButton.disabled = false;
  });
});

startButton.addEventListener('click', () => {
  if (gameState.selectedGlyph) {
    startGame();
  }
});

function startGame() {
  gamePhase = 'playing';
  document.getElementById('preGameScreen').classList.remove('active');
  document.getElementById('gameContainer').classList.add('active');
  gameState.wave = 1;
  gameState.currentZodiac = 0;
  enemySystem.spawn();
  gameLoop();
}

// ===== PLAYER SYSTEM =====
const player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  width: 80,
  height: 40,
  speed: 6,
  shields: [
    { x: -50, hp: 1, maxHp: 1 },
    { x: 0, hp: 1, maxHp: 1 },
    { x: 50, hp: 1, maxHp: 1 }
  ],
  isMovingLeft: false,
  isMovingRight: false,
  touchX: null,

  draw() {
    // Draw shields
    this.shields.forEach((shield, idx) => {
      const shieldX = this.x + shield.x;
      const shieldY = this.y - 20;

      ctx.fillStyle = shield.hp > 0 ? '#5eead4' : 'rgba(94, 234, 212, 0.2)';
      ctx.fillRect(shieldX - 15, shieldY - 12, 30, 24);

      if (shield.hp > 0) {
        ctx.fillStyle = '#0a1929';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const glyphEmoji = getGlyphEmoji(gameState.selectedGlyph);
        ctx.fillText(glyphEmoji, shieldX, shieldY);
      }
    });

    // Draw player vessel
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.fillStyle = '#0a1929';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▲', this.x, this.y + 20);
  },

  update() {
    if (this.isMovingLeft && this.x > this.width / 2) this.x -= this.speed;
    if (this.isMovingRight && this.x < canvas.width - this.width / 2) this.x += this.speed;

    // Touch support
    if (this.touchX !== null) {
      const diff = this.touchX - this.x;
      if (Math.abs(diff) > 5) {
        this.x += Math.sign(diff) * this.speed;
      }
    }
  }
};

function getGlyphEmoji(glyph) {
  if (ALCHEMY.elements[glyph]) return ALCHEMY.elements[glyph].emoji;
  if (ALCHEMY.planets[glyph]) return ALCHEMY.planets[glyph].emoji;
  return '✦';
}

// ===== BULLET SYSTEM =====
let bullets = [];

const bulletSystem = {
  fire(x, y) {
    bullets.push({
      x: x,
      y: y,
      width: 8,
      height: 16,
      speed: 8,
      element: 'fire'
    });
  },

  update() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed;
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }
  },

  draw() {
    bullets.forEach(bullet => {
      ctx.fillStyle = ALCHEMY.elements.fire.color;
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
    });
  }
};

// ===== ENEMY SYSTEM =====
let enemies = [];

const enemySystem = {
  spawn() {
    const blockTypes = [...Object.keys(ALCHEMY.elements), ...Object.keys(ALCHEMY.planets)];
    const count = 4 + gameState.wave;

    for (let i = 0; i < count; i++) {
      const type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      const isElement = ALCHEMY.elements[type];

      enemies.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -30,
        width: 40,
        height: 40,
        speed: 2 + gameState.wave * 0.5,
        type: type,
        isElement: !!isElement,
        health: 1
      });
    }
  },

  update() {
    enemies.forEach(enemy => {
      enemy.y += enemy.speed;
    });

    // Check collision with shields
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (enemy.y + enemy.height / 2 > player.y - 20) {
        player.shields.forEach(shield => {
          if (Math.abs(enemy.x - (player.x + shield.x)) < 30 && shield.hp > 0) {
            shield.hp--;
            enemies.splice(i, 1);
          }
        });
      }
    }

    // Remove off-screen
    enemies = enemies.filter(e => e.y < canvas.height + 50);

    // Check if enemies reached bottom (hurt shield integrity)
    enemies.forEach(enemy => {
      if (enemy.y > canvas.height && gameState.health > 0) {
        gameState.health--;
        if (gameState.health <= 0) gameState.gameOver = true;
      }
    });

    // Wave clear
    if (enemies.length === 0 && gameState.wave > 0) {
      gameState.wave++;
      gameState.currentZodiac = (gameState.wave - 1) % 12;
      gameState.score += 100;
      this.spawn();
    }
  },

  draw() {
    enemies.forEach(enemy => {
      const isElement = ALCHEMY.elements[enemy.type];
      const color = isElement ? ALCHEMY.elements[enemy.type].color : ALCHEMY.planets[enemy.type].color;
      const emoji = isElement ? ALCHEMY.elements[enemy.type].emoji : ALCHEMY.planets[enemy.type].emoji;

      ctx.fillStyle = color;
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

      ctx.fillStyle = '#0a1929';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, enemy.x, enemy.y);
    });
  }
};

// ===== COLLISION & REACTION SYSTEM =====
const REACTION_XP = {
  firstDiscovery: 10,
  repeat: 1,
  cascadeBonus: 20,
  glyphMatchBonus: 1.5
};

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];

      if (
        bullet.x > enemy.x - enemy.width / 2 &&
        bullet.x < enemy.x + enemy.width / 2 &&
        bullet.y > enemy.y - enemy.height / 2 &&
        bullet.y < enemy.y + enemy.height / 2
      ) {
        handleReaction(bullet, enemy, i, j);
        return;
      }
    }
  }
}

function handleReaction(bullet, enemy, bulletIndex, enemyIndex) {
  const reactionKey = `${bullet.element}-${enemy.type}`;
  const isNewReaction = !gameState.discoveredReactions[reactionKey];

  // Award XP
  let xpGain = isNewReaction ? REACTION_XP.firstDiscovery : REACTION_XP.repeat;

  // Add glyph match bonus
  if (gameState.selectedGlyph === enemy.type || gameState.selectedGlyph === bullet.element) {
    xpGain *= REACTION_XP.glyphMatchBonus;
  }

  // Add zodiac bonus
  const zodiacBonusMap = [1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 3];
  xpGain += zodiacBonusMap[gameState.currentZodiac] || 0;

  gameState.xp += Math.floor(xpGain);
  updateInitiationLevel();

  // Update affinities
  gameState.affinities[bullet.element]++;
  gameState.affinities[enemy.type]++;

  // Mark as discovered
  gameState.discoveredReactions[reactionKey] = true;

  gameState.score += 10;
  bullets.splice(bulletIndex, 1);
  enemies.splice(enemyIndex, 1);
}

function updateInitiationLevel() {
  for (let i = INITIATION_LEVELS.length - 1; i >= 0; i--) {
    if (gameState.xp >= INITIATION_LEVELS[i].xpRequired) {
      gameState.initiationLevel = i;
      break;
    }
  }
}

// ===== HUD UPDATES =====
function updateHUD() {
  const zodiacInfo = ALCHEMY.zodiac[gameState.currentZodiac];
  document.getElementById('xpDisplay').textContent = `${gameState.xp} / ${INITIATION_LEVELS[gameState.initiationLevel]?.name || 'Magus'}`;
  document.getElementById('waveDisplay').textContent = gameState.wave;
  document.getElementById('healthDisplay').textContent = gameState.health;
  document.getElementById('zodiacName').textContent = `${zodiacInfo.symbol} ${zodiacInfo.name}`;
  document.getElementById('zodiacPhase').textContent = zodiacInfo.process;
}

// ===== CHARACTER SHEET =====
const characterButton = document.getElementById('characterButton');
const characterModal = document.getElementById('characterModal');
const characterClose = document.getElementById('characterClose');

characterButton.addEventListener('click', () => {
  characterModal.classList.add('active');
  renderCharacterSheet();
});

characterClose.addEventListener('click', () => {
  characterModal.classList.remove('active');
});

characterModal.addEventListener('click', (e) => {
  if (e.target === characterModal) characterModal.classList.remove('active');
});

function renderCharacterSheet() {
  const container = document.getElementById('characterStats');
  const zodiacInfo = ALCHEMY.zodiac[gameState.currentZodiac];
  const currentLevel = INITIATION_LEVELS[gameState.initiationLevel];
  const nextLevel = INITIATION_LEVELS[gameState.initiationLevel + 1];

  let html = `
    <div class="character-stat-group">
      <div class="character-stat-label">Initiation Level</div>
      <div class="character-stat-value">${currentLevel.name}</div>
    </div>

    <div class="character-stat-group">
      <div class="character-stat-label">Experience Progress</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${nextLevel ? ((gameState.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100 : 100}%"></div>
      </div>
      <div class="character-stat-value">${gameState.xp} XP</div>
    </div>

    <div class="character-stat-group">
      <div class="character-stat-label">Current Phase</div>
      <div class="character-stat-value">${zodiacInfo.symbol} ${zodiacInfo.name}</div>
      <div style="font-size: 12px; color: #94a3b8;">${zodiacInfo.process}</div>
    </div>

    <div class="character-stat-group">
      <div class="character-stat-label">Elemental Affinities</div>
      <div class="affinity-list">
        ${Object.entries(gameState.affinities).slice(0, 4).map(([elem, val]) => {
          const data = ALCHEMY.elements[elem];
          return `<div class="affinity-item">${data.emoji} ${data.name}: ${val}</div>`;
        }).join('')}
        ${Object.entries(gameState.affinities).slice(4).map(([planet, val]) => {
          const data = ALCHEMY.planets[planet];
          return `<div class="affinity-item">${data.emoji} ${data.name}: ${val}</div>`;
        }).join('')}
      </div>
    </div>

    <div class="character-stat-group">
      <div class="character-stat-label">Reactions Discovered</div>
      <div class="character-stat-value">${Object.keys(gameState.discoveredReactions).length} / 78+</div>
    </div>
  `;

  container.innerHTML = html;
}

// ===== KEYBOARD & TOUCH CONTROLS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') player.isMovingLeft = true;
  if (e.key === 'ArrowRight') player.isMovingRight = true;
  if (e.key === ' ') {
    e.preventDefault();
    bulletSystem.fire(player.x, player.y);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') player.isMovingLeft = false;
  if (e.key === 'ArrowRight') player.isMovingRight = false;
});

// Touch controls for mobile
document.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  player.touchX = touch.clientX;
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => {
  player.touchX = null;
});

// Tap to fire (mobile)
canvas.addEventListener('click', (e) => {
  if (gamePhase === 'playing') {
    bulletSystem.fire(player.x, player.y);
  }
});

// ===== GAME LOOP =====
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = 'rgba(20, 30, 50, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gamePhase === 'playing' && !gameState.gameOver) {
    player.update();
    bulletSystem.update();
    enemySystem.update();
    checkCollisions();

    player.draw();
    bulletSystem.draw();
    enemySystem.draw();

    updateHUD();
    requestAnimationFrame(gameLoop);
  } else if (gameState.gameOver) {
    gamePhase = 'gameOver';
    document.getElementById('gameOver').classList.add('active');
    document.getElementById('finalScore').textContent = gameState.score;
  }
}

// Start with pre-game
console.log('Game initialized. Select a glyph to begin.');
