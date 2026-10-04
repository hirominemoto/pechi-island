// ペチ島 — 空・海・看板・ふきだしの SVG と、共通のスタイル
(function (G) {
'use strict';
var P = G.Pechi, r1 = P.r1;

P.SEA_R = 170;      // 海の円盤の半径
P.SEA_TH = 18;      // 海の厚み(ジオラマの断面)
P.VIEW = { wide: [-176, -98, 352, 204], tall: [-122, -98, 244, 196] };
P.FONT = '"Yusei Magic","Hachi Maru Pop","Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic","Meiryo",sans-serif';

P.STYLE =
  '.ol{stroke:#4a3528;stroke-width:.45;stroke-linejoin:round;stroke-linecap:round}' +
  '.olr{stroke:#6f7a90;stroke-width:.4;stroke-linejoin:round}' +
  '.s{fill:currentColor;stroke:currentColor;stroke-width:5.5;stroke-linejoin:round}' +
  '.hand{font-family:' + P.FONT + '}' +
  '.bb{fill:#fffdf4;stroke:#4a3528;stroke-width:4;stroke-linejoin:round}' +
  '.bub{transition:opacity .35s}' +
  '.surf{animation:pe-surf 5s linear infinite,pe-pulse 2.6s ease-in-out infinite alternate}' +
  '.glint{animation:pe-pulse 3.4s ease-in-out infinite alternate}' +
  '.tw{animation:pe-pulse 1.3s ease-in-out infinite alternate}' +
  '.drift{animation:pe-drift 70s ease-in-out infinite alternate}' +
  '.drift.b{animation-duration:95s;animation-direction:alternate-reverse}' +
  '.chr{cursor:pointer}' +
  '.rain path{stroke:#dcefff;stroke-width:.55;stroke-linecap:round;opacity:.75;animation:pe-rain .6s linear infinite}' +
  '@keyframes pe-rain{to{transform:translate(-13px,42px)}}' +
  '@keyframes pe-surf{to{stroke-dashoffset:-24}}' +
  '@keyframes pe-pulse{from{opacity:.25}to{opacity:.95}}' +
  '@keyframes pe-drift{from{transform:translateX(-26px)}to{transform:translateX(26px)}}' +
  '@media (prefers-reduced-motion:reduce){.surf,.glint,.tw,.drift,.rain path{animation:none}}';

P.defs = function () {
  return '<linearGradient id="g-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="150">' +
      '<stop offset="0" stop-color="#4fb2ea"/><stop offset=".55" stop-color="#b4e4f6"/><stop offset="1" stop-color="#fff2cc"/></linearGradient>' +
    '<radialGradient id="g-sea" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6adbe0"/><stop offset=".6" stop-color="#31abd6"/><stop offset="1" stop-color="#1f7dbc"/></radialGradient>' +
    '<linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b72b0"/><stop offset="1" stop-color="#0f477e"/></linearGradient>' +
    '<radialGradient id="g-sun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffeaa0"/><stop offset="1" stop-color="#ffe58a" stop-opacity="0"/></radialGradient>' +
    P.symbols();
};

P.sky = function () {
  return '<rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#g-sky)"/>' +
    '<circle cx="124" cy="-82" r="40" fill="url(#g-sun)"/><circle cx="124" cy="-82" r="10.5" fill="#fffbe6"/>' +
    '<g class="drift"><use href="#s-cloud" transform="translate(-142 -58) scale(2.7)"/><use href="#s-cloud" transform="translate(150 -30) scale(1.9)"/></g>' +
    '<g class="drift b"><use href="#s-cloud" transform="translate(-96 -86) scale(1.5)"/><use href="#s-cloud" transform="translate(66 -90) scale(2.2)"/></g>';
};

// 海(楕円の水面と、手前に見える断面)
P.seaWallD = function (R) {
  var rx = P.SEA_R, ry = r1(rx * R.se), th = r1(P.SEA_TH * R.ce);
  return 'M' + (-rx) + ' 0A' + rx + ' ' + ry + ' 0 0 0 ' + rx + ' 0V' + th + 'A' + rx + ' ' + ry + ' 0 0 1 ' + (-rx) + ' ' + th + 'Z';
};
P.loopD = function (R, pts) {
  var s = '', i, q;
  for (i = 0; i < pts.length; i++) { q = R.xy(pts[i][0], 0, pts[i][1]); s += (i ? 'L' : 'M') + r1(q[0]) + ' ' + r1(q[1]); }
  return s + 'Z';
};
P.glintD = function (R, list) {
  var s = '', i, q, l;
  for (i = 0; i < list.length; i++) {
    q = R.xy(list[i][0], 0, list[i][1]); l = list[i][2];
    s += 'M' + r1(q[0] - l) + ' ' + r1(q[1]) + 'q' + r1(l / 2) + ' -.9 ' + l + ' 0t' + l + ' 0';
  }
  return s;
};
P.makeGlints = function () {
  var R = P.rng(7), out = [], i;
  for (i = 0; i < 46; i++) {
    var a = R() * P.TAU, r = P.outline(a) * 1.2 + R() * (P.SEA_R - 12 - P.outline(a) * 1.2);
    out.push([r * Math.cos(a), r * Math.sin(a), 1.6 + R() * 1.8]);
  }
  return out;
};

// 看板の文字(看板の面の座標を10倍にして書く)
P.signMarkup = function (id) {
  if (id === 'beam') {
    return '<text class="hand" x="88" y="27" text-anchor="middle" font-size="17.5" fill="#3b2a1c">けっこんしきじょう</text>';
  }
  return '<text class="hand" x="68" y="18" text-anchor="middle" font-size="12.5" fill="#3b2a1c">けっこんしきじょう</text>' +
    '<path d="M8 14.5L128 12.5" stroke="#c0392b" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M68 23v9M63.5 28.5l4.5 4.5 4.5-4.5" stroke="#3b2a1c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text class="hand" x="68" y="54" text-anchor="middle" font-size="19" fill="#a83226">さいばんしょ</text>';
};
// 看板の面 → 画面への行列。裏側を向いているときは null
P.signMatrix = function (R, sg) {
  if (sg.n[0] * R.tx + sg.n[1] * R.ty + sg.n[2] * R.tz < .1) return null;
  var sx = R.sx, sy = R.sy, W = sg.W * 10, H = sg.H * 10;
  function f(v) { return Math.round(v * 1e5) / 1e4; }
  return 'matrix(' + f((sx[sg.u] - sx[sg.o]) / W) + ' ' + f((sy[sg.u] - sy[sg.o]) / W) + ' ' +
    f((sx[sg.w] - sx[sg.o]) / H) + ' ' + f((sy[sg.w] - sy[sg.o]) / H) + ' ' + Math.round(sx[sg.o] * 10) + ' ' + Math.round(sy[sg.o] * 10) + ')';
};

// world グループ(scale .1)の中に置くときの transform
P.at = function (x, y, sxk, syk, rot) {
  return 'translate(' + Math.round(x * 10) + ' ' + Math.round(y * 10) + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + Math.round(sxk * 1000) / 100 + ' ' + Math.round(syk * 1000) / 100 + ')';
};

// 台風のときの雨
P.rainMarkup = function () {
  var R = P.rng(11), s = '<rect x="-3000" y="-3000" width="6000" height="6000" fill="#16264a" opacity=".22"/>', i;
  for (i = 0; i < 70; i++) s += '<path d="M' + r1(-230 + R() * 460) + ' ' + r1(-150 + R() * 260) + 'l-3.4 11" style="animation-delay:-' + r1(R() * .6) + 's"/>';
  return s;
};

// ふきだし
P.bubble = function (text) {
  var fs = 40, n = 0, i;
  for (i = 0; i < text.length; i++) n += text.charCodeAt(i) < 128 ? .5 : 1;
  var w = Math.round(n * fs + 56), h = 66, l = -w / 2, r = w / 2, t = -h - 26, b = -26;
  return '<g transform="scale(.1)"><path class="bb" d="M' + (l + 20) + ' ' + t + 'H' + (r - 20) + 'A20 20 0 0 1 ' + r + ' ' + (t + 20) + 'V' + (b - 20) +
    'A20 20 0 0 1 ' + (r - 20) + ' ' + b + 'H14L0 0L-14 ' + b + 'H' + (l + 20) + 'A20 20 0 0 1 ' + l + ' ' + (b - 20) + 'V' + (t + 20) + 'A20 20 0 0 1 ' + (l + 20) + ' ' + t + 'Z"/>' +
    '<text class="hand" x="0" y="' + (t + h / 2 + 14) + '" text-anchor="middle" font-size="' + fs + '" fill="#4a3528">' + text + '</text></g>';
};

P.LINES = {
  hiro: ['パイナップル〜♪', 'ぜんぶ たべたい！', 'つかまらないよ〜', 'あまい におい！'],
  pechi: ['こら、まちなさい！', 'ひとりじめ 禁止！', 'みんなで わけるんだ', '見回り、異常なし'],
  mira: ['ロボット… チガイマスヨ？', 'パイナップル ケンチ！', 'タイチョウ ハヤイデス', 'ピピッ♪']
};
P.NAMES = { hiro: 'ヒロミーヌ', pechi: 'ペチ隊長', mira: 'ミラ' };
})(typeof globalThis !== 'undefined' ? globalThis : this);
