// ペチ島 — 時間帯の色、空・海・洞窟の中・看板・ふきだしの SVG、共通のスタイル
(function (G) {
'use strict';
var P = G.Pechi, r1 = P.r1, hex = P.hex;

P.SEA_R = 162;      // 海の円盤の半径
P.SEA_TH = 18;      // 海の厚み(ジオラマの断面)
P.VIEW = { wide: [-176, -116, 352, 220], tall: [-122, -98, 244, 196] };
P.FONT = '"Yusei Magic","Hachi Maru Pop","Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic","Meiryo",sans-serif';

// ---- 時間帯 --------------------------------------------------------------
// sky: 空のグラデーション(上→下の5色)。mul/lift: 島の色にかける色味(色×mul+lift)。
// chr: キャラクター用のひかえめな色味。sun/dusk/night: 太陽・夕日と金星・星空の濃さ。
// lamp: あかり(小屋の戸口・看板・キャラクターのまわり)。glow: 洞窟の青白い光。veil: 台風の暗さ
P.TIMES = {
  day: {
    sky: [[79, 178, 234], [116, 196, 239], [146, 211, 243], [204, 234, 240], [255, 242, 204]],
    mul: [1, 1, 1], lift: [0, 0, 0], chr: [1, 1, 1],
    sea: [[106, 219, 224], [49, 171, 214], [31, 125, 188]], wall: [[27, 114, 176], [15, 71, 126]],
    shallow: [[185, 244, 242], [143, 230, 234]], foam: [255, 255, 255],
    sun: 1, dusk: 0, night: 0, lamp: 0, glow: .7, veil: .22
  },
  dusk: {
    sky: [[36, 42, 108], [112, 72, 142], [246, 142, 96], [186, 108, 136], [86, 64, 122]],
    mul: [1, .76, .62], lift: [8, 0, 16], chr: [1, .93, .86],
    sea: [[250, 178, 132], [166, 110, 162], [64, 68, 138]], wall: [[58, 58, 124], [30, 30, 74]],
    shallow: [[255, 216, 184], [244, 178, 152]], foam: [255, 234, 216],
    sun: 0, dusk: 1, night: 0, lamp: .45, glow: .85, veil: .2
  },
  night: {
    sky: [[5, 9, 32], [9, 17, 54], [14, 26, 76], [20, 36, 94], [28, 46, 110]],
    mul: [.36, .46, .62], lift: [4, 8, 20], chr: [.82, .87, 1],
    sea: [[34, 82, 130], [18, 48, 100], [10, 28, 72]], wall: [[10, 26, 66], [5, 12, 38]],
    shallow: [[64, 124, 170], [46, 100, 150]], foam: [150, 186, 230],
    sun: 0, dusk: 0, night: 1, lamp: 1, glow: 1, veil: .12
  }
};
P.TIME_ORDER = ['day', 'dusk', 'night'];
P.TIME_NAMES = { day: '昼', dusk: '夕暮れ', night: '夜' };
// ボタン用のアイコン(中心が 0,0、±11 に収まる線画)
P.TIME_ICON = {
  day: 'M0-4.2a4.2 4.2 0 1 0 0 8.4a4.2 4.2 0 1 0 0-8.4M0-8v-2.6M0 8v2.6M-8 0h-2.6M8 0h2.6M-5.7-5.7l-1.8-1.8M5.7-5.7l1.8-1.8M-5.7 5.7l-1.8 1.8M5.7 5.7l1.8 1.8',
  dusk: 'M-10.5 5h21M-5.6 5a5.6 5.6 0 0 1 11.2 0M0-4.4v-3M-6.6-1.4l-2.2-2M6.6-1.4l2.2-2M-6 9h12',
  night: 'M4.6-9a9.4 9.4 0 1 0 5.2 12.6a7.4 7.4 0 0 1-5.2-12.6zM-6.4-6.6v2.6M-7.7-5.3h2.6'
};
P.STORM_ICON = 'M-1 0a1 1 0 1 1 2 0a3 3 0 1 1-6 0a5 5 0 1 1 10 0a7 7 0 1 1-14 0';
P.hashTime = function () {
  var h = G.location && G.location.hash ? G.location.hash.replace('#', '') : '';
  return P.TIMES[h] ? h : 'day';
};

function mix(a, b, u) {
  if (typeof a === 'number') return a + (b - a) * u;
  return a.map(function (x, i) { return mix(x, b[i], u); });
}
P.blend = function (A, B, u) { var o = {}, k; for (k in A) o[k] = mix(A[k], B[k], u); return o; };

// SVG の文字列の中の色(#rgb / #rrggbb)を、時間帯の色味に塗りかえる
var ZERO = [0, 0, 0];
P.tint = function (markup, mul, lift) {
  lift = lift || ZERO;
  if (mul[0] === 1 && mul[1] === 1 && mul[2] === 1 && !lift[0] && !lift[1] && !lift[2]) return markup;
  return markup.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, function (m, h) {
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var v = parseInt(h, 16);
    return hex([(v >> 16) * mul[0] + lift[0], ((v >> 8) & 255) * mul[1] + lift[1], (v & 255) * mul[2] + lift[2]]);
  });
};

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
  '.star{animation:pe-star 2.6s ease-in-out infinite alternate}' +
  '.star.b{animation-duration:3.7s;animation-delay:-1.2s}' +
  '.star.c{animation-duration:4.9s;animation-delay:-2.6s}' +
  '.venus{animation:pe-soft 2.4s ease-in-out infinite alternate}' +
  '.shoot{opacity:0;animation:pe-shoot 9s linear infinite}' +
  '.shoot.b{animation-duration:13s;animation-delay:-5s}' +
  '.shoot.c{animation-duration:17s;animation-delay:-12s}' +
  '.cv-glow{animation:pe-soft 3.2s ease-in-out infinite alternate}' +
  '.chr,.pe-btn{cursor:pointer}' +
  '.pe-btn path{fill:none;stroke:#3b2a1c;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
  '.pe-btn:focus-visible circle{stroke:#fffdf4;stroke-width:3.5}' +
  '.rain path{stroke:#dcefff;stroke-width:.55;stroke-linecap:round;opacity:.75;animation:pe-rain .6s linear infinite}' +
  '@keyframes pe-rain{to{transform:translate(-13px,42px)}}' +
  '@keyframes pe-surf{to{stroke-dashoffset:-24}}' +
  '@keyframes pe-pulse{from{opacity:.25}to{opacity:.95}}' +
  '@keyframes pe-star{from{opacity:.5}to{opacity:1}}' +
  '@keyframes pe-soft{from{opacity:.8}to{opacity:1}}' +
  '@keyframes pe-drift{from{transform:translateX(-26px)}to{transform:translateX(26px)}}' +
  '@keyframes pe-shoot{0%{transform:translate(0,0);opacity:0}1.2%{opacity:1}7%{opacity:.9}9%{transform:translate(-78px,44px);opacity:0}100%{transform:translate(-78px,44px);opacity:0}}' +
  '@media (prefers-reduced-motion:reduce){.surf,.glint,.tw,.drift,.star,.venus,.shoot,.cv-glow,.rain path{animation:none}}';

function stops(list, offs) {
  return list.map(function (c, i) { return '<stop offset="' + offs[i] + '" stop-color="' + hex(c) + '"/>'; }).join('');
}
// グラデーション(時間帯の色)と、木などの部品(島と同じ色味に塗る)
P.defs = function (T) {
  T = T || P.TIMES.day;
  return '<linearGradient id="g-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="150">' + stops(T.sky, [0, .23, .36, .63, 1]) + '</linearGradient>' +
    '<radialGradient id="g-sea" cx=".5" cy=".5" r=".5">' + stops(T.sea, [0, .6, 1]) + '</radialGradient>' +
    '<linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1">' + stops(T.wall, [0, 1]) + '</linearGradient>' +
    '<radialGradient id="g-sun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffeaa0"/><stop offset="1" stop-color="#ffe58a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="g-dusk"><stop offset="0" stop-color="#ffe0a8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffa868" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a5c" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="g-dsun"><stop offset="0" stop-color="#fff3cc"/><stop offset=".6" stop-color="#ffc070"/><stop offset="1" stop-color="#ff8f52"/></radialGradient>' +
    '<radialGradient id="g-star"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#eaf2ff" stop-opacity=".35"/><stop offset="1" stop-color="#eaf2ff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="g-shoot" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="26" y2="-14.7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#bcd8ff" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="g-glow"><stop offset="0" stop-color="#f4fdff"/><stop offset=".28" stop-color="#aeeaff" stop-opacity=".8"/><stop offset=".62" stop-color="#5ec8ff" stop-opacity=".3"/><stop offset="1" stop-color="#4ab8ff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="g-halo"><stop offset="0" stop-color="#fff4cc" stop-opacity=".8"/><stop offset=".55" stop-color="#ffe9a8" stop-opacity=".3"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>' +
    P.tint(P.symbols(), T.mul, T.lift);
};

// 空に置くものの位置。看板(左上)とボタン(右上)をさけて、左の空に置く。西の空=左
P.skyPos = function (tall, se) {
  var sx = tall ? -92 : -126, rim = -P.SEA_R * se * Math.sqrt(1 - sx * sx / (P.SEA_R * P.SEA_R));
  return { sun: tall ? [-78, -150] : [-92, -98], dusk: [sx, r1(rim + 1)], venus: tall ? [-60, -126] : [-96, -92],
    shoot: tall ? [[40, -200], [-30, -150], [90, -120]] : [[150, -106], [60, -112], [170, -86]] };
};
function tr(p) { return 'translate(' + p[0] + ' ' + p[1] + ')'; }

var STARS = null;
function stars() {
  if (STARS) return STARS;
  var R = P.rng(88), s = '', i, COL = ['#fff', '#fff', '#fff4d6', '#dfe9ff'];
  // [個数, y の上端, y の下端]: 島のすぐ上と左右の空をいちばん濃くする
  [[150, -122, -34], [120, -292, -122], [44, -34, 150]].forEach(function (band) {
    for (i = 0; i < band[0]; i++) {
      var x = -330 + R() * 660, y = band[1] + R() * (band[2] - band[1]), r = .42 + R() * R() * 1.05, c = COL[(R() * 4) | 0], k = (R() * 4) | 0;
      var cls = k ? ' class="star' + (k === 2 ? ' b' : k === 3 ? ' c' : '') + '"' : '';
      if (r > 1.12) s += '<path' + cls + ' d="M' + r1(x) + ' ' + r1(y - r * 2.6) + 'l' + r1(r * .5) + ' ' + r1(r * 2.1) + ' ' + r1(r * 2.1) + ' ' + r1(r * .5) + ' ' + r1(-r * 2.1) + ' ' + r1(r * .5) + ' ' + r1(-r * .5) + ' ' + r1(r * 2.1) + ' ' + r1(-r * .5) + ' ' + r1(-r * 2.1) + ' ' + r1(-r * 2.1) + ' ' + r1(-r * .5) + ' ' + r1(r * 2.1) + ' ' + r1(-r * .5) + 'Z" fill="' + c + '"/>';
      else s += '<circle' + cls + ' cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r.toFixed(2) + '" fill="' + c + '"/>';
    }
  });
  return (STARS = s);
}
// 空: 昼の太陽・夕日と金星・星空と流れ星を重ねておき、濃さだけを変える。all=false なら見えない層は省く
P.sky = function (T, tall, se, all) {
  var p = P.skyPos(tall, se), s = '<rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#g-sky)"/>';
  function layer(cls, amt, inner) { return all || amt > .004 ? '<g class="' + cls + '" opacity="' + r1(amt) + '"' + (amt > .004 ? '' : ' display="none"') + '>' + inner + '</g>' : ''; }
  s += layer('pe-night', T.night, stars() + ['', ' b', ' c'].map(function (c, i) {
    return '<g class="pe-shootpos" transform="' + tr(p.shoot[i]) + '"><path class="shoot' + c + '" d="M0 0L26-14.7" stroke="url(#g-shoot)" stroke-width="1.1" stroke-linecap="round" fill="none"/></g>';
  }).join(''));
  s += layer('pe-sun', T.sun, '<g class="pe-sunpos" transform="' + tr(p.sun) + '"><circle r="40" fill="url(#g-sun)"/><circle r="10.5" fill="#fffbe6"/></g>');
  s += layer('pe-dusk', T.dusk, '<g class="pe-duskpos" transform="' + tr(p.dusk) + '"><circle r="120" fill="url(#g-dusk)"/><circle r="19" fill="url(#g-dsun)"/></g>' +
    '<g class="pe-venuspos" transform="' + tr(p.venus) + '"><circle r="10" fill="url(#g-star)"/>' +
    '<path class="venus" d="M0-5.6L.9-.9 5.6 0 .9.9 0 5.6-.9.9-5.6 0-.9-.9Z" fill="#fffbe8"/><circle r="1.3" fill="#fff"/></g>');
  return s + '<g class="drift"><use href="#s-cloud" transform="translate(150 -72) scale(2.4)"/><use href="#s-cloud" transform="translate(-152 -26) scale(1.8)"/></g>' +
    '<g class="drift b"><use href="#s-cloud" transform="translate(96 -106) scale(1.5)"/><use href="#s-cloud" transform="translate(-34 -112) scale(1.5)"/></g>';
};
P.seaColors = function (T) { return { sh1: hex(T.shallow[0]), sh2: hex(T.shallow[1]), foam: hex(T.foam) }; };

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

// 3D の面(o=左上, u=右上, w=左下)に、10倍座標で描いた絵をはりつける行列
P.planeMatrix = function (R, pl) {
  var sx = R.sx, sy = R.sy, W = pl.W * 10, H = pl.H * 10;
  function f(v) { return Math.round(v * 1e5) / 1e4; }
  return 'matrix(' + f((sx[pl.u] - sx[pl.o]) / W) + ' ' + f((sy[pl.u] - sy[pl.o]) / W) + ' ' +
    f((sx[pl.w] - sx[pl.o]) / H) + ' ' + f((sy[pl.w] - sy[pl.o]) / H) + ' ' + Math.round(sx[pl.o] * 10) + ' ' + Math.round(sy[pl.o] * 10) + ')';
};
// 看板の文字
P.signMarkup = function (id) {
  if (id === 'beam') {
    return '<text class="hand" x="88" y="27" text-anchor="middle" font-size="17.5" fill="#3b2a1c">けっこんしきじょう</text>';
  }
  return '<text class="hand" x="68" y="18" text-anchor="middle" font-size="12.5" fill="#3b2a1c">けっこんしきじょう</text>' +
    '<path d="M8 14.5L128 12.5" stroke="#c0392b" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M68 23v9M63.5 28.5l4.5 4.5 4.5-4.5" stroke="#3b2a1c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text class="hand" x="68" y="54" text-anchor="middle" font-size="19" fill="#a83226">さいばんしょ</text>';
};
P.signMatrix = function (R, sg) {      // 裏側を向いているときは null
  return sg.n[0] * R.tx + sg.n[1] * R.ty + sg.n[2] * R.tz < .1 ? null : P.planeMatrix(R, sg);
};

// ---- 洞窟の中 --------------------------------------------------------------
// いまのカメラから見た、洞窟の中の形。入口が向こうを向いていれば show=false
P.caveState = function (R, sc, T) {
  var c = sc.cave;
  if (c.n[0] * R.tx + c.n[1] * R.ty + c.n[2] * R.tz < .03) return { show: false, walls: [] };
  function poly(vs) {
    var s = '', q;
    for (q = 0; q < vs.length; q++) s += (q ? 'L' : 'M') + Math.round(R.sx[vs[q]] * 10) + ' ' + Math.round(R.sy[vs[q]] * 10);
    return s + 'Z';
  }
  return { show: true, open: poly(c.open), back: poly(c.back),
    walls: c.walls.map(function (w) { return w.n[0] * R.tx + w.n[1] * R.ty + w.n[2] * R.tz > 0 ? poly(w.v) : ''; }),
    mBack: P.planeMatrix(R, c.glow), mHaze: P.planeMatrix(R, c.haze), mFloor: P.planeMatrix(R, c.floor), mSpill: P.planeMatrix(R, c.spill),
    pile: P.at(R.sx[c.pile], R.sy[c.pile], .26, .26), amt: P.caveAmt(T) };
};
P.caveAmt = function (T) { return { glow: Math.round(T.glow * 100) / 100, spill: Math.round(Math.max(0, T.glow - .5) * 130) / 100 }; };
// 洞窟の中の SVG。奥の壁に青白い光と発光チューブ、床と入口の外にもれる光。st があれば属性も書きこむ
P.caveMarkup = function (sc, st) {
  st = st || { walls: [], amt: {} };
  function A(name, v) { return v == null || v === '' ? '' : ' ' + name + '="' + v + '"'; }
  var s = '<clipPath id="pe-cave-clip"><path class="cv-open"' + A('d', st.open) + '/></clipPath><g clip-path="url(#pe-cave-clip)">' +
    '<path class="cv-open" fill="#0a0814"' + A('d', st.open) + '/>';
  sc.cave.walls.forEach(function (w, i) { s += '<path class="cv-w" fill="' + w.css + '"' + A('d', st.walls[i]) + '/>'; });
  return s + '<path class="cv-b" fill="#06050d"' + A('d', st.back) + '/>' +
    '<g class="cv-amt"' + A('opacity', st.amt.glow) + '>' +
      '<g class="cv-mh"' + A('transform', st.mHaze) + '><ellipse cx="95" cy="130" rx="118" ry="128" fill="url(#g-glow)" opacity=".42"/></g>' +
      '<g class="cv-mf"' + A('transform', st.mFloor) + '><ellipse cx="70" cy="30" rx="66" ry="70" fill="url(#g-glow)" opacity=".6"/></g>' +
      '<g class="cv-mb"' + A('transform', st.mBack) + '><g class="cv-glow"><ellipse cx="70" cy="98" rx="74" ry="64" fill="url(#g-glow)"/>' +
        '<g transform="translate(70 112) rotate(28)"><rect x="-4.5" y="-17" width="9" height="34" rx="4.5" fill="#f4feff" stroke="#bdf0ff" stroke-width="1.6"/>' +
        '<rect x="-1.8" y="-12" width="3.6" height="24" rx="1.8" fill="#fff"/></g></g></g>' +
    '</g><use class="cv-pile" href="#s-pile"' + A('transform', st.pile) + '/></g>' +
    '<g class="cv-ms"' + A('transform', st.mSpill) + '><ellipse class="cv-spill" cx="90" cy="30" rx="80" ry="62" fill="url(#g-glow)"' + A('opacity', st.amt.spill) + '/></g>';
};

// world グループ(scale .1)の中に置くときの transform
P.at = function (x, y, sxk, syk, rot) {
  return 'translate(' + Math.round(x * 10) + ' ' + Math.round(y * 10) + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + Math.round(sxk * 1000) / 100 + ' ' + Math.round(syk * 1000) / 100 + ')';
};

// 台風のときの雨
P.rainMarkup = function () {
  var R = P.rng(11), s = '<rect class="pe-veil" x="-3000" y="-3000" width="6000" height="6000" fill="#16264a" opacity=".22"/>', i;
  for (i = 0; i < 90; i++) s += '<path d="M' + r1(-260 + R() * 520) + ' ' + r1(-290 + R() * 420) + 'l-3.4 11" style="animation-delay:-' + r1(R() * .6) + 's"/>';
  return s;
};

// SVG 単体で開いたとき用の、画面右下のボタン(時間帯・台風)
P.uiMarkup = function () {
  function btn(cls, x, label, inner) {
    return '<g class="pe-btn ' + cls + '" transform="translate(' + x + ' 0)" role="button" tabindex="0" aria-label="' + label + '"><title>' + label + '</title>' +
      '<circle r="21" fill="#e6c58c" stroke="#7a4f2c" stroke-width="2"/>' + inner + '</g>';
  }
  return btn('pe-b-storm', -52, '台風モード', '<path d="' + P.STORM_ICON + '"/>') +
    btn('pe-b-time', 0, '時間帯を変える', P.TIME_ORDER.map(function (t) { return '<path class="pe-i-' + t + '" d="' + P.TIME_ICON[t] + '"/>'; }).join(''));
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
