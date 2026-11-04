/* ===== 소리: 음원 파일 없이 코드로 만든 배경음악과 효과음 ===== */
const NOTE_PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
function noteMidi(tok) {
  const m = /^([a-g])(#|b)?(\d)$/.exec(tok);
  if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function chordPc(ch) {
  const m = /^([A-G])(#|b)?(m?)/.exec(ch);
  const pc = (NOTE_PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  return { pc, minor: m[3] === 'm' };
}

const SONGS = {
  sail: { bpm: 112, lead: 'triangle', leadGain: .16, pad: .05, arp: 0, bassWave: 'triangle', bassGain: .2,
    bars: 'D G A D Bm G A D',
    bass: 'r . f . o . f .',
    melody: 'a4 d5 f#5 a5 - f#5 e5 d5 | b4 d5 g5 b5 - a5 g5 d5 | c#5 e5 a5 - g5 f#5 e5 . | f#5 - d5 - a4 - . . | b4 d5 f#5 b5 - a5 f#5 d5 | g5 - f#5 e5 d5 - b4 . | c#5 d5 e5 f#5 g5 f#5 e5 c#5 | d5 - - - . . . .',
    drums: { k: 'x...x...', s: '..x...x.', h: '.x.x.x.x' } },
  mystery: { bpm: 80, lead: 'sine', leadGain: .15, pad: .06, arp: .05, bassWave: 'sine', bassGain: .22,
    bars: 'Am F Dm E Am F G E',
    bass: 'r - - - f - - -',
    melody: 'e5 - - . c5 - d5 - | a4 - - - . . . . | f5 - e5 - d5 - c5 - | b4 - - - g#4 - - . | e5 - - . a5 - g5 - | f5 - - - e5 - c5 - | d5 - b4 - g4 - b4 - | e5 - - - - - . .',
    drums: { k: '', s: '', h: '' } },
  rush: { bpm: 138, lead: 'square', leadGain: .07, pad: .035, arp: 0, bassWave: 'sawtooth', bassGain: .08,
    bars: 'Em C D B Em C D B',
    bass: 'r r o r r r o r',
    melody: 'e5 . e5 g5 b5 . a5 g5 | e5 . e5 g5 c6 . b5 a5 | f#5 . f#5 a5 d6 . c6 a5 | b5 - a5 - g5 - f#5 - | e5 . e5 g5 b5 . a5 g5 | c6 . b5 a5 g5 . e5 . | d5 . f#5 a5 d6 . c6 a5 | b5 - - - d#5 - f#5 -',
    drums: { k: 'x...x.x.', s: '..x...x.', h: 'xxxxxxxx' } },
  boss: { bpm: 104, lead: 'square', leadGain: .075, pad: .05, arp: 0, bassWave: 'sawtooth', bassGain: .1,
    bars: 'Dm Bb C A Dm Gm A A',
    bass: 'r . r o r . r f',
    melody: 'd5 - - - f5 - e5 - | d5 - - - c5 - bb4 - | c5 - - - e5 - g5 - | a5 - - - - - . . | d6 - - - c6 - a5 - | bb5 - - - a5 - g5 - | a5 - g5 - f5 - e5 - | c#5 - - - e5 - a4 -',
    drums: { k: 'x..x..x.', s: '....x...', h: 'x.x.x.x.' } },
  ending: { bpm: 76, lead: 'triangle', leadGain: .17, pad: .06, arp: .035, bassWave: 'sine', bassGain: .22,
    bars: 'C G Am Em F C Dm G',
    bass: 'r - - - f - - -',
    melody: 'e5 - g5 - c6 - b5 a5 | b5 - - - g5 - - . | a5 - c6 - e6 - d6 c6 | b5 - - - g5 - - . | a5 - - - f5 - a5 - | g5 - - - e5 - c5 - | d5 - f5 - a5 - g5 f5 | e5 - - - d5 - - .',
    drums: { k: 'x.......', s: '', h: '' } },
};
for (const s of Object.values(SONGS)) {
  s.chords = s.bars.split(/\s+/).map(chordPc);
  const toks = s.melody.replace(/\|/g, ' ').trim().split(/\s+/);
  s.len = toks.length;
  s.events = [];
  toks.forEach((t, i) => {
    const m = noteMidi(t);
    if (m == null) return;
    let n = 1; while (toks[i + n] === '-') n++;
    s.events[i] = { m, n };
  });
  s.bassToks = s.bass.split(/\s+/);
}

const Sound = {
  ctx: null, master: null, music: null, sfxBus: null, delay: null, noise: null,
  song: null, songName: null, step: 0, nextT: 0, timer: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = PREF.muted ? 0 : 0.9; this.master.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.7; this.sfxBus.connect(this.master);
    this.delay = c.createDelay(1); this.delay.delayTime.value = 0.32;
    const fb = c.createGain(); fb.gain.value = 0.28; const dl = c.createGain(); dl.gain.value = 0.3;
    this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(dl); dl.connect(this.music);
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
  },
  setMuted(m) {
    PREF.muted = m; savePref();
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  },
  play(name) {
    if (!this.ctx) { this.pending = name; return; }
    if (this.songName === name) return;
    this.songName = name;
    const c = this.ctx, t = c.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setTargetAtTime(0, t, 0.25);
    clearInterval(this.timer);
    setTimeout(() => {
      if (this.songName !== name) return;
      this.song = SONGS[name] || null; this.step = 0; this.nextT = c.currentTime + 0.05;
      this.music.gain.setTargetAtTime(0.55, c.currentTime, 0.4);
      if (this.song) this.timer = setInterval(() => this.tick(), 30);
    }, 700);
  },
  stop() { this.songName = null; clearInterval(this.timer); if (this.music) this.music.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3); },
  tick() {
    const c = this.ctx, s = this.song;
    if (!s || c.state !== 'running') return;
    const dt = 60 / s.bpm / 2;
    while (this.nextT < c.currentTime + 0.15) {
      this.schedule(s, this.step, this.nextT, dt);
      this.nextT += dt; this.step = (this.step + 1) % s.len;
    }
  },
  osc(type, freq, t, dur, gain, dest, att = 0.01, rel = 0.08) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + att);
    g.gain.setValueAtTime(gain, Math.max(t + att, t + dur - rel));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest || this.music);
    o.start(t); o.stop(t + dur + 0.02);
    return { o, g };
  },
  noiseHit(t, dur, gain, type, freq, dest) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.music);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  },
  schedule(s, step, t, dt) {
    const bar = Math.floor(step / 8), pos = step % 8, ch = s.chords[bar % s.chords.length];
    const third = ch.minor ? 3 : 4;
    const padRoot = 55 + ((ch.pc - 7 + 12) % 12);
    if (pos === 0 && s.pad) {
      for (const iv of [0, third, 7]) {
        const n = this.osc('sine', mtof(padRoot + iv), t, dt * 8, s.pad, this.music, 0.4, 0.5);
        const n2 = this.osc('triangle', mtof(padRoot + iv + 12) * 1.003, t, dt * 8, s.pad * 0.35, this.music, 0.5, 0.6);
      }
    }
    if (s.arp) {
      const seq = [0, third, 7, 12, 7, third, 0, 7];
      this.osc('sine', mtof(padRoot + 12 + seq[pos]), t, dt * 0.9, s.arp, this.music, 0.005, dt * 0.8);
    }
    const bt = s.bassToks[pos];
    if (bt && bt !== '.' && bt !== '-') {
      let n = 1; while (s.bassToks[pos + n] === '-') n++;
      const root = 40 + ((ch.pc - 4 + 12) % 12);
      const m = root + (bt === 'f' ? 7 : bt === 'o' ? 12 : 0);
      this.osc(s.bassWave, mtof(m), t, dt * n * 0.95, s.bassGain, this.music, 0.01, 0.06);
    }
    const ev = s.events[step];
    if (ev) {
      const n = this.osc(s.lead, mtof(ev.m), t, dt * ev.n * 0.95, s.leadGain, this.music, 0.015, 0.08);
      n.g.connect(this.delay);
    }
    const d = s.drums;
    if (d.k && d.k[pos] === 'x') {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.2);
    }
    if (d.s && d.s[pos] === 'x') this.noiseHit(t, 0.14, 0.12, 'bandpass', 1800);
    if (d.h && d.h[pos] === 'x') this.noiseHit(t, 0.04, 0.05, 'highpass', 7000);
  },
  sfx(name) {
    if (!this.ctx || PREF.muted) return;
    const c = this.ctx, t = c.currentTime + 0.01, B = this.sfxBus;
    const o = (type, f, st, dur, g) => this.osc(type, f, t + st, dur, g, B, 0.005, Math.min(0.08, dur / 2));
    switch (name) {
      case 'tap': o('sine', 880, 0, 0.05, 0.12); break;
      case 'good': [0, 4, 7, 12].forEach((iv, i) => o('triangle', mtof(72 + iv), i * 0.07, 0.16, 0.2)); break;
      case 'bad': o('square', 220, 0, 0.14, 0.08); o('square', 165, 0.12, 0.2, 0.08); break;
      case 'card':
        [0, 7, 12, 16, 19, 24].forEach((iv, i) => o('sine', mtof(79 + iv), i * 0.05, 0.3, 0.1));
        o('triangle', mtof(67), 0, 0.6, 0.1); o('triangle', mtof(71), 0, 0.6, 0.08); break;
      case 'stamp': this.noiseHit(t, 0.18, 0.5, 'lowpass', 900, B); o('sine', 90, 0, 0.2, 0.4); break;
      case 'pop': this.noiseHit(t, 0.08, 0.4, 'highpass', 2500, B); o('sine', 600, 0, 0.05, 0.1); break;
      case 'whoosh': { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = this.noise; f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.2); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        s.connect(f); f.connect(g); g.connect(B); s.start(t); s.stop(t + 0.7); break; }
      case 'wave': { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = this.noise; s.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1200, t + 1); f.frequency.linearRampToValueAtTime(300, t + 2.2);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.9); g.gain.linearRampToValueAtTime(0.001, t + 2.4);
        s.connect(f); f.connect(g); g.connect(B); s.start(t); s.stop(t + 2.5); break; }
      case 'gull': for (let i = 0; i < 3; i++) { const x = c.createOscillator(), g = c.createGain(), st = t + i * 0.22;
        x.type = 'sine'; x.frequency.setValueAtTime(2000, st); x.frequency.exponentialRampToValueAtTime(1100, st + 0.16);
        g.gain.setValueAtTime(0.001, st); g.gain.linearRampToValueAtTime(0.09, st + 0.03); g.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
        x.connect(g); g.connect(B); x.start(st); x.stop(st + 0.2); } break;
      case 'roar': { const x = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        x.type = 'sawtooth'; x.frequency.setValueAtTime(160, t); x.frequency.exponentialRampToValueAtTime(60, t + 0.6);
        f.type = 'lowpass'; f.frequency.value = 900; g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        x.connect(f); f.connect(g); g.connect(B); x.start(t); x.stop(t + 0.75); this.noiseHit(t, 0.5, 0.25, 'lowpass', 700, B); break; }
      case 'beep': o('sine', 1000, 0, 0.09, 0.12); break;
      case 'clear': [0, 4, 7, 12, 16].forEach((iv, i) => o('triangle', mtof(67 + iv), i * 0.1, 0.35, 0.18)); o('triangle', mtof(79), 0.55, 0.8, 0.18); o('triangle', mtof(83), 0.55, 0.8, 0.14); break;
      case 'hit': this.noiseHit(t, 0.25, 0.45, 'lowpass', 1500, B); o('sawtooth', 110, 0, 0.25, 0.15); break;
      case 'ping': o('sine', 1320, 0, 0.35, 0.12); o('sine', 1980, 0.02, 0.3, 0.05); break;
      case 'lock': o('square', 400, 0, 0.04, 0.06); break;
      case 'open': o('triangle', 523, 0, 0.12, 0.15); o('triangle', 784, 0.1, 0.25, 0.15); this.noiseHit(t, 0.1, 0.2, 'highpass', 3000, B); break;
    }
  },
  /* 라디오 잡음: set(0~1)로 크기를 바꾼다. */
  staticNoise() {
    if (!this.ctx) return { set() { }, stop() { } };
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 0.6; g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(this.sfxBus); s.start();
    return { set: v => g.gain.setTargetAtTime(PREF.muted ? 0 : v * 0.18, c.currentTime, 0.05), stop: () => { try { s.stop(); } catch (e) { } } };
  },
};
document.addEventListener('pointerdown', () => Sound.init(), { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!Sound.ctx) return;
  if (document.hidden) Sound.ctx.suspend(); else Sound.ctx.resume();
});
