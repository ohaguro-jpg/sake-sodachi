// 乾杯フィード取得（自分＋友達＋「みんな」公開のもの）
import { list } from '@vercel/blob';
import { cors, readJsonBlob, badUid } from './_util.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const uid = String(req.query.uid || '');
  if (badUid(uid)) return res.status(400).json({ error: 'bad-uid' });
  try {
    const friends = (await readJsonBlob(`friends/${uid}.json`)) || [];
    const fset = new Set(friends.map(f => f.uid));
    const { blobs } = await list({ prefix: 'feed/', limit: 80 });
    // ファイル名が反転tsなので昇順=新しい順
    const sorted = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname)).slice(0, 60);
    const metas = await Promise.all(sorted.map(b =>
      fetch(b.url).then(r => r.ok ? r.json() : null).catch(() => null)
    ));
    const items = [];
    for (const m of metas) {
      if (!m) continue;
      if (m.uid === uid || m.vis === 'all' || fset.has(m.uid)) items.push(m);
      if (items.length >= 30) break;
    }
    res.json({ items, friends });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
