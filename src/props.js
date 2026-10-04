// ペチ島 — 島の上のもの(小屋・桟橋・式場・洞窟・木・パイナップル畑)
(function (G) {
'use strict';
var P = G.Pechi, TAU = P.TAU, DEG = P.DEG;

var WALL = [182, 132, 86], DOOR = [72, 46, 32], THATCH = [226, 178, 84], THATCH2 = [206, 156, 68];
var WOOD = [128, 86, 52], FLOOR = [176, 132, 88], BOARD = [214, 172, 110], BOARD2 = [232, 200, 140];
var FLOWERS = [[255, 143, 179], [255, 211, 77], [255, 246, 232], [255, 170, 92], [214, 150, 255]];

// 場所ごとの向き: r=海へ向かう方向、t=それに直交する方向
function frame(sc, d, a) {
  return { o: sc.pt(d, a), rx: Math.cos(a), rz: Math.sin(a), tx: -Math.sin(a), tz: Math.cos(a) };
}
function L(sc, f, lx, y, lz) { return sc.vert(f.o.x + lx * f.tx + lz * f.rx, y, f.o.z + lx * f.tz + lz * f.rz); }
function centerOf(sc, vs) {
  var c = [0, 0, 0], i;
  for (i = 0; i < vs.length; i++) { c[0] += sc.vx[vs[i]]; c[1] += sc.vy[vs[i]]; c[2] += sc.vz[vs[i]]; }
  return [c[0] / vs.length, c[1] / vs.length, c[2] / vs.length];
}
var FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]; // z0, z1, 底, 天, x0, x1
function box(sc, f, x0, x1, y0, y1, z0, z1, col, o) {
  o = o || {};
  var v = [], i, xs = [x0, x1], ys = [y0, y1], zs = [z0, z1];
  for (i = 0; i < 8; i++) v.push(L(sc, f, xs[i & 1], ys[(i >> 1) & 1], zs[(i >> 2) & 1]));
  var c = centerOf(sc, v);
  for (i = 0; i < 6; i++) {
    if (i === 2 || (o.skip && o.skip.indexOf(i) >= 0)) continue;
    sc.poly(FACES[i].map(function (q) { return v[q]; }), i === 3 && o.top ? o.top : col,
      { center: c, cull: true, kv: o.kv, kb: o.kb, vary: o.vary });
  }
  return v;
}

function hut(sc, d, a) {
  var f = frame(sc, d, a), y0 = f.o.y - .2, kv = sc.vert(f.o.x, f.o.y, f.o.z), i, n = 6, m = 8;
  var bot = [], top = [], rim = [], c = [f.o.x, y0 + 4, f.o.z];
  for (i = 0; i < n; i++) {
    var an = i / n * TAU;
    bot.push(L(sc, f, 6 * Math.cos(an), y0, 6 * Math.sin(an)));
    top.push(L(sc, f, 6 * Math.cos(an), y0 + 6.8, 6 * Math.sin(an)));
  }
  for (i = 0; i < n; i++) sc.poly([bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]], WALL, { center: c, cull: true, kv: kv, kb: 5 });
  sc.poly([L(sc, f, 1.5, y0, 5.35), L(sc, f, -1.5, y0, 5.35), L(sc, f, -1.5, y0 + 4.8, 5.35), L(sc, f, 1.5, y0 + 4.8, 5.35)],
    DOOR, { center: c, cull: true, kv: kv, kb: 5.01, flat: true, vary: 0 });
  for (i = 0; i < m; i++) { var am = (i + .5) / m * TAU; rim.push(L(sc, f, 9.4 * Math.cos(am), y0 + 5.5, 9.4 * Math.sin(am))); }
  var apex = L(sc, f, 0, y0 + 15.6, 0);
  for (i = 0; i < m; i++) sc.poly([rim[i], rim[(i + 1) % m], apex], i & 1 ? THATCH : THATCH2, { center: [f.o.x, y0 + 6, f.o.z], cull: true, kv: kv, kb: 5.02 });
  sc.disc(f.o.x, y0 + 16, f.o.z, 1.1, [150, 104, 52], { kv: kv, kb: 5.03 });
}

function gazebo(sc, d, a) {
  var f = frame(sc, d, a), y0 = f.o.y - .3, kv = sc.vert(f.o.x, f.o.y, f.o.z), i;
  box(sc, f, -11, 11, y0, y0 + 1.3, -9.5, 9.5, WOOD, { kv: kv, kb: 5, top: FLOOR });
  [[-9.6, -8], [9.6, -8], [-9.6, 8], [9.6, 8]].forEach(function (p) {
    box(sc, f, p[0] - .7, p[0] + .7, y0 + 1.3, y0 + 13, p[1] - .7, p[1] + .7, WOOD, { kv: kv, kb: 5.01 });
  });
  box(sc, f, -3.2, 3.2, y0 + 1.3, y0 + 3.2, -1.2, 1.2, [150, 106, 66], { kv: kv, kb: 5.012 });   // ベンチ
  var rim = [L(sc, f, -13, y0 + 12.4, -11.2), L(sc, f, 13, y0 + 12.4, -11.2), L(sc, f, 13, y0 + 12.4, 11.2), L(sc, f, -13, y0 + 12.4, 11.2)];
  var apex = L(sc, f, 0, y0 + 24, 0);
  for (i = 0; i < 4; i++) sc.poly([rim[i], rim[(i + 1) % 4], apex], i & 1 ? THATCH : THATCH2, { center: [f.o.x, y0 + 13, f.o.z], cull: true, kv: kv, kb: 5.02 });
  sc.disc(f.o.x, y0 + 24.4, f.o.z, 1.2, [150, 104, 52], { kv: kv, kb: 5.03 });
  // 花かざり
  [[-9.6, 8], [9.6, 8], [-9.6, -8], [9.6, -8]].forEach(function (p, q) {
    var w = L(sc, f, p[0], y0 + 9.5, p[1] + (p[1] > 0 ? .9 : -.9));
    sc.disc(sc.vx[w], sc.vy[w], sc.vz[w], 1.3, FLOWERS[q % 2], { kv: kv, kb: 5.015 });
    w = L(sc, f, p[0], y0 + 7.4, p[1] + (p[1] > 0 ? .9 : -.9));
    sc.disc(sc.vx[w], sc.vy[w], sc.vz[w], 1.0, FLOWERS[(q + 1) % 2 + 1], { kv: kv, kb: 5.015 });
  });
  // 正面の看板2枚(上: けっこんしきじょう / 下: つり下げ板)
  var ka = L(sc, f, 0, f.o.y, 11.6);
  box(sc, f, -8.8, 8.8, y0 + 10.4, y0 + 14.4, 11.3, 11.9, BOARD, { kv: ka, kb: 5, vary: .02 });
  box(sc, f, -5.4, -5.1, y0 + 9.4, y0 + 10.4, 11.5, 11.7, [90, 62, 40], { kv: ka, kb: 5 });
  box(sc, f, 5.1, 5.4, y0 + 9.4, y0 + 10.4, 11.5, 11.7, [90, 62, 40], { kv: ka, kb: 5 });
  box(sc, f, -6.8, 6.8, y0 + 3.4, y0 + 9.4, 11.35, 11.85, BOARD2, { kv: ka, kb: 5, vary: .02 });
  sc.signs.push({ id: 'beam', W: 17.6, H: 4, n: [f.rx, 0, f.rz], kv: ka, kb: 5.05,
    o: L(sc, f, 8.8, y0 + 14.4, 11.94), u: L(sc, f, -8.8, y0 + 14.4, 11.94), w: L(sc, f, 8.8, y0 + 10.4, 11.94) });
  sc.signs.push({ id: 'board', W: 13.6, H: 6, n: [f.rx, 0, f.rz], kv: ka, kb: 5.05,
    o: L(sc, f, 6.8, y0 + 9.4, 11.89), u: L(sc, f, -6.8, y0 + 9.4, 11.89), w: L(sc, f, 6.8, y0 + 3.4, 11.89) });
}

function pier(sc, a) {
  var f = frame(sc, .985, a), i, n = 10, seg = 3.8;
  for (i = 0; i < n; i++) {
    var z0 = -5 + i * seg;
    box(sc, f, -3.6, 3.6, 2.0, 2.8, z0, z0 + seg, [112, 76, 46],
      { kb: 3, top: i & 1 ? [168, 120, 74] : [150, 104, 62], skip: [i > 0 ? 0 : -1, i < n - 1 ? 1 : -1] });
  }
  [1, 12, 23, 32.4].forEach(function (z) {
    [-3.95, 3.95].forEach(function (x) { box(sc, f, x - .55, x + .55, -1.2, 3.8, z - .55, z + .55, [104, 70, 42], { kb: 2.6 }); });
  });
}

function rock(sc, d, a, s) {
  var p = sc.pt(d, a), kv = sc.vert(p.x, 0, p.z);
  sc.disc(p.x, 0, p.z, s * 1.55, [236, 250, 252], { ground: true, kv: kv, kb: 0 });
  sc.disc(p.x, s * .45, p.z, s, [112, 116, 134], { kv: kv, kb: .1 });
  sc.disc(p.x - s * .25, s * .95, p.z - s * .1, s * .62, [150, 154, 172], { kv: kv, kb: .2 });
}

function cave(sc, a) {
  function arch(wide, dBot, dH, col, kb) {
    var vs = [], i, n = 12;
    for (i = 0; i <= n; i++) {
      var t = -1 + 2 * i / n, p = sc.pt(dBot - dH * Math.sqrt(Math.max(0, 1 - t * t)), a + wide * t * DEG);
      vs.push(sc.vert(p.x + .5 * Math.cos(a), p.y + .5, p.z + .5 * Math.sin(a)));
    }
    sc.poly(vs, col, { up: true, cull: true, kb: kb, flat: true, vary: 0, n3: [vs[0], vs[n], vs[n / 2]] });
  }
  arch(9.4, .53, .15, [104, 100, 120], 4.2);
  arch(7.2, .525, .12, [34, 28, 44], 4.3);
}

function spr(sc, sym, d, a, s, flip, kb) {
  var p = sc.pt(d, a);
  sc.sprites.push({ sym: sym, v: sc.vert(p.x, p.y, p.z), s: s, flip: !!flip, kb: kb == null ? 5 : kb });
}
function near(aDeg, list) {
  for (var i = 0; i < list.length; i++) {
    var df = Math.abs(((aDeg - list[i][0]) % 360 + 540) % 360 - 180);
    if (df < list[i][1]) return true;
  }
  return false;
}

P.PIER_A = 95; P.GAZEBO_A = 163; P.CAVE_A = 255;
P.HUTS = [58, 76, 114, 132];
P.FIELDS = [[26, 21], [207, 22], [314, 23]];

P.buildProps = function (sc) {
  var R = sc.rand, i, a, d, p;
  P.HUTS.forEach(function (h) { hut(sc, .815, h * DEG); });
  gazebo(sc, .815, P.GAZEBO_A * DEG);
  pier(sc, P.PIER_A * DEG);
  cave(sc, P.CAVE_A * DEG);
  [[1.05, 30, 3.2], [1.1, 39, 2.1], [1.045, 150, 2.8], [1.07, 204, 3.4], [1.11, 213, 2], [1.05, 300, 3], [1.09, 346, 2.4], [1.06, 122, 1.9], [1.08, 262, 2.6]]
    .forEach(function (q) { rock(sc, q[0], q[1] * DEG, q[2]); });

  // 山と草地に花
  for (i = 0; i < 135; i++) {
    a = R() * TAU; d = R() < .62 ? .17 + R() * .4 : .715 + R() * .16;
    p = sc.pt(d, a);
    sc.disc(p.x, p.y + .9, p.z, .85 + R() * .7, FLOWERS[(R() * FLOWERS.length) | 0], { kb: 2.5 });
  }
  // 山のしげみ
  for (i = 0; i < 46; i++) {
    a = R() * TAU; d = .27 + R() * .28;
    if (near(a / DEG, [[P.CAVE_A, 13]]) && d > .36) continue;
    p = sc.pt(d, a);
    var s = 2.3 + R() * 1.6, kv = sc.vert(p.x, p.y, p.z);
    sc.disc(p.x, p.y + s * .7, p.z, s, [40, 104, 56], { kv: kv, kb: 3 });
    sc.disc(p.x - s * .28, p.y + s * 1.1, p.z, s * .62, [76, 148, 66], { kv: kv, kb: 3.1 });
  }

  var busy = P.HUTS.map(function (h) { return [h, 8]; }).concat([[P.PIER_A, 6], [P.GAZEBO_A, 15], [P.CAVE_A, 12]]).concat(P.FIELDS);
  // ヤシの木(浜辺)
  for (i = 0; i < 20; i++) {
    a = i * 18 + (R() - .5) * 9;
    if (near(a, [[P.PIER_A, 7], [P.GAZEBO_A, 13], [P.CAVE_A, 11]])) continue;
    spr(sc, 'palm', .868 + R() * .05, a * DEG, .6 + R() * .26, R() < .5);
  }
  // 草地の木
  for (i = 0; i < 52; i++) {
    a = i * 6.92 + (R() - .5) * 4;
    if (near(a, busy)) continue;
    spr(sc, R() < .6 ? 'tree' : 'tree2', .748 + R() * .1, a * DEG, .62 + R() * .3, R() < .5);
  }
  // 山すそのジャングル
  for (i = 0; i < 48; i++) {
    a = R() * 360; d = .36 + R() * .185;
    if (near(a, [[P.CAVE_A, 14]])) continue;
    spr(sc, R() < .5 ? 'tree' : 'tree2', d, a * DEG, .55 + R() * .32, R() < .5);
  }
  // パイナップル畑(島じゅうパイナップル)
  P.FIELDS.forEach(function (fz) {
    [.737, .774, .811, .848, .566].forEach(function (dd, row) {
      var step = row === 4 ? 5.4 : 4.3;
      for (var aa = fz[0] - fz[1] + 2 + (row & 1) * step / 2; aa < fz[0] + fz[1] - 1; aa += step) {
        spr(sc, 'pine', dd, aa * DEG, .9 + R() * .25, R() < .5, 4);
      }
    });
  });
  // 洞窟の前に、かくされたパイナップルの山
  spr(sc, 'pile', .545, P.CAVE_A * DEG, 1, false, 6);
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
