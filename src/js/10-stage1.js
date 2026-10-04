/* ===== 1단계: 독도를 찾아라 ===== */

/* 우산호 라디오: 다이얼을 돌려 노래 속 단서를 수신한다. */
function radioGame() {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1120px;padding:22px 28px;text-align:center' });
    root.append(el('div', { style: 'font:32px var(--ui)', text: '📻 우산호 라디오' }),
      el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin:4px 0 12px', text: '다이얼을 좌우로 움직여 반짝이는 주파수에 맞추면, 노래 속 단서가 들려와!' }));
    const radio = el('div', { style: 'position:relative;margin:0 auto;width:1000px;height:330px;border-radius:30px;background:linear-gradient(180deg,#b5733c,#8a5227);box-shadow:inset 0 0 0 8px #6b3d1c,0 10px 24px rgba(0,0,0,.4)' });
    const screen = el('div', { style: 'position:absolute;left:40px;right:40px;top:30px;height:120px;border-radius:16px;background:#10281c;border:4px solid #2c1a0c;display:flex;align-items:center;justify-content:center;font:30px var(--ui);color:#8dffb8;text-shadow:0 0 10px #3dff8a;padding:0 20px' });
    const scale = el('div', { style: 'position:absolute;left:60px;right:60px;top:175px;height:90px;border-radius:14px;background:#f3e2b8;border:4px solid #2c1a0c;touch-action:none;cursor:ew-resize;overflow:hidden' });
    for (let i = 0; i <= 20; i++) scale.append(el('div', { style: `position:absolute;left:${i * 5}%;top:0;width:2px;height:${i % 5 ? 18 : 30}px;background:#5b3a1c` }));
    for (let i = 0; i <= 4; i++) scale.append(el('div', { style: `position:absolute;left:calc(${i * 25}% - 20px);top:32px;width:40px;text-align:center;font:16px var(--ui);color:#5b3a1c`, text: 88 + i * 5 }));
    const needle = el('div', { style: 'position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#e0322b;box-shadow:0 0 8px #e0322b;pointer-events:none' });
    scale.append(needle);
    const knob = el('div', { style: 'position:absolute;left:50%;bottom:14px;margin-left:-26px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3,#3a2512);border:3px solid #2c1a0c' });
    radio.append(screen, scale, knob);
    const counter = el('div', { style: 'font:22px var(--ui);margin:12px 0 6px;color:#ffd9a8' });
    const btns = el('div', { style: 'display:flex;gap:16px;justify-content:center;margin-top:8px' });
    const replay = el('a', { class: 'btn blue small', href: SONG_URL, target: '_blank', rel: 'noopener', text: '▶ 노래 다시 듣기 (유튜브)', style: 'text-decoration:none' });
    const doneBtn = el('button', { class: 'btn', text: '단서 수신 완료!', disabled: true });
    btns.append(replay, doneBtn);
    root.append(radio, counter, btns,
      el('div', { style: 'font:16px var(--body);color:#8fa7c0;margin-top:8px', text: '다시 듣기를 누르면 새 창에서 노래가 열려요. 이어폰이 없으니 소리를 작게 해 주세요.' }));
    const m = modal(root, { closable: false });
    const pos = CLUES.map((c, i) => 0.06 + i * (0.88 / (CLUES.length - 1)) + (i % 2 ? 0.012 : -0.01));
    const dots = pos.map((p, i) => { const d = el('div', { style: `position:absolute;left:${p * 100}%;top:58px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#ffb347;box-shadow:0 0 10px #ffb347;animation:pulse 1.2s infinite` }); scale.append(d); return d; });
    let v = 0.5, lockT = 0, found = 0;
    const noise = Sound.staticNoise();
    CLUES.forEach((c, i) => { if (S.clues[c.id]) { found++; dots[i].style.background = '#3dd68c'; dots[i].style.animation = 'none'; } });
    const upd = () => {
      needle.style.left = (v * 100) + '%';
      knob.style.transform = `rotate(${(v - 0.5) * 540}deg)`;
      let best = -1, bd = 1;
      pos.forEach((p, i) => { const d = Math.abs(p - v); if (d < bd) { bd = d; best = i; } });
      const sig = Math.max(0, 1 - bd / 0.03);
      noise.set(1 - sig * 0.9);
      const c = CLUES[best];
      if (sig > 0.05) {
        screen.style.opacity = 0.3 + sig * 0.7;
        screen.textContent = sig > 0.6 ? `♪ ${c.radio} ♪` : '…지직… ' + c.radio.replace(/[^\s·…]/g, m => Math.random() < 0.5 ? '▒' : m) + ' …지직…';
      } else { screen.style.opacity = 0.5; screen.textContent = '지지직… 지직…'; }
      if (sig > 0.72 && !S.clues[c.id]) {
        if (!lockT) lockT = performance.now();
        else if (performance.now() - lockT > 350) {
          S.clues[c.id] = 'found'; found++; lockT = 0;
          dots[best].style.background = '#3dd68c'; dots[best].style.animation = 'none';
          Sound.sfx('ping'); addScore(10, 640, 330);
          screen.textContent = `📻 수신 완료! "${c.radio}"`;
        }
      } else lockT = 0;
      counter.textContent = `받은 노래 단서 ${found} / ${CLUES.length}`;
      if (found >= CLUES.length) doneBtn.disabled = false;
    };
    let drag = false;
    const setFrom = e => { const r = scale.getBoundingClientRect(); v = clamp((e.clientX - r.left) / r.width, 0, 1); upd(); };
    scale.addEventListener('pointerdown', e => { drag = true; scale.setPointerCapture(e.pointerId); setFrom(e); });
    scale.addEventListener('pointermove', e => { if (drag) setFrom(e); });
    scale.addEventListener('pointerup', () => { drag = false; });
    const tick = setInterval(upd, 120);
    upd();
    const finish = () => { clearInterval(tick); noise.stop(); DEV.solve = null; m.close(); resolve(); };
    onTap(doneBtn, finish);
    DEV.solve = () => { CLUES.forEach(c => { if (!S.clues[c.id]) S.clues[c.id] = 'found'; }); addScore(80); finish(); };
  });
}

/* 울릉도 전망대 망원경: 맑아지는 순간 동남쪽 바다의 섬을 찾는다. */
function quadName(b) {
  b = ((b % 360) + 360) % 360;
  for (const [c, n] of [[0, '북쪽'], [90, '동쪽'], [180, '남쪽'], [270, '서쪽'], [360, '북쪽']]) if (Math.abs(b - c) <= 10) return n;
  return b < 90 ? '북동쪽' : b < 180 ? '동남쪽' : b < 270 ? '남서쪽' : '북서쪽';
}
function telescopeGame() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0;background:#07121f' });
    L.scene.append(root);
    HINT.pos = 'top';
    root.append(el('div', { class: 'mg-title', text: '🔭 울릉도 전망대: 바다 저편의 섬을 찾아봐!' }));
    const VW = 1000, VH = 470, PPD = 16;
    const cv = el('canvas', { width: VW, height: VH, style: `position:absolute;left:140px;top:130px;border-radius:235px/200px;border:10px solid #2a3b50;box-shadow:0 0 0 2000px rgba(4,10,18,.75);touch-action:none;cursor:grab` });
    const read = el('div', { style: 'position:absolute;left:0;right:0;top:626px;text-align:center;font:25px var(--ui);color:#dfe9f5' });
    const guide = el('div', { style: 'position:absolute;left:0;right:0;top:672px;text-align:center;font:20px var(--ui);color:#ffd9a8', text: '👆 화면을 좌우로 끌거나 ◀ ▶ 버튼을 눌러 망원경을 돌려 봐. 맑을 때 섬이 보이면 그 섬을 눌러!' });
    let turn = 0;
    const turnBtn = (dir, x) => {
      const b = el('button', { class: 'btn blue', text: dir < 0 ? '◀' : '▶', style: `position:absolute;left:${x}px;top:330px;width:84px;height:84px;font-size:36px;padding:0;touch-action:none` });
      b.addEventListener('pointerdown', e => { e.preventDefault(); turn = dir; moved = true; });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { turn = 0; });
      return b;
    };
    root.append(cv, read, guide, turnBtn(-1, 28), turnBtn(1, 1168));
    const g = cv.getContext('2d');
    let view = 0, t0 = performance.now(), raf, found = false, tries = 0, lastT = t0, moved = false, level = 0, sawIt = false, helping = false;
    const DOKDO = 110, clouds = Array.from({ length: 14 }, () => ({ b: Math.random() * 360, y: 30 + Math.random() * 120, w: 80 + Math.random() * 160, s: 0.2 + Math.random() * 0.5 }));
    const haze = t => { const ph = (t / 1000) % 7; return ph < 2.6 ? 0.08 : ph < 3.3 ? 0.08 + (ph - 2.6) / 0.7 * 0.8 : ph > 6.3 ? 0.88 - (ph - 6.3) / 0.7 * 0.8 : 0.88; };
    const sx = b => { let d = ((b - view + 540) % 360) - 180; return VW / 2 + d * PPD; };
    const draw = now => {
      const hz = haze(now - t0);
      const sky = g.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, '#6db3ea'); sky.addColorStop(1, '#cfe8f7');
      g.fillStyle = sky; g.fillRect(0, 0, VW, 262);
      const sea = g.createLinearGradient(0, 262, 0, VH); sea.addColorStop(0, '#2d7fb9'); sea.addColorStop(1, '#0f4d7d');
      g.fillStyle = sea; g.fillRect(0, 262, VW, VH - 262);
      g.fillStyle = 'rgba(255,255,255,.8)';
      for (const c of clouds) { c.b += c.s * 0.02; const x = sx(c.b); if (x < -200 || x > VW + 200) continue; g.beginPath(); g.ellipse(x, c.y, c.w, c.w * 0.28, 0, 0, 7); g.fill(); }
      // 육지의 산줄기 (서쪽)
      const mx = sx(268);
      if (mx > -500 && mx < VW + 500) { g.fillStyle = `rgba(90,110,130,${0.35 * (1 - hz)})`; g.beginPath(); g.moveTo(mx - 420, 262); for (let i = 0; i <= 12; i++) g.lineTo(mx - 420 + i * 70, 262 - 10 - Math.sin(i * 1.7) * 8 - (i % 3) * 5); g.lineTo(mx + 420, 262); g.fill(); }
      // 독도
      const dx = sx(DOKDO);
      if (dx > -100 && dx < VW + 100) {
        g.fillStyle = `rgba(60,80,95,${Math.max(0.2, 1 - hz * 1.15)})`;
        g.beginPath(); g.moveTo(dx - 44, 262); g.lineTo(dx - 30, 246); g.lineTo(dx - 22, 232); g.lineTo(dx - 12, 248); g.lineTo(dx - 6, 262); g.fill();
        g.beginPath(); g.moveTo(dx + 2, 262); g.lineTo(dx + 12, 250); g.lineTo(dx + 22, 240); g.lineTo(dx + 34, 252); g.lineTo(dx + 42, 262); g.fill();
      }
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const y = 280 + i * 16, off = ((now / 30) + i * 40) % 80; g.beginPath(); for (let x = -off; x < VW; x += 80) { g.moveTo(x, y); g.lineTo(x + 30, y); } g.stroke(); }
      g.fillStyle = `rgba(225,232,240,${hz})`; g.fillRect(0, 0, VW, VH);
      // 나침반 띠
      g.fillStyle = 'rgba(6,20,37,.75)'; g.fillRect(0, 0, VW, 50);
      g.fillStyle = '#fff'; g.font = '20px RIDIBatang, serif'; g.textAlign = 'center';
      const LAB = { 0: '북', 45: '북동', 90: '동', 135: '남동', 180: '남', 225: '남서', 270: '서', 315: '북서' };
      for (let b = 0; b < 360; b += 5) {
        const x = sx(b); if (x < 0 || x > VW) continue;
        g.fillRect(x - 1, 0, 2, b % 45 ? 8 : 16);
        if (LAB[b] != null) g.fillText(LAB[b], x, 40);
      }
      g.strokeStyle = '#ff8a3d'; g.lineWidth = 3; g.beginPath(); g.moveTo(VW / 2, 50); g.lineTo(VW / 2, VH); g.stroke();
      if (helping || found) {
        g.strokeStyle = `rgba(255,209,102,${0.6 + 0.4 * Math.sin(now / 180)})`; g.lineWidth = 5;
        g.beginPath(); g.arc(dx, 250, 62, 0, 7); g.stroke();
      }
      read.textContent = `보는 방향: ${quadName(view)} (${Math.round((view + 360) % 360)}°) · ${hz < 0.4 ? '☀ 지금은 맑아요!' : '🌫 뿌옇게 흐려요… 잠깐 기다려 볼까?'}`;
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      if (turn && !found) view = (view + turn * 40 * dt + 360) % 360;
      if (!found) {
        const el2 = (now - t0) / 1000;
        const onScreen = Math.abs(((DOKDO - view + 540) % 360) - 180) < 28;
        if (!moved && el2 > 8 && level < 1) { level = 1; hint('화면을 손가락으로 좌우로 끌면 망원경이 돌아가! ◀ ▶ 버튼을 눌러도 돼.', 'gaji', 6000); }
        if (onScreen && !sawIt) { sawIt = true; hint(hz < 0.45 ? '어? 저기 바위섬 같은 게 보여! 눌러 봐!' : '어? 저쪽에 뭔가 희미하게 보여… 맑아질 때까지 기다려 봐!', 'wow', 5000); }
        if (el2 > 20 && level < 2) { level = 2; hint('「독도는 우리 땅」 노래를 떠올려 봐! 울릉도에서 어느 쪽 뱃길을 따라가라고 했지?\n(📖 도감의 노래 단서 수첩에도 적혀 있어.)', 'gaji', 8000); }
        if (el2 > 40 && level < 3) { level = 3; hint('나침반 띠에서 "동"과 "남동" 사이를 천천히 살펴봐!', 'gaji', 7000); }
        if (el2 > 60 && level < 4) {
          level = 4; helping = true; miss();
          hint('같이 찾아보자! 반짝이는 동그라미 안에 섬이 있어. 맑아지면 눌러 봐!', 'gaji', 8000);
        }
        if (helping) view += (((DOKDO - view + 540) % 360) - 180) * Math.min(1, dt * 3);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    let drag = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, v: view, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag || helping) return; const d = (e.clientX - drag.x) / SCALE; if (Math.abs(d) > 6) { drag.moved = true; moved = true; } view = (drag.v - d / PPD + 360) % 360; });
    cv.addEventListener('pointerup', e => {
      const d = drag; drag = null;
      if (!d || d.moved || found) return;
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / SCALE;
      const b = (view + (x - VW / 2) / PPD + 360) % 360;
      const near = Math.abs(((b - DOKDO + 540) % 360) - 180) < 4.5;
      const hz = haze(performance.now() - t0);
      if (near && hz < 0.45) return win();
      if (near) { hint('저기 뭔가 있는 것 같은데… 흐려서 잘 안 보여. 맑아질 때 다시 눌러 봐!', 'wow'); return; }
      if (Math.abs(((b - 268 + 540) % 360) - 180) < 20 && hz < 0.5) { hint('저건 멀리 보이는 육지의 산줄기야. 섬은 아니야!', 'gaji', 4000); return; }
      tries++;
      if (tries % 3 === 0) hint('바다만 보여. 망원경을 끌어서 다른 방향도 살펴봐!', 'gaji', 4000);
    });
    const win = () => {
      found = true; DEV.solve = null; Sound.sfx('good');
      award('s1_scope', helping ? 3 : level >= 3 || tries > 5 ? 2 : 1);
      view = DOKDO; guide.textContent = '🎉 찾았다! 울릉도에서 보이는 바위섬!';
      setTimeout(() => { cancelAnimationFrame(raf); HINT.pos = 'left'; root.remove(); resolve(); }, 1200);
    };
    DEV.solve = win;
  });
}

/* 안개 바다 항해 */
const GEO = { LON0: 128.9, LAT1: 38.3, KX: 88.9, KY: 111, Z: 6 };
const gx = lon => (lon - GEO.LON0) * GEO.KX * GEO.Z;
const gy = lat => (GEO.LAT1 - lat) * GEO.KY * GEO.Z;
const WORLD = { w: gx(133.6), h: gy(35.45) };
const LAND = {
  korea: [[128.9, 37.86], [128.95, 37.77], [129.06, 37.68], [129.12, 37.52], [129.17, 37.44], [129.26, 37.3], [129.34, 37.17], [129.42, 37.06], [129.4, 36.95], [129.45, 36.68], [129.41, 36.41], [129.47, 36.25], [129.57, 36.08], [129.42, 35.98], [129.46, 35.8], [129.45, 35.45], [128.9, 35.45]],
  honshu: [[132.2, 35.45], [132.7, 35.47], [133.0, 35.55], [133.2, 35.58], [133.35, 35.56], [133.6, 35.52], [133.6, 35.45]],
};
function blob(lon, lat, rkm, n = 14, seed = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = rkm * (0.82 + 0.25 * Math.abs(Math.sin(i * 2.3 + seed)));
    pts.push([lon + Math.cos(a) * r / GEO.KX, lat + Math.sin(a) * r / GEO.KY]);
  }
  return pts;
}
const ISLES = {
  ulleung: { c: [130.865, 37.495], shape: blob(130.865, 37.495, 5.2, 16, 2) },
  oki: { c: [133.27, 36.28], shape: blob(133.27, 36.25, 9.5, 16, 5) },
  oki2: { c: [133.05, 36.08], shape: blob(133.05, 36.08, 5.5, 12, 3) },
  oki3: { c: [133.13, 36.07], shape: blob(133.13, 36.06, 3.2, 10, 7) },
};
const DOKDO_LL = [131.8667, 37.2417];

function sailGame() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0;background:#0f4d7d' });
    L.scene.append(root);
    HINT.pos = 'right';
    const cv = el('canvas', { width: W, height: H, style: 'position:absolute;inset:0;touch-action:none' });
    root.append(cv);
    const g = cv.getContext('2d');
    const boatImg = new Image(); boatImg.src = img('boat-top');
    const title = el('div', { class: 'mg-title', text: '⛵ 가고 싶은 곳을 누르면 우산호가 그쪽으로 가!' });
    const meter = el('div', { style: 'position:absolute;left:18px;top:140px;background:rgba(8,26,48,.85);border-radius:14px;padding:10px 16px;font:22px var(--ui);line-height:1.5;border:2px solid rgba(143,211,255,.4)' });
    const compass = el('div', { style: 'position:absolute;left:18px;bottom:18px;width:150px;height:150px;border-radius:50%;background:rgba(8,26,48,.85);border:3px solid #8fd3ff' });
    compass.innerHTML = `<div style="position:absolute;left:0;right:0;top:4px;text-align:center;font:18px RIDIBatang">북</div><div style="position:absolute;right:8px;top:62px;font:18px RIDIBatang">동</div><div style="position:absolute;left:0;right:0;bottom:4px;text-align:center;font:18px RIDIBatang">남</div><div style="position:absolute;left:8px;top:62px;font:18px RIDIBatang">서</div>`;
    const needle = el('div', { style: 'position:absolute;left:72px;top:22px;width:6px;height:53px;background:#ff5a4a;transform-origin:3px 53px;border-radius:3px' });
    compass.append(needle);
    const dirTxt = el('div', { style: 'position:absolute;left:180px;bottom:30px;font:24px var(--ui);background:rgba(8,26,48,.85);padding:8px 16px;border-radius:12px' });
    root.append(title, meter, compass, dirTxt);
    const MM = { x: 1030, y: 140, w: 230, h: WORLD.h / WORLD.w * 230 };
    const fogCv = el('canvas', { width: Math.ceil(WORLD.w / 8), height: Math.ceil(WORLD.h / 8) });
    const fg = fogCv.getContext('2d');
    fg.fillStyle = 'rgba(214,224,234,0.96)'; fg.fillRect(0, 0, fogCv.width, fogCv.height);
    const reveal = (x, y, r) => { fg.save(); fg.globalCompositeOperation = 'destination-out'; const gr = fg.createRadialGradient(x / 8, y / 8, 0, x / 8, y / 8, r / 8); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.7, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); fg.fillStyle = gr; fg.beginPath(); fg.arc(x / 8, y / 8, r / 8, 0, 7); fg.fill(); fg.restore(); };
    for (const p of LAND.korea) reveal(gx(p[0]), gy(p[1]), 140);
    const U = { x: gx(ISLES.ulleung.c[0]), y: gy(ISLES.ulleung.c[1]) };
    const D = { x: gx(DOKDO_LL[0]), y: gy(DOKDO_LL[1]) };
    const OKI = { x: gx(133.2), y: gy(36.34) };
    reveal(U.x, U.y, 200);
    const boat = { x: U.x + 40, y: U.y + 20, h: 110, v: 0, spin: 0 };
    let target = null, cam = { x: boat.x, y: boat.y, z: 1 }, arrived = false, t0 = performance.now(), pausedMs = 0, lastT = t0, raf, lastHint = t0;
    const buoys = [
      { lon: 131.17, lat: 37.41, ico: '🌡️', title: '바닷물 온도계 부표', text: '이 바다는 북쪽에서 내려온 차가운 바닷물과 남쪽에서 올라온 따뜻한 바닷물이 만나는 곳이야.\n그래서 물고기가 많이 모여들어.', got: false },
      { lon: 131.52, lat: 37.33, ico: '🌬️', title: '날씨 기록 부표', text: '맑은 날에는 울릉도의 높은 곳에서 독도가 보여.\n하지만 안개가 끼거나 흐린 날에는 보이지 않아.', got: false },
      { lon: 132.45, lat: 36.8, ico: '🧭', title: '먼 바다 부표', text: '이쪽으로 계속 가면 일본의 오키섬이 나와.\n오키섬은 독도에서 약 157.5km, 울릉도보다 훨씬 멀리 있어.', got: false },
    ].map(b => ({ ...b, x: gx(b.lon), y: gy(b.lat) }));
    const whirls = Array.from({ length: 4 }, (_, i) => ({ x: U.x + 120 + i * 110, y: U.y + 60 + (i % 2) * 120, a: Math.random() * 7, r: 42 }));
    const W2S = (x, y) => ({ x: (x - cam.x) * cam.z + W / 2, y: (y - cam.y) * cam.z + (H + 64) / 2 });
    const S2W = (x, y) => ({ x: (x - W / 2) / cam.z + cam.x, y: (y - (H + 64) / 2) / cam.z + cam.y });
    const poly = pts => { g.beginPath(); pts.forEach((p, i) => { const s = W2S(gx(p[0]), gy(p[1])); i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y); }); g.closePath(); };
    const label = (t, x, y, size = 22, col = '#fff', dx = 0, dy = 0) => { const s = W2S(x, y); g.font = `${size}px RIDIBatang, serif`; g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(t, s.x + dx, s.y + dy); g.fillStyle = col; g.fillText(t, s.x + dx, s.y + dy); };
    const drawDokdo = (x, y, sc = 1) => { const s = W2S(x, y); g.fillStyle = '#6aa37a'; g.strokeStyle = '#2c5c44'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(s.x - 22 * sc, s.y + 6 * sc); g.lineTo(s.x - 14 * sc, s.y - 12 * sc); g.lineTo(s.x - 6 * sc, s.y + 6 * sc); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(s.x - 2 * sc, s.y + 6 * sc); g.lineTo(s.x + 8 * sc, s.y - 8 * sc); g.lineTo(s.x + 18 * sc, s.y + 6 * sc); g.closePath(); g.fill(); g.stroke(); };
    const openBuoy = async b => {
      b.got = true; const ps = performance.now(); Sound.sfx('ping'); addScore(20, 640, 300);
      await showDoc({ title: `${b.ico} ${b.title}`, lines: [b.text], btn: '알겠어!' });
      pausedMs += performance.now() - ps; lastT = performance.now();
    };
    let busy = false;
    const frame = now => {
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      if (!busy && !arrived) {
        if (boat.spin > 0) { boat.spin -= dt; boat.h += 720 * dt; }
        else if (target) {
          const dx = target.x - boat.x, dy = target.y - boat.y, d = Math.hypot(dx, dy);
          if (d < 6) target = null;
          else {
            const want = Math.atan2(dx, -dy) * 180 / Math.PI;
            let diff = ((want - boat.h + 540) % 360) - 180; boat.h += clamp(diff, -200 * dt, 200 * dt);
            boat.v = Math.min(46, boat.v + 60 * dt);
            boat.x += Math.sin(boat.h * Math.PI / 180) * boat.v * dt; boat.y -= Math.cos(boat.h * Math.PI / 180) * boat.v * dt;
          }
        } else boat.v = Math.max(0, boat.v - 60 * dt);
        boat.x = clamp(boat.x, 20, WORLD.w - 20); boat.y = clamp(boat.y, 20, WORLD.h - 20);
        if (gx(129.6) > boat.x && boat.y > gy(37.9)) { boat.x = gx(129.6); target = null; }
        reveal(boat.x, boat.y, 120);
        for (const w of whirls) {
          w.a += dt * 0.5; w.x += Math.cos(w.a) * 14 * dt; w.y += Math.sin(w.a * 1.3) * 10 * dt;
          if (boat.spin <= 0 && Math.hypot(w.x - boat.x, w.y - boat.y) < w.r) { boat.spin = 0.8; target = null; Sound.sfx('whoosh'); hint('앗, 안개 소용돌이! 빙글빙글~', 'wow', 2000); w.x += 120; }
        }
        for (const b of buoys) if (!b.got && Math.hypot(b.x - boat.x, b.y - boat.y) < 40) { busy = true; openBuoy(b).then(() => { busy = false; }); }
        if (Math.hypot(D.x - boat.x, D.y - boat.y) < 44) { arrived = true; arrive(); }
        if (now - lastHint > 25000 && !arrived) { lastHint = now; hint('나침반을 봐! 전망대에서 섬을 본 방향으로 배를 몰아 볼까?', 'gaji'); }
      }
      if (!arrived) { cam.x += (boat.x - cam.x) * 0.1; cam.y += (boat.y - cam.y) * 0.1; }
      render(now);
    };
    const render = now => {
      g.fillStyle = '#1b6aa3'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const y = ((i * 60 - cam.y * cam.z * 0.5) % H + H) % H; g.beginPath(); for (let x = -40 + ((now / 40) % 80); x < W; x += 80) { g.moveTo(x, y); g.lineTo(x + 26, y); } g.stroke(); }
      g.fillStyle = '#c9b98f'; g.strokeStyle = '#7d6b48'; g.lineWidth = 2;
      poly(LAND.korea); g.fill(); g.stroke(); poly(LAND.honshu); g.fill(); g.stroke();
      g.fillStyle = '#6aa37a';
      for (const k of ['ulleung', 'oki', 'oki2', 'oki3']) { poly(ISLES[k].shape); g.fill(); g.stroke(); }
      drawDokdo(D.x, D.y, 1.3);
      label('한반도', gx(129.05), gy(36.9), 28);
      if (arrived) label('울릉도', U.x, U.y, 24, '#fff', -8, -26); else label('울릉도', U.x, U.y + 55);
      label('동해', gx(130.3), gy(36.6), 34, 'rgba(255,255,255,.7)');
      if (arrived) label('오키섬 (일본)', OKI.x, OKI.y, 24, '#fff', 0, -34); else label('오키섬 (일본)', OKI.x, OKI.y - 70);
      label('혼슈 (일본)', gx(133.0), gy(35.5) - 18);
      if (arrived) label('독도', D.x, D.y, 26, '#ffe08a', 0, -30);
      for (const b of buoys) { if (b.got) continue; const s = W2S(b.x, b.y); g.fillStyle = 'rgba(255,200,80,.35)'; g.beginPath(); g.arc(s.x, s.y, 26 + Math.sin(now / 200) * 5, 0, 7); g.fill(); g.font = '30px sans-serif'; g.textAlign = 'center'; g.fillText(b.ico, s.x, s.y + 10); }
      if (!arrived) for (const w of whirls) { const s = W2S(w.x, w.y); g.strokeStyle = 'rgba(235,240,248,.7)'; g.lineWidth = 5; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(s.x, s.y, (w.r - k * 12) * cam.z, now / 300 + k, now / 300 + k + 4); g.stroke(); } }
      g.save(); g.imageSmoothingEnabled = true;
      const o = W2S(0, 0); g.drawImage(fogCv, o.x, o.y, WORLD.w * cam.z, WORLD.h * cam.z); g.restore();
      for (const b of buoys) { if (b.got) continue; const s = W2S(b.x, b.y); g.fillStyle = `rgba(255,190,60,${0.5 + 0.3 * Math.sin(now / 250)})`; g.beginPath(); g.arc(s.x, s.y, 9, 0, 7); g.fill(); }
      if (arrived) {
        const a = W2S(U.x, U.y), b = W2S(D.x, D.y), c = W2S(OKI.x, OKI.y);
        g.setLineDash([12, 8]); g.lineWidth = 4;
        g.strokeStyle = '#ffe08a'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.strokeStyle = '#ff9a9a'; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke(); g.setLineDash([]);
        label('약 87.4km', (U.x + D.x) / 2, (U.y + D.y) / 2, 26, '#ffe08a', 0, 40);
        label('약 157.5km', (D.x + OKI.x) / 2, (D.y + OKI.y) / 2, 26, '#ffb3b3', 90, 0);
      }
      const bs = W2S(boat.x, boat.y);
      g.save(); g.translate(bs.x, bs.y); g.rotate(boat.h * Math.PI / 180);
      const bw = 64 * Math.max(cam.z, 0.6); if (boatImg.complete) g.drawImage(boatImg, -bw / 2, -bw / 2, bw, bw); g.restore();
      if (target && !arrived) { const t = W2S(target.x, target.y); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(t.x, t.y, 14, 0, 7); g.stroke(); }
      // 미니맵 (도착하면 숨김)
      if (arrived) { meterUpdate(); return; }
      g.fillStyle = 'rgba(8,26,48,.85)'; g.fillRect(MM.x - 6, MM.y - 6, MM.w + 12, MM.h + 12);
      const mk = MM.w / WORLD.w;
      g.fillStyle = '#1b6aa3'; g.fillRect(MM.x, MM.y, MM.w, MM.h);
      const mpoly = pts => { g.beginPath(); pts.forEach((p, i) => { const x = MM.x + gx(p[0]) * mk, y = MM.y + gy(p[1]) * mk; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); };
      g.fillStyle = '#c9b98f'; mpoly(LAND.korea); mpoly(LAND.honshu);
      g.fillStyle = '#6aa37a'; for (const k of ['ulleung', 'oki', 'oki2', 'oki3']) mpoly(ISLES[k].shape);
      g.drawImage(fogCv, MM.x, MM.y, MM.w, MM.h);
      g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(MM.x + boat.x * mk, MM.y + boat.y * mk, 4, 0, 7); g.fill();
      if (arrived) { g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(MM.x + D.x * mk, MM.y + D.y * mk, 4, 0, 7); g.fill(); }
      meterUpdate();
    };
    const meterUpdate = () => {
      const dist = Math.max(0, Math.hypot(boat.x - U.x, boat.y - U.y) / GEO.Z - 5);
      meter.innerHTML = `울릉도에서 <b style="color:#ffe08a">${arrived ? '87.4' : dist.toFixed(1)}km</b>`;
      needle.style.transform = `rotate(${boat.h}deg)`;
      dirTxt.textContent = `진행 방향: ${quadName(boat.h)}`;
    };
    cv.addEventListener('pointerdown', e => { if (busy || arrived) return; const p = toLocal(e); if (p.y < 64) return; target = S2W(p.x, p.y); cv.setPointerCapture(e.pointerId); cv._drag = true; });
    cv.addEventListener('pointermove', e => { if (!cv._drag || arrived) return; const p = toLocal(e); target = S2W(p.x, p.y); });
    cv.addEventListener('pointerup', () => { cv._drag = false; });
    const arrive = async () => {
      DEV.solve = null; target = null; busy = true;
      const secs = (performance.now() - t0 - pausedMs) / 1000;
      Sound.sfx('good'); Sound.sfx('gull'); clearHint();
      fg.clearRect(0, 0, fogCv.width, fogCv.height);
      award('s1_nav', 1);
      if (secs <= 40) giveBadge('speed');
      title.textContent = '🏝️ 독도에 도착했다!';
      const z0 = cam.z, zt = 0.34, cx0 = cam.x, cy0 = cam.y, tx = (U.x + OKI.x) / 2 + 20, ty = (U.y + OKI.y) / 2 - 20, st = performance.now();
      await new Promise(r => { const an = () => { const p = Math.min(1, (performance.now() - st) / 1500); cam.z = z0 + (zt - z0) * p; cam.x = cx0 + (tx - cx0) * p; cam.y = cy0 + (ty - cy0) * p; if (p < 1) requestAnimationFrame(an); else r(); }; an(); });
      frameStop = true; HINT.pos = 'left';
      resolve({ secs, buoys: buoys.filter(b => b.got).length });
    };
    let frameStop = false;
    const tick = now => {
      if (!root.isConnected) return;
      if (frameStop) render(now); else frame(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    DEV.solve = () => { boat.x = D.x - 30; boat.y = D.y; };
  });
}

/* 드론으로 독도 살피기 */
function prng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function dokdoTopView(g, cx, cy, sc, opts = {}) {
  // 서도 (왼쪽, 더 높고 큼)
  g.fillStyle = '#7a8f5e'; g.strokeStyle = '#3d4a2c'; g.lineWidth = 3;
  const west = [[-230, -40], [-200, -120], [-150, -160], [-90, -150], [-50, -100], [-40, -20], [-70, 60], [-130, 100], [-200, 80], [-240, 20]];
  const east = [[40, -60], [90, -130], [160, -140], [220, -90], [240, -10], [210, 70], [140, 110], [70, 90], [30, 30]];
  const shape = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(cx + p[0] * sc, cy + p[1] * sc) : g.moveTo(cx + p[0] * sc, cy + p[1] * sc)); g.closePath(); g.fill(); g.stroke(); };
  shape(west); shape(east);
  g.fillStyle = 'rgba(40,60,30,.35)';
  g.beginPath(); g.ellipse(cx - 140 * sc, cy - 50 * sc, 55 * sc, 45 * sc, 0.3, 0, 7); g.fill();
  g.fillStyle = '#2a6e9e'; g.beginPath(); g.ellipse(cx + 150 * sc, cy - 20 * sc, 28 * sc, 20 * sc, 0, 0, 7); g.fill();
  return { west, east };
}
function droneGame() {
  return new Promise(resolve => {
    const root = el('div', { style: 'position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,#2f8cc9,#0f4d7d)' });
    L.scene.append(root);
    root.append(el('div', { class: 'mg-title', text: '🚁 드론을 끌고 다니며 독도의 섬들을 모두 살펴봐!' }));
    const cv = el('canvas', { width: W, height: H - 64, style: 'position:absolute;left:0;top:64px;touch-action:none' });
    const info = el('div', { style: 'position:absolute;right:20px;top:130px;width:300px;background:rgba(8,26,48,.88);border-radius:16px;padding:14px 18px;font:21px/1.6 var(--ui);border:2px solid rgba(143,211,255,.4)' });
    root.append(cv, info);
    const g = cv.getContext('2d');
    const cx = 560, cy = 330, rnd = prng(1905);
    const rocks = [];
    while (rocks.length < 89) {
      const a = rnd() * 7, r = 150 + rnd() * 260, x = cx + Math.cos(a) * r * 1.3, y = cy + Math.sin(a) * r * 0.75;
      if (x < 40 || x > 900 || y < 40 || y > 610) continue;
      if (Math.abs(x - cx) < 280 && Math.abs(y - cy) < 150) continue;
      rocks.push({ x, y, r: 4 + rnd() * 9, seen: false });
    }
    let dr = { x: 560, y: 560 }, seen = 0, big = { w: false, e: false }, done = false;
    const drawAll = now => {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(cx, cy, 300 + i * 22, 180 + i * 14, 0, 0, 7); g.stroke(); }
      dokdoTopView(g, cx, cy, 1);
      for (const k of rocks) { g.fillStyle = k.seen ? '#ffd166' : '#6f7d63'; g.beginPath(); g.arc(k.x, k.y, k.r, 0, 7); g.fill(); }
      g.font = '26px RIDIBatang, serif'; g.textAlign = 'center'; g.fillStyle = '#fff';
      if (big.w) g.fillText('서도', cx - 140, cy + 140);
      if (big.e) g.fillText('동도', cx + 140, cy + 150);
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.setLineDash([8, 6]);
      g.beginPath(); g.arc(dr.x, dr.y, 80, 0, 7); g.stroke(); g.setLineDash([]);
      g.font = '46px sans-serif'; g.fillText('🚁', dr.x, dr.y + 16);
    };
    const scan = () => {
      for (const k of rocks) if (!k.seen && Math.hypot(k.x - dr.x, k.y - dr.y) < 80) { k.seen = true; seen++; }
      if (!big.w && Math.hypot(dr.x - (cx - 140), dr.y - (cy - 40)) < 120) { big.w = true; Sound.sfx('ping'); }
      if (!big.e && Math.hypot(dr.x - (cx + 140), dr.y - (cy - 20)) < 120) { big.e = true; Sound.sfx('ping'); }
      info.innerHTML = `큰 섬: ${big.w ? '서도 ✓' : '?'} · ${big.e ? '동도 ✓' : '?'}<br>작은 바위섬(부속도서): <b style="color:#ffd166">${seen}</b>개 확인`;
      if (!done && big.w && big.e && seen >= 55) finish();
    };
    const finish = async () => {
      done = true; DEV.solve = null;
      rocks.forEach(k => k.seen = true); big.w = big.e = true; seen = 89; drawAll();
      info.innerHTML = `큰 섬: 서도 ✓ · 동도 ✓<br>작은 바위섬(부속도서): <b style="color:#ffd166">89</b>개<br><span style="font-size:18px;color:#bcd3ea">드론 측정 넓이: 모두 합쳐 187,554㎡</span>`;
      Sound.sfx('good'); award('s1_drone', 1);
      await doneBar(info);
      resolve();
    };
    let down = false;
    cv.addEventListener('pointerdown', e => { if (done) return; down = true; cv.setPointerCapture(e.pointerId); const p = toLocal(e); dr = { x: p.x, y: p.y - 64 }; scan(); });
    cv.addEventListener('pointermove', e => { if (!down || done) return; const p = toLocal(e); dr = { x: p.x, y: p.y - 64 }; scan(); });
    cv.addEventListener('pointerup', () => { down = false; });
    let raf; const loop = now => { if (!root.isConnected) return; drawAll(now); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); scan();
    DEV.solve = finish;
  });
}

const STAGE1 = [
  async () => {
    setBg('bg-stage1'); fogFx(0.6); Sound.play('sail'); placeSeal(1); setEra('오늘날 · 동해');
    await talk([
      ['narr', '타임 패트롤의 배, 우산호가 안개 낀 동해로 나아간다.'],
      ['gaji', '첫 임무는 독도를 찾는 거야. 그런데 안개가 지도에서 독도를 지워 버렸어!'],
      ['gaji:wow', '어? 라디오에서 노래가 흘러나와. 선생님이 틀어 준 그 노래 기억나?'],
      ['gaji', '노래 속에 독도를 찾는 단서가 숨어 있을지도 몰라. 주파수를 맞춰 보자!'],
    ]);
    await radioGame();
    await say('gaji', '단서 아홉 개를 수첩에 적어 뒀어. 진짜 증거를 찾으면 하나씩 풀릴 거야.\n수첩은 위쪽 📖 도감에서 언제든 볼 수 있어.');
  },
  async () => {
    setBg('bg-stage1'); fogFx(0.3); Sound.play('sail'); placeSeal(1);
    await talk([
      ['narr', '우산호는 먼저 울릉도에 닿았다. 높은 전망대에는 커다란 망원경이 있다.'],
      ['gaji', '이 망원경으로 독도를 찾아보자! 안개가 걷혀 맑아지는 순간, 바다 저편에 섬이 보일 거야.'],
    ]);
    clearScene();
    await telescopeGame();
    clearScene();
    await talk([
      ['gaji:wow', '보였어! 맑아진 순간에만 보이는 바위섬 두 개!'],
      ['gaji', '울릉도에서 동남쪽 바다에 있었지. 날씨가 맑아야만 보였고. 이 두 가지를 기억해 둬.'],
    ]);
  },
  async () => {
    setBg('bg-stage1'); fogFx(0); Sound.play('sail'); placeSeal(1);
    await say('gaji', '이제 우산호를 몰고 그 섬으로 가 보자! 가는 길의 반짝이는 부표에도 정보가 있어.');
    clearScene();
    const r = await sailGame();
    await talk([
      ['gaji:yay', '찾았다, 독도! 울릉도에서 약 87.4km. 거리계가 여기서 멈췄어.'],
      ['gaji', '지도를 봐. 일본의 오키섬까지는 약 157.5km야. 독도는 어느 섬과 더 가까이 있어?'],
      ['gaji', '맑은 날 울릉도에서 맨눈으로 보이는 섬… 울릉도 사람들에게 독도는 늘 바라보이는 이웃 섬이었을 거야.'],
    ]);
    clearScene();
    await getCard('location');
    await solveClue('dir');
  },
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(1);
    Sound.sfx('gull');
    await talk([
      ['narr', '독도 가까이 다가가자 괭이갈매기 떼가 하늘을 뒤덮는다. 바위마다 바닷새 둥지가 가득하다.'],
      ['gaji:wow', '와, 새들이 정말 많아! 바닷새들이 여기서 알을 낳고 새끼를 기르는구나.'],
    ]);
    await solveClue('birds');
    await say('gaji', '위에서 내려다보면 섬이 몇 개로 이루어져 있을까? 드론을 띄워 보자!');
    clearScene();
    await droneGame();
    clearScene();
    await talk([
      ['gaji', '큰 섬 두 개, 동도와 서도. 그리고 그 둘레에 작은 바위섬이 89개나!'],
    ]);
    await getCard('islands');
    await solveClue('area');
    await talk([
      ['gaji', '그런데 이렇게 큰 바위섬이 바다 한가운데 어떻게 생겼을까? 음파 탐지기로 바닷속을 들여다보자.'],
    ]);
    await sonarScene();
    await getCard('volcano');
  },
  async () => {
    setBg('bg-stage7'); fogFx(0); Sound.play('sail'); placeSeal(1);
    await talk([
      ['gaji', '선착장에 우편함이 있어! 독도에도 주소가 있나 봐.'],
      ['gaji:wow', '그런데 안개 때문에 주소 조각이 흩어졌어. 편지 봉투에 쓰듯이 큰 곳부터 차례로 맞춰 줄래?'],
    ]);
    await placeTiles({
      title: '📮 독도의 주소 맞추기', prompt: '편지 봉투에 주소를 쓸 때처럼, 가장 큰 행정구역부터 작은 곳 순서로 놓아 봐.',
      slots: [{ label: '① 가장 큰 곳' }, { label: '②' }, { label: '③' }, { label: '④ 가장 작은 곳' }],
      tiles: [{ t: '경상북도', slot: 0 }, { t: '울릉군', slot: 1 }, { t: '울릉읍', slot: 2 }, { t: '독도리', slot: 3 }],
      hintText: '"도" 안에 "군"이 있고, "군" 안에 "읍", "읍" 안에 "리"가 있어.', reveal: '도 → 군 → 읍 → 리 순서야!', key: 's1_addr',
    });
    await getCard('address');
    await solveClue('addr');
    await evidenceBoard(1);
    await stageClear(1);
  },
];

/* 음파 탐지: 바닷속 화산의 모습 */
function sonarScene() {
  return new Promise(resolve => {
    const root = el('div', { class: 'panel', style: 'width:1100px;padding:20px;text-align:center' });
    root.append(el('div', { style: 'font:30px var(--ui)', text: '📡 음파 탐지기: 바닷속 단면' }),
      el('div', { style: 'font:19px var(--body);color:#bcd3ea;margin:4px 0 10px', text: '반짝이는 곳 세 군데를 눌러 바닷속을 조사해 봐.' }));
    const cv = el('canvas', { width: 1040, height: 400, style: 'border-radius:14px' });
    const note = el('div', { class: 'msg', style: 'min-height:84px;font-size:21px;margin-top:10px' });
    root.append(cv, note);
    const m = modal(root, { closable: false });
    const g = cv.getContext('2d');
    const bg = () => {
      const sea = g.createLinearGradient(0, 0, 0, 400); sea.addColorStop(0, '#2a86c4'); sea.addColorStop(1, '#06243f');
      g.fillStyle = sea; g.fillRect(0, 0, 1040, 400);
      g.fillStyle = '#9fd6ff'; g.fillRect(0, 60, 1040, 3);
      g.fillStyle = '#5a4a44';
      g.beginPath(); g.moveTo(0, 400); g.lineTo(0, 380); g.bezierCurveTo(250, 380, 360, 120, 470, 64); g.lineTo(500, 30); g.lineTo(520, 64); g.lineTo(560, 64); g.lineTo(585, 36); g.lineTo(610, 64);
      g.bezierCurveTo(700, 120, 800, 380, 1040, 380); g.lineTo(1040, 400); g.fill();
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) { g.fillRect(300 + i * 60, 150 + i * 36, 480 - i * 110, 3); }
      g.fillStyle = '#fff'; g.font = '18px RIDIBatang, serif'; g.textAlign = 'left';
      g.fillText('바다 표면', 12, 54); g.fillText('바다 밑바닥 (약 2,000m 아래)', 12, 372);
    };
    bg();
    const spots = [
      { x: 540, y: 50, t: '물 위로 드러난 두 바위섬(동도와 서도)은 거대한 산의 꼭대기 부분이야.' },
      { x: 420, y: 200, t: '산의 몸통은 용암이 식어서 굳은 바위와 화산재가 겹겹이 쌓여 만들어졌어.' },
      { x: 260, y: 350, t: '이 산은 약 2,000m 깊이의 바다 밑바닥에서부터 솟아올랐어. 약 460만~250만 년 전의 일이야.' },
    ];
    const got = new Set();
    const draw = now => {
      bg();
      for (const [i, s] of spots.entries()) {
        g.fillStyle = got.has(i) ? 'rgba(61,214,140,.9)' : `rgba(255,190,60,${0.6 + 0.3 * Math.sin(now / 200)})`;
        g.beginPath(); g.arc(s.x, s.y, 16, 0, 7); g.fill();
      }
      if (root.isConnected) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    cv.addEventListener('click', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / SCALE, y = (e.clientY - r.top) / SCALE;
      spots.forEach((s, i) => {
        if (Math.hypot(s.x - x, s.y - y) < 40 && !got.has(i)) {
          got.add(i); Sound.sfx('ping'); note.textContent = s.t;
          if (got.size === spots.length) {
            root.append(el('div', { class: 'msg', style: 'font-size:22px;color:#ffd9a8;margin-top:6px', text: '가지: 그럼 독도는… 바닷속 화산 활동이 만든 섬이구나!' }));
            root.append(el('div', { style: 'margin-top:12px' }, onTap(el('button', { class: 'btn blue', text: '조사 끝!' }), () => { m.close(); resolve(); })));
            DEV.solve = () => { m.close(); resolve(); };
          }
        }
      });
    });
    DEV.solve = () => { m.close(); resolve(); };
  });
}
