/**
 * Web Audio API Engine
 * Features procedural sound synthesis, dynamic pitch shifting for XP gem streaks,
 * polyphony limiting, audio ducking, and external audio file support.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  // Sound Limiting (Polyphony)
  private activeVoices: Map<string, number> = new Map();
  private maxVoicesPerType: number = 3;

  // XP Streak Pitch Shifter
  private xpPitch: number = 1.0;
  private lastXpTime: number = 0;
  private xpPitchResetDelay: number = 400; // ms

  // BGM Synthesizer State
  private isBgmPlaying: boolean = false;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const initAudio = () => {
      this.initContext();
      window.removeEventListener('pointerdown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('pointerdown', initAudio);
    window.addEventListener('keydown', initAudio);
  }

  private initContext(): void {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /* =========================================================================
     PROCEDURAL SOUND SYNTHESIZER
     ========================================================================= */

  /**
   * Plays dynamic pitch-shifted XP pickup chime.
   */
  public playXpPickup(): void {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = performance.now();
    if (now - this.lastXpTime < this.xpPitchResetDelay) {
      this.xpPitch = Math.min(2.2, this.xpPitch + 0.06);
    } else {
      this.xpPitch = 1.0;
    }
    this.lastXpTime = now;

    // Synth crystal chime
    const baseFreq = 523.25 * this.xpPitch; // C5 * pitch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Sound effect trigger dispatcher with voice limiting.
   */
  public play(sfxId: string): void {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Voice limiting
    const count = this.activeVoices.get(sfxId) || 0;
    if (count >= this.maxVoicesPerType) return;
    this.activeVoices.set(sfxId, count + 1);

    setTimeout(() => {
      const cur = this.activeVoices.get(sfxId) || 1;
      this.activeVoices.set(sfxId, Math.max(0, cur - 1));
    }, 100);

    const t = this.ctx.currentTime;

    switch (sfxId) {
      case 'hit':
      case 'enemy_hit': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.06);
        break;
      }

      case 'whip':
      case 'whip_crit': {
        const node = this.createNoiseNode(0.15);
        if (node) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, t);
          filter.frequency.linearRampToValueAtTime(400, t + 0.15);
          node.connect(filter);
          filter.connect(this.sfxGain!);
        }
        break;
      }

      case 'magic_bolt': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(330, t + 0.1);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.1);
        break;
      }

      case 'fireball':
      case 'explosion': {
        const noise = this.createNoiseNode(0.35);
        if (noise) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.linearRampToValueAtTime(60, t + 0.35);
          noise.connect(filter);
          filter.connect(this.sfxGain!);
        }
        break;
      }

      case 'knife_throw': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.05);
        break;
      }

      case 'level_up': {
        this.duckBgm(0.8);
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
        notes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t + i * 0.09);
          gain.gain.setValueAtTime(0.18, t + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.25);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + i * 0.09);
          osc.stop(t + i * 0.09 + 0.25);
        });
        break;
      }

      case 'chest_open': {
        this.duckBgm(1.5);
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + i * 0.1);
          gain.gain.setValueAtTime(0.25, t + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + i * 0.1);
          osc.stop(t + i * 0.1 + 0.4);
        });
        break;
      }

      case 'coin': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.18);
        break;
      }

      case 'slot_tick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.03);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.03);
        break;
      }

      case 'slot_stop': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.09);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 0.09);
        break;
      }

      case 'jackpot': {
        this.duckBgm(2.2);
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + i * 0.08);
          gain.gain.setValueAtTime(0.28, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.5);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 0.5);
        });
        break;
      }
    }
  }

  /**
   * Ducking: temporarily reduces BGM volume when important jingles play.
   */
  private duckBgm(durationSeconds: number): void {
    if (!this.ctx || !this.bgmGain) return;
    const t = this.ctx.currentTime;
    this.bgmGain.gain.cancelScheduledValues(t);
    this.bgmGain.gain.setValueAtTime(0.1, t);
    this.bgmGain.gain.linearRampToValueAtTime(0.35, t + durationSeconds);
  }

  private createNoiseNode(duration: number): AudioNode | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    noise.connect(gain);
    noise.start();
    return gain;
  }

  /**
   * Starts a procedural retro Gothic dungeon arpeggio soundtrack.
   */
  public startBgm(): void {
    if (this.isBgmPlaying || !this.ctx) return;
    this.isBgmPlaying = true;

    const bassScale = [110, 110, 130.81, 98, 110, 146.83, 130.81, 123.47]; // A2 gothic arpeggio
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.isBgmPlaying) return;
      if (this.ctx.state === 'suspended') return;

      const t = this.ctx.currentTime;
      const freq = bassScale[step % bassScale.length];

      // Bass pluck
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start(t);
      osc.stop(t + 0.22);

      step++;
    }, 175);
  }

  public stopBgm(): void {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new AudioEngine();
