// ペチ島 — 3Dモデル(地形)と投影。ブラウザでも Node でも動く。
(function (G) {
'use strict';
var P = G.Pechi = G.Pechi || {};
var TAU = Math.PI * 2, DEG = Math.PI / 180;
P.TAU = TAU; P.DEG = DEG;

// 決定的な乱数(毎回同じ島になる)
P.rng = function (seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function hex(c) {
  function h(x) { x = x < 0 ? 0 : x > 255 ? 255 : Math.round(x); return (x < 16 ? '0' : '') + x.toString(16); }
  return '#' + h(c[0]) + h(c[1]) + h(c[2]);
}
P.hex = hex;

// 地形は極座標メッシュ: 中心(山頂)から海岸線まで RING の輪を SECT 分割
var SECT = 48;
var RING = [0, .07, .15, .24, .33, .42, .50, .555, .60, .70, .76, .82, .89, .95, 1];
var HEIGHT = [94, 86, 73, 56, 39, 23, 11.5, 7.4, 6.4, 6.2, 5.5, 4.4, 2.4, 1.0, 0];
var BAND = [
  { c: [190, 194, 208] },                                   // 山頂の岩
  { c: [158, 162, 182] },
  { c: [134, 140, 162], mix: [72, 136, 68], p: .3 },
  { c: [70, 140, 66], mix: [134, 140, 162], p: .28 },
  { c: [58, 130, 62], mix: [88, 154, 66], p: .3 },           // ジャングル
  { c: [48, 114, 58], mix: [68, 138, 62], p: .3 },
  { c: [98, 174, 72] },                                     // 草地
  { c: [110, 184, 74] },
  { c: [238, 212, 156] },                                   // 島をぐるっと回る道
  { c: [122, 194, 80] },
  { c: [138, 202, 86] },
  { c: [172, 206, 106], mix: [238, 216, 154], p: .45 },
  { c: [244, 224, 166] },                                   // 砂浜
  { c: [228, 202, 148] }                                    // 波打ちぎわ
];
P.TRAIL_D = 0.65;
P.CAVE_A = 93.75;      // 洞窟の向き(度)。桟橋からまっすぐ山のふもとへ
var LIGHT = P.LIGHT = norm([-0.55, 0.72, 0.42]);

// 海岸線の形(角度ごとの半径)
P.outline = function (a) {
  return 100 * (1 + .07 * Math.sin(2 * a + .6) + .05 * Math.sin(3 * a + 2.1) + .03 * Math.sin(5 * a + 4));
};

function Scene() {
  this.vx = []; this.vy = []; this.vz = [];
  this.items = [];    // <path> スロットで描く面・円
  this.sprites = [];  // <use> で置く木やパイナップル
  this.signs = [];    // 文字をのせる看板の面
  this.rand = P.rng(20260425);
  buildTerrain(this);
  if (P.buildProps) P.buildProps(this);
}
P.Scene = Scene;
var SP = Scene.prototype;

SP.vert = function (x, y, z) { this.vx.push(x); this.vy.push(y); this.vz.push(z); return this.vx.length - 1; };

// 多角形を追加。o: {center, up, cull, kv, kb, flat, vary, n3}
SP.poly = function (vs, color, o) {
  o = o || {};
  var x = this.vx, y = this.vy, z = this.vz, q = o.n3 || vs, a = q[0], b = q[1], c = q[2];
  var ux = x[b] - x[a], uy = y[b] - y[a], uz = z[b] - z[a], wx = x[c] - x[a], wy = y[c] - y[a], wz = z[c] - z[a];
  var n = norm([uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]);
  var cx = 0, cy = 0, cz = 0, i;
  for (i = 0; i < vs.length; i++) { cx += x[vs[i]]; cy += y[vs[i]]; cz += z[vs[i]]; }
  cx /= vs.length; cy /= vs.length; cz /= vs.length;
  var flip = o.center
    ? n[0] * (cx - o.center[0]) + n[1] * (cy - o.center[1]) + n[2] * (cz - o.center[2]) < 0
    : (o.up && n[1] < 0);
  if (flip) n = [-n[0], -n[1], -n[2]];
  var lum = o.flat ? 1 : 0.7 + 0.44 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  lum *= 1 + (this.rand() - .5) * (o.vary == null ? .06 : o.vary);
  var it = { t: 0, v: vs, n: n, cull: !!o.cull, kv: o.kv == null ? -1 : o.kv, kb: o.kb || 0,
    rgb: [color[0] * lum, color[1] * lum, color[2] * lum], lit: o.lit || 0, emit: o.emit || null, cv: o.cv || 0 };
  it.css = hex(it.rgb);
  this.items.push(it);
  return it;
};

// 円(球に見えるもの)。o.ground なら地面に寝た楕円
SP.disc = function (x, y, z, r, color, o) {
  o = o || {};
  var v = this.vert(x, y, z);
  var it = { t: o.ground ? 2 : 1, v: [v], r: r, cull: false, kv: o.kv == null ? v : o.kv, kb: o.kb || 0, rgb: color, lit: o.lit || 0, emit: o.emit || null, cv: o.cv || 0, css: hex(color) };
  this.items.push(it);
  return it;
};

function buildTerrain(sc) {
  var R = sc.rand, k, j, b;
  sc.vert(-7, HEIGHT[0], -9);
  for (k = 1; k < RING.length; k++) {
    var d = RING[k], mt = Math.max(0, 1 - d / 0.5), mid = mt * (1 - mt) * 4;
    var ja = k < 13 ? .26 : (k === 13 ? .12 : 0);
    var jh = k <= 5 ? 3.2 : (k === 6 ? 1.2 : (k <= 11 ? .35 : (k === 12 ? .15 : 0)));
    if (k === 8 || k === 9) { jh = .15; ja = .12; }
    for (j = 0; j < SECT; j++) {
      var a = (j + (R() - .5) * 2 * ja) / SECT * TAU;
      var ridge = .13 * Math.sin(3 * a + 1.2) + .09 * Math.sin(5 * a + .4) + .05 * Math.sin(9 * a + 2.2);
      var rr = d * P.outline(a) * (1 + (k < 13 ? (R() - .5) * .03 : 0)) * (1 + mid * ridge * .9);
      var hh = HEIGHT[k] * (1 + mid * ridge * .55) + (R() - .5) * 2 * jh;
      sc.vert(-7 * mt + rr * Math.cos(a), hh, -9 * mt + rr * Math.sin(a));
    }
  }
  var cj = Math.floor(P.CAVE_A / 360 * SECT);
  var idx = sc.vi = function (kk, jj) { return kk === 0 ? 0 : 1 + (kk - 1) * SECT + ((jj % SECT) + SECT) % SECT; };
  for (b = 0; b < RING.length - 1; b++) {
    for (j = 0; j < SECT; j++) {
      var m = BAND[b];
      var col = function () { return (m.mix && R() < m.p) ? m.mix : m.c; };
      var A = idx(b, j), B = idx(b, j + 1), C = idx(b + 1, j + 1), D = idx(b + 1, j);
      var o = { up: true, cull: true, vary: b === 8 ? .03 : .09 }, cc = col();
      if ((b === 6 || b === 7) && j === cj) { cc = BAND[8].c; o.vary = .03; }      // 道から洞窟へ入る小道
      else if (b === 6 && (j === cj - 1 || j === cj + 1)) cc = [200, 188, 138];
      if (b === 0) sc.poly([A, D, C], cc, o);
      else if (b >= 6) sc.poly([A, B, C, D], cc, o);
      else if ((b + j) & 1) { sc.poly([A, B, C], cc, o); sc.poly([A, C, D], col(), o); }
      else { sc.poly([A, B, D], cc, o); sc.poly([B, C, D], col(), o); }
    }
  }
}

// 島の上の点。d: 中心0〜海岸1(1より大きいと海の上)、a: 角度
SP.pt = function (d, a) {
  if (d >= 1) { var ro = d * P.outline(a); return { x: ro * Math.cos(a), y: 0, z: ro * Math.sin(a) }; }
  var b = 0; while (b < RING.length - 2 && RING[b + 1] <= d) b++;
  var fd = (d - RING[b]) / (RING[b + 1] - RING[b]);
  var aj = (((a / TAU) % 1) + 1) % 1 * SECT, j = Math.floor(aj), fa = aj - j;
  var i00 = this.vi(b, j), i01 = this.vi(b, j + 1), i10 = this.vi(b + 1, j), i11 = this.vi(b + 1, j + 1);
  var self = this;
  function mixv(arr) {
    var p = arr[i00] + (arr[i01] - arr[i00]) * fa, q = arr[i10] + (arr[i11] - arr[i10]) * fa;
    return p + (q - p) * fd;
  }
  return { x: mixv(self.vx), y: mixv(self.vy), z: mixv(self.vz) };
};
SP.walk = function (a) { return this.pt(P.TRAIL_D, a); };

// 世界の座標 (x,z) の地面の高さ。メッシュは少しゆがめてあるので、数回の反復で逆算する
SP.ground = function (x, z) {
  var a = Math.atan2(z, x), d = Math.hypot(x, z) / P.outline(a), i, p, ca, sa;
  for (i = 0; i < 6; i++) {
    d = Math.max(.001, Math.min(.999, d));
    p = this.pt(d, a); ca = Math.cos(a); sa = Math.sin(a);
    var ex = x - p.x, ez = z - p.z, ro = P.outline(a);
    d += (ex * ca + ez * sa) / ro;
    a += (ez * ca - ex * sa) / Math.max(6, d * ro);
  }
  return this.pt(Math.max(.001, Math.min(.999, d)), a).y;
};

// 時間帯 T の色に塗りなおす。lit=あかりに照らされる面、emit=自分で光る面、cv=洞窟の光を受ける面
SP.retone = function (T) {
  var m = T.mul, l = T.lift, items = this.items, i, it, c, r, g, b, k;
  for (i = 0; i < items.length; i++) {
    it = items[i]; c = it.rgb;
    r = c[0] * m[0] + l[0]; g = c[1] * m[1] + l[1]; b = c[2] * m[2] + l[2];
    if (it.lit) { k = it.lit * T.lamp; r += (c[0] * .94 - r) * k; g += (c[1] * .86 - g) * k; b += (c[2] * .7 - b) * k; }
    if (it.emit) { k = Math.min(1, T.lamp * 1.15); r += (it.emit[0] - r) * k; g += (it.emit[1] - g) * k; b += (it.emit[2] - b) * k; }
    if (it.cv) { k = Math.max(0, T.glow - .5) * it.cv; r += (150 - r) * k; g += (214 - g) * k; b += (255 - b) * k; }
    it.css = hex([r, g, b]);
  }
};
SP.shore = function (scale) {            // 海岸線(泡や浅瀬用)。[x,z] の列
  var out = [], j;
  for (j = 0; j < 96; j++) { var a = j / 96 * TAU, r = P.outline(a) * scale; out.push([r * Math.cos(a), r * Math.sin(a)]); }
  return out;
};

// ---- 投影と並べ替え -------------------------------------------------
function Renderer(sc) {
  this.sc = sc;
  var n = sc.vx.length, m = sc.items.length;
  this.sx = new Float32Array(n); this.sy = new Float32Array(n); this.sd = new Float32Array(n);
  this.key = new Float32Array(m); this.order = new Int32Array(m); this.count = 0;
}
P.Renderer = Renderer;
var RP = Renderer.prototype;

RP.project = function (az, el) {
  var sa = Math.sin(az), ca = Math.cos(az), se = Math.sin(el), ce = Math.cos(el);
  this.sa = sa; this.ca = ca; this.se = se; this.ce = ce;
  this.tx = sa * ce; this.ty = se; this.tz = ca * ce;        // カメラへ向かう単位ベクトル
  var x = this.sc.vx, y = this.sc.vy, z = this.sc.vz, sx = this.sx, sy = this.sy, sd = this.sd, i, n = x.length;
  for (i = 0; i < n; i++) {
    var zr = x[i] * sa + z[i] * ca;
    sx[i] = x[i] * ca - z[i] * sa;
    sy[i] = zr * se - y[i] * ce;
    sd[i] = zr * ce + y[i] * se;
  }
};
RP.xy = function (x, y, z) {
  var zr = x * this.sa + z * this.ca;
  return [x * this.ca - z * this.sa, zr * this.se - y * this.ce, zr * this.ce + y * this.se];
};
RP.sort = function () {
  var items = this.sc.items, m = items.length, cnt = 0, key = this.key, ord = this.order, sd = this.sd;
  var tx = this.tx, ty = this.ty, tz = this.tz, i, q;
  for (i = 0; i < m; i++) {
    var it = items[i];
    if (it.cull && it.n[0] * tx + it.n[1] * ty + it.n[2] * tz <= 0.001) continue;
    var k;
    if (it.kv >= 0) k = sd[it.kv];
    else { var v = it.v, s = 0; for (q = 0; q < v.length; q++) s += sd[v[q]]; k = s / v.length; }
    key[i] = k + it.kb; ord[cnt++] = i;
  }
  ord.subarray(0, cnt).sort(function (p, r) { return key[p] - key[r] || p - r; });
  this.count = cnt;
};
function r1(v) { return Math.round(v * 10) / 10; }
P.r1 = r1;
// 面の d 属性。座標は 10 倍した整数(world グループ側で scale(.1) をかける)
RP.d = function (it) {
  var sx = this.sx, sy = this.sy, v = it.v, s, i;
  if (it.t === 0) {
    s = 'M' + Math.round(sx[v[0]] * 10) + ' ' + Math.round(sy[v[0]] * 10);
    for (i = 1; i < v.length; i++) s += 'L' + Math.round(sx[v[i]] * 10) + ' ' + Math.round(sy[v[i]] * 10);
    return s + 'Z';
  }
  if (it.arcSe !== this.se) {
    var r = Math.round(it.r * 10), ry = it.t === 2 ? Math.round(it.r * this.se * 10) : r;
    it.arc = 'a' + r + ' ' + ry + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + ry + ' 0 1 0 ' + (-2 * r) + ' 0Z';
    it.arcSe = this.se; it.r10 = r;
  }
  return 'M' + (Math.round(sx[v[0]] * 10) - it.r10) + ' ' + Math.round(sy[v[0]] * 10) + it.arc;
};
// key 以下の(見えている)面の数。スプライトをどのスロットの前に挿すかを決める
RP.rank = function (k) {
  var lo = 0, hi = this.count, key = this.key, ord = this.order;
  while (lo < hi) { var mid = (lo + hi) >> 1; if (key[ord[mid]] <= k) lo = mid + 1; else hi = mid; }
  return lo;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
