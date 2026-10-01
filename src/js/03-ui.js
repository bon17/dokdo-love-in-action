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

function clearScene() { L.scene.innerHTML = ''; DEV.solve = null; clearHint(); glossClose(); HINT.pos = 'left'; HINT.host = null; }

/* HUD */
const HUD = {
  build() {
    L.hud.innerHTML = '';
    const bar = el('div', { class: 'hud-bar' });
    this.stageEl = el('div', { class: 'hud-stage' });
    this.eraEl = el('div', { class: 'hud-era' });
    this.dokdo = el('div', { class: 'hud-dokdo', html: dokdoSvg() });
    this.barFill = el('i');
    this.pct = el('div', { class: 'pct' });
    const meter = el('div', { class: 'hud-meter', title: '되찾은 독도 기록' }, this.dokdo, el('div', { class: 'bar' }, this.barFill), this.pct);
    this.combo = el('div', { class: 'hud-combo' });
    this.score = el('div', { class: 'hud-score' });
    this.time = el('div', { class: 'hud-time', title: '지금까지 플레이한 시간 (화면이 켜져 있을 때만 잽니다)' }, el('span', { class: 'tl', text: '⏱ 지난 시간' }), this.timeV = el('b'));
    const book = onTap(el('button', { class: 'hud-btn book', html: '📖 도감' }), () => { Sound.sfx('tap'); openBook(); });
    this.mute = onTap(el('button', { class: 'hud-btn' }), () => { Sound.setMuted(!PREF.muted); this.update(); });
    const fs = onTap(el('button', { class: 'hud-btn', text: '⛶', title: '전체 화면' }), toggleFullscreen);
    const menu = onTap(el('button', { class: 'hud-btn', text: '☰' }), () => { Sound.sfx('tap'); openMenu(); });
    bar.append(this.stageEl, this.eraEl, meter, el('div', { class: 'hud-sp' }), this.combo, this.time, this.score, book, this.mute, fs, menu);
    L.hud.append(bar);
    this.tTag = el('div', { class: 'teacher-tag hide', text: '교사 모드 · 기록 저장 안 함' });
    L.hud.append(this.tTag);
    this.update();
  },
  show(v) { L.hud.style.display = v ? '' : 'none'; },
  update() {
    if (!this.score || !S) return;
    this.stageEl.textContent = S.stage >= 1 && S.stage <= 8 ? `${S.stage}. ${STAGE_NAMES[S.stage]}` : STAGE_NAMES[S.stage] || '';
    this.eraEl.textContent = S.era ? '⏳ ' + S.era : '';
    this.score.textContent = fmtNum(S.score) + '점';
    this.combo.textContent = S.combo >= 2 ? `콤보 ×${S.combo}` : '';
    const n = Object.keys(S.cards).length, p = n / CARDS.length;
    this.barFill.style.width = (p * 100) + '%';
    this.pct.textContent = Math.round(p * 100) + '%';
    this.dokdo.style.filter = `blur(${((1 - p) * 3.2).toFixed(1)}px)`;
    this.dokdo.style.opacity = (0.35 + 0.65 * p).toFixed(2);
    this.mute.textContent = PREF.muted ? '🔇' : '🔊';
    this.tTag.classList.toggle('hide', !S.teacher);
    this.tick();
  },
  /* 지난 시간: 랭킹에 쓰는 시간과 같다 (화면이 꺼져 있던 동안은 세지 않음) */
  tick() {
    if (!this.timeV || !S) return;
    const t = Math.floor(S.playMs / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60;
    this.timeV.textContent = (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
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
  ahn: { name: '안용복', img: ['char-anyongbok-bust', 'char-anyongbok'] },
  fog: { name: '망각의 안개', img: 'fog', color: 'purple' },
  isabu: { name: '이사부', img: ['char-isabu-bust', 'char-isabu'], ini: '이', color: 'blue' },
  jp: { name: '돗토리번 관리', img: 'char-tottori', ini: '관', color: 'gray' },
  fisher: { name: '일본 어부', img: 'char-fisher', ini: '어', color: 'gray' },
  suto: { name: '수토관', img: 'char-suto', ini: '수', color: 'blue' },
  lee: { name: '이규원', img: 'char-lee', ini: '이', color: 'blue' },
  shim: { name: '심흥택', img: 'char-shim', ini: '심', color: 'blue' },
  guard: { name: '독도경비대원', img: 'char-guard', ini: '경', color: 'blue' },
  keeper: { name: '등대관리원', img: 'char-keeper', ini: '등', color: 'green' },
  officer: { name: '독도관리사무소 직원', img: 'char-officer', ini: '관', color: 'green' },
  resident: { name: '독도 주민', img: 'char-resident', ini: '주', color: 'green' },
  tourist: { name: '관람객', img: 'char-tourist', ini: '관', color: 'gray' },
  kid: { name: '어린이 관람객', img: 'char-kid', ini: '어', color: 'gray' },
  student: { name: '학생 관람객', img: 'char-student', ini: '학', color: 'gray' },
  editor: { name: '편집장', ini: '편', color: 'red' },
  me: { name: '나', ini: '나', color: 'red' },
};
let dlgBusy = false;
function dialogBox(who, text) {
  const sp = typeof who === 'string' ? (SPK[who] || { name: who }) : who;
  const pic = [].concat(sp.img || []).find(k => IMG[k]);
  const box = el('div', { class: 'dlg' + (sp.narr ? ' narr noportrait' : '') + (!pic && !sp.ini && !sp.narr ? ' noportrait' : '') });
  if (pic) box.append(el('div', { class: 'pt' }, el('img', { src: img(pic), alt: '' })));
  else if (sp.ini) box.append(el('div', { class: 'pt' }, el('div', { class: 'ini', text: sp.ini, style: sp.color ? `background:${{ blue: '#2b7bd6', gray: '#6d7b8c', red: '#b5463a', green: '#2e9e6a', purple: '#6a4fb3' }[sp.color]}` : '' })));
  if (sp.name) box.append(el('div', { class: 'who' + (sp.color ? ' c-' + sp.color : ''), text: sp.name }));
  const txt = el('div', { class: 'txt' });
  box.append(txt);
  return { box, txt };
}
/* 한 글자씩 나타나는 대사. 아직 안 나온 글자도 자리를 차지해서 줄이 흔들리지 않는다.
   어려운 낱말은 밑줄을 긋고, 누르면 풀이가 뜬다. */
function typeText(node, text, seen = new Set()) {
  let i = 0, done = false, timer;
  const full = ko(String(text));
  node.textContent = '';
  const parts = glossSplit(full, seen).map(sg => {
    const wrap = sg.k ? glossSpan(sg.k) : el('span');
    const a = document.createTextNode(''), b = el('span', { class: 'twh' });
    b.textContent = sg.t;
    wrap.append(a, b); node.append(wrap);
    return { t: sg.t, a, b };
  });
  const show = n => { for (const p of parts) { const k = clamp(n, 0, p.t.length); p.a.data = p.t.slice(0, k); p.b.textContent = p.t.slice(k); n -= p.t.length; } };
  const finish = () => { if (done) return; done = true; clearInterval(timer); show(full.length); };
  timer = setInterval(() => { i += 1; show(i); if (i >= full.length) finish(); }, 26);
  return { finish, get done() { return done; } };
}
/* 대사 넘기기: 글자가 다 나온 뒤 잠깐(READ_GAP) 기다려야 ▼가 뜨고, 그때부터 눌러야 넘어간다.
   글자가 나오는 중에 누르면 글자만 한꺼번에 보여 준다. 짧은 대사를 읽기도 전에 넘어가 버리는 일을 막는다. */
const READ_GAP = 500, MIN_SHOW = 900;
function say(who, text) {
  return new Promise(resolve => {
    L.dialog.innerHTML = ''; clearHint(); glossClose();
    const catcher = el('div', { class: 'catcher' });
    const { box, txt } = dialogBox(who, text);
    const more = el('div', { class: 'more', text: '▼' });
    L.dialog.append(catcher, box);
    const t0 = performance.now();
    const tw = typeText(txt, text);
    let readyAt = Infinity, over = false;
    dlgBusy = true;
    const arm = () => { if (readyAt === Infinity) readyAt = Math.max(performance.now() + READ_GAP, t0 + MIN_SHOW); };
    const adv = e => {
      if (e) e.stopPropagation();
      if (over) return;
      if (!tw.done) { tw.finish(); arm(); return; }
      arm();
      if (performance.now() < readyAt) return;
      over = true; clearInterval(chk);
      Sound.sfx('tap');
      L.dialog.innerHTML = ''; dlgBusy = false;
      resolve();
    };
    catcher.addEventListener('click', adv); box.addEventListener('click', adv);
    const chk = setInterval(() => {
      if (!box.isConnected) { clearInterval(chk); return; }
      if (tw.done) arm();
      if (performance.now() >= readyAt && !more.isConnected) box.append(more);
    }, 60);
  });
}
async function talk(lines) { for (const [w, t] of lines) await say(w, t); }
/* 선택지 대사: 고른 번호를 돌려준다. */
function choose(who, text, options, { shuffleOpts = true } = {}) {
  return new Promise(resolve => {
    L.dialog.innerHTML = ''; clearHint();
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
      const at = performance.now();
      for (const i of order) wrap.append(onTap(el('button', { class: 'choice', text: options[i] }), () => { if (performance.now() - at < 350) return; Sound.sfx('tap'); finish(i); }));
      L.dialog.append(wrap);
      placeChoices(wrap, box);
      DEV.solve = () => finish(0);
    };
    catcher.addEventListener('click', e => { e.stopPropagation(); showOpts(); }); box.addEventListener('click', e => { e.stopPropagation(); showOpts(); });
    timer = setTimeout(showOpts, Math.min(2200, 26 * text.length + 200));
  });
}

/* 선택지는 대사 창의 이름표보다 위에 놓는다. 화면 위쪽(상단 막대)에 닿으면 글자를 조금씩 줄인다. */
function placeChoices(wrap, box) {
  const bottom = H - box.offsetTop + 36;
  wrap.style.bottom = bottom + 'px';
  for (const c of ['', 'compact', 'tiny']) {
    if (c) wrap.classList.add(c);
    if (wrap.offsetTop >= 76) return;
  }
  wrap.style.bottom = ''; wrap.style.top = '76px';
}

/* 힌트 말풍선 (화면을 막지 않음)
   HINT.host: 퍼즐 창 안의 힌트 자리. 있으면 창 안에 띄운다.
   HINT.pos: 창이 없을 때 띄울 곳 (left, right, top, center) */
const HINT = { host: null, pos: 'left' };
let hintTimer;
function hint(text, mood = 'gaji', ms = 7000) {
  clearHint();
  const face = { gaji: 'gaji-default', sad: 'gaji-sad', wow: 'gaji-surprised', yay: 'gaji-cheer' }[mood] || 'gaji-default';
  const inline = HINT.host && HINT.host.isConnected;
  const h = el('div', { class: inline ? 'hint-inline' : 'hint pos-' + HINT.pos }, el('img', { src: img(face) }), el('div', { class: 'b', text }));
  (inline ? HINT.host : L.toast).append(h);
  hintTimer = setTimeout(() => h.remove(), ms);
}
function clearHint() { clearTimeout(hintTimer); document.querySelectorAll('.hint, .hint-inline').forEach(h => h.remove()); }
function hintHost(node) { HINT.host = node; return node; }
/* 퍼즐을 다 풀면 바로 닫지 않고, 완성된 모습을 보여 준 뒤 "계속"을 눌러 넘어간다. */
function doneBar(container, { msg, btn = '계속 ▶' } = {}) {
  return new Promise(res => {
    const bar = el('div', { class: 'donebar' });
    if (msg) bar.append(el('div', { class: 'dmsg' }, gtext(msg)));
    const go = () => { if (!bar.isConnected) return; Sound.sfx('tap'); bar.remove(); DEV.solve = null; res(); };
    bar.append(onTap(el('button', { class: 'btn green', text: btn }), go));
    container.append(bar);
    DEV.solve = go;
  });
}
/* 글머리 기호 줄: 기호는 왼쪽에 두고, 줄이 넘어가면 글자 첫머리에 맞춰 이어 쓴다. */
function bulletLine(mark, text, { cls = '', style = '' } = {}) {
  return el('div', { class: 'bul ' + cls, style }, el('span', { class: 'bm', text: mark }), el('span', { class: 'bt' }, typeof text === 'string' ? gtext(text) : text));
}
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
function modal(content, { closable = true, dim = true, onClose, outside = false, xOut = false } = {}) {
  const wrap = el('div', { class: 'modal' });
  if (dim) wrap.append(el('div', { class: 'dim' }));
  const box = el('div', { class: 'box' }, content);
  wrap.append(box);
  let resolveFn;
  const done = new Promise(r => resolveFn = r);
  const close = v => { if (!wrap.isConnected) return; glossClose(); wrap.remove(); if (onClose) onClose(v); resolveFn(v); };
  if (closable) box.append(onTap(el('button', { class: 'xbtn' + (xOut ? ' out' : ''), text: '✕' }), () => { Sound.sfx('tap'); close('x'); }));
  if (outside) wrap.addEventListener('click', e => { if (!box.contains(e.target)) { Sound.sfx('tap'); close('outside'); } });
  L.overlay.append(wrap);
  return { wrap, box, close, done };
}

/* 옛 문서 보기. pick이 있으면 중요한 문장을 눌러 찾아야 한다. rub가 있으면 문질러서 글자를 되살린다.
   한 줄(line) 안의 \n은 같은 문장 안의 줄바꿈이고, 줄과 줄 사이는 문단 간격이 된다. */
function showDoc({ title, era, lines, ask, pick, rub, btn = '다 읽었어', key }) {
  return new Promise(resolve => {
    const doc = el('div', { class: 'doc paper' });
    const seen = new Set();
    doc.append(el('div', { class: 'dt', text: title }));
    if (era) doc.append(el('div', { class: 'de' }, gtext(era, seen)));
    const scroll = el('div', { class: 'dscroll' });
    const body = el('div', { class: rub ? 'rubwrap' : '' });
    const lineEls = lines.map(ln => {
      const o = typeof ln === 'string' ? { t: ln } : ln;
      const e = el('div', { class: 'dl' + (o.note ? ' note' : '') + (o.head ? ' head' : '') + (o.hl ? ' good' : '') + (pick && !o.note && !o.head ? ' pick' : '') }, gtext(o.t, seen));
      body.append(e); return e;
    });
    scroll.append(body);
    doc.append(scroll);
    const foot = el('div', { class: 'dfoot' });
    if (ask) foot.append(el('div', { class: 'ask' }, gtext(ask, seen)));
    const hintSlot = el('div', { class: 'hintslot' });
    const btnRow = el('div', { class: 'dbtns' });
    foot.append(hintSlot, btnRow);
    doc.append(foot);
    const more = onTap(el('div', { class: 'dmore', html: '▼<br>더' }), () => scroll.scrollBy({ top: 220, behavior: 'smooth' }));
    doc.insertBefore(more, foot);
    const m = modal(doc, { closable: false });
    const prevHost = HINT.host; hintHost(hintSlot);
    /* 글이 창보다 길면 글자를 조금씩 줄여 한 화면에 담고, 그래도 넘치면 "아래에 더 있어요"를 보여 준다. */
    const moreUpd = () => { const on = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 8; more.classList.toggle('on', on); doc.classList.toggle('hasmore', on); };
    const fitDoc = () => {
      if (!doc.isConnected) return;
      for (const f of [24, 23, 22, 21, 20]) {
        doc.style.setProperty('--dlf', f + 'px');
        doc.classList.toggle('tight', f < 24);
        if (scroll.scrollHeight <= scroll.clientHeight + 1) break;
      }
      moreUpd();
    };
    scroll.addEventListener('scroll', moreUpd);
    requestAnimationFrame(fitDoc);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitDoc);
    let footH = 0;
    const ro = window.ResizeObserver ? new ResizeObserver(() => { const h = foot.offsetHeight; if (h !== footH) { footH = h; fitDoc(); } }) : null;
    if (ro) ro.observe(foot);
    const finish = v => { if (ro) ro.disconnect(); HINT.host = prevHost; clearHint(); m.close(); resolve(v); };
    const showBtn = () => {
      if (btnRow.children.length) return;
      btnRow.append(onTap(el('button', { class: 'btn blue', text: btn }), () => { Sound.sfx('tap'); finish(true); }));
      DEV.solve = () => finish(true);
    };
    if (pick) {
      let tries = 0; const found = new Set();
      const need = pick.correct.length;
      const complete = revealed => {
        DEV.solve = null; award(key || pick.key, tries + 1);
        if (revealed) hint(pick.reveal || '같이 찾아보자. 바로 이 문장이야!', 'gaji', 60000);
        setTimeout(showBtn, 300);
      };
      const shake = e => { e.classList.remove('bad'); void e.offsetWidth; e.classList.add('bad'); setTimeout(() => e.classList.remove('bad'), 650); };
      lineEls.forEach((e, i) => {
        const o = lines[i];
        if (o.note || o.head) return;
        onTap(e, () => {
          if (found.size >= need) return;
          if (pick.correct.includes(i)) {
            if (found.has(i)) return;
            found.add(i); e.classList.add('good'); Sound.sfx('good');
            if (found.size >= need) complete(false);
          } else {
            tries++; shake(e);
            const own = pick.wrong && pick.wrong[i];
            if (wrongFeedback(tries, own || pick.hint, own || undefined)) {
              pick.correct.forEach(j => { found.add(j); lineEls[j].classList.add('good'); });
              complete(true);
            }
          }
        });
      });
      DEV.solve = () => { pick.correct.forEach(j => { found.add(j); lineEls[j].classList.add('good'); }); complete(false); };
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
function cardName(c, mini) {
  const nm = c.nm || c.name;
  if (!mini) return nm;
  return c.id === 'yeoji' ? '『신증\n동국여지승람』' : nm;
}
function cardText(c) {
  const t = el('div', { class: 'ctext' }), seen = new Set();
  if (c.why && c.text.includes(c.why)) {
    const [a, b] = c.text.split(c.why);
    t.append(gtext(a, seen), el('mark', { class: 'hl' }, gtext(c.why, seen)), gtext(b, seen));
  } else t.append(gtext(c.text, seen));
  return t;
}
function cardEl(c, { mini = false, borrowed = false, locked = false } = {}) {
  const e = el('div', { class: `card ${c.rar}${mini ? ' mini' : ''}${borrowed ? ' borrowed' : ''}${locked ? ' locked' : ''}` });
  if (locked) {
    e.append(el('div', { class: 'ctop', text: '?' }), el('div', { class: 'cname', text: '???' }), el('div', { class: 'ctext', text: `${c.st}단계에서 찾을 수 있어요.` }));
    return e;
  }
  e.append(el('div', { class: 'ctop ' + c.cat }, c.ico, el('span', { class: 'cyear', text: c.year }), el('span', { class: 'crar', text: RARITY[c.rar].name })));
  const name = cardName(c, mini);
  const longest = Math.max(...name.split('\n').map(x => x.length));
  const nameEl = el('div', { class: 'cname', text: name });
  if (mini) nameEl.style.fontSize = (longest <= 7 ? 18 : longest <= 8 ? 16 : longest <= 9 ? 14.5 : 13) + 'px';
  else if (longest > 10) nameEl.style.fontSize = '24px';
  e.append(nameEl);
  e.append(el('div', { class: 'ccat ' + c.cat, text: CAT[c.cat].name }));
  e.append(cardText(c));
  return e;
}
function hasCard(id) { return !!(S && S.cards[id]); }
function getCard(id) {
  return new Promise(resolve => {
    const c = CARD[id];
    if (!c || S.cards[id]) return resolve();
    clearHint();
    S.cards[id] = true; S.cardOrder.push(id);
    Sound.sfx('card');
    setTimeout(() => Sound.sfx('stamp'), 500);
    const big = cardEl(c);
    big.append(el('div', { class: 'cfoot' }, el('div', { class: 'csrc', text: '출처: ' + c.src }), el('div', { class: 'stampfx', html: '증거<br>확보' })));
    const wrap = el('div', { class: 'getcard' }, el('div', { class: 'label', text: c.rar === 'l' ? '✨ 전설 증거 발견! ✨' : '증거 발견!' }), big);
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
  big.classList.add('bigview');
  big.append(el('div', { class: 'csrc', text: '출처: ' + c.src }));
  modal(big, { xOut: true, outside: true });
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
    el('div', { class: 'msg', style: 'font-size:22px' }, gtext(c.solved)));
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
  const s = el('div', { class: 'hseal', html: sealSvg(), style: { left: (x - 32) + 'px', top: (y - 25) + 'px' } });
  onTap(s, () => {
    s.remove(); S.seals[stage] = true; Sound.sfx('ping'); addScore(SEAL_PTS, x, y);
    toast(`🦭 숨은 강치를 찾았다! (${Object.keys(S.seals).length}/8)`);
    if (Object.keys(S.seals).length >= 8) giveBadge('seals');
    save();
  });
  L.hidden.append(s);
}

/* 증거 보드: 단계에서 새로 모은 카드를 세 가지 근거로 나눈다.
   앞 단계에서 넣은 카드도 칸에 계속 보이고(연하게), 새로 넣은 카드는 맨 위에 쌓인다. */
function evidenceBoard(stage) {
  return new Promise(resolve => {
    const ids = CARDS.filter(c => c.st === stage && S.cards[c.id] && !S.boarded[c.id]).map(c => c.id);
    if (!ids.length) return resolve();
    const root = el('div', { class: 'panel', style: 'width:1200px;height:660px;padding:16px 22px;position:relative;display:flex;flex-direction:column' });
    root.append(el('div', { style: 'font:30px var(--ui);text-align:center', text: '증거 보드: 새로 찾은 증거를 분류해 봐!' }),
      el('div', { style: 'font:19px var(--body);text-align:center;color:#bcd3ea;margin:6px 0 10px', text: '카드를 누른 다음, 알맞은 근거 칸을 눌러 줘.' }));
    const tray = el('div', { style: 'display:flex;gap:12px;justify-content:center;min-height:196px;flex-wrap:wrap' });
    const slot = el('div', { class: 'hintslot', style: 'min-height:0' });
    const bins = el('div', { style: 'display:flex;gap:16px;margin-top:10px;flex:1;min-height:0' });
    root.append(tray, slot, bins);
    const m = modal(root, { closable: false });
    hintHost(slot);
    let sel = null, left = ids.length;
    const tries = {};
    const chip = (c, fresh) => el('div', { class: 'binchip' + (fresh ? ' fresh' : ''), text: c.name });
    for (const k of ['hist', 'geo', 'law']) {
      const list = el('div', { class: 'binlist' });
      for (const oid of S.cardOrder.slice().reverse()) if (S.boarded[oid] === k) list.append(chip(CARD[oid], false));
      const count = el('span', { class: 'bincount' });
      const b = el('div', { class: 'slot bin', style: `border-color:var(--${k})` },
        el('div', { class: 'binhead', style: `background:var(--${k})` }, CAT[k].name, count),
        el('div', { style: 'font:16px var(--body);color:#dfe9f5;margin:6px 0 8px' }, gtext(CAT[k].desc)), list);
      const setCount = () => { count.textContent = ` · ${list.children.length}장`; };
      setCount();
      bins.append(b);
      onTap(b, () => {
        if (!left) return;
        if (!sel) { hint('먼저 위에서 카드를 하나 골라 줘!'); return; }
        const c = CARD[sel.dataset.id];
        const ok = k === c.cat || (c.alt || []).includes(k);
        if (ok) {
          Sound.sfx('good'); clearHint();
          addScore(tries[c.id] ? BOARD_PTS / 2 : BOARD_PTS, 640, 300);
          S.boarded[c.id] = k;
          sel.remove();
          list.prepend(chip(c, true)); list.scrollTop = 0; setCount();
          sel = null; left--;
          if (!left) { DEV.solve = null; HINT.host = null; doneBar(root, { msg: '모든 증거를 분류했어! 칸마다 모인 증거를 살펴봐.' }).then(() => { m.close(); save(); resolve(); }); }
        } else {
          tries[c.id] = (tries[c.id] || 0) + 1; S.boardMiss++;
          Sound.sfx('bad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          hint(`"${c.name}"은(는) ${c.cat === 'geo' ? '위치나 자연' : c.cat === 'hist' ? '옛 기록이나 사건' : '법령, 조약, 지금 실제로 다스리는 모습'}에 대한 증거 같지 않아? 카드 내용을 다시 읽어 봐.`);
        }
      });
    }
    for (const id of ids) {
      const c = cardEl(CARD[id], { mini: true }); c.dataset.id = id; c.style.cursor = 'pointer';
      onTap(c, () => { Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = c; c.classList.add('sel'); });
      tray.append(c);
    }
    DEV.solve = () => { for (const id of ids) S.boarded[id] = CARD[id].cat; HINT.host = null; m.close(); resolve(); };
  });
}

/* 단계 시작: 미션 한 줄과 시대 */
function missionCard(stage) {
  return new Promise(resolve => {
    Sound.sfx('ping');
    const box = el('div', { class: 'panel popin', style: 'width:800px;padding:32px 36px;text-align:center' },
      el('div', { style: 'font:24px var(--ui);color:#bcd3ea', text: `${stage}단계` }),
      el('div', { style: 'font:44px var(--ui);margin:8px 0 14px', text: `「${STAGE_NAMES[stage]}」` }),
      el('div', { style: 'font:22px var(--ui);color:#cfe6ff;margin-bottom:18px', text: `⏳ ${ERAS[stage]}` }),
      el('div', { style: 'font:30px var(--ui);color:#ffd166' }, gtext(`🎯 미션: ${MISSIONS[stage]}`)),
      SEAL_POS[stage] && !S.seals[stage] ? el('div', { style: 'font:19px/1.6 var(--ui);color:#cfe6ff;margin-top:14px;white-space:pre-line', text: `🦭 이 단계 화면 가장자리에도 강치 한 마리가 숨어 있어. 찾아서 눌러 봐!\n(찾은 강치 ${Object.keys(S.seals).length}/8 · 한 마리에 +${SEAL_PTS}점)` }) : null);
    const m = modal(box, { closable: false });
    box.append(el('div', { style: 'margin-top:26px' }, onTap(el('button', { class: 'btn', text: '시작!' }), () => { Sound.sfx('tap'); m.close(); resolve(); })));
    DEV.solve = () => { m.close(); resolve(); };
  });
}
function setEra(when) { S.era = when; HUD.update(); save(); }
/* 장면의 시대가 바뀔 때: "⏳ 시간 이동" 알림. 위쪽 막대에도 지금 시대를 적는다. */
function timeJump(when, where) {
  S.era = when; HUD.update(); save();
  return new Promise(resolve => {
    Sound.sfx('whoosh');
    const b = el('div', { class: 'timejump' }, el('div', { class: 'tj1', text: '⏳ 시간 이동' }), el('div', { class: 'tj2', text: when }), where ? el('div', { class: 'tj3', text: where }) : null);
    L.toast.append(b);
    let done = false;
    const end = () => { if (done) return; done = true; b.classList.add('out'); setTimeout(() => { b.remove(); resolve(); }, 320); };
    b.addEventListener('click', end);
    setTimeout(end, 2000);
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
  const TABS = [['cards', '증거 카드'], ['clues', '노래 단서 수첩'], ['names', '이름 도감'], ['words', '낱말 풀이'], ['badges', '업적 배지']];
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
    } else if (t === 'words') {
      body.append(el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin-bottom:10px', text: '게임 속 글에서 밑줄 친 낱말을 가나다순으로 모았어요. 글 속의 밑줄 낱말을 누르면 그 자리에서도 볼 수 있어요.' }));
      const wl = el('div', { class: 'wordlist' });
      for (const k of Object.keys(GLOSS).sort((a, b) => a.localeCompare(b, 'ko'))) {
        const g = GLOSS[k];
        wl.append(el('div', { class: 'wrow' }, el('div', { class: 'ww', text: k + (g.h ? ` (${g.h})` : '') }), el('div', { class: 'wd', text: g.d })));
      }
      body.append(wl);
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
