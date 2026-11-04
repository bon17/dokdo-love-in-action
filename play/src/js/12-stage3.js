/* ===== 3단계: 안용복의 담판 ===== */

/* 가지의 "왜?" 질문: 정답을 알려 주지 않고, 틀리면 다시 생각할 거리를 준다. */
async function whyQuestion({ who = 'gaji', text, options, key }) {
  let tries = 0;
  const bad = new Set();
  for (;;) {
    const left = options.map((o, i) => i).filter(i => !bad.has(i));
    const pick = await choose(who, text, left.map(i => options[i].t));
    const o = options[left[pick]];
    if (o.ok) { Sound.sfx('good'); award(key, tries + 1); return tries; }
    tries++; miss(); bad.add(left[pick]);
    await say('gaji', o.re);
  }
}

/* 담판: 설득 게이지를 채운다. */
async function debate(rounds) {
  const bar = el('div', { style: 'position:absolute;left:50%;top:80px;transform:translateX(-50%);width:560px;background:rgba(8,26,48,.88);border-radius:16px;padding:10px 16px;border:2px solid rgba(143,211,255,.4);text-align:center;z-index:3' });
  const fill = el('div', { style: 'height:100%;width:0;background:linear-gradient(90deg,#8fd3ff,#3dd68c);transition:width .6s' });
  bar.append(el('div', { style: 'font:20px var(--ui);margin-bottom:6px', text: '설득 게이지' }),
    el('div', { style: 'height:22px;border-radius:11px;background:rgba(255,255,255,.15);overflow:hidden' }, fill));
  L.scene.append(bar);
  let g = 0;
  for (const r of rounds) {
    let tries = 0; const bad = new Set();
    for (;;) {
      const left = r.opts.map((o, i) => i).filter(i => !bad.has(i));
      const pick = await choose(r.who || 'jp', r.q, left.map(i => r.opts[i].t));
      const o = r.opts[left[pick]];
      if (o.ok) {
        Sound.sfx('good'); award('s3_talk', tries + 1, 100);
        g += 100 / rounds.length; fill.style.width = Math.min(100, g) + '%';
        await say('ahn', o.t);
        if (r.after) await say(r.who || 'jp', r.after);
        break;
      }
      tries++; miss(); bad.add(left[pick]);
      await say('gaji', o.re);
    }
  }
  await sleep(400);
  bar.remove();
}

const STAGE3 = [
  async () => {
    setBg('bg-stage1', 'sepia(.35) saturate(.9)'); fogFx(0.2); Sound.play('mystery'); placeSeal(3);
    await timeJump('1693년 · 조선 숙종 때', '울릉도 앞바다');
    await talk([
      ['narr', '1693년 봄, 울릉도 앞바다. 동래 어부 안용복과 울산 어부 박어둔이 고기를 잡고 있었다.'],
      ['ahn', '올해도 고기가 많구먼! 어이, 어둔이. 저기 배 한 척이 다가오는데?'],
      ['narr', '일본 배였다. 일본 어부들은 이 섬에 오래전부터 고기를 잡으러 왔다며 문서를 흔들었다.'],
      ['fisher', '우리는 막부의 허가를 받고 다케시마에 온 것이오!'],
      ['narr', '실랑이 끝에 일본 어부들은 안용복과 박어둔을 배에 태워 일본으로 데려갔다.'],
      ['ahn', '울릉도는 조선 땅인데, 어찌 우리를 잡아가는 것이오!'],
      ['gaji:wow', '큰일이야! 그런데 저 어부들이 흔들던 문서를 떨어뜨리고 갔어. 같이 읽어 보자.'],
    ]);
    await showDoc({ title: '다케시마 도해면허', era: '1625년 · 에도 막부가 돗토리번을 통해 내린 허가',
      lines: ['호키국 요나고의 무라카와와 오야 두 집안이\n다케시마(竹島)로 배를 보내 고기를 잡겠다고 청하니,\n바다를 건너가는 것(도해)을 허락한다.'] });
    await whyQuestion({ key: 's3_why', text: '잠깐, 이상하지 않아? 자기 나라 섬에 고기 잡으러 가는데 "바다를 건너가도 좋다"는 허가가 왜 필요했을까?',
      options: [
        { t: '그 섬이 일본 땅이 아니라서, 따로 허락을 받아야 했던 거야.', ok: true },
        { t: '고기를 잡으려면 원래 어느 바다에서나 이런 허가가 필요했어.', re: '그럼 일본 안의 섬에 갈 때도 "바다를 건너가는" 허가를 받았을까? 이 문서가 무엇을 허락했는지 다시 읽어 봐.' },
        { t: '허가증이 멋있어 보여서 만든 거야.', re: '하하, 그건 아닐 거야. 나라에서 허가를 내줄 때는 까닭이 있어. 다시 생각해 볼까?' },
      ] });
    await say('gaji', '맞아. 다른 나라에 갈 때 허가가 필요한 것처럼… 이 허가는 오히려 그 섬이 일본 땅이 아니었다는 걸 보여 줘.');
    await getCard('license');
    await talk([
      ['gaji:wow', '잠깐, 알고 있었어? 오늘날 일본은 독도를 "다케시마"라고 부르면서 자기네 땅이라고 주장하고 있어.'],
      ['gaji', '그런데 섬 이름은 시대마다 바뀌어 왔어. 옛날 일본은 섬들을 지금과 다르게 불렀대.'],
      ['gaji', '그럼 1625년 이 문서에 나온 "다케시마"는 어느 섬이었을까? 한자의 뜻을 단서로 풀어 보자!'],
    ]);
    await placeTiles({
      title: '🏷️ 이름표 붙이기: 17세기 일본은 어느 섬을 뭐라고 불렀을까?', key: 's3_names',
      prompt: '竹(죽)은 "대나무", 松(송)은 "소나무"라는 뜻이야.\n섬의 모습을 보고 이름표를 붙여 봐.', doneMsg: '17세기 일본은 울릉도를 다케시마, 독도를 마쓰시마라고 불렀어.',
      slots: [{ label: '🌳 큰 섬\n(높은 산, 대나무와 나무가 우거진 숲)', ph: '울릉도' }, { label: '🪨 작은 바위섬 두 개\n(나무가 거의 없음)', ph: '독도' }],
      slotW: 470,
      tiles: [{ t: '다케시마 (竹島, 대나무 섬)', slot: 0 }, { t: '마쓰시마 (松島, 소나무 섬)', slot: 1 }],
      hintText: '대나무 숲이 우거질 수 있는 섬은 어느 쪽일까?\n바위만 있는 섬에는 대나무가 자라기 어려워.',
      reveal: '대나무가 자라는 큰 섬 울릉도가 다케시마, 바위섬 독도가 마쓰시마였어!',
    });
    unlockName('n_jp17');
    await talk([
      ['gaji', '17세기 일본은 울릉도를 "다케시마", 독도를 "마쓰시마"라고 불렀어. 이름이 헷갈리면 📖 도감의 "이름 도감"을 봐!'],
      ['narr', '안용복이 끌려간 일을 계기로, 조선과 일본 정부는 울릉도가 어느 나라 땅인지를 두고 외교 문서를 주고받으며 다투기 시작했다. 이 다툼을 "울릉도쟁계"라고 부른다.'],
    ]);
    await getCard('ahn');
  },
  async () => {
    setBg('bg-stage3'); fogFx(0.25); Sound.play('mystery'); placeSeal(3);
    await timeJump('1695년 · 일본 에도 막부', '에도(지금의 도쿄) 막부 관청');
    await talk([
      ['narr', '1695년 겨울, 에도(지금의 도쿄)의 막부 관청. 우산호는 몰래 이곳에 숨어들었다.'],
      ['gaji', '막부가 울릉도 문제를 조사하고 있대. 책장과 책상을 살펴보자!'],
    ]);
    const ONSHU = { title: '『은주시청합기』', era: '1667년 · 일본 이즈모번의 관리가 오키섬을 살펴보고 쓴 책',
      lines: ['오키섬에서 서북쪽으로 이틀 낮 하룻밤을 가면\n마쓰시마(독도)가 있고,\n또 하루를 더 가면 다케시마(울릉도)가 있다.', '이 두 섬에서 고려(조선)를 바라보는 것은,\n이즈모에서 오키섬을 바라보는 것과 같다.', '그러므로 일본의 서북쪽 경계는\n이 주(오키)로 한다.'] };
    const LETTER = { title: '막부의 질문과 돗토리번의 답변', era: '1695년 12월 · 가로챈 편지',
      lines: [{ t: '〈막부의 질문〉', head: true }, '다케시마(울릉도)는 언제부터\n이나바·호키(돗토리번)에 속하게 되었는가?', '그 밖에 두 지역에 속한 섬이 있는가?',
        { t: '〈돗토리번의 답변〉', head: true }, '다케시마는 이나바·호키에 속한 섬이 아닙니다.', '다케시마, 마쓰시마(독도)는 물론,\n그 밖에 두 지역에 속한 섬은 없습니다.'] };
    const read = {};
    await explore({
      title: '🔍 관청을 살펴봐!', review: true,
      spots: [
        { x: 1120, y: 330, ico: '📖', label: '책장의 옛 책', run: async () => {
          await showDoc(ONSHU);
          if (read.onshu) return;
          read.onshu = true;
          await say('gaji:wow', '일본 관리가 쓴 책인데… 일본의 서북쪽 경계를 어디까지로 봤는지 읽었어?');
          await getCard('onshu');
        } },
        { x: 640, y: 440, ico: '✉️', label: '책상 위 편지', run: async () => {
          if (read.letter) { await showDoc({ ...LETTER, lines: LETTER.lines.map((l, i) => i === 5 ? { t: l, hl: true } : l) }); return; }
          await say('gaji', '막부가 돗토리번에 보낸 질문과, 돗토리번이 보낸 답장이야. 이 편지가 막부의 결정을 바꿨대!');
          await showDoc({ ...LETTER, key: 's3_letter',
            ask: '이 편지에서 독도에 대해 알 수 있는 문장은\n어느 것일까? 찾아서 눌러 봐!',
            pick: { correct: [5], hint: '17세기 일본은 독도를 무엇이라고 불렀지? 그 이름이 나오는 문장을 찾아봐.',
              wrong: { 4: '이 문장은 다케시마, 곧 울릉도 이야기야.\n마쓰시마가 나오는 문장을 찾아봐.', 1: '이건 막부가 물어본 말이야.\n돗토리번의 대답을 찾아봐.', 2: '이건 막부가 물어본 말이야.\n돗토리번의 대답을 찾아봐.' },
              reveal: '바로 이 문장! 마쓰시마(독도)도 돗토리번의 땅이 아니라고 답했어.' } });
          read.letter = true;
          await say('gaji', '돗토리번은 다케시마(울릉도)도, 마쓰시마(독도)도 자기 번에 속하지 않는다고 답했어. 두 섬 모두 일본 땅이 아니라고 한 거야!');
          await getCard('tottori');
        } },
      ],
    });
    await say('narr', '돗토리번의 답을 받은 막부는 결정을 내리기 시작했다. 그리고 이듬해, 안용복이 다시 바다를 건넌다.');
  },
  async () => {
    setBg('bg-stage3'); fogFx(0); Sound.play('sail'); placeSeal(3);
    await timeJump('1696년 · 조선 숙종 때', '일본 돗토리번');
    await talk([
      ['narr', '1696년 5월, 안용복이 다시 바다를 건너 일본 돗토리번에 왔다. 그는 스스로를 "울릉·우산 두 섬의 감세장"이라 부르며 담판에 나섰다.'],
      ['gaji', '담판에 들어가기 전에, "울릉도쟁계"가 무슨 뜻인지 짚고 가자. "쟁계(爭界)"는 "땅의 경계를 두고 다툰다"는 뜻이야. 爭은 "다툴 쟁", 界는 "경계 계"!'],
      ['gaji', '1693년 안용복이 끌려간 일을 계기로, 조선과 일본 정부는 1699년까지 몇 년 동안 울릉도가 누구 땅인지를 두고 외교 문서를 주고받으며 다퉜어. 이 다툼 전체를 "울릉도쟁계"라고 해.'],
      ['gaji', '지금 안용복이 돗토리번에서 벌이는 담판도 울릉도쟁계 가운데 한 장면이야. 우리가 모은 증거로 안용복을 도와주자! 어떤 말을 하면 좋을지 귓속말로 골라 줘.'],
    ]);
    await debate([
      { q: '조선의 어부가 무슨 일로 바다를 건너왔소?',
        opts: [
          { t: '일본 어부들이 조선 땅 울릉도와 자산도에 함부로 들어와 고기를 잡으니, 이를 따지러 왔소.', ok: true },
          { t: '그냥 일본 구경을 하러 왔소.', re: '안용복이 위험을 무릅쓰고 바다를 건넌 까닭을 떠올려 봐.' },
          { t: '일본 어부들을 혼내 주러 왔소!', re: '화만 내서는 설득할 수 없어. 까닭을 차분히 말해야지.' },
        ] },
      { q: '우리 어부들은 막부의 허가를 받고 다케시마에 갔소. 무엇이 문제란 말이오?',
        opts: [
          { t: '바다를 건너가는 허가가 필요했다는 것부터가, 그 섬이 일본 땅이 아니라는 뜻 아니오?', ok: true },
          { t: '허가가 있었다니 어쩔 수 없구려.', re: '그렇게 물러서면 안 돼! 도해면허가 무엇을 뜻하는지 떠올려 봐.' },
          { t: '그 허가증은 모두 가짜요!', re: '근거 없이 우기면 안개와 다를 게 없어. 허가증이 무엇을 뜻하는지 떠올려 봐.' },
        ] },
      { q: '그렇다면 마쓰시마는 어떻소? 그 작은 섬도 조선 땅이라는 말이오?',
        opts: [
          { t: '자산도(마쓰시마)는 울릉도에 딸린 섬이오. 조선의 기록에도 두 섬이 함께 적혀 있고, 맑은 날엔 울릉도에서 보이오.', ok: true },
          { t: '그 섬은 너무 작아서 상관없소.', re: '작다고 우리 땅이 아닌 건 아니지! 서고에서 되살린 기록을 떠올려 봐.' },
          { t: '글쎄, 그건 잘 모르겠소.', re: '우리는 알고 있잖아! 서고에서 되살린 기록과 전망대에서 본 풍경을 떠올려 봐.' },
        ], after: '…당신의 말은 잘 알겠소. 윗분들께 그대로 전하겠소.' },
    ]);
    await talk([
      ['narr', '담판을 마친 안용복은 조선으로 돌아왔다. 사실 그해 1월, 막부는 이미 일본 사람들이 울릉도로 건너가는 것을 금지해 둔 상태였다.'],
      ['gaji', '막부가 금지한 까닭은… 우리가 가로챈 돗토리번의 답장에 있었지!'],
    ]);
    await getCard('ban');
    await say('gaji:yay', '울릉도쟁계는 이렇게 울릉도가 조선 땅임을 확인하며 마무리됐어. 그리고 그때 일본은 독도도 자기 땅이 아니라고 했지!');
    await evidenceBoard(3);
    await stageClear(3);
  },
];
