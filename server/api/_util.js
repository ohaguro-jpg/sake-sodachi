// 共通ヘルパー（_で始まるファイルはエンドポイントにならない）
import { list } from '@vercel/blob';

export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

// 決め打ちパスのJSON blobを読む（なければnull）
export async function readJsonBlob(path) {
  const { blobs } = await list({ prefix: path, limit: 1 });
  if (!blobs.length) return null;
  try {
    const r = await fetch(blobs[0].url + '?t=' + Date.now());
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

// JSTの今日 YYYY-MM-DD
export function todayJST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

export function badUid(uid) {
  return typeof uid !== 'string' || !/^[a-f0-9]{24,64}$/.test(uid);
}
