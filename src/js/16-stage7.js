/* ===== 7단계: 독도 관리소 ===== */

/* 시설 배치: 시설의 쓰임에 맞는 자리를 찾아 놓는다. */
function facilityGame() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:64px 0 0 0;background:radial-gradient(circle at 42% 50%,#2f8cc9,#0f4d7d)' });
    L.scene.append(root);
    HINT.pos = 'top';
    const endBox = el('div', { style: 'position:absolute;right:24px;top:170px;width:340px;padding:6px 18px 18px;border-radius:18px;background:rgba(8,26,48,.88);display:flex;justify-content:center;z-index:3' });
    root.append(el('div', { class: 'mg-title', style: 'top:10px', text: '🏗️ 시설 아이콘을 쓰임에 맞는 자리로 옮겨 줘!' }));
    const cv = el('canvas', { width: 900, height: 560, style: 'position:absolute;left:0;top:70px' });
    root.append(cv);
    const g = cv.getContext('2d');
    const cx = 450, cy = 300, sc = 1.35;
    dokdoTopView(g, cx, cy, sc);
    g.font = '26px RIDIBatang, serif'; g.fillStyle = '#fff'; g.textAlign = 'center';
    g.fillText('서도', cx - 190, cy + 170); g.fillText('동도', cx + 190, cy + 185);
    const zones = [
      { id: 0, x: cx + 205, y: cy - 150, d: '동도의 높은 곳\n먼 바다가 잘 보임' },
      { id: 1, x: cx + 120, y: cy + 60, d: '동도의 가운데\n섬 전체를 지켜보기 좋음' },
      { id: 4, x: cx + 285, y: cy - 30, d: '동도 꼭대기의 평평한 곳\n위가 탁 트임' },
      { id: 3, x: cx + 40, y: cy + 175, d: '동도의 바닷가\n물결이 잔잔하고 낮음' },
      { id: 2, x: cx - 190, y: cy + 100, d: '서도의 바닷가\n물가에 가까움' },
    ];
    const zEls = zones.map(z => {
      const e = el('div', { class: 'slot', style: `position:absolute;left:${z.x - 75}px;top:${z.y + 70 - 50}px;width:150px;height:100px;border-radius:50%;flex-direction:column;background:rgba(255,255,255,.12);font:15px/1.3 var(--ui);white-space:pre-line;padding:10px` }, z.d);
      e.dataset.id = z.id; root.append(e); return e;
    });
    const noBin = el('div', { class: 'slot', style: 'position:absolute;right:30px;bottom:24px;width:320px;height:110px;flex-direction:column;border-color:#ff8a8a;background:rgba(224,72,72,.15)' },
      el('div', { style: 'font:22px var(--ui)', text: '🚫 섬에 없는 시설' }), el('div', { style: 'font:15px var(--body);color:#dfe9f5', text: '독도에 놓을 수 없는 것은 여기로!' }));
    noBin.dataset.id = 5; root.append(noBin);
    const names = ['유인등대', '독도경비대 숙소', '주민숙소', '접안시설', '헬기장', '공항 (활주로)'];
    const hints = [
      '등대는 밤바다를 지나는 배들에게 빛을 멀리 보내야 해. 어디가 좋을까?',
      '경비대는 섬 전체를 지켜봐야 해. 동도의 어느 곳이 좋을까?',
      '주민은 바다에서 고기잡이를 하며 살아. 서도의 바닷가가 어떨까?',
      '배를 대려면 물결이 잔잔하고 낮은 바닷가여야 해.',
      '헬리콥터가 내리려면 위가 탁 트인 평평한 곳이 필요해.',
      '독도에는 비행기가 뜨고 내릴 긴 활주로를 놓을 만큼 넓고 평평한 땅이 없어! "섬에 없는 시설" 칸으로 보내 줘.',
    ];
    const tray = el('div', { style: 'position:absolute;right:20px;top:70px;width:340px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center' });
    root.append(tray);
    let sel = null, tries = 0, left = 6;
    const put = (ic, target) => {
      const want = +ic.dataset.id, got = +target.dataset.id;
      if (ic.dataset.done || target.dataset.full) return;
      if (want === got) {
        ic.dataset.done = 1; target.dataset.full = 1; ic.classList.remove('sel'); sel = null;
        target.classList.add('filled'); target.innerHTML = '';
        target.append(el('img', { src: img('fac-' + want), style: 'width:64px;height:64px' }), el('div', { style: 'font:16px var(--ui)', text: names[want] }));
        if (want === 5) target.firstChild.style.filter = 'grayscale(1)';
        ic.remove(); Sound.sfx('good'); award('s7_place', 1, 40); left--;
        if (!left) { DEV.solve = null; root.append(endBox); doneBar(endBox, { msg: '시설을 모두 제자리에 놓았어!' }).then(() => { HINT.pos = 'left'; root.remove(); resolve(tries); }); }
      } else {
        tries++; target.classList.remove('shake'); void target.offsetWidth; target.classList.add('shake');
        if (want === 5) { miss(); hint(hints[5], 'wow'); }
        else if (wrongFeedback(tries, hints[want], hints[want])) { tries = 0; put(ic, want === 5 ? noBin : zEls.find(z => +z.dataset.id === want)); }
      }
    };
    const icons = shuffle([0, 1, 2, 3, 4, 5]).map(i => {
      const ic = el('div', { class: 'tile', style: 'width:140px;height:140px;flex-direction:column;padding:6px;font:17px var(--ui)' },
        el('img', { src: img('fac-' + i), style: 'width:88px;height:88px;pointer-events:none' }), el('div', {}, gtext(names[i])));
      ic.dataset.id = i;
      dragItem(ic, {
        onTap: () => { Sound.sfx('tap'); if (sel) sel.classList.remove('sel'); sel = ic; ic.classList.add('sel'); },
        onDrop: under => { const t = under.find(x => zEls.includes(x) || x === noBin); if (t) put(ic, t); },
      });
      tray.append(ic); return ic;
    });
    [...zEls, noBin].forEach(z => onTap(z, () => { if (sel) put(sel, z); }));
    DEV.solve = () => icons.forEach(ic => { if (!ic.dataset.done) { const id = +ic.dataset.id; put(ic, id === 5 ? noBin : zEls.find(z => +z.dataset.id === id)); } });
  });
}

/* 관람 안내판 (화면 위쪽에 계속 보이게 둔다) */
function signBoard() {
  const b = el('div', { class: 'paper', style: 'position:absolute;left:190px;top:72px;width:900px;padding:10px 26px;font:18px/1.5 var(--old);z-index:2' });
  b.append(el('div', { style: 'font:700 24px var(--old);text-align:center', text: '독도 관람 안내' }));
  for (const t of ['① 일반 관람객은 동도 선착장 일대에서만 관람할 수 있습니다.',
    '② 독도는 "독도 천연보호구역"입니다. 1982년 바닷새 번식지로 천연기념물에 지정되었습니다.',
    '③ 동식물과 돌, 흙을 가져가거나 해치지 마세요.',
    '④ 독도와 주변 바다는 「독도의 지속가능한 이용에 관한 법률」 등에 따라 보호·관리됩니다.',
    '⑤ 파도가 높으면 배를 대지 못하고 섬 둘레만 돌아볼 수 있습니다.']) b.append(bulletLine(t.slice(0, 1), t.slice(2)));
  L.scene.append(b);
  return b;
}

const STAGE7 = [
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(7);
    await timeJump('오늘날 · 대한민국', '독도');
    await talk([
      ['narr', '오늘날의 독도. 파란 바다 위로 여객선이 다가오고, 동도 꼭대기에는 하얀 등대가 서 있다.'],
      ['gaji:yay', '여기가 지금의 독도야! 독도 관리소에서 일손이 필요하대. 우리가 도와주자!'],
      ['gaji', '먼저 섬의 시설들을 제자리에 놓아 줘. 시설마다 알맞은 자리가 있어. 무엇에 쓰는 시설인지 생각해 봐!'],
    ]);
    await facilityGame();
    await talk([
      ['gaji', '완벽해! 가파른 화산섬이라 공항은 없지만, 섬을 지키고 사람이 살아가는 데 필요한 시설들이 있어.'],
      ['gaji', '이 시설들은 대한민국이 세우고 운영하고 있어. 나라가 지금 독도를 실제로 다스리고 있다는 모습이지.'],
      ['gaji:wow', '국제법에서는 어떤 나라가 그 땅을 실제로 다스리고 있는지를 아주 중요하게 봐. 그래서 이 증거는 "국제법적 근거"가 돼. 시설이 섬의 어디에 있는지 보여 주니 "지리적 근거"로 볼 수도 있고!'],
    ]);
    await getCard('facilities');
  },
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(7);
    await say('gaji', '독도에는 누가 살고 일하고 있을까? 사람들을 만나 이야기를 들어 보자.');
    await explore({
      title: '👋 독도의 사람들을 만나 봐!', review: true,
      spots: [
        { x: 980, y: 300, ico: '👮', label: '독도경비대원', run: () => talk([['guard', '우리는 독도경비대야. 경찰이 섬에 머물며 24시간 독도를 지키고 있어.'], ['guard', '1950년대에 독도의용수비대에게서 경비 임무를 넘겨받은 뒤로 경찰이 계속 지켜 왔지.']]) },
        { x: 1100, y: 190, ico: '💡', label: '등대관리원', run: () => talk([['keeper', '독도 등대는 밤바다를 지나는 배들에게 길을 알려 줘.'], ['keeper', '1954년에 처음 불을 밝혔고, 지금은 사람이 머물며 관리하는 유인등대야.']]) },
        { x: 800, y: 470, ico: '🧑‍💼', label: '관리사무소 직원', run: () => talk([['officer', '저는 울릉군청 독도관리사무소에서 일해요. 관람객을 안내하고 섬을 관리하지요.']]) },
        { x: 330, y: 420, ico: '🏡', label: '서도의 주민', run: () => talk([['resident', '나는 서도 주민숙소에 사는 주민이에요. 독도에도 주소를 두고 사는 사람이 있답니다.'], ['resident', '독도의 첫 주민으로 알려진 최종덕 씨는 1960년대부터 여기서 고기잡이를 하며 살았어요. 뒤를 이어 김성도 씨 부부가 살았고, 김성도 씨는 독도리 이장을 맡았지요.']]) },
      ],
    });
    await getCard('people');
    await solveClue('people');
    await say('gaji', '대한민국이 지금 독도를 어떻게 지키고 다스리고 있는지, 섬 둘레를 살펴볼까?');
    await explore({
      title: '🛡️ 오늘의 독도를 지키는 네 가지 모습을 찾아봐!', review: true,
      spots: [
        { x: 1030, y: 380, ico: '🚓', label: '섬', run: () => say('gaji', '섬에서는 경찰(독도경비대)이 경비를 서.') },
        { x: 560, y: 520, ico: '⚓', label: '바다', run: () => say('gaji', '주변 바다는 해군과 해양경찰의 배가 지켜.') },
        { x: 640, y: 150, ico: '✈️', label: '하늘', run: () => say('gaji', '하늘은 공군이 지키고 있어. 우리 영공이니까!') },
        { x: 200, y: 250, ico: '📜', label: '법', run: () => say('gaji', '독도에 관한 여러 법령이 시행되고, 시설을 세워 운영하고, 주민이 살아. 이 모두가 나라가 섬을 다스리는 모습이야.') },
      ],
    });
    addScore(40, 640, 300);
    await getCard('guard');
  },
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(7);
    await talk([
      ['narr', '뱃고동 소리와 함께 여객선이 동도 선착장에 닿았다. 관람객들이 우르르 내린다.'],
      ['gaji', '오늘 우리는 관람객 안내를 맡았어! 안내판을 잘 읽어 두면 어떤 질문에도 답할 수 있을 거야.'],
    ]);
    signBoard();
    const visitors = [
      { who: 'tourist', q: '와, 저 서도 꼭대기까지 올라가 봐도 돼요?', opts: [
        { t: '일반 관람객은 동도 선착장 일대에서만 둘러볼 수 있어요.', ok: true },
        { t: '네, 섬 어디든 자유롭게 다니셔도 돼요.', re: '안내판 ①번을 다시 읽어 볼까?' },
        { t: '등대 안으로 들어가서 구경하세요.', re: '안내판 ①번을 다시 읽어 볼까?' }] },
      { who: 'kid', q: '이 예쁜 돌이랑 갈매기 알, 기념으로 가져가도 돼요?', opts: [
        { t: '안 돼요. 독도는 천연보호구역이라 자연을 그대로 지켜야 해요.', ok: true },
        { t: '작은 돌 하나쯤은 괜찮아요.', re: '안내판 ②, ③번을 다시 읽어 볼까?' },
        { t: '갈매기 알은 가져가도 돼요.', re: '안내판 ②, ③번을 다시 읽어 볼까?' }] },
      { who: 'student', q: '독도의 자연을 지키기 위한 법도 있어요?', opts: [
        { t: '네, 「독도의 지속가능한 이용에 관한 법률」로 보호하고 있어요.', ok: true },
        { t: '아니요, 아무 법도 없어요.', re: '안내판 ④번에 적혀 있었어!' },
        { t: '다른 나라의 법으로 관리해요.', re: '안내판 ④번을 다시 읽어 볼까?' }] },
    ];
    for (const v of visitors) {
      let tries = 0; const bad = new Set();
      for (;;) {
        const left = v.opts.map((o, i) => i).filter(i => !bad.has(i));
        const pick = await choose(v.who, v.q, left.map(i => v.opts[i].t));
        const o = v.opts[left[pick]];
        if (o.ok) { Sound.sfx('good'); award('s7_visit', tries + 1, 100); await say(v.who, '아하, 그렇구나! 고마워요!'); break; }
        tries++; miss(); bad.add(left[pick]); await say('gaji', o.re);
      }
    }
    clearScene();
    await getCard('visit');
    await getCard('nature');
  },
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(7);
    await talk([
      ['kid', '그런데 독도는 작은 바위섬인데, 왜 이렇게 소중해요?'],
      ['gaji', '좋은 질문이야! 섬 둘레에서 독도의 보물 네 가지를 찾아서 설명해 주자.'],
    ]);
    await explore({
      title: '💎 독도의 보물 네 가지를 찾아봐!', review: true,
      spots: [
        { x: 520, y: 540, ico: '🐟', label: '바닷속', run: async () => { await say('gaji', '차가운 바닷물과 따뜻한 바닷물이 만나는 곳이라 오징어, 꼴뚜기, 대구, 홍합, 따개비 같은 바다 생물이 많아. 아주 좋은 어장이야!'); await solveClue('sea'); } },
        { x: 250, y: 560, ico: '🔥', label: '바다 밑', run: () => say('gaji', '바다 밑에는 "불타는 얼음"이라 불리는 메탄하이드레이트 같은 자원이 있을 것으로 기대돼.') },
        { x: 1060, y: 170, ico: '📡', label: '동해 한가운데', run: () => say('gaji', '동해 한가운데 있어서, 우리 바다와 하늘을 지키는 데 아주 중요한 자리야.') },
        { x: 170, y: 170, ico: '🐦', label: '하늘과 바위틈', run: () => { Sound.sfx('gull'); return say('gaji', '괭이갈매기, 바다제비, 슴새 같은 바닷새와 바다 생물, 바위틈 식물들의 소중한 보금자리야.'); } },
      ],
    });
    addScore(40, 640, 300);
    await getCard('value');
    await say('gaji:yay', '독도는 작지만 우리 바다와 자연, 그리고 역사를 품은 섬이야. 이제 마지막 결전만 남았어!');
    await evidenceBoard(7);
    await stageClear(7);
  },
];
