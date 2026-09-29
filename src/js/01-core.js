/* ===== 기본 도구, 화면 맞춤, 상태 저장 ===== */
const W = 1280, H = 720;
const APP = document.getElementById('app');
const L = {
  bg: document.getElementById('bg'), fx: document.getElementById('fx'), scene: document.getElementById('scene'),
  hidden: document.getElementById('hidden'), hud: document.getElementById('hud'), dialog: document.getElementById('dialog'),
  overlay: document.getElementById('overlay'), toast: document.getElementById('toast'),
};
let SCALE = 1;

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = sec => { sec = Math.max(0, Math.round(sec)); const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}분 ${s}초` : `${s}초`; };
const fmtNum = n => Number(n || 0).toLocaleString('ko-KR');
function onTap(node, fn) { node.addEventListener('click', e => { e.stopPropagation(); fn(e); }); return node; }

/* 화면 맞춤: 1280x720 무대를 화면 크기에 맞게 늘이고 줄인다. */
function fit() {
  const iw = window.innerWidth, ih = window.innerHeight;
  SCALE = Math.min(iw / W, ih / H);
  const x = (iw - W * SCALE) / 2, y = (ih - H * SCALE) / 2;
  APP.style.transform = `translate(${x}px,${y}px) scale(${SCALE})`;
  document.getElementById('rotate').classList.toggle('on', ih > iw * 1.1 && !document.activeElement?.matches?.('input'));
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));
function toLocal(e) {
  const r = APP.getBoundingClientRect();
  return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE };
}

/* 저장소 (저장이 막혀 있어도 게임은 돌아가야 한다) */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
const KEY = { save: 'dokdoTP.save.v1', best: 'dokdoTP.best.v1', queue: 'dokdoTP.queue.v1', pref: 'dokdoTP.pref.v1', me: 'dokdoTP.me.v1' };
const PREF = Object.assign({ muted: false }, store.get(KEY.pref, {}));
const savePref = () => store.set(KEY.pref, PREF);

let S = null; // 진행 상태
function newState(player, attempt = 1) {
  return {
    v: 1, player, attempt, runId: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    stage: 0, step: 0, playMs: 0, score: 0, combo: 0, maxCombo: 0,
    cards: {}, cardOrder: [], boarded: {}, clues: {}, seals: {}, badges: {}, mistakes: {}, stars: {}, stageMiss: {}, era: '',
    names: {}, skipped: false, teacher: false, finished: false, submitted: false, expl: [null, null, null], boardMiss: 0,
    bonus: 0,
  };
}
function save() { if (S) store.set(KEY.save, S); }
function loadSave() { const s = store.get(KEY.save, null); return s && s.v === 1 && s.player ? s : null; }

/* 플레이 시간은 화면이 켜져 있을 때만 잰다. */
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now(), d = Math.min(now - lastTick, 5000);
  lastTick = now;
  if (S && S.running && !S.finished && !document.hidden) S.playMs += d;
}, 1000);
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => { lastTick = performance.now(); if (document.hidden) save(); });

/* 점수 */
function floatText(txt, x = 640, y = 330, neg = false) {
  const f = el('div', { class: 'float' + (neg ? ' neg' : ''), text: txt, style: { left: x + 'px', top: y + 'px' } });
  L.toast.append(f);
  setTimeout(() => f.remove(), 1300);
}
function addScore(n, x, y) {
  if (!S || !n) return;
  S.score = Math.max(0, S.score + n);
  if (x != null) floatText((n > 0 ? '+' : '') + n, x, y, n < 0);
  HUD.update();
}
/* 도전 과제 성공: 몇 번 만에 풀었는지에 따라 점수를 준다. */
function award(key, tries = 1, base, x, y) {
  clearHint();
  if (base == null) base = CH[key] || 100;
  const rate = tries <= 1 ? 1 : tries === 2 ? 0.6 : tries === 3 ? 0.3 : 0.1;
  let pts = Math.round(base * rate);
  if (tries <= 1) {
    S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo);
    const bonus = Math.min(S.combo - 1, 5) * 10;
    if (bonus > 0) { pts += bonus; S.bonus += bonus; }
  } else S.combo = 0;
  addScore(pts, x, y);
  return pts;
}
function miss(x, y) {
  S.combo = 0;
  S.mistakes[S.stage] = (S.mistakes[S.stage] || 0) + 1;
  Sound.sfx('bad');
  HUD.update();
}
function gradeOf(score) {
  const p = score / MAX_SCORE;
  return p >= 0.85 ? 'S' : p >= 0.7 ? 'A' : p >= 0.5 ? 'B' : 'C';
}

/* 테스트용: 지금 열린 미니게임을 바로 풀게 한다. */
const DEV = { solve: null };
window.__dokdo = { get state() { return S; }, solve() { const f = DEV.solve; DEV.solve = null; if (f) f(); return !!f; } };
