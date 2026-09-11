// Procedural Web Audio API sound system for Zombie Core Arena

class SoundSystem {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = true;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playLaser(pitchMultiplier: number = 1.0) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(650 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(80 * pitchMultiplier, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  public playLightning() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const now = ctx.currentTime;

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.05);
      osc.frequency.linearRampToValueAtTime(900, now + 0.1);
      osc.frequency.linearRampToValueAtTime(100, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  public playExplosion() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {}
  }

  public playGemCollect() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playZombiePoof() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playPuppyBark() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // High-tech synthesized cute puppy bark: two rapid formant pulses
      [0, 0.11].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';

        const startTime = ctx.currentTime + delay;
        osc.frequency.setValueAtTime(420, startTime);
        osc.frequency.exponentialRampToValueAtTime(840, startTime + 0.035);
        osc.frequency.exponentialRampToValueAtTime(320, startTime + 0.09);

        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.09);
      });
    } catch {}
  }

  public playDroneZap() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playLevelUp() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const startTime = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      } catch {}
    });
  }

  public playBossRoar() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.8);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch {}
  }

  public playPlayerHit() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  public playCarEngine() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Low roaring engine rev
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.7);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.7);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch {}
  }

  public playCarHorn() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Classic dual-tone automotive horn
      [420, 525].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      });
    } catch {}
  }

  public playCarCrash() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.07));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {}
  }

  public playShieldBlock() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playPowerUp() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [329.63, 440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const startTime = ctx.currentTime + idx * 0.05;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      } catch {}
    });
  }

  public playUiClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  public startAmbientSynth() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isMusicPlaying = true;
    let step = 0;
    const bassline = [110, 110, 130.81, 98, 110, 146.83, 130.81, 123.47];

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';

        const now = ctx.currentTime;
        const freq = bassline[step % bassline.length] * 0.5;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        step++;
      } catch {}
    }, 400);
  }

  public stopAmbientSynth() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  public toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startAmbientSynth();
    } else {
      this.stopAmbientSynth();
    }
    return this.musicEnabled;
  }
}

export const sound = new SoundSystem();
