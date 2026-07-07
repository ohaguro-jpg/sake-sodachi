// 酒育て日記 — キャラクターSVGデータ（デザインシートv3より）＋フレーズ50選
// 仕様の正: Obsidian「プロジェクト/アプリ開発/酒育て日記アプリ.md」

// 共有defs（筆タッチフィルタ・顔パーツ・エフェクト）
const SVG_DEFS = `
<filter id="b1" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="turbulence" baseFrequency="0.07" numOctaves="3" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6.5"/>
</filter>
<filter id="b2" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" seed="13" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="7"/>
</filter>
<filter id="b3" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="turbulence" baseFrequency="0.08" numOctaves="3" seed="27" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6"/>
</filter>
<g id="f-busa">
  <ellipse cx="-9" cy="0" rx="3.6" ry="5" fill="#262019"/>
  <ellipse cx="9" cy="1" rx="3.2" ry="4.4" fill="#262019"/>
  <circle cx="-8" cy="-1.5" r="1.1" fill="#fff"/>
  <circle cx="9.8" cy="-0.4" r="1" fill="#fff"/>
  <path d="M-6 8 q3 3.5 6 0 q3 3.5 6 0" fill="none" stroke="#262019" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="-17" cy="6" r="3.6" fill="#ef9a94" opacity=".7"/>
  <circle cx="17" cy="6" r="3.6" fill="#ef9a94" opacity=".7"/>
</g>
<g id="f-happy">
  <path d="M-13 0 q3.5 -5 7 0" fill="none" stroke="#262019" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M6 0 q3.5 -5 7 0" fill="none" stroke="#262019" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-4 6 q4 6 8 0" fill="none" stroke="#262019" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="-17" cy="5" r="3.6" fill="#ef9a94" opacity=".7"/>
  <circle cx="17" cy="5" r="3.6" fill="#ef9a94" opacity=".7"/>
</g>
<g id="f-toro">
  <path d="M-13 -1 q3.5 4 7 0" fill="none" stroke="#262019" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M6 -1 q3.5 4 7 0" fill="none" stroke="#262019" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-6 7 q3 3.5 6 0 q3 3.5 6 0" fill="none" stroke="#262019" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="11" cy="13" r="2.4" fill="#8ec9e2"/>
  <circle cx="-17" cy="5" r="3.8" fill="#ea8680" opacity=".8"/>
  <circle cx="17" cy="5" r="3.8" fill="#ea8680" opacity=".8"/>
</g>
<path id="spark" d="M0 -6 L1.7 -1.7 6 0 1.7 1.7 0 6 -1.7 1.7 -6 0 -1.7 -1.7 z" fill="#e8a33d"/>
<g id="burst" opacity=".5">
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(45)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(90)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(135)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(180)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(225)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(270)"/>
  <path d="M0 -58 L5 -36 L-5 -36 z" fill="#efc75e" transform="rotate(315)"/>
</g>
<path id="bolt" d="M0 0 L8 -14 H2 L10 -28" fill="none" stroke="#e8a33d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
`;

// 各キャラ・各レベルの本体（viewBox 0 0 120 120 前提）
const CHARACTERS = {
  tokkuri: {
    name: 'とっくりん', motif: '日本酒',
    levels: [
      { name: 'おちょこ', sub: 'ぽつん…', body: `<g filter="url(#b1)">
        <ellipse cx="60" cy="96" rx="15" ry="3" fill="#262019" opacity=".12"/>
        <path d="M50 72 h20 l-4 18 h-12 z" fill="#f7efdc" class="o"/>
        <ellipse cx="60" cy="72" rx="11" ry="4" fill="#fffcf2" class="o" stroke-width="3"/>
        <use href="#f-busa" transform="translate(60,81) scale(.5)"/>
        <path d="M78 62 q3 5 0 9" class="o2" stroke="#7ab3d4"/>
      </g>` },
      { name: 'ことっくり', sub: 'あんよが生えた', body: `<g filter="url(#b2)">
        <path d="M55 46 h10 v9 q15 5 15 22 a20 18 0 0 1 -40 0 q0 -17 15 -22 z" fill="#f7efdc" class="o"/>
        <rect x="52" y="41" width="16" height="7" rx="3.5" fill="#3b5b8c" class="o" stroke-width="3"/>
        <path d="M52 96 v8 M68 96 v8" class="o2" stroke-width="3.6"/>
        <use href="#f-busa" transform="translate(60,76) scale(.8)"/>
      </g>` },
      { name: 'とっくりん', sub: '鉢巻＆腕組み', body: `<g filter="url(#b3)">
        <path d="M52 28 h16 v12 q20 6 20 30 a28 29 0 0 1 -56 0 q0 -24 20 -30 z" fill="#f7efdc" class="o"/>
        <rect x="49" y="23" width="22" height="8" rx="4" fill="#3b5b8c" class="o" stroke-width="3"/>
        <path d="M42 50 q18 -9 36 0" fill="none" stroke="#c9403a" stroke-width="7" stroke-linecap="round"/>
        <path d="M80 48 l8 -6 M80 50 l9 -2" class="o2" stroke="#c9403a" stroke-width="3"/>
        <path d="M38 74 q14 12 26 5 M82 74 q-14 12 -26 5" class="o" fill="none"/>
        <use href="#f-busa" transform="translate(60,64)"/>
      </g>` },
      { name: 'ますとっくり', sub: '枡の上で扇子', body: `<g filter="url(#b1)">
        <rect x="26" y="82" width="68" height="24" fill="#cfa06e" class="o"/>
        <rect x="34" y="87" width="52" height="14" fill="#e5c294"/>
        <path d="M52 20 h16 v11 q19 6 19 27 a27 25 0 0 1 -54 0 q0 -21 19 -27 z" fill="#f7efdc" class="o"/>
        <rect x="49" y="15" width="22" height="8" rx="4" fill="#3b5b8c" class="o" stroke-width="3"/>
        <path d="M86 44 l18 -12 q4 8 -4 15 z" fill="#e8a33d" class="o" stroke-width="3"/>
        <path d="M84 48 l6 -4" class="o2" stroke-width="3"/>
        <use href="#f-happy" transform="translate(60,54)"/>
        <ellipse cx="26" cy="36" rx="5" ry="3" fill="#f4b8c6" transform="rotate(25 26 36)"/>
        <ellipse cx="98" cy="70" rx="5" ry="3" fill="#f4b8c6" transform="rotate(-20 98 70)"/>
      </g>` },
      { name: '酒仙とっくり', sub: '雲に乗って後光', body: `<g filter="url(#b2)">
        <use href="#burst" transform="translate(60,58)"/>
        <ellipse cx="44" cy="100" rx="20" ry="8" fill="#fffcf2" class="o" stroke-width="3"/>
        <ellipse cx="74" cy="104" rx="22" ry="8" fill="#fffcf2" class="o" stroke-width="3"/>
        <circle cx="60" cy="28" r="13" fill="none" stroke="#d9a531" stroke-width="4"/>
        <path d="M50 22 h20 v12 q22 7 22 31 a31 28 0 0 1 -62 0 q0 -24 20 -31 z" fill="#f7efdc" class="o"/>
        <rect x="47" y="17" width="26" height="9" rx="4.5" fill="#3b5b8c" class="o" stroke-width="3"/>
        <use href="#f-busa" transform="translate(60,58)"/>
        <path d="M46 70 q14 14 28 0 q-4 20 -14 23 q-10 -3 -14 -23 z" fill="#fffcf2" class="o" stroke-width="3"/>
        <path d="M40 50 q5 -4 10 -1 M70 49 q5 -3 10 2" class="o2" stroke="#fffcf2" stroke-width="3.6"/>
        <use href="#spark" transform="translate(18,24)"/>
        <use href="#spark" transform="translate(102,36) scale(.8)"/>
      </g>` }
    ]
  },
  awa: {
    name: 'あわまる', motif: 'ビール',
    levels: [
      { name: 'ひとあわ', sub: 'ぷくっ', body: `<g filter="url(#b2)">
        <ellipse cx="60" cy="94" rx="13" ry="3" fill="#262019" opacity=".12"/>
        <circle cx="60" cy="78" r="13" fill="#fbf3dd" class="o"/>
        <circle cx="78" cy="64" r="3" fill="#fffcf2" class="o" stroke-width="2.4"/>
        <use href="#f-busa" transform="translate(60,78) scale(.52)"/>
      </g>` },
      { name: 'ふたあわ', sub: '腕が生えた', body: `<g filter="url(#b3)">
        <circle cx="60" cy="80" r="21" fill="#fbf3dd" class="o"/>
        <circle cx="60" cy="50" r="15" fill="#fbf3dd" class="o"/>
        <path d="M40 76 q-8 4 -10 10 M80 76 q8 4 10 10" class="o" fill="none"/>
        <circle cx="88" cy="52" r="4" fill="#fffcf2" class="o" stroke-width="2.4"/>
        <circle cx="30" cy="62" r="3" fill="#fffcf2" class="o" stroke-width="2.4"/>
        <use href="#f-busa" transform="translate(60,52) scale(.72)"/>
      </g>` },
      { name: 'ジョッキあわ', sub: '泡アーム', body: `<g filter="url(#b1)">
        <rect x="38" y="56" width="44" height="46" rx="7" fill="#e8a33d" class="o"/>
        <path d="M82 66 q17 10 0 26" fill="none" stroke="#262019" stroke-width="7" stroke-linecap="round"/>
        <circle cx="50" cy="80" r="3" fill="#fffcf2" opacity=".8"/>
        <circle cx="66" cy="90" r="2.6" fill="#fffcf2" opacity=".8"/>
        <circle cx="46" cy="50" r="10" fill="#fbf3dd" class="o"/>
        <circle cx="74" cy="50" r="9" fill="#fbf3dd" class="o"/>
        <circle cx="60" cy="42" r="13" fill="#fbf3dd" class="o"/>
        <circle cx="32" cy="40" r="6" fill="#fbf3dd" class="o" stroke-width="3"/>
        <circle cx="88" cy="40" r="6" fill="#fbf3dd" class="o" stroke-width="3"/>
        <use href="#f-happy" transform="translate(60,44) scale(.68)"/>
      </g>` },
      { name: 'もこあわ', sub: 'ホップの冠', body: `<g filter="url(#b2)">
        <path d="M24 78 q-6 -20 14 -23 q2 -19 22 -19 q20 0 22 19 q20 3 14 23 q-2 17 -36 17 q-34 0 -36 -17 z" fill="#fbf3dd" class="o"/>
        <path d="M56 32 q8 -14 20 -8 q-3 14 -19 12 z" fill="#7d9b4e" class="o" stroke-width="3"/>
        <path d="M64 34 q14 -8 24 0 q-8 10 -24 4 z" fill="#8fb060" class="o" stroke-width="3" transform="rotate(18 70 36)"/>
        <use href="#f-busa" transform="translate(60,64)"/>
        <circle cx="96" cy="88" r="4" fill="#fffcf2" class="o" stroke-width="2.4"/>
        <circle cx="22" cy="52" r="3.4" fill="#fffcf2" class="o" stroke-width="2.4"/>
      </g>` },
      { name: 'あわキング', sub: '雷鳴の巨神', body: `<g filter="url(#b3)">
        <rect x="30" y="66" width="60" height="42" rx="7" fill="#d9a531" class="o"/>
        <rect x="37" y="72" width="7" height="28" rx="3.5" fill="#fffcf2" opacity=".55"/>
        <circle cx="40" cy="52" r="13" fill="#fbf3dd" class="o"/>
        <circle cx="80" cy="52" r="12" fill="#fbf3dd" class="o"/>
        <circle cx="60" cy="40" r="17" fill="#fbf3dd" class="o"/>
        <path d="M42 16 l6 10 8 -13 8 13 6 -10 v12 h-28 z" fill="#d9a531" class="o" stroke-width="3.4"/>
        <use href="#bolt" transform="translate(14,72)"/>
        <use href="#bolt" transform="translate(112,72) scale(-1,1)"/>
        <use href="#f-busa" transform="translate(60,44) scale(.8)"/>
        <use href="#spark" transform="translate(20,32)"/>
        <use href="#spark" transform="translate(102,28) scale(.8)"/>
      </g>` }
    ]
  },
  puchi: {
    name: 'ぷちくん', motif: 'シャンパン',
    levels: [
      { name: 'こコルク', sub: '転がってる…', body: `<g filter="url(#b3)">
        <ellipse cx="60" cy="94" rx="16" ry="3" fill="#262019" opacity=".12"/>
        <g transform="rotate(88 60 82)">
          <ellipse cx="60" cy="72" rx="12" ry="7" fill="#cfa06e" class="o" stroke-width="3"/>
          <path d="M53 75 h14 l-1.5 20 a6.5 4 0 0 1 -11 0 z" fill="#e3bf8d" class="o" stroke-width="3"/>
        </g>
        <use href="#f-busa" transform="translate(66,80) scale(.5) rotate(12)"/>
        <circle cx="60" cy="52" r="1.6" fill="#262019"/>
        <circle cx="67" cy="50" r="1.6" fill="#262019"/>
        <circle cx="74" cy="49" r="1.6" fill="#262019"/>
      </g>` },
      { name: 'ミュズレぼうし', sub: '立った！', body: `<g filter="url(#b1)">
        <ellipse cx="60" cy="36" rx="9" ry="4.5" fill="#b8c4cc" class="o" stroke-width="3"/>
        <path d="M52 38 q-6 6 -8 14 M68 38 q6 6 8 14 M60 40 v12" class="o2" stroke="#7d919c"/>
        <ellipse cx="60" cy="52" rx="18" ry="10" fill="#cfa06e" class="o"/>
        <path d="M49 56 h22 l-2 32 a9 6 0 0 1 -18 0 z" fill="#e3bf8d" class="o"/>
        <use href="#f-busa" transform="translate(60,70) scale(.78)"/>
      </g>` },
      { name: 'はねコルク', sub: '飛んだ！', body: `<g filter="url(#b2)">
        <path d="M18 96 l16 -10 M14 84 l14 -8 M26 104 l14 -9" class="o2" stroke-width="3"/>
        <g transform="rotate(-18 60 60)">
          <path d="M42 56 q-18 -8 -14 -24 q14 2 17 16 z" fill="#fffcf2" class="o" stroke-width="3.4"/>
          <path d="M78 56 q18 -8 14 -24 q-14 2 -17 16 z" fill="#fffcf2" class="o" stroke-width="3.4"/>
          <ellipse cx="60" cy="44" rx="17" ry="9.5" fill="#cfa06e" class="o"/>
          <path d="M50 48 h20 l-2 28 a8.5 5.5 0 0 1 -16 0 z" fill="#e3bf8d" class="o"/>
          <use href="#f-happy" transform="translate(60,60) scale(.74)"/>
        </g>
      </g>` },
      { name: 'グラスのり', sub: '波乗りグラス', body: `<g filter="url(#b1)">
        <path d="M18 84 q10 -10 16 0 M86 84 q10 -10 16 0" class="o2" stroke="#7ab3d4" stroke-width="3.4"/>
        <path d="M30 68 q0 24 30 24 q30 0 30 -24 z" fill="#e9f2f6" class="o"/>
        <line x1="60" y1="92" x2="60" y2="106" class="o2" stroke-width="3.4"/>
        <circle cx="46" cy="78" r="2.2" fill="#b9dcec"/>
        <circle cx="72" cy="82" r="1.8" fill="#b9dcec"/>
        <path d="M40 52 q-8 -2 -12 -8 M80 52 q8 -2 12 -8" class="o" fill="none" stroke-width="3.4"/>
        <ellipse cx="60" cy="40" rx="15" ry="8.5" fill="#cfa06e" class="o"/>
        <path d="M51 44 h18 l-1.5 24 a8 5 0 0 1 -15 0 z" fill="#e3bf8d" class="o"/>
        <use href="#f-happy" transform="translate(60,56) scale(.66)"/>
        <use href="#spark" transform="translate(94,28) scale(.8)"/>
      </g>` },
      { name: 'シャンパンロケット', sub: '祝砲発射！', body: `<g filter="url(#b2)">
        <use href="#burst" transform="translate(74,44)"/>
        <g transform="rotate(40 36 96)">
          <path d="M28 74 h16 v8 q13 5 13 20 h-42 q0 -15 13 -20 z" fill="#d9a531" class="o" stroke-width="3.4"/>
        </g>
        <path d="M46 74 l16 -18 M40 62 l10 -6 M58 84 l8 -16" class="o2" stroke="#c9a13b" stroke-width="3"/>
        <circle cx="56" cy="50" r="3" fill="#e8a33d"/>
        <circle cx="46" cy="44" r="2.2" fill="#e8a33d"/>
        <path d="M62 38 q-14 -6 -12 -18 q12 1 14 12 z" fill="#fffcf2" class="o" stroke-width="3.4" transform="rotate(28 62 30)"/>
        <ellipse cx="80" cy="28" rx="13" ry="7.5" fill="#cfa06e" class="o" stroke-width="3.4"/>
        <path d="M72 31 h16 l-1.5 18 a7 4.5 0 0 1 -13 0 z" fill="#e3bf8d" class="o" stroke-width="3.4"/>
        <use href="#f-happy" transform="translate(80,41) scale(.58)"/>
        <use href="#spark" transform="translate(104,60)"/>
        <use href="#spark" transform="translate(24,28) scale(.8)"/>
      </g>` }
    ]
  },
  ume: {
    name: 'うめさん', motif: '梅酒',
    levels: [
      { name: 'あおうめ', sub: 'まだ青い', body: `<g filter="url(#b1)">
        <ellipse cx="60" cy="94" rx="13" ry="3" fill="#262019" opacity=".12"/>
        <circle cx="60" cy="78" r="13" fill="#a8c576" class="o"/>
        <path d="M62 66 q0 -6 4 -9" class="o2"/>
        <path d="M66 56 q9 -3 11 5 q-8 4 -11 -5 z" fill="#7d9b4e" class="o" stroke-width="3"/>
        <use href="#f-busa" transform="translate(60,79) scale(.55)"/>
      </g>` },
      { name: 'ほしうめ', sub: '熟してきた', body: `<g filter="url(#b2)">
        <circle cx="60" cy="70" r="21" fill="#dd9a55" class="o"/>
        <path d="M48 56 q12 -6 24 0" class="o2" stroke="#a4713a"/>
        <use href="#f-busa" transform="translate(60,72) scale(.82)"/>
      </g>` },
      { name: 'うめぼしぃ', sub: '怒り眉しわしわ', body: `<g filter="url(#b3)">
        <path d="M38 70 q-3 -18 14 -22 q-2 -9 8 -9 q10 0 8 9 q17 4 14 22 q3 18 -22 20 q-25 -2 -22 -20 z" fill="#c9403a" class="o"/>
        <path d="M44 57 q9 -5 16 -1 M60 55 q9 -4 15 2 M42 76 q7 5 14 4 M64 80 q7 1 13 -4" class="o2" stroke="#8c2b24" stroke-width="2"/>
        <path d="M44 50 l12 4 M76 50 l-12 4" class="o" fill="none" stroke-width="3.6"/>
        <use href="#f-busa" transform="translate(60,68) scale(.9)"/>
      </g>` },
      { name: 'うめしゅづけ', sub: '梅酒温泉♨️', body: `<g filter="url(#b1)">
        <path d="M40 26 q6 -8 4 -14 M56 24 q6 -8 4 -14 M72 26 q6 -8 4 -14" class="o2" stroke="#94846e" stroke-width="3"/>
        <rect x="32" y="34" width="56" height="66" rx="12" fill="#f4dca8" class="o" opacity=".94"/>
        <rect x="37" y="48" width="46" height="46" rx="9" fill="#eecb82" opacity=".85"/>
        <circle cx="60" cy="78" r="17" fill="#c9403a" class="o"/>
        <rect x="46" y="56" width="28" height="9" rx="3" fill="#fffcf2" class="o" stroke-width="3"/>
        <path d="M50 70 q6 -3 10 -1 M62 69 q6 -2 9 2" class="o2" stroke="#8c2b24" stroke-width="1.8"/>
        <use href="#f-toro" transform="translate(60,80) scale(.7)"/>
        <circle cx="44" cy="56" r="2" fill="#fffcf2" opacity=".9"/>
        <circle cx="76" cy="64" r="1.7" fill="#fffcf2" opacity=".9"/>
      </g>` },
      { name: 'うめ大長老', sub: '白眉の風格', body: `<g filter="url(#b2)">
        <circle cx="60" cy="60" r="46" fill="#f3d8d6" opacity=".75"/>
        <path d="M28 64 q-4 -24 20 -30 q-3 -12 12 -12 q15 0 12 12 q24 6 20 30 q4 26 -32 29 q-36 -3 -32 -29 z" fill="#a13c34" class="o"/>
        <path d="M38 46 q11 -7 20 -3 M62 43 q11 -4 19 4" class="o2" stroke="#fffcf2" stroke-width="4.4"/>
        <path d="M36 72 q9 6 17 4 M67 76 q9 2 15 -4 M44 84 q10 5 16 3" class="o2" stroke="#6e211b" stroke-width="2"/>
        <use href="#f-busa" transform="translate(60,62)"/>
        <line x1="100" y1="40" x2="100" y2="102" class="o2" stroke-width="4" stroke="#8f6b45"/>
        <circle cx="100" cy="34" r="6" fill="none" stroke="#8f6b45" stroke-width="3.4"/>
        <ellipse cx="20" cy="30" rx="5" ry="3" fill="#f4b8c6" transform="rotate(20 20 30)"/>
        <ellipse cx="30" cy="98" rx="5" ry="3" fill="#f4b8c6" transform="rotate(-15 30 98)"/>
        <use href="#spark" transform="translate(98,16) scale(.9)"/>
      </g>` }
    ]
  },
  habu: {
    name: 'はぶちゃん', motif: 'ハブ酒',
    levels: [
      { name: 'はぶたまご', sub: 'ちょこん', body: `<g filter="url(#b2)">
        <ellipse cx="60" cy="96" rx="16" ry="3" fill="#262019" opacity=".12"/>
        <path d="M60 52 q15 0 15 22 a15 17 0 0 1 -30 0 q0 -22 15 -22 z" fill="#f4edda" class="o"/>
        <path d="M49 72 l6 3 6 -4 6 4 5 -3" class="o2"/>
        <circle cx="60" cy="50" r="8" fill="#93a566" class="o" stroke-width="3.4"/>
        <circle cx="57" cy="48.5" r="1.6" fill="#262019"/>
        <circle cx="63" cy="48.5" r="1.6" fill="#262019"/>
        <path d="M60 55 q0 4 -2 6 M60 55 q0 4 2 6" class="o2" stroke="#c9403a" stroke-width="1.7"/>
      </g>` },
      { name: 'こはぶ', sub: 'にょろり', body: `<g filter="url(#b1)">
        <path d="M30 88 q15 11 28 -2 q13 -13 26 -2" fill="none" stroke="#262019" stroke-width="16" stroke-linecap="round"/>
        <path d="M30 88 q15 11 28 -2 q13 -13 26 -2" fill="none" stroke="#93a566" stroke-width="11" stroke-linecap="round"/>
        <circle cx="86" cy="80" r="12" fill="#93a566" class="o"/>
        <use href="#f-busa" transform="translate(86,80) scale(.52)"/>
        <path d="M96 87 q4 2 5 5 M96 87 q5 0 7 2" class="o2" stroke="#c9403a" stroke-width="1.7"/>
      </g>` },
      { name: 'とぐろまき', sub: '鎌首もたげ', body: `<g filter="url(#b3)">
        <ellipse cx="60" cy="94" rx="25" ry="9" fill="#93a566" class="o"/>
        <path d="M60 90 q-16 -10 -5 -24 q9 -11 4 -22" fill="none" stroke="#262019" stroke-width="17" stroke-linecap="round"/>
        <path d="M60 90 q-16 -10 -5 -24 q9 -11 4 -22" fill="none" stroke="#93a566" stroke-width="12" stroke-linecap="round"/>
        <circle cx="60" cy="40" r="13" fill="#93a566" class="o"/>
        <use href="#f-busa" transform="translate(60,40) scale(.58)"/>
        <path d="M60 50 q0 5 -2.5 7 M60 50 q0 5 2.5 7" class="o2" stroke="#c9403a" stroke-width="1.8"/>
      </g>` },
      { name: 'ハブ酒づけ', sub: '熟成中', body: `<g filter="url(#b1)">
        <rect x="52" y="18" width="16" height="16" fill="#f2e8ca" class="o" stroke-width="3.4"/>
        <rect x="49" y="13" width="22" height="8" rx="4" fill="#8f6b45" class="o" stroke-width="3"/>
        <rect x="32" y="32" width="56" height="72" rx="12" fill="#f2e8ca" class="o" opacity=".96"/>
        <rect x="37" y="46" width="46" height="54" rx="9" fill="#eacd75" opacity=".75"/>
        <g transform="translate(60,78) scale(.66)">
          <ellipse cx="0" cy="20" rx="26" ry="10" fill="#93a566" class="o"/>
          <ellipse cx="0" cy="7" rx="21" ry="9" fill="#9fb073" class="o"/>
          <circle cx="0" cy="-8" r="12" fill="#93a566" class="o"/>
          <use href="#f-toro" transform="translate(0,-8) scale(.55)"/>
        </g>
        <rect x="40" y="36" width="40" height="11" fill="#fffcf2" class="o" stroke-width="2.6"/>
        <text x="60" y="45" font-size="9" font-weight="700" text-anchor="middle" fill="#262019">ハブ酒</text>
      </g>` },
      { name: 'はぶりゅう', sub: '昇り龍！', body: `<g filter="url(#b2)">
        <ellipse cx="34" cy="102" rx="20" ry="8" fill="#fffcf2" class="o" stroke-width="3"/>
        <ellipse cx="72" cy="106" rx="24" ry="8" fill="#fffcf2" class="o" stroke-width="3"/>
        <path d="M22 100 q22 -14 44 -6 q26 9 34 -16 q6 -20 -10 -28" fill="none" stroke="#262019" stroke-width="17" stroke-linecap="round"/>
        <path d="M22 100 q22 -14 44 -6 q26 9 34 -16 q6 -20 -10 -28" fill="none" stroke="#d3b95e" stroke-width="12" stroke-linecap="round"/>
        <circle cx="88" cy="46" r="14" fill="#d3b95e" class="o"/>
        <path d="M78 35 l-5 -11 7 4 z M98 35 l5 -11 -7 4 z" fill="#ead88a" class="o" stroke-width="3"/>
        <path d="M75 50 q-12 3 -19 10 M101 50 q12 3 17 12" class="o2" stroke="#ab9036" stroke-width="2.6"/>
        <use href="#f-busa" transform="translate(88,46) scale(.6)"/>
        <use href="#bolt" transform="translate(24,52)"/>
        <use href="#spark" transform="translate(106,20)"/>
        <use href="#spark" transform="translate(16,28) scale(.8)"/>
      </g>` }
    ]
  }
};

const CHAR_ORDER = ['tokkuri', 'awa', 'puchi', 'ume', 'habu'];

// スタンプフレーズ50選
const PHRASES = [
  '酒しか勝たん', '飲まれるまで飲む', 'とりあえず生', '今日の俺、優勝', '乾杯は正義',
  '本日も泥酔日和', '明日の俺が何とかする', '休肝日？聞いたことない', 'もう一軒だけ', '終電は敵',
  '記憶はここまで', '肝臓フル稼働中', 'しらふって何？', '酒は百薬の長（自称）', '一杯が一生',
  'グラスは空けるためにある', '泡は飲み物', '開けたら飲むしかない', 'シャンパンは開けてもらうもの', 'ボトルの数だけ思い出',
  '祝杯は毎日あげていい', '酒に呼ばれた', '飲むしかないっしょ', '神泡いただきます', '酔拳マスター見習い',
  '今夜が山田', '財布より肝臓が心配', '酒代は経費（気持ち）', '乾杯のち泥酔', 'ほろ酔いは通過点',
  'ウコンは裏切らない', '水も飲もうね（天使の声）', 'ちゃんぽん上等', '氷までうまい', '二日酔いも思い出のうち',
  '今日を生き抜いた一杯', '推しボトル入りました', '酒豪への道、一合目', '飲み過ぎ？知らない子ですね', '舌が世界一周中',
  '揚げ物は飲み物の親友', '締めのラーメンまでが飲み会', '酔うほどに饒舌', 'グラス越しの人生', '飲みニケーション万歳',
  '酔い、それは芸術', '今日も肝臓が働いた', '明日は明日の風が吹く', 'おかわりは礼儀', 'また明日、乾杯'
];

// 書道フォント（未決 → アプリ内で切替可能）
const FONTS = [
  { id: 'syuku', label: '楷書', family: 'Yuji Syuku' },
  { id: 'mai',   label: '行書', family: 'Yuji Mai' },
  { id: 'boku',  label: '墨太', family: 'Yuji Boku' }
];

// レベル閾値（相棒ごとの累計ポイント）
const LEVEL_THRESHOLDS = [0, 50, 120, 220, 350];
const BASE_POINTS = 10;
const RANKS = [
  { id: 'normal',  label: '普段の一本',   bonus: 0 },
  { id: 'good',    label: 'ちょっといい', bonus: 5 },
  { id: 'special', label: '特別な一本',   bonus: 15 }
];

// 表示用インラインSVG（ページ内共有defs参照）
function charSvgInline(charId, lv) {
  const c = CHARACTERS[charId];
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${c.levels[lv - 1].body}</svg>`;
}

// canvas合成用スタンドアロンSVG（defs・スタイル内蔵）
function charSvgStandalone(charId, lv) {
  const c = CHARACTERS[charId];
  return `<svg viewBox="0 0 120 120" width="480" height="480" xmlns="http://www.w3.org/2000/svg">
<style>.o{stroke:#262019;stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.o2{stroke:#262019;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round;fill:none}</style>
<defs>${SVG_DEFS}</defs>${c.levels[lv - 1].body}</svg>`;
}
