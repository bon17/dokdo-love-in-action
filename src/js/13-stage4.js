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
    const slot = el('div', { class: 'hintslot' });
    root.append(map, slot);
    const m = modal(root, { closable: false });
    hintHost(slot);
    let tries = 0, over = false;
    const finish = async () => {
      if (over) return; over = true;
      DEV.solve = null; award('s4_map', tries + 1); b.style.outline = '5px solid #3dd68c'; b.style.borderRadius = '20px';
      await doneBar(root, { msg: '"외 1도"는 마쓰시마, 곧 독도!' });
      HINT.host = null; m.close(); resolve();
    };
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
    await timeJump('1870년 · 일본 메이지 정부', '일본 외무성');
    await talk([
      ['narr', '1868년, 일본에 메이지 새 정부가 들어섰다. 새 정부는 조선과 어떻게 외교를 할지 정하려고 했다.'],
      ['narr', '일본 외무성은 관리들을 조선에 보내 조선의 사정을 몰래 살펴 오게 했고, 1870년 그 결과를 보고서로 올렸다.'],
      ['gaji:wow', '그 보고서가 여기 있어! 그런데 이름이 너무 길어… 『조선국교제시말내탐서』? 암호 같지 않아?'],
      ['gaji', '긴 이름은 뜻 조각으로 나누면 풀려. 한자를 단서로 암호를 풀어 보자!'],
    ]);
    await placeTiles({
      title: '🔐 이름 해독: 『조선국교제시말내탐서』는 무슨 뜻일까?', key: 's4_puz', slotW: 250,
      prompt: '긴 이름을 네 조각으로 나눴어.\n한자를 단서로 조각마다 알맞은 뜻을 넣어 봐.',
      slots: [{ label: '조선국\n朝鮮國' }, { label: '교제\n交際' }, { label: '시말\n始末' }, { label: '내탐서\n內探書' }],
      tiles: [
        { t: '조선이라는 나라', slot: 0 },
        { t: '나라끼리 사귐\n(외교)', slot: 1 },
        { t: '처음부터 끝까지의\n경위', slot: 2 },
        { t: '몰래 살펴 조사한\n보고서', slot: 3 },
      ],
      hintText: '交際는 "사귈 교, 사이 제", 始末은 "처음 시, 끝 말",\n內探은 "안 내, 찾을 탐"이야.',
      reveal: '조선국 + 교제 + 시말 + 내탐서\n= 조선과의 외교 경위를 몰래 조사한 보고서!',
      doneMsg: '『조선국교제시말내탐서』\n= 조선과의 외교가 이어져 온 경위를 몰래 조사한 보고서',
    });
    await say('gaji', '보고서 안에는 여러 항목이 있는데… 그중 하나가 눈에 띄어! 읽어 보자.');
    await showDoc({ title: '『조선국교제시말내탐서』 가운데 한 항목', era: '1870년 · 일본 외무성 관리들의 보고서',
      lines: [{ t: '〈다케시마와 마쓰시마가 조선의 부속이 된 경위〉', head: true }, '마쓰시마(독도)는 다케시마(울릉도) 옆에 있는 섬이다.', '다케시마에는 1690년대 이후 한동안\n조선이 사람을 보내 살게 하였다.'] });
    await whyQuestion({ key: 's4_why1', text: '일본 정부의 관리들이 "두 섬이 조선의 부속이 된 경위"를 조사해 적었다는 건, 두 섬을 어느 나라 섬으로 알고 있었다는 뜻일까?',
      options: [
        { t: '조선에 딸린 섬으로 알고 있었다.', ok: true },
        { t: '일본에 딸린 섬으로 알고 있었다.', re: '항목의 제목을 다시 봐. "조선의 부속이 된 경위"라고 적혀 있어.' },
        { t: '어느 나라 섬도 아니라고 생각했다.', re: '"부속"은 딸려 있다는 뜻이야. 누구에게 딸린 섬이라고 했지?' },
      ] });
    await say('gaji', '맞아. 일본 정부가 스스로 두 섬을 조선에 딸린 섬으로 조사해 적었어.');
    await getCard('naitansho');
    await timeJump('1876~1877년 · 일본 메이지 정부', '내무성과 태정관');
    await talk([
      ['narr', '1876년, 일본 시마네현은 새 지도와 땅 장부(지적)를 만들면서, 동해의 두 섬을 넣어도 되는지 정부에 물었다.'],
      ['narr', '일본 내무성은 17세기 안용복 사건 때 조선과 오간 기록들을 꼼꼼히 살폈다.'],
      ['gaji:wow', '돗토리번의 답장, 막부의 도해금지령… 3단계에서 우리가 본 기록들이야!'],
      ['narr', '내무성은 조사 결과를 일본의 최고 국가기관인 태정관에 올렸다.'],
    ]);
    await whyQuestion({ key: 's4_why2', text: '태정관은 무엇을 근거로 결론을 내렸을까?',
      options: [
        { t: '17세기에 두 섬이 일본 땅이 아니라고 정리된 기록', ok: true },
        { t: '섬이 너무 멀어서 가기 귀찮았기 때문', re: '태정관은 옛 기록을 꼼꼼히 조사했어. 내무성이 무엇을 살폈는지 떠올려 봐.' },
        { t: '조선이 두 섬을 돈을 주고 샀다는 기록', re: '그런 기록은 없어. 3단계에서 본 돗토리번의 답과 도해금지령을 떠올려 봐.' },
      ] });
    await say('narr', '1877년 3월, 태정관이 지시를 내렸다.');
    await showDoc({ title: '태정관지령', era: '1877년 · 일본의 최고 국가기관 태정관의 지시',
      lines: ['일본해 안의 다케시마 외 1도에 대하여,\n본방(일본)과 관계없음을 명심할 것.', { t: '함께 붙은 지도: 「기죽도약도」', note: true }] });
    await say('gaji', '"외 1도"? 그 밖의 섬 하나라는 뜻인데… 어느 섬일까? 함께 붙어 있던 지도를 보자!');
    await oneMoreIsland();
    await say('gaji', '"외 1도"는 마쓰시마, 곧 독도였어. 일본 최고 기관이 두 섬 모두 일본과 관계없다고 한 거야.');
    await getCard('dajokan');
  },
  async () => {
    setBg('bg-stage4'); fogFx(0.2); Sound.play('mystery'); placeSeal(4);
    await timeJump('1881년 · 조선 고종 때', '한양의 조정');
    await talk([
      ['narr', '1881년, 울릉도를 살피고 돌아온 수토관이 놀라운 소식을 전했다.'],
      ['suto', '울릉도에 일본 사람들이 몰래 들어와 큰 나무를 베어 가고 있습니다!'],
      ['gaji:wow', '잠깐, 1696년에 막부가 일본 사람이 울릉도로 건너가는 걸 금지했었지? 그런데 몰래 들어와 나무를 베어 간다고?'],
      ['narr', '조선 조정은 일본 정부에 "조선 땅에 함부로 들어오지 말라"고 항의했다. 그리고 이규원을 울릉도 검찰사로 보내 섬을 자세히 살피게 했다.'],
    ]);
    await timeJump('1882년 · 조선 고종 때', '울릉도를 살피고 돌아온 검찰사');
    await say('lee', '전하, 울릉도를 두루 살피고 돌아왔습니다.');
    await showDoc({ title: '울릉도 검찰 보고', era: '1882년 · 울릉도 검찰사 이규원이 고종에게 올린 보고',
      lines: ['울릉도에 들어가 산과 바닷가를 두루 살폈습니다.', '일본 사람들이 몰래 들어와 나무를 베어 가고 있었고,\n섬에 자기네 땅이라는 푯말까지 세워 두었습니다.', '섬의 땅이 기름지니, 백성이 들어가 살 만합니다.'] });
    await whyQuestion({ key: 's4_lee', text: '몰래 들어오는 사람들을 막고 섬을 지키려면, 무엇을 더 해야 할까?',
      options: [
        { t: '백성을 보내 섬에 살게 한다.', ok: true },
        { t: '섬을 그대로 비워 둔다.', re: '비어 있는 섬에는 누구든 몰래 들어오기 쉬워. 보고의 마지막 줄을 다시 떠올려 봐.' },
        { t: '섬 둘레에 높은 성벽을 쌓는다.', re: '섬 전체를 성벽으로 두를 수는 없겠지? 보고의 마지막 줄에 단서가 있어.' },
      ] });
    await say('narr', '조선 정부는 1883년부터 백성을 울릉도로 옮겨 살게 하며 섬을 개척했다.');
    await getCard('lee');
    await timeJump('1899년 · 대한제국', '한성의 신문사');
    await say('gaji', '그 뒤 울릉도에는 사람이 늘었어. 1897년에는 나라 이름이 대한제국으로 바뀌었지. 대한제국의 신문에도 울릉도 소식이 실렸대!');
    await showDoc({ title: '『황성신문』 「울릉도사황」', era: '1899년 9월 · 대한제국의 신문',
      lines: ['울진 동쪽 바다에 섬이 하나 있으니 울릉이라 한다.', '그에 딸린 작은 섬이 여럿 있는데,\n그 가운데 우산도와 죽도가 가장 이름났다.'] });
    await say('gaji', '울릉도에 딸린 이름난 섬 두 개… 이 두 이름을 잘 기억해 둬. 곧 암호를 풀 때 쓸 거야!');
    await getCard('hwangseong');
  },
  async () => {
    setBg('bg-stage4'); fogFx(0.15); Sound.play('mystery'); placeSeal(4);
    await timeJump('1900년 · 대한제국 고종 황제', '칙령 반포');
    await talk([
      ['narr', '1900년 10월, 대한제국. 고종 황제의 책상 위에 법령 하나가 놓여 있다.'],
      ['gaji', '대한제국의 법령, 칙령이야! 반포되기 전에 안개가 이름 하나를 암호로 바꿔 놓았대.'],
    ]);
    await showDoc({ title: '대한제국 칙령 제41호', era: '1900년 10월 25일 · 관보에 실린 법령',
      lines: ['제1조  울릉도를 울도라 고쳐 강원도에 딸리게 하고,\n도감을 군수로 고쳐 관제에 넣는다.', '제2조  군청은 태하동에 두고,\n구역은 울릉전도와 죽도, 석도(石島)를 관할한다.'] });
    await talk([
      ['gaji', '"죽도"는 울릉도 바로 옆의 대나무 섬(댓섬)이야. 신문에 나온 이름과 같지?'],
      ['gaji:wow', '그럼 "석도"는? 신문에서 죽도와 함께 나온 섬은 우산도였어. 석도의 암호를 풀어 보자!'],
    ]);
    await placeTiles({
      title: '🔐 암호 해독: "석도"는 어느 섬일까?', key: 's4_cipher', vertical: true,
      prompt: '울릉도 사람들의 말: "저 독섬 가서 미역 좀 따 오드라고!"\n\n그 무렵 울릉도로 건너온 사람들 중에는 전라도 사람이 많았고,\n전라도 사투리로 "돌"을 "독"이라고 해.', doneMsg: '石島 → 돌섬 → 독섬 → 獨島\n석도는 바로 독도였어!',
      slots: [{ label: '칙령에 적힌 이름' }, { label: '한자의 뜻대로 읽으면 (石 = 돌)' }, { label: '울릉도 사람들의 사투리로 읽으면' }, { label: '그 소리를 다시 한자로 적으면' }],
      tiles: [{ t: '石島 (석도)', slot: 0 }, { t: '돌섬', slot: 1 }, { t: '독섬', slot: 2 }, { t: '獨島 (독도)', slot: 3 }],
      hintText: '石은 "돌 석"이야. 돌섬을 사투리로 부르면?\n그리고 그 소리를 한자로 적으면?',
      reveal: '石島 → 돌섬 → 독섬 → 獨島! 석도는 바로 독도였어.',
    });
    unlockName('n_1900');
    await say('gaji:yay', '풀었다! 뜻으로 적으면 석도(石島), 소리로 적으면 독도(獨島). 같은 섬이야!');
    await pressStamp({ title: '📜 칙령 반포', note: '대한제국의 상징인 오얏꽃 도장을 꾹 눌러 칙령을 반포해!', key: 's4_seal',
      doc: '대한제국 칙령 제41호\n제2조  군청은 태하동에 두고,\n구역은 울릉전도와 죽도, 석도를 관할한다.\n광무 4년(1900년) 10월 25일', label: sealSvgFlower(), doneMsg: '칙령이 반포되었다!' });
    await getCard('edict41');
    await talk([
      ['gaji', '대한제국은 1900년, 법령으로 독도를 울도군이 다스리는 섬으로 정했어.'],
      ['gaji', '그래서 지금도 이 칙령이 반포된 10월 25일을 "독도의 날"로 기념하고 있어.'],
    ]);
    await evidenceBoard(4);
    await stageClear(4);
  },
];
