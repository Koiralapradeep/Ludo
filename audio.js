const AudioSynth = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  playDiceRattle() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    // Play a sequence of short pitch-sliding plucks
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100 + Math.random() * 400, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(50, now + i * 0.04 + 0.03);
      
      gain.gain.setValueAtTime(0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.03);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.03);
    }
  },

  playTokenStep() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.1);
  },

  playSafeZone() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Uplifting chime chord)
    
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      
      gain.gain.setValueAtTime(0.08, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.3);
    });
  },

  playCapture() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    
    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 0.25; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    noise.stop(now + 0.25);

    // Synth explosion pluck
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
    
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.25);
  },

  playReturnToYard() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const duration = 0.35;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(80, now + duration);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + duration);
  },

  playRollSix() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    
    // Play double high beep (E6 to G6)
    [
      { f: 1318.51, delay: 0 },
      { f: 1567.98, delay: 0.08 }
    ].forEach((beep) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(beep.f, now + beep.delay);
      
      gain.gain.setValueAtTime(0.12, now + beep.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + beep.delay + 0.07);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + beep.delay);
      osc.stop(now + beep.delay + 0.08);
    });
  },

  playVictory() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const notes = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      659.25, // E5
      783.99, // G5
      1046.50 // C6
    ];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.27);
    });
  }
};
