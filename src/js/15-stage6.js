/* ===== 6단계: 연표 러시 ===== */

/* 연표 한 바퀴: 독도 둘레 길 위의 칸을 ①번부터 차례로 눌러 불을 밝힌다. 틀릴 일은 없고, 칸마다 무슨 일이 있었는지 읽게 한다. */
function timelineWalk() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:64px 0 0 0;background:rgba(6,20,37,.82)' });
    L.scene.append(root);
    HINT.pos = 'center';
    const N = TIMELINE.length;
    const title = el('div', { class: 'mg-title', style: 'top:8px', text: '🗺️ 독도 1,400여 년 연표 한 바퀴' });
    const tip = el('div', { style: 'position:absolute;left:150px;right:150px;top:68px;text-align:center;font:18px/1.4 var(--body);color:#ffe2b8;text-wrap:balance', text: '반짝이는 칸을 눌러 불을 밝혀 봐! ①번부터 번호 순서대로 한 바퀴 돌아.' });
    const board = el('div', { style: 'position:absolute;left:0;top:124px;width:1280px;height:366px' });
    const info = el('div', { class: 'tl-info' });
    root.append(title, tip, board, info);
    // 독도를 가운데 둔 둥근 네모 길 위에 칸을 놓는다. (왼쪽 아래에서 시작해 시계 방향: 왼쪽 2칸, 위 7칸, 오른쪽 2칸, 아래 7칸)
    const cx = 640, cy = 185, STEP = 137;
    const row = [0, 1, 2, 3, 4, 5, 6].map(k => 229 + k * STEP);
    const pos = [[80, 250], [80, 140], ...row.map(x => [x, 40]), [1200, 140], [1200, 250], ...row.slice().reverse().map(x => [x, 330])].map(([x, y]) => ({ x, y }));
    board.innerHTML = `<svg width="1280" height="380" style="position:absolute;left:0;top:0"><rect x="80" y="40" width="1120" height="290" rx="90" fill="none" stroke="#8fa7c0" stroke-width="4" stroke-dasharray="10 8"/><path d="M80 290 l-10 18 l20 0 z" fill="#8fa7c0"/></svg>`;
    board.append(el('div', { style: `position:absolute;left:${cx - 60}px;top:${cy - 40}px;width:120px;text-align:center`, html: dokdoSvg(120, 76) + '<div style="font:20px RIDIBatang;color:#ffe08a">독도</div>' }));
    board.append(el('div', { style: `position:absolute;left:${cx - 170}px;top:${cy + 58}px;width:340px;text-align:center;font:15px var(--ui);color:#bcd3ea`, html: '<span style="color:#ff8a8a">●</span> 일본 측 기록 &nbsp; <span style="color:#7fb0ff">●</span> 우리·연합국 측 기록' }));
    for (let i = 0; i < pos.length - 1; i++) {
      const a = pos[i], b = pos[i + 1];
      if (a.x !== b.x && a.y !== b.y) continue;
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      board.append(el('div', { class: 'tl-arrow', style: `left:${(a.x + b.x) / 2 - 11}px;top:${(a.y + b.y) / 2 - 11}px;transform:rotate(${ang}deg)`, text: '➤' }));
    }
    board.append(el('div', { class: 'tl-end start', style: `left:${pos[0].x - 60}px;top:${pos[0].y + 34}px`, text: '▲ 시작' }),
      el('div', { class: 'tl-end', style: `left:${pos[N - 1].x - 64 - 126}px;top:${pos[N - 1].y - 12}px`, text: '■ 끝' }));
    const nodes = TIMELINE.map((e, i) => {
      const n = el('div', { class: 'slot tl-node', style: `left:${pos[i].x - 64}px;top:${pos[i].y - 32}px` }, el('div', { style: 'font:24px RIDIBatang;color:#8fa7c0', text: '?' }));
      board.append(n, el('div', { class: 'tl-num', style: `left:${pos[i].x - 76}px;top:${pos[i].y - 44}px`, text: i + 1 }));
      onTap(n, () => tap(i));
      return n;
    });
    const showInfo = i => {
      const e = TIMELINE[i];
      info.innerHTML = '';
      info.append(el('div', { class: 'tl-era', text: tlEra(i) }),
        el('div', { style: 'display:flex;align-items:baseline;gap:14px;justify-content:center' },
          el('span', { style: `font:28px RIDIBatang;color:${e.c === 'r' ? '#ff9a9a' : '#9cc4ff'}`, text: tlYear(e) }),
          el('span', { style: 'font:26px var(--ui)' }, gtext(e.t))),
        el('div', { style: 'font:20px/1.5 var(--body);color:#dfe9f5;margin-top:2px' }, gtext(e.d)),
        el('div', { style: 'font:16px var(--ui);color:#8fa7c0;margin-top:2px', text: `📖 ${e.s}단계 「${STAGE_NAMES[e.s]}」에서 본 기록` }));
    };
    const light = i => {
      const e = TIMELINE[i], n = nodes[i];
      n.className = 'slot filled tl-node';
      n.style.background = e.c === 'r' ? '#7a3036' : '#24497f';
      n.style.borderColor = e.c === 'r' ? '#ff8a8a' : '#7fb0ff';
      n.innerHTML = `<div style="font:16px RIDIBatang;color:#ffe08a">${esc(tlYear(e))}</div><div style="font:13.5px/1.2 RIDIBatang;white-space:pre-line">${esc(e.n || e.t)}</div>`;
    };
    let next = 0, readyAt = 0, over = false;
    const glowNext = () => { if (next < N) nodes[next].classList.add('hi'); };
    const tap = i => {
      if (i < next) { Sound.sfx('tap'); showInfo(i); return; }
      if (over) return;
      if (i > next) { hint(`①번부터 차례대로! 지금은 ${next + 1}번 칸이 반짝이고 있어.`, 'gaji', 3000); return; }
      if (performance.now() < readyAt) return;
      readyAt = performance.now() + 700;
      nodes[i].classList.remove('hi'); light(i); showInfo(i); Sound.sfx('good'); clearHint();
      next++;
      if (next < N) return glowNext();
      over = true; DEV.solve = null; S.tlDone = true; save();
      title.textContent = '🎉 연표 완성! 독도를 둘러싼 1,400여 년의 흐름';
      tip.textContent = ko('칸을 누르면 그 기록을 다시 볼 수 있어. 빨간 칸은 일본 측 기록, 파란 칸은 우리와 연합국 측 기록이야.');
      HINT.pos = 'left';
      const endBox = el('div', { style: 'position:absolute;left:0;right:0;top:192px;display:flex;justify-content:center;z-index:3' });
      root.append(endBox);
      doneBar(endBox, { btn: '다 읽었어! ▶' }).then(() => { root.remove(); resolve(); });
    };
    info.append(el('div', { style: 'font:20px var(--ui);color:#cfe6ff;margin-top:26px', text: '👆 ①번 칸(왼쪽 아래)부터 눌러 봐!' }));
    glowNext();
    DEV.solve = () => { while (next < N) { readyAt = 0; tap(next); } };
  });
}

const STAGE6 = [
  async () => {
    setBg('bg-stage6'); fogFx(0.2); Sound.play('rush'); placeSeal(6);
    await timeJump('1945년 · 광복', '광복 이후의 동해');
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
    await say('gaji', '방금 붙잡은 기록들을 정리해 보자! 위에 나오는 설명에 맞는 기록을 아래에서 골라 줘.');
    await matchGame({ title: '🧩 기록 맞추기', key: 's6_match', items: [
      { when: '1946년 1월', name: 'SCAPIN 제677호', d: '일본의 통치·행정 범위에서 독도를 뺀 지시', h: '연합국 총사령부의 지시는 두 개야. 먼저(1월) 나온 지시는 번호가 더 작아.' },
      { when: '1946년 6월', name: 'SCAPIN 제1033호', d: '일본 배가 독도 12해리 안에 못 오게 한 지시', h: '연합국 총사령부의 두 지시 가운데 나중(6월)에 나온 지시는 번호가 더 커.' },
      { when: '1947년 8월', name: '조선산악회', d: '광복 뒤 울릉도·독도 학술조사', h: '산을 잘 아는 사람들의 모임이 조사대를 꾸렸어.' },
      { when: '1951년 9월', name: '샌프란시스코 강화조약', d: '대표적인 섬만 적은, 전쟁을 마무리한 조약', h: '전쟁을 마무리하는 약속을 "조약"이라고 해. 이름에 "조약"이 들어간 기록을 찾아봐.' },
      { when: '1952년 1월', name: '평화선', d: '대통령 선언으로 그은 바다 주권의 선', h: '바다 위에 그은 "선"이야. 이름에 "선"이 들어간 기록을 찾아봐.' },
      { when: '1953년 4월', name: '독도의용수비대', d: '울릉도 주민들이 스스로 만든 수비대', h: '섬을 지키는 사람들의 모임을 "수비대"라고 해.' },
    ] });
    await talk([
      ['gaji:wow', '좋아! 이번엔 독도의 1,400여 년 역사를 한 바퀴 돌아볼 차례야.'],
      ['gaji', '이 연표는 꼭!! 기억해 두는 게 좋을 거야. 지금까지 모은 증거가 한 줄로 이어지거든.'],
      ['gaji', '①번 칸부터 반짝이는 칸을 차례로 눌러 불을 밝혀 봐. 칸마다 무슨 일이 있었는지 아래에 나와. 연표는 📖 도감에서도 언제든 다시 볼 수 있어!'],
    ]);
    await timelineWalk();
  },
  async () => {
    setBg('bg-stage6'); fogFx(0.3); Sound.play('rush'); placeSeal(6);
    await talk([
      ['fog', '크크크! 연표 따위! 내 거짓말 풍선을 받아라!'],
      ['gaji', '안개가 풍선에 거짓 주장을 실어 날려 보내고 있어! 거짓은 터뜨리고, 사실은 날려 보내!'],
      ['gaji', '풍선은 천천히 올라가니까 문장을 끝까지 읽고 골라. 틀린 문장은 마지막에 한 번 더 날아와!'],
    ]);
    clearScene();
    await balloonGame({ key: 's6_balloon', items: [
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
