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

// 管理者キー（Vercel環境変数。未設定なら管理者機能は無効）
export const ADMIN_KEY = process.env.ADMIN_KEY || '';
export function isAdmin(key) {
  return !!ADMIN_KEY && typeof key === 'string' && key === ADMIN_KEY;
}

// プッシュ購読の一覧（1端末=1ファイル）
export async function listSubs(uid) {
  const { blobs } = await list({ prefix: `subs/${uid}/`, limit: 100 });
  const arr = await Promise.all(blobs.map(b =>
    fetch(b.url).then(r => r.ok ? r.json() : null).then(s => s ? { ...s, _blobUrl: b.url } : null).catch(() => null)
  ));
  return arr.filter(Boolean);
}
// endpoint文字列から購読ファイル名用のハッシュ（衝突回避目的・暗号強度は不要）
export function endpointHash(endpoint) {
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (h * 31 + endpoint.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

// フィードのメタ一覧を新しい順に取得（vis無視・生データ）
export async function listFeedMetas(limit = 60) {
  const { blobs } = await list({ prefix: 'feed/', limit: Math.min(300, limit * 3) });
  const sorted = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname)).slice(0, limit);
  const metas = await Promise.all(sorted.map(b =>
    fetch(b.url).then(r => r.ok ? r.json() : null).then(m => m ? { ...m, _metaUrl: b.url } : null).catch(() => null)
  ));
  return metas.filter(Boolean);
}
