/* ===== 2단계: 사관의 서고 ===== */

/* 나무 사자 작전: 사자를 배에 싣고, 크게 포효해 우산국을 설득한다. */
function lionGame() {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1160px;padding:20px;text-align:center' });
    const head = el('div', { style: 'font:30px var(--ui)', text: '🦁 나무 사자 작전' });
    const note = el('div', { style: 'font:20px var(--body);color:#bcd3ea;margin:4px 0 12px', text: '1단계: 나무 사자를 끌어서 배 세 척에 하나씩 실어!' });
    const stage = el('div', { style: 'position:relative;width:1100px;height:430px;margin:0 auto;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,#8fd0f5 0%,#cde9f7 45%,#2d7fb9 46%,#15507f 100%)' });
    stage.append(el('div', { style: 'position:absolute;right:-40px;top:40px;width:420px;height:200px;border-radius:50% 50% 0 0;background:#5c8a4e;box-shadow:inset 0 -30px 0 #4a7040' }),
      el('div', { style: 'position:absolute;right:120px;top:120px;font:22px var(--ui);color:#fff;text-shadow:0 2px 4px #000', text: '우산국' }));
    const gaugeWrap = el('div', { style: 'position:absolute;right:30px;top:20px;width:300px;height:26px;border-radius:13px;background:rgba(0,0,0,.35);overflow:hidden;display:none' });
    const gauge = el('div', { style: 'height:100%;width:0;background:linear-gradient(90deg,#ffd166,#ff6b3d)' });
    gaugeWrap.append(gauge);
    stage.append(gaugeWrap);
    const ships = [0, 1, 2].map(i => {
      const s = el('div', { class: 'slot', style: `position:absolute;left:${120 + i * 270}px;top:250px;width:200px;height:120px;border:none;background:none` });
      s.innerHTML = `<svg width="200" height="130" viewBox="0 0 200 130" style="position:absolute;left:0;top:-30px;pointer-events:none"><path d="M10 80 L190 80 L165 118 L35 118 Z" fill="#8a5a2b" stroke="#4a2d12" stroke-width="3"/><rect x="96" y="4" width="6" height="78" fill="#4a2d12"/><path d="M102 8 L160 60 L102 64 Z" fill="#f3e2b8" stroke="#8a6a3a" stroke-width="2"/></svg>`;
      s.dataset.i = i; stage.append(s); return s;
    });
    const lions = [0, 1, 2].map(i => {
      const l = el('img', { src: img('item-lion'), style: `position:absolute;left:${60 + i * 110}px;top:40px;width:100px;cursor:grab;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))` });
      stage.append(l); return l;
    });
    stage.append(el('div', { style: 'position:absolute;left:40px;top:150px;font:18px var(--ui);color:#2b2521;background:rgba(255,255,255,.7);padding:2px 10px;border-radius:8px', text: '신라 나루터' }));
    root.append(head, note, stage);
    const roar = el('button', { class: 'btn', text: '🦁 어흥! (연타!)', style: 'margin-top:14px;display:none;font-size:30px;min-height:70px' });
    root.append(roar);
    const m = modal(root, { closable: false });
    let loaded = 0, sel = null, fear = 0, phase = 1, lastRoar = 0, raf;
    const load = (lion, ship) => {
      if (ship.dataset.full) return;
      ship.dataset.full = 1; lion.remove(); loaded++;
      ship.append(el('img', { src: img('item-lion'), style: 'position:absolute;left:30px;top:-20px;width:80px;animation:popIn .3s' }));
      Sound.sfx('good');
      if (loaded === 3) startRoar();
    };
    lions.forEach(l => dragItem(l, {
      onTap: () => { sel = l; lions.forEach(x => x.style.outline = ''); l.style.outline = '4px solid #ff8a3d'; Sound.sfx('tap'); },
      onDrop: under => { const s = under.find(x => x.dataset && x.dataset.i != null && ships.includes(x)); if (s) load(l, s); },
    }));
    ships.forEach(s => onTap(s, () => { if (sel && sel.isConnected) { load(sel, s); sel = null; } }));
    const startRoar = () => {
      phase = 2; note.textContent = '2단계: "항복하지 않으면 이 맹수를 풀어 놓겠다!" 어흥 버튼을 빠르게 눌러 우산국을 겁주자!';
      roar.style.display = ''; gaugeWrap.style.display = '';
      const decay = () => { if (phase !== 2) return; fear = Math.max(0, fear - 0.25); gauge.style.width = fear + '%'; raf = requestAnimationFrame(decay); };
      raf = requestAnimationFrame(decay);
    };
    roar.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (phase !== 2) return;
      fear = Math.min(100, fear + 7); gauge.style.width = fear + '%';
      const now = performance.now(); if (now - lastRoar > 250) { Sound.sfx('roar'); lastRoar = now; }
      stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
      if (fear >= 100) win();
    });
    const win = () => {
      phase = 3; cancelAnimationFrame(raf); DEV.solve = null;
      roar.style.display = 'none';
      note.textContent = '우산국 사람들이 흰 깃발을 올렸다!';
      stage.append(el('div', { style: 'position:absolute;right:170px;top:40px;font:60px sans-serif;animation:popIn .4s', text: '🏳️' }));
      award('s2_lion', 1);
      setTimeout(() => { m.close(); resolve(); }, 1500);
    };
    DEV.solve = win;
  });
}

const BOOKS2 = {
  sejong: { title: '『세종실록』 「지리지」', era: '1454년 · 조선 정부가 펴낸 기록 · 강원도 울진현 조',
    lines: ['우산(于山)과 무릉(武陵) 두 섬이 울진현 정동쪽 바다 가운데 있다.', '두 섬은 서로 멀리 떨어져 있지 않아, 날씨가 맑으면 바라볼 수 있다.', '신라 때에는 우산국이라 불렀다.'] },
  yeoji: { title: '『신증동국여지승람』', era: '1531년 · 조선 정부가 새로 보태어 펴낸 지리책 · 강원도 울진현 조',
    lines: ['〈우산도 · 울릉도〉', '두 섬이 울진현 정동쪽 바다 가운데 있다.'] },
  jang: { title: '장한상 『울릉도사적』', era: '1694년 · 삼척영장 장한상의 울릉도 조사 기록',
    lines: ['울릉도의 높은 산에 올라 사방을 바라보았다.', '서쪽으로는 대관령의 구불구불한 산줄기가 보이고,', '동쪽으로는 바다 가운데 섬 하나가 아득히 동남쪽에 있는데,', '크기는 울릉도의 3분의 1이 안 되고, 거리는 300여 리쯤이다.'] },
  munheon: { title: '『동국문헌비고』 「여지고」', era: '1770년 · 조선 영조 때 나라에서 펴낸 책',
    lines: ['울릉과 우산은 모두 우산국 땅이다.', '우산은 일본이 말하는 송도(松島, 마쓰시마)이다.'] },
};

const STAGE2 = [
  async () => {
    setBg('bg-stage2'); fogFx(0.5); Sound.play('mystery'); placeSeal(2);
    await talk([
      ['narr', '우산호가 도착한 곳은 옛 기록을 보관하는 조선의 서고. 안개가 책장 사이로 스며들고 있다.'],
      ['gaji:wow', '책 속 글자가 지워지고 있어! 저기 잠긴 궤짝 안에 중요한 기록이 있대.'],
      ['gaji', '궤짝은 세 자리 숫자로 잠겨 있어. 방 안의 단서를 살펴서 번호를 알아내자!'],
    ]);
    let seen = { book: false, chart: false };
    await explore({
      title: '🔍 반짝이는 곳을 눌러 단서를 찾아봐!',
      spots: [
        { x: 300, y: 400, ico: '📕', label: '펼쳐진 역사책', run: async () => {
          seen.book = true;
          await showDoc({ title: '『삼국사기』 신라본기 (펼쳐진 쪽)', era: '고려 때 펴낸 역사책 · 신라 지증왕 이야기',
            lines: ['지증왕 13년 여름 6월, 우산국이 항복하여 해마다 토산물을 바쳤다.', '우산국은 명주(지금의 강릉) 정동쪽 바다에 있는 섬으로, 울릉도라고도 한다.', '땅이 험한 것을 믿고 항복하지 않자, 이찬 이사부가 꾀를 내었다…', { t: '뒷장은 안개에 가려 읽을 수 없다. 나머지 기록은 궤짝 속에 있는 것 같다.', note: true }] });
        } },
        { x: 690, y: 250, ico: '📜', label: '벽의 연대표', run: async () => {
          seen.chart = true;
          await showDoc({ title: '신라 왕 연대표', era: '서고 벽에 걸린 표',
            lines: ['지증왕 1년 = 500년', '법흥왕 1년 = 514년', { t: '왕이 된 해를 그 왕의 1년으로 센다.', note: true }] });
        } },
        { x: 1010, y: 470, ico: '🔒', label: '잠긴 궤짝', run: async () => {
          if (!seen.book || !seen.chart) hint('먼저 다른 단서들을 살펴보면 번호를 알 수 있을 거야.', 'gaji', 4000);
          await lockPuzzle({ title: '🔒 궤짝의 자물쇠', note: '궤짝 뚜껑에 "우산국이 항복한 해"라고 새겨져 있다.', answer: '512', key: 's2_lock',
            hintText: '연대표를 봐. 지증왕 1년이 500년이면 2년은 501년이야. 그럼 13년은?', reveal: '같이 세어 보자. 1년=500년, 2년=501년… 13년은 512년!' });
        } },
      ],
    });
    await say('gaji', '열렸다! 안에 이사부 장군의 작전 기록이 들어 있어. 512년의 바다로 가 보자!');
  },
  async () => {
    setBg('scene-isabu'); fogFx(0); Sound.play('sail'); placeSeal(2);
    await talk([
      ['narr', '512년, 신라의 장군 이사부가 배를 이끌고 우산국 앞바다에 다다랐다.'],
      ['isabu', '우산국 사람들은 용감하고 땅이 험해서 힘으로 싸우면 이기기 어렵다. 꾀를 써야 한다.'],
      ['isabu', '나무로 사자를 만들어 배마다 실어라! 싸우지 않고도 이길 방법이 있다.'],
    ]);
    await lionGame();
    await talk([
      ['isabu', '"항복하지 않으면 이 맹수들을 풀어 놓겠다!"'],
      ['narr', '처음 보는 맹수에 겁을 먹은 우산국 사람들은 싸우지 않고 항복했다. 이때부터 우산국은 신라에 속하게 되었다.'],
      ['gaji:wow', '지증왕 13년, 섬나라 우산국, 신라 장군… 라디오에서 들은 노래 가사랑 이어지잖아!'],
    ]);
    await getCard('usan');
    await solveClue('silla');
  },
  async () => {
    setBg('bg-stage2'); fogFx(0.4); Sound.play('mystery'); placeSeal(2);
    await talk([
      ['gaji', '서고로 돌아왔어. 책장의 책 네 권이 안개에 흐려지고 있어!'],
      ['gaji', '책을 눌러서 흐려진 글자를 문질러 되살려 줘. 무엇이 적혀 있는지 꼼꼼히 읽어 보자.'],
    ]);
    const after = {
      sejong: async () => { await say('gaji:wow', '"날씨가 맑으면 바라볼 수 있다"… 우리가 전망대에서 겪은 일이랑 똑같잖아!'); await getCard('sejong'); await solveClue('sejong'); unlockName('n_old'); },
      yeoji: async () => { await say('gaji', '나라에서 직접 펴낸 지리책에 두 섬이 나란히 실려 있네. 나라가 책에 자기 땅을 적는다는 건 무슨 뜻일까?'); await getCard('yeoji'); },
      jang: async () => { await say('gaji', '울릉도에서 동남쪽 바다에 보이는 작은 섬… 망원경으로 본 그 섬 같지 않아?'); await getCard('jang'); },
      munheon: async () => { await say('gaji:wow', '일본이 부르는 이름까지 적어 두었네! "우산"이 어느 섬인지 헷갈릴 때 아주 중요한 기록이야.'); await getCard('munheon'); },
    };
    const spots = [['sejong', 230, 330, '📘'], ['yeoji', 440, 230, '📗'], ['jang', 860, 240, '🔭'], ['munheon', 1070, 340, '📜']].map(([id, x, y, ico]) => ({
      x, y, ico, label: BOOKS2[id].title.replace(/『|』|「|」/g, '').slice(0, 10), run: async () => {
        await showDoc({ ...BOOKS2[id], rub: true, btn: '다 읽었어' });
        addScore(20, 640, 300);
        await after[id]();
      },
    }));
    await explore({ title: '📚 흐려진 책을 눌러 되살려 봐!', spots });
  },
  async () => {
    setBg('bg-stage2'); fogFx(0.7); Sound.play('mystery'); placeSeal(2);
    await say('fog', '크크크… 조선은 울릉도에서 사람들을 모두 데려가 섬을 텅 비워 뒀지. 섬을 버린 거야!');
    await say('gaji', '정말 그럴까? 서고 구석에 임금의 명령을 적은 기록이 있어. 읽어 보자.');
    await showDoc({ title: '조선 조정의 기록', era: '조선 전기 ~ 1694년',
      lines: ['왜구가 섬 백성을 노략질하니, 섬 사람들을 육지로 데려와 보호하라. (쇄환)', '섬을 비워 두더라도 내버려 두지 말고, 관리를 보내 섬을 살피고 오게 하라.', '1694년부터는 관리를 정기적으로 보내 울릉도와 그 둘레를 살피도록 하라. (수토)'] });
    await getCard('suto');
    const bookItems = [
      { id: 'sejong', t: '📘 『세종실록』 「지리지」', why: '두 섬을 알았다는 기록이지만, 섬을 계속 돌봤는지는 알 수 없어.' },
      { id: 'yeoji', t: '📗 『신증동국여지승람』', why: '두 섬이 실려 있지만, 섬을 계속 돌봤는지는 알 수 없어.' },
      { id: 'jang', t: '🔭 장한상 『울릉도사적』' },
      { id: 'munheon', t: '📜 『동국문헌비고』', why: '우산도가 어느 섬인지 알려 주지만, 섬을 계속 돌봤는지는 알 수 없어.' },
      { id: 'suto', t: '⛵ 조정의 수토 명령' },
    ];
    await pickItem({ claim: '조선은 섬을 비워 두고 버렸다!', prompt: '안개의 말을 반박할 기록을 골라 던져!', items: bookItems, correct: ['jang', 'suto'], key: 's2_fog1',
      hintText: '섬을 버렸다면 관리를 보내 조사할 까닭도 없었겠지? 관리가 섬을 살피러 간 기록을 찾아봐.', reveal: '조정이 관리를 보내 섬을 살핀 기록! 섬을 버린 게 아니었어.' });
    Sound.sfx('hit');
    await say('fog', '으윽… 흥, 그래도 조선 사람들은 울릉도 너머의 작은 섬은 몰랐을걸!');
    await pickItem({ claim: '조선 사람들은 독도를 몰랐다!', prompt: '이번엔 어떤 기록으로 반박할까?', key: 's2_fog2',
      items: [{ id: 'suto', t: '⛵ 조정의 수토 명령', why: '섬을 돌봤다는 기록이지만, 작은 섬을 알았다는 말은 없어.' }, { id: 'sejong', t: '📘 『세종실록』 「지리지」' }, { id: 'jang', t: '🔭 장한상 『울릉도사적』' }, { id: 'munheon', t: '📜 『동국문헌비고』' }, { id: 'lion', t: '🦁 나무 사자', why: '나무 사자는 우산국을 설득한 도구지, 기록이 아니야.' }],
      correct: ['sejong', 'jang', 'munheon'],
      hintText: '울릉도 말고 또 하나의 섬을 적어 둔 기록을 찾아봐.', reveal: '울릉도에서 보이는 또 하나의 섬을 적은 기록들이 있었지!' });
    Sound.sfx('hit'); fogFx(0.2);
    await talk([
      ['fog', '크윽… 이, 이번엔 물러가 주지!'],
      ['gaji:yay', '해냈다! 조선은 두 섬을 알았고, 기록했고, 관리까지 보내 살폈어.'],
    ]);
    await evidenceBoard(2);
    await stageClear(2);
  },
];
