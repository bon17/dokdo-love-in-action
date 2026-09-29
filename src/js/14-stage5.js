/* ===== 5단계: 특종 기자 수사 ===== */
SPK.shimaneOff = { name: '시마네현 관리', img: 'char-shimane', ini: '관', color: 'gray' };
SPK.minister = { name: '의정부 참정대신', img: 'char-minister', ini: '참', color: 'blue' };

/* 모순 찾기: 주장 속 표현과 부딪히는 증거를 붉은 실로 잇는다. */
function contradictionGame() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:64px 0 0 0;background:rgba(40,28,18,.72)' });
    L.scene.append(root);
    root.append(el('div', { class: 'mg-title', style: 'top:12px;white-space:nowrap', text: '🧵 취재 수첩을 고른 뒤, 부딪히는 주장의 표현을 눌러 붉은 실로 이어!' }));
    const poster = el('div', { class: 'paper', style: 'position:absolute;left:40px;top:80px;width:470px;padding:22px 26px;font:21px/1.8 var(--old)' });
    poster.append(el('div', { style: 'font:700 26px/1.4 var(--old);text-align:center;margin-bottom:8px;white-space:pre-line', text: '시마네현 고시 제40호\n(1905년 2월 22일)' }),
      el('div', {}, gtext('북위 37도 9분 30초, 동경 131도 55분, 오키섬에서 서북쪽으로 85해리 떨어진 섬을 "다케시마"라 부르고, 이제부터 본현 소속 오키도사의 소관으로 정한다.')),
      el('div', { style: 'margin-top:14px;padding-top:10px;border-top:2px dashed #b89a66;font:20px var(--ui);color:#5a2d18', text: '안개의 주장:' }));
    const slot = el('div', { class: 'hintslot' });
    const claims = [
      { id: 'A', t: '"독도는 주인 없는 섬이었다"' },
      { id: 'B', t: '"정당한 절차로 편입했다"' },
    ].map(c => { const e = el('div', { class: 'tile', style: 'display:flex;margin:10px 0;background:#ffe3d6;font-size:24px', text: c.t }); e.dataset.id = c.id; poster.append(e); return e; });
    poster.append(slot);
    root.append(poster);
    hintHost(slot);
    const endBox = el('div', { style: 'position:absolute;left:560px;right:40px;bottom:12px;display:flex;justify-content:center' });
    const notes = [
      { id: 1, ok: 'A', t: '📜 1900년 대한제국 칙령 제41호\n울도군이 "석도"를 관할한다', why: '칙령이 정한 것은 "누가 다스렸는가"야. 어느 표현과 부딪힐까?' },
      { id: 2, ok: 'A', t: '🚢 1904년 군함 니타카의 일지\n"한인들은 독도라고 쓴다"', why: '한국 사람들이 이미 이름을 붙여 부르던 섬이라면… 어느 표현과 부딪힐까?' },
      { id: 3, ok: 'A', t: '🦭 1904년 나카이의 처음 생각\n"한국 땅이니 한국 정부에 빌려야지"', why: '편입을 청원한 사람조차 처음엔 누구 땅이라고 생각했지?' },
      { id: 4, ok: 'B', t: '⚔️ 1904~1905년 러일전쟁\n일본은 독도에 망루를 세워 군사적으로 쓰려 했다', why: '전쟁 중에, 군사적 필요로 서둘러 편입한 것이 "정당한 절차"일까?' },
      { id: 5, ok: 'B', t: '🤫 1905년 고시 방법\n현의 고시로 알렸고, 대한제국에는 알리지 않았다', why: '주인에게 알리지도 않고 가져간 것이 "정당한 절차"일까?' },
    ];
    const col = el('div', { style: 'position:absolute;right:40px;top:76px;width:560px;display:flex;flex-direction:column;gap:12px' });
    const svg = el('div', { style: 'position:absolute;inset:0;pointer-events:none' });
    root.append(svg, col, endBox);
    const noteEls = notes.map(n => {
      const e = el('div', { class: 'tile', style: 'justify-content:flex-start;text-align:left;white-space:pre-line;font:20px/1.45 var(--ui);background:#fdf6e3' }, el('span', {}, gtext(n.t)));
      e.dataset.id = n.id; col.append(e); return e;
    });
    let sel = null, tries = 0, linked = 0;
    const lines = [];
    const drawLine = (a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), r0 = root.getBoundingClientRect();
      const x1 = (ra.left - r0.left) / SCALE, y1 = (ra.top + ra.height / 2 - r0.top) / SCALE;
      const x2 = (rb.right - r0.left) / SCALE, y2 = (rb.top + rb.height / 2 - r0.top) / SCALE;
      lines.push(`<path d="M${x1} ${y1} C ${x1 - 120} ${y1}, ${x2 + 120} ${y2}, ${x2} ${y2}" stroke="#d63a2f" stroke-width="4" fill="none"/>`);
      svg.innerHTML = `<svg width="1280" height="656">${lines.join('')}</svg>`;
    };
    const link = (noteEl, claimEl) => {
      const n = notes.find(x => x.id === +noteEl.dataset.id);
      if (noteEl.dataset.done) return;
      if (n.ok === claimEl.dataset.id) {
        noteEl.dataset.done = 1; noteEl.style.background = '#ffd6cf'; noteEl.classList.remove('sel'); sel = null;
        Sound.sfx('hit'); drawLine(noteEl, claimEl); floatText('모순 발견!', 760, 300);
        award('s5_links', 1, 60); linked++;
        if (linked === notes.length) { DEV.solve = null; HINT.host = null; doneBar(endBox, { msg: '모순 다섯 개를 모두 찾았어!' }).then(() => { root.remove(); resolve(tries); }); }
      } else {
        tries++; noteEl.classList.remove('shake'); void noteEl.offsetWidth; noteEl.classList.add('shake');
        if (wrongFeedback(tries, n.why, n.why)) { tries = 0; link(noteEl, claims.find(c => c.dataset.id === n.ok)); }
      }
    };
    noteEls.forEach(e => dragItem(e, {
      onTap: () => { if (e.dataset.done) return; Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = e; e.classList.add('sel'); },
      onDrop: under => { const c = under.find(x => claims.includes(x)); if (c) link(e, c); },
    }));
    claims.forEach(c => onTap(c, () => { if (sel) link(sel, c); else hint('먼저 오른쪽의 취재 수첩을 하나 골라 줘!', 'gaji', 3000); }));
    DEV.solve = () => noteEls.forEach(e => { if (!e.dataset.done) link(e, claims.find(c => c.dataset.id === notes.find(n => n.id === +e.dataset.id).ok)); });
  });
}

/* 날짜 비교: 러일전쟁 기간과 고시 날짜를 한 창에서 보고, 창 안의 답 단추로 고른다. */
function dateCompare() {
  return new Promise(resolve => {
    const w = el('div', { class: 'panel', style: 'width:1120px;padding:22px 30px 24px;text-align:center' });
    w.append(el('div', { style: 'font:28px var(--ui);margin-bottom:26px', text: '📅 날짜 비교: 노래 가사를 팩트 체크하자!' }));
    const bar = el('div', { style: 'position:relative;height:110px;width:1040px;margin:0 auto;text-align:left' });
    const X = d => 40 + (d - 1904) * 440;
    bar.append(el('div', { style: 'position:absolute;left:0;right:0;top:50px;height:4px;background:#8fa7c0' }));
    for (const [y, t] of [[1904, '1904년'], [1905, '1905년'], [1906, '1906년']]) bar.append(el('div', { style: `position:absolute;left:${X(y) - 30}px;top:78px;width:60px;text-align:center;font:18px var(--ui);color:#bcd3ea`, text: t }),
      el('div', { style: `position:absolute;left:${X(y) - 1}px;top:44px;width:2px;height:16px;background:#8fa7c0` }));
    bar.append(el('div', { style: `position:absolute;left:${X(1904 + 1 / 12)}px;width:${X(1905 + 8 / 12) - X(1904 + 1 / 12)}px;top:34px;height:36px;border-radius:10px;background:rgba(214,58,47,.55);border:2px solid #ff8a7a;font:19px var(--ui);text-align:left;padding-left:14px;line-height:32px;white-space:nowrap`, text: '⚔️ 러일전쟁 (1904년 2월 ~ 1905년 9월)' }));
    bar.append(el('div', { style: `position:absolute;left:${X(1905 + 1.7 / 12) - 2}px;top:0;width:4px;height:100px;background:#ffd166` }),
      el('div', { style: `position:absolute;left:${X(1905 + 1.7 / 12) - 180}px;top:-22px;width:360px;text-align:center;white-space:nowrap;font:18px var(--ui);color:#ffd166`, text: '📌 시마네현 고시 (1905년 2월 22일)' }));
    w.append(bar);
    const m = modal(w, { closable: false });
    panelQuiz({ host: w, key: 's5_fact', text: '붉은 막대와 노란 선을 비교해 봐. 시마네현 고시가 나온 건 언제일까?',
      options: [
        { t: '러일전쟁이 한창일 때', ok: true },
        { t: '러일전쟁이 끝난 직후', re: '붉은 막대가 전쟁 기간이야. 노란 선(고시)은 막대의 안쪽일까, 바깥쪽일까?' },
        { t: '러일전쟁이 일어나기 전', re: '붉은 막대가 시작되는 때를 봐. 노란 선은 그보다 앞일까, 뒤일까?' },
      ] }).then(async () => {
      await doneBar(w, { msg: '노란 선은 붉은 막대 한가운데! 전쟁이 한창일 때였어.' });
      m.close(); resolve();
    });
  });
}

/* 대한제국이 빼앗긴 순서 속에서 독도 사건의 뜻을 찾는다. 연도 맞히기가 아니라, 카드에 적힌 "무엇을 빼앗겼는지"를 읽고 답한다. */
function lossOrder() {
  return new Promise(async resolve => {
    const w = el('div', { class: 'panel', style: 'width:1200px;padding:16px 24px 18px;text-align:center' });
    w.append(el('div', { style: 'font:28px var(--ui)', text: '📅 일본이 대한제국을 빼앗아 간 순서' }),
      el('div', { style: 'font:18px var(--body);color:#bcd3ea;margin:2px 0 10px' }, gtext('왼쪽에서 오른쪽으로 시간이 흘러. 카드마다 무엇을 빼앗겼는지 읽어 봐. 밑줄 친 낱말을 누르면 뜻이 나와.')));
    const steps = [
      { y: '1904년 2월', n: '한일의정서', ico: '🪖', d: '일본군이 대한제국 땅을\n전쟁에 마음대로 쓰게 됨' },
      { y: '1905년 2월', n: '❓ 독도 사건', ico: '🏝️', d: '시마네현 고시로\n독도를 가져가려 함', dk: true },
      { y: '1905년 11월', n: '을사늑약', ico: '✉️', d: '다른 나라와 외교할 권리\n(외교권)를 빼앗김' },
      { y: '1910년 8월', n: '국권 피탈', ico: '⛓️', d: '나라를 완전히 빼앗김' },
    ];
    const row = el('div', { class: 'loss-row' });
    let dkCard;
    steps.forEach((st, i) => {
      if (i) row.append(el('div', { class: 'loss-arrow', text: '▶' }));
      const c = el('div', { class: 'loss-card' + (st.dk ? ' dk' : '') },
        el('div', { class: 'ly', text: st.y }), el('div', { class: 'li', text: st.ico }),
        el('div', { class: 'ln' }, gtext(st.n)), el('div', { class: 'ld', text: st.d }));
      if (st.dk) dkCard = c;
      row.append(c);
    });
    w.append(row, el('div', { class: 'loss-axis' }, el('span', { text: '먼저' }), el('i'), el('span', { text: '나중' })));
    const qbox = el('div');
    w.append(qbox);
    const m = modal(w, { closable: false });
    await panelQuiz({ host: qbox, key: 's5_bar', base: 25, cols: 1, text: '1905년 2월 시마네현이 독도를 가져가려 했을 때, 대한제국은 어떤 상태였을까?',
      options: [
        { t: '외교권도 나라도 아직 빼앗기지 않았다. 다만 한일의정서로 일본군이 땅을 전쟁에 쓰고 있었다.', ok: true },
        { t: '을사늑약으로 이미 외교권을 빼앗긴 뒤였다.', re: '"외교권을 빼앗김"이 적힌 카드를 찾아봐. 그 일은 독도 사건보다 앞일까, 뒤일까?' },
        { t: '국권 피탈로 나라를 완전히 빼앗긴 뒤였다.', re: '"나라를 완전히 빼앗김" 카드는 맨 오른쪽, 가장 나중이야. 독도 사건은 그보다 앞이었어.' },
      ] });
    dkCard.classList.add('on');
    dkCard.querySelector('.ln').textContent = ko('독도 편입 시도');
    Sound.sfx('ping');
    await sleep(500);
    qbox.innerHTML = '';
    await panelQuiz({ host: qbox, key: 's5_bar', base: 25, cols: 1, text: '외교권도, 나라도 빼앗기기 전에 독도부터 가져가려 했어. 그렇다면 독도는 어떤 땅이라고 할 수 있을까?',
      options: [
        { t: '일본이 대한제국을 빼앗아 가는 과정에서 가장 먼저 희생된 우리 땅', ok: true },
        { t: '나라를 모두 빼앗긴 뒤에야 빼앗긴 땅', re: '카드의 순서를 다시 봐. 독도 사건은 나라를 완전히 빼앗기기 5년도 더 전이었어.' },
        { t: '대한제국과는 아무 상관이 없던 땅', re: '4단계에서 대한제국은 1900년 칙령으로 독도를 다스렸어. 상관없는 땅이 아니었지.' },
      ] });
    qbox.innerHTML = '';
    qbox.append(el('div', { class: 'loss-banner' }, gtext('🏝️ 독도는 일본이 대한제국을 빼앗아 가는 과정에서\n가장 먼저 희생된 우리 땅이에요.')));
    Sound.sfx('clear');
    await doneBar(w);
    m.close(); resolve();
  });
}

const STAGE5 = [
  async () => {
    setBg('bg-stage5'); fogFx(0.25); Sound.play('mystery'); placeSeal(5);
    await timeJump('1904~1905년 · 대한제국', '러일전쟁 중의 신문사');
    await talk([
      ['narr', '1905년, 어느 신문사의 인쇄소. 기자가 된 당신의 책상에 고시문 한 장이 떨어졌다.'],
      ['fog', '크크… 1905년, 일본은 주인 없는 섬을 정당하게 편입했다! 이걸로 끝이야!'],
      ['gaji', '기자라면 확인부터 해야지! 이 주장이 사실인지 취재해 보자. 인쇄소 곳곳에 자료가 있어.'],
    ]);
    await explore({
      title: '📰 취재를 시작하자! 자료 세 가지를 모두 살펴봐.',
      spots: [
        { x: 270, y: 380, ico: '🦭', label: '어부의 청원서', run: async () => {
          setBg('scene-gangchi');
          await talk([
            ['narr', '오키섬의 어업가 나카이 요자부로는 독도에서 강치를 잡아 가죽과 기름을 팔았다.'],
            ['narr', '강치잡이를 혼자 차지하고 싶었던 그는, 처음에는 독도를 한국 땅이라고 여겨 대한제국 정부에 섬을 빌리려 했다.'],
            ['narr', '그런데 일본 정부 관리들의 권유를 받고, 독도를 일본 땅으로 편입해 빌려 달라는 청원서를 냈다. 1904년의 일이다.'],
            ['gaji:sad', '그 뒤로 강치잡이는 더 심해졌어. 수많은 강치가 잡혀 갔지…'],
            ['gaji:sad', '결국 독도에서 강치는 모두 사라졌어. 마구 잡는 남획이 가장 큰 까닭이었대. 나는… 그 강치들의 기억을 간직하고 있어.'],
          ]);
          await getCard('gangchi');
          setBg('bg-stage5');
        } },
        { x: 660, y: 300, ico: '🚢', label: '군함의 일지', run: async () => {
          await showDoc({ title: '일본 군함 니타카의 행동일지', era: '1904년 9월 · 러일전쟁 중의 해군 기록',
            lines: ['마쓰시마(울릉도)에서\n리앙코르도암을 실제로 본 사람에게 들었다.', '리앙코르도암을 한인들은 "독도"라고 쓰고,\n일본 어부들은 줄여서 "리양코섬"이라 부른다.',
              { t: '이 무렵 일본에서는 울릉도를 "마쓰시마", 독도를 "리앙코르도암(리앙쿠르 암)"이라고 불렀다.', note: true }] });
          await say('gaji:wow', '1904년에 이미 한국 사람들이 "독도"라는 이름을 쓰고 있었다는 거야! 그것도 일본 군함의 기록에!');
          await talk([
            ['gaji:wow', '그런데 잠깐, 3단계에서는 "마쓰시마"가 독도였잖아. 여기서는 왜 울릉도를 "마쓰시마"라고 불렀을까?'],
            ['gaji', '19세기에 동해를 지나던 서양 배들이 지도를 만들면서 울릉도의 위치를 잘못 적었어. 그 지도에는 있지도 않은 섬이 "다케시마", 진짜 울릉도가 "마쓰시마"로 적혔지.'],
            ['gaji', '그 지도가 일본에 전해지면서 이름이 뒤섞였어. 그래서 19세기 말 일본에서는 울릉도를 "마쓰시마"라고 부르게 된 거야.'],
            ['gaji', '독도는 1849년 이 섬을 본 프랑스 배 "리앙쿠르호"의 이름을 따서 서양에서 "리앙쿠르 암"이라고 불렀어. 일본 어부들은 이걸 줄여 "리양코섬"이라 불렀고.'],
            ['gaji', '그리고 독도에 "다케시마"라는 이름을 붙인 건 1905년부터야. 헷갈리면 📖 도감의 "이름 도감"을 펼쳐 봐!'],
          ]);
          unlockName('n_west'); unlockName('n_jp19'); unlockName('n_1904');
          await getCard('niitaka');
        } },
        { x: 1060, y: 360, ico: '⚔️', label: '전쟁 연표', run: async () => {
          await showDoc({ title: '러일전쟁 연표', era: '신문사 벽에 붙은 메모',
            lines: ['1904년 2월  러일전쟁 시작', '1904년 2월  한일의정서:\n일본군이 대한제국 땅을 군사적으로 쓸 수 있게 함', '1904년 9월  일본 군함이 독도에 망루(감시탑) 세울 곳을 조사', '1905년 2월  시마네현 고시 제40호', '1905년 5월  동해에서 큰 해전이 벌어짐', '1905년 8월  독도에 망루 완성', '1905년 9월  러일전쟁 끝',
              { t: '일본 외무성 관리의 말: "지금이야말로 편입이 필요하다.\n망루를 세우고 전선을 깔면 적의 군함을 감시하는 데 유리하다."', note: true }] });
          await say('gaji', '날짜를 잘 봐. 고시가 나온 건 언제였지? 그리고 일본은 독도를 어디에 쓰려고 했을까?');
        } },
      ],
    });
  },
  async () => {
    setBg('bg-stage5'); fogFx(0.3); Sound.play('mystery'); placeSeal(5);
    await say('gaji', '취재 수첩이 가득 찼어! 이제 안개의 주장과 부딪히는 기록을 찾아 붉은 실로 이어 보자.');
    await contradictionGame();
    clearScene();
    await talk([
      ['gaji:wow', '"주인 없는 섬"도, "정당한 절차"도 모두 기록과 부딪혀!'],
      ['gaji', '대한제국은 이미 1900년에 법령으로 독도를 다스리고 있었어. 주인이 있는 섬을 전쟁 중에, 주인에게 알리지도 않고 가져가려 한 거야.'],
    ]);
    await getCard('shimane');
    unlockName('n_jp1905');
    await say('gaji', '그리고 이때 일본은 독도에 "다케시마"라는 이름을 붙였어. 옛날에는 울릉도를 부르던 이름인데 말이야. 이름 도감을 확인해 봐!');
    await say('gaji', '아, 라디오에서 들은 노래 단서가 생각나. "러일전쟁 … 임자 없는 땅"! 그런데 가사는 러일전쟁 "직후"라고 했던가?');
    await dateCompare();
    clearScene();
    await say('gaji:yay', '팩트 체크 완료! 노래는 "직후"라고 하지만, 실제로는 전쟁이 한창일 때였어.');
    await solveClue('war');
  },
  async () => {
    setBg('bg-uldo'); fogFx(0.1); Sound.play('mystery'); placeSeal(5);
    await timeJump('1906년 3월 · 대한제국', '울도군(울릉도)의 관아');
    await talk([
      ['narr', '1906년 3월, 울릉도. 시마네현의 관리들이 울도 군수 심흥택을 찾아왔다.'],
      ['shimaneOff', '독도가 이제 일본 땅이 되었으니 살펴보러 왔소. 울릉도의 호구와 토지도 조사하겠소.'],
      ['shim', '뭐라고? 우리 군의 독도가…! 당장 나라에 알려야겠다.'],
      ['narr', '심흥택은 곧바로 강원도 관찰사에게 올릴 보고서를 썼다.'],
    ]);
    await showDoc({ title: '울도 군수 심흥택의 보고서', era: '1906년 · 강원도 관찰사에게 올린 급한 보고', key: 's5_send',
      lines: ['본군 소속 독도가\n바깥 바다 100여 리 밖에 있는데,', '이달 4일, 일본 관리 일행이\n관사에 찾아와서', '"독도가 이제 일본 영지가 되었으므로\n시찰하러 왔다"고 하고,', '울릉도의 호구와 토지, 생산량 등을\n조사해 갔습니다.'],
      ask: '심흥택이 독도를 누구의 섬이라고\n적었는지 드러나는 문장을 찾아 봐!',
      pick: { correct: [0], hint: '심흥택이 독도를 처음 소개하는 말을 다시 읽어 봐. "본군"은 "우리 군"이라는 뜻이야.',
        wrong: { 2: '이건 일본 관리들이 한 말이야.\n심흥택이 독도를 어떻게 소개했는지 찾아봐.', 1: '이 문장에는 독도가 누구의 섬인지 나오지 않아.', 3: '이 문장에는 독도가 누구의 섬인지 나오지 않아.' },
        reveal: '"본군 소속 독도", 곧 "우리 군에 속한 독도"!' } });
    await whyQuestion({ key: 's5_why', text: '울도 군수가 독도를 "본군(우리 군) 소속"이라고 쓸 수 있었던 까닭은 뭘까?',
      options: [
        { t: '1900년 칙령 제41호로 울도군이 석도(독도)를 다스리게 되었기 때문', ok: true },
        { t: '울도 군수가 독도에 직접 가 본 적이 있어서', re: '가 본 적이 있다고 그 섬이 우리 군의 섬이 되지는 않아. 4단계에서 풀었던 암호를 떠올려 봐.' },
        { t: '일본 관리들이 그렇게 불러 줘서', re: '일본 관리들은 오히려 일본 땅이 되었다고 했지. 4단계에서 도장을 찍은 법령을 떠올려 봐.' },
      ] });
    await say('gaji', '맞아! 1900년 칙령으로 울도군이 석도, 곧 독도를 다스리게 되었지. 그래서 울도 군수가 "우리 군의 독도"라고 쓴 거야.');
    Sound.sfx('beep'); await sleep(160); Sound.sfx('beep'); await sleep(160); Sound.sfx('beep');
    await getCard('shim');
    setBg('bg-stage4'); fogFx(0);
    await timeJump('1906년 5월 · 대한제국', '한성의 의정부');
    await talk([
      ['narr', '보고는 대한제국 정부의 최고 기관인 의정부까지 올라갔다.'],
      ['minister', '독도가 일본 땅이 되었다는 말은 전혀 근거가 없다! 섬의 형편과 일본인들이 한 일을 다시 조사해 보고하라.'],
    ]);
    await pressStamp({ title: '🖋️ 지령 제3호', note: '"전속무근(全屬無根)"은 "전혀 근거가 없다"는 뜻이야. 도장을 꾹 눌러 지령을 내려!',
      doc: '지령 제3호 (1906년 5월)\n독도가 일본 영지가 되었다는 말은 전혀 근거가 없으니,\n섬의 형편과 일본인들이 어떻게 하였는지를\n다시 조사하여 보고할 것.\n의정부 참정대신', label: '全屬<br>無根', doneMsg: '대한제국 정부는 일본의 편입을 인정하지 않았다!' });
    await getCard('order3');
  },
  async () => {
    setBg('bg-stage5'); fogFx(0); Sound.play('mystery'); placeSeal(5);
    await talk([
      ['gaji:sad', '그런데 1905년은 우리 역사에서 어떤 때였을까? 그 무렵 일본은 대한제국을 조금씩 빼앗아 가고 있었어.'],
      ['gaji', '한일의정서, 을사늑약, 국권 피탈… 이름이 어렵지? 카드마다 "무엇을 빼앗겼는지" 적어 뒀어. 그 뜻을 읽고 독도 사건이 어떤 의미인지 생각해 보자.'],
    ]);
    await lossOrder();
    await talk([
      ['gaji:sad', '1906년 심흥택의 보고가 올라왔을 때, 대한제국은 이미 을사늑약으로 외교권을 빼앗긴 뒤였어. 그래서 "근거 없다"고 밝히고도 일본에 제대로 따질 길이 막혀 있었지.'],
      ['gaji', '독도는 나라를 빼앗기는 과정에서 가장 먼저 희생된 우리 땅이야. 우리에게 독도가 단순한 작은 섬이 아닌 까닭이지.'],
    ]);
    await evidenceBoard(5);
    await stageClear(5);
  },
];
