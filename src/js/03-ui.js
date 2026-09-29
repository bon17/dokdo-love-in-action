/* ===== 화면 장치: 배경, HUD, 대사, 힌트, 창, 증거 카드, 도감 ===== */
const img = k => IMG[k] || '';

/* 배경 */
const BG = { cur: null, idx: 0 };
function setBg(key, filter) {
  const layers = L.bg.querySelectorAll('.bgl');
  if (BG.cur === key && !filter) return;
  BG.cur = key;
  BG.idx = 1 - BG.idx;
  const l = layers[BG.idx];
  l.style.backgroundImage = key ? `url(${img(key)})` : 'none';
  l.style.backgroundColor = key ? '' : '#0d2238';
  l.style.filter = filter || '';
  l.classList.add('on');
  layers[1 - BG.idx].classList.remove('on');
}
/* 안개 효과: 0이면 없음, 1이면 짙음 */
function fogFx(level = 0) {
  L.fx.innerHTML = '';
  if (!level) return;
  for (let i = 0; i < 5; i++) {
    const d = el('div', { style: `position:absolute;left:${-400 + i * 330}px;top:${80 + (i % 3) * 180}px;width:900px;height:420px;border-radius:50%;
      background:radial-gradient(closest-side,rgba(230,236,244,${0.55 * level}),rgba(230,236,244,0));
      animation:fogdrift ${16 + i * 3}s linear infinite alternate` });
    L.fx.append(d);
  }
}
document.head.append(el('style', { text: '@keyframes fogdrift{from{transform:translateX(-120px)}to{transform:translateX(160px)}}' }));

function clearScene() { L.scene.innerHTML = ''; DEV.solve = null; }

/* HUD */
const HUD = {
  build() {
    L.hud.innerHTML = '';
    const bar = el('div', { class: 'hud-bar' });
    this.stageEl = el('div', { class: 'hud-stage' });
    this.dokdo = el('div', { class: 'hud-dokdo', html: dokdoSvg() });
    this.barFill = el('i');
    this.pct = el('div', { class: 'pct' });
    const meter = el('div', { class: 'hud-meter', title: '되찾은 독도 기록' }, this.dokdo, el('div', { class: 'bar' }, this.barFill), this.pct);
    this.combo = el('div', { class: 'hud-combo' });
    this.score = el('div', { class: 'hud-score' });
    const book = onTap(el('button', { class: 'hud-btn book', html: '📖 도감' }), () => { Sound.sfx('tap'); openBook(); });
    this.mute = onTap(el('button', { class: 'hud-btn' }), () => { Sound.setMuted(!PREF.muted); this.update(); });
    const fs = onTap(el('button', { class: 'hud-btn', text: '⛶', title: '전체 화면' }), toggleFullscreen);
    const menu = onTap(el('button', { class: 'hud-btn', text: '☰' }), () => { Sound.sfx('tap'); openMenu(); });
    bar.append(this.stageEl, meter, el('div', { class: 'hud-sp' }), this.combo, this.score, book, this.mute, fs, menu);
    L.hud.append(bar);
    this.tTag = el('div', { class: 'teacher-tag hide', text: '교사 모드 · 기록 저장 안 함' });
    L.hud.append(this.tTag);
    this.update();
  },
  show(v) { L.hud.style.display = v ? '' : 'none'; },
  update() {
    if (!this.score || !S) return;
    this.stageEl.textContent = S.stage >= 1 && S.stage <= 8 ? `${S.stage}. ${STAGE_NAMES[S.stage]}` : STAGE_NAMES[S.stage] || '';
    this.score.textContent = fmtNum(S.score) + '점';
    this.combo.textContent = S.combo >= 2 ? `콤보 ×${S.combo}` : '';
    const n = Object.keys(S.cards).length, p = n / CARDS.length;
    this.barFill.style.width = (p * 100) + '%';
    this.pct.textContent = Math.round(p * 100) + '%';
    this.dokdo.style.filter = `blur(${((1 - p) * 3.2).toFixed(1)}px)`;
    this.dokdo.style.opacity = (0.35 + 0.65 * p).toFixed(2);
    this.mute.textContent = PREF.muted ? '🔇' : '🔊';
    this.tTag.classList.toggle('hide', !S.teacher);
  },
};
function dokdoSvg(w = 64, h = 40) {
  return `<svg viewBox="0 0 64 40" width="${w}" height="${h}"><path d="M2 36 L10 30 L16 12 L22 8 L27 18 L30 30 L34 36 Z" fill="#6fb38a" stroke="#2c5c44" stroke-width="1.5"/>
  <path d="M30 36 L36 28 L42 16 L48 14 L54 24 L58 32 L62 36 Z" fill="#7cc29a" stroke="#2c5c44" stroke-width="1.5"/>
  <path d="M0 36 Q16 33 32 36 T64 36 L64 40 L0 40 Z" fill="#3d8fd1"/></svg>`;
}
function toggleFullscreen() {
  const d = document;
  try {
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      const r = d.documentElement;
      const p = (r.requestFullscreen || r.webkitRequestFullscreen).call(r);
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
    } else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { }
}

/* 대사 */
const SPK = {
  narr: { name: '', narr: true },
  gaji: { name: '가지', img: 'gaji-default' },
  'gaji:sad': { name: '가지', img: 'gaji-sad' },
  'gaji:wow': { name: '가지', img: 'gaji-surprised' },
  'gaji:yay': { name: '가지', img: 'gaji-cheer' },
  ahn: { name: '안용복', img: 'char-anyongbok' },
  fog: { name: '망각의 안개', img: 'fog', color: 'purple' },
  isabu: { name: '이사부', ini: '이', color: 'blue' },
  jp: { name: '돗토리번 관리', ini: '관', color: 'gray' },
  fisher: { name: '일본 어부', ini: '어', color: 'gray' },
  lee: { name: '이규원', ini: '이', color: 'blue' },
  shim: { name: '심흥택', ini: '심', color: 'blue' },
  guard: { name: '독도경비대원', ini: '경', color: 'blue' },
  keeper: { name: '등대관리원', ini: '등', color: 'green' },
  officer: { name: '독도관리사무소 직원', ini: '관', color: 'green' },
  resident: { name: '독도 주민', ini: '주', color: 'green' },
  tourist: { name: '관람객', ini: '관', color: 'gray' },
  kid: { name: '어린이 관람객', ini: '어', color: 'gray' },
  student: { name: '학생 관람객', ini: '학', color: 'gray' },
  editor: { name: '편집장', ini: '편', color: 'red' },
  me: { name: '나', ini: '나', color: 'red' },
};
let dlgBusy = false;
function dialogBox(who, text) {
  const sp = typeof who === 'string' ? (SPK[who] || { name: who }) : who;
  const box = el('div', { class: 'dlg' + (sp.narr ? ' narr noportrait' : '') + (!sp.img && !sp.ini && !sp.narr ? ' noportrait' : '') });
  if (sp.img) box.append(el('div', { class: 'pt' }, el('img', { src: img(sp.img), alt: '' })));
  else if (sp.ini) box.append(el('div', { class: 'pt' }, el('div', { class: 'ini', text: sp.ini, style: sp.color ? `background:${{ blue: '#2b7bd6', gray: '#6d7b8c', red: '#b5463a', green: '#2e9e6a', purple: '#6a4fb3' }[sp.color]}` : '' })));
  if (sp.name) box.append(el('div', { class: 'who' + (sp.color ? ' c-' + sp.color : ''), text: sp.name }));
  const txt = el('div', { class: 'txt' });
  box.append(txt);
  return { box, txt };
}
function typeText(node, text) {
  let i = 0, done = false, timer;
  const full = String(text);
  const finish = () => { if (done) return; done = true; clearInterval(timer); node.textContent = full; };
  timer = setInterval(() => { i += 1; node.textContent = full.slice(0, i); if (i >= full.length) finish(); }, 26);
  return { finish, get done() { return done; } };
}
function say(who, text) {
  return new Promise(resolve => {
    L.dialog.innerHTML = '';
    const catcher = el('div', { class: 'catcher' });
    const { box, txt } = dialogBox(who, text);
    const more = el('div', { class: 'more', text: '▼' });
    L.dialog.append(catcher, box);
    const tw = typeText(txt, text);
    dlgBusy = true;
    const adv = e => {
      if (e) e.stopPropagation();
      if (!tw.done) { tw.finish(); box.append(more); return; }
      Sound.sfx('tap');
      L.dialog.innerHTML = ''; dlgBusy = false;
      document.removeEventListener('keydown', key);
      resolve();
    };
    const key = e => { if (e.key === ' ' || e.key === 'Enter') adv(e); };
    catcher.addEventListener('click', adv); box.addEventListener('click', adv);
    document.addEventListener('keydown', key);
    const chk = setInterval(() => { if (tw.done) { clearInterval(chk); if (!more.isConnected && box.isConnected) box.append(more); } }, 100);
  });
}
async function talk(lines) { for (const [w, t] of lines) await say(w, t); }
/* 선택지 대사: 고른 번호를 돌려준다. */
function choose(who, text, options, { shuffleOpts = true } = {}) {
  return new Promise(resolve => {
    L.dialog.innerHTML = '';
    const { box, txt } = dialogBox(who, text);
    const catcher = el('div', { class: 'catcher' });
    const wrap = el('div', { class: 'choices' });
    const order = shuffleOpts ? shuffle(options.map((o, i) => i)) : options.map((o, i) => i);
    L.dialog.append(catcher, box);
    const tw = typeText(txt, text);
    let shown = false, done = false, timer = 0;
    const finish = i => {
      if (done) return;
      done = true; clearTimeout(timer); DEV.solve = null;
      L.dialog.innerHTML = ''; resolve(i);
    };
    const showOpts = () => {
      tw.finish();
      if (shown || done) return;
      shown = true;
      for (const i of order) wrap.append(onTap(el('button', { class: 'choice', text: options[i] }), () => { Sound.sfx('tap'); finish(i); }));
      L.dialog.append(wrap);
      DEV.solve = () => finish(0);
    };
    catcher.addEventListener('click', showOpts); box.addEventListener('click', showOpts);
    timer = setTimeout(showOpts, Math.min(2200, 26 * text.length + 200));
  });
}

/* 힌트 말풍선 (화면을 막지 않음) */
let hintTimer;
function hint(text, mood = 'gaji', ms = 6500) {
  const old = L.toast.querySelector('.hint'); if (old) old.remove();
  clearTimeout(hintTimer);
  const face = { gaji: 'gaji-default', sad: 'gaji-sad', wow: 'gaji-surprised', yay: 'gaji-cheer' }[mood] || 'gaji-default';
  const h = el('div', { class: 'hint' }, el('img', { src: img(face) }), el('div', { class: 'b', text }));
  L.toast.append(h);
  hintTimer = setTimeout(() => h.remove(), ms);
}
function clearHint() { const h = L.toast.querySelector('.hint'); if (h) h.remove(); }
function toast(text, ms = 2600) {
  let box = L.toast.querySelector('.toasts');
  if (!box) { box = el('div', { class: 'toasts' }); L.toast.append(box); }
  const t = el('div', { class: 'toastmsg', text });
  box.append(t); setTimeout(() => t.remove(), ms);
}
/* 틀렸을 때 공통 흐름: 1번째는 격려, 2번째는 힌트, 3번째부터는 함께 발견 */
function wrongFeedback(tries, hintText, soft = '음… 다시 한번 살펴볼까?') {
  miss();
  if (tries >= 3) return true;
  hint(tries >= 2 ? hintText : soft, tries >= 2 ? 'gaji' : 'wow');
  return false;
}

/* 창 */
function modal(content, { closable = true, dim = true, onClose } = {}) {
  const wrap = el('div', { class: 'modal' });
  if (dim) wrap.append(el('div', { class: 'dim' }));
  const box = el('div', { class: 'box' }, content);
  wrap.append(box);
  let resolveFn;
  const done = new Promise(r => resolveFn = r);
  const close = v => { wrap.remove(); if (onClose) onClose(v); resolveFn(v); };
  if (closable) box.append(onTap(el('button', { class: 'xbtn', text: '✕' }), () => { Sound.sfx('tap'); close(); }));
  L.overlay.append(wrap);
  return { wrap, box, close, done };
}

/* 옛 문서 보기. pick이 있으면 중요한 문장을 눌러 찾아야 한다. rub가 있으면 문질러서 글자를 되살린다. */
function showDoc({ title, era, lines, ask, pick, rub, btn = '다 읽었어', key }) {
  return new Promise(resolve => {
    const doc = el('div', { class: 'doc paper' });
    doc.append(el('div', { class: 'dt', text: title }));
    if (era) doc.append(el('div', { class: 'de', text: era }));
    const body = el('div', { class: rub ? 'rubwrap' : '' });
    const lineEls = lines.map((ln, i) => {
      const o = typeof ln === 'string' ? { t: ln } : ln;
      const e = el('div', { class: 'dl' + (o.note ? ' note' : '') + (o.head ? ' head' : '') + (pick && !o.note && !o.head ? ' pick' : ''), text: o.t });
      body.append(e); return e;
    });
    doc.append(body);
    if (ask) doc.append(el('div', { class: 'ask', text: ask }));
    const foot = el('div', { class: 'dfoot' });
    doc.append(foot);
    const m = modal(doc, { closable: false });
    const finish = v => { m.close(); resolve(v); };
    const showBtn = () => {
      if (foot.children.length) return;
      foot.append(onTap(el('button', { class: 'btn blue', text: btn }), () => { Sound.sfx('tap'); finish(true); }));
    };
    if (pick) {
      let tries = 0; const found = new Set();
      const need = pick.correct.length;
      const complete = () => { DEV.solve = null; award(key || pick.key, tries + 1 > 1 ? tries + 1 : 1); setTimeout(showBtn, 300); };
      lineEls.forEach((e, i) => {
        if (lines[i].note || lines[i].head) return;
        onTap(e, () => {
          if (found.size >= need) return;
          if (pick.correct.includes(i)) {
            if (found.has(i)) return;
            found.add(i); e.classList.add('good'); Sound.sfx('good');
            if (found.size >= need) complete();
          } else {
            tries++; e.classList.remove('bad'); void e.offsetWidth; e.classList.add('bad');
            const giveUp = wrongFeedback(tries, pick.hint);
            if (giveUp) {
              pick.correct.forEach(j => { found.add(j); lineEls[j].classList.add('good'); });
              hint(pick.reveal || '같이 찾아보자. 바로 이 문장이야!', 'gaji');
              complete();
            }
          }
        });
      });
      DEV.solve = () => { pick.correct.forEach(j => { found.add(j); lineEls[j].classList.add('good'); }); complete(); };
    } else if (rub) {
      requestAnimationFrame(() => setupRub(body, () => { showBtn(); }));
      DEV.solve = () => { const c = body.querySelector('canvas'); if (c) c.remove(); showBtn(); };
    } else showBtn();
  });
}
/* 문질러서 흐려진 글자 되살리기 */
function setupRub(wrap, onDone) {
  const w = wrap.offsetWidth, h = Math.max(wrap.offsetHeight, 60);
  const cv = el('canvas', { width: w, height: h });
  wrap.append(cv);
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, '#e9e4da'); grd.addColorStop(1, '#d9d3c8');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(160,150,140,.35)';
  for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 0, 7); g.fill(); }
  g.fillStyle = '#8a7f72'; g.font = '22px RIDIBatang, serif'; g.textAlign = 'center';
  g.fillText('☝ 손가락으로 문질러 흐려진 글자를 되살려 봐!', w / 2, h / 2);
  g.globalCompositeOperation = 'destination-out';
  let down = false, last = null, strokes = 0, done = false;
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / SCALE, y: (e.clientY - r.top) / SCALE }; };
  const rubAt = p => {
    g.lineWidth = 56; g.lineCap = 'round';
    g.beginPath(); g.moveTo((last || p).x, (last || p).y); g.lineTo(p.x, p.y); g.stroke();
    last = p; strokes++;
    if (strokes % 12 === 0) check();
  };
  const check = () => {
    if (done) return;
    const d = g.getImageData(0, 0, w, h).data; let clear = 0, tot = 0;
    for (let i = 3; i < d.length; i += 64) { tot++; if (d[i] < 40) clear++; }
    if (clear / tot > 0.5) {
      done = true; cv.style.transition = 'opacity .6s'; cv.style.opacity = 0;
      setTimeout(() => cv.remove(), 650); Sound.sfx('ping'); onDone();
    }
  };
  cv.addEventListener('pointerdown', e => { down = true; last = null; cv.setPointerCapture(e.pointerId); rubAt(pos(e)); });
  cv.addEventListener('pointermove', e => { if (down) rubAt(pos(e)); });
  cv.addEventListener('pointerup', () => { down = false; check(); });
}

/* 증거 카드 */
function cardEl(c, { mini = false, borrowed = false, locked = false } = {}) {
  const e = el('div', { class: `card ${c.rar}${mini ? ' mini' : ''}${borrowed ? ' borrowed' : ''}${locked ? ' locked' : ''}` });
  if (locked) {
    e.append(el('div', { class: 'ctop', text: '?' }), el('div', { class: 'cname', text: '???' }), el('div', { class: 'ctext', text: `${c.st}단계에서 찾을 수 있어요.` }));
    return e;
  }
  e.append(el('div', { class: 'ctop ' + c.cat }, c.ico, el('span', { class: 'cyear', text: c.year }), el('span', { class: 'crar', text: RARITY[c.rar].name })));
  e.append(el('div', { class: 'cname', text: c.name }));
  e.append(el('div', { class: 'ccat ' + c.cat, text: CAT[c.cat].name }));
  e.append(el('div', { class: 'ctext', text: c.text }));
  return e;
}
function hasCard(id) { return !!(S && S.cards[id]); }
function getCard(id) {
  return new Promise(resolve => {
    const c = CARD[id];
    if (!c || S.cards[id]) return resolve();
    S.cards[id] = true; S.cardOrder.push(id);
    Sound.sfx('card');
    setTimeout(() => Sound.sfx('stamp'), 500);
    const big = cardEl(c);
    big.append(el('div', { class: 'csrc', text: '출처: ' + c.src }));
    const wrap = el('div', { class: 'getcard' }, el('div', { class: 'label', text: c.rar === 'l' ? '✨ 전설 증거 발견! ✨' : '증거 발견!' }), big,
      el('div', { class: 'stampfx', html: '증거<br>확보' }));
    const m = modal(wrap, { closable: false });
    const btn = onTap(el('button', { class: 'btn green', text: '증거 도감에 넣기' }), () => { Sound.sfx('tap'); m.close(); resolve(); });
    wrap.append(btn);
    addScore(RARITY[c.rar].pts, 640, 120);
    HUD.update(); save();
    DEV.solve = () => { m.close(); resolve(); };
  });
}
function openCard(c, borrowed) {
  const big = cardEl(c, { borrowed });
  big.style.width = '380px'; big.style.height = '520px';
  big.querySelector('.ctext').style.fontSize = '19px';
  big.append(el('div', { class: 'csrc', text: '출처: ' + c.src, style: 'font:15px var(--body);color:#8a7a68;padding:8px 14px;margin-top:auto' }));
  modal(big);
}

/* 노래 단서 풀기 */
async function solveClue(id) {
  if (!S.clues[id] || S.clues[id] === 'solved') { if (!S.clues[id]) S.clues[id] = 'found'; else return; }
  S.clues[id] = 'solved';
  const c = CLUE[id];
  Sound.sfx('ping');
  const box = el('div', { class: 'panel', style: 'width:760px;padding:28px 34px;text-align:center' },
    el('div', { style: 'font:24px var(--ui);color:#ffd9a8', text: '🎵 노래 단서가 풀렸다!' }),
    el('div', { style: 'font:30px var(--ui);margin:12px 0', text: `"${c.radio}"` }),
    el('div', { class: 'msg', style: 'font-size:22px', text: c.solved }));
  const m = modal(box, { closable: false });
  addScore(CLUE_PTS, 640, 200);
  box.append(el('div', { style: 'margin-top:18px' }, onTap(el('button', { class: 'btn', text: '수첩에 적기' }), () => { Sound.sfx('tap'); m.close(); })));
  DEV.solve = () => m.close();
  await m.done;
  if (CLUES.every(x => S.clues[x.id] === 'solved')) giveBadge('song');
  save();
}
function giveBadge(id) {
  if (!S || S.badges[id]) return;
  S.badges[id] = true;
  const b = BADGES.find(x => x.id === id);
  toast(`${b.ico} 업적 달성: ${b.name}`, 3000);
  Sound.sfx('ping');
}

/* 숨은 강치 */
function sealSvg() {
  return `<svg viewBox="0 0 52 40" width="52" height="40"><ellipse cx="24" cy="27" rx="19" ry="10" fill="#6b5a4d"/><circle cx="40" cy="17" r="9" fill="#6b5a4d"/>
  <circle cx="43" cy="15" r="1.8" fill="#111"/><circle cx="48" cy="19" r="1.4" fill="#222"/><path d="M6 30 L0 24 L2 36 Z" fill="#5b4a3e"/><path d="M26 34 L32 40 L20 39 Z" fill="#5b4a3e"/></svg>`;
}
function placeSeal(stage) {
  L.hidden.innerHTML = '';
  if (!SEAL_POS[stage] || S.seals[stage]) return;
  const [x, y] = SEAL_POS[stage];
  const s = el('div', { class: 'hseal', html: sealSvg(), style: { left: (x - 26) + 'px', top: (y - 20) + 'px' } });
  onTap(s, () => {
    s.remove(); S.seals[stage] = true; Sound.sfx('ping'); addScore(SEAL_PTS, x, y);
    toast(`🦭 숨은 강치를 찾았다! (${Object.keys(S.seals).length}/8)`);
    if (Object.keys(S.seals).length >= 8) giveBadge('seals');
    save();
  });
  L.hidden.append(s);
}

/* 증거 보드: 단계에서 새로 모은 카드를 세 가지 근거로 나눈다. */
function evidenceBoard(stage) {
  return new Promise(resolve => {
    const ids = CARDS.filter(c => c.st === stage && S.cards[c.id] && !S.boarded[c.id]).map(c => c.id);
    if (!ids.length) return resolve();
    const root = el('div', { class: 'panel', style: 'width:1180px;height:600px;padding:18px 24px;position:relative' });
    root.append(el('div', { style: 'font:30px var(--ui);text-align:center', text: '증거 보드: 새로 찾은 증거를 분류해 봐!' }),
      el('div', { style: 'font:19px var(--body);text-align:center;color:#bcd3ea;margin:4px 0 12px', text: '카드를 누른 다음, 알맞은 근거 칸을 눌러 줘.' }));
    const tray = el('div', { style: 'display:flex;gap:12px;justify-content:center;min-height:200px;flex-wrap:wrap' });
    const bins = el('div', { style: 'display:flex;gap:16px;margin-top:14px' });
    root.append(tray, bins);
    const m = modal(root, { closable: false });
    let sel = null, left = ids.length;
    const tries = {};
    const binEls = {};
    for (const k of ['hist', 'geo', 'law']) {
      const b = el('div', { class: 'slot', style: `flex:1;height:230px;flex-direction:column;justify-content:flex-start;padding-top:10px;border-color:var(--${k})` },
        el('div', { style: `font:25px var(--ui);color:#fff;background:var(--${k});padding:4px 16px;border-radius:12px`, text: CAT[k].name }),
        el('div', { style: 'font:17px var(--body);color:#dfe9f5;margin:6px 0', text: CAT[k].desc }),
        el('div', { class: 'bincards', style: 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center' }));
      binEls[k] = b; bins.append(b);
      onTap(b, () => {
        if (!sel) { hint('먼저 위에서 카드를 하나 골라 줘!'); return; }
        const c = CARD[sel.dataset.id];
        const ok = k === c.cat || (c.alt || []).includes(k);
        if (ok) {
          Sound.sfx('good');
          addScore(tries[c.id] ? BOARD_PTS / 2 : BOARD_PTS, 640, 300);
          S.boarded[c.id] = k;
          sel.remove();
          b.querySelector('.bincards').append(el('div', { style: 'font:16px var(--ui);background:#fff;color:#333;padding:3px 10px;border-radius:8px', text: c.name }));
          sel = null; left--;
          if (!left) setTimeout(() => { m.close(); save(); resolve(); }, 700);
        } else {
          tries[c.id] = (tries[c.id] || 0) + 1; S.boardMiss++;
          Sound.sfx('bad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          hint(`"${c.name}"은(는) ${c.cat === 'geo' ? '위치나 자연' : c.cat === 'hist' ? '옛 기록이나 사건' : '법령, 조약, 지금의 관리'}에 대한 증거 같지 않아? 카드 내용을 다시 읽어 봐.`);
        }
      });
    }
    for (const id of ids) {
      const c = cardEl(CARD[id], { mini: true }); c.dataset.id = id; c.style.cursor = 'pointer';
      onTap(c, () => { Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = c; c.classList.add('sel'); });
      tray.append(c);
    }
    DEV.solve = () => { for (const id of ids) S.boarded[id] = CARD[id].cat; m.close(); resolve(); };
  });
}

/* 단계 시작: 미션 한 줄 */
function missionCard(stage) {
  return new Promise(resolve => {
    Sound.sfx('ping');
    const box = el('div', { class: 'panel popin', style: 'width:760px;padding:30px 36px;text-align:center' },
      el('div', { style: 'font:24px var(--ui);color:#bcd3ea', text: `${stage}단계` }),
      el('div', { style: 'font:44px var(--ui);margin:4px 0 16px', text: `「${STAGE_NAMES[stage]}」` }),
      el('div', { style: 'font:30px var(--ui);color:#ffd166', text: `🎯 미션: ${MISSIONS[stage]}` }));
    const m = modal(box, { closable: false });
    box.append(el('div', { style: 'margin-top:22px' }, onTap(el('button', { class: 'btn', text: '시작!' }), () => { Sound.sfx('tap'); m.close(); resolve(); })));
    DEV.solve = () => { m.close(); resolve(); };
  });
}

/* 단계 마무리 */
async function stageClear(stage) {
  const mis = S.mistakes[stage] || 0;
  const stars = mis <= 1 ? 3 : mis <= 4 ? 2 : 1;
  S.stars[stage] = stars;
  if (mis === 0) giveBadge('nomiss');
  Sound.sfx('clear');
  const box = el('div', { class: 'panel popin', style: 'width:640px;padding:30px;text-align:center' },
    el('div', { style: 'font:26px var(--ui);color:#bcd3ea', text: `${stage}단계` }),
    el('div', { style: 'font:44px var(--ui);margin:4px 0 10px', text: `「${STAGE_NAMES[stage]}」 완료!` }),
    el('div', { style: 'font:64px;letter-spacing:10px', text: '★'.repeat(stars) + '☆'.repeat(3 - stars) }),
    el('div', { style: 'font:22px var(--body);color:#dfe9f5;margin-top:10px', text: `지금까지 모은 증거 ${Object.keys(S.cards).length}장 · 점수 ${fmtNum(S.score)}점` }));
  const m = modal(box, { closable: false });
  box.append(el('div', { style: 'margin-top:20px' }, onTap(el('button', { class: 'btn', text: stage < 8 ? '다음 시대로 출발!' : '계속' }), () => { Sound.sfx('tap'); m.close(); })));
  DEV.solve = () => m.close();
  await m.done;
}

/* 증거 도감 */
function openBook(tab = 'cards') {
  const root = el('div', { class: 'bookpanel panel' });
  const tabs = el('div', { class: 'tabs' });
  const body = el('div', { class: 'body' });
  root.append(el('div', { style: 'font:30px var(--ui);margin-bottom:8px', text: '📖 증거 도감' }), tabs, body);
  const m = modal(root);
  const TABS = [['cards', '증거 카드'], ['clues', '노래 단서 수첩'], ['names', '이름 도감'], ['badges', '업적 배지']];
  const render = t => {
    tabs.innerHTML = ''; body.innerHTML = '';
    for (const [k, n] of TABS) tabs.append(onTap(el('button', { class: 'tab' + (k === t ? ' on' : ''), text: n }), () => { Sound.sfx('tap'); render(k); }));
    if (t === 'cards') {
      const n = Object.keys(S.cards).length;
      body.append(el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin-bottom:10px', text: `모은 증거 ${n} / ${CARDS.length}장 · 카드를 누르면 크게 볼 수 있어요.` }));
      for (let st = 1; st <= 7; st++) {
        body.append(el('div', { style: 'font:22px var(--ui);margin:10px 0 8px;color:#ffd9a8', text: `${st}단계 · ${STAGE_NAMES[st]}` }));
        const g = el('div', { class: 'grid' });
        for (const c of CARDS.filter(x => x.st === st)) {
          const own = S.cards[c.id];
          const ce = cardEl(c, { mini: true, locked: !own });
          if (own) onTap(ce, () => { Sound.sfx('tap'); openCard(c); });
          g.append(ce);
        }
        body.append(g);
      }
    } else if (t === 'clues') {
      body.append(el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin-bottom:10px', text: '우산호 라디오에서 모은 「독도는 우리 땅」 속 단서예요. 증거를 찾으면 하나씩 풀려요.' }));
      CLUES.forEach((c, i) => {
        const s = S.clues[c.id];
        body.append(el('div', { class: 'clue' + (s === 'solved' ? ' solved' : '') }, el('div', { class: 'n', text: s === 'solved' ? '✓' : i + 1 }),
          el('div', {}, el('div', { class: 't1', text: s ? `♪ ${c.radio}` : '♪ 아직 수신하지 못한 단서' }),
            el('div', { class: 't2', text: s === 'solved' ? c.solved : s ? `${c.st}단계에서 풀 수 있을 것 같아. (${c.topic})` : '' }))));
      });
    } else if (t === 'names') {
      body.append(el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin-bottom:10px', text: '같은 섬도 시대와 나라에 따라 이름이 달랐어요. 이름이 헷갈리면 여기를 보세요.' }));
      const tb = el('table', { class: 'names' }, el('tr', {}, el('th', { text: '누가 · 언제' }), el('th', { text: '울릉도를 부른 이름' }), el('th', { text: '독도를 부른 이름' })));
      for (const n of NAMES) {
        const open = S.names[n.key] || S.stage > n.unlock || S.finished;
        tb.append(el('tr', {}, el('td', { text: n.era }), el('td', { class: open ? '' : 'lock', text: open ? n.ul : '???' }), el('td', { class: open ? '' : 'lock', text: open ? n.dk : `${n.unlock}단계에서 열려요` })));
      }
      body.append(tb);
    } else {
      body.append(el('div', {}, ...BADGES.map(b => el('div', { class: 'badge' + (S.badges[b.id] ? '' : ' off'), style: 'font-size:20px;padding:10px 16px' }, `${b.ico} ${b.name}`, el('span', { style: 'font:16px var(--body);color:#cfe0f0;margin-left:6px', text: b.desc })))));
      body.append(el('div', { style: 'margin-top:18px;font:20px var(--body);color:#dfe9f5', text: `숨은 강치 ${Object.keys(S.seals).length} / 8마리 · 최고 콤보 ${S.maxCombo}` }));
    }
  };
  render(tab);
  return m.done;
}
function unlockName(key) { S.names[key] = true; }

/* 메뉴 */
function openMenu() {
  const box = el('div', { class: 'panel', style: 'width:560px;padding:30px;display:flex;flex-direction:column;gap:16px;align-items:stretch' });
  box.append(el('div', { style: 'font:32px var(--ui);text-align:center', text: '메뉴' }));
  const m = modal(box);
  const p = S && S.player;
  if (p) box.append(el('div', { style: 'text-align:center;font:20px var(--body);color:#bcd3ea', text: `${p.grade}학년 ${p.cls}반 ${p.name} 대원 · 플레이 ${fmtTime(S.playMs / 1000)}` }));
  box.append(onTap(el('button', { class: 'btn blue', text: '계속하기' }), () => m.close()));
  if (S && !S.finished && S.stage < 8) box.append(onTap(el('button', { class: 'btn', text: '🔑 비밀번호 입력' }), () => { m.close(); askPasscode(); }));
  box.append(onTap(el('button', { class: 'btn gray', text: '⛶ 전체 화면' }), () => { toggleFullscreen(); m.close(); }));
  box.append(onTap(el('button', { class: 'btn gray', text: '처음 화면으로 (새로 시작)' }), async () => {
    m.close();
    if (await confirmBox('지금까지의 진행을 지우고 처음부터 새로 시작할까요?\n(다른 친구가 이 태블릿을 쓸 때 눌러요)')) { store.del(KEY.save); location.reload(); }
  }));
}
function confirmBox(text, yes = '네', no = '아니요') {
  return new Promise(res => {
    const box = el('div', { class: 'panel', style: 'width:620px;padding:30px;text-align:center' }, el('div', { class: 'msg', style: 'margin-bottom:20px', text }));
    const m = modal(box, { closable: false });
    box.append(el('div', { style: 'display:flex;gap:16px;justify-content:center' },
      onTap(el('button', { class: 'btn', text: yes }), () => { m.close(); res(true); }),
      onTap(el('button', { class: 'btn gray', text: no }), () => { m.close(); res(false); })));
  });
}
function inputBox(text, { type = 'text', placeholder = '' } = {}) {
  return new Promise(res => {
    const inp = el('input', { class: 'nameinput', type, inputmode: type === 'tel' ? 'numeric' : 'text', placeholder, style: 'width:100%;text-align:center' });
    const box = el('div', { class: 'panel', style: 'width:560px;padding:30px;text-align:center' }, el('div', { class: 'msg', style: 'margin-bottom:16px', text }), inp);
    const m = modal(box, { closable: false });
    const ok = () => { m.close(); res(inp.value.trim()); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    box.append(el('div', { style: 'display:flex;gap:16px;justify-content:center;margin-top:18px' },
      onTap(el('button', { class: 'btn', text: '확인' }), ok),
      onTap(el('button', { class: 'btn gray', text: '취소' }), () => { m.close(); res(null); })));
    setTimeout(() => inp.focus(), 50);
  });
}
