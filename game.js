console.log("PUTTU LUDO: game.js loaded. Version 19");
// Puttu Ludo Classic Game Engine

// 1. Grid coordinates of the 52 perimeter track cells
const TRACK_COORDS = [
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // Left arm top row
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // Top arm left col
  { r: 0, c: 7 },                                                                                // Top center
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // Top arm right col
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // Right arm top row
  { r: 7, c: 14 },                                                                              // Right center
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // Right arm bottom row
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // Bottom arm right col
  { r: 14, c: 7 },                                                                              // Bottom center
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // Bottom arm left col
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // Left arm bottom row
  { r: 7, c: 0 }                                                                                // Left center
];

// 2. Home runway path coordinates (5 cells each color)
const HOME_PATHS = {
  red: [
    { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }
  ],
  green: [
    { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }
  ],
  blue: [
    { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }
  ],
  yellow: [
    { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }
  ]
};

// 3. Base yard coordinates (4 slots each base for token initial placement)
const BASE_SLOTS = {
  red: [
    { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }
  ],
  green: [
    { r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }
  ],
  blue: [
    { r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }
  ],
  yellow: [
    { r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }
  ]
};

// Safe cell indices on the TRACK_COORDS array
const SAFE_CELL_INDICES = [1, 9, 14, 22, 27, 35, 40, 48];

// Standard Ludo Player Configurations (Mutable state loaded from Lobby)
const PLAYER_CONFIGS = {
  red: { startIdx: 1, entranceIdx: 51, color: 'red', name: 'Red Player', status: 'active', isAI: false },
  green: { startIdx: 14, entranceIdx: 12, color: 'green', name: 'Green Player', status: 'active', isAI: false },
  blue: { startIdx: 27, entranceIdx: 25, color: 'blue', name: 'Blue Player', status: 'active', isAI: true },
  yellow: { startIdx: 40, entranceIdx: 38, color: 'yellow', name: 'Yellow Player', status: 'active', isAI: true }
};

// Game State Object
const Game = {
  players: ['red', 'green', 'blue', 'yellow'],
  playersConfig: PLAYER_CONFIGS,
  currentPlayerIdx: 0,
  diceValue: 0,
  hasRolled: false,
  isMoving: false,
  extraTurn: false,
  consecutiveSixes: 0,
  isGameOver: false,
  isMatchStarted: false,
  
  // Tokens state array (steps: 0 is Base, 1-51 is main track, 52-56 is Home Path, 57 is Home)
  tokens: {
    red: [{ id: 0, steps: 0 }, { id: 1, steps: 0 }, { id: 2, steps: 0 }, { id: 3, steps: 0 }],
    green: [{ id: 0, steps: 0 }, { id: 1, steps: 0 }, { id: 2, steps: 0 }, { id: 3, steps: 0 }],
    blue: [{ id: 0, steps: 0 }, { id: 1, steps: 0 }, { id: 2, steps: 0 }, { id: 3, steps: 0 }],
    yellow: [{ id: 0, steps: 0 }, { id: 1, steps: 0 }, { id: 2, steps: 0 }, { id: 3, steps: 0 }]
  },

  currentPlayer() {
    return this.players[this.currentPlayerIdx];
  },

  isTokenMovable(color, tokenId) {
    if (this.isGameOver || !this.isMatchStarted) return false;
    const token = this.tokens[color].find(t => t.id === tokenId);
    if (!token) return false;
    
    // Finished tokens cannot move
    if (token.steps === 57) return false;
    
    // In base: needs a 6 to move out
    if (token.steps === 0) {
      return this.diceValue === 6;
    }
    
    const targetSteps = token.steps + this.diceValue;
    
    // Exact count required to enter Home (no overshoot allowed)
    if (targetSteps > 57) return false;
    
    // Blocking rule: cannot land on a cell held by 2+ opponent tokens (a "block")
    if (targetSteps >= 1 && targetSteps <= 51) {
      const config = PLAYER_CONFIGS[color];
      const mainTrackIdx = (config.startIdx + targetSteps - 1) % 52;
      if (isCellBlocked(color, mainTrackIdx)) return false;
    }
    
    return true;
  }
};

// Returns true if 2+ tokens belonging to ONE opposing color occupy the given
// main-track cell index, forming an impassable block per classic Ludo rules.
function isCellBlocked(color, mainTrackIdx) {
  for (let oppColor in Game.tokens) {
    if (oppColor === color || PLAYER_CONFIGS[oppColor].status === 'inactive') continue;
    const oppConfig = PLAYER_CONFIGS[oppColor];
    let count = 0;
    Game.tokens[oppColor].forEach(t => {
      if (t.steps >= 1 && t.steps <= 51) {
        const idx = (oppConfig.startIdx + t.steps - 1) % 52;
        if (idx === mainTrackIdx) count++;
      }
    });
    if (count >= 2) return true;
  }
  return false;
}

// Log Message to Terminal and show Toast notification
function logMessage(text, typeClass = 'system') {
  console.log(`[PUTTU LUDO] ${text}`);
  
  // Show toast ONLY for major/notable gameplay events
  const isMajorEvent = text.startsWith('💥') || 
                       text.startsWith('🎉') || 
                       text.startsWith('🏆') || 
                       text.startsWith('🎲 Extra') ||
                       text.includes('Wins!') ||
                       text.includes('Victory');
                       
  if (!isMajorEvent) return;
  
  // Dynamic floating toast notification
  const toast = document.createElement('div');
  toast.className = 'ludo-toast';
  
  let bgValue = '#1e293b';
  let glowValue = 'rgba(255,255,255,0.1)';
  if (typeClass === 'red') { bgValue = 'rgba(239, 83, 80, 0.95)'; glowValue = 'var(--red-glow)'; }
  else if (typeClass === 'green') { bgValue = 'rgba(76, 175, 80, 0.95)'; glowValue = 'var(--green-glow)'; }
  else if (typeClass === 'blue') { bgValue = 'rgba(33, 150, 243, 0.95)'; glowValue = 'var(--blue-glow)'; }
  else if (typeClass === 'yellow') { bgValue = 'rgba(251, 192, 45, 0.95)'; glowValue = 'var(--yellow-glow)'; }
  
  toast.style.background = bgValue;
  toast.style.borderColor = (typeClass !== 'system' && typeClass !== 'error') ? `var(--${typeClass})` : 'rgba(255, 255, 255, 0.1)';
  toast.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px ${glowValue}`;
  toast.textContent = text;
  
  document.querySelectorAll('.ludo-toast').forEach(el => el.remove());
  document.body.appendChild(toast);
  
  toast.offsetHeight;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Coordinate Mapper
function getCoordForToken(color, steps, tokenId) {
  if (steps === 0) {
    return BASE_SLOTS[color][tokenId];
  }
  if (steps >= 1 && steps <= 51) {
    const config = PLAYER_CONFIGS[color];
    const idx = (config.startIdx + steps - 1) % 52;
    return TRACK_COORDS[idx];
  }
  if (steps >= 52 && steps <= 56) {
    const pathIdx = steps - 52;
    return HOME_PATHS[color][pathIdx];
  }
  if (steps === 57) {
    const centers = { red: { r: 7, c: 6 }, green: { r: 6, c: 7 }, blue: { r: 7, c: 8 }, yellow: { r: 8, c: 7 } };
    return centers[color];
  }
}

// Render SVG Board Layout
function initBoard() {
  const svg = document.getElementById('ludo-svg');
  if (!svg) return;
  svg.innerHTML = '';
  
  // 1. Draw Grid Cells
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const inRedBase = (r < 6 && c < 6);
      const inGreenBase = (r < 6 && c >= 9);
      const inYellowBase = (r >= 9 && c < 6);
      const inBlueBase = (r >= 9 && c >= 9);
      const inHomeCenter = (r >= 6 && r <= 8 && c >= 6 && c <= 8);
      
      if (!inRedBase && !inGreenBase && !inYellowBase && !inBlueBase && !inHomeCenter) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', c * 40);
        rect.setAttribute('y', r * 40);
        rect.setAttribute('width', 40);
        rect.setAttribute('height', 40);
        rect.setAttribute('class', 'cell-bg');
        svg.appendChild(rect);
      }
    }
  }

  // 2. Draw Home Runway Paths
  for (let color in HOME_PATHS) {
    HOME_PATHS[color].forEach(coord => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', coord.c * 40);
      rect.setAttribute('y', coord.r * 40);
      rect.setAttribute('width', 40);
      rect.setAttribute('height', 40);
      rect.setAttribute('class', `path-${color}`);
      svg.appendChild(rect);
    });
  }

  // 3. Draw Starting Tiles
  const starts = { red: { r: 6, c: 1 }, green: { r: 1, c: 8 }, blue: { r: 8, c: 13 }, yellow: { r: 13, c: 6 } };
  for (let color in starts) {
    const coord = starts[color];
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', coord.c * 40);
    rect.setAttribute('y', coord.r * 40);
    rect.setAttribute('width', 40);
    rect.setAttribute('height', 40);
    rect.setAttribute('class', `path-${color} neon-path neon-path-${color}`);
    svg.appendChild(rect);
  }

  // 4. Draw Safe Zone Stars
  const stars = [{ r: 2, c: 6 }, { r: 6, c: 12 }, { r: 12, c: 8 }, { r: 8, c: 2 }];
  stars.forEach(coord => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', coord.c * 40);
    rect.setAttribute('y', coord.r * 40);
    rect.setAttribute('width', 40);
    rect.setAttribute('height', 40);
    rect.setAttribute('class', 'star-cell');
    svg.appendChild(rect);
    
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cx = coord.c * 40 + 20;
    const cy = coord.r * 40 + 20;
    const d = `M ${cx} ${cy - 12} L ${cx + 3.5} ${cy - 3.5} L ${cx + 12} ${cy - 3.5} L ${cx + 5} ${cy + 1.5} L ${cx + 8} ${cy + 10} L ${cx} ${cy + 5} L ${cx - 8} ${cy + 10} L ${cx - 5} ${cy + 1.5} L ${cx - 12} ${cy - 3.5} L ${cx - 3.5} ${cy - 3.5} Z`;
    star.setAttribute('d', d);
    star.setAttribute('class', 'cell-star');
    svg.appendChild(star);
  });

  // 5. Draw Home Center Triangles
  const centerTriangles = [
    { class: 'home-triangle-red', points: '240,240 300,300 240,360' },
    { class: 'home-triangle-green', points: '240,240 300,300 360,240' },
    { class: 'home-triangle-blue', points: '360,240 300,300 360,360' },
    { class: 'home-triangle-yellow', points: '240,360 300,300 360,360' }
  ];
  centerTriangles.forEach(tri => {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', tri.points);
    polygon.setAttribute('class', tri.class);
    svg.appendChild(polygon);
  });

  // 6. Draw Solid Base Yards (No developer texts)
  const bases = [
    { color: 'red', name: 'RED', x: 10, y: 10, w: 220, h: 220 },
    { color: 'green', name: 'GREEN', x: 370, y: 10, w: 220, h: 220 },
    { color: 'blue', name: 'BLUE', x: 370, y: 370, w: 220, h: 220 },
    { color: 'yellow', name: 'YELLOW', x: 10, y: 370, w: 220, h: 220 }
  ];
  
  bases.forEach(b => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `base-group-${b.color}`);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', b.x);
    rect.setAttribute('y', b.y);
    rect.setAttribute('width', b.w);
    rect.setAttribute('height', b.h);
    rect.setAttribute('class', `base-rect base-rect-${b.color}`);
    rect.setAttribute('style', `color: var(--${b.color});`);
    group.appendChild(rect);
    
    const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text1.setAttribute('x', b.x + b.w / 2);
    text1.setAttribute('y', b.y + b.h / 2 + 6);
    text1.setAttribute('text-anchor', 'middle');
    text1.setAttribute('class', `base-label label-${b.color}`);
    text1.textContent = b.name;
    group.appendChild(text1);
    
    // Draw 4 slots for yard tokens inside the base
    const slots = BASE_SLOTS[b.color];
    slots.forEach(slot => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', slot.c * 40 + 20);
      circle.setAttribute('cy', slot.r * 40 + 20);
      circle.setAttribute('r', 14);
      circle.setAttribute('fill', 'rgba(0,0,0,0.4)');
      circle.setAttribute('stroke', `rgba(255,255,255,0.05)`);
      circle.setAttribute('stroke-width', '1px');
      group.appendChild(circle);
    });

    svg.appendChild(group);
  });

  // Tokens Group
  const tokensGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  tokensGroup.setAttribute('id', 'tokens-group');
  svg.appendChild(tokensGroup);
}

// Redraw / Render Tokens in real time
function drawTokens() {
  const container = document.getElementById('tokens-group');
  if (!container) return;
  container.innerHTML = '';
  
  const cellStacks = {};
  
  // Group active tokens by cell coordinate to calculate stack offsets
  for (let color in Game.tokens) {
    if (PLAYER_CONFIGS[color].status === 'inactive') continue; // Skip inactive colors
    
    Game.tokens[color].forEach(t => {
      const coord = getCoordForToken(color, t.steps, t.id);
      const key = `${coord.r}_${coord.c}`;
      if (!cellStacks[key]) {
        cellStacks[key] = [];
      }
      cellStacks[key].push({ color, token: t });
    });
  }
  
  // Render tokens
  for (let key in cellStacks) {
    const stack = cellStacks[key];
    const [rStr, cStr] = key.split('_');
    const r = parseInt(rStr);
    const c = parseInt(cStr);
    const cx = c * 40 + 20;
    const cy = r * 40 + 20;
    
    // Detect a same-color block (2+ tokens of one color on the open track)
    // and draw a dashed ring to make the blocking rule visible on the board.
    const colorCounts = {};
    stack.forEach(item => {
      if (item.token.steps >= 1 && item.token.steps <= 51) {
        colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
      }
    });
    const blockColor = Object.keys(colorCounts).find(cKey => colorCounts[cKey] >= 2);
    if (blockColor) {
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', 19);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', `var(--${blockColor})`);
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('stroke-dasharray', '4 3');
      ring.setAttribute('opacity', '0.85');
      ring.setAttribute('class', 'block-ring');
      container.appendChild(ring);
    }
    
    stack.forEach((item, index) => {
      const color = item.color;
      const t = item.token;
      
      let ox = 0;
      let oy = 0;
      
      if (t.steps > 0 && t.steps < 57 && stack.length > 1) {
        const total = stack.length;
        const radius = 9;
        const angle = (index / total) * 2 * Math.PI;
        ox = Math.cos(angle) * radius;
        oy = Math.sin(angle) * radius;
      } else if (t.steps === 57 && stack.length > 1) {
        const total = stack.length;
        const radius = 10;
        const angle = (index / total) * 2 * Math.PI;
        ox = Math.cos(angle) * radius;
        oy = Math.sin(angle) * radius;
      }
      
      createTokenElement(container, color, t.id, cx + ox, cy + oy);
    });
  }
}

// Create SVG token element
function createTokenElement(container, color, id, cx, cy) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', `token token-${color}`);
  g.setAttribute('data-color', color);
  g.setAttribute('data-id', id);
  g.setAttribute('data-token-key', `${color}-${id}`);
  g.style.transformBox = 'fill-box';
  g.style.transformOrigin = 'center';
  
  const isMovable = Game.isTokenMovable(color, id);
  if (isMovable && !Game.playersConfig[color].isAI && Game.currentPlayer() === color && Game.hasRolled && !Game.isMoving) {
    g.classList.add('active');
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => Game.moveToken(color, id));
  } else {
    g.style.pointerEvents = 'none';
  }
  
  // Outer glowing circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', 11);
  circle.setAttribute('class', `token-circle`);
  circle.setAttribute('fill', `var(--${color})`);
  g.appendChild(circle);
  
  // Inner ring
  const inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  inner.setAttribute('cx', cx);
  inner.setAttribute('cy', cy);
  inner.setAttribute('r', 5);
  inner.setAttribute('class', `token-inner`);
  g.appendChild(inner);
  
  container.appendChild(g);
}

// One-time injection of keyframe animations used by the helpers below.
// Added dynamically since no external stylesheet was provided alongside
// game.js -- this keeps every visual effect fully self-contained here.
(function injectLudoAnimationStyles() {
  if (document.getElementById('ludo-anim-styles')) return;
  const style = document.createElement('style');
  style.id = 'ludo-anim-styles';
  style.textContent = `
    @keyframes ludoTokenBounce {
      0%   { transform: scale(1) translateY(0); }
      35%  { transform: scale(1.25, 0.8) translateY(2px); }
      65%  { transform: scale(0.9, 1.15) translateY(-6px); }
      100% { transform: scale(1) translateY(0); }
    }
    @keyframes ludoCaptureShake {
      0%   { transform: scale(1) rotate(0deg); opacity: 1; }
      20%  { transform: scale(1.3) rotate(-10deg); opacity: 1; }
      40%  { transform: scale(1.3) rotate(10deg); opacity: 1; }
      60%  { transform: scale(1.3) rotate(-8deg); opacity: 0.9; }
      100% { transform: scale(0.15) rotate(0deg); opacity: 0; }
    }
    @keyframes ludoHomeCelebrate {
      0%   { transform: scale(1); filter: brightness(1); }
      30%  { transform: scale(1.6); filter: brightness(1.8); }
      60%  { transform: scale(0.85); filter: brightness(1.4); }
      100% { transform: scale(1); filter: brightness(1); }
    }
    .token.anim-bounce { animation: ludoTokenBounce 0.18s ease-out; }
    .token.anim-capture { animation: ludoCaptureShake 0.5s ease-in forwards; }
    .token.anim-home { animation: ludoHomeCelebrate 0.7s ease-in-out; }
  `;
  document.head.appendChild(style);
})();

// Small squash-and-stretch pulse each time a token advances one cell
function bounceToken(color, tokenId) {
  const el = document.querySelector(`.token[data-token-key="${color}-${tokenId}"]`);
  if (!el) return;
  el.classList.remove('anim-bounce');
  void el.offsetWidth; // restart animation
  el.classList.add('anim-bounce');
}

// Shake-and-shrink flight animation for captured tokens before they
// snap back to base; calls onComplete once the effect has finished.
function playCaptureAnimation(capturedTokens, onComplete) {
  let pending = capturedTokens.length;
  if (pending === 0) {
    onComplete();
    return;
  }
  capturedTokens.forEach(ct => {
    const el = document.querySelector(`.token[data-token-key="${ct.color}-${ct.id}"]`);
    if (el) {
      el.classList.add('anim-capture');
    }
  });
  setTimeout(() => {
    pending = 0;
    onComplete();
  }, 500);
}

// Glow/scale pulse when a token reaches Home
function celebrateHomeToken(color, tokenId) {
  const el = document.querySelector(`.token[data-token-key="${color}-${tokenId}"]`);
  if (!el) return;
  el.classList.add('anim-home');
  setTimeout(() => el.classList.remove('anim-home'), 700);
}

// 3D Dice Roll Logic
function rollDice(callback) {
  if (Game.isMoving || Game.isGameOver || !Game.isMatchStarted) return;
  AudioSynth.playDiceRattle();
  
  const cube = document.getElementById('dice-cube');
  
  // Set fast, realistic spin transition duration
  cube.style.transition = 'transform 1.0s cubic-bezier(0.2, 0.85, 0.25, 1.1)';
  
  // Fair, uniform 1-6 roll -- identical code path for every player, human or AI.
  const roll = Math.floor(Math.random() * 6) + 1;
  Game.diceValue = roll;
  Game.hasRolled = true;
  
  // Track consecutive sixes here, at the single point where every roll (human
  // or AI) is generated, so the rule applies identically to all players.
  if (roll === 6) {
    Game.consecutiveSixes++;
  } else {
    Game.consecutiveSixes = 0;
  }
  const forfeited = Game.consecutiveSixes >= 3;
  
  // Determine target angles for the faces
  let rx = 0, ry = 0;
  switch (roll) {
    case 1: rx = 0; ry = 0; break;
    case 6: rx = 0; ry = 180; break;
    case 2: rx = 0; ry = -90; break;
    case 5: rx = 0; ry = 90; break;
    case 3: rx = -90; ry = 0; break;
    case 4: rx = 90; ry = 0; break;
  }
  
  // Generate a random number of complete spins (e.g. 3 to 5 full spins)
  const spinsX = 3 + Math.floor(Math.random() * 3);
  const spinsY = 3 + Math.floor(Math.random() * 3);
  
  const finalRx = rx + spinsX * 360;
  const finalRy = ry + spinsY * 360;
  
  // Apply rotation
  cube.style.transform = `rotateX(${finalRx}deg) rotateY(${finalRy}deg)`;
  
  setTimeout(() => {
    // Reset cumulative angle back to base (without any transition animation)
    // so that angles don't grow indefinitely in subsequent rolls
    cube.style.transition = 'none';
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    cube.offsetHeight; // force reflow
    cube.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.15)'; // restore default transition
    
    const rollText = roll === 1 ? 'Puttu' : roll;
    logMessage(`${Game.playersConfig[Game.currentPlayer()].name} rolled a ${rollText}!`, Game.currentPlayer());
    
    if (roll === 6) {
      AudioSynth.playRollSix();
      const container = document.getElementById('main-container');
      container.classList.add('shake-screen');
      setTimeout(() => container.classList.remove('shake-screen'), 400);
    }
    
    if (forfeited) {
      logMessage(`🚫 Three 6s in a row! Turn forfeited, no move made.`, Game.currentPlayer());
    }
    
    if (callback) callback(forfeited);
  }, 1000);
}

// Token movement animation sequence
Game.moveToken = function(color, tokenId) {
  if (this.isMoving || this.isGameOver || !this.isMatchStarted) return;
  this.isMoving = true;
  
  const token = this.tokens[color].find(t => t.id === tokenId);
  const startSteps = token.steps;
  const targetSteps = startSteps === 0 ? 1 : startSteps + this.diceValue;
  
  let currentSteps = startSteps;
  
  function animateStep() {
    if (currentSteps < targetSteps) {
      currentSteps = currentSteps === 0 ? 1 : currentSteps + 1;
      token.steps = currentSteps;
      
      AudioSynth.playTokenStep();
      drawTokens();
      bounceToken(color, tokenId);
      
      setTimeout(animateStep, 180);
    } else {
      // Completed animation
      Game.isMoving = false;
      let isCaptured = false;
      const capturedTokens = [];
      
      if (token.steps > 0 && token.steps < 57) {
        const landingCoord = getCoordForToken(color, token.steps, token.id);
        const config = PLAYER_CONFIGS[color];
        const mainTrackIdx = (config.startIdx + token.steps - 1) % 52;
        const onSafeCell = SAFE_CELL_INDICES.includes(mainTrackIdx);
        
        if (!onSafeCell) {
          // Look for opponents to capture -- a block of 2+ same-color
          // tokens is protected and cannot be captured (nor legally landed
          // on in the first place, per isTokenMovable/isCellBlocked).
          for (let oppColor in Game.tokens) {
            if (oppColor === color || PLAYER_CONFIGS[oppColor].status === 'inactive') continue;
            
            const oppOnCell = Game.tokens[oppColor].filter(oppToken => {
              if (oppToken.steps <= 0 || oppToken.steps >= 57) return false;
              const oppCoord = getCoordForToken(oppColor, oppToken.steps, oppToken.id);
              return oppCoord.r === landingCoord.r && oppCoord.c === landingCoord.c;
            });
            
            if (oppOnCell.length > 0 && oppOnCell.length < 2) {
              oppOnCell.forEach(oppToken => {
                capturedTokens.push({ color: oppColor, id: oppToken.id });
                isCaptured = true;
                logMessage(`💥 ${Game.playersConfig[color].name} cut ${Game.playersConfig[oppColor].name}'s Goti!`, color);
              });
            }
          }
        } else {
          AudioSynth.playSafeZone();
        }
      }
      
      if (isCaptured) {
        AudioSynth.playCapture();
        Game.extraTurn = true;
        // Play the "fly back to base" animation before actually resetting steps
        playCaptureAnimation(capturedTokens, () => {
          capturedTokens.forEach(ct => {
            const oppToken = Game.tokens[ct.color].find(t => t.id === ct.id);
            if (oppToken) oppToken.steps = 0;
          });
          AudioSynth.playReturnToYard();
          drawTokens();
        });
      }
      
      if (token.steps === 57) {
        AudioSynth.playVictory();
        Game.extraTurn = true;
        logMessage(`🎉 A Goti of ${Game.playersConfig[color].name} reached HOME!`, color);
        celebrateHomeToken(color, tokenId);
      }
      
      updatePlayerStatusUI();
      
      if (Game.checkWin(color)) {
        triggerVictory(color);
        return;
      }
      
      setTimeout(nextTurn, 400);
    }
  }
  
  animateStep();
};

// Check if all active tokens are home
Game.checkWin = function(color) {
  return this.tokens[color].every(t => t.steps === 57);
};

// Turn Switcher (Skips inactive players)
function nextTurn() {
  if (Game.isGameOver || !Game.isMatchStarted) return;
  
  const current = Game.currentPlayer();
  
  if (Game.diceValue === 6) {
    logMessage(`🎲 Extra roll granted for rolling 6!`, current);
    Game.extraTurn = true; // Flag that we stay on this player
  } else if (Game.extraTurn) {
    logMessage(`🔥 Bonus roll awarded!`, current);
  } else {
    moveToNextActivePlayer();
  }
  
  Game.hasRolled = false;
  Game.diceValue = 0;
  Game.extraTurn = false;
  
  updateTurnUI();
  updatePlayerStatusUI();
  drawTokens();
  
  const nextConfig = Game.playersConfig[Game.currentPlayer()];
  if (nextConfig.isAI) {
    runAILogic();
  } else {
    setDiceRollable(true);
  }
}

// Rolling three 6s in a row immediately forfeits the turn -- no token
// moves, and consecutiveSixes is reset here rather than in nextTurn().
function forfeitTurn() {
  if (Game.isGameOver || !Game.isMatchStarted) return;
  
  Game.consecutiveSixes = 0;
  Game.extraTurn = false;
  Game.hasRolled = false;
  Game.diceValue = 0;
  moveToNextActivePlayer();
  
  updateTurnUI();
  updatePlayerStatusUI();
  drawTokens();
  
  const nextConfig = Game.playersConfig[Game.currentPlayer()];
  if (nextConfig.isAI) {
    runAILogic();
  } else {
    setDiceRollable(true);
  }
}

// Find next active color in clockwise rotation
function moveToNextActivePlayer() {
  let attempts = 0;
  do {
    Game.currentPlayerIdx = (Game.currentPlayerIdx + 1) % 4;
    attempts++;
  } while (PLAYER_CONFIGS[Game.currentPlayer()].status === 'inactive' && attempts < 4);
}

// AI Player algorithm
function runAILogic() {
  if (Game.isGameOver || !Game.isMatchStarted) return;
  
  setDiceRollable(false);
  
  setTimeout(() => {
    rollDice((forfeited) => {
      const color = Game.currentPlayer();
      
      if (forfeited) {
        setTimeout(forfeitTurn, 1000);
        return;
      }
      
      const movableTokens = [];
      
      Game.tokens[color].forEach(t => {
        if (Game.isTokenMovable(color, t.id)) {
          movableTokens.push(t.id);
        }
      });
      
      if (movableTokens.length === 0) {
        logMessage(`AI ${Game.playersConfig[color].name} has no valid moves.`, color);
        setTimeout(nextTurn, 1000);
      } else {
        const bestTokenId = selectBestAIMove(color, movableTokens);
        setTimeout(() => {
          Game.moveToken(color, bestTokenId);
        }, 800);
      }
    });
  }, 1000);
}

// Heuristics decision weight engine
function selectBestAIMove(color, movableTokens) {
  let bestTokenId = movableTokens[0];
  let maxWeight = -Infinity;
  
  movableTokens.forEach(tokenId => {
    const token = Game.tokens[color].find(t => t.id === tokenId);
    const steps = token.steps;
    const targetSteps = steps === 0 ? 1 : steps + Game.diceValue;
    
    let weight = 0;
    
    if (targetSteps === 57) {
      weight += 1200;
    }
    
    if (targetSteps > 0 && targetSteps < 57) {
      const targetCoord = getCoordForToken(color, targetSteps, tokenId);
      const config = PLAYER_CONFIGS[color];
      const mainTrackIdx = (config.startIdx + targetSteps - 1) % 52;
      const onSafeCell = SAFE_CELL_INDICES.includes(mainTrackIdx);
      
      if (!onSafeCell) {
        let wouldCapture = false;
        for (let oppColor in Game.tokens) {
          if (oppColor === color || PLAYER_CONFIGS[oppColor].status === 'inactive') continue;
          Game.tokens[oppColor].forEach(oppToken => {
            if (oppToken.steps > 0 && oppToken.steps < 57) {
              const oppCoord = getCoordForToken(oppColor, oppToken.steps, oppToken.id);
              if (oppCoord.r === targetCoord.r && oppCoord.c === targetCoord.c) {
                wouldCapture = true;
              }
            }
          });
        }
        if (wouldCapture) {
          weight += 1000;
        }
      }
    }
    
    if (steps === 0 && targetSteps === 1) {
      weight += 800;
    }
    
    if (steps < 52 && targetSteps >= 52) {
      weight += 500;
    }
    
    if (targetSteps > 0 && targetSteps < 57) {
      const config = PLAYER_CONFIGS[color];
      const mainTrackIdx = (config.startIdx + targetSteps - 1) % 52;
      if (SAFE_CELL_INDICES.includes(mainTrackIdx)) {
        weight += 300;
      }
    }
    
    // Reward forming a defensive block (landing on a cell already
    // held by one of this player's own tokens on the open track)
    if (targetSteps >= 1 && targetSteps <= 51) {
      const targetCoord = getCoordForToken(color, targetSteps, tokenId);
      const ownOnCell = Game.tokens[color].some(other => {
        if (other.id === tokenId || other.steps < 1 || other.steps > 51) return false;
        const otherCoord = getCoordForToken(color, other.steps, other.id);
        return otherCoord.r === targetCoord.r && otherCoord.c === targetCoord.c;
      });
      if (ownOnCell) {
        weight += 250;
      }
    }
    
    weight += steps * 4;
    weight += Math.random() * 8;
    
    if (weight > maxWeight) {
      maxWeight = weight;
      bestTokenId = tokenId;
    }
  });
  
  return bestTokenId;
}

// UI Updating Syncs
function updateTurnUI() {
  const current = Game.currentPlayer();
  const config = Game.playersConfig[current];
  
  const turnDot = document.getElementById('turn-dot');
  const turnText = document.getElementById('turn-text');
  
  if (turnDot) {
    turnDot.style.backgroundColor = `var(--${current})`;
    turnDot.style.boxShadow = `0 0 10px var(--${current}-glow)`;
  }
  if (turnText) {
    turnText.textContent = config.name;
  }

  document.documentElement.style.setProperty('--active-color', `var(--${current})`);
  document.documentElement.style.setProperty('--active-glow', `var(--${current}-glow)`);
}

function updatePlayerStatusUI() {
  for (let color in Game.tokens) {
    const dots = document.querySelectorAll(`#progress-${color} .token-status-dot`);
    Game.tokens[color].forEach((t, i) => {
      const dot = dots[i];
      if (!dot) return;
      
      if (t.steps === 57) {
        dot.className = 'token-status-dot home';
        dot.style.opacity = '1';
        dot.style.color = `var(--${color})`;
      } else if (t.steps > 0) {
        dot.className = 'token-status-dot';
        dot.style.opacity = '0.65';
        dot.style.backgroundColor = `var(--${color})`;
        dot.style.boxShadow = `0 0 5px var(--${color}-glow)`;
      } else {
        dot.className = 'token-status-dot';
        dot.style.opacity = '0.25';
        dot.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        dot.style.boxShadow = 'none';
      }
    });
  }
}

// Victory overlays
function triggerVictory(color) {
  Game.isGameOver = true;
  AudioSynth.playVictory();
  
  const overlay = document.getElementById('victory-overlay');
  const title = overlay.querySelector('.victory-title');
  const msg = overlay.querySelector('.victory-message');
  
  title.textContent = `VICTORY!`;
  msg.textContent = `${Game.playersConfig[color].name} has brought all Gotis home and won the match!`;
  
  overlay.classList.add('open');
}

function closeVictory(shouldShowLobby = false) {
  document.getElementById('victory-overlay').classList.remove('open');
  // Return to lobby if requested
  if (shouldShowLobby) {
    showStartMenu();
  }
}

// Modal management
function openModal(color) {
  const modal = document.getElementById(`modal-${color}`);
  if (modal) {
    modal.classList.add('open');
  }
}

function closeModal(color) {
  const modal = document.getElementById(`modal-${color}`);
  if (modal) {
    modal.classList.remove('open');
  }
}



// Enable or disable click interaction and active pulse on dice
function setDiceRollable(rollable) {
  const container = document.getElementById('dice-container');
  if (container) {
    if (rollable) {
      container.classList.add('active-roll');
      container.style.pointerEvents = 'auto';
    } else {
      container.classList.remove('active-roll');
      container.style.pointerEvents = 'none';
    }
  }
  
  // Highlight the active profile card
  const colors = ['red', 'green', 'blue', 'yellow'];
  const activeColor = Game.currentPlayer();
  colors.forEach(color => {
    const profile = document.getElementById(`profile-${color}`);
    if (profile) {
      if (color === activeColor) {
        profile.classList.add('active');
      } else {
        profile.classList.remove('active');
      }
    }
  });
}

// Helper to open/close menu lobby
function showStartMenu() {
  Game.isMatchStarted = false;
  const menu = document.getElementById('start-menu');
  menu.style.display = 'flex';
  menu.classList.add('open');
  
  const lobbyDispEl = document.getElementById('diag-lobby-display');
  if (lobbyDispEl) {
    lobbyDispEl.textContent = menu.style.display || getComputedStyle(menu).display;
  }
}

function hideStartMenu() {
  const menu = document.getElementById('start-menu');
  console.log("hideStartMenu() called. ClassList before:", menu.className);
  menu.classList.remove('open');
  menu.style.display = 'none';
  console.log("hideStartMenu() completed. ClassList after:", menu.className);
  
  const lobbyDispEl = document.getElementById('diag-lobby-display');
  if (lobbyDispEl) {
    lobbyDispEl.textContent = menu.style.display || getComputedStyle(menu).display;
  }
}

// Initialize configurations from lobby lobby
function startMatch() {
  console.log("startMatch() called!");
  try {
    const activeConfigs = [];
    
    // Read config choices
    const colors = ['red', 'green', 'blue', 'yellow'];
    colors.forEach(color => {
      const card = document.querySelector(`.config-card[data-color="${color}"]`);
      if (!card) {
        console.error(`Card not found for color: ${color}`);
        return;
      }
      const activeBtn = card.querySelector('.config-opt.active');
      if (!activeBtn) {
        console.error(`Active button not found in card for color: ${color}`);
        return;
      }
      const val = activeBtn.getAttribute('data-val');
      console.log(`Color: ${color}, Selection: ${val}`);
      
      if (val === 'inactive') {
        PLAYER_CONFIGS[color].status = 'inactive';
      } else {
        PLAYER_CONFIGS[color].status = 'active';
        PLAYER_CONFIGS[color].isAI = (val === 'ai');
        activeConfigs.push(color);
      }
    });
    
    console.log(`Active configs:`, activeConfigs);
    
    // Validation: at least 2 active players
    if (activeConfigs.length < 2) {
      alert('Match setup requires at least 2 active players!');
      return;
    }
    
    // Apply visual configurations to sidebar rows
    colors.forEach(color => {
      const row = document.getElementById(`player-row-${color}`);
      if (!row) {
        console.error(`Player row not found for color: ${color}`);
        return;
      }
      const config = PLAYER_CONFIGS[color];
      
      if (config.status === 'inactive') {
        row.style.display = 'none';
        row.classList.remove('playing');
      } else {
        row.style.display = 'flex';
        row.classList.add('playing');
        const typeEl = document.getElementById(`type-${color}`);
        if (typeEl) {
          typeEl.textContent = config.isAI ? 'AI' : 'Human';
        } else {
          console.error(`Type label not found for color: ${color}`);
        }
      }
    });
    
    // Set starting player
    // Find first active player
    let startIndex = 0;
    while (PLAYER_CONFIGS[Game.players[startIndex]].status === 'inactive') {
      startIndex = (startIndex + 1) % 4;
    }
    
    Game.currentPlayerIdx = startIndex;
    Game.diceValue = 0;
    Game.hasRolled = false;
    Game.isMoving = false;
    Game.extraTurn = false;
    Game.consecutiveSixes = 0;
    Game.isGameOver = false;
    Game.isMatchStarted = true;
    
    // Reset token positions
    for (let color in Game.tokens) {
      Game.tokens[color].forEach(t => {
        t.steps = 0;
      });
    }
    
    console.log("Hiding start menu and redrawing...");
    // Hide overlays
    hideStartMenu();
    closeVictory();
    
    // Reset logs
    const container = document.getElementById('log-messages');
    if (container) {
      container.innerHTML = `<div class="log-entry system">Match started! ${PLAYER_CONFIGS[Game.currentPlayer()].name}'s Turn.</div>`;
    }
    
    // Reset dice
    const cube = document.getElementById('dice-cube');
    if (cube) {
      cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
    
    updateTurnUI();
    updatePlayerStatusUI();
    drawTokens();
    
    console.log("Match start sequence completed. Current player is:", Game.currentPlayer());
    
    // Update player names and roles in profiles
    for (let color in PLAYER_CONFIGS) {
      const config = PLAYER_CONFIGS[color];
      const card = document.getElementById(`profile-${color}`);
      if (card) {
        const nameEl = card.querySelector('.profile-name');
        const roleEl = card.querySelector('.profile-role');
        if (nameEl) nameEl.textContent = config.name;
        if (roleEl) {
          if (config.status === 'inactive') {
            roleEl.textContent = 'Inactive';
            card.style.opacity = '0.3';
          } else {
            roleEl.textContent = config.isAI ? 'AI' : 'Human';
            card.style.opacity = '1';
          }
        }
      }
    }
    

    // If first player is AI
    if (PLAYER_CONFIGS[Game.currentPlayer()].isAI) {
      runAILogic();
    } else {
      setDiceRollable(true);
    }
  } catch (err) {
    console.error("Error in startMatch():", err);
  }
}

// DOM Setup
function setupGameApp() {
  const jsVerEl = document.getElementById('diag-js-ver');
  if (jsVerEl) jsVerEl.textContent = 'V18';
  const lobbyDispEl = document.getElementById('diag-lobby-display');
  const menuEl = document.getElementById('start-menu');
  if (lobbyDispEl && menuEl) {
    lobbyDispEl.textContent = menuEl.style.display || getComputedStyle(menuEl).display;
  }

  initBoard();
  drawTokens();
  
  // Setup lobby selection toggles
  const cards = document.querySelectorAll('.config-card');
  cards.forEach(card => {
    const opts = card.querySelectorAll('.config-opt');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });
  });
  
  // Start Match button
  document.getElementById('start-match-btn').addEventListener('click', () => {
    startMatch();
  });
  
  // Audio unlock listener
  document.body.addEventListener('click', () => {
    AudioSynth.init();
  }, { once: true });
  
  // Sound Mute Toggle
  const muteBtn = document.getElementById('mute-btn');
  muteBtn.addEventListener('click', () => {
    const isMuted = AudioSynth.toggleMute();
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    logMessage(isMuted ? 'Audio muted.' : 'Audio active.');
  });
  
  // Help rules dialog
  document.getElementById('info-btn').addEventListener('click', () => {
    openModal('info');
  });
  
  // Back to Menu / Reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    showStartMenu();
  });
  
  // Clickable 3D Dice Container interaction
  const diceContainer = document.getElementById('dice-container');
  if (diceContainer) {
    diceContainer.addEventListener('click', () => {
      if (Game.hasRolled || Game.isMoving || Game.playersConfig[Game.currentPlayer()].isAI) return;
      
      setDiceRollable(false);
      rollDice((forfeited) => {
        const color = Game.currentPlayer();
        
        if (forfeited) {
          setTimeout(forfeitTurn, 1000);
          return;
        }
        
        const movableTokens = [];
        
        Game.tokens[color].forEach(t => {
          if (Game.isTokenMovable(color, t.id)) {
            movableTokens.push(t.id);
          }
        });
        
        if (movableTokens.length === 0) {
          logMessage(`No moves possible for ${Game.playersConfig[color].name}.`, color);
          setTimeout(nextTurn, 1500);
        } else {
          const allInYard = Game.tokens[color].every(t => t.steps === 0);
          if (allInYard && Game.diceValue === 6) {
            logMessage(`Auto-spawning first Goti for ${Game.playersConfig[color].name}!`, color);
            setTimeout(() => {
              Game.moveToken(color, Game.tokens[color][0].id);
            }, 600);
          } else if (movableTokens.length === 1) {
            const autoTokenId = movableTokens[0];
            logMessage(`Only one movable Goti. Auto-moving!`, color);
            setTimeout(() => {
              Game.moveToken(color, autoTokenId);
            }, 600);
          } else {
            drawTokens(); // Highlight movable gotis
          }
        }
      });
    });
  }

  // Global click outside modal close handler
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.id !== 'start-menu') {
      e.target.classList.remove('open');
    }
  });

  // Enable customizing who plays: clicking Human/AI tag toggles state
  const colors = ['red', 'green', 'blue', 'yellow'];
  colors.forEach(color => {
    const typeLabel = document.getElementById(`type-${color}`);
    if (typeLabel) {
      typeLabel.style.cursor = 'pointer';
      typeLabel.addEventListener('click', () => {
        if (Game.isMoving) return;
        
        const config = Game.playersConfig[color];
        config.isAI = !config.isAI;
        typeLabel.textContent = config.isAI ? 'AI' : 'Human';
        logMessage(`${config.name} player configuration updated to: ${config.isAI ? 'AI' : 'Human'}`);
        
        drawTokens();
        
        if (Game.currentPlayer() === color && config.isAI && !Game.hasRolled) {
          runAILogic();
        }
      });
    }
  });
}

// Robust execution initialization check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupGameApp);
} else {
  setupGameApp();
}