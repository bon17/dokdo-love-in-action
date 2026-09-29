/* ===== 4단계: 암호 해독실 ===== */

/* 태정관지령에 붙어 있던 지도(기죽도약도)를 간단히 다시 그린 것. "외 1도"를 찾아 누른다. */
function oneMoreIsland() {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1100px;padding:22px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: '🗺️ 함께 붙어 있던 지도 「기죽도약도」' }),
      el('div', { class: 'msg', style: 'font-size:21px;margin:4px 0 12px', text: '"다케시마 외 1도"에서 "외 1도(그 밖의 한 섬)"는 어느 섬일까? 지도에서 찾아 눌러 봐.' }));
    const map = el('div', { class: 'paper', style: 'position:relative;width:1000px;height:420px;margin:0 auto;background:linear-gradient(135deg,#efe0bb,#dcc590)' });
    map.innerHTML = `<svg width="1000" height="420" viewBox="0 0 1000 420" style="position:absolute;left:0;top:0">
      <g stroke="#7a5a30" stroke-width="2" fill="none" opacity=".35"><path d="M40 380 Q300 360 520 300 T960 60"/><path d="M60 60 Q400 120 940 380"/></g>
      <text x="40" y="40" font-size="20" fill="#7a5a30" font-family="RIDIBatang">기죽도약도 (다시 그린 그림)</text></svg>`;
    const isl = (x, y, w, h, name, sub, id) => {
      const b = el('div', { style: `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center` });
      b.append(el('div', { style: `width:${w * 0.8}px;height:${h * 0.55}px;border-radius:45% 55% 50% 50%;background:#8a9a6a;border:3px solid #4a5a3a` }),
        el('div', { style: 'font:20px var(--old);color:#4a2d18;margin-top:6px;white-space:nowrap', text: name }),
        el('div', { style: 'font:15px var(--body);color:#7a5a30;white-space:nowrap', text: sub }));
      b.dataset.id = id; map.append(b); return b;
    };
    const a = isl(90, 60, 230, 200, '이소타케시마 (磯竹島)', '다케시마라고도 부름', 'take');
    const b = isl(470, 150, 110, 110, '마쓰시마 (松島)', '', 'matsu');
    const c = isl(780, 250, 170, 150, '오키 (隱岐)', '', 'oki');
    root.append(map);
    const m = modal(root, { closable: false });
    let tries = 0;
    const finish = () => { DEV.solve = null; award('s4_map', tries + 1); b.style.outline = '5px solid #3dd68c'; b.style.borderRadius = '20px'; setTimeout(() => { m.close(); resolve(); }, 900); };
    onTap(b, () => { Sound.sfx('good'); finish(); });
    onTap(a, () => { tries++; if (wrongFeedback(tries, '이소타케시마는 "다케시마", 곧 울릉도야. "외 1도"는 그 밖의 한 섬!')) finish(); });
    onTap(c, () => { tries++; if (wrongFeedback(tries, '오키섬은 일본의 섬이야. 문서가 말한 두 섬 가운데 나머지 하나를 찾아봐.')) finish(); });
    DEV.solve = finish;
  });
}

function sealSvgFlower() {
  return `<svg width="84" height="84" viewBox="-42 -42 84 84">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-19" rx="13" ry="17" fill="#fff" transform="rotate(${a})"/>`).join('')}<circle r="9" fill="#c0392b" stroke="#fff" stroke-width="3"/></svg>`;
}

const STAGE4 = [
  async () => {
    setBg('bg-stage4'); fogFx(0.35); Sound.play('mystery'); placeSeal(4);
    await talk([
      ['narr', '19세기 후반. 우산호가 도착한 곳은 옛 문서들이 가득한 암호 해독실이다.'],
      ['gaji:wow', '안개가 문서를 찢어 놓았어! 일본 정부가 남긴 문서들인데… 조각을 맞춰서 되살려 보자.'],
    ]);
    await placeTiles({
      title: '🧩 찢어진 문서 1: 일본 외무성의 보고서', key: 's4_puz', base: 40, vertical: true, paper: true,
      prompt: '1870년, 일본 외무성 관리들이 조선을 조사하고 올린 보고서야. 조각을 알맞은 칸에 넣어 봐.',
      slots: [{ label: '표지' }, { label: '목차 가운데 한 항목' }, { label: '본문의 일부' }],
      tiles: [
        { t: '『조선국교제시말내탐서』 · 1870년 · 일본 외무성', slot: 0 },
        { t: '다케시마(울릉도)와 마쓰시마(독도)가 조선의 부속이 된 경위', slot: 1 },
        { t: '마쓰시마는 다케시마 옆의 섬이다. 다케시마에는 1690년대 이후 한동안 조선이 사람을 보내 살게 하였다.', slot: 2 },
      ],
      hintText: '칸 위에 적힌 이름을 보고, 조각의 내용이 어울리는 곳을 찾아봐.',
    });
    await say('gaji:wow', '일본 외무성이 스스로 "두 섬이 조선의 부속이 된 경위"를 조사했다니!');
    await getCard('naitansho');
    await placeTiles({
      title: '🧩 찢어진 문서 2: 일본 최고 기관의 지시', key: 's4_puz', base: 60, vertical: true, paper: true,
      prompt: '1877년의 문서야. 시마네현의 질문 → 내무성의 조사 → 태정관의 결론 순서로 맞춰 봐.',
      slots: [{ label: '제목' }, { label: '무슨 일이 있었나' }, { label: '최고 기관 태정관의 결론' }, { label: '함께 붙은 지도' }],
      tiles: [
        { t: '일본해 안의 다케시마 외 1도를 지적(땅 장부)에 넣는 문제에 관한 질의', slot: 0 },
        { t: '시마네현이 두 섬을 지도와 장부에 넣을지 묻자, 내무성이 17세기 기록을 조사했다.', slot: 1 },
        { t: '"다케시마 외 1도는 본방(일본)과 관계없음을 명심할 것."', slot: 2 },
        { t: '「기죽도약도」: 오키섬 서북쪽에 두 섬이 그려져 있다.', slot: 3 },
      ],
      hintText: '"결론"에는 태정관이 내린 지시가 들어가야 해. 따옴표로 된 말을 찾아봐.',
    });
    await oneMoreIsland();
    await say('gaji', '"외 1도"는 마쓰시마, 곧 독도였어. 일본 최고 기관이 두 섬 모두 일본과 관계없다고 한 거야.');
    await getCard('dajokan');
  },
  async () => {
    setBg('bg-stage4'); fogFx(0.2); Sound.play('mystery'); placeSeal(4);
    await talk([
      ['narr', '1882년, 조선. 고종은 울릉도를 살펴보라며 검찰사를 보냈다.'],
      ['lee', '전하, 울릉도를 두루 살피고 돌아왔습니다.'],
    ]);
    await showDoc({ title: '울릉도 검찰 보고', era: '1882년 · 울릉도 검찰사 이규원이 고종에게 올린 보고',
      lines: ['울릉도에 들어가 산과 바닷가를 두루 살폈습니다.', '일본 사람들이 몰래 들어와 나무를 베어 가고 있었고, 섬에 자기네 땅이라는 푯말까지 세워 두었습니다.', '섬의 땅이 기름지니, 백성이 들어가 살 만합니다.'] });
    await whyQuestion({ key: 's4_lee', text: '보고를 들은 조선 정부는 섬을 지키려고 어떻게 했을까?',
      options: [
        { t: '일본에 항의하고, 백성을 울릉도로 보내 살게 했다.', ok: true },
        { t: '울릉도를 그대로 비워 두었다.', re: '몰래 들어온 사람들을 막고 섬을 지키려면, 섬에 누가 있어야 하지 않을까? 보고의 마지막 줄을 다시 떠올려 봐.' },
        { t: '울릉도를 일본에 넘겨주었다.', re: '고종은 섬을 지키려고 검찰사를 보냈어. 넘겨줄 리가 없지! 다시 생각해 볼까?' },
      ] });
    await say('narr', '조선 정부는 일본에 항의하는 한편, 1883년부터 백성을 울릉도로 옮겨 살게 하며 섬을 개척했다.');
    await getCard('lee');
    await say('gaji', '그 뒤로 울릉도에 사람이 늘었어. 대한제국 시대의 신문에도 울릉도 소식이 실렸대. 읽어 보자!');
    await showDoc({ title: '『황성신문』 「울릉도사황」', era: '1899년 9월 · 대한제국의 신문',
      lines: ['울진 동쪽 바다에 섬이 하나 있으니 울릉이라 한다.', '그에 딸린 작은 섬이 여럿 있는데,', '그 가운데 우산도와 죽도가 가장 이름났다.'] });
    await say('gaji', '울릉도에 딸린 이름난 섬 두 개… 이 두 이름을 잘 기억해 둬. 곧 암호를 풀 때 쓸 거야!');
    await getCard('hwangseong');
  },
  async () => {
    setBg('bg-stage4'); fogFx(0.15); Sound.play('mystery'); placeSeal(4);
    await talk([
      ['narr', '1900년 10월, 대한제국. 고종 황제의 책상 위에 법령 하나가 놓여 있다.'],
      ['gaji', '대한제국의 법령, 칙령이야! 반포되기 전에 안개가 이름 하나를 암호로 바꿔 놓았대.'],
    ]);
    await showDoc({ title: '대한제국 칙령 제41호', era: '1900년 10월 25일 · 관보에 실린 법령',
      lines: ['제1조  울릉도를 울도라 고쳐 강원도에 딸리게 하고, 도감을 군수로 고쳐 관제에 넣는다.', '제2조  군청은 태하동에 두고, 구역은 울릉전도와 죽도, 석도(石島)를 관할한다.'] });
    await talk([
      ['gaji', '"죽도"는 울릉도 바로 옆의 대나무 섬(댓섬)이야. 신문에 나온 이름과 같지?'],
      ['gaji:wow', '그럼 "석도"는? 신문에서 죽도와 함께 나온 섬은 우산도였어. 석도의 암호를 풀어 보자!'],
    ]);
    await placeTiles({
      title: '🔐 암호 해독: "석도"는 어느 섬일까?', key: 's4_cipher', vertical: true,
      prompt: '울릉도 사람들의 말: "저 독섬 가서 미역 좀 따 오드라고!"\n그 무렵 울릉도로 건너온 사람들 중에는 전라도 사람이 많았고, 전라도 사투리로 "돌"을 "독"이라고 해.',
      slots: [{ label: '칙령에 적힌 이름' }, { label: '한자의 뜻대로 읽으면 (石 = 돌)' }, { label: '울릉도 사람들의 사투리로 읽으면' }, { label: '그 소리를 다시 한자로 적으면' }],
      tiles: [{ t: '石島 (석도)', slot: 0 }, { t: '돌섬', slot: 1 }, { t: '독섬', slot: 2 }, { t: '獨島 (독도)', slot: 3 }],
      hintText: '石은 "돌 석"이야. 돌섬을 사투리로 부르면? 그리고 그 소리를 한자로 적으면?',
      reveal: '石島 → 돌섬 → 독섬 → 獨島! 석도는 바로 독도였어.',
    });
    unlockName('n_1900');
    await say('gaji:yay', '풀었다! 뜻으로 적으면 석도(石島), 소리로 적으면 독도(獨島). 같은 섬이야!');
    await pressStamp({ title: '📜 칙령 반포', note: '대한제국의 상징인 오얏꽃 도장을 꾹 눌러 칙령을 반포해!', key: 's4_seal',
      doc: '대한제국 칙령 제41호\n제2조  군청은 태하동에 두고, 구역은 울릉전도와 죽도, 석도를 관할한다.\n광무 4년(1900년) 10월 25일', label: sealSvgFlower() });
    await getCard('edict41');
    await talk([
      ['gaji', '대한제국은 1900년, 법령으로 독도를 울도군이 다스리는 섬으로 정했어.'],
      ['gaji', '그래서 지금도 이 칙령이 반포된 10월 25일을 "독도의 날"로 기념하고 있어.'],
    ]);
    await evidenceBoard(4);
    await stageClear(4);
  },
];
