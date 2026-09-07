// ===== ALCHEMICAL BLOCK INVADERS =====
// Game logic with 4-element alchemy system

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ===== ELEMENT SYSTEM =====
const ELEMENTS = {
  FIRE: 'fire',
  WATER: 'water',
  AIR: 'air',
  EARTH: 'earth'
};

const ELEMENT_COLORS = {
  fire: '#ff6b6b',
  water: '#4dabf7',
  air: '#ffd43b',
  earth: '#8b6f47'
};

const ELEMENT_EMOJI = {
  fire: '🔥',
  water: '💧',
  air: '🌬️',
  earth: '🌍'
};

// ===== INTERACTION SYSTEM =====
const INTERACTIONS = {
  'fire-water': {
    result: 'steam',
    description: 'Flames meet the deluge. Water extinguishes fire, producing steam that rises and obscures.',
    secondaryEffect: 'mist_cloud'
  },
  'fire-earth': {
    result: 'ash',
    description: 'Fire consumes the earth, leaving ash. Ash is dispersed by wind, becoming dust.',
    secondaryEffect: 'dust'
  },
  'fire-air': {
    result: 'wildfire',
    description: 'Fire ignites the air itself. The element feeds upon itself, growing wild and untamed.',
    secondaryEffect: 'expansion'
  },
  'water-earth': {
    result: 'mud',
    description: 'Water binds with earth, forming mud. The mud settles and hardens.',
    secondaryEffect: 'stasis'
  },
  'water-air': {
    result: 'mist',
    description: 'Water rises into the air as mist, becoming ethereal and dispersed.',
    secondaryEffect: 'mist_cloud'
  },
  'air-earth': {
    result: 'dust',
    description: 'Air scatters the earth, breaking it into fine dust that floats away.',
    secondaryEffect: 'dispersion'
  }
};

// ===== TOME SYSTEM =====
const TOME = {
  discovered: {},
  entries: {
    'fire': {
      title: 'The Principle of Fire',
      description: 'Fire is the active principle of transformation. It consumes and transmutes all it touches, releasing what is bound within matter. When you strike a flame, you awaken its nature.'
    },
    'water': {
      title: 'The Principle of Water',
      description: 'Water is the solvent and the mirror. It moves where fire is rigid, and dissolves where fire burns. Water carries all properties within itself, yet binds to nothing.'
    },
    'air': {
      title: 'The Principle of Air',
      description: 'Air is the medium and the messenger. It rises, disperses, and spreads. Air carries the volatile essences that fire releases and water cannot hold.'
    },
    'earth': {
      title: 'The Principle of Earth',
      description: 'Earth is the vessel and the foundation. It is heavy, stable, and contains. All transformations eventually settle into earth form.'
    }
  }
};

// Initialize tome
Object.keys(ELEMENTS).forEach(key => {
  TOME.discovered[ELEMENTS[key]] = true;
});

// ===== GAME STATE =====
let gameState = {
  score: 0,
  health: 3,
  wave: 1,
  gameOver: false,
  elementalAffinity: {
    fire: 0,
    water: 0,
    air: 0,
    earth: 0
  }
};

// ===== PLAYER =====
const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  width: 40,
  height: 40,
  speed: 6,
  isMovingLeft: false,
  isMovingRight: false,

  draw() {
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.fillStyle = '#0a1929';
    ctx.fillText('▲', this.x - 8, this.y + 8);
  },

  update() {
    if (this.isMovingLeft && this.x > this.width / 2) this.x -= this.speed;
    if (this.isMovingRight && this.x < canvas.width - this.width / 2) this.x += this.speed;
  }
};

// ===== BULLETS =====
let bullets = [];

const bulletSystem = {
  fire(x, y) {
    bullets.push({
      x: x,
      y: y,
      width: 8,
      height: 16,
      speed: 8,
      element: ELEMENTS.FIRE
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
      ctx.fillStyle = ELEMENT_COLORS[bullet.element];
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
    });
  }
};

// ===== ENEMIES =====
let enemies = [];

const enemySystem = {
  spawn() {
    const elements = Object.values(ELEMENTS);
    for (let i = 0; i < 3 + gameState.wave; i++) {
      const element = elements[Math.floor(Math.random() * elements.length)];
      enemies.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -30,
        width: 40,
        height: 40,
        speed: 2 + gameState.wave * 0.5,
        element: element,
        health: 1
      });
    }
  },

  update() {
    enemies.forEach(enemy => {
      enemy.y += enemy.speed;
    });

    // Remove enemies off screen
    enemies = enemies.filter(e => e.y < canvas.height + 50);

    // Check if enemies reached bottom
    enemies.forEach(enemy => {
      if (enemy.y > canvas.height) {
        gameState.health--;
        if (gameState.health <= 0) gameState.gameOver = true;
      }
    });

    // Check for wave clear
    if (enemies.length === 0 && gameState.wave > 0) {
      gameState.wave++;
      gameState.score += 100;
      this.spawn();
    }
  },

  draw() {
    enemies.forEach(enemy => {
      ctx.fillStyle = ELEMENT_COLORS[enemy.element];
      ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
      ctx.fillStyle = '#0a1929';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ELEMENT_EMOJI[enemy.element], enemy.x, enemy.y);
    });
  }
};

// ===== COLLISION & REACTIONS =====
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
  const key = `${bullet.element}-${enemy.element}`;
  const reverseKey = `${enemy.element}-${bullet.element}`;
  const interaction = INTERACTIONS[key] || INTERACTIONS[reverseKey];

  // Add to affinity
  gameState.elementalAffinity[bullet.element]++;
  gameState.elementalAffinity[enemy.element]++;

  // Discover interaction in tome
  if (interaction) {
    const entryKey = `reaction-${key}`;
    if (!TOME.discovered[entryKey]) {
      TOME.discovered[entryKey] = true;
      TOME.entries[entryKey] = {
        title: `Reaction: ${ELEMENT_EMOJI[bullet.element]} + ${ELEMENT_EMOJI[enemy.element]}`,
        description: interaction.description
      };
    }
  }

  gameState.score += 10;
  bullets.splice(bulletIndex, 1);
  enemies.splice(enemyIndex, 1);
}

// ===== HUD UPDATE =====
function updateHUD() {
  document.getElementById('scoreDisplay').textContent = gameState.score;
  document.getElementById('healthDisplay').textContent = gameState.health;
  document.getElementById('waveDisplay').textContent = gameState.wave;

  // Update element indicators
  const indicators = document.querySelectorAll('.element-indicator');
  const elements = ['fire', 'water', 'air', 'earth'];
  indicators.forEach((ind, idx) => {
    const elem = elements[idx];
    if (gameState.elementalAffinity[elem] > 0) {
      ind.classList.add('active');
    }
  });
}

// ===== TOME SYSTEM =====
const tomeButton = document.getElementById('tomeButton');
const tomeModal = document.getElementById('tomeModal');
const tomeClose = document.getElementById('tomeClose');

tomeButton.addEventListener('click', () => {
  tomeModal.classList.add('active');
  renderTomeEntries();
});

tomeClose.addEventListener('click', () => {
  tomeModal.classList.remove('active');
});

tomeModal.addEventListener('click', (e) => {
  if (e.target === tomeModal) tomeModal.classList.remove('active');
});

function renderTomeEntries() {
  const container = document.getElementById('tomeEntries');
  container.innerHTML = '';

  // Principles section
  const principlesDiv = document.createElement('div');
  principlesDiv.className = 'tome-section';
  principlesDiv.innerHTML = '<div class="tome-section-title">Principles</div>';

  Object.values(ELEMENTS).forEach(element => {
    const entry = TOME.entries[element];
    if (entry) {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'tome-entry';
      entryDiv.innerHTML = `
        <div class="tome-entry-title">${ELEMENT_EMOJI[element]} ${entry.title}</div>
        <p class="tome-entry-desc">${entry.description}</p>
      `;
      principlesDiv.appendChild(entryDiv);
    }
  });
  container.appendChild(principlesDiv);

  // Reactions section
  const reactionsDiv = document.createElement('div');
  reactionsDiv.className = 'tome-section';
  reactionsDiv.innerHTML = '<div class="tome-section-title">Discovered Reactions</div>';

  Object.keys(TOME.discovered).forEach(key => {
    if (key.startsWith('reaction-')) {
      const entry = TOME.entries[key];
      if (entry) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'tome-entry';
        entryDiv.innerHTML = `
          <div class="tome-entry-title">${entry.title}</div>
          <p class="tome-entry-desc">${entry.description}</p>
        `;
        reactionsDiv.appendChild(entryDiv);
      }
    }
  });
  container.appendChild(reactionsDiv);
}

// ===== KEYBOARD CONTROLS =====
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

// ===== GAME LOOP =====
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = 'rgba(20, 30, 50, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!gameState.gameOver) {
    player.update();
    bulletSystem.update();
    enemySystem.update();
    checkCollisions();

    player.draw();
    bulletSystem.draw();
    enemySystem.draw();

    updateHUD();
  } else {
    document.getElementById('gameOver').classList.add('active');
    document.getElementById('finalScore').textContent = gameState.score;
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Initialize and start
enemySystem.spawn();
gameLoop();
