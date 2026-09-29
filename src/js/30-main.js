/* ===== 시작 화면, 등록, 오프닝, 진행 ===== */

const STAGE0 = [
  async () => {
    HUD.show(true); setBg('bg-library'); fogFx(0); Sound.play('mystery'); setEra('오늘 · 기산중학교 도서관');
    await talk([
      ['narr', '오늘은 기산중학교 독도 사랑 실천대회가 열리는 날. 이른 아침, 당신은 독도 자료를 찾으러 학교 도서관에 들어섰다.'],
      ['narr', '안내 데스크 위 액자 속 독도가 아침 햇살에 반짝인다. 그런데 그때…'],
    ]);
    setBg('bg-library-fog'); fogFx(1); Sound.sfx('whoosh');
    const fog = el('img', { src: img('fog'), style: 'position:absolute;left:470px;top:110px;width:340px;animation:bob 2.4s infinite;filter:drop-shadow(0 0 20px rgba(170,140,255,.8))' });
    L.scene.append(fog);
    await talk([
      ['narr', '창틈으로 회색 안개가 스며들더니, 책 속 독도 기록이 하나씩 하얗게 지워지기 시작했다!'],
      ['fog', '크크크… 기록이 사라지면 사람들은 독도를 잊게 될 거야. 아무도 기억하지 못하게 해 주지!'],
    ]);
    fog.remove();
    await talk([
      ['gaji:wow', '늦었다! 망각의 안개가 벌써 여기까지 왔어!'],
      ['gaji', '안녕, 나는 가지야. 옛날 독도 바다에 살던 강치들의 기억을 간직하고 있어. 울릉도 사람들은 강치를 "가지"라고도 불렀대.'],
      ['gaji', '너는 오늘부터 독도 타임 패트롤 대원이야! 시간여행 배 "우산호"를 타고 여러 시대로 가서, 사라진 독도의 증거를 되찾아 줘.'],
      ['gaji', '증거를 찾을 때마다 위쪽의 흐린 독도 그림이 조금씩 선명해질 거야. 모은 증거는 📖 도감에서 언제든 다시 볼 수 있어.'],
      ['gaji', '틀려도 괜찮아. 게임이 끝나지는 않아. 대신 꼼꼼히 읽고 생각할수록 점수가 올라가!'],
      ['gaji:yay', '아, 그리고 단계마다 내 친구 강치가 한 마리씩 숨어 있어. 화면 가장자리를 잘 살펴봐! 그럼, 출발!'],
    ]);
    fogFx(0);
  },
];
const STAGES = [STAGE0, STAGE1, STAGE2, STAGE3, STAGE4, STAGE5, STAGE6, STAGE7, STAGE8, ENDING];

async function runGame() {
  S.running = true;
  HUD.build(); HUD.show(true);
  while (S.stage < STAGES.length) {
    const steps = STAGES[S.stage];
    HUD.update();
    while (S.step < steps.length) {
      clearScene(); L.dialog.innerHTML = ''; clearHint();
      if (S.step === 0 && MISSIONS[S.stage]) await missionCard(S.stage);
      await steps[S.step]();
      S.step++; save();
    }
    S.stage++; S.step = 0; save();
  }
  S.running = false; S.finished = true; save();
  await showResult();
}

/* 비밀번호: 1025는 8단계로 바로 가기, 선생님 비밀번호는 교사 모드 */
async function askPasscode() {
  const v = await inputBox('선생님이 알려 준 비밀번호를 입력하세요.', { type: 'tel' });
  if (v == null) return;
  if (v === '1025') {
    if (!S || S.stage >= 8) { toast('이미 마지막 단계예요!'); return; }
    if (!await confirmBox('8단계 "최종 반박 배틀"로 바로 갈까요?\n건너뛴 단계의 증거는 흐린 "빌린 증거"로 쓰여서 점수가 절반이에요.')) return;
    S.skipped = true; S.stage = 8; S.step = 0; save();
    try { sessionStorage.setItem('dokdoTP.auto', '1'); } catch (e) { }
    location.reload();
  } else if (v === String(CFG.teacherCode)) teacherPanel();
  else toast('비밀번호가 맞지 않아요.');
}

function teacherPanel() {
  const box = el('div', { class: 'panel', style: 'width:900px;padding:28px' });
  box.append(el('div', { style: 'font:30px var(--ui);text-align:center;margin-bottom:6px', text: '👩‍🏫 교사 모드' }),
    el('div', { style: 'font:18px var(--body);color:#bcd3ea;text-align:center;margin-bottom:16px', text: '시연용이에요. 교사 모드로 진행한 기록은 랭킹에 보내지 않아요.' }));
  const m = modal(box);
  const grid = el('div', { style: 'display:grid;grid-template-columns:repeat(5,1fr);gap:10px' });
  STAGE_NAMES.forEach((n, i) => grid.append(onTap(el('button', { class: 'btn small blue', text: `${i === 0 ? '' : i === 9 ? '' : i + '. '}${n}` }), () => {
    if (!S) S = newState({ grade: 0, cls: 0, name: '선생님' });
    S.teacher = true; S.stage = i; S.step = 0; S.finished = false; S.submitted = true; save();
    try { sessionStorage.setItem('dokdoTP.auto', '1'); } catch (e) { }
    location.reload();
  })));
  box.append(grid);
  box.append(el('div', { style: 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:18px' },
    onTap(el('button', { class: 'btn small green', text: '모든 증거·단서 받기' }), () => {
      if (!S) S = newState({ grade: 0, cls: 0, name: '선생님' });
      S.teacher = true; S.submitted = true;
      CARDS.forEach(c => { S.cards[c.id] = true; S.boarded[c.id] = c.cat; });
      CLUES.forEach(c => S.clues[c.id] = 'solved'); NAMES.forEach(n => S.names[n.key] = true);
      save(); HUD.update(); toast('모든 증거와 단서를 넣었어요.');
    }),
    el('a', { class: 'btn small', href: 'ranking.html', target: '_blank', rel: 'noopener', style: 'text-decoration:none', text: '🏆 랭킹 보드 열기' }),
    onTap(el('button', { class: 'btn small gray', text: '이 기기 기록 모두 지우기' }), async () => {
      if (!await confirmBox('이 태블릿에 저장된 진행 상황과 최고 기록을 모두 지울까요?')) return;
      for (const k of Object.values(KEY)) store.del(k);
      location.reload();
    })));
  box.append(el('div', { style: 'font:16px var(--body);color:#8fa7c0;text-align:center;margin-top:14px', text: `랭킹 연결: ${Rank.enabled() ? '설정됨 ✓' : '설정 안 됨 (config.js의 rankingUrl을 확인하세요)'} · 보내지 못한 기록 ${Rank.queue.length}건` }));
}

/* 등록: 학년, 반, 이름 */
function registerForm() {
  return new Promise(resolve => {
    const box = el('div', { class: 'panel form' });
    box.append(el('h2', { text: '🪪 대원 등록' }));
    const gRow = el('div', { class: 'row' }, el('div', { class: 'lab', text: '학년' }));
    const cRow = el('div', { class: 'row' }, el('div', { class: 'lab', text: '반' }));
    const cBtns = el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' });
    cRow.append(cBtns);
    const input = el('input', { class: 'nameinput', maxlength: 10, placeholder: '이름을 입력하세요', autocomplete: 'off' });
    const nRow = el('div', { class: 'row' }, el('div', { class: 'lab', text: '이름' }), input);
    const err = el('div', { class: 'err' });
    const ok = el('button', { class: 'btn', text: '등록하기' });
    box.append(gRow, cRow, nRow, err, el('div', { style: 'text-align:center;margin-top:8px' }, ok),
      el('div', { style: 'font:16px var(--body);color:#8fa7c0;text-align:center;margin-top:12px', text: '랭킹에는 이름의 가운데 글자를 가려서 보여 줘요. (예: 김민수 → 김○수)' }));
    const m = modal(box, { closable: false, dim: false });
    m.wrap.style.alignItems = 'flex-start'; m.wrap.style.paddingTop = '40px';
    let grade = 0, cls = 0;
    const gBtns = [1, 2, 3].map(g => { const b = onTap(el('button', { class: 'opt', text: `${g}학년` }), () => { grade = g; cls = 0; drawG(); drawC(); Sound.sfx('tap'); }); gRow.append(b); return b; });
    const drawG = () => gBtns.forEach((b, i) => b.classList.toggle('on', grade === i + 1));
    const drawC = () => {
      cBtns.innerHTML = '';
      if (!grade) { cBtns.append(el('div', { style: 'font:20px var(--body);color:#8fa7c0', text: '먼저 학년을 골라 주세요.' })); return; }
      for (let c = 1; c <= CLASSES[grade]; c++) cBtns.append(onTap(el('button', { class: 'opt' + (cls === c ? ' on' : ''), text: `${c}반` }), () => { cls = c; drawC(); Sound.sfx('tap'); }));
    };
    drawG(); drawC();
    const submit = async () => {
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!grade) return err.textContent = '학년을 골라 주세요.';
      if (!cls) return err.textContent = '반을 골라 주세요.';
      if (!/^[가-힣a-zA-Z ]{2,10}$/.test(name)) return err.textContent = '이름을 2~10자의 한글이나 영문으로 써 주세요.';
      input.blur();
      if (!await confirmBox(`${grade}학년 ${cls}반 ${name} 대원, 맞나요?`, '맞아요', '다시 쓸래요')) return;
      m.close(); resolve({ grade, cls, name });
    };
    onTap(ok, submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  });
}

function startMessage() {
  return new Promise(resolve => {
    const box = el('div', { class: 'panel', style: 'width:960px;padding:36px 46px;text-align:center' });
    box.append(el('div', { style: 'font:24px var(--ui);color:#ffd9a8', text: SCHOOL }),
      el('div', { class: 'msg', style: 'font-size:26px;margin:18px 0 24px;line-height:1.8', text:
        '기산중학교 독도 사랑 실천대회에 온 것을 환영해요!\n오늘은 이 게임으로 독도의 역사와 이야기를 직접 탐험해요.\n4교시에는 여러분이 플레이하며 알게 된 내용을 바탕으로\n문제를 풀게 돼요.\n이야기와 사료를 꼼꼼히 읽고, 모은 증거를 잘 기억해 두세요.\n모은 증거는 언제든 \'증거 도감\'에서 다시 볼 수 있어요.\n그럼, 출발!' }));
    const m = modal(box, { closable: false });
    box.append(onTap(el('button', { class: 'btn', text: '출발!', style: 'font-size:30px;min-height:66px;padding:0 50px' }), () => { Sound.sfx('tap'); m.close(); resolve(); }));
    DEV.solve = () => { m.close(); resolve(); };
  });
}

function titleScreen() {
  return new Promise(resolve => {
    HUD.show(false); setBg('bg-title'); fogFx(0);
    L.scene.innerHTML = '';
    const wrap = el('div', { class: 'title-wrap' });
    wrap.append(el('div', { class: 'school', text: SCHOOL }), el('div', { class: 'gtitle', text: '독도 타임 패트롤' }), el('div', { class: 'gsub', text: '사라진 기록을 찾아라' }));
    const btns = el('div', { class: 'title-btns' });
    const sv = loadSave();
    const go = v => { Sound.init(); Sound.sfx('tap'); L.scene.innerHTML = ''; resolve(v); };
    if (sv && !sv.finished) {
      const p = sv.player;
      btns.append(onTap(el('button', { class: 'btn', style: 'font-size:28px;min-height:70px', text: `▶ 이어하기 (${p.grade ? `${p.grade}학년 ${p.cls}반 ${p.name}` : p.name} · ${STAGE_NAMES[sv.stage] || ''})` }), () => go('continue')));
      btns.append(onTap(el('button', { class: 'btn gray', text: '새로 시작' }), async () => { if (await confirmBox('다른 친구가 새로 시작할까요?\n이 태블릿에 저장된 진행 상황은 지워져요.')) go('new'); }));
    } else if (sv && sv.finished) {
      btns.append(onTap(el('button', { class: 'btn', style: 'font-size:28px;min-height:70px', text: '🏆 결과 보기' }), () => go('result')));
      btns.append(onTap(el('button', { class: 'btn blue', text: '🔄 다시 도전' }), () => go('retry')));
      btns.append(onTap(el('button', { class: 'btn gray', text: '새로 시작' }), async () => { if (await confirmBox('다른 친구가 새로 시작할까요?')) go('new'); }));
    } else btns.append(onTap(el('button', { class: 'btn pulse', style: 'font-size:34px;min-height:78px;padding:0 60px', text: '시작하기' }), () => go('new')));
    wrap.append(btns);
    const corner = el('div', { class: 'corner' },
      onTap(el('button', { class: 'hud-btn', text: '⛶', title: '전체 화면' }), toggleFullscreen),
      onTap(el('button', { class: 'hud-btn', text: PREF.muted ? '🔇' : '🔊' }), e => { Sound.init(); Sound.setMuted(!PREF.muted); e.target.textContent = PREF.muted ? '🔇' : '🔊'; }),
      onTap(el('button', { class: 'hud-btn book', text: '선생님' }), async () => {
        const v = await inputBox('교사용 비밀번호를 입력하세요.', { type: 'tel' });
        if (v === String(CFG.teacherCode)) teacherPanel(); else if (v != null) toast('비밀번호가 맞지 않아요.');
      }));
    wrap.append(corner);
    L.scene.append(wrap);
    DEV.solve = () => go(sv && !sv.finished ? 'continue' : 'new');
  });
}

async function boot() {
  fit();
  try { if (document.fonts) await Promise.race([document.fonts.load('24px RIDIBatang'), sleep(3000)]); } catch (e) { }
  document.getElementById('boot').remove();
  let auto = false;
  try { auto = sessionStorage.getItem('dokdoTP.auto') === '1'; sessionStorage.removeItem('dokdoTP.auto'); } catch (e) { }
  const sv = loadSave();
  if (auto && sv) { S = sv; Sound.play(S.stage >= 8 ? 'boss' : 'sail'); return runGame(); }
  const choice = await titleScreen();
  if (choice === 'continue') { S = loadSave(); return runGame(); }
  if (choice === 'result') { S = loadSave(); HUD.build(); return showResult(); }
  if (choice === 'retry') { S = loadSave(); return retry(); }
  store.del(KEY.save);
  const player = await registerForm();
  S = newState(player); save();
  HUD.build(); HUD.show(false);
  await startMessage();
  await runGame();
}
window.addEventListener('error', e => { try { console.error(e.error || e.message); } catch (er) { } });
boot();
