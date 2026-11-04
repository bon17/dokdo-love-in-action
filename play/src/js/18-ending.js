/* ===== 엔딩, 3줄 설명, 결과 화면 ===== */

const EXAMPLE_LINES = {
  hist: '신라 이사부 때부터 조선의 여러 기록과 대한제국 칙령 제41호까지, 독도는 오랫동안 우리가 알고 다스려 온 땅이다. 일본 정부도 태정관지령에서 독도가 일본과 관계없다고 했다.',
  geo: '독도는 일본 오키섬(약 157.5km)보다 울릉도(약 87.4km)에 훨씬 가깝고, 맑은 날이면 울릉도에서 맨눈으로 보이는 울릉도의 이웃 섬이다.',
  law: '대한제국은 1900년 칙령으로 독도를 다스렸고, 1905년 일본의 편입은 주인 있는 땅을 몰래 가져가려 한 것이라 효력이 없다. 지금도 대한민국이 독도를 실제로 다스리고 있다.',
};

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
      /* 카드에 붙은 근거 이름표와 고르는 칸이 늘 같도록, 그 근거가 이름표인 카드만 보여 준다. */
      const own = CARDS.filter(c => c.cat === k && hasCard(c.id));
      const list = own.length ? own : CARDS.filter(c => c.cat === k);
      const p = el('div', { class: 'panel', style: 'width:1180px;max-height:640px;overflow:auto;padding:20px' });
      p.append(el('div', { style: 'font:26px var(--ui);margin-bottom:12px', text: `${CAT[k].name}: 어떤 증거로 설명할까?` }));
      const g = el('div', { class: 'grid compact', style: 'justify-content:center' });
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
      order.forEach((k, i) => { if (!S.expl[i]) S.expl[i] = (CARDS.find(c => c.cat === k && hasCard(c.id)) || CARDS.find(c => c.cat === k)).id; });
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
      ['narr', '학교 도서관. 하얗게 지워졌던 책에 글자가 다시 또렷하게 떠올랐다. 액자 속 독도도 선명하게 빛난다.'],
      ['gaji:yay', '고마워, 대원! 네가 모은 증거 덕분에 기록이 모두 돌아왔어.'],
      ['gaji', '마지막으로, 네가 찾은 증거로 "독도가 우리 땅인 이유"를 세 줄로 정리해 볼래?'],
    ]);
    await explainBuilder();
    S.finished = true; S.running = false; save();
  },
];

/* 결과 화면 */
function resultTimeSec() { return Math.round(S.playMs / 1000); }
function playerKey(p) { return p.name; }
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
  const grade = gradeOf(S.score), time = resultTimeSec();
  const { best, isNew } = updateBest();
  const root = el('div', { class: 'result' });
  const left = el('div', { class: 'col', style: 'width:560px;flex:none;min-height:0' });
  const right = el('div', { class: 'col', style: 'flex:1;min-width:0;min-height:0' });
  root.append(left, right);
  const wrap = el('div', { class: 'panel', style: 'position:absolute;left:30px;top:15px;width:1220px;height:690px' }, root);
  L.scene.append(wrap);
  const p = S.player;
  // 점수와 등급
  left.append(el('div', { class: 'rbox' },
    el('div', { style: 'text-align:center;font:20px var(--ui);color:#ffd9a8;margin:2px 0 10px', text: S.teacher ? '교사 모드 (기록이 저장되지 않아요)' : `${p.name} 대원의 결과` }),
    el('div', { style: 'display:flex;align-items:center;gap:18px' },
      el('div', { class: 'gradebadge', text: grade }),
      el('div', {}, el('div', { class: 'bigscore', text: fmtNum(S.score) + '점' }),
        el('div', { style: 'font:19px var(--ui);color:#dfe9f5;margin-top:6px', text: `⏱️ 클리어 시간 ${fmtTime(time)}` }),
        el('div', { style: 'font:16px var(--body);color:#bcd3ea;margin-top:3px', text: best ? `🏅 내 최고 기록: ${fmtNum(best.score)}점 · ${best.grade || gradeOf(best.score)}등급 · ${fmtTime(best.time)}${isNew && !S.teacher ? ' (새 기록!)' : ''}` : '' })))));
  const st = el('div', { class: 'rbox' });
  st.append(el('div', { class: 'stats' },
    el('div', { class: 'stat' }, el('span', { text: '🗃️ 증거 카드' }), el('b', { text: `${ownN} / ${CARDS.length}` })),
    el('div', { class: 'stat' }, el('span', { text: '🎵 노래 단서' }), el('b', { text: `${CLUES.filter(c => S.clues[c.id] === 'solved').length} / ${CLUES.length}` })),
    el('div', { class: 'stat' }, el('span', { text: '🦭 숨은 강치' }), el('b', { text: `${Object.keys(S.seals).length} / 8` })),
    el('div', { class: 'stat' }, el('span', { text: '🔥 최고 콤보' }), el('b', { text: `${S.maxCombo}` }))));
  left.append(st);
  const ex = el('div', { class: 'rbox expl', style: 'flex:1;min-height:0;overflow:auto' }, el('div', { style: 'font:21px var(--ui);margin-bottom:4px', text: '✍️ 내가 정리한 "독도가 우리 땅인 이유"' }));
  ['hist', 'geo', 'law'].forEach((k, i) => ex.append(el('div', { class: 'ln' }, el('div', { class: 'k', style: `background:var(--${k})`, text: CAT[k].name }), el('div', { class: 'v', text: S.expl[i] ? CARD[S.expl[i]].line : '—' }))));
  left.append(ex);
  // 등급 기준: 만점의 몇 % 이상인지, 몇 점부터인지 보여 준다.
  const gr = el('div', { class: 'rbox' }, el('div', { class: 'rhead' }, el('span', { text: '📊 등급 기준' }), el('span', { class: 'rnote', text: `만점 ${fmtNum(MAX_SCORE)}점` })));
  const next = GRADES[GRADES.findIndex(x => x.g === grade) - 1];
  gr.append(el('div', { class: 'grades' }, ...GRADES.map(x => el('div', { class: 'gcell' + (x.g === grade ? ' on' : '') },
    el('div', { class: 'gl2', text: x.g }),
    el('div', { class: 'gp', text: x.min ? `${fmtNum(x.min)}점 이상` : `${fmtNum(GRADES[GRADES.length - 2].min)}점 아래` }),
    el('div', { class: 'gr2', text: x.min ? `만점의 ${Math.round(x.r * 100)}%` : `만점의 ${Math.round(GRADES[GRADES.length - 2].r * 100)}% 아래` })))));
  gr.append(el('div', { class: 'gtip', text: next ? `${next.g}등급까지 ${fmtNum(next.min - S.score)}점 남았어요.` : '최고 등급이에요! 이제 칭호를 모두 모아 보세요.' }));
  right.append(gr);
  // 칭호 (업적 배지)
  const got = BADGES.filter(b => S.badges[b.id]).length;
  right.append(el('div', { class: 'rbox' }, el('div', { class: 'rhead' }, el('span', { text: '🎖️ 내 칭호' }), el('span', { class: 'rnote', text: `${got} / ${BADGES.length}` })),
    el('div', { class: 'titles' }, ...BADGES.map(b => el('div', { class: 'tcell' + (S.badges[b.id] ? '' : ' off') },
      el('div', { class: 'ti', text: b.ico }), el('div', {}, el('div', { class: 'tn', text: b.name }), el('div', { class: 'td', text: b.desc })))))));
  const endMsg = el('div', { class: 'rbox', style: 'margin-top:auto' });
  endMsg.append(el('div', { class: 'msg', style: 'font-size:18px;line-height:1.65', text: '수고했어요, 독도 타임 패트롤 대원!\n시간이 남았다면 아래 두 가지에 도전해 보세요.' }),
    bulletLine('•', el('span', {}, el('b', { text: '증거 도감 보기:' }), ko(' 모은 증거와 낱말 풀이를 다시 읽으며 복습해요.')), { cls: 'msg', style: 'font-size:17px;line-height:1.6;margin:4px 0 0 8px' }),
    bulletLine('•', el('span', {}, el('b', { text: '다시 도전:' }), ko(' 한 번 더 공부하면서 더 높은 등급과 칭호에 도전해요. 최고 기록을 넘어서 보세요!')), { cls: 'msg', style: 'font-size:17px;line-height:1.6;margin:0 0 0 8px' }),
    el('div', { style: 'display:flex;gap:14px;justify-content:center;margin-top:12px' },
      onTap(el('button', { class: 'btn blue', text: '📖 증거 도감 보기' }), () => { Sound.sfx('tap'); openBook(); }),
      onTap(el('button', { class: 'btn', text: '🔄 다시 도전' }), async () => {
        if (await confirmBox('처음부터 다시 도전할까요?\n최고 기록은 그대로 남아요.')) retry();
      })));
  right.append(endMsg);
}
function retry() {
  const p = S.player, a = S.attempt || 1;
  S = newState(p, a + 1);
  S.stage = 1; S.step = 0; save();
  try { sessionStorage.setItem(KEY.auto, '1'); } catch (e) { }
  location.reload();
}
