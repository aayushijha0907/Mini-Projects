/**
 * Procedural Web Audio API Sound Synthesizer
 * Produces rustic wooden clacks, dice rattles, emerald chimes, and Minecraft sounds.
 * 100% self-contained with no external audio file dependencies.
 */

class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.7;
        
        // Restore mute preference
        try {
            const saved = localStorage.getItem('minecraft_chronicles_muted');
            if (saved !== null) this.muted = JSON.parse(saved);
        } catch (e) {}
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('minecraft_chronicles_muted', JSON.stringify(this.muted));
        } catch (e) {}
        return this.muted;
    }

    /**
     * Wooden stick / block tap sound (landing, selecting, dragging drop)
     */
    playStickClick(pitchMod = 1.0, strength = 1.0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 0.08;

        // Wood resonance oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 * pitchMod, now);
        osc.frequency.exponentialRampToValueAtTime(110 * pitchMod, now + dur);

        // Click noise burst
        const bufferSize = this.ctx.sampleRate * 0.02;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200 * pitchMod, now);
        filter.Q.setValueAtTime(2, now);

        const noiseGain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4 * strength * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noiseGain.gain.setValueAtTime(0.3 * strength * this.volume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + dur);
        noise.stop(now + 0.02);
    }

    /**
     * Tumbling dice rattle - rapid bursts of wooden impacts
     */
    playDiceBounce(velocity = 1.0) {
        if (this.muted) return;
        const pitch = 0.8 + Math.random() * 0.5;
        this.playStickClick(pitch, Math.min(1.2, Math.max(0.2, velocity)));
    }

    /**
     * Emerald coin chime (gem collection / purchasing)
     */
    playEmeraldChime(isLoss = false) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = isLoss ? [587.33, 493.88] : [1046.50, 1318.51, 1567.98]; // C6, E6, G6
        
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.4);
        });
    }

    /**
     * Drawing a card from Lucky Block or Treasure Chest
     */
    playPaperSlide() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 0.2;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(2200, now + dur);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
    }

    /**
     * Minecraft Villager "Huuuh"
     */
    playVillagerHuh() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.3);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Creeper Hiss (danger / jail)
     */
    playCreeperHiss() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 0.55;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.7;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2500, now);
        filter.frequency.linearRampToValueAtTime(1800, now + dur);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05 * this.volume, now);
        gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
    }

    /**
     * Building shelter / beacon hammer thud
     */
    playBuildHammer() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        this.playStickClick(0.7, 1.2);
        setTimeout(() => this.playStickClick(1.1, 0.9), 100);
        setTimeout(() => this.playEmeraldChime(false), 220);
    }
}

// Global sound singleton
const Sound = new SoundSynthesizer();
