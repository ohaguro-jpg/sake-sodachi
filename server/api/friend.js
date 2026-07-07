// 招待リンクで相互フレンド登録（1人=1ファイル方式）
import { put } from '@vercel/blob';
import { cors, badUid, listFriends } from './_util.js';

async function addFriend(owner, friend) {
  await put(`friends/${owner.uid}/${friend.uid}.json`,
    JSON.stringify({ uid: friend.uid, name: String(friend.name || '').slice(0, 20) }),
    { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { a, b } = req.body || {};
    if (!a || !b || badUid(a.uid) || badUid(b.uid) || a.uid === b.uid)
      return res.status(400).json({ error: 'bad-request' });
    await Promise.all([addFriend(a, b), addFriend(b, a)]);
    const mine = await listFriends(a.uid);
    res.json({ ok: true, friends: mine });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
