// ペチ島 — 登場人物のポリゴン(ローポリ)モデル。
// 島と同じように、面ごとに光の当たり方で明るさを変えて描く。ブラウザでは毎コマ、
// 歩く向きとカメラに合わせて立体のまま描きなおす(スクリプトなし用には正面・背面の絵を書き出す)。
(function (G) {
'use strict';
var P = G.Pechi, TAU = P.TAU, DEG = P.DEG, hex = P.hex, L = P.LIGHT;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function unit(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function avg(pts) {
  var c = [0, 0, 0], i;
  for (i = 0; i < pts.length; i++) { c[0] += pts[i][0]; c[1] += pts[i][1]; c[2] += pts[i][2]; }
  return [c[0] / pts.length, c[1] / pts.length, c[2] / pts.length];
}
// 3x3 行列(行優先の9要素)
function mul(A, B) {
  var o = [], r, c;
  for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]);
  return o;
}
function app(A, v) { return [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]]; }
function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, s, 0, -s, c]; }      // +t で下にたれた手足が前へ出る
function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; }      // 前(+z)を向きへ回す
function tpose(A) { return [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]]; }

// ---- 形を作る ----------------------------------------------------------------
// 部品はどれも凸な立体(裏を向いた面を消すだけで正しく描ける)。座標は足もとが原点、y が上、+z が前。
// 手足は pivot を軸に、歩くたびに前後へ amp 度ゆれる。glow: 光る部品(暗くならない)
// spin: たて軸のまわりに回る部品(プロペラなど)。wob: 横にゆれる部品の番号(台風の渦)
function Fig() { this.parts = []; }
var FP = Fig.prototype;

FP.solid = function (v, faces, col, o) {
  o = o || {};
  var c = avg(v);
  var f = faces.map(function (ix) {
    var pts = ix.map(function (q) { return v[q]; }), fc = avg(pts);
    var n = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, sub(fc, c)) < 0) n = [-n[0], -n[1], -n[2]];
    return { i: ix, n: n, c: typeof col === 'function' ? col(sub(fc, c), n, fc) : col, g: o.glow ? 1 : 0 };
  });
  var p = { v: v, f: f, c: c, pivot: o.pivot || null, amp: o.amp || 0, kb: o.kb || 0, decals: [], spin: !!o.spin, wob: o.wob == null ? -1 : o.wob };
  this.parts.push(p);
  return p;
};
// 回転体。rings: 下から上へ [y, 半径x, 半径z, 中心のずれz]。cols: 帯ごとの色(1色でもよい)
FP.lathe = function (cx, cz, rings, n, cols, o) {
  o = o || {};
  var v = [], faces = [], i, j, rot = o.rot || 0, band = [], top = [], bot = [];
  for (j = 0; j < rings.length; j++) for (i = 0; i < n; i++) {
    var a = (i + .5) / n * TAU + rot, g = rings[j];
    v.push([cx + g[1] * Math.sin(a), g[0], cz + (g[3] || 0) + g[2] * Math.cos(a)]);
  }
  for (j = 0; j < rings.length - 1; j++) for (i = 0; i < n; i++) {
    faces.push([j * n + i, j * n + (i + 1) % n, (j + 1) * n + (i + 1) % n, (j + 1) * n + i]); band.push(j);
  }
  for (i = 0; i < n; i++) { bot.push(i); top.push((rings.length - 1) * n + i); }
  if (!o.open) { faces.push(bot); band.push(0); faces.push(top); band.push(rings.length - 2); }
  var k = 0;
  return this.solid(v, faces, Array.isArray(cols[0]) ? function () { return cols[band[k++]]; } : cols, o);
};
// 低いポリゴンの球(だ円体)。r: 半径 [x,y,z]、seg: 経線の数、ring: 帯の数。col(ずれ, 法線) で面ごとの色も決められる
FP.ball = function (c, r, seg, ring, col, o) {
  o = o || {};
  if (typeof r === 'number') r = [r, r, r];
  var v = [[c[0], c[1] + r[1], c[2]], [c[0], c[1] - r[1], c[2]]], faces = [], i, k, rot = o.rot || 0;
  for (k = 1; k < ring; k++) {
    var ph = Math.PI * k / ring;
    for (i = 0; i < seg; i++) {
      var a = (i + .5) / seg * TAU + rot;
      v.push([c[0] + r[0] * Math.sin(ph) * Math.sin(a), c[1] + r[1] * Math.cos(ph), c[2] + r[2] * Math.sin(ph) * Math.cos(a)]);
    }
  }
  function at(k, i) { return 2 + (k - 1) * seg + (i % seg); }
  for (i = 0; i < seg; i++) {
    faces.push([0, at(1, i + 1), at(1, i)]);
    for (k = 1; k < ring - 1; k++) faces.push([at(k, i), at(k, i + 1), at(k + 1, i + 1), at(k + 1, i)]);
    faces.push([1, at(ring - 1, i), at(ring - 1, i + 1)]);
  }
  return this.solid(v, faces, col, o);
};
// p0 から p1 への角柱(腕やアンテナ)
FP.stick = function (p0, p1, r0, r1, n, col, o) {
  var ax = unit(sub(p1, p0)), up = Math.abs(ax[1]) < .9 ? [0, 1, 0] : [0, 0, 1];
  var u = unit(cross(ax, up)), w = cross(ax, u), v = [], faces = [], i, j, top = [], bot = [];
  for (j = 0; j < 2; j++) for (i = 0; i < n; i++) {
    var a = (i + .5) / n * TAU, p = j ? p1 : p0, r = j ? r1 : r0;
    v.push([p[0] + (u[0] * Math.cos(a) + w[0] * Math.sin(a)) * r, p[1] + (u[1] * Math.cos(a) + w[1] * Math.sin(a)) * r, p[2] + (u[2] * Math.cos(a) + w[2] * Math.sin(a)) * r]);
  }
  for (i = 0; i < n; i++) { faces.push([i, (i + 1) % n, n + (i + 1) % n, n + i]); bot.push(i); top.push(n + i); }
  faces.push(bot, top);
  return this.solid(v, faces, col, o);
};
FP.box = function (x0, x1, y0, y1, z0, z1, col, o) {
  var v = [], i;
  for (i = 0; i < 8; i++) v.push([i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0]);
  return this.solid(v, [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]], col, o);
};
// 横から見た凸多角形 poly([x,z] の列)を、y0〜y1 の厚みの板にする(帽子のつばなど)
FP.slab = function (poly, y0, y1, col, o) {
  var v = [], faces = [], n = poly.length, i, top = [], bot = [];
  for (i = 0; i < n; i++) { v.push([poly[i][0], y0 + (poly[i][2] || 0), poly[i][1]]); v.push([poly[i][0], y1 + (poly[i][2] || 0), poly[i][1]]); }
  for (i = 0; i < n; i++) { faces.push([2 * i, 2 * ((i + 1) % n), 2 * ((i + 1) % n) + 1, 2 * i + 1]); bot.push(2 * i); top.push(2 * i + 1); }
  faces.push(bot, top);
  return this.solid(v, faces, col, o);
};
// 前から見た平たい板(リボンの羽など)。poly は [x,y] の列、z0〜z1 の厚み
FP.plate = function (poly, z0, z1, col, o) {
  var v = [], faces = [], n = poly.length, i, a = [], b = [];
  for (i = 0; i < n; i++) { v.push([poly[i][0], poly[i][1], z0]); v.push([poly[i][0], poly[i][1], z1]); }
  for (i = 0; i < n; i++) { faces.push([2 * i, 2 * ((i + 1) % n), 2 * ((i + 1) % n) + 1, 2 * i + 1]); a.push(2 * i); b.push(2 * i + 1); }
  faces.push(a, b);
  return this.solid(v, faces, col, o);
};

// 部品の表面にはる「シール」(目・口・ボタンなど)。pts は dir の方向から見た [横, 縦] の形。
// 部品の中から dir へまっすぐ進んで表面にぶつかる点へ、ひとつずつ頂点を置く(面の折れ目にそって曲がる)
FP.decal = function (p, pts, col, o) {
  o = o || {};
  var dir = o.dir || [0, 0, 1], c = p.c, sd = o.sub || 1, list = [], i, j;
  for (i = 0; i < pts.length; i++) for (j = 0; j < sd; j++) {
    var a = pts[i], b = pts[(i + 1) % pts.length], t = j / sd;
    list.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  function origin(q) {
    if (Math.abs(dir[0]) > .5) return [c[0], q[1], dir[0] > 0 ? -q[0] : q[0]];
    return [dir[2] < 0 ? -q[0] : q[0], q[1], c[2]];
  }
  function hit(q) {
    var s = origin(q), best = 1e9, bn = null, k, f;
    for (k = 0; k < p.f.length; k++) {
      f = p.f[k]; var dn = dot(f.n, dir);
      if (dn <= 1e-6) continue;
      var tt = dot(f.n, sub(p.v[f.i[0]], s)) / dn;
      if (tt < best) { best = tt; bn = f.n; }
    }
    if (!bn) bn = dir;
    return { p: [s[0] + dir[0] * best + bn[0] * .03, s[1] + dir[1] * best + bn[1] * .03, s[2] + dir[2] * best + bn[2] * .03], n: bn };
  }
  var cen = [0, 0];
  pts.forEach(function (q) { cen[0] += q[0] / pts.length; cen[1] += q[1] / pts.length; });
  var d = { v: list.map(function (q) { return hit(q).p; }), n: hit(cen).n, c: col, g: o.glow ? 1 : 0, min: o.min == null ? .12 : o.min };
  p.decals.push(d);
  return d;
};
// 形の頂点をまとめて動かす(体を前へかたむけるなど)。シールをはったあとで使う
FP.bend = function (parts, tf) {
  parts.forEach(function (p) {
    function nt(n, at) { var a = tf(at), b = tf([at[0] + n[0], at[1] + n[1], at[2] + n[2]]); return unit(sub(b, a)); }
    p.f.forEach(function (f) { f.n = nt(f.n, p.v[f.i[0]]); });
    p.decals.forEach(function (d) { d.n = nt(d.n, d.v[0]); d.v = d.v.map(tf); });
    p.v = p.v.map(tf); p.c = tf(p.c);
    if (p.pivot) p.pivot = tf(p.pivot);
  });
};
function rotAbout(pv, ang) {          // x 軸のまわりに pv を中心として回す(+ で上の部分が後ろへ)
  var c = Math.cos(ang), s = Math.sin(ang);
  return function (q) { var y = q[1] - pv[1], z = q[2] - pv[2]; return [q[0], pv[1] + c * y + s * z, pv[2] - s * y + c * z]; };
}
// 多角形の形(シール用)
function ngon(x, y, rx, ry, n, rot) {
  var out = [], i;
  for (i = 0; i < n; i++) { var a = (i / n) * TAU + (rot || 0); out.push([x + rx * Math.sin(a), y + ry * Math.cos(a)]); }
  return out;
}
function mirror(pts) { return pts.map(function (q) { return [-q[0], q[1]]; }).reverse(); }

// ---- 登場人物 ---------------------------------------------------------------
var SKIN = [255, 223, 196], INK = [43, 36, 48], WHITE = [251, 251, 246], GOLD = [233, 183, 48], NAVY = [42, 51, 82];
var PINK = [255, 143, 192], YELLOW = [255, 210, 63], LEAF = [63, 158, 70], PINE = [245, 184, 46];
var DARK = [42, 46, 58], CYAN = [53, 214, 255], SHELL = [244, 246, 250];
// 顔の向き(前=0度)と高さ(-1〜1)。髪の生えぎわを決めるのに使う
function ang(d) { return Math.abs(Math.atan2(d[0], d[2]) / DEG); }

var BUILD = {
  pechi: function () {
    var F = new Fig(), s;
    for (s = -1; s <= 1; s += 2) {
      var hip = { pivot: [s * 1.55, 5.3, 0], amp: s * 26 }, sh = { pivot: [s * 4.2, 10.2, 0], amp: -s * 24 };
      F.lathe(s * 1.55, 0, [[1.1, .92, .92], [5.6, 1, 1]], 6, [155, 122, 76], hip);
      F.box(s * 1.55 - 1.12, s * 1.55 + 1.12, 0, 1.35, -1.15, 2, [91, 58, 34], hip);
      F.lathe(s * 4.2, 0, [[6.1, .88, .88], [6.6, .95, .95], [7.1, .95, .95], [10.7, .95, .95]], 6, [WHITE, [227, 174, 44], WHITE], sh);
      F.ball([s * 4.2, 5.45, .05], .98, 6, 3, SKIN, sh);
      F.box(Math.min(s * 2.3, s * 4.55), Math.max(s * 2.3, s * 4.55), 10.55, 11.3, -1.35, 1.35, GOLD, { kb: .4 });
    }
    var body = F.lathe(0, 0, [[4.9, 3.75, 2.75], [8.2, 3.5, 2.6], [10.95, 3.2, 2.35]], 8, WHITE);
    F.decal(body, [[-1.35, 10.9], [1.35, 10.9], [0, 8.5]], NAVY);
    F.decal(body, ngon(0, 7.5, .46, .46, 6), [227, 174, 44]);
    F.decal(body, ngon(0, 6.05, .46, .46, 6), [227, 174, 44]);
    var head = F.ball([0, 14.6, 0], [4.75, 4.55, 4.45], 8, 6, function (d) {
      var y = d[1] / 4.55, a = ang(d);
      return y > .5 || (y > 0 && a > 50) || (y > -.5 && a > 100) || (y > -.87 && a > 130) ? INK : SKIN;
    });
    F.decal(head, ngon(-1.75, 13.3, .6, .84, 6), INK);
    F.decal(head, ngon(1.75, 13.3, .6, .84, 6), INK);
    F.decal(head, [[-2.9, 15.1], [-1.05, 14.58], [-1.05, 14.16], [-2.9, 14.66]], INK);
    F.decal(head, mirror([[-2.9, 15.1], [-1.05, 14.58], [-1.05, 14.16], [-2.9, 14.66]]), INK);
    F.decal(head, [[-.88, 11.5], [0, 11.86], [.88, 11.5], [.88, 11.14], [0, 11.48], [-.88, 11.14]], [138, 75, 58]);
    F.decal(head, ngon(-3.05, 12.35, .9, .52, 6), [255, 186, 176]);
    F.decal(head, ngon(3.05, 12.35, .9, .52, 6), [255, 186, 176]);
    // 船長の帽子
    F.lathe(0, .3, [[17.6, 4.8, 4.65], [19.1, 4.9, 4.75]], 8, NAVY, { kb: .1 });
    var crown = F.lathe(0, .5, [[19.1, 5, 4.85], [20.4, 6.05, 5.75], [21.75, 5.6, 5.3], [22.35, 3.5, 3.3]], 8, [255, 255, 255], { kb: .2 });
    F.decal(crown, ngon(0, 20.05, 1.1, 1.1, 6), GOLD);
    F.decal(crown, ngon(0, 20.05, .45, .45, 6), [183, 134, 28]);
    F.slab([[-4.1, 2.4], [-3, 5], [0, 6.2], [3, 5], [4.1, 2.4]], 17.3, 17.75, [28, 34, 56], { kb: .3 });
    return F;
  },

  hiro: function () {
    var F = new Fig(), s, up = [];
    for (s = -1; s <= 1; s += 2) {
      var hip = { pivot: [s * 1.45, 4.7, 0], amp: s * 34 };
      F.lathe(s * 1.45, 0, [[.9, .7, .7], [4.9, .8, .8]], 6, SKIN, hip);
      F.ball([s * 1.45, .55, .5], [.95, .58, 1.35], 6, 3, SKIN, hip);
    }
    var dress = F.lathe(0, 0, [[3.8, 4.75, 4.05], [5.2, 4.2, 3.6], [9.7, 2.55, 2.2], [10.75, 2.3, 2]], 8, [[247, 196, 50], YELLOW, [73, 168, 78]]);
    up.push(dress);
    // パイナップルをかかえる両うで
    up.push(F.stick([2.35, 9.6, .2], [3.2, 7.3, 2.3], .6, .55, 5, SKIN));
    up.push(F.stick([-2.2, 9.6, .5], [2.2, 8.5, 3], .6, .55, 5, SKIN, { kb: .6 }));
    up.push(F.ball([3.25, 7.2, 2.45], .72, 5, 3, SKIN, { kb: .7 }));
    up.push(F.ball([2.3, 8.45, 3.1], .72, 5, 3, SKIN, { kb: .7 }));
    var fruit = F.ball([3.95, 8, 1.55], [1.8, 2.25, 1.8], 7, 4, PINE, { kb: .3 });
    up.push(fruit, F.lathe(3.95, 1.55, [[9.9, 1.15, 1.15], [12.1, .05, .05]], 5, LEAF, { kb: .3 }));
    F.decal(fruit, [[3.2, 9], [4.5, 7.6], [4.2, 7.3], [2.9, 8.7]], [201, 138, 26], { min: .3 });
    F.decal(fruit, [[3.6, 7.2], [4.9, 8.6], [5.1, 8.2], [3.9, 6.9]], [201, 138, 26], { min: .3 });
    var head = F.ball([0, 14.6, .2], [4.55, 4.4, 4.3], 8, 6, function (d) {
      var y = d[1] / 4.4, a = ang(d);
      return y > .5 || (y > 0 && a > 60) || (y > -.5 && a > 110) ? PINK : SKIN;
    });
    up.push(head);
    F.decal(head, [[-2.78, 13.5], [-1.9, 14.35], [-1.02, 13.5], [-1.3, 13.22], [-1.9, 13.8], [-2.5, 13.22]], INK);
    F.decal(head, mirror([[-2.78, 13.5], [-1.9, 14.35], [-1.02, 13.5], [-1.3, 13.22], [-1.9, 13.8], [-2.5, 13.22]]), INK);
    F.decal(head, [[-1.15, 12.15], [1.15, 12.15], [.85, 11.1], [0, 10.6], [-.85, 11.1]], [168, 50, 62]);
    F.decal(head, [[-.55, 11.05], [.55, 11.05], [0, 10.68]], [255, 143, 157]);
    F.decal(head, ngon(-3.05, 12.6, .9, .52, 6), [255, 172, 171]);
    F.decal(head, ngon(3.05, 12.6, .9, .52, 6), [255, 172, 171]);
    // ふわふわの髪
    [[0, 15.6, -2.6, 5.8, 8], [-5, 13.6, -1.9, 3.5, 6], [5, 13.6, -1.9, 3.5, 6], [-3.6, 19.3, -1, 3.3, 6], [3.6, 19.3, -1, 3.3, 6],
      [0, 20.5, -1.4, 3.4, 6], [-5.6, 9.9, -2.3, 2.7, 6], [5.6, 9.9, -2.3, 2.7, 6]].forEach(function (q) {
      up.push(F.ball([q[0], q[1], q[2]], q[3], q[4], q[4] === 8 ? 5 : 4, PINK, { rot: q[0] * .3 }));
    });
    var pin = F.ball([-2.9, 20.4, 2.1], [.95, 1.2, .95], 6, 3, PINE, { kb: .4 });
    up.push(pin, F.lathe(-2.9, 2.1, [[21.3, .6, .6], [22.7, .05, .05]], 4, LEAF, { kb: .4 }));
    F.bend(up, rotAbout([0, 4.6, 0], -7 * DEG));    // 走るように少し前かがみ
    return F;
  },

  mira: function () {
    var F = new Fig(), s;
    for (s = -1; s <= 1; s += 2) {
      var hip = { pivot: [s * 1.6, 4.2, 0], amp: s * 20 }, sh = { pivot: [s * 3, 8.7, 0], amp: -s * 15 };
      F.lathe(s * 1.6, 0, [[1.7, .75, .75], [2.8, .78, .78], [3.25, .8, .8], [4.5, .75, .75]], 6, [DARK, SHELL, DARK], hip);
      F.box(s * 1.6 - 1.25, s * 1.6 + 1.25, .38, 1.95, -1.1, 2, SHELL, hip);
      F.box(s * 1.6 - 1.25, s * 1.6 + 1.25, 0, .4, -1.1, 2, CYAN, { glow: true, pivot: hip.pivot, amp: hip.amp });
      F.stick([s * 3, 8.7, 0], [s * 5.5, 11.2, .3], .65, .65, 6, DARK, sh);
      var hand = F.ball([s * 6.05, 11.75, .4], 1.3, 6, 4, DARK, sh);
      F.decal(hand, ngon(s * 6.05, 11.75, .52, .52, 6), CYAN, { glow: true });
      F.stick([s * 2.3, 19, 0], [s * 3.6, 22.1, 0], .26, .22, 4, [125, 135, 156]);
      F.ball([s * 3.7, 22.6, 0], 1.05, 6, 3, CYAN, { glow: true });
      var ear = F.stick([s * 5.4, 14.6, 0], [s * 6.55, 14.6, 0], 1.35, 1.3, 8, [201, 209, 223], { kb: -.2 });
      F.decal(ear, ngon(0, 14.6, .58, .58, 6), CYAN, { dir: [s, 0, 0], glow: true });
    }
    var body = F.lathe(0, 0, [[4, 2.8, 2.3], [4.6, 3.3, 2.75], [9.2, 3.3, 2.75], [9.9, 2.6, 2.2]], 8, SHELL);
    F.decal(body, [[-1.7, 8.05], [1.7, 8.05], [1.95, 7.8], [1.95, 6], [1.7, 5.75], [-1.7, 5.75], [-1.95, 6], [-1.95, 7.8]], DARK);
    F.decal(body, [[-1.15, 7.45], [1.15, 7.45], [1.15, 7.2], [-1.15, 7.2]], CYAN, { glow: true });
    F.decal(body, [[-1.15, 6.9], [1.15, 6.9], [1.15, 6.65], [-1.15, 6.65]], CYAN, { glow: true });
    F.decal(body, [[-1.15, 6.35], [.3, 6.35], [.3, 6.1], [-1.15, 6.1]], CYAN, { glow: true });
    F.decal(body, [[-1.5, 8.4], [1.5, 8.4], [1.5, 5.4], [-1.5, 5.4]], [223, 229, 238], { dir: [0, 0, -1] });
    F.lathe(0, 0, [[9.6, 1.25, 1.1], [10.9, 1.25, 1.1]], 6, DARK);
    var head = F.ball([0, 14.8, 0], [6, 5, 4.9], 10, 6, [249, 251, 255]);
    F.decal(head, [[-3.4, 17.7], [3.4, 17.7], [4.7, 16.4], [4.7, 12.8], [3.4, 11.5], [-3.4, 11.5], [-4.7, 12.8], [-4.7, 16.4]], [13, 16, 32], { sub: 3, min: .2 });
    F.decal(head, [[-3.7, 16.5], [-1.2, 17.25], [-1.1, 16.9], [-3.4, 16.15]], [58, 66, 102], { min: .2 });
    F.decal(head, ngon(-2, 14.8, 1.25, 1.25, 6), CYAN, { glow: true, min: .2 });
    F.decal(head, ngon(2, 14.8, 1.25, 1.25, 6), CYAN, { glow: true, min: .2 });
    F.decal(head, ngon(-2.35, 15.2, .42, .42, 6), [200, 246, 255], { glow: true, min: .2 });
    F.decal(head, ngon(1.65, 15.2, .42, .42, 6), [200, 246, 255], { glow: true, min: .2 });
    F.decal(head, ngon(0, 12.8, .6, .42, 6), CYAN, { glow: true, min: .2 });
    // 頭のリボン
    F.plate([[2.9, 19.9], [.8, 21.2], [.8, 18.6]], .6, 1.5, [255, 111, 165], { kb: .2 });
    F.plate([[2.9, 19.9], [5, 18.6], [5, 21.2]], .6, 1.5, [255, 111, 165], { kb: .2 });
    F.ball([2.9, 19.9, 1.15], .68, 5, 3, [255, 156, 196], { kb: .3 });
    return F;
  }
};
// 台風になったヒロミーヌ(物語の「台風化」)。渦の輪が回りながら横にゆれる
BUILD.typhoon = function () {
  var F = new Fig();
  F.lathe(0, 0, [[0, .9, .9], [18.4, 3.4, 3.4]], 6, [214, 226, 242], { spin: true, kb: -60 });     // 渦のしん(輪の内側なので、いつもいちばん奥)
  [[2.2, 2.6], [6, 4.2], [10, 5.8], [14, 7.4], [18, 9]].forEach(function (q, i) {
    var r = q[1];
    F.lathe(0, 0, [[q[0] - .75, r * .8, r * .8], [q[0], r, r], [q[0] + .6, r * .86, r * .86]], 8, i & 1 ? [214, 226, 242] : [240, 245, 252], { spin: true, wob: i, rot: i * .4 });
  });
  F.lathe(0, 0, [[18.62, 4.8, 4.8], [18.7, 4.6, 4.6]], 8, [168, 188, 214], { spin: true, wob: 4, kb: .2 });   // 渦の目
  var head = F.ball([0, 22.2, .4], [3.4, 3.2, 3.2], 8, 5, function (d) {
    var y = d[1] / 3.2, a = ang(d);
    return y > .4 || (y > -.3 && a > 70) || a > 120 ? PINK : SKIN;
  });
  for (var s = -1; s <= 1; s += 2) {            // ぐるぐる目
    F.decal(head, ngon(s * 1.25, 21.9, .85, .85, 6), INK);
    F.decal(head, ngon(s * 1.25, 21.9, .55, .55, 6), SKIN);
    F.decal(head, ngon(s * 1.25, 21.9, .26, .26, 6), INK);
    F.ball([s * 3.3, 21.5, -1], 2.3, 6, 4, PINK);
  }
  F.decal(head, [[-.75, 20.65], [0, 20.3], [.75, 20.65], [.75, 20.4], [0, 20.05], [-.75, 20.4]], INK);
  F.ball([0, 24.3, -1.1], 2.6, 6, 4, PINK);
  F.ball([0, 22.4, -2.3], 3.2, 6, 4, PINK);
  return F;
};
// ミラmini(ハートの目のドローン)
BUILD.mini = function () {
  var F = new Fig();
  function heart(x, y, k) {
    return [[0, -.75], [-.8, .05], [-.85, .45], [-.6, .72], [-.25, .72], [0, .45], [.25, .72], [.6, .72], [.85, .45], [.8, .05]].map(function (q) { return [x + q[0] * k, y + q[1] * k]; });
  }
  var body = F.ball([0, 1, 0], [3.3, 2.5, 3], 8, 5, [249, 251, 255]);
  F.decal(body, [[-2, 2.5], [2, 2.5], [2.5, 2], [2.5, .1], [2, -.4], [-2, -.4], [-2.5, .1], [-2.5, 2]], [13, 16, 32], { sub: 2, min: .2 });
  F.decal(body, heart(-1.15, 1, 1.05), [255, 92, 154], { glow: true, min: .2 });
  F.decal(body, heart(1.15, 1, 1.05), [255, 92, 154], { glow: true, min: .2 });
  F.decal(body, ngon(0, -.95, .45, .38, 6), CYAN, { glow: true, min: .2 });
  F.stick([0, 3.3, 0], [0, 4.75, 0], .22, .22, 4, [125, 135, 156]);
  F.box(-3.5, 3.5, 4.7, 4.95, -.38, .38, [170, 179, 196], { spin: true });
  return F;
};
var FIGS = {};
P.fig = function (name) { return FIGS[name] || (FIGS[name] = BUILD[name]()); };

// ---- 描く ------------------------------------------------------------------
// cam: {sa, ca, se, ce}(島と同じカメラ)。pose: {yaw: 向き, sw: 歩きのゆれ -1〜1, bob: 上下, chr: 色味}
// 奥の部品から順に、見えている面の d と色を返す。座標は 10 倍した整数
P.figFrame = function (fig, cam, pose) {
  var C = [cam.ca, 0, -cam.sa, cam.sa * cam.se, -cam.ce, cam.ca * cam.se, cam.sa * cam.ce, cam.se, cam.ca * cam.ce];
  var Ry = rotY(pose.yaw), CR = mul(C, Ry), LR = app(tpose(Ry), L), chr = pose.chr || [1, 1, 1], bob = pose.bob || 0;
  // 動かない部品は、カメラ・向き・色味が前のコマと同じなら前の結果をそのまま使う
  var key = CR.join() + '|' + chr.join() + '|' + bob, same = fig._key === key, out = [], k;
  fig._key = key;
  for (k = 0; k < fig.parts.length; k++) {
    var p = fig.parts[k], A = CR, Lp = LR, b = [0, -cam.ce * bob, cam.se * bob], M;
    if (p.amp && pose.sw) {
      var pv = p.pivot, q;
      M = rotX(p.amp * pose.sw * DEG); q = app(M, pv);
      A = mul(CR, M); Lp = app(tpose(M), LR);
      b = app(CR, [pv[0] - q[0], pv[1] - q[1] + bob, pv[2] - q[2]]);
    } else if (p.spin && pose.spin) {
      M = rotY(pose.spin); A = mul(CR, M); Lp = app(tpose(M), LR);
    }
    if (p.wob >= 0 && pose.wob) { var dx = pose.wob[p.wob]; b = [b[0] + CR[0] * dx, b[1] + CR[3] * dx, b[2] + CR[6] * dx]; }
    out.push({ p: p, A: A, Lp: Lp, b: b, depth: dot([A[6], A[7], A[8]], p.c) + b[2] + p.kb, keep: same && A === CR && p.wob < 0 && p._list });
  }
  out.sort(function (x, y) { return x.depth - y.depth; });
  var res = [];
  out.forEach(function (o) {
    var p = o.p, A = o.A, b = o.b, Lp = o.Lp, list = [], i, j;
    if (o.keep) { res.push(p._list); return; }
    function shade(n, c, g) {
      if (g) return hex(c);
      var lum = .66 + .46 * Math.max(0, dot(n, Lp)) + .06 * n[1];
      return hex([c[0] * lum * chr[0], c[1] * lum * chr[1], c[2] * lum * chr[2]]);
    }
    function path(vs) {
      var s = '', q, v;
      for (q = 0; q < vs.length; q++) {
        v = vs[q];
        s += (q ? 'L' : 'M') + Math.round((A[0] * v[0] + A[1] * v[1] + A[2] * v[2] + b[0]) * 10) + ' ' + Math.round((A[3] * v[0] + A[4] * v[1] + A[5] * v[2] + b[1]) * 10);
      }
      return s + 'Z';
    }
    for (i = 0; i < p.f.length; i++) {
      var f = p.f[i];
      if (A[6] * f.n[0] + A[7] * f.n[1] + A[8] * f.n[2] <= .002) continue;
      var vs = [];
      for (j = 0; j < f.i.length; j++) vs.push(p.v[f.i[j]]);
      list.push({ d: path(vs), c: shade(f.n, f.c, f.g) });
    }
    for (i = 0; i < p.decals.length; i++) {
      var dc = p.decals[i];
      if (A[6] * dc.n[0] + A[7] * dc.n[1] + A[8] * dc.n[2] <= dc.min) continue;
      list.push({ d: path(dc.v), c: shade(dc.n, dc.c, dc.g), dec: 1 });
    }
    var pv = p.pivot ? [A[0] * p.pivot[0] + A[1] * p.pivot[1] + A[2] * p.pivot[2] + b[0], A[3] * p.pivot[0] + A[4] * p.pivot[1] + A[5] * p.pivot[2] + b[1]] : null;
    res.push(p._list = { part: p, list: list, pv: pv });
  });
  return res;
};
// 面の数(DOM の <path> をいくつ用意するか)
P.figSize = function (fig) {
  var n = 0;
  fig.parts.forEach(function (p) { n += p.f.length + p.decals.length; });
  return n;
};

// 1枚の絵として書き出す(スクリプトなし用・名札用)。smil なら手足のゆれと上下を SVG アニメで動かす
P.figMarkup = function (name, cam, yaw, smil, dur, chr) {
  var fr = P.figFrame(P.fig(name), cam, { yaw: yaw, sw: 0, chr: chr }), s = '', walker = false;
  fr.forEach(function (o) {
    var body = o.list.map(function (q) { return '<path class="' + (q.dec ? 'pd' : 'pf') + '" color="' + q.c + '" d="' + q.d + '"/>'; }).join('');
    if (body && smil && o.part.amp) {
      var px = Math.round(o.pv[0] * 10), py = Math.round(o.pv[1] * 10), a = o.part.amp * .8;
      body = '<g>' + body + '<animateTransform attributeName="transform" type="rotate" values="' + a + ' ' + px + ' ' + py + ';' + (-a) + ' ' + px + ' ' + py + ';' + a + ' ' + px + ' ' + py +
        '" keyTimes="0;.5;1" dur="' + dur + 's" repeatCount="indefinite"/></g>';
      walker = true;
    }
    if (body && smil && o.part.spin) body = '<g>' + body + '<animateTransform attributeName="transform" type="scale" values="1 1;.15 1;1 1" dur=".22s" repeatCount="indefinite"/></g>';
    s += body;
  });
  if (walker) s += '<animateTransform attributeName="transform" type="translate" values="0 0;0 -9;0 0" dur="' + (dur / 2) + 's" repeatCount="indefinite"/>';
  return '<g transform="scale(.1)"><g>' + s + '</g></g>';
};
// スクリプトなし用: 右へ歩くときの正面と背面の絵(左へ歩くときは左右を反転して使う)。足もとの影つき
P.figSprites = function (name, cam, dur, chr) {
  var az = Math.atan2(cam.sa, cam.ca), sh = '<ellipse rx="4.8" ry="' + P.r1(4.8 * cam.se) + '" fill="#16301c" opacity=".26"/>';
  return { f: sh + P.figMarkup(name, cam, az + 40 * DEG, true, dur, chr), b: sh + P.figMarkup(name, cam, az + 140 * DEG, true, dur, chr) };
};
// 名札の顔(viewBox は P.PORTRAIT_VIEW)
P.PORTRAIT_VIEW = '-7.5 -24 15 15';
P.portrait = function (name) {
  var el = 8 * DEG;
  return P.figMarkup(name, { sa: 0, ca: 1, se: Math.sin(el), ce: Math.cos(el) }, 14 * DEG, false);
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
