// Natural Ambient Sound Generator using Web Audio API (100% natural, NO music)
export type AmbientSoundType = 'none' | 'water' | 'birds' | 'rain' | 'breeze';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private birdIntervalId: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setSound(type: AmbientSoundType, volume: number = 0.4) {
    this.stopCurrent();
    this.currentType = type;

    if (type === 'none') {
      this.isRunning = false;
      return;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.setVolume(volume);
    this.isRunning = true;

    switch (type) {
      case 'water':
        this.playWaterStream();
        break;
      case 'birds':
        this.playBirds();
        break;
      case 'rain':
        this.playGentleRain();
        break;
      case 'breeze':
        this.playGentleBreeze();
        break;
    }
  }

  // 1. Water stream (خرير الماء وجريان النهر)
  private playWaterStream() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Buffer of pink noise
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.18;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Dual resonant bandpass filters to simulate water bubbling and stream flow
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.value = 600;
    filter1.Q.value = 2.5;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 1200;

    // LFO to modulate filter frequency for babbling effect
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter1.frequency);

    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push(noise, lfo, filter1, filter2, lfoGain);
  }

  // 2. Birds chirping (زقزقة العصافير الهادئة)
  private playBirds() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Background faint open air atmosphere
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.015;
    }
    const airNoise = ctx.createBufferSource();
    airNoise.buffer = buffer;
    airNoise.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 800;
    airNoise.connect(airFilter);
    airFilter.connect(this.masterGain);
    airNoise.start();
    this.activeNodes.push(airNoise, airFilter);

    // Periodic gentle bird call synthesis
    const triggerBirdChirp = () => {
      if (!this.isRunning || this.currentType !== 'birds' || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 2200 + Math.random() * 1200;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600 + Math.random() * 400, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);

      // Repeat a quick double-chirp sometimes
      if (Math.random() > 0.4) {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const now2 = now + 0.12;
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq + 200, now2);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq + 800, now2 + 0.07);
        gain2.gain.setValueAtTime(0.001, now2);
        gain2.gain.linearRampToValueAtTime(0.2, now2 + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.14);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now2);
        osc2.stop(now2 + 0.16);
      }
    };

    triggerBirdChirp();
    this.birdIntervalId = setInterval(() => {
      triggerBirdChirp();
    }, 2400 + Math.random() * 2600);
  }

  // 3. Gentle rain (هطول المطر الهادئ)
  private playGentleRain() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();

    this.activeNodes.push(noise, filter);
  }

  // 4. Gentle breeze (نسيم هادئ)
  private playGentleBreeze() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.2;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }

  public stopCurrent() {
    if (this.birdIntervalId) {
      clearInterval(this.birdIntervalId);
      this.birdIntervalId = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
    this.isRunning = false;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }
}

export const ambientSound = new AmbientSoundEngine();
