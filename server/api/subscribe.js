// プッシュ通知の購読を保存（1端末=1ファイル。友達の投稿時にここへ送る）
import { put } from '@vercel/blob';
import { cors, badUid, endpointHash } from './_util.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { uid, subscription } = req.body || {};
    if (badUid(uid)) return res.status(400).json({ error: 'bad-uid' });
    if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'bad-sub' });
    const h = endpointHash(subscription.endpoint);
    await put(`subs/${uid}/${h}.json`, JSON.stringify({ uid, subscription }), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
