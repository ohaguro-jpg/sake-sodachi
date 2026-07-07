// 投稿を削除（本人 or 管理者）。写真blobとフィードのメタを両方消す
import { del } from '@vercel/blob';
import { cors, badUid, isAdmin, listFeedMetas } from './_util.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { requesterUid, targetUid, ts, adminKey } = req.body || {};
    if (badUid(targetUid) || !ts) return res.status(400).json({ error: 'bad-request' });
    const admin = isAdmin(adminKey);
    if (!admin && requesterUid !== targetUid) return res.status(403).json({ error: 'forbidden' });

    const metas = await listFeedMetas(200);
    const m = metas.find(x => x.uid === targetUid && String(x.ts) === String(ts));
    if (!m) return res.status(404).json({ error: 'not-found' });

    const jobs = [del(m._metaUrl)];
    if (m.img) jobs.push(del(m.img).catch(() => {}));
    await Promise.all(jobs);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
