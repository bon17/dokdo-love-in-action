/* ===== 8단계: 최종 반박 배틀 ===== */

function briefing() {
  return new Promise(resolve => {
    const slides = [
      { t: '작전 브리핑 ① 지금의 갈등', body: [
        '일본 정부는 독도를 "다케시마"라고 부르며 자기네 땅이라고 주장해요.',
        '정부 문서와 일부 교과서에도 이런 주장을 싣고 있어요.',
        '시마네현은 2005년부터 2월 22일을 "다케시마의 날"로 정해 행사를 열어요. 1905년에 시마네현 고시가 나온 바로 그날이에요.'] },
      { t: '작전 브리핑 ② 우리 정부의 입장', quote: '독도는 역사적·지리적·국제법적으로 명백한 대한민국 고유의 영토입니다. 독도에 대한 영유권 분쟁은 존재하지 않으며, 독도는 외교 교섭이나 사법적 해결의 대상이 될 수 없습니다.', body: [
        '누군가 억지로 우긴다고 해서, 우리가 다스리는 우리 땅이 "주인을 다투는 땅"이 되지는 않아요.',
        '대한민국은 지금 독도를 실제로 다스리고 있어요. 7단계에서 본 경비대, 주민, 시설, 법이 그 모습이에요.'] },
      { t: '작전 브리핑 ③ 국제사법재판소 제안', body: [
        '일본은 1954년, 1962년, 2012년에 국제사법재판소(ICJ)에 가서 판단을 받자고 제안했어요.',
        '우리 정부는 받아들이지 않아요. 분명한 우리 땅을 재판에 맡길 까닭이 없고, 재판에 응하는 것 자체가 독도를 "다툼이 있는 땅"처럼 보이게 만들기 때문이에요.',
        '토론에서는 화를 내거나 상대를 깎아내리지 않고, 근거로 차분하게 말하는 것이 가장 강한 힘이에요.'] },
    ];
    const box = el('div', { class: 'panel', style: 'width:1000px;min-height:470px;padding:30px 40px;position:relative' });
    const m = modal(box, { closable: false });
    let i = 0;
    const render = () => {
      const s = slides[i];
      box.innerHTML = '';
      box.append(el('div', { style: 'font:32px var(--ui);color:#ffd9a8;margin-bottom:14px', text: s.t }));
      if (s.quote) box.append(el('div', { style: 'font:23px/1.7 var(--old);background:rgba(255,255,255,.1);border-left:6px solid var(--orange);padding:14px 20px;border-radius:10px;margin-bottom:14px', text: s.quote }));
      for (const b of s.body) box.append(el('div', { class: 'msg', style: 'font-size:23px;margin:8px 0', text: '• ' + b }));
      box.append(el('div', { style: 'position:absolute;left:40px;bottom:24px;font:20px var(--ui);color:#8fa7c0', text: `${i + 1} / ${slides.length}` }));
      box.append(el('div', { style: 'position:absolute;right:30px;bottom:20px' }, onTap(el('button', { class: 'btn', text: i < slides.length - 1 ? '다음 ▶' : '작전 개시!' }), () => {
        Sound.sfx('tap'); i++; if (i < slides.length) render(); else { m.close(); resolve(); }
      })));
    };
    render();
    DEV.solve = () => { m.close(); resolve(); };
  });
}

/* 카드 배틀: 안개의 주장마다, 내가 모은 증거 카드로 반박한다. */
function cardBattle() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:64px 0 0 0' });
    L.scene.append(root);
    const bossWrap = el('div', { style: 'position:absolute;left:50%;top:6px;transform:translateX(-50%);text-align:center;width:900px' });
    const bossImg = el('img', { src: img('fog'), style: 'width:170px;animation:bob 2.6s infinite;filter:drop-shadow(0 0 18px rgba(170,140,255,.7))' });
    const hp = el('div', { style: 'display:flex;gap:6px;justify-content:center;margin:2px 0 8px' });
    const hpSeg = CLAIMS.map(() => { const s = el('div', { style: 'width:70px;height:16px;border-radius:8px;background:#9b7bff;box-shadow:0 0 8px #9b7bff' }); hp.append(s); return s; });
    const bubble = el('div', { style: 'font:30px var(--ui);background:rgba(60,40,110,.92);border:3px solid #b9a2ff;border-radius:22px;padding:14px 24px;display:inline-block;max-width:900px' });
    bossWrap.append(bossImg, hp, bubble);
    const tbar = el('div', { style: 'position:absolute;left:340px;right:340px;top:318px;height:12px;border-radius:6px;background:rgba(255,255,255,.15);overflow:hidden' });
    const tfill = el('div', { style: 'height:100%;width:100%;background:linear-gradient(90deg,#ffd166,#ff6b3d)' });
    tbar.append(tfill);
    const hearts = el('div', { style: 'position:absolute;left:24px;top:24px;font:30px sans-serif;background:rgba(8,26,48,.85);padding:6px 14px;border-radius:14px' });
    const combo = el('div', { style: 'position:absolute;right:24px;top:24px;font:24px var(--ui);background:rgba(8,26,48,.85);padding:8px 16px;border-radius:14px;color:#ffb37a' });
    const hand = el('div', { style: 'position:absolute;left:0;right:0;top:344px;display:flex;gap:14px;justify-content:center' });
    const bar = el('div', { style: 'position:absolute;left:0;right:0;bottom:12px;display:flex;gap:16px;justify-content:center;align-items:center' });
    const readBtn = el('button', { class: 'btn blue', text: '🔍 카드 읽기', disabled: true });
    const hitBtn = el('button', { class: 'btn', text: '⚔️ 이 증거로 반박!', disabled: true, style: 'font-size:30px;min-height:66px' });
    const tip = el('div', { style: 'font:19px var(--body);color:#dfe9f5;max-width:420px', text: '카드를 골라 "카드 읽기"로 내용을 확인한 뒤 반박해!' });
    bar.append(tip, readBtn, hitBtn);
    root.append(bossWrap, tbar, hearts, combo, hand, bar);
    let life = 3, ci = 0, sel = null, tries = 0, t0 = 0, raf, busy = false, perfect = true, combo2 = 0;
    const drawHearts = () => { hearts.textContent = '❤️'.repeat(life) + '🤍'.repeat(3 - life); };
    const drawCombo = () => { combo.textContent = combo2 >= 2 ? `반박 콤보 ×${combo2}` : '반박 콤보'; };
    drawHearts(); drawCombo();
    const makeHand = claim => {
      const goods = claim.good.filter(id => hasCard(id));
      const goodPick = (goods.length ? shuffle(goods).slice(0, 2) : shuffle(claim.good).slice(0, 2));
      const others = shuffle(CARDS.map(c => c.id).filter(id => !claim.good.includes(id)));
      const ownedOthers = others.filter(hasCard), rest = others.filter(id => !hasCard(id));
      const fill = [...ownedOthers, ...rest].slice(0, 6 - goodPick.length);
      return shuffle([...goodPick, ...fill]);
    };
    const pickCard = (ce, id) => {
      if (busy) return;
      Sound.sfx('tap');
      hand.querySelectorAll('.card').forEach(x => x.classList.remove('sel'));
      ce.classList.add('sel'); sel = id; readBtn.disabled = false; hitBtn.disabled = false;
    };
    const next = () => {
      if (ci >= CLAIMS.length) return win();
      const claim = CLAIMS[ci];
      tries = 0; sel = null; readBtn.disabled = true; hitBtn.disabled = true;
      bubble.textContent = `"${claim.text}"`; bubble.classList.remove('popin'); void bubble.offsetWidth; bubble.classList.add('popin');
      hand.innerHTML = '';
      for (const id of makeHand(claim)) {
        const ce = cardEl(CARD[id], { mini: true, borrowed: !hasCard(id) });
        ce.style.cursor = 'pointer'; ce.style.transition = 'transform .15s';
        ce.dataset.id = id;
        onTap(ce, () => pickCard(ce, id));
        hand.append(ce);
      }
      t0 = performance.now();
      cancelAnimationFrame(raf);
      const tick = () => {
        const p = Math.max(0, 1 - (performance.now() - t0) / 30000);
        tfill.style.width = (p * 100) + '%';
        if (p <= 0 && !busy) { timeUp(); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      DEV.solve = () => { const g = hand.querySelector('.card'); const id = CLAIMS[ci].good.find(x => hand.querySelector(`[data-id="${x}"]`)); const ce = hand.querySelector(`[data-id="${id}"]`); pickCard(ce, id); hitBtn.click(); };
    };
    const hiliteGood = () => {
      const claim = CLAIMS[ci];
      hand.querySelectorAll('.card').forEach(ce => { if (claim.good.includes(ce.dataset.id)) { ce.style.boxShadow = '0 0 0 6px #3dd68c, 0 0 30px #3dd68c'; ce.classList.add('pulse'); } });
    };
    const timeUp = () => {
      perfect = false; combo2 = 0; drawCombo();
      hint('시간이 다 됐어! 괜찮아, 같이 찾아보자. 빛나는 카드를 골라 봐.', 'gaji', 5000);
      tries = Math.max(tries, 3); hiliteGood();
    };
    onTap(readBtn, () => { if (sel) openCard(CARD[sel], !hasCard(sel)); });
    onTap(hitBtn, async () => {
      if (!sel || busy || ci >= CLAIMS.length) return;
      const claim = CLAIMS[ci], id = sel;
      if (claim.good.includes(id)) {
        busy = true; cancelAnimationFrame(raf); DEV.solve = null;
        const secs = (performance.now() - t0) / 1000;
        const ce = hand.querySelector(`[data-id="${id}"]`);
        if (ce) { ce.style.transition = 'transform .45s ease-in'; ce.style.transform = 'translate(0,-300px) scale(.4) rotate(20deg)'; }
        await sleep(420);
        Sound.sfx('hit'); bossImg.classList.remove('shake'); void bossImg.offsetWidth; bossImg.classList.add('shake');
        hpSeg[ci].style.background = 'rgba(255,255,255,.15)'; hpSeg[ci].style.boxShadow = 'none';
        let pts = [150, 90, 40, 15][Math.min(tries, 3)];
        if (!hasCard(id)) pts = Math.round(pts / 2);
        if (tries === 0) { combo2++; pts += Math.max(0, Math.round(30 - secs)) + Math.min(combo2 - 1, 4) * 15; S.combo++; S.maxCombo = Math.max(S.maxCombo, S.combo); }
        else { combo2 = 0; }
        drawCombo();
        addScore(pts, 640, 260);
        bubble.textContent = '💬 ' + claim.reply;
        bubble.style.background = 'rgba(30,110,70,.92)'; bubble.style.borderColor = '#7fe0a8';
        await sleep(3200);
        bubble.style.background = ''; bubble.style.borderColor = '';
        busy = false; ci++; next();
      } else {
        tries++; perfect = false; combo2 = 0; drawCombo(); miss();
        bossImg.style.transform = 'scale(1.15)'; setTimeout(() => bossImg.style.transform = '', 250);
        root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
        life--; drawHearts();
        if (life <= 0) {
          hint('안개에 휩싸였어! 잠깐 숨 고르고… 기억력을 되찾자!', 'wow', 3000);
          addScore(-50, 640, 330); life = 3; setTimeout(drawHearts, 900);
        }
        if (tries === 1) hint('그 증거로는 이 주장을 무너뜨리기 어려워. 주장의 어느 부분이 틀렸는지 다시 생각해 봐!', 'gaji', 5000);
        else if (tries === 2) hint(claim.hint, 'gaji', 7000);
        else { hint('같이 찾아보자! 빛나는 카드가 이 주장을 반박할 수 있어.', 'gaji', 5000); hiliteGood(); }
      }
    });
    const win = async () => {
      cancelAnimationFrame(raf); DEV.solve = null; busy = true;
      readBtn.disabled = true; hitBtn.disabled = true; hand.innerHTML = '';
      if (perfect) giveBadge('debate');
      bubble.textContent = '크아아… 근거 앞에서는… 버틸 수가… 없어…';
      bossImg.style.transition = 'opacity 2s, transform 2s'; bossImg.style.opacity = 0; bossImg.style.transform = 'scale(1.8)';
      Sound.sfx('clear');
      await sleep(2200);
      root.remove(); resolve();
    };
    next();
  });
}

const STAGE8 = [
  async () => {
    setBg('bg-stage8'); fogFx(0.6); Sound.play('boss'); placeSeal(8);
    await talk([
      ['narr', '마지막으로 도착한 곳은 세계 여러 나라 사람들이 모이는 국제 토론장. 무대 위로 망각의 안개가 모여든다.'],
      ['fog', '크크크… 기록을 되찾았다고? 하지만 사람들은 내 말을 더 오래 기억할걸!'],
      ['gaji:wow', '알겠다… 안개의 정체는 "근거 없는 주장"이었어! 근거 없이 되풀이되는 말이 사람들의 기억을 흐리게 만든 거야.'],
      ['gaji', '결전 전에 작전 브리핑부터 하자. 지금 독도를 둘러싼 갈등이 어떤 모습인지 알아야 해.'],
    ]);
    await briefing();
    await whyQuestion({ key: 's8_brief', text: '"영유권 분쟁은 존재하지 않는다"는 말, 어떤 뜻일까?',
      options: [
        { t: '누군가 억지로 우겨도, 우리가 다스리는 분명한 우리 땅이라 다툴 거리가 아니라는 뜻', ok: true },
        { t: '독도에 대해 아무도 아무 말도 하지 않는다는 뜻', re: '일본 정부는 계속 주장하고 있어. 그런데도 "분쟁이 없다"고 하는 까닭은 뭘까? 브리핑 ②를 떠올려 봐.' },
        { t: '독도 문제를 모른 척하자는 뜻', re: '우리 정부는 잘못된 주장에 분명하게 대응해. 그래도 "분쟁이 없다"고 하는 까닭은 뭘까?' },
      ] });
    await talk([
      ['gaji', '좋아. 이제 안개가 일본 정부의 주장 일곱 가지를 쏟아 낼 거야.'],
      ['gaji', '우리가 모은 증거 카드 중에서 그 주장을 무너뜨릴 카드를 골라 반박하자! 못 모은 카드는 흐린 "빌린 증거"로 나와서 점수가 절반이야.'],
    ]);
  },
  async () => {
    setBg('bg-stage8'); fogFx(0.5); Sound.play('boss'); placeSeal(8);
    await cardBattle();
    fogFx(0);
  },
];
