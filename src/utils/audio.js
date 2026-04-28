import { loadSettings, saveSettings } from "./storage.js";

class AudioController {
  constructor() {
    this.context = null;
    this.musicGain = null;
    this.musicNodes = [];
    this.arpTimer = null;
    this.musicStep = 0;
    this.settings = loadSettings();
  }

  ensureContext() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }
      this.context = new AudioContext();
    }
    return this.context;
  }

  async unlock() {
    const context = this.ensureContext();
    if (context?.state === "suspended") {
      await context.resume();
    }
  }

  setMusicVolume(value) {
    this.settings.musicVolume = Phaser.Math.Clamp(value, 0, 1);
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.2, this.context.currentTime, 0.04);
    }
    saveSettings(this.settings);
  }

  setSfxEnabled(enabled) {
    this.settings.sfxEnabled = Boolean(enabled);
    saveSettings(this.settings);
  }

  async startMusic() {
    const context = this.ensureContext();
    if (!context || this.musicGain) {
      return;
    }

    await this.unlock();

    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 5200;
    gain.gain.value = this.settings.musicVolume * 0.2;
    filter.connect(gain);
    gain.connect(context.destination);

    const notes = [130.81, 196, 261.63];
    notes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const nodeGain = context.createGain();
      osc.type = index === 0 ? "triangle" : "sine";
      osc.frequency.value = frequency;
      nodeGain.gain.value = index === 0 ? 0.08 : 0.035;
      osc.connect(nodeGain);
      nodeGain.connect(filter);
      osc.start();
      this.musicNodes.push(osc, nodeGain);
    });

    this.musicGain = gain;
    this.musicStep = 0;
    this.arpTimer = window.setInterval(() => this.playArpNote(), 330);
  }

  stopMusic() {
    if (!this.context) {
      return;
    }
    this.musicNodes.forEach((node) => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        // Nodes may already be stopped when the browser suspends audio.
      }
    });
    this.musicNodes = [];
    this.musicGain?.disconnect();
    this.musicGain = null;
    window.clearInterval(this.arpTimer);
    this.arpTimer = null;
    this.musicStep = 0;
  }

  playArpNote() {
    if (!this.context || !this.musicGain || this.settings.musicVolume <= 0.01) {
      return;
    }

    const now = this.context.currentTime;
    const melody = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.5, 987.77, 783.99, 659.25, 587.33];
    const harmony = [329.63, 392, 440, 392];
    const bass = [130.81, 146.83, 164.81, 196];
    const step = this.musicStep % melody.length;
    const frequency = melody[step];
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 260;
    osc.type = step % 4 === 0 ? "triangle" : "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.settings.musicVolume * 0.09, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.28);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };

    if (step % 4 === 2) {
      this.playTone(harmony[(step / 2) % harmony.length], now + 0.04, 0.19, 0.045, "sine");
    }

    if (step % 8 === 0) {
      this.playTone(bass[(step / 8) % bass.length], now, 0.28, 0.04, "triangle");
    }

    this.musicStep += 1;
  }

  playTone(frequency, startAt, duration, peak, type = "sine") {
    if (!this.context || !this.musicGain) {
      return;
    }

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = startAt;
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.settings.musicVolume * peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  playSfx(type) {
    if (!this.settings.sfxEnabled) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;

    const presets = {
      jump: { type: "triangle", start: 260, end: 520, peak: 0.12, duration: 0.18 },
      coin: { type: "sine", start: 820, end: 1320, peak: 0.12, duration: 0.2 },
      correct: { type: "sine", start: 520, end: 1040, peak: 0.14, duration: 0.32 },
      wrong: { type: "sawtooth", start: 180, end: 92, peak: 0.1, duration: 0.28 },
      power: { type: "triangle", start: 440, end: 880, peak: 0.14, duration: 0.34 },
      select: { type: "sine", start: 410, end: 620, peak: 0.07, duration: 0.12 },
      hit: { type: "square", start: 170, end: 120, peak: 0.12, duration: 0.16 }
    };

    const preset = presets[type] || presets.select;
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.start, now);
    osc.frequency.exponentialRampToValueAtTime(preset.end, now + preset.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(preset.peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + preset.duration + 0.02);
  }
}

export const audio = new AudioController();
