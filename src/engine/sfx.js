// ============================================================
// PANZADROME — SOUND ENGINE
// Web Audio API synthesised sound effects. No dependencies.
// ============================================================

const SFX = {
  ctx: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* Audio not available */ }
  },

  play(type) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g);
      g.connect(this.ctx.destination);
      const n = this.ctx.currentTime;

      const presets = {
        shoot:       () => { o.type="square";   o.frequency.setValueAtTime(600,n); o.frequency.exponentialRampToValueAtTime(100,n+0.1);  g.gain.setValueAtTime(0.12,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.1);  o.start(n); o.stop(n+0.1); },
        mortar:      () => { o.type="sawtooth"; o.frequency.setValueAtTime(200,n); o.frequency.exponentialRampToValueAtTime(50,n+0.2);   g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.2);  o.start(n); o.stop(n+0.2); },
        ricochet:    () => { o.type="sine";     o.frequency.setValueAtTime(1200,n); o.frequency.exponentialRampToValueAtTime(1600,n+0.08); g.gain.setValueAtTime(0.08,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.1); o.start(n); o.stop(n+0.1); },
        bounce:      () => { o.type="sine";     o.frequency.setValueAtTime(1800,n); o.frequency.exponentialRampToValueAtTime(2400,n+0.04); g.gain.setValueAtTime(0.06,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.05); o.start(n); o.stop(n+0.05); },
        hit:         () => { o.type="sawtooth"; o.frequency.setValueAtTime(150,n); o.frequency.exponentialRampToValueAtTime(40,n+0.12);  g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.12); o.start(n); o.stop(n+0.12); },
        explode:     () => { o.type="sawtooth"; o.frequency.setValueAtTime(100,n); o.frequency.exponentialRampToValueAtTime(20,n+0.3);   g.gain.setValueAtTime(0.18,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.3);  o.start(n); o.stop(n+0.3); },
        pickup:      () => { o.type="sine";     o.frequency.setValueAtTime(400,n); o.frequency.exponentialRampToValueAtTime(1200,n+0.15); g.gain.setValueAtTime(0.1,n);  g.gain.exponentialRampToValueAtTime(0.001,n+0.2);  o.start(n); o.stop(n+0.2); },
        ventDestroy: () => { o.type="square";   o.frequency.setValueAtTime(800,n); o.frequency.exponentialRampToValueAtTime(200,n+0.15); o.frequency.exponentialRampToValueAtTime(1000,n+0.25); o.frequency.exponentialRampToValueAtTime(100,n+0.4); g.gain.setValueAtTime(0.18,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.4); o.start(n); o.stop(n+0.4); },
        damage:      () => { o.type="square";   o.frequency.setValueAtTime(200,n); o.frequency.exponentialRampToValueAtTime(80,n+0.08);  g.gain.setValueAtTime(0.12,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.1);  o.start(n); o.stop(n+0.1); },
        transition:  () => { o.type="sine";     o.frequency.setValueAtTime(300,n); o.frequency.exponentialRampToValueAtTime(500,n+0.1);  g.gain.setValueAtTime(0.06,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.12); o.start(n); o.stop(n+0.12); },
      };

      if (presets[type]) presets[type]();
    } catch (e) { /* Graceful fail */ }
  },
};

export default SFX;
