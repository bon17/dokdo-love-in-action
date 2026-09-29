/* ===== 6단계: 연표 러시 ===== */

/* 독도 둘레를 도는 길 위의 16개 사건 (빨강: 일본 측 기록, 파랑: 우리와 연합국 측 기록) */
const TIMELINE = [
  { y: '512', t: '우산국 복속', c: 'b', r: 2, d: '신라 이사부가 우산국을 신라에 복속시킴 (삼국 시대)' },
  { y: '1454', t: '『세종실록』 「지리지」', c: 'b', r: 2, d: '조선 세종 때의 기록: 날씨가 맑으면 두 섬이 보인다' },
  { y: '1625', t: '다케시마(울릉도) 도해면허', c: 'r', r: 1, d: '일본 어부들이 울릉도로 건너갈 수 있게 허락함' },
  { y: '1693', t: '안용복 일본 납치', c: 'b', r: 1, d: '울릉도에서 고기를 잡다 일본 어부들과 마주침' },
  { y: '1694', t: '울릉도 수토제도 시행 결정', c: 'b', r: 1, d: '안용복 사건 이듬해, 조선이 관리를 정기적으로 보내기로 함' },
  { y: '1695', t: '돗토리번 답변', c: 'r', r: 1, d: '막부의 질문에 "두 섬 모두 우리 땅이 아니다"라고 답함' },
  { y: '1696.1', t: '다케시마(울릉도) 도해금지령', c: 'r', r: 1, d: '돗토리번의 답을 받은 막부가 울릉도 도해를 금지함' },
  { y: '1696.5', t: '안용복 일본 도해', c: 'b', r: 1, d: '금지령이 내려진 그해 봄, 안용복이 다시 건너가 담판함' },
  { y: '1770', t: '『동국문헌비고』 「여지고」', c: 'b', r: 2, d: '조선 영조 때의 책: 우산은 일본이 말하는 송도' },
  { y: '1870', t: '『조선국교제시말내탐서』', c: 'r', r: 2, d: '메이지 정부 초기, 외무성이 조선을 조사한 보고서' },
  { y: '1877', t: '태정관지령', c: 'r', r: 2, d: '조사 뒤 최고 기관의 결론: "울릉도 외 1도는 일본과 관계없다"' },
  { y: '1900', t: '칙령 제41호 반포', c: 'b', r: 3, d: '대한제국이 법령으로 울도군이 석도를 다스리게 함' },
  { y: '1905', t: '시마네현 고시 제40호', c: 'r', r: 3, d: '러일전쟁 중, 대한제국 몰래 편입을 시도함' },
  { y: '1906', t: '심흥택 보고서 · 지령 제3호', c: 'b', r: 3, d: '편입 소식을 들은 대한제국이 "근거 없다"고 밝힘' },
  { y: '1946', t: 'SCAPIN 제677호 · 제1033호', c: 'b', r: 3, d: '전쟁이 끝난 뒤 연합국이 일본의 범위에서 독도를 뺌' },
  { y: '1951', t: '샌프란시스코 강화조약', c: 'b', r: 3, d: '제2차 세계대전을 마무리한 조약' },
];
const ROUND_INFO = {
  1: { name: '1라운드: 17세기, 울릉도를 둘러싼 담판', tip: '"이 일 때문에 저 일이 생겼다"를 떠올리며 순서를 추리해 봐.' },
  2: { name: '2라운드: 옛 기록에서 메이지 정부까지', tip: '삼국 시대 → 조선 전기(세종) → 조선 후기(영조) → 일본 메이지 정부의 조사 → 결론 순서야.' },
  3: { name: '3라운드: 대한제국에서 광복 이후까지', tip: '법령 → 편입 시도 → 그에 대한 대응 → 전쟁 후 연합국의 지시 → 조약 순서로 생각해 봐.' },
};

/* 연표 러시: 라운드마다 빈칸이 바뀐다. 연도는 알맞게 놓았을 때 드러난다. */
function timelineRush() {
  return new Promise(async resolve => {
    const root = el('div', { style: 'position:absolute;inset:64px 0 0 0;background:rgba(6,20,37,.82)' });
    L.scene.append(root);
    const title = el('div', { class: 'mg-title', style: 'top:10px' });
    const timer = el('div', { style: 'position:absolute;right:20px;top:14px;font:22px var(--ui);background:rgba(8,26,48,.9);padding:6px 14px;border-radius:10px' });
    const tip = el('div', { style: 'position:absolute;left:0;right:0;top:62px;text-align:center;font:18px var(--body);color:#bcd3ea' });
    const board = el('div', { style: 'position:absolute;left:0;top:90px;width:1280px;height:380px' });
    const tray = el('div', { style: 'position:absolute;left:20px;right:20px;bottom:14px;height:170px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-content:center' });
    root.append(title, timer, tip, board, tray);
    // 독도를 가운데 둔 둥근 네모 길 위에 16칸을 놓는다. (왼쪽 아래에서 시작해 시계 방향)
    const cx = 640, cy = 185;
    const pos = [[80, 250], [80, 140], ...[0, 1, 2, 3, 4, 5].map(k => [240 + k * 160, 40]), [1200, 140], [1200, 250], ...[0, 1, 2, 3, 4, 5].map(k => [1040 - k * 160, 330])].map(([x, y]) => ({ x, y }));
    board.innerHTML = `<svg width="1280" height="380" style="position:absolute;left:0;top:0"><rect x="80" y="40" width="1120" height="290" rx="90" fill="none" stroke="#8fa7c0" stroke-width="4" stroke-dasharray="10 8"/><path d="M80 290 l-10 18 l20 0 z" fill="#8fa7c0"/></svg>`;
    board.append(el('div', { style: `position:absolute;left:${cx - 60}px;top:${cy - 40}px;width:120px;text-align:center`, html: dokdoSvg(120, 76) + '<div style="font:20px RIDIBatang;color:#ffe08a">독도</div>' }));
    board.append(el('div', { style: `position:absolute;left:${cx - 170}px;top:${cy + 58}px;width:340px;text-align:center;font:15px var(--ui);color:#bcd3ea`, html: '<span style="color:#ff8a8a">●</span> 일본 측 기록 &nbsp; <span style="color:#7fb0ff">●</span> 우리·연합국 측 기록' }));
    const nodes = TIMELINE.map((e, i) => {
      const n = el('div', { class: 'slot', style: `position:absolute;left:${pos[i].x - 70}px;top:${pos[i].y - 32}px;width:140px;min-height:64px;padding:4px 6px;font:14px/1.25 var(--ui)` });
      n.dataset.i = i; board.append(n); return n;
    });
    const showDone = i => {
      const e = TIMELINE[i], n = nodes[i];
      n.className = 'slot filled';
      n.style.background = e.c === 'r' ? 'rgba(224,72,72,.55)' : 'rgba(47,111,222,.55)';
      n.style.borderColor = e.c === 'r' ? '#ff8a8a' : '#7fb0ff';
      n.innerHTML = `<div style="font:17px RIDIBatang;color:#ffe08a">${e.y}</div><div style="font:14px/1.2 RIDIBatang">${e.t}</div>`;
    };
    let total = 0;
    for (const r of [1, 2, 3]) {
      title.textContent = `⏱️ ${ROUND_INFO[r].name}`;
      tip.textContent = '아래 사건 카드를 눌러 고른 뒤, 시간 순서에 맞는 물음표 칸을 눌러 봐! ' + ROUND_INFO[r].tip;
      const idxs = TIMELINE.map((e, i) => i).filter(i => TIMELINE[i].r === r);
      idxs.forEach((i, k) => { nodes[i].className = 'slot'; nodes[i].style.borderColor = '#ffd166'; nodes[i].innerHTML = `<div style="font:26px RIDIBatang;color:#ffd166">?</div>`; });
      tray.innerHTML = '';
      let sel = null, left = idxs.length, tries = 0;
      const t0 = performance.now();
      const tick = setInterval(() => { timer.textContent = `⏱️ ${Math.floor((performance.now() - t0) / 1000)}초`; }, 250);
      await new Promise(done => {
        const chips = shuffle(idxs).map(i => {
          const e = TIMELINE[i];
          const c = el('div', { class: 'tile', style: 'width:290px;min-height:74px;flex-direction:column;font:19px var(--ui);padding:6px 12px' },
            el('div', { text: e.t }), el('div', { style: 'font:14px/1.3 var(--body);color:#6a553f;margin-top:2px', text: e.d }));
          c.dataset.i = i;
          const put = n => {
            const ni = +n.dataset.i;
            if (!idxs.includes(ni) || n.classList.contains('filled') || c.classList.contains('done')) return;
            if (ni === i) {
              showDone(i); c.classList.add('done'); c.classList.remove('sel'); sel = null; Sound.sfx('good');
              award('s6_line', 1, 30); left--;
              if (!left) { clearInterval(tick); DEV.solve = null; setTimeout(done, 600); }
            } else {
              tries++; n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake');
              const before = TIMELINE[ni];
              if (wrongFeedback(tries, `"${e.t}"이(가) 일어나려면 먼저 무슨 일이 있어야 했을까? 카드 아래 설명에 원인과 결과의 단서가 있어.`)) {
                hint('같이 놓아 보자!', 'gaji', 3000); showDone(i); c.classList.add('done'); left--; tries = 0;
                if (!left) { clearInterval(tick); DEV.solve = null; setTimeout(done, 600); }
              }
            }
          };
          dragItem(c, {
            onTap: () => { if (c.classList.contains('done')) return; Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = c; c.classList.add('sel'); },
            onDrop: under => { const n = under.find(x => nodes.includes(x)); if (n) put(n); },
          });
          c._put = put;
          tray.append(c); return c;
        });
        nodes.forEach(n => { n.onclick = e => { e.stopPropagation(); if (sel) sel._put(n); }; });
        DEV.solve = () => chips.forEach(c => { if (!c.classList.contains('done')) c._put(nodes[+c.dataset.i]); });
      });
      const secs = (performance.now() - t0) / 1000;
      if (secs < 40) { addScore(30, 640, 300); toast(`⚡ 빠른 추리! 보너스 +30`); }
      total += secs;
      await sleep(400);
    }
    title.textContent = '🎉 연표 완성! 독도를 둘러싼 1,400여 년의 흐름';
    tip.textContent = '빨간 점은 일본 측 기록, 파란 점은 우리와 연합국 측 기록이야. 천천히 한 바퀴 읽어 봐.';
    tray.innerHTML = '';
    tray.append(onTap(el('button', { class: 'btn', text: '다 읽었어!' }), () => { root.remove(); resolve(total); }));
    DEV.solve = () => { root.remove(); resolve(total); };
  });
}

const STAGE6 = [
  async () => {
    setBg('bg-stage6'); fogFx(0.2); Sound.play('rush'); placeSeal(6);
    await talk([
      ['narr', '1945년 8월, 광복. 우산호는 거센 시간의 물살을 타고 광복 이후의 동해로 달려간다.'],
      ['gaji', '광복 뒤 독도에는 어떤 일들이 있었을까? 시간의 물살에 떠밀려 오는 기록들을 붙잡자!'],
    ]);
    const panels = [
      ['1946년 1월', '전쟁에서 진 일본을 점령한 연합국 최고사령관 총사령부가 지시를 내렸다. 일본이 통치·행정권을 행사할 수 있는 범위에서 울릉도, 독도(리앙쿠르암), 제주도를 뺀다. (다만 최종적인 영토 결정은 아니라는 단서가 붙어 있다.)', 'scapin677'],
      ['1946년 6월', '연합국 총사령부는 일본 어선이 고기를 잡을 수 있는 구역을 정했다. 일본 배와 사람은 독도 12해리 안으로 들어가거나 독도에 닿을 수 없다.', 'scapin1033'],
      ['1947년 8월', '조선산악회가 문교부의 후원을 받아 울릉도·독도 학술조사대를 꾸렸다. 조사대는 독도에 건너가 섬의 자연과 지리를 조사했다.', 'alpine'],
      ['1951년 9월', '제2차 세계대전을 마무리한 샌프란시스코 강화조약. 일본은 "제주도, 거문도, 울릉도를 포함한 한국"에 대한 모든 권리를 포기했다. 3,000개가 넘는 우리 섬 가운데 대표적인 섬만 적었다.', 'sf'],
      ['1952년 1월', '대한민국 정부는 「인접 해양에 대한 주권에 관한 대통령 선언」을 발표하고 바다 위에 주권의 선을 그었다. 사람들은 이 선을 "평화선"이라 불렀다. 독도는 그 안쪽에 있다.', 'peace'],
      ['1953년 4월', '일본 사람들이 독도에 와서 자기네 표지를 세우는 일이 생기자, 울릉도 주민 홍순칠 등이 스스로 독도의용수비대를 만들었다. 이들은 1956년 경찰에게 임무를 넘길 때까지 독도를 지켰다.', 'volunteer'],
    ];
    for (const [when, text, card] of panels) {
      await say('narr', `[${when}] ${text}`);
      await getCard(card);
    }
    await say('gaji', '저기 언덕 위에 서 있는 사람들이 바로 독도의용수비대야. 섬을 지키겠다고 스스로 모인 울릉도 사람들이지.');
  },
  async () => {
    setBg('bg-stage6'); fogFx(0); Sound.play('rush'); placeSeal(6);
    await say('gaji', '방금 붙잡은 기록들을 기억하고 있어? 카드를 뒤집어 짝을 맞춰 보자!');
    await memoryGame({ title: '🃏 기억력 짝 맞추기', key: 's6_memory', pairs: [
      ['SCAPIN 제677호', '일본의 통치·행정 범위에서 독도를 뺀 지시'],
      ['SCAPIN 제1033호', '일본 배가 독도 12해리 안에 못 오게 한 지시'],
      ['조선산악회', '광복 뒤 울릉도·독도 학술조사'],
      ['샌프란시스코 강화조약', '대표적인 섬만 적은 전쟁 마무리 조약'],
      ['평화선', '대통령 선언으로 그은 바다 주권의 선'],
      ['독도의용수비대', '울릉도 주민들이 스스로 만든 수비대'],
    ] });
    await talk([
      ['gaji:wow', '좋아! 이번엔 독도의 1,400여 년 역사를 한 바퀴 이어 볼 차례야.'],
      ['gaji', '연도를 외울 필요는 없어. "이 일 때문에 저 일이 생겼다"를 생각하면 순서가 보여!'],
    ]);
    await timelineRush();
  },
  async () => {
    setBg('bg-stage6'); fogFx(0.3); Sound.play('rush'); placeSeal(6);
    await talk([
      ['fog', '크크크! 연표 따위! 내 거짓말 풍선을 받아라!'],
      ['gaji', '안개가 풍선에 거짓 주장을 실어 날려 보내고 있어! 거짓은 터뜨리고, 사실은 날려 보내!'],
    ]);
    clearScene();
    await balloonGame({ key: 's6_balloon', secs: 26, items: [
      { t: '울릉도에서는 독도가 전혀 보이지 않는다', ok: false },
      { t: '17세기 일본 기록의 "다케시마"는 지금의 독도다', ok: false },
      { t: '도해면허는 울릉도가 일본 땅이라는 증거다', ok: false },
      { t: '1905년의 독도는 주인 없는 섬이었다', ok: false },
      { t: '대한제국은 독도를 다스린 적이 없다', ok: false },
      { t: 'SCAPIN 제677호는 독도를 일본의 범위에 넣었다', ok: false },
      { t: '조약에 이름이 없는 섬은 모두 일본 땅이다', ok: false },
      { t: '독도의용수비대는 일본이 만든 조직이다', ok: false },
      { t: '돗토리번은 두 섬 모두 자기 땅이 아니라고 답했다', ok: true },
      { t: '태정관은 울릉도 외 1도가 일본과 관계없다고 했다', ok: true },
      { t: '칙령 제41호는 석도를 울도군이 다스리게 했다', ok: true },
      { t: '독도는 평화선 안쪽에 있었다', ok: true },
      { t: '독도의용수비대는 울릉도 주민들이 만들었다', ok: true },
      { t: '샌프란시스코 강화조약은 대표적인 섬만 적었다', ok: true },
    ] });
    fogFx(0);
    await say('gaji:yay', '거짓 풍선을 모두 막아 냈어! 이제 독도를 지켜 온 사람들이 있는 오늘날의 독도로 가 보자.');
    await evidenceBoard(6);
    await stageClear(6);
  },
];
