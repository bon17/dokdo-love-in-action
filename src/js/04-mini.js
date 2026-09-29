/* ===== 여러 단계에서 함께 쓰는 미니게임 ===== */

/* 끌어다 놓기 + 눌러서 고르기를 함께 지원한다. */
function dragItem(node, { onTap: tapFn, onDrop }) {
  let st = null;
  node.style.touchAction = 'none';
  node.addEventListener('pointerdown', e => {
    st = { x: e.clientX, y: e.clientY, drag: false, id: e.pointerId };
    try { node.setPointerCapture(e.pointerId); } catch (er) { }
  });
  node.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.drag && Math.hypot(dx, dy) > 10) { st.drag = true; node.style.zIndex = 50; node.style.transition = 'none'; node.style.pointerEvents = 'none'; }
    if (st.drag) node.style.transform = `translate(${dx / SCALE}px,${dy / SCALE}px) scale(1.05)`;
  });
  const end = e => {
    if (!st) return;
    const s = st; st = null;
    node.style.pointerEvents = '';
    if (s.drag) {
      node.style.transition = 'transform .2s'; node.style.transform = ''; node.style.zIndex = '';
      const under = document.elementsFromPoint(e.clientX, e.clientY);
      onDrop && onDrop(under);
    } else tapFn && tapFn();
  };
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', () => { if (st) { st = null; node.style.transform = ''; node.style.pointerEvents = ''; } });
}

/* 화면 위 조사 지점: 모든 필수 지점을 살펴보면 끝난다. */
function explore({ title, spots }) {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0' });
    let titleEl = null;
    if (title) { titleEl = el('div', { class: 'mg-title', text: title }); root.append(titleEl); }
    L.scene.append(root);
    let busy = false;
    const done = new Set(), req = spots.filter(s => s.req !== false), marks = [];
    const armDev = () => { DEV.solve = () => { const i = spots.findIndex(s => !done.has(s) && s.req !== false); if (i >= 0) marks[i].click(); }; };
    spots.forEach(s => {
      const m = el('div', { class: 'marker', style: { left: s.x + 'px', top: s.y + 'px' } }, s.ico || '🔍', s.label ? el('div', { class: 'ml', text: s.label }) : null);
      marks.push(m);
      onTap(m, async () => {
        if (busy || (s.once !== false && done.has(s))) return;
        busy = true; Sound.sfx('tap'); clearHint();
        root.style.visibility = 'hidden';
        await s.run();
        root.style.visibility = '';
        m.classList.add('done'); done.add(s); busy = false;
        if (req.every(r => done.has(r))) { root.remove(); resolve(); } else armDev();
      });
      root.append(m);
    });
    armDev();
  });
}

/* 숫자 자물쇠 */
function lockPuzzle({ title, answer, note, hintText, reveal, key }) {
  return new Promise(resolve => {
    const n = answer.length, vals = Array(n).fill(0);
    const box = el('div', { class: 'panel', style: 'width:620px;padding:28px;text-align:center' });
    box.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (note) box.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:6px 0 14px', text: note }));
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
    const m = modal(box, { closable: false });
    let tries = 0;
    const finish = () => { DEV.solve = null; Sound.sfx('open'); award(key, tries + 1); setTimeout(() => { m.close(); resolve(); }, 600); };
    box.append(onTap(el('button', { class: 'btn', text: '🔓 열기' }), () => {
      if (vals.join('') === answer) finish();
      else {
        tries++; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        if (wrongFeedback(tries, hintText, '딸깍… 안 열려. 단서를 다시 볼까?')) {
          answer.split('').forEach((c, i) => { vals[i] = +c; digs[i].textContent = c; });
          hint(reveal, 'gaji', 7000); setTimeout(finish, 1800);
        }
      }
    }));
    DEV.solve = () => { tries = 0; finish(); };
  });
}

/* 순서/짝 맞추기: 조각을 알맞은 칸에 넣는다. */
function placeTiles({ title, prompt, slots, tiles, hintText, reveal, key, base, vertical = false, slotW = 250, paper = false, onPlaced }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1180px;padding:22px 26px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (prompt) root.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:4px 0 12px', text: prompt }));
    const slotRow = el('div', { style: `display:flex;${vertical ? 'flex-direction:column;align-items:center;' : 'justify-content:center;flex-wrap:wrap;'}gap:10px;margin:8px 0 18px` });
    const tileRow = el('div', { style: 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;min-height:70px' });
    root.append(slotRow, tileRow);
    const slotEls = slots.map((s, i) => {
      const e = el('div', { class: 'slot', style: `width:${vertical ? 900 : slotW}px;flex-direction:column;${paper ? 'background:rgba(246,236,212,.15);' : ''}` },
        s.label ? el('div', { style: 'font:17px var(--ui);color:#ffd9a8', text: s.label }) : null, el('div', { class: 'sv', style: 'font:22px var(--body)', text: s.ph || '?' }));
      e.dataset.i = i; slotRow.append(e); return e;
    });
    const m = modal(root, { closable: false });
    let sel = null, tries = 0, left = tiles.length;
    const fill = (tile, ti) => {
      const t = tiles[ti], s = slotEls[t.slot];
      s.classList.add('filled'); s.querySelector('.sv').textContent = t.t;
      tile.classList.add('done'); tile.classList.remove('sel'); if (sel === tile) sel = null;
      Sound.sfx('good'); left--;
      if (onPlaced) onPlaced(t, s);
      if (!left) { DEV.solve = null; award(key, Math.min(tries + 1, 4), base); setTimeout(() => { m.close(); resolve(tries); }, 900); }
    };
    const tryPut = (tile, slotIdx) => {
      const ti = +tile.dataset.i;
      if (tile.classList.contains('done')) return;
      if (tiles[ti].slot === slotIdx && !slotEls[slotIdx].classList.contains('filled')) fill(tile, ti);
      else {
        tries++;
        const s = slotEls[slotIdx]; s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
        const t = typeof hintText === 'function' ? hintText(tiles[ti], slotIdx) : hintText;
        if (wrongFeedback(tries, t)) {
          hint(reveal || '같이 맞춰 보자!', 'gaji', 6000);
          tileEls.forEach((te, j) => { if (!te.classList.contains('done')) setTimeout(() => fill(te, j), 500 + j * 350); });
        }
      }
    };
    const order = shuffle(tiles.map((t, i) => i));
    const tileEls = [];
    order.forEach(i => {
      const t = el('div', { class: 'tile', text: tiles[i].t, style: paper ? 'background:#fbf3df;font-family:var(--old);font-size:20px;max-width:520px' : 'max-width:420px' });
      t.dataset.i = i; tileEls[i] = t;
      dragItem(t, {
        onTap: () => { Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = t; t.classList.add('sel'); },
        onDrop: under => { const s = under.find(x => x.classList && x.classList.contains('slot')); if (s) tryPut(t, +s.dataset.i); },
      });
      tileRow.append(t);
    });
    slotEls.forEach((s, i) => onTap(s, () => { if (sel) tryPut(sel, i); }));
    DEV.solve = () => tileEls.forEach((te, j) => { if (!te.classList.contains('done')) fill(te, j); });
  });
}

/* 여러 개 중 알맞은 것을 골라 쓰기 (반박 연습 등) */
function pickItem({ who = 'fog', claim, prompt, items, correct, hintText, reveal, key, base }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1160px;padding:22px;text-align:center' });
    if (claim) root.append(el('div', { style: 'display:flex;gap:14px;align-items:center;justify-content:center;margin-bottom:10px' },
      el('img', { src: img('fog'), style: 'width:110px' }),
      el('div', { style: 'font:28px var(--ui);background:rgba(106,79,179,.5);padding:14px 22px;border-radius:18px;max-width:840px', text: `"${claim}"` })));
    root.append(el('div', { class: 'msg', style: 'font-size:22px;margin-bottom:14px', text: prompt }));
    const row = el('div', { style: 'display:flex;gap:14px;justify-content:center;flex-wrap:wrap' });
    root.append(row);
    const m = modal(root, { closable: false });
    let tries = 0;
    const finish = () => { DEV.solve = null; award(key, Math.min(tries + 1, 4), base); setTimeout(() => { m.close(); resolve(tries); }, 700); };
    items.forEach(it => {
      const node = it.card ? cardEl(CARD[it.card], { mini: true }) : el('div', { class: 'tile', style: 'width:230px;min-height:110px;font-size:21px', text: it.t });
      node.style.cursor = 'pointer';
      onTap(node, () => {
        if (correct.includes(it.id)) {
          Sound.sfx('hit'); node.style.outline = '5px solid #7fe0a8'; finish();
        } else {
          tries++; node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
          if (wrongFeedback(tries, hintText, it.why || '그것만으로는 안개를 물리치기 어려워. 다시 골라 볼까?')) { hint(reveal, 'gaji', 6500); finish(); }
          else if (it.why && tries >= 2) hint(it.why + '\n' + hintText, 'gaji');
        }
      });
      row.append(node);
    });
    DEV.solve = () => { tries = 0; finish(); };
  });
}

/* 꾹 눌러 도장 찍기 */
function pressStamp({ title, note, label = '確認', color = '#c0392b', doc, key }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:900px;padding:24px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }));
    if (note) root.append(el('div', { class: 'msg', style: 'font-size:20px;color:#bcd3ea;margin:4px 0 12px', text: note }));
    const paper = el('div', { class: 'paper', style: 'position:relative;margin:0 auto 18px;width:760px;padding:22px 30px;text-align:left;font:22px/1.7 var(--old);white-space:pre-line' });
    paper.textContent = doc;
    root.append(paper);
    const stamp = el('div', { style: `width:130px;height:130px;margin:0 auto;border-radius:18px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;
      font:34px/1.1 var(--old);cursor:pointer;box-shadow:0 8px 0 #7a1f16,0 12px 20px rgba(0,0,0,.4);position:relative;overflow:hidden;touch-action:none`, html: label });
    const ring = el('div', { style: 'position:absolute;left:0;bottom:0;height:8px;width:0;background:#ffe6a8' });
    stamp.append(ring);
    root.append(stamp, el('div', { style: 'font:19px var(--ui);color:#bcd3ea;margin-top:10px', text: '도장을 꾹 누르고 있어 봐!' }));
    const m = modal(root, { closable: false });
    let t0 = 0, raf = 0, done = false;
    const finish = () => {
      if (done) return; done = true; cancelAnimationFrame(raf);
      Sound.sfx('stamp');
      paper.append(el('div', { style: `position:absolute;right:40px;bottom:16px;width:110px;height:110px;border:6px solid ${color};border-radius:14px;color:${color};
        display:flex;align-items:center;justify-content:center;font:28px/1.1 var(--old);transform:rotate(-8deg);opacity:.85;animation:popIn .3s`, html: label }));
      if (key) award(key, 1);
      DEV.solve = null;
      setTimeout(() => { m.close(); resolve(); }, 1100);
    };
    const loop = () => { const p = Math.min(1, (performance.now() - t0) / 700); ring.style.width = p * 100 + '%'; if (p >= 1) finish(); else raf = requestAnimationFrame(loop); };
    stamp.addEventListener('pointerdown', e => { if (done) return; t0 = performance.now(); raf = requestAnimationFrame(loop); stamp.style.transform = 'translateY(6px)'; });
    const up = () => { if (done) return; cancelAnimationFrame(raf); ring.style.width = 0; stamp.style.transform = ''; };
    stamp.addEventListener('pointerup', up); stamp.addEventListener('pointerleave', up); stamp.addEventListener('pointercancel', up);
    DEV.solve = finish;
  });
}

/* 짝 맞추기 (기억력 카드) */
function memoryGame({ title, pairs, key, base = 150 }) {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1160px;padding:20px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: title }),
      el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin:4px 0 12px', text: '카드를 두 장씩 뒤집어 사건과 그 내용을 짝지어 봐!' }));
    const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(4,260px);gap:12px;justify-content:center' });
    root.append(grid);
    const m = modal(root, { closable: false });
    const deck = shuffle(pairs.flatMap((p, i) => [{ i, t: p[0], k: 'a' }, { i, t: p[1], k: 'b' }]));
    let open = [], found = 0, flips = 0, lock = false;
    const els = deck.map(d => {
      const c = el('div', { style: `height:118px;border-radius:14px;display:flex;align-items:center;justify-content:center;padding:8px 12px;cursor:pointer;
        background:#2b4f78;border:3px solid #8fd3ff;font:34px var(--ui);color:#cfe6ff;transition:transform .2s`, text: '?' });
      c.dataset.i = d.i;
      onTap(c, () => {
        if (lock || c.dataset.open || c.dataset.done) return;
        Sound.sfx('tap');
        c.dataset.open = 1; c.textContent = d.t; c.style.background = d.k === 'a' ? '#fff3dc' : '#e3f1ff'; c.style.color = '#2b2521';
        c.style.font = d.k === 'a' ? '23px var(--ui)' : '19px/1.4 var(--body)';
        open.push(c);
        if (open.length === 2) {
          flips++; lock = true;
          const [a, b] = open;
          if (a.dataset.i === b.dataset.i) {
            Sound.sfx('good'); a.dataset.done = b.dataset.done = 1; a.style.borderColor = b.style.borderColor = '#2e9e6a';
            a.style.background = b.style.background = '#d8f5e4';
            open = []; lock = false; found++;
            if (found === pairs.length) done();
          } else setTimeout(() => {
            for (const x of open) { delete x.dataset.open; x.textContent = '?'; x.style.background = '#2b4f78'; x.style.color = '#cfe6ff'; x.style.font = '34px var(--ui)'; }
            open = []; lock = false;
          }, 900);
        }
      });
      grid.append(c); return c;
    });
    const done = () => {
      DEV.solve = null;
      const extra = Math.max(0, flips - pairs.length);
      addScore(Math.max(40, base - extra * 12), 640, 300);
      setTimeout(() => { m.close(); resolve(); }, 900);
    };
    DEV.solve = () => { flips = pairs.length; done(); };
  });
}

/* 거짓 주장 풍선: 거짓은 터뜨리고 사실은 놓아준다. */
function balloonGame({ items, secs = 25, key }) {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(120,170,220,.55),rgba(20,50,90,.55))' });
    L.scene.append(root);
    const head = el('div', { class: 'mg-title', html: '💥 <b>거짓 주장</b>은 터뜨리고, 🕊️ <b>기록된 사실</b>은 날려 보내!' });
    const info = el('div', { style: 'position:absolute;right:24px;top:80px;font:24px var(--ui);background:rgba(8,26,48,.85);padding:8px 16px;border-radius:12px;z-index:3' });
    root.append(head, info);
    let t0 = performance.now(), last = -2000, raf, alive = [], pts = 0, good = 0, bad = 0, over = false;
    const pool = shuffle(items);
    let idx = 0;
    const spawn = now => {
      const it = pool[idx++ % pool.length];
      const x = 90 + Math.random() * 860;
      const col = ['#ff9f7a', '#8fd3ff', '#ffd166', '#b8e986', '#d7a8ff'][Math.floor(Math.random() * 5)];
      const b = el('div', { style: `position:absolute;left:${x}px;top:720px;width:280px;height:150px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8,${col} 45%);
        box-shadow:0 8px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:14px 26px;text-align:center;font:19px/1.35 var(--ui);color:#1d2530;cursor:pointer` }, it.t);
      b.append(el('div', { style: 'position:absolute;left:50%;bottom:-38px;width:2px;height:40px;background:#fff8' }));
      const o = { b, it, y: 720, v: 85 + Math.random() * 25, dead: false };
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
      const el2 = (now - t0) / 1000, rem = Math.max(0, secs - el2);
      info.textContent = `남은 시간 ${Math.ceil(rem)}초 · ${pts}점`;
      if (rem > 0 && now - last > 1500) { last = now; spawn(now); }
      for (const o of alive) {
        if (o.dead) continue;
        o.y -= o.v / 60; o.b.style.top = o.y + 'px';
        if (o.y < -170) { o.dead = true; o.b.remove(); if (o.it.ok) pts += 5; }
      }
      alive = alive.filter(o => !o.dead);
      if (rem <= 0 && !alive.length) return end();
      raf = requestAnimationFrame(loop);
    };
    const end = () => {
      if (over) return; over = true; cancelAnimationFrame(raf); DEV.solve = null;
      addScore(Math.min(pts, CH[key]), 640, 300);
      root.remove();
      resolve({ good, bad });
    };
    raf = requestAnimationFrame(loop);
    DEV.solve = () => { pts = CH[key]; end(); };
  });
}
