/**
 * 독도 타임 패트롤 실시간 랭킹 서버 (구글 앱스 스크립트)
 *
 * 쓰는 법: 구글 시트 → [확장 프로그램] → [Apps Script]에 이 코드를 통째로 붙여 넣고,
 * [배포] → [새 배포] → 유형 "웹 앱", 액세스 권한 "모든 사용자"로 배포하세요.
 * 자세한 순서는 저장소의 docs/teacher-guide.md 에 있습니다.
 *
 * 시트 두 개를 자동으로 만듭니다.
 *   - 랭킹: 학생마다 최고 기록 한 줄 (이 줄을 지우면 순위에서도 사라집니다)
 *   - 기록: 게임을 끝낼 때마다 쌓이는 전체 기록
 * 학생 이름 전체는 이 시트에만 저장되고, 게임 화면에는 가운데 글자를 가려서 보냅니다.
 */
const SHEET_BEST = '랭킹';
const SHEET_LOG = '기록';
const CLASSES = { 1: 6, 2: 5, 3: 6 };  // 학년: 반 수
const MAX_SCORE = 20000;                // 이보다 높은 점수는 저장하지 않음
const MIN_TIME = 240;                   // 4분보다 짧게 끝낸 기록은 저장하지 않음
const MAX_TIME = 3 * 60 * 60;

const HEAD_BEST = ['학년', '반', '이름', '최고 점수', '등급', '시간(초)', '기록 시각', '도전 횟수'];
const HEAD_LOG = ['저장 시각', '학년', '반', '이름', '점수', '등급', '시간(초)', '증거 수', '8단계 바로 가기', '판 번호'];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'list';
  if (action === 'list') return json_(listRanking_());
  return json_({ ok: true, name: 'dokdo-time-patrol-ranking' });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, rejected: true, error: 'bad request' }); }
  if (!d || d.action !== 'submit') return json_({ ok: false, rejected: true, error: 'unknown action' });
  return json_(submit_(d));
}

function submit_(d) {
  const g = Number(d.g), c = Number(d.c), s = Math.round(Number(d.s)), t = Math.round(Number(d.t));
  const n = String(d.n || '').trim().replace(/\s+/g, ' ');
  const gr = String(d.gr || '').slice(0, 1);
  const cards = Number(d.cards) || 0;
  const run = String(d.run || '').slice(0, 40);
  if (!CLASSES[g] || !(c >= 1 && c <= CLASSES[g])) return { ok: false, rejected: true, error: 'class' };
  if (!/^[가-힣a-zA-Z ]{2,10}$/.test(n)) return { ok: false, rejected: true, error: 'name' };
  if (!(s >= 0 && s <= MAX_SCORE)) return { ok: false, rejected: true, error: 'score' };
  if (!(t >= MIN_TIME && t <= MAX_TIME)) return { ok: false, rejected: true, error: 'time' };
  const id = idOf_(g, c, n);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const log = sheet_(ss, SHEET_LOG, HEAD_LOG);
    // 인터넷이 끊겼다가 같은 판을 다시 보낸 경우에는 한 번만 저장한다.
    const last = log.getLastRow();
    if (run && last > 1) {
      const from = Math.max(2, last - 500);
      const runs = log.getRange(from, 10, last - from + 1, 1).getValues().map(r => String(r[0]));
      if (runs.indexOf(run) >= 0) return { ok: true, id: id, duplicate: true };
    }
    log.appendRow([new Date(), g, c, n, s, gr, t, cards, d.skip ? 'O' : '', run]);
    const best = sheet_(ss, SHEET_BEST, HEAD_BEST);
    const rows = best.getLastRow() > 1 ? best.getRange(2, 1, best.getLastRow() - 1, 8).getValues() : [];
    let idx = -1;
    for (let i = 0; i < rows.length; i++) {
      if (Number(rows[i][0]) === g && Number(rows[i][1]) === c && String(rows[i][2]).trim() === n) { idx = i; break; }
    }
    if (idx < 0) {
      best.appendRow([g, c, n, s, gr, t, new Date(), 1]);
    } else {
      const r = rows[idx], tries = (Number(r[7]) || 1) + 1;
      const better = s > Number(r[3]) || (s === Number(r[3]) && t < Number(r[5]));
      if (better) best.getRange(idx + 2, 4, 1, 5).setValues([[s, gr, t, new Date(), tries]]);
      else best.getRange(idx + 2, 8).setValue(tries);
    }
    CacheService.getScriptCache().remove('ranking');
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function listRanking_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('ranking');
  if (hit) return JSON.parse(hit);
  const best = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BEST);
  let rows = [];
  if (best && best.getLastRow() > 1) {
    rows = best.getRange(2, 1, best.getLastRow() - 1, 6).getValues()
      .filter(r => String(r[2]).trim() !== '' && r[3] !== '')
      .map(r => {
        const g = Number(r[0]), c = Number(r[1]), n = String(r[2]).trim();
        return { g: g, c: c, n: mask_(n), s: Number(r[3]), r: String(r[4]), t: Number(r[5]), id: idOf_(g, c, n) };
      });
    rows.sort((a, b) => b.s - a.s || a.t - b.t);
  }
  const out = { ok: true, rows: rows, at: Date.now() };
  try { cache.put('ranking', JSON.stringify(out), 5); } catch (e) { /* 캐시가 가득 차도 괜찮다 */ }
  return out;
}

/** 가운데 글자 가리기: 김민수 → 김○수, 남궁민수 → 남○○수, 이준 → 이○ */
function mask_(name) {
  const ch = Array.from(String(name).replace(/\s/g, ''));
  if (ch.length <= 1) return ch.join('');
  if (ch.length === 2) return ch[0] + '○';
  return ch[0] + '○'.repeat(ch.length - 2) + ch[ch.length - 1];
}

/** 학생을 구분하는 짧은 번호 (이름을 드러내지 않고 "내 순위"를 표시하는 데 씀) */
function idOf_(g, c, n) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, g + '|' + c + '|' + n, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('').slice(0, 12);
}

function sheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** 처음 한 번 실행하세요. 시트 두 개를 만들고, 권한 허용 창을 띄웁니다. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet_(ss, SHEET_BEST, HEAD_BEST);
  sheet_(ss, SHEET_LOG, HEAD_LOG);
}

/** 수업 전 연습 기록을 모두 지웁니다. (머리글 줄은 남김) */
function clearAllRecords() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const name of [SHEET_BEST, SHEET_LOG]) {
    const sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  }
  CacheService.getScriptCache().remove('ranking');
}
