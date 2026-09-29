/* ===== 엔딩, 3줄 설명, 결과 화면 ===== */

const EXAMPLE_LINES = {
  hist: '신라 이사부 때부터 조선의 여러 기록과 대한제국 칙령 제41호까지, 독도는 오랫동안 우리가 알고 다스려 온 땅이다. 일본 정부도 태정관지령에서 독도가 일본과 관계없다고 했다.',
  geo: '독도는 일본 오키섬(약 157.5km)보다 울릉도(약 87.4km)에 훨씬 가깝고, 맑은 날이면 울릉도에서 맨눈으로 보이는 울릉도의 이웃 섬이다.',
  law: '대한제국은 1900년 칙령으로 독도를 다스렸고, 1905년 일본의 편입은 주인 있는 땅을 몰래 가져가려 한 것이라 효력이 없다. 지금도 대한민국이 독도를 실제로 다스리고 있다.',
};
const inCat = (c, k) => c.cat === k || (c.alt || []).includes(k);

/* 학생이 모은 카드로 "독도가 우리 땅인 이유" 3줄을 먼저 완성하고, 그다음에 예시를 본다. */
function explainBuilder() {
  return new Promise(resolve => {
    const box = el('div', { class: 'panel', style: 'width:1180px;padding:24px 30px' });
    box.append(el('div', { style: 'font:32px var(--ui);text-align:center', text: '✍️ 독도가 우리 땅인 이유, 세 줄로 정리하기' }),
      el('div', { style: 'font:19px var(--body);color:#bcd3ea;text-align:center;margin:4px 0 16px', text: '근거마다 내가 모은 증거 카드를 하나씩 골라 봐. 카드가 한 줄 설명이 되어 줄 거야.' }));
    const m = modal(box, { closable: false });
    const rows = {};
    const order = ['hist', 'geo', 'law'];
    for (const [i, k] of order.entries()) {
      const v = el('div', { class: 'msg', style: 'flex:1;font-size:21px;color:#dfe9f5', text: '아직 고르지 않았어요.' });
      const b = onTap(el('button', { class: 'btn small blue', text: '카드 고르기' }), () => pick(k, i));
      rows[k] = { v, b };
      box.append(el('div', { style: 'display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.07);border-radius:14px;padding:12px 16px;margin:10px 0' },
        el('div', { style: `flex:none;width:170px;text-align:center;font:22px var(--ui);background:var(--${k});border-radius:12px;padding:8px`, text: CAT[k].name }), v, b));
    }
    const foot = el('div', { style: 'display:flex;gap:16px;justify-content:center;margin-top:14px' });
    const exBtn = el('button', { class: 'btn green', text: '예시 문장 보기', disabled: true });
    foot.append(exBtn); box.append(foot);
    const refresh = () => {
      order.forEach((k, i) => { const id = S.expl[i]; if (id) { rows[k].v.textContent = CARD[id].line; rows[k].b.textContent = '다시 고르기'; } });
      exBtn.disabled = !S.expl.every(Boolean);
    };
    const pick = (k, i) => {
      const own = CARDS.filter(c => inCat(c, k) && hasCard(c.id));
      const list = own.length ? own : CARDS.filter(c => inCat(c, k));
      const p = el('div', { class: 'panel', style: 'width:1180px;max-height:640px;overflow:auto;padding:20px' });
      p.append(el('div', { style: 'font:26px var(--ui);margin-bottom:12px', text: `${CAT[k].name}: 어떤 증거로 설명할까?` }));
      const g = el('div', { class: 'grid', style: 'justify-content:center' });
      p.append(g);
      const pm = modal(p);
      for (const c of list) {
        const ce = cardEl(c, { mini: true, borrowed: !hasCard(c.id) }); ce.style.cursor = 'pointer';
        onTap(ce, () => {
          Sound.sfx('good');
          if (!S.expl[i]) addScore(30, 640, 300);
          S.expl[i] = c.id; pm.close(); refresh(); save();
        });
        g.append(ce);
      }
    };
    onTap(exBtn, () => {
      Sound.sfx('tap');
      const ex = el('div', { class: 'panel', style: 'width:1100px;padding:26px 32px' });
      ex.append(el('div', { style: 'font:28px var(--ui);text-align:center;margin-bottom:12px', text: '📝 예시 문장과 비교해 봐!' }));
      for (const k of order) ex.append(el('div', { style: 'display:flex;gap:14px;margin:12px 0' },
        el('div', { style: `flex:none;width:170px;text-align:center;font:21px var(--ui);background:var(--${k});border-radius:12px;padding:8px;height:fit-content`, text: CAT[k].name }),
        el('div', { class: 'msg', style: 'font-size:21px', text: EXAMPLE_LINES[k] })));
      ex.append(el('div', { style: 'font:19px var(--body);color:#bcd3ea;text-align:center;margin-top:8px', text: '내가 쓴 세 줄과 무엇이 같고 무엇이 다른지 살펴봐.' }));
      const em = modal(ex, { closable: false });
      ex.append(el('div', { style: 'text-align:center;margin-top:16px' }, onTap(el('button', { class: 'btn', text: '결과 보러 가기' }), () => { em.close(); m.close(); resolve(); })));
      DEV.solve = () => { em.close(); m.close(); resolve(); };
    });
    refresh();
    DEV.solve = () => {
      order.forEach((k, i) => { if (!S.expl[i]) S.expl[i] = (CARDS.find(c => inCat(c, k) && hasCard(c.id)) || CARDS.find(c => inCat(c, k))).id; });
      refresh(); exBtn.click();
    };
  });
}

const ENDING = [
  async () => {
    HUD.show(true); L.hidden.innerHTML = '';
    setBg('bg-ending'); fogFx(0); Sound.play('ending'); setEra('오늘');
    await talk([
      ['narr', '안개가 걷히고, 독도 위로 아침 해가 떠오른다.'],
      ['narr', '되찾은 증거들이 빛이 되어 하나둘 제자리로 돌아간다.'],
    ]);
    setBg('bg-library');
    await talk([
      ['narr', '기산중학교 도서관. 하얗게 지워졌던 책에 글자가 다시 또렷하게 떠올랐다. 액자 속 독도도 선명하게 빛난다.'],
      ['gaji:yay', '고마워, 대원! 네가 모은 증거 덕분에 기록이 모두 돌아왔어.'],
      ['gaji', '마지막으로, 네가 찾은 증거로 "독도가 우리 땅인 이유"를 세 줄로 정리해 볼래?'],
    ]);
    await explainBuilder();
    S.finished = true; S.running = false; save();
  },
];

/* 결과 화면 */
function resultTimeSec() { return Math.round(S.playMs / 1000); }
function playerKey(p) { return `${p.grade}-${p.cls}-${p.name}`; }
function updateBest() {
  const all = store.get(KEY.best, {});
  const k = playerKey(S.player), cur = all[k];
  const rec = { score: S.score, time: resultTimeSec(), grade: gradeOf(S.score), at: Date.now() };
  const better = !cur || rec.score > cur.score || (rec.score === cur.score && rec.time < cur.time);
  if (better && !S.teacher) { all[k] = rec; store.set(KEY.best, all); }
  return { best: better ? rec : cur, isNew: better };
}
async function showResult() {
  clearScene(); L.dialog.innerHTML = ''; L.hidden.innerHTML = ''; fogFx(0);
  HUD.show(false); setBg('bg-library', 'brightness(.45) blur(2px)'); Sound.play('ending');
  const ownN = Object.keys(S.cards).length;
  if (ownN >= CARDS.length) giveBadge('collector');
  if (S.boardMiss === 0 && Object.keys(S.boarded).length >= CARDS.length) giveBadge('sorter');
  const grade = gradeOf(S.score), time = resultTimeSec();
  const { best, isNew } = updateBest();
  if (!S.teacher && !S.submitted) {
    S.submitted = true; save();
    Rank.submit({ g: S.player.grade, c: S.player.cls, n: S.player.name, s: S.score, gr: grade, t: time, cards: ownN, run: S.runId, skip: S.skipped ? 1 : 0 });
  }
  const root = el('div', { class: 'result' });
  const left = el('div', { class: 'col', style: 'width:560px;flex:none;overflow:auto' });
  const right = el('div', { class: 'col', style: 'flex:1;min-width:0' });
  root.append(left, right);
  const wrap = el('div', { class: 'panel', style: 'position:absolute;left:30px;top:15px;width:1220px;height:690px' }, root);
  L.scene.append(wrap);
  const p = S.player;
  left.append(el('div', { class: 'rbox' },
    el('div', { style: 'text-align:center;font:18px var(--ui);color:#ffd9a8', text: SCHOOL }),
    el('div', { style: 'text-align:center;font:19px var(--body);color:#dfe9f5;margin:2px 0 8px', text: S.teacher ? '교사 모드 (기록이 저장되지 않아요)' : `${p.grade}학년 ${p.cls}반 ${p.name} 대원의 결과` }),
    el('div', { style: 'display:flex;align-items:center;gap:18px' },
      el('div', { class: 'gradebadge', text: grade }),
      el('div', {}, el('div', { class: 'bigscore', text: fmtNum(S.score) + '점' }),
        el('div', { style: 'font:19px var(--ui);color:#dfe9f5;margin-top:6px', text: `⏱️ 클리어 시간 ${fmtTime(time)}` }),
        el('div', { style: 'font:16px var(--body);color:#bcd3ea;margin-top:3px', text: best ? `🏅 내 최고 기록: ${fmtNum(best.score)}점 · ${fmtTime(best.time)}${isNew && !S.teacher ? ' (새 기록!)' : ''}` : '' })))));
  const st = el('div', { class: 'rbox' });
  st.append(el('div', { class: 'stats' },
    el('div', { class: 'stat' }, el('span', { text: '🗃️ 증거 카드' }), el('b', { text: `${ownN} / ${CARDS.length}` })),
    el('div', { class: 'stat' }, el('span', { text: '🎵 노래 단서' }), el('b', { text: `${CLUES.filter(c => S.clues[c.id] === 'solved').length} / ${CLUES.length}` })),
    el('div', { class: 'stat' }, el('span', { text: '🦭 숨은 강치' }), el('b', { text: `${Object.keys(S.seals).length} / 8` })),
    el('div', { class: 'stat' }, el('span', { text: '🔥 최고 콤보' }), el('b', { text: `${S.maxCombo}` }))));
  st.append(el('div', { style: 'margin-top:6px' }, ...BADGES.map(b => el('span', { class: 'badge' + (S.badges[b.id] ? '' : ' off'), title: b.desc }, `${b.ico} ${b.name}`))));
  left.append(st);
  const ex = el('div', { class: 'rbox expl' }, el('div', { style: 'font:19px var(--ui);margin-bottom:2px', text: '✍️ 내가 정리한 "독도가 우리 땅인 이유"' }));
  ['hist', 'geo', 'law'].forEach((k, i) => ex.append(el('div', { class: 'ln' }, el('div', { class: 'k', style: `background:var(--${k})`, text: CAT[k].name }), el('div', { class: 'v', text: S.expl[i] ? CARD[S.expl[i]].line : '—' }))));
  left.append(ex);
  // 랭킹
  const rk = el('div', { class: 'rbox', style: 'flex:1;display:flex;flex-direction:column;min-height:0' });
  const tabs = el('div', { class: 'tabs', style: 'margin-bottom:6px' });
  const status = el('div', { style: 'font:16px var(--body);color:#8fa7c0;margin-bottom:6px' });
  const list = el('div', { style: 'flex:1;overflow:auto' });
  rk.append(el('div', { style: 'font:24px var(--ui);margin-bottom:6px', text: '🏆 실시간 랭킹' }), tabs, status, list);
  right.append(rk);
  const endMsg = el('div', { class: 'rbox' });
  endMsg.append(el('div', { class: 'msg', style: 'font-size:18px;line-height:1.65', text: '수고했어요, 독도 타임 패트롤 대원!\n4교시에는 오늘 플레이한 내용을 바탕으로 문제를 풀게 돼요.\n시간이 남았다면 아래 두 가지에 도전해 보세요.' }),
    el('div', { class: 'msg', style: 'font-size:17px;line-height:1.6;margin:4px 0 0 8px', html: '• <b>증거 도감 보기:</b> 모은 증거를 다시 읽으며 복습해요.<br>• <b>다시 도전:</b> 한 번 더 공부하면서 더 높은 점수와 랭킹에 도전해요. 최고 기록을 넘어서 보세요!' }),
    el('div', { class: 'msg', style: 'font-size:18px;margin-top:4px', text: '좋은 결과 있기를 응원해요!' }),
    el('div', { style: 'display:flex;gap:14px;justify-content:center;margin-top:10px' },
      onTap(el('button', { class: 'btn blue', text: '📖 증거 도감 보기' }), () => { Sound.sfx('tap'); openBook(); }),
      onTap(el('button', { class: 'btn', text: '🔄 다시 도전' }), async () => {
        if (await confirmBox('처음부터 다시 도전할까요?\n최고 기록은 그대로 남아요.')) retry();
      })));
  right.append(endMsg);
  let scope = 'class', timer = null, rows = null;
  const myId = await Rank.myId(p);
  const render = () => {
    tabs.innerHTML = '';
    for (const [k, n] of [['class', `${p.grade}학년 ${p.cls}반`], ['grade', `${p.grade}학년 전체`], ['all', '전교']]) tabs.append(onTap(el('button', { class: 'tab' + (k === scope ? ' on' : ''), text: n }), () => { scope = k; render(); }));
    list.innerHTML = '';
    if (!Rank.enabled()) { status.textContent = '랭킹 기능이 아직 설정되지 않았어요. (선생님 설정 필요) 내 최고 기록은 이 기기에 저장돼요.'; return; }
    if (!rows) { status.textContent = '순위를 불러오는 중…'; return; }
    const f = rows.filter(r => scope === 'all' || (r.g === p.grade && (scope === 'grade' || r.c === p.cls)));
    status.textContent = `${f.length}명 참여 · 10초마다 새로 고침${Rank.queue.length ? ' · 내 기록을 보내는 중…' : ''}`;
    f.slice(0, 50).forEach((r, i) => {
      list.append(el('div', { class: 'rank-row' + (r.id === myId ? ' me' : '') },
        el('div', { class: 'rk', text: i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 }), el('div', { class: 'cl', text: `${r.g}학년 ${r.c}반` }), el('div', { class: 'nm', text: r.n }),
        el('div', { class: 'sc', text: fmtNum(r.s) + '점' }), el('div', { class: 'gr', text: r.r }), el('div', { class: 'tm', text: fmtTime(r.t) })));
    });
    const mine = f.findIndex(r => r.id === myId);
    if (mine >= 50) list.append(el('div', { class: 'rank-row me' }, el('div', { class: 'rk', text: mine + 1 }), el('div', { class: 'nm', text: '나' }), el('div', { class: 'sc', text: fmtNum(f[mine].s) + '점' })));
  };
  const load = async () => {
    if (!wrap.isConnected) { clearInterval(timer); return; }
    if (!Rank.enabled()) return render();
    await Rank.flush();
    try { const j = await Rank.list(); if (j && j.ok) rows = j.rows; } catch (e) { }
    render();
  };
  render(); load();
  timer = setInterval(load, 10000);
}
function retry() {
  const p = S.player, a = S.attempt || 1;
  S = newState(p, a + 1);
  S.stage = 1; S.step = 0; save();
  try { sessionStorage.setItem('dokdoTP.auto', '1'); } catch (e) { }
  location.reload();
}
