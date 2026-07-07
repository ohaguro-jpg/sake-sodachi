// 今日の一枚をフィードに投稿（1日2回まで）
import { put, list } from '@vercel/blob';
import { cors, todayJST, badUid } from './_util.js';

const MAX_PER_DAY = 2;
const MAX_IMG_BYTES = 600 * 1024;

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { uid, name, charId, lv, dayN, phrase, caption, vis, img } = req.body || {};
    if (badUid(uid)) return res.status(400).json({ error: 'bad-uid' });
    if (!img || typeof img !== 'string') return res.status(400).json({ error: 'no-img' });
    if (!['friends', 'all'].includes(vis)) return res.status(400).json({ error: 'bad-vis' });
    const buf = Buffer.from(img, 'base64');
    if (buf.length < 1000 || buf.length > MAX_IMG_BYTES) return res.status(400).json({ error: 'img-size' });

    // 1日2回まで（JST）
    const today = todayJST();
    const { blobs } = await list({ prefix: `photos/${uid}/${today}`, limit: 10 });
    if (blobs.length >= MAX_PER_DAY) return res.status(429).json({ error: 'daily-limit' });

    const ts = Date.now();
    const photo = await put(`photos/${uid}/${today}-${ts}.jpg`, buf, {
      access: 'public', contentType: 'image/jpeg', addRandomSuffix: true
    });
    // フィードのメタ（ファイル名を反転tsにして新しい順に並ぶようにする）
    const meta = {
      uid, ts,
      name: String(name || '').slice(0, 20),
      charId: String(charId || '').slice(0, 20),
      lv: Math.max(1, Math.min(5, parseInt(lv) || 1)),
      dayN: Math.max(1, Math.min(99999, parseInt(dayN) || 1)),
      phrase: String(phrase || '').slice(0, 30),
      caption: String(caption || '').slice(0, 40),
      vis, img: photo.url, photoPath: photo.pathname
    };
    await put(`feed/${String(99999999999999 - ts)}.json`, JSON.stringify(meta), {
      access: 'public', contentType: 'application/json', addRandomSuffix: true
    });
    res.json({ ok: true, remaining: MAX_PER_DAY - blobs.length - 1 });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
