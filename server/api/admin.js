// 管理者用：全ユーザーの全投稿を新しい順に取得（vis無視）。キー必須
import { cors, isAdmin, listFeedMetas } from './_util.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!isAdmin(req.query.key)) return res.status(403).json({ error: 'forbidden' });
  try {
    const metas = await listFeedMetas(120);
    res.json({ items: metas });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
