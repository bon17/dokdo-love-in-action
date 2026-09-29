/* ===== 여러 단계에서 함께 쓰는 미니게임 ===== */

/* 끌어다 놓기 + 눌러서 고르기를 함께 지원한다.
   onMove(under, pt)로 끄는 동안 놓을 곳을 빛낼 수 있고, onDrop(under, pt, node)으로 놓는다.
   조각 안의 밑줄 낱말을 누르면 조각을 고르면서 낱말 풀이도 함께 보여 준다. */
function dragItem(node, { onTap: tapFn, onDrop, onMove }) {
  let st = null;
  node.style.touchAction = 'none';
  node.draggable = false;
  node.addEventListener('dragstart', e => e.preventDefault());
  node.addEventListener('contextmenu', e => e.preventDefault());
  node.style.webkitUserDrag = 'none';
  node.style.webkitTouchCallout = 'none';
  node.addEventListener('pointerdown', e => {
    st = { x: e.clientX, y: e.clientY, drag: false, id: e.pointerId, gl: e.target.closest && e.target.closest('.gl') };
    try { node.setPointerCapture(e.pointerId); } catch (er) { }
  });
  node.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.drag && Math.hypot(dx, dy) > 10) { st.drag = true; node.style.zIndex = 50; node.style.transition = 'none'; node.style.pointerEvents = 'none'; }
    if (st.drag) {
      node.style.transform = `translate(${dx / SCALE}px,${dy / SCALE}px) scale(1.05)`;
      if (onMove) onMove(document.elementsFromPoint(e.clientX, e.clientY), { x: e.clientX, y: e.clientY }, node);
    }
  });
  const end = e => {
    if (!st) return;
    const s = st; st = null;
    node.style.pointerEvents = '';
    if (s.drag) {
      const under = document.elementsFromPoint(e.clientX, e.clientY);
      const pt = { x: e.clientX, y: e.clientY };
      const rect = node.getBoundingClientRect();
      node.style.transition = 'transform .2s'; node.style.transform = ''; node.style.zIndex = '';
      if (onMove) onMove([], null, node);
      onDrop && onDrop(under, pt, node, rect);
    } else {
      tapFn && tapFn();
      if (s.gl && s.gl.dataset.k && s.gl.isConnected) glossShow(s.gl.dataset.k, s.gl);
    }
  };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', () => { if (st) { st = null; node.style.transform = ''; node.style.pointerEvents = ''; if (onMove) onMove([], null, node); } });
}

/* 화면 위 조사 지점: 모든 필수 지점을 살펴보면 끝난다.
   run()이 'cancel'을 돌려주면 그 지점은 아직 끝나지 않은 것으로 두고 다시 누를 수 있다.
   review가 켜져 있으면 본 지점도 다시 눌러 읽을 수 있고, 다 본 뒤 "계속" 단추를 눌러야 넘어간다. */
function explore({ title, spots, review = false }) {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0' });
    if (title) root.append(el('div', { class: 'mg-title', text: title }));
    L.scene.append(root);
    let busy = false, finished = false;
    const done = new Set(), req = spots.filter(s => s.req !== false), marks = [];
    const armDev = () => { DEV.solve = () => { const i = spots.findIndex(s => !done.has(s) && s.req !== false); if (i >= 0) marks[i].click(); }; };
    const endBox = el('div', { class: 'explore-end' });
    spots.forEach(s => {
      const m = el('div', { class: 'marker', style: { left: s.x + 'px', top: s.y + 'px' } }, s.ico || '🔍', s.label ? el('div', { class: 'ml', text: s.label }) : null);
      marks.push(m);
      onTap(m, async () => {
        if (busy || finished || (!review && s.once !== false && done.has(s))) return;
        busy = true; Sound.sfx('tap'); clearHint();
        root.style.visibility = 'hidden';
        const r = await s.run();
        root.style.visibility = '';
        busy = false;
        if (r === 'cancel') { armDev(); return; }
        m.classList.add('done'); done.add(s);
        if (!req.every(x => done.has(x))) { armDev(); return; }
        if (!review) { finished = true; root.remove(); resolve(); return; }
        if (!endBox.isConnected) {
          root.append(endBox);
          doneBar(endBox, { msg: '다 살펴봤어!\n다시 보고 싶은 곳은 또 눌러 봐.', btn: '계속 ▶' }).then(() => { finished = true; root.remove(); resolve(); });
        } else DEV.solve = () => { const b = endBox.querySelector('button'); if (b) b.click(); };
      });
      root.append(m);
    });
    armDev();
  });
}

/* 숫자 자물쇠. 창 밖을 누르면 닫고 단서를 다시 볼 수 있다 ('cancel'을 돌려준다). */
function lockPuzzle({ title, answer, note, hintText, reveal, key }) {
  return new Promise(resolve => {
    const n = answer.length, vals = Array(n).fill(0);
    const box = el('div', { class: 'panel', style: 'width:640px;padding:28px;text-align:center' });
    box.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (note) box.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:8px 0 14px', text: note }));
    const row = el('div', { style: 'display:flex;gap:18px;justify-content:center;margin:10px 0 20px' });
    const digs = [];
    for (let i = 0; i < n; i++) {
      const d = el('div', { style: 'width:96px;height:120px;border-radius:16px;background:#1b2f48;border:4px solid #c9a24a;display:flex;align-items:center;justify-content:center;font:64px var(--ui);color:#ffe6a8', text: '0' });
      digs.push(d);
      const set = dv => { vals[i] = (vals[i] + dv + 10) % 10; d.textContent = vals[i]; Sound.sfx('lock'); };
      row.append(el('div', { style: 'display:flex;flex-direction:column;gap:8px;align-items:center' },
        onTap(el('button', { class: 'btn small blue', text: '▲', style: 'width:96px' }), () => set(1)), d,
        onTap(el('button', { class: 'btn small blue', text: '▼', style: 'width:96px' }), () => set(-1))));
    }
    box.append(row);
    const slot = el('div', { class: 'hintslot' });
    const openBtn = el('button', { class: 'btn', text: '🔓 열기' });
    const back = el('div', { style: 'font:17px var(--body);color:#8fa7c0;margin-top:12px', text: '단서를 다시 보고 싶으면 창 바깥을 눌러 봐.' });
    box.append(openBtn, slot, back);
    let solved = false;
    const m = modal(box, { closable: false, outside: true, onClose: () => { HINT.host = null; clearHint(); resolve(solved ? true : 'cancel'); } });
    hintHost(slot);
    let tries = 0;
    const finish = async revealed => {
      if (solved) return;
      solved = true; DEV.solve = null; Sound.sfx('open'); award(key, tries + 1);
      openBtn.remove(); back.remove();
      await doneBar(box, { msg: revealed ? reveal : '딸깍! 자물쇠가 열렸다!' });
      HINT.host = null; m.close(); resolve(true);
    };
    onTap(openBtn, () => {
      if (vals.join('') === answer) finish(false);
      else {
        tries++; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        if (wrongFeedback(tries, hintText, '딸깍… 안 열려. 단서를 다시 볼까?')) {
          answer.split('').forEach((c, i) => { vals[i] = +c; digs[i].textContent = c; });
          finish(true);
        }
      }
    });
    DEV.solve = () => { tries = 0; finish(false); };
  });
}

/* 알맞은 칸에 조각 넣기 */
function placeTiles({ title, prompt, slots, tiles, hintText, reveal, key, base, vertical = false, slotW = 250, paper = false, onPlaced, doneMsg }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1180px;max-height:690px;overflow:auto;padding:22px 26px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (prompt) root.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:8px 0 12px;line-height:1.7' }, gtext(prompt)));
    const slotRow = el('div', { style: `display:flex;${vertical ? 'flex-direction:column;align-items:center;' : 'justify-content:center;flex-wrap:wrap;'}gap:10px;margin:8px 0 16px` });
    const tileRow = el('div', { style: 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;min-height:70px' });
    const slot = el('div', { class: 'hintslot' });
    root.append(slotRow, tileRow, slot);
    const slotEls = slots.map((s, i) => {
      const e = el('div', { class: 'slot', style: `width:${vertical ? 900 : slotW}px;flex-direction:column;padding:10px 14px;${paper ? 'background:rgba(246,236,212,.15);' : ''}` },
        s.label ? el('div', { style: 'font:17px/1.4 var(--ui);color:#ffd9a8;white-space:pre-line' }, gtext(s.label)) : null,
        el('div', { class: 'sv', style: 'font:22px/1.5 var(--body);white-space:pre-line', text: s.ph || '?' }));
      e.dataset.i = i; slotRow.append(e); return e;
    });
    const m = modal(root, { closable: false });
    hintHost(slot);
    let sel = null, tries = 0, left = tiles.length, auto = false;
    const fill = (tile, ti, flash) => {
      const t = tiles[ti], s = slotEls[t.slot];
      s.classList.add('filled'); const sv = s.querySelector('.sv'); sv.textContent = ''; sv.append(gtext(t.t));
      if (flash) { s.classList.remove('popin'); void s.offsetWidth; s.classList.add('popin'); s.style.boxShadow = '0 0 0 4px #ffd166'; setTimeout(() => s.style.boxShadow = '', 900); }
      tile.classList.add('done'); tile.classList.remove('sel'); if (sel === tile) sel = null;
      Sound.sfx('good'); left--;
      if (onPlaced) onPlaced(t, s);
      if (!left) {
        DEV.solve = null; award(key, Math.min(tries + 1, 4), base);
        if (auto) hint(reveal || '이렇게 맞추면 돼!', 'gaji', 60000);
        tileRow.remove();
        doneBar(root, { msg: doneMsg }).then(() => { HINT.host = null; clearHint(); m.close(); resolve(tries); });
      }
    };
    const tryPut = (tile, slotIdx) => {
      const ti = +tile.dataset.i;
      if (tile.classList.contains('done') || auto) return;
      if (tiles[ti].slot === slotIdx && !slotEls[slotIdx].classList.contains('filled')) fill(tile, ti);
      else {
        tries++;
        const s = slotEls[slotIdx]; s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
        const t = typeof hintText === 'function' ? hintText(tiles[ti], slotIdx) : hintText;
        if (wrongFeedback(tries, t)) {
          auto = true; hint('같이 맞춰 보자! 하나씩 들어가는 자리를 잘 봐.', 'gaji', 60000);
          const rest = tileEls.map((te, j) => [te, j]).filter(([te]) => !te.classList.contains('done'));
          rest.forEach(([te, j], k) => setTimeout(() => fill(te, j, true), 900 + k * 1100));
        }
      }
    };
    const order = shuffle(tiles.map((t, i) => i));
    const tileEls = [];
    order.forEach(i => {
      const t = el('div', { class: 'tile', style: paper ? 'background:#fbf3df;font-family:var(--old);font-size:20px;max-width:520px' : 'max-width:440px' }, el('span', {}, gtext(tiles[i].t)));
      t.dataset.i = i; tileEls[i] = t;
      dragItem(t, {
        onTap: () => { if (auto) return; Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = t; t.classList.add('sel'); },
        onDrop: under => { const s = under.find(x => x.classList && x.classList.contains('slot')); if (s) tryPut(t, +s.dataset.i); },
      });
      tileRow.append(t);
    });
    slotEls.forEach((s, i) => onTap(s, () => { if (sel) tryPut(sel, i); }));
    DEV.solve = () => tileEls.forEach((te, j) => { if (!te.classList.contains('done')) fill(te, j); });
  });
}

/* 창 안에서 푸는 문제: 질문과 답 단추를 창 안에 둬서 대사 창·선택지와 겹치지 않게 한다.
   틀린 답은 흐리게 바꾸고 그 자리에서 생각할 거리를 준다. 고른 횟수를 돌려준다. */
function panelQuiz({ host, text, options, key, base, cols = 3 }) {
  return new Promise(resolve => {
    const q = el('div', { class: 'msg', style: 'font-size:23px;line-height:1.6;margin:16px 0 12px' }, gtext(text));
    const row = el('div', { class: 'pq-row' + (cols === 1 ? ' col' : '') });
    const slot = el('div', { class: 'hintslot' });
    host.append(q, row, slot);
    const prev = HINT.host; hintHost(slot);
    let tries = 0, over = false;
    const btns = [];
    const pick = (o, b) => {
      if (over || b.classList.contains('bad')) return;
      Sound.sfx('tap');
      if (o.ok) {
        over = true; DEV.solve = null; Sound.sfx('good'); b.classList.add('good');
        btns.forEach(x => { if (x !== b) x.classList.add('bad'); });
        award(key, tries + 1, base); HINT.host = prev;
        resolve(tries);
      } else {
        tries++; miss(); b.classList.add('bad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        hint(o.re, 'gaji', 60000);
      }
    };
    shuffle(options.map((o, i) => i)).forEach(i => {
      const o = options[i], b = el('button', { class: 'choice pq', text: o.t });
      onTap(b, () => pick(o, b));
      btns.push(b); row.append(b);
      if (o.ok) DEV.solve = () => pick(o, b);
    });
  });
}

/* 여러 개 중 알맞은 것을 골라 쓰기 (반박 연습 등). 항목: { id, ico, t, why } — t 안의 \n은 줄바꿈 */
function pickItem({ claim, prompt, items, correct, hintText, reveal, key, base, doneMsg }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1160px;padding:22px;text-align:center' });
    if (claim) root.append(el('div', { style: 'display:flex;gap:14px;align-items:center;justify-content:center;margin-bottom:12px' },
      el('img', { src: img('fog'), style: 'width:110px' }),
      el('div', { style: 'font:28px/1.5 var(--ui);background:rgba(106,79,179,.5);padding:14px 22px;border-radius:18px;max-width:840px' }, gtext(`"${claim}"`))));
    root.append(el('div', { class: 'msg', style: 'font-size:22px;margin-bottom:14px' }, gtext(prompt)));
    const row = el('div', { style: 'display:flex;gap:14px;justify-content:center;flex-wrap:wrap;max-width:1000px;margin:0 auto' });
    const slot = el('div', { class: 'hintslot' });
    root.append(row, slot);
    const m = modal(root, { closable: false });
    hintHost(slot);
    let tries = 0, over = false;
    const finish = async (revealed, node) => {
      if (over) return; over = true;
      DEV.solve = null; award(key, Math.min(tries + 1, 4), base);
      if (node) node.style.outline = '5px solid #7fe0a8';
      if (revealed) hint(reveal, 'gaji', 60000);
      await doneBar(root, { msg: doneMsg });
      HINT.host = null; clearHint(); m.close(); resolve(tries);
    };
    const nodes = {};
    items.forEach(it => {
      const node = it.card ? cardEl(CARD[it.card], { mini: true }) : el('div', { class: 'tile', style: 'width:300px;min-height:118px;flex-direction:column;gap:4px;font-size:21px' },
        it.ico ? el('div', { style: 'font-size:30px;line-height:1', text: it.ico }) : null, el('div', { style: 'white-space:pre-line;line-height:1.4', text: it.t }));
      node.style.cursor = 'pointer';
      nodes[it.id] = node;
      onTap(node, () => {
        if (over) return;
        if (correct.includes(it.id)) { Sound.sfx('hit'); finish(false, node); }
        else {
          tries++; node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
          if (wrongFeedback(tries, it.why ? it.why + '\n' + hintText : hintText, it.why || '그것만으로는 안개를 물리치기 어려워. 다시 골라 볼까?')) {
            correct.forEach(c => { if (nodes[c]) nodes[c].style.outline = '5px solid #7fe0a8'; });
            finish(true);
          }
        }
      });
      row.append(node);
    });
    DEV.solve = () => { tries = 0; finish(false, nodes[correct[0]]); };
  });
}

/* 꾹 눌러 도장 찍기 */
function pressStamp({ title, note, label = '確認', color = '#c0392b', doc, key, doneMsg }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:960px;padding:24px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (note) root.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:8px 0 12px' }, gtext(note)));
    const paper = el('div', { class: 'paper', style: 'position:relative;margin:0 auto 18px;width:840px;padding:22px 30px 26px;text-align:left;font:22px/1.8 var(--old);white-space:pre-line;min-height:150px' });
    paper.append(gtext(doc));
    root.append(paper);
    const stamp = el('div', { style: `width:130px;height:130px;margin:0 auto;border-radius:18px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;
      font:34px/1.1 var(--old);cursor:pointer;box-shadow:0 8px 0 #7a1f16,0 12px 20px rgba(0,0,0,.4);position:relative;overflow:hidden;touch-action:none`, html: label });
    const ring = el('div', { style: 'position:absolute;left:0;bottom:0;height:8px;width:0;background:#ffe6a8' });
    stamp.append(ring);
    const tip = el('div', { style: 'font:19px var(--ui);color:#bcd3ea;margin-top:10px', text: '도장을 꾹 누르고 있어 봐!' });
    root.append(stamp, tip);
    const m = modal(root, { closable: false });
    let t0 = 0, raf = 0, done = false;
    const finish = async () => {
      if (done) return; done = true; cancelAnimationFrame(raf);
      Sound.sfx('stamp');
      paper.append(el('div', { style: `position:absolute;right:40px;bottom:16px;width:110px;height:110px;border:6px solid ${color};border-radius:14px;color:${color};
        display:flex;align-items:center;justify-content:center;font:28px/1.1 var(--old);transform:rotate(-8deg);opacity:.85;animation:popIn .3s`, html: label }));
      if (key) award(key, 1);
      stamp.remove(); tip.remove();
      await doneBar(root, { msg: doneMsg });
      m.close(); resolve();
    };
    const loop = () => { const p = Math.min(1, (performance.now() - t0) / 700); ring.style.width = p * 100 + '%'; if (p >= 1) finish(); else raf = requestAnimationFrame(loop); };
    stamp.addEventListener('pointerdown', () => { if (done) return; t0 = performance.now(); raf = requestAnimationFrame(loop); stamp.style.transform = 'translateY(6px)'; });
    const up = () => { if (done) return; cancelAnimationFrame(raf); ring.style.width = 0; stamp.style.transform = ''; };
    stamp.addEventListener('pointerup', up); stamp.addEventListener('pointerleave', up); stamp.addEventListener('pointercancel', up);
    DEV.solve = finish;
  });
}

/* 짝 맞추기 (기억력 카드) */
function memoryGame({ title, pairs, key, base = 150 }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1160px;padding:18px 20px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }),
      el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin:6px 0 6px', text: '카드를 두 장씩 뒤집어 사건과 그 내용을 짝지어 봐! 맞춘 짝은 같은 색, 같은 번호로 표시돼.' }));
    const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(4,260px);gap:12px;justify-content:center' });
    root.append(grid);
    /* 짝마다 다른 색과 번호 */
    const PAIR_COL = [['#e8f4ff', '#2b7bd6'], ['#fff0d9', '#e08a1c'], ['#e6f7ea', '#2e9e6a'], ['#f6e8ff', '#8a4fc9'], ['#ffe6e6', '#d0463a'], ['#e3f7f7', '#1a8f8f'], ['#fff9d6', '#b8961a'], ['#f0f0f0', '#5d6d82']];
    const m = modal(root, { closable: false });
    const deck = shuffle(pairs.flatMap((p, i) => [{ i, t: p[0], k: 'a' }, { i, t: p[1], k: 'b' }]));
    let open = [], found = 0, flips = 0, lock = false;
    deck.forEach(d => {
      const c = el('div', { style: `position:relative;height:118px;border-radius:14px;display:flex;align-items:center;justify-content:center;padding:8px 12px;cursor:pointer;
        background:#2b4f78;border:3px solid #8fd3ff;font:34px var(--ui);color:#cfe6ff;transition:transform .2s;text-wrap:balance`, text: '?' });
      c.dataset.i = d.i;
      onTap(c, () => {
        if (lock || c.dataset.open || c.dataset.done) return;
        Sound.sfx('tap');
        c.dataset.open = 1; c.textContent = ''; c.append(el('span', {}, gtext(d.t))); c.style.background = d.k === 'a' ? '#fff3dc' : '#e3f1ff'; c.style.color = '#2b2521';
        c.style.font = d.k === 'a' ? '23px/1.4 var(--ui)' : '19px/1.5 var(--body)';
        open.push(c);
        if (open.length === 2) {
          flips++; lock = true;
          const [a, b] = open;
          if (a.dataset.i === b.dataset.i) {
            Sound.sfx('good'); a.dataset.done = b.dataset.done = 1;
            const [bg, bd] = PAIR_COL[found % PAIR_COL.length];
            for (const x of [a, b]) {
              x.style.background = bg; x.style.borderColor = bd; x.style.borderWidth = '4px';
              x.append(el('div', { class: 'mpair', style: `background:${bd}`, text: String(found + 1) }));
            }
            open = []; lock = false; found++;
            if (found === pairs.length) done();
          } else setTimeout(() => {
            for (const x of open) { delete x.dataset.open; x.textContent = '?'; x.style.background = '#2b4f78'; x.style.color = '#cfe6ff'; x.style.font = '34px var(--ui)'; }
            open = []; lock = false;
          }, 900);
        }
      });
      grid.append(c);
    });
    const done = async () => {
      DEV.solve = null;
      const extra = Math.max(0, flips - pairs.length);
      addScore(Math.max(40, base - extra * 12), 640, 300);
      await doneBar(root, { msg: '짝을 모두 찾았어! 같은 색·같은 번호끼리 짝이야. 한 번 더 읽어 봐.' });
      m.close(); resolve();
    };
    DEV.solve = () => { flips = pairs.length; done(); };
  });
}

/* 거짓 주장 풍선: 거짓은 터뜨리고 사실은 놓아준다.
   문장마다 꼭 두 번씩 지나가게 해서, 처음에 헷갈린 문장도 한 번 더 볼 수 있게 한다. */
function balloonGame({ items, key, gap = 1600 }) {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(120,170,220,.55),rgba(20,50,90,.55))' });
    L.scene.append(root);
    HINT.pos = 'top';
    const head = el('div', { class: 'mg-title', html: '💥 <b>거짓 주장</b>은 터뜨리고, 🕊️ <b>기록된 사실</b>은 날려 보내!' });
    const info = el('div', { style: 'position:absolute;right:24px;top:80px;font:24px var(--ui);background:rgba(8,26,48,.85);padding:8px 16px;border-radius:12px;z-index:3' });
    root.append(head, info);
    let last = -2000, raf, alive = [], pts = 0, good = 0, bad = 0, over = false;
    const first = shuffle(items);
    let second = shuffle(items);
    while (second[0] === first[first.length - 1]) second = shuffle(items);
    const pool = [...first, ...second];
    let idx = 0;
    const spawn = () => {
      const it = pool[idx++];
      const round = idx > items.length ? 2 : 1;
      const x = 90 + Math.random() * 860;
      const col = ['#ff9f7a', '#8fd3ff', '#ffd166', '#b8e986', '#d7a8ff'][Math.floor(Math.random() * 5)];
      const b = el('div', { style: `position:absolute;left:${x}px;top:720px;width:280px;height:150px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8,${col} 45%);
        box-shadow:0 8px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:14px 26px;text-align:center;font:19px/1.4 var(--ui);color:#1d2530;cursor:pointer;text-wrap:balance` }, it.t);
      b.append(el('div', { style: 'position:absolute;left:50%;bottom:-38px;width:2px;height:40px;background:#fff8' }));
      if (round === 2) b.append(el('div', { style: 'position:absolute;right:26px;top:-6px;font:14px var(--ui);background:#fff;color:#2b2521;border-radius:8px;padding:0 8px;box-shadow:0 2px 4px rgba(0,0,0,.25)', text: '한 번 더!' }));
      const o = { b, it, y: 720, v: 78 + Math.random() * 18, dead: false };
      onTap(b, () => {
        if (o.dead || over) return;
        o.dead = true;
        if (!it.ok) { pts += 15; good++; Sound.sfx('pop'); floatText('+15 거짓 격파!', x + 60, o.y); b.style.transition = 'transform .2s,opacity .2s'; b.style.transform = 'scale(1.4)'; b.style.opacity = 0; }
        else { pts = Math.max(0, pts - 10); bad++; miss(); floatText('앗, 그건 사실이야!', x + 40, o.y, true); b.style.filter = 'grayscale(1)'; b.style.opacity = .4; hint(`"${it.t}"는 기록으로 확인되는 사실이야. 사실은 날려 보내 줘!`, 'wow', 3500); }
        setTimeout(() => b.remove(), 250);
      });
      root.append(b); alive.push(o);
    };
    const loop = now => {
      const rem = pool.length - idx;
      info.textContent = `남은 풍선 ${rem + alive.filter(o => !o.dead).length}개 · ${pts}점`;
      if (rem > 0 && now - last > gap) { last = now; spawn(); }
      for (const o of alive) {
        if (o.dead) continue;
        o.y -= o.v / 60; o.b.style.top = o.y + 'px';
        if (o.y < -170) { o.dead = true; o.b.remove(); if (o.it.ok) pts += 5; }
      }
      alive = alive.filter(o => !o.dead);
      if (rem <= 0 && !alive.length) return end();
      raf = requestAnimationFrame(loop);
    };
    const end = async () => {
      if (over) return; over = true; cancelAnimationFrame(raf); DEV.solve = null; clearHint();
      addScore(Math.min(pts, CH[key]), 640, 300);
      const box = el('div', { class: 'panel popin', style: 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:620px;padding:28px;text-align:center' },
        el('div', { style: 'font:32px var(--ui)', text: '풍선 작전 끝!' }),
        el('div', { class: 'msg', style: 'margin-top:12px', text: `거짓 주장 ${good}개를 터뜨렸어!${bad ? `\n사실을 잘못 터뜨린 것은 ${bad}개.` : ''}` }));
      root.append(box);
      await doneBar(box);
      HINT.pos = 'left'; root.remove();
      resolve({ good, bad });
    };
    raf = requestAnimationFrame(loop);
    DEV.solve = () => { pts = CH[key]; end(); };
  });
}
