/* ===== 실시간 랭킹 (구글 앱스 스크립트 웹 앱) =====
   점수는 선생님의 구글 시트에만 저장된다. 인터넷이 끊기면 태블릿에 모아 두었다가 다시 보낸다. */
const Rank = {
  queue: store.get(KEY.queue, []),
  flushing: false,
  url() { return String(CFG.rankingUrl || '').trim(); },
  enabled() { return /^https:\/\/script\.google(usercontent)?\.com\//.test(this.url()); },
  submit(rec) {
    this.queue.push(rec); store.set(KEY.queue, this.queue);
    return this.flush();
  },
  async flush() {
    if (!this.enabled() || this.flushing || !this.queue.length || !navigator.onLine) return;
    this.flushing = true;
    try {
      while (this.queue.length) {
        const rec = this.queue[0];
        const r = await fetch(this.url(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'submit' }, rec)) });
        const j = await r.json();
        if (!j || (!j.ok && !j.rejected)) break;
        if (j.id) { const me = store.get(KEY.me, {}); me[`${rec.g}|${rec.c}|${rec.n}`] = j.id; store.set(KEY.me, me); }
        this.queue.shift(); store.set(KEY.queue, this.queue);
      }
    } catch (e) { /* 다음에 다시 보낸다 */ }
    this.flushing = false;
  },
  async list() {
    const r = await fetch(this.url() + (this.url().includes('?') ? '&' : '?') + 'action=list&_=' + Date.now());
    return r.json();
  },
  async myId(p) {
    const key = `${p.grade}|${p.cls}|${p.name}`;
    const saved = store.get(KEY.me, {})[key];
    if (saved) return saved;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
    } catch (e) { return null; }
  },
};
setInterval(() => Rank.flush(), 15000);
window.addEventListener('online', () => Rank.flush());
