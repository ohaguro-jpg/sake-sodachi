// 招待リンクで相互フレンド登録
import { put } from '@vercel/blob';
import { cors, readJsonBlob, badUid } from './_util.js';

async function addFriend(owner, friend) {
  const cur = (await readJsonBlob(`friends/${owner.uid}.json`)) || [];
  if (!cur.find(x => x.uid === friend.uid)) {
    cur.push({ uid: friend.uid, name: String(friend.name || '').slice(0, 20) });
    await put(`friends/${owner.uid}.json`, JSON.stringify(cur), {
      access: 'public', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60
    });
  }
  return cur;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { a, b } = req.body || {};
    if (!a || !b || badUid(a.uid) || badUid(b.uid) || a.uid === b.uid)
      return res.status(400).json({ error: 'bad-request' });
    await addFriend(a, b);
    const mine = await addFriend(b, a);
    res.json({ ok: true, friends: mine });
  } catch (e) {
    res.status(500).json({ error: 'server', detail: String(e.message || e) });
  }
}
