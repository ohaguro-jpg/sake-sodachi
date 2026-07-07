// 共通ヘルパー（_で始まるファイルはエンドポイントにならない）
const BLOB_BASE = 'https://lgngh9fbk8mf1w5b.public.blob.vercel-storage.com';

export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// 友達一覧（1人=1ファイル方式。上書きが起きないのでキャッシュ事故・消失がない）
import { list } from '@vercel/blob';
export async function listFriends(uid) {
  const { blobs } = await list({ prefix: `friends/${uid}/`, limit: 200 });
  const arr = await Promise.all(blobs.map(b =>
    fetch(b.url).then(r => r.ok ? r.json() : null).catch(() => null)
  ));
  return arr.filter(Boolean);
}

// JSTの今日 YYYY-MM-DD
export function todayJST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

export function badUid(uid) {
  return typeof uid !== 'string' || !/^[a-f0-9]{24,64}$/.test(uid);
}
