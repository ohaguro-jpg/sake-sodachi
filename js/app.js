// 酒育て日記 — メインロジック
// 育て方はA案（相棒制）: 1匹選んでずっと一緒、Lv5まで育ちきったら次を解放
// 写真本体はカメラロールへ保存、アプリ内はサムネイルのみ（localStorage）

const LS_KEY = 'sakeSodachi.v1';
const FINAL_W = 1080, FINAL_H = 1440;
const API_BASE = 'https://sake-sodachi-api.vercel.app/api';
// 招待リンクは常に本番URLに固定（ローカルIPだと同じWi-Fiの人しか開けないため）
const SITE_URL = 'https://ohaguro-jpg.github.io/sake-sodachi/';
// 管理者：名前欄（またはフレンドのコード欄）にこの合言葉を入れると管理者画面へ
const ADMIN_PHRASE = 'ナタデココは府中1';
const ADMIN_KEY = 'sakeadmin_84ccd68f59b612d6';   // ※公開JSに載る簡易キー

let state = loadState();
let stream = null;
let srcCanvas = null;      // 撮影原本（1080x1440にカバークロップ済み）
let photoTs = null;        // 撮影時刻（写真に焼き込む）
let edit = null;           // 編集中の状態
let lastShot = null;       // 直前に合成した完成写真（ストーリー共有用）

// ---------- state ----------
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && s.buddyPoints) return s;
  } catch (e) {}
  return {
    userName: '',
    buddy: null,
    buddyPoints: {},           // charId -> 累計ポイント
    records: [],               // {date, ts, phrase, pts, charId, thumb}
    settings: { font: 'boku', shape: 'A' }
  };
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

// フレンド機能用のID・設定（既存ユーザーにも補完）
function randHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}
if (!state.uid) { state.uid = randHex(12); saveState(); }
if (!state.share) { state.share = { vis: 'friends' }; saveState(); }

function levelOf(points) {
  let lv = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (points >= LEVEL_THRESHOLDS[i]) lv = i + 1;
  return lv;
}
function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hasRecordToday() { return state.records.some(r => r.date === todayStr()); }
function fmtDt(ts) {
  const d = new Date(ts);
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${days[d.getDay()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function streakDays() {
  const dates = new Set(state.records.map(r => r.date));
  let n = 0;
  const d = new Date();
  if (!dates.has(todayStr(d))) d.setDate(d.getDate() - 1); // 今日まだでも昨日から数える
  while (dates.has(todayStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- 画面遷移 ----------
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id !== 'screen-camera') stopCamera();
}

// ---------- タイトル（◯◯酒育日記） ----------
function appTitle() { return state.userName ? `${state.userName}酒育日記` : '酒育日記'; }
function updateTitle() {
  document.getElementById('homeTitle').textContent = appTitle();
  document.title = appTitle();
}

// ---------- 初回：名前＆相棒えらび ----------
let startPick = null;
function checkStartReady() {
  const named = document.getElementById('nameInput').value.trim().length > 0;
  document.getElementById('btnStartConfirm').disabled = !(named && startPick);
}
function renderStart() {
  document.getElementById('nameInput').value = state.userName || '';
  startPick = state.buddy || null;   // 既存ユーザーは相棒を引き継ぎ
  const grid = document.getElementById('startCards');
  grid.innerHTML = '';
  CHAR_ORDER.forEach(id => {
    const c = CHARACTERS[id];
    const card = document.createElement('div');
    card.className = 'charCard' + (startPick === id ? ' selected' : '');
    card.innerHTML = `${charSvgInline(id, 1)}<div class="nm">${c.name}</div><div class="mt">${c.motif}／${c.levels[0].name}</div>`;
    card.onclick = () => {
      startPick = id;
      grid.querySelectorAll('.charCard').forEach(x => x.classList.remove('selected'));
      card.classList.add('selected');
      checkStartReady();
    };
    grid.appendChild(card);
  });
  checkStartReady();
}
document.getElementById('nameInput').addEventListener('input', (e) => {
  if (e.target.value.trim() === ADMIN_PHRASE) { e.target.value = ''; openAdmin(); return; }
  checkStartReady();
});
document.getElementById('btnStartConfirm').onclick = () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!startPick || !name) return;
  state.userName = name;
  state.buddy = startPick;
  state.buddyPoints[startPick] = state.buddyPoints[startPick] || 0;
  saveState();
  updateTitle();
  goHome();
  if (pendingInvite) { const inv = pendingInvite; pendingInvite = null; acceptInvite(inv); }
};

// ---------- ホーム＝育成（相棒メイン）大表示 ----------
function renderHomeBuddy() {
  const id = state.buddy;
  const pts = state.buddyPoints[id] || 0;
  const lv = levelOf(pts);
  const c = CHARACTERS[id];
  document.getElementById('homeChar').innerHTML = charSvgInline(id, lv);
  document.getElementById('homeCharName').textContent = c.levels[lv - 1].name;
  document.getElementById('homeCharLv').textContent = `Lv.${lv} ${c.levels[lv - 1].sub}`;
  const bar = document.getElementById('homeProgress');
  const lbl = document.getElementById('homeProgressLabel');
  if (lv >= 5) {
    bar.style.width = '100%';
    lbl.textContent = '育ちきった！「相棒をかえる」から次の子を迎えられるよ';
  } else {
    const lo = LEVEL_THRESHOLDS[lv - 1], hi = LEVEL_THRESHOLDS[lv];
    bar.style.width = `${Math.round((pts - lo) / (hi - lo) * 100)}%`;
    lbl.textContent = '毎日パシャっとすると育つよ';
  }
  document.getElementById('statDays').textContent = new Set(state.records.map(r => r.date)).size;
  document.getElementById('statStreak').textContent = streakDays();
  document.getElementById('homeStatus').innerHTML = hasRecordToday()
    ? '<span class="done">今日はもう乾杯済み🍻</span>'
    : '今日の一枚、まだだよ📸　右下の📸でパシャ！';
}

// ---------- 育成⇄フィード 横スライダー ----------
const sliderVp = document.getElementById('sliderViewport');
const sliderTrack = document.getElementById('sliderTrack');
let panelW = 0, homeX = 0, feedX = 0, curX = 0, atFeed = false;
function setSliderX(x, anim = true) {
  curX = x;
  sliderTrack.style.transition = anim ? 'transform .32s cubic-bezier(.2,.7,.2,1)' : 'none';
  sliderTrack.style.transform = `translateX(${x}px)`;
}
function layoutSlider() {
  const w = sliderVp.clientWidth;
  if (!w) return;            // まだ幅が確定していない → ResizeObserverが確定時に呼び直す
  panelW = w;
  feedX = 0;                 // フィード全表示
  homeX = -panelW * 0.72;    // 育成メイン（左28%に友達フィードがチラ見え）
  setSliderX(atFeed ? feedX : homeX, false);
}
function goFeedPanel() { atFeed = true; setSliderX(feedX); }
function goHomePanel() { atFeed = false; setSliderX(homeX); }
window.addEventListener('resize', layoutSlider);
// 表示直後に幅0のことがあるので、確定した瞬間にレイアウト
if (window.ResizeObserver) new ResizeObserver(() => layoutSlider()).observe(sliderVp);

(() => {
  let sx = null, sy = null, base = 0, horiz = null;
  sliderVp.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; base = curX; horiz = null;
  }, { passive: true });
  sliderVp.addEventListener('touchmove', e => {
    if (sx === null) return;
    const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (horiz === null) {
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      horiz = Math.abs(dx) > Math.abs(dy);
    }
    if (!horiz) return;             // 縦スクロールはそのまま
    e.preventDefault();
    let nx = Math.max(homeX, Math.min(feedX, base + dx));
    setSliderX(nx, false);
  }, { passive: false });
  sliderVp.addEventListener('touchend', () => {
    if (sx === null) return;
    const wasHoriz = horiz; sx = null;
    if (!wasHoriz) return;
    (curX > (homeX + feedX) / 2) ? goFeedPanel() : goHomePanel();
  });
})();

// ホームへ戻る共通処理（育成メイン表示＋左に友達フィードちら見え）
function goHome() {
  updateTitle();
  renderHomeBuddy();
  renderVisSeg();
  renderFriendChips(state.friendsCache || []);
  renderFeed();
  atFeed = false;
  show('screen-home');
  requestAnimationFrame(layoutSlider);
}
document.getElementById('btnShoot').onclick = openCamera;
document.getElementById('btnBuddySwitch').onclick = () => { renderBuddy(); show('screen-buddy'); };
document.getElementById('btnToAlbum').onclick = () => { renderAlbum(); show('screen-album'); };
// クリックでも育成⇄フィードを行き来できる（マウス＝PCでもスワイプ不要）
document.getElementById('navToFeed').onclick = goFeedPanel;
document.getElementById('navToHome').onclick = goHomePanel;

// ---------- 撮影 ----------
async function openCamera() {
  show('screen-camera');
  const err = document.getElementById('camError');
  err.hidden = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1440 } }, audio: false });
    document.getElementById('camVideo').srcObject = stream;
  } catch (e) {
    err.textContent = 'カメラが使えないみたい…🙏\n右下の🖼から写真を選んでね';
    err.hidden = false;
  }
}
function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
document.getElementById('btnCamClose').onclick = goHome;

// カバークロップして1080x1440の原本canvasを作る
function coverCrop(source, sw, sh, mirror) {
  const cv = document.createElement('canvas');
  cv.width = FINAL_W; cv.height = FINAL_H;
  const ctx = cv.getContext('2d');
  const scale = Math.max(FINAL_W / sw, FINAL_H / sh);
  const dw = sw * scale, dh = sh * scale;
  const dx = (FINAL_W - dw) / 2, dy = (FINAL_H - dh) / 2;
  if (mirror) { ctx.translate(FINAL_W, 0); ctx.scale(-1, 1); }
  ctx.drawImage(source, mirror ? FINAL_W - dx - dw : dx, dy, dw, dh);
  return cv;
}

document.getElementById('btnShutter').onclick = () => {
  const v = document.getElementById('camVideo');
  if (!v.videoWidth) return;
  srcCanvas = coverCrop(v, v.videoWidth, v.videoHeight, true);
  photoTs = Date.now();
  openEditor();
};
document.getElementById('filePick').onchange = async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    srcCanvas = coverCrop(img, img.naturalWidth, img.naturalHeight, false);
    photoTs = Date.now();
    URL.revokeObjectURL(img.src);
    openEditor();
  };
  img.src = URL.createObjectURL(f);
  ev.target.value = '';
};

// ---------- 編集 ----------
const SHAPES = ['A', 'B', 'C'];
function randomStamp() {
  return {
    phrase: PHRASES[Math.floor(Math.random() * PHRASES.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rot: Math.round(Math.random() * 12 - 6),
    fx: .13 + Math.random() * .06,   // デフォルトは左端
    fy: .32 + Math.random() * .28
  };
}

// 今日で乾杯何日目か（今日の分を含めて数える）
function kanpaiDayN() {
  const dates = new Set(state.records.map(r => r.date));
  dates.add(todayStr(photoTs ? new Date(photoTs) : new Date()));
  return dates.size;
}

function openEditor() {
  stopCamera();
  const r = randomStamp();
  edit = {
    phrase: r.phrase,
    font: state.settings.font,
    shape: r.shape,
    beauty: 0.35,
    stamp: { fx: r.fx, fy: r.fy, size: 24, rot: r.rot },
    chara: { fx: .76, fy: .78, size: 38, rot: 0 },
    selected: 'stamp'
  };
  document.getElementById('captionInput').value = '';
  show('screen-edit');   // getBBox のため先に表示
  document.getElementById('ovDay').textContent = `乾杯 ${kanpaiDayN()}日目`;
  drawEditCanvas();
  renderOverlays();
}

// ひとことのおかわり（スタンプをタップ）
function rerollStamp() {
  let r = randomStamp();
  while (r.phrase === edit.phrase) r = randomStamp();
  edit.phrase = r.phrase;
  edit.shape = r.shape;
  edit.stamp.rot = r.rot;
  renderOverlays();
}
document.getElementById('btnEditBack').onclick = openCamera;

function stageEl() { return document.getElementById('editStage'); }

function drawEditCanvas() {
  const cv = document.getElementById('editCanvas');
  cv.width = 780; cv.height = 1040;
  renderBase(cv.getContext('2d'), cv.width, cv.height);
}

// 写真＋美肌＋日時焼き込み（プレビューと保存で共用）
function renderBase(ctx, W, H) {
  const b = edit.beauty;
  ctx.save();
  ctx.filter = `brightness(${(1 + b * .12).toFixed(3)}) saturate(${(1 + b * .06).toFixed(3)})`;
  ctx.drawImage(srcCanvas, 0, 0, W, H);
  if (b > 0.02) {
    // ぼかしレイヤーを薄く重ねてなめらか肌に
    ctx.globalAlpha = b * .5;
    ctx.filter = `blur(${(W / 1080 * b * 7).toFixed(1)}px) brightness(${(1 + b * .14).toFixed(3)})`;
    ctx.drawImage(srcCanvas, 0, 0, W, H);
  }
  ctx.restore();
}

function fontFamily() { return FONTS.find(f => f.id === edit.font).family; }

// ---- オーバーレイ（スタンプ＆相棒）----
function renderOverlays() {
  const ov = document.getElementById('ovStamp');
  const s = edit.stamp;
  const fam = `'${fontFamily()}', serif`;
  if (edit.shape === 'A') {
    ov.innerHTML = `<span class="stampA" style="font-family:${fam}">${edit.phrase}</span>`;
  } else if (edit.shape === 'B') {
    ov.innerHTML = `<span class="stampB" style="font-family:${fam}">${edit.phrase}</span>`;
  } else {
    ov.innerHTML = `<span class="stampC" style="font-family:${fam}">${edit.phrase}<span class="rakkan">酒育</span></span>`;
  }
  ov.style.fontSize = s.size + 'px';
  ov.style.left = s.fx * 100 + '%';
  ov.style.top = s.fy * 100 + '%';
  ov.style.transform = `translate(-50%,-50%) rotate(${s.rot}deg)`;

  const oc = document.getElementById('ovChara');
  const c = edit.chara;
  const pts = state.buddyPoints[state.buddy] || 0;
  oc.innerHTML = charSvgInline(state.buddy, levelOf(pts));
  // 絵の実寸で正規化（Lv1の小さい子も写真の中でちゃんと見えるサイズに）
  const svgEl = oc.querySelector('svg');
  if (!c.artMax) {
    try {
      const b = svgEl.getBBox();
      c.artMax = Math.max(b.width, b.height) || 120;
    } catch (e) { c.artMax = 120; }
  }
  const w = c.size * 4.6 * (120 / c.artMax);
  svgEl.style.width = w + 'px';
  svgEl.style.height = w + 'px';
  oc.style.left = c.fx * 100 + '%';
  oc.style.top = c.fy * 100 + '%';
  oc.style.transform = `translate(-50%,-50%) rotate(${c.rot}deg)`;
}

// ドラッグ（動かさずに離したらタップ扱い→スタンプはひとことおかわり）
function setupDrag(elId, key) {
  const el = document.getElementById(elId);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const rect = stageEl().getBoundingClientRect();
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false;
    const move = (ev) => {
      if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 6 && !moved) return;
      moved = true;
      edit[key].fx = Math.min(.97, Math.max(.03, (ev.clientX - rect.left) / rect.width));
      edit[key].fy = Math.min(.97, Math.max(.03, (ev.clientY - rect.top) / rect.height));
      renderOverlays();
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      if (!moved && key === 'stamp') rerollStamp();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });
}
setupDrag('ovStamp', 'stamp');
setupDrag('ovChara', 'chara');

// ---------- 保存（合成→カメラロール→記録） ----------
// 投稿ボタン：合成→記録→フィードへ投稿（カメラロール保存は完了画面で任意）
document.getElementById('btnSave').onclick = async () => {
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.textContent = '投稿中…';
  try {
    await postPhoto();
  } catch (e) {
    alert('うまくいかなかった…もう一度試してね\n' + e.message);
  }
  btn.disabled = false;
  btn.textContent = '投稿する🍻';
};

// 写真を合成して記録（ポイント付与）→ フィード投稿 → 完了演出
async function postPhoto() {
  const fam = fontFamily();
  const stageW = stageEl().getBoundingClientRect().width;
  const scale = FINAL_W / stageW;
  await document.fonts.load(`${Math.round(edit.stamp.size * scale)}px "${fam}"`, edit.phrase);

  const cv = document.createElement('canvas');
  cv.width = FINAL_W; cv.height = FINAL_H;
  const ctx = cv.getContext('2d');
  renderBase(ctx, FINAL_W, FINAL_H);
  await drawCharaToCanvas(ctx, scale);
  drawStampToCanvas(ctx, scale);
  await drawDayToCanvas(ctx, scale);
  lastShot = cv;   // ストーリー共有・カメラロール保存用に保持

  // サムネイル（アプリ内保存用）
  const th = document.createElement('canvas');
  th.width = 270; th.height = 360;
  th.getContext('2d').drawImage(cv, 0, 0, 270, 360);
  const thumb = th.toDataURL('image/jpeg', .65);

  // 記録＆ポイント（1日1回・ルーレットの出目ボーナス付き）
  const first = !hasRecordToday();
  const rl = state.roulette;
  const bonusHit = first && rl && rl.date === todayStr(new Date(photoTs));
  const pts = first ? BASE_POINTS + (bonusHit ? rl.bonus : 0) : 0;
  const prevLv = levelOf(state.buddyPoints[state.buddy] || 0);
  if (first) state.buddyPoints[state.buddy] = (state.buddyPoints[state.buddy] || 0) + pts;
  const newLv = levelOf(state.buddyPoints[state.buddy] || 0);
  state.records.push({
    date: todayStr(new Date(photoTs)), ts: photoTs,
    phrase: edit.phrase, pts, charId: state.buddy, thumb
  });
  saveState();

  // フィードへ投稿（失敗しても記録・ポイントはそのまま）
  let postMsg;
  try {
    await postToFeed();
    postMsg = state.share.vis === 'all' ? 'フィードに載せたよ（みんな公開）🍻' : 'フィードに載せたよ（友達だけ）🍻';
  } catch (e) {
    postMsg = e.code === 429
      ? '今日はもう2回載せたから、フィードには載ってないよ（写真は残ってる）'
      : '電波が弱くてフィードには載せられなかった…（写真は残ってる）';
  }

  showCelebrate(pts, prevLv, newLv, first, bonusHit ? rl.label : null, postMsg);
}

// カメラロールへ保存（share優先、だめならダウンロード）
async function saveToCameraRoll() {
  if (!lastShot) return;
  const blob = await new Promise(r => lastShot.toBlob(r, 'image/jpeg', .92));
  const d = new Date(photoTs || Date.now());
  const p = n => String(n).padStart(2, '0');
  const fname = `sake_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.jpg`;
  const file = new File([blob], fname, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
document.getElementById('btnSaveRoll').onclick = async () => {
  const b = document.getElementById('btnSaveRoll');
  b.disabled = true; b.textContent = '保存中…';
  try { await saveToCameraRoll(); b.textContent = '📥 保存したよ'; }
  catch (e) { b.textContent = '📥 カメラロールに保存'; alert('保存に失敗しちゃった…もう一回試してね'); }
  b.disabled = false;
};

// 相棒スタンプを合成
async function drawCharaToCanvas(ctx, scale) {
  const c = edit.chara;
  const pts = state.buddyPoints[state.buddy] || 0;
  const svg = charSvgStandalone(state.buddy, levelOf(pts));
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const w = c.size * 4.6 * (120 / (c.artMax || 120)) * scale;
  ctx.save();
  ctx.translate(c.fx * FINAL_W, c.fy * FINAL_H);
  ctx.rotate(c.rot * Math.PI / 180);
  ctx.drawImage(img, -w / 2, -w / 2, w, w);
  ctx.restore();
  URL.revokeObjectURL(url);
}

// 「乾杯 ◯日目」を写真上部に焼き込む（プレビューの .dayBadge と同じ見た目）
async function drawDayToCanvas(ctx, scale) {
  const txt = `乾杯 ${kanpaiDayN()}日目`;
  const fam = `"${fontFamily()}", serif`;
  const size = 19 * scale;
  await document.fonts.load(`${Math.round(size)}px ${fam}`, txt);
  ctx.save();
  ctx.font = `${size}px ${fam}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const x = FINAL_W / 2, y = FINAL_H * .045;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * .22;
  ctx.strokeStyle = '#262019';
  ctx.shadowColor = 'rgba(0,0,0,.4)';
  ctx.shadowOffsetY = size * .1;
  ctx.shadowBlur = size * .15;
  ctx.strokeText(txt, x, y);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fffcf2';
  ctx.fillText(txt, x, y);
  ctx.restore();
}

// 縦書きで横倒しにする記号類
const VERT_ROT = new Set(['ー', '（', '）', '「', '」', '〜', '…', '―', '‥']);

// 書道スタンプを合成（形状A/B/C・すべて縦書き。長文は右→左に折り返し）
function drawStampToCanvas(ctx, scale) {
  const s = edit.stamp;
  const size = s.size * scale;
  const fam = `"${fontFamily()}", serif`;
  const chars = [...edit.phrase];
  const maxCol = 8;
  const nCols = Math.ceil(chars.length / maxCol);
  const colLen = Math.ceil(chars.length / nCols);
  const step = size * 1.16;      // 字送り（縦）
  const colStep = size * 1.35;   // 列間（横）
  const textW = nCols * colStep, textH = colLen * step;

  ctx.save();
  ctx.translate(s.fx * FINAL_W, s.fy * FINAL_H);
  ctx.rotate(s.rot * Math.PI / 180);
  ctx.font = `${size}px ${fam}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  };
  // 各文字の位置（列は右→左）
  const pos = chars.map((ch, i) => {
    const col = Math.floor(i / colLen), row = i % colLen;
    return {
      ch,
      x: (nCols - 1) * colStep / 2 - col * colStep,
      y: -textH / 2 + step / 2 + row * step
    };
  });
  const drawChars = (mode, dy = 0) => {
    pos.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y + dy);
      if (VERT_ROT.has(p.ch)) ctx.rotate(Math.PI / 2);
      if (mode === 'stroke') ctx.strokeText(p.ch, 0, 0); else ctx.fillText(p.ch, 0, 0);
      ctx.restore();
    });
  };

  if (edit.shape === 'A') {
    // 座布団型（赤ベタ＋影）
    const bw = textW + size * .55, bh = textH + size * .6, off = size * .13;
    ctx.fillStyle = '#262019';
    rr(-bw / 2 + off, -bh / 2 + off, bw, bh, size * .2); ctx.fill();
    ctx.fillStyle = '#b3362f';
    rr(-bw / 2, -bh / 2, bw, bh, size * .2); ctx.fill();
    ctx.lineWidth = size * .1; ctx.strokeStyle = '#262019'; ctx.stroke();
    ctx.fillStyle = '#fff';
    drawChars('fill');
  } else if (edit.shape === 'B') {
    // 縁取り型（白フチ＋影）
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * .2;
    ctx.strokeStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowOffsetX = size * .12;
    ctx.shadowOffsetY = size * .16;
    ctx.shadowBlur = size * .16;
    drawChars('stroke');
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1d1712';
    drawChars('fill');
  } else {
    // 掛け軸型（和紙地＋落款）
    const bw = textW + size * .8, bh = textH + size * 1.3;
    ctx.fillStyle = 'rgba(255,252,242,.92)';
    rr(-bw / 2, -bh / 2, bw, bh, size * .22); ctx.fill();
    ctx.lineWidth = size * .09; ctx.strokeStyle = '#262019'; ctx.stroke();
    ctx.fillStyle = '#262019';
    drawChars('fill', -size * .3);
    // 落款
    const rw = size * .62, rh = size * .78;
    const rx = -bw / 2 + size * .18, ry = bh / 2 - rh - size * .18;
    ctx.fillStyle = '#b3362f';
    rr(rx, ry, rw, rh, size * .1); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${size * .3}px ${fam}`;
    ctx.fillText('酒', rx + rw / 2, ry + rh * .3);
    ctx.fillText('育', rx + rw / 2, ry + rh * .72);
  }
  ctx.restore();
}

// ---------- 保存完了・進化演出（3D風ド派手版） ----------
const CONFETTI_COLORS = ['#e8a33d', '#b3362f', '#3b5b8c', '#7d9b4e', '#efc75e', '#fffcf2'];
function spawnConfetti(n) {
  const layer = document.getElementById('celebrateConfetti');
  layer.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const x0 = Math.random() * 100;
    p.style.setProperty('--x0', x0 + 'vw');
    p.style.setProperty('--x1', (x0 + (Math.random() * 40 - 20)) + 'vw');
    p.style.setProperty('--rz', (Math.random() * 900 + 360) + 'deg');
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    p.style.animationDelay = (Math.random() * .5) + 's';
    p.style.width = (7 + Math.random() * 7) + 'px';
    p.style.height = (10 + Math.random() * 8) + 'px';
    layer.appendChild(p);
  }
}
function spawnRings(n) {
  const box = document.getElementById('celebrateRings');
  box.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const r = document.createElement('b');
    r.style.animationDelay = (i * .22) + 's';
    box.appendChild(r);
  }
}
function showCelebrate(pts, prevLv, newLv, first, bonusLabel, postMsg) {
  const evolved = newLv > prevLv;
  const c = CHARACTERS[state.buddy];
  const cel = document.getElementById('celebrate');
  document.getElementById('celebrateChar').innerHTML = charSvgInline(state.buddy, newLv);
  document.getElementById('celebrateChar').className =
    'celebrateChar ' + (evolved ? 'evolve3d' : 'pop3d');
  document.getElementById('celebrateRays').className =
    'celebrateRays' + (evolved ? ' big' : '');
  document.getElementById('celebrateFlash').className =
    'celebrateFlash' + (evolved ? ' go' : '');
  spawnRings(evolved ? 3 : 0);
  spawnConfetti(evolved ? 40 : (first ? (bonusLabel ? 30 : 18) : 0));
  document.getElementById('celebrateTitle').textContent =
    evolved ? `${c.levels[newLv - 1].name} に進化！！` : '今日も乾杯！';
  document.getElementById('celebratePts').textContent =
    evolved ? 'ドドーン！！'
    : first ? (bonusLabel ? `「${bonusLabel}」ボーナスでグングン育った！` : '相棒がそだった！')
    : '（育つのは1日1回だよ）';
  document.getElementById('celebrateNote').textContent =
    (evolved ? c.levels[newLv - 1].sub + '　' : '') + (postMsg || 'また明日、乾杯🍻');
  const sb = document.getElementById('btnSaveRoll');
  sb.disabled = false;
  sb.textContent = '📥 カメラロールに保存';
  cel.hidden = false;
}
// ---------- ストーリー用共有（1080x1920 縦長に自動レイアウト） ----------
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}
async function buildStoryCanvas() {
  const W = 1080, H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // 夜の墨色グラデ＋金の粒
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2c2438'); g.addColorStop(.6, '#1d1826'); g.addColorStop(1, '#141019');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(232,163,61,${(Math.random() * .4 + .1).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 4 + 1.5, 0, 7);
    ctx.fill();
  }
  // 完成写真を白フチ＋角丸で中央に
  const pw = 920, ph = pw * 4 / 3;
  const px = (W - pw) / 2, py = (H - ph) / 2 + 30;
  ctx.save();
  rrPath(ctx, px - 12, py - 12, pw + 24, ph + 24, 40);
  ctx.fillStyle = '#fffcf2'; ctx.fill();
  ctx.restore();
  ctx.save();
  rrPath(ctx, px, py, pw, ph, 30); ctx.clip();
  ctx.drawImage(lastShot, px, py, pw, ph);
  ctx.restore();
  // 上下の文字（書道）
  const fam = `"${fontFamily()}", serif`;
  await document.fonts.load('66px ' + fam, appTitle());
  ctx.textAlign = 'center';
  ctx.font = '66px ' + fam;
  ctx.fillStyle = '#e8a33d';
  ctx.fillText(appTitle(), W / 2, py - 60);
  ctx.font = '42px ' + fam;
  ctx.fillStyle = 'rgba(255,252,242,.9)';
  ctx.fillText('また明日、乾杯 🍻', W / 2, py + ph + 96);
  return cv;
}
async function shareStory() {
  if (!lastShot) return;
  const cv = await buildStoryCanvas();
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .92));
  const file = new File([blob], 'sake_story.jpg', { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sake_story.jpg';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
document.getElementById('btnStory').onclick = async () => {
  const b = document.getElementById('btnStory');
  b.disabled = true; b.textContent = '作成中…';
  try { await shareStory(); } catch (e) { alert('共有に失敗しちゃった… ' + e.message); }
  b.disabled = false; b.textContent = '📤 ストーリー用に共有';
};

document.getElementById('btnCelebrateOk').onclick = () => {
  document.getElementById('celebrate').hidden = true;
  // 次回のアニメが再発火するようにリセット
  document.getElementById('celebrateChar').className = 'celebrateChar';
  document.getElementById('celebrateFlash').className = 'celebrateFlash';
  document.getElementById('celebrateRays').className = 'celebrateRays';
  document.getElementById('celebrateConfetti').innerHTML = '';
  document.getElementById('celebrateRings').innerHTML = '';
  goHome();
};

// ---------- アルバム ----------
function renderAlbum() {
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';
  const recs = [...state.records].reverse();
  if (!recs.length) {
    grid.innerHTML = '<div class="albumEmpty" style="grid-column:1/-1">まだ一枚もないよ。<br>今夜、最初の乾杯をパシャっとしよう🍻</div>';
    return;
  }
  recs.forEach((r, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `<img src="${r.thumb}" alt=""><div class="d">${r.date.replaceAll('-', '.')}</div>`;
    cell.onclick = () => openViewer(r);
    grid.appendChild(cell);
  });
}
function openViewer(r) {
  document.getElementById('viewerDate').textContent = fmtDt(r.ts);
  document.getElementById('viewerImg').src = r.thumb;
  const c = CHARACTERS[r.charId];
  document.getElementById('viewerInfo').innerHTML =
    `「${r.phrase}」<br>相棒: ${c.name}`;
  document.getElementById('albumViewer').hidden = false;
}
document.getElementById('btnViewerClose').onclick = () => { document.getElementById('albumViewer').hidden = true; };
document.getElementById('btnAlbumBack').onclick = goHome;

// ---------- 相棒ステータス／切替 ----------
function renderBuddy() {
  const curPts = state.buddyPoints[state.buddy] || 0;
  const canSwitch = levelOf(curPts) >= 5;
  document.getElementById('buddyRule').textContent = canSwitch
    ? '相棒が育ちきった！次の子を迎えられるよ（育てた子はいつでも戻せる）'
    : '相棒制：いまの子がLv.5まで育ちきったら、次の子を解放できるよ';
  const grid = document.getElementById('buddyCards');
  grid.innerHTML = '';
  CHAR_ORDER.forEach(id => {
    const c = CHARACTERS[id];
    const pts = state.buddyPoints[id] || 0;
    const lv = levelOf(pts);
    const isCur = id === state.buddy;
    const locked = !isCur && !canSwitch;
    const pct = lv >= 5 ? 100 : Math.round((pts - LEVEL_THRESHOLDS[lv - 1]) / (LEVEL_THRESHOLDS[lv] - LEVEL_THRESHOLDS[lv - 1]) * 100);
    const card = document.createElement('div');
    card.className = 'charCard' + (isCur ? ' selected' : '') + (locked ? ' locked' : '');
    card.innerHTML = `${isCur ? '<span class="badge">相棒</span>' : ''}${charSvgInline(id, lv)}
      <div class="nm">${c.levels[lv - 1].name}</div>
      <div class="mt">${c.motif}／Lv.${lv}</div>
      <div class="cardBar"><i style="width:${pct}%"></i></div>`;
    if (!locked && !isCur) {
      card.onclick = () => {
        state.buddy = id;
        state.buddyPoints[id] = state.buddyPoints[id] || 0;
        saveState();
        renderBuddy();
      };
    }
    grid.appendChild(card);
  });
}
document.getElementById('btnBuddyBack').onclick = goHome;

// ---------- 酒ルーレット ----------
const ROULETTE_ITEMS = [
  { label: 'ビール',   color: '#e8a33d', bonus: 2,  stars: '★' },
  { label: 'テキーラ', color: '#7d9b4e', bonus: 4,  stars: '★★' },
  { label: 'ブーブ',   color: '#b3362f', bonus: 8,  stars: '★★★' },
  { label: 'ドンペリ', color: '#3b5b8c', bonus: 15, stars: '★★★★★' },
  { label: 'スナック', color: '#c9403a', bonus: 5,  stars: '★★' },
  { label: '赤ワイン', color: '#6e211b', bonus: 3,  stars: '★' }
];
let wheelAngle = 0, spinning = false, wheelBuilt = false;

function buildWheel() {
  const n = ROULETTE_ITEMS.length, R = 98;
  let parts = '';
  ROULETTE_ITEMS.forEach((it, i) => {
    const a0 = (i * 360 / n - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 360 / n - 90) * Math.PI / 180;
    const x0 = 100 + R * Math.cos(a0), y0 = 100 + R * Math.sin(a0);
    const x1 = 100 + R * Math.cos(a1), y1 = 100 + R * Math.sin(a1);
    parts += `<path d="M100 100 L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} z" fill="${it.color}" stroke="#262019" stroke-width="2.5"/>`;
    const mid = (i + .5) * 360 / n;
    parts += `<text x="100" y="40" text-anchor="middle" transform="rotate(${mid} 100 100)" fill="#fffcf2" font-size="14" font-family="'Yuji Boku','Yuji Syuku',serif">${it.label}</text>`;
  });
  document.getElementById('wheel').innerHTML =
    `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="${R}" fill="none" stroke="#262019" stroke-width="5"/>${parts}` +
    `<circle cx="100" cy="100" r="15" fill="#fffcf2" stroke="#262019" stroke-width="3"/>` +
    `<text x="100" y="105.5" text-anchor="middle" font-size="13" fill="#262019" font-family="'Yuji Boku',serif">酒</text></svg>`;
  wheelBuilt = true;
}

function spinRoulette() {
  if (spinning) return;
  spinning = true;
  const res = document.getElementById('rouletteResult');
  res.textContent = '';
  const n = ROULETTE_ITEMS.length;
  const win = Math.floor(Math.random() * n);
  const jitter = Math.random() * 36 - 18;
  // 当たりセクター中心が針（真上）に来る絶対角度へ、4回転以上足して着地
  const d = ((360 - (win + .5) * 360 / n + jitter) % 360 + 360) % 360;
  let target = wheelAngle + 1440;
  target += ((d - (target % 360)) % 360 + 360) % 360;
  wheelAngle = target;
  const wheel = document.getElementById('wheel');
  wheel.style.transition = 'transform 3.2s cubic-bezier(.12,.72,.08,1)';
  wheel.style.transform = `rotate(${target}deg)`;
  setTimeout(() => {
    spinning = false;
    const it = ROULETTE_ITEMS[win];
    // 今日のボーナスとして記憶（その日のうちに撮ると相棒がグッと育つ）
    state.roulette = { date: todayStr(), label: it.label, bonus: it.bonus };
    saveState();
    res.innerHTML = `今夜は「${it.label}」！🍻<div class="rouletteBonus">育ちボーナス ${it.stars}</div>`;
    if (it.bonus >= 8) fireJackpot(it);   // ブーブ・ドンペリは大当たり演出
  }, 3300);
}

// パチンコ風大当たり演出（ストロボ＋高速回転光＋キラキラ降下＋シェイク。ドンペリは虹色）
function fireJackpot(it) {
  const jp = document.getElementById('jackpot');
  jp.classList.toggle('rainbow', it.bonus >= 15);
  document.getElementById('jpText').textContent =
    it.bonus >= 15 ? `激アツ！！\n${it.label}大当たり！` : `大当たり！！\n${it.label}`;
  const stars = document.getElementById('jpStars');
  stars.innerHTML = '';
  const glyphs = ['✦', '✧', '★', '🍾', '✨', '🥂'];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('i');
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.fontSize = (16 + Math.random() * 28) + 'px';
    s.style.animationDuration = (1.2 + Math.random() * 1.8) + 's';
    s.style.animationDelay = (Math.random() * .9) + 's';
    stars.appendChild(s);
  }
  jp.hidden = false;
  const inner = document.querySelector('#rouletteSheet .sheetInner');
  inner.classList.add('shake');
  setTimeout(() => {
    jp.hidden = true;
    inner.classList.remove('shake');
  }, 3200);
}

document.getElementById('btnRouletteOpen').onclick = () => {
  if (!wheelBuilt) buildWheel();
  document.getElementById('rouletteResult').textContent = '';
  document.getElementById('rouletteSheet').hidden = false;
};
document.getElementById('btnRouletteClose').onclick = () => { document.getElementById('rouletteSheet').hidden = true; };
document.getElementById('wheel').addEventListener('click', spinRoulette);

// ---------- 乾杯フィード（フレンド機能） ----------
async function api(path, method = 'GET', body) {
  const r = await fetch(API_BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'api'); e.code = r.status; throw e; }
  return d;
}
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'たったいま';
  if (m < 60) return `${m}分前`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}時間前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function renderVisSeg() {
  document.querySelectorAll('#visSeg button').forEach(b =>
    b.classList.toggle('on', b.dataset.v === state.share.vis));
}
document.querySelectorAll('#visSeg button').forEach(b => {
  b.onclick = () => { state.share.vis = b.dataset.v; saveState(); renderVisSeg(); };
});

async function renderFeed() {
  const listEl = document.getElementById('feedList');
  listEl.innerHTML = '<div class="albumEmpty">よみこみ中…🍶</div>';
  try {
    const d = await api(`/feed?uid=${state.uid}`);
    state.friendsCache = d.friends;
    saveState();
    renderFriendChips(d.friends);
    if (!d.items.length) {
      listEl.innerHTML = '<div class="albumEmpty">まだ誰の乾杯もないよ。<br>右下の📸で乾杯を投稿したり、👥から友達を追加してみよう🍻</div>';
      return;
    }
    listEl.innerHTML = '';
    d.items.forEach(m => listEl.appendChild(feedCardEl(m, false)));
  } catch (e) {
    listEl.innerHTML = '<div class="albumEmpty">よみこめなかった…😢<br>電波を確認して🔄で更新してみて</div>';
  }
}
document.getElementById('btnFeedReload').onclick = renderFeed;

// 1件のフィードカードを組み立て（admin=true なら投稿者名とuidも表示・常に削除可）
function feedCardEl(m, admin) {
  const c = CHARACTERS[m.charId];
  const mine = m.uid === state.uid;
  const div = document.createElement('div');
  div.className = 'feedCard';
  const capHtml = m.caption ? `<div class="feedCaption">${esc(m.caption)}</div>` : '';
  const delBtn = (mine || admin) ? `<button class="feedDel">🗑 削除</button>` : '';
  div.innerHTML = `<img loading="lazy" src="${esc(m.img)}" alt="">
    <div class="feedMeta"><b>${esc(m.name)}</b> × ${c ? c.levels[(m.lv || 1) - 1].name : '相棒'}
    <span class="feedTime">${timeAgo(m.ts)}${mine ? '・自分' : ''}${m.vis === 'all' ? '・みんな公開' : '・友達だけ'}</span><br>
    <span class="fCal">乾杯 ${m.dayN}日目</span>　「${esc(m.phrase)}」${capHtml}
    ${admin ? `<div class="feedTime">uid:${esc(m.uid)}</div>` : ''}</div>
    ${delBtn ? `<div class="feedActions">${delBtn}</div>` : ''}`;
  const db = div.querySelector('.feedDel');
  if (db) db.onclick = async () => {
    if (!confirm('この投稿を削除する？もとに戻せないよ')) return;
    db.disabled = true; db.textContent = '削除中…';
    try {
      await api('/delete', 'POST', { requesterUid: state.uid, targetUid: m.uid, ts: m.ts, adminKey: admin ? ADMIN_KEY : undefined });
      div.remove();
    } catch (e) { db.disabled = false; db.textContent = '🗑 削除'; alert('削除できなかった…電波を確認してもう一回'); }
  };
  return div;
}

// ---------- 管理者画面（全ユーザーの投稿を見る・消せる） ----------
async function openAdmin() {
  show('screen-admin');
  await renderAdmin();
}
async function renderAdmin() {
  const listEl = document.getElementById('adminList');
  const info = document.getElementById('adminInfo');
  listEl.innerHTML = '<div class="albumEmpty">よみこみ中…🍶</div>';
  try {
    const d = await api(`/admin?key=${encodeURIComponent(ADMIN_KEY)}`);
    info.textContent = `全ユーザーの投稿 ${d.items.length}件（新しい順）`;
    if (!d.items.length) { listEl.innerHTML = '<div class="albumEmpty">まだ投稿がないよ</div>'; return; }
    listEl.innerHTML = '';
    d.items.forEach(m => listEl.appendChild(feedCardEl(m, true)));
  } catch (e) {
    listEl.innerHTML = '<div class="albumEmpty">よみこめなかった…😢<br>キーが違うか、電波を確認して🔄</div>';
  }
}
document.getElementById('btnAdminBack').onclick = goHome;
document.getElementById('btnAdminReload').onclick = renderAdmin;

// ---------- フレンドコード（コピペで追加。リンクを開く必要なし＝アプリ内ブラウザ・Wi-Fi無関係） ----------
function encodeCode(uid, name) {
  const b64 = btoa(unescape(encodeURIComponent(uid + '.' + name)));
  return 'SAKE-' + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeCode(code) {
  try {
    let s = String(code).trim().replace(/^SAKE-/i, '').replace(/\s+/g, '');
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const raw = decodeURIComponent(escape(atob(s)));
    const i = raw.indexOf('.');
    if (i < 0) return null;
    const uid = raw.slice(0, i), name = raw.slice(i + 1);
    if (!/^[a-f0-9]{24,64}$/.test(uid) || !name) return null;
    return { uid, name };
  } catch (e) { return null; }
}
function myCode() { return encodeCode(state.uid, state.userName); }

// 招待リンク（本番URL固定。リンクでもコードでも追加できる）
function inviteLink() {
  return SITE_URL + '#invite=' + state.uid + '.' + encodeURIComponent(state.userName);
}
function inviteMsg() {
  return `${state.userName}と乾杯フレンドになろう🍻\n①リンクをタップ（Safari推奨）\n${inviteLink()}\n\nうまくいかない時は、このコードをアプリの「友達のコードで追加」に貼ってね👇\n${myCode()}`;
}
// 招待はOSの共有シート1本（LINE公式に飛ぶ line.me/R/share は使わない）
// リンク＋コードのメッセージをまるごと共有 → 相手はLINE/インスタ/メッセージ等どれでも選べる
document.getElementById('btnInvite').onclick = async () => {
  const msg = inviteMsg();
  if (navigator.share) {
    try { await navigator.share({ text: msg }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(msg); alert('招待メッセージをコピーしたよ！\nLINEやインスタに貼り付けて送ってね🍻'); }
  catch (e) { prompt('この招待メッセージを友達に送ってね', msg); }
};

// フレンドチップ（フィード上部・タップでフレンド画面へ）
function renderFriendChips(list) {
  const el = document.getElementById('friendChips');
  if (!list || !list.length) {
    el.innerHTML = '<span class="friendChip none">まだフレンドがいないよ。タップして追加👥</span>';
  } else {
    el.innerHTML = `<span class="friendChip label">👥 フレンド ${list.length}人</span>` +
      list.map(f => `<span class="friendChip">${esc(f.name || '？')}</span>`).join('');
  }
}
document.getElementById('friendChips').onclick = openFriends;

// ---------- フレンド画面 ----------
function openFriends() {
  document.getElementById('myCode').textContent = myCode();
  document.getElementById('codeInput').value = '';
  renderFriendListFull(state.friendsCache || []);
  show('screen-friends');
  refreshFriends();          // サーバーから最新を取り直す
}
function renderFriendListFull(list) {
  const el = document.getElementById('friendListFull');
  if (!list || !list.length) {
    el.innerHTML = '<div class="friendEmpty">まだフレンドがいないよ🍶<br>上のコードを送るか、友達のコードを貼り付けて追加してね</div>';
    return;
  }
  el.innerHTML = list.map(f => `<div class="friendRow"><span class="fav">🍶</span>${esc(f.name || '？')}</div>`).join('');
}
async function refreshFriends() {
  try {
    const d = await api(`/feed?uid=${state.uid}`);
    state.friendsCache = d.friends; saveState();
    renderFriendListFull(d.friends);
    renderFriendChips(d.friends);
  } catch (e) { /* オフラインならキャッシュ表示のまま */ }
}
document.getElementById('btnToFriends').onclick = openFriends;
document.getElementById('btnFriendsBack').onclick = goHome;

document.getElementById('btnCopyCode').onclick = async () => {
  const b = document.getElementById('btnCopyCode');
  try {
    await navigator.clipboard.writeText(myCode());
    b.textContent = '✓ コピーしたよ！';
    setTimeout(() => { b.textContent = '📋 コードをコピー'; }, 1800);
  } catch (e) { prompt('このコードを友達に送ってね', myCode()); }
};

document.getElementById('btnAddByCode').onclick = async () => {
  const raw = document.getElementById('codeInput').value;
  if (raw.trim() === ADMIN_PHRASE) { document.getElementById('codeInput').value = ''; openAdmin(); return; }
  const inv = decodeCode(raw);
  if (!inv) { alert('コードが正しくないみたい🙏\nSAKE- から始まるコードを、まるごと貼り付けてね'); return; }
  const b = document.getElementById('btnAddByCode');
  b.disabled = true; b.textContent = '追加中…';
  const ok = await addFriendRequest(inv);
  b.disabled = false; b.textContent = '追加';
  if (ok) { document.getElementById('codeInput').value = ''; renderFriendListFull(state.friendsCache || []); }
};

// 共通：友達登録（コード・リンク両方から使う）
async function addFriendRequest(inv) {
  if (inv.uid === state.uid) { alert('それは自分のコードだよ😅\n友達に送ってね'); return false; }
  if ((state.friendsCache || []).some(f => f.uid === inv.uid)) { alert(`${inv.name}とはもう友達だよ🍻`); return false; }
  try {
    const d = await api('/friend', 'POST', { a: { uid: state.uid, name: state.userName }, b: inv });
    if (d.friends) { state.friendsCache = d.friends; saveState(); }
    alert(`${inv.name}と友達になった！🍻`);
    return true;
  } catch (e) {
    alert('友達登録に失敗しちゃった…電波のいいところでもう一度ためしてね');
    return false;
  }
}

let pendingInvite = null;
function clearInviteHash() {
  if (location.hash.startsWith('#invite=')) history.replaceState(null, '', location.pathname + location.search);
}
// LINE・インスタ等のアプリ内ブラウザはSafariと記憶が別なので、そこで登録させない
function inAppBrowser() {
  return /Line\/|Instagram|FBAN|FBAV|FB_IAB|Twitter/i.test(navigator.userAgent);
}
function handleInviteHash() {
  const m = location.hash.match(/^#invite=([a-f0-9]{24,64})\.(.+)$/);
  if (!m) return;
  const inv = { uid: m[1], name: decodeURIComponent(m[2]) };
  if (inAppBrowser()) {
    alert('LINEやインスタの中のブラウザだと友達登録が残らないよ🙏\n\n【かんたんな方法】メッセージにある「SAKE-…」のコードをコピーして、いつも使ってる酒育日記アプリを開き、👥フレンド →「友達のコードで追加」に貼り付けてね！\n\n（または、メニューの「Safariで開く」からこのリンクを開き直してもOK）');
    return;  // ハッシュは消さない（Safariで開き直すと引き継がれる）
  }
  if (!state.userName) { pendingInvite = inv; return; }  // 初回セットアップ後に処理
  acceptInvite(inv);
}
async function acceptInvite(inv) {
  if (inv.uid === state.uid) {
    clearInviteHash();
    alert('これは自分の招待リンクだよ😅 このリンクを友達に送ってね');
    return;
  }
  if (!confirm(`「${inv.name}」と乾杯フレンドになる？🍻`)) { clearInviteHash(); return; }
  const ok = await addFriendRequest(inv);
  if (ok) clearInviteHash();   // 失敗時はハッシュを残してリトライ可能に
}

// フィードへ投稿（1日2回まで・写真は縮小してアップ）
async function postToFeed() {
  if (!lastShot) throw new Error('no-photo');
  const cv = document.createElement('canvas');
  cv.width = 720; cv.height = 960;
  cv.getContext('2d').drawImage(lastShot, 0, 0, 720, 960);
  const img = cv.toDataURL('image/jpeg', .8).split(',')[1];
  const pts = state.buddyPoints[state.buddy] || 0;
  const caption = document.getElementById('captionInput').value.trim();
  return api('/post', 'POST', {
    uid: state.uid, name: state.userName,
    charId: state.buddy, lv: levelOf(pts), dayN: kanpaiDayN(),
    phrase: edit.phrase, caption, vis: state.share.vis, img
  });
}

// ---------- 開発用：デモ写真で編集画面を試す ----------
window.__demo = function () {
  const cv = document.createElement('canvas');
  cv.width = FINAL_W; cv.height = FINAL_H;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, FINAL_H);
  g.addColorStop(0, '#3a3148'); g.addColorStop(.55, '#241f2e'); g.addColorStop(1, '#151019');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FINAL_W, FINAL_H);
  ctx.font = '220px serif'; ctx.textAlign = 'center';
  ctx.fillText('🥂', FINAL_W * .32, FINAL_H * .74);
  ctx.font = '260px serif';
  ctx.fillText('😊', FINAL_W * .68, FINAL_H * .5);
  srcCanvas = cv;
  photoTs = Date.now();
  openEditor();
};

// ---------- 起動 ----------
document.querySelector('#svgDefs defs').innerHTML = SVG_DEFS;
updateTitle();
if (state.buddy && state.userName) { goHome(); }
else { renderStart(); show('screen-start'); }
handleInviteHash();
