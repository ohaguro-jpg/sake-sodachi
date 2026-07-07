// 酒育て日記 — メインロジック
// 育て方はA案（相棒制）: 1匹選んでずっと一緒、Lv5まで育ちきったら次を解放
// 写真本体はカメラロールへ保存、アプリ内はサムネイルのみ（localStorage）

const LS_KEY = 'sakeSodachi.v1';
const FINAL_W = 1080, FINAL_H = 1440;

let state = loadState();
let stream = null;
let camTimer = null;
let srcCanvas = null;      // 撮影原本（1080x1440にカバークロップ済み）
let photoTs = null;        // 撮影時刻（写真に焼き込む）
let edit = null;           // 編集中の状態

// ---------- state ----------
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && s.buddyPoints) return s;
  } catch (e) {}
  return {
    buddy: null,
    buddyPoints: {},           // charId -> 累計ポイント
    records: [],               // {date, ts, rank, phrase, pts, charId, thumb}
    settings: { font: 'boku', shape: 'A' }
  };
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

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

// ---------- 初回：相棒えらび ----------
let startPick = null;
function renderStart() {
  const grid = document.getElementById('startCards');
  grid.innerHTML = '';
  CHAR_ORDER.forEach(id => {
    const c = CHARACTERS[id];
    const card = document.createElement('div');
    card.className = 'charCard';
    card.innerHTML = `${charSvgInline(id, 1)}<div class="nm">${c.name}</div><div class="mt">${c.motif}／${c.levels[0].name}</div>`;
    card.onclick = () => {
      startPick = id;
      grid.querySelectorAll('.charCard').forEach(x => x.classList.remove('selected'));
      card.classList.add('selected');
      document.getElementById('btnStartConfirm').disabled = false;
    };
    grid.appendChild(card);
  });
}
document.getElementById('btnStartConfirm').onclick = () => {
  if (!startPick) return;
  state.buddy = startPick;
  state.buddyPoints[startPick] = state.buddyPoints[startPick] || 0;
  saveState();
  renderHome();
  show('screen-home');
};

// ---------- ホーム ----------
function renderHome() {
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
    lbl.textContent = '育ちきった！（相棒画面で次の子を迎えられるよ）';
  } else {
    const lo = LEVEL_THRESHOLDS[lv - 1], hi = LEVEL_THRESHOLDS[lv];
    bar.style.width = `${Math.round((pts - lo) / (hi - lo) * 100)}%`;
    lbl.textContent = `つぎの進化まで あと${hi - pts}pt`;
  }
  document.getElementById('statPoints').textContent = pts;
  document.getElementById('statDays').textContent = new Set(state.records.map(r => r.date)).size;
  document.getElementById('statStreak').textContent = streakDays();
  const st = document.getElementById('todayStatus');
  const btn = document.getElementById('btnShoot');
  if (hasRecordToday()) {
    st.innerHTML = '<span class="done">今日はもう乾杯済み 🍻</span>（撮り直してもポイントは1日1回だよ）';
    btn.textContent = '📸 おかわりでパシャ';
  } else {
    st.textContent = '今日の一枚、まだだよ';
    btn.textContent = '📸 今日のお酒と一緒にパシャ';
  }
}
document.getElementById('btnShoot').onclick = openCamera;
document.getElementById('btnToAlbum').onclick = () => { renderAlbum(); show('screen-album'); };
document.getElementById('btnToBuddy').onclick = () => { renderBuddy(); show('screen-buddy'); };

// ---------- 撮影 ----------
async function openCamera() {
  show('screen-camera');
  const err = document.getElementById('camError');
  err.hidden = true;
  const tick = () => { document.getElementById('camDt').textContent = fmtDt(Date.now()); };
  tick();
  camTimer = setInterval(tick, 1000);
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
  if (camTimer) { clearInterval(camTimer); camTimer = null; }
}
document.getElementById('btnCamClose').onclick = () => { renderHome(); show('screen-home'); };

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
    rot: Math.round(Math.random() * 14 - 7),
    fx: .32 + Math.random() * .36,
    fy: .28 + Math.random() * .4
  };
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
    chara: { fx: .8, fy: .8, size: 26, rot: 0 },
    selected: 'stamp'
  };
  drawEditCanvas();
  renderOverlays();
  show('screen-edit');
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
  // 日時（仕様: 写真にも焼き込む）
  ctx.save();
  ctx.font = `600 ${Math.round(W * .034)}px -apple-system, "Helvetica Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = W * .008;
  ctx.shadowOffsetY = W * .003;
  ctx.fillText(fmtDt(photoTs), W / 2, H * .052);
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
  const w = c.size * 4.6;
  oc.querySelector('svg').style.width = w + 'px';
  oc.querySelector('svg').style.height = w + 'px';
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
document.getElementById('btnSave').onclick = async () => {
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.textContent = '作成中…';
  try {
    await savePhoto();
  } catch (e) {
    alert('保存に失敗しちゃった…もう一度試してね\n' + e.message);
  }
  btn.disabled = false;
  btn.textContent = '保存する';
};

async function savePhoto() {
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

  // サムネイル（アプリ内保存用）
  const th = document.createElement('canvas');
  th.width = 270; th.height = 360;
  th.getContext('2d').drawImage(cv, 0, 0, 270, 360);
  const thumb = th.toDataURL('image/jpeg', .65);

  // 記録＆ポイント（1日1回）
  const first = !hasRecordToday();
  const pts = first ? BASE_POINTS : 0;
  const prevLv = levelOf(state.buddyPoints[state.buddy] || 0);
  if (first) state.buddyPoints[state.buddy] = (state.buddyPoints[state.buddy] || 0) + pts;
  const newLv = levelOf(state.buddyPoints[state.buddy] || 0);
  state.records.push({
    date: todayStr(new Date(photoTs)), ts: photoTs,
    phrase: edit.phrase, pts, charId: state.buddy, thumb
  });
  saveState();

  // カメラロールへ（share優先、だめならダウンロード）
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .92));
  const d = new Date(photoTs);
  const p = n => String(n).padStart(2, '0');
  const fname = `sake_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.jpg`;
  const file = new File([blob], fname, { type: 'image/jpeg' });
  let shared = false;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); shared = true; } catch (e) { /* キャンセル時はDLへ */ }
  }
  if (!shared) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  showCelebrate(pts, prevLv, newLv, first);
}

// 相棒スタンプを合成
async function drawCharaToCanvas(ctx, scale) {
  const c = edit.chara;
  const pts = state.buddyPoints[state.buddy] || 0;
  const svg = charSvgStandalone(state.buddy, levelOf(pts));
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const w = c.size * 4.6 * scale;
  ctx.save();
  ctx.translate(c.fx * FINAL_W, c.fy * FINAL_H);
  ctx.rotate(c.rot * Math.PI / 180);
  ctx.drawImage(img, -w / 2, -w / 2, w, w);
  ctx.restore();
  URL.revokeObjectURL(url);
}

// 書道スタンプを合成（形状A/B/C）
function drawStampToCanvas(ctx, scale) {
  const s = edit.stamp;
  const size = s.size * scale;
  const fam = `"${fontFamily()}", serif`;
  const text = edit.phrase;
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
  if (edit.shape === 'A') {
    const w = ctx.measureText(text).width;
    const bw = w + size * 1.2, bh = size * 1.66, off = size * .13;
    ctx.fillStyle = '#262019';
    rr(-bw / 2 + off, -bh / 2 + off, bw, bh, size * .2); ctx.fill();
    ctx.fillStyle = '#b3362f';
    rr(-bw / 2, -bh / 2, bw, bh, size * .2); ctx.fill();
    ctx.lineWidth = size * .1; ctx.strokeStyle = '#262019'; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 0, size * .06);
  } else if (edit.shape === 'B') {
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * .2;
    ctx.strokeStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowOffsetX = size * .12;
    ctx.shadowOffsetY = size * .16;
    ctx.shadowBlur = size * .16;
    ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1d1712';
    ctx.fillText(text, 0, 0);
  } else {
    // C: 掛け軸型（縦書き＋落款）
    const chars = [...text];
    const step = size * 1.18;
    const colH = chars.length * step;
    const bw = size * 1.9, bh = colH + size * 1.0;
    ctx.fillStyle = 'rgba(255,252,242,.92)';
    rr(-bw / 2, -bh / 2, bw, bh, size * .22); ctx.fill();
    ctx.lineWidth = size * .09; ctx.strokeStyle = '#262019'; ctx.stroke();
    ctx.fillStyle = '#262019';
    chars.forEach((ch, i) => {
      ctx.fillText(ch, size * .1, -bh / 2 + size * .85 + i * step);
    });
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

// ---------- 保存完了・進化演出 ----------
function showCelebrate(pts, prevLv, newLv, first) {
  const evolved = newLv > prevLv;
  const c = CHARACTERS[state.buddy];
  document.getElementById('celebrateChar').innerHTML = charSvgInline(state.buddy, newLv);
  document.getElementById('celebrateChar').className = 'celebrateChar' + (evolved ? ' evolve' : '');
  document.getElementById('celebrateBurst').innerHTML = evolved
    ? `<svg viewBox="0 0 120 120"><use href="#burst" transform="translate(60,60) scale(1.6)"/></svg>` : '';
  document.getElementById('celebrateTitle').textContent =
    evolved ? `${c.levels[newLv - 1].name} に進化！！` : '今日も乾杯！';
  document.getElementById('celebratePts').textContent =
    first ? `+${pts} pt` : 'ポイントは今日はもう獲得済み';
  document.getElementById('celebrateNote').textContent =
    evolved ? c.levels[newLv - 1].sub : '写真はカメラロールに保存したよ。また明日、乾杯🍻';
  document.getElementById('celebrate').hidden = false;
}
document.getElementById('btnCelebrateOk').onclick = () => {
  document.getElementById('celebrate').hidden = true;
  renderHome();
  show('screen-home');
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
    `「${r.phrase}」<br>+${r.pts}pt／相棒: ${c.name}`;
  document.getElementById('albumViewer').hidden = false;
}
document.getElementById('btnViewerClose').onclick = () => { document.getElementById('albumViewer').hidden = true; };
document.getElementById('btnAlbumBack').onclick = () => { renderHome(); show('screen-home'); };

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
      <div class="mt">${c.motif}／Lv.${lv}・${pts}pt</div>
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
document.getElementById('btnBuddyBack').onclick = () => { renderHome(); show('screen-home'); };

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
if (state.buddy) { renderHome(); show('screen-home'); }
else { renderStart(); show('screen-start'); }
