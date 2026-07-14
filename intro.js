// Puttu Ludo Cinematic Intro Orchestration

let introTimeouts = [];
let introAnimationId = null;
let introCompleted = false;

// 1. Particle System Setup
const canvas = document.getElementById('intro-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

// Classic vintage Ludo colors matching the color-signature
const LUDO_COLORS = ['#a8332d', '#b6922c', '#357456', '#315f86'];

class IntroParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 4.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.0; // slight upward bias
    
    // Size parameters for paper fleck rectangles
    this.width = 3.0 + Math.random() * 4.0;
    this.height = 4.0 + Math.random() * 5.0;
    this.color = LUDO_COLORS[Math.floor(Math.random() * LUDO_COLORS.length)];
    this.alpha = 1;
    this.decay = 0.01 + Math.random() * 0.015;
    this.gravity = 0.06;
    this.friction = 0.98;
    this.rotation = Math.random() * Math.PI;
    this.rotationSpeed = (Math.random() - 0.5) * 0.12;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
  }

  draw(c) {
    c.save();
    c.globalAlpha = this.alpha;
    c.translate(this.x, this.y);
    c.rotate(this.rotation);
    c.fillStyle = this.color;
    
    // Draw classic flat paper confetti fleck
    c.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    c.restore();
  }
}

function resizeIntroCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

function updateIntroParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach((p, idx) => {
    p.update();
    if (p.alpha <= 0) {
      particles.splice(idx, 1);
    } else {
      p.draw(ctx);
    }
  });

  if (particles.length > 0 || !introCompleted) {
    introAnimationId = requestAnimationFrame(updateIntroParticles);
  }
}

function spawnIntroParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    particles.push(new IntroParticle(x, y));
  }
}

// 2. Main Timeline Orchestration
function playIntroSequence() {
  resizeIntroCanvas();
  window.addEventListener('resize', resizeIntroCanvas);

  // Start animation loop
  if (canvas) {
    introAnimationId = requestAnimationFrame(updateIntroParticles);
  }

  // Setup click-to-unlock audio on the document during intro
  const unlockAudio = () => {
    if (typeof AudioSynth !== 'undefined') {
      AudioSynth.init();
    }
  };
  document.addEventListener('click', unlockAudio, { once: true });

  const diceCube = document.getElementById('intro-dice-cube');
  
  // Step 1: Start Horizontal Slide-In at 0.8s
  introTimeouts.push(setTimeout(() => {
    if (diceCube) {
      diceCube.classList.add('rolling-in');
    }
    // Play rolling audio
    if (typeof AudioSynth !== 'undefined' && !AudioSynth.muted) {
      AudioSynth.init();
      AudioSynth.playDiceRattle();
    }
  }, 800));

  // Step 2: Dice reaches center at 1.8s -> Remove rolling-in, start 2-second loading spin
  introTimeouts.push(setTimeout(() => {
    if (diceCube) {
      diceCube.classList.remove('rolling-in');
      diceCube.classList.add('spinning-load');
    }
    // Play loading rattle sound effect
    if (typeof AudioSynth !== 'undefined' && !AudioSynth.muted) {
      AudioSynth.playDiceRattle();
    }
  }, 1800));

  // Step 3: Play secondary rattle during long spin at 2.4s
  introTimeouts.push(setTimeout(() => {
    if (typeof AudioSynth !== 'undefined' && !AudioSynth.muted) {
      AudioSynth.playDiceRattle();
    }
  }, 2400));

  // Step 4: Loading spin completes at 3.0s -> trigger transition immediately
  introTimeouts.push(setTimeout(() => {
    // Play landing chime and high roll 6 swell
    if (typeof AudioSynth !== 'undefined' && !AudioSynth.muted) {
      AudioSynth.playSafeZone();
      setTimeout(() => {
        AudioSynth.playRollSix();
      }, 150);
    }

    // Emit classic paper fleck particles from the dice position (board center)
    const diceWrapper = document.getElementById('intro-dice-wrapper');
    if (diceWrapper && canvas) {
      const rect = diceWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      spawnIntroParticles(centerX, centerY, 120);
    }

    // Instantly transition to the lobby while the dice continues to spin in the fade-out
    transitionIntroToLobby();
  }, 3000));
}

// 3. Skip / Transition Logic
function transitionIntroToLobby() {
  if (introCompleted) return;
  introCompleted = true;

  const introContainer = document.getElementById('cinematic-intro');
  const startMenu = document.getElementById('start-menu');

  if (introContainer) {
    introContainer.classList.add('fade-out');
  }

  // Show the start menu overlay
  if (startMenu) {
    startMenu.classList.add('open');
  }

  // Play a soft transition swish sound
  if (typeof AudioSynth !== 'undefined' && !AudioSynth.muted) {
    AudioSynth.playTokenStep();
  }

  // Cleanup after animation transition finishes (0.8s)
  introTimeouts.push(setTimeout(() => {
    if (introContainer) {
      introContainer.style.display = 'none';
      introContainer.remove(); // Remove from DOM to save resources
    }
    // Cancel animation loop
    if (introAnimationId) {
      cancelAnimationFrame(introAnimationId);
    }
    window.removeEventListener('resize', resizeIntroCanvas);
  }, 800));
}

function skipIntro() {
  // Clear all pending timeouts
  introTimeouts.forEach(t => clearTimeout(t));
  introTimeouts = [];

  // Instantly transition
  transitionIntroToLobby();
}

// Start on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', playIntroSequence);
} else {
  playIntroSequence();
}