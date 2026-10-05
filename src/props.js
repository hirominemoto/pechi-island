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
      { center: c, cull: true, kv: o.kv, kb: o.kb, vary: o.vary, lit: o.lit });
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
    DOOR, { center: c, cull: true, kv: kv, kb: 5.01, flat: true, vary: 0, emit: [255, 206, 122] });
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
  box(sc, f, -8.8, 8.8, y0 + 10.4, y0 + 14.4, 11.3, 11.9, BOARD, { kv: ka, kb: 5, vary: .02, lit: .85 });
  box(sc, f, -5.4, -5.1, y0 + 9.4, y0 + 10.4, 11.5, 11.7, [90, 62, 40], { kv: ka, kb: 5 });
  box(sc, f, 5.1, 5.4, y0 + 9.4, y0 + 10.4, 11.5, 11.7, [90, 62, 40], { kv: ka, kb: 5 });
  box(sc, f, -6.8, 6.8, y0 + 3.4, y0 + 9.4, 11.35, 11.85, BOARD2, { kv: ka, kb: 5, vary: .02, lit: .85 });
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

// 洞窟: 山のふもとの岩の入口。奥には青白く光る発光チューブが残されている
var ROCK = [126, 130, 150], STONE = [158, 160, 178], STONE2 = [134, 136, 156];
function cave(sc, aDeg) {
  var a = aDeg * DEG, f = frame(sc, .537, a), K = 1.12, y0 = f.o.y - .3, i;
  var kv = L(sc, f, 0, f.o.y, 2);
  // 入口の外側(岩)と内側(穴)の輪郭。左下から上を通って右下へ
  var OUT = [[-13.2, -1.2], [-13.9, 6.5], [-12.3, 13.4], [-7.7, 19.4], [0, 22], [8, 20], [12.7, 14], [13.9, 6.4], [13.1, -1.2]];
  var INN = [[-8, 0], [-8.5, 6], [-7.3, 11.4], [-4.3, 15.1], [0, 16.6], [4.5, 15.1], [7.5, 11.4], [8.5, 6], [8.1, 0]];
  var n = OUT.length, fo = [], fi = [], bo = [], bi = [], deep = [], DEPTH = 10 * K;
  var inside = [f.o.x - 5 * f.rx, y0 + 8, f.o.z - 5 * f.rz];
  for (i = 0; i < n; i++) {
    var ox = OUT[i][0] * K, oy = y0 + OUT[i][1] * K, lz = 0;
    fo.push(L(sc, f, ox, oy, 0));
    fi.push(L(sc, f, INN[i][0] * K, y0 + INN[i][1] * K, 0));
    // 岩のひさし: 外側の輪郭を、山の斜面にぶつかるまで奥へのばす
    while (lz > -30 && sc.ground(f.o.x + ox * f.tx + lz * f.rx, f.o.z + ox * f.tz + lz * f.rz) < oy - .2) lz -= .75;
    deep.push(lz);
    bo.push(L(sc, f, ox * .93, oy + .4, lz - .8));
    bi.push(L(sc, f, INN[i][0] * K * .72, y0 + INN[i][1] * K * .72, -DEPTH));
  }
  for (i = 0; i < n - 1; i++) {
    if (deep[i] < -1 || deep[i + 1] < -1) sc.poly([fo[i], fo[i + 1], bo[i + 1], bo[i]], ROCK, { center: inside, cull: true, kv: kv, kb: 5.04, vary: .1 });
    sc.poly([fo[i], fo[i + 1], fi[i + 1], fi[i]], i & 1 ? STONE : STONE2, { center: inside, cull: true, kv: kv, kb: 5.06, vary: .1, cv: .8 });
  }
  // 入口の上からたれる岩
  [[[-3.5, 15.9], [-1.1, 16.7], [-2.5, 13.5]], [[.5, 16.9], [2.7, 16.4], [1.8, 13.9]], [[4.1, 15.6], [6, 13.7], [5.5, 11.6]]].forEach(function (t) {
    sc.poly(t.map(function (q) { return L(sc, f, q[0] * K, y0 + q[1] * K, .15); }), STONE2, { center: inside, cull: true, kv: kv, kb: 5.07, vary: .05, cv: .8 });
  });
  // 入口の両わきの岩
  [[-15.6, 1.6, 2.6, 3.4], [-11.9, 1, 5.2, 2.2], [15.8, 1.8, 2.4, 3.6], [12.4, .9, 5.4, 2.1]].forEach(function (q) {
    var x = f.o.x + q[0] * K * f.tx + q[2] * f.rx, z = f.o.z + q[0] * K * f.tz + q[2] * f.rz, gy = sc.ground(x, z);
    sc.disc(x, gy + q[1], z, q[3], [118, 122, 142], { kv: kv, kb: 5.08 });
    sc.disc(x - q[3] * .25, gy + q[1] + q[3] * .45, z, q[3] * .6, [158, 162, 180], { kv: kv, kb: 5.09 });
  });
  // 岩の上のしげみと、たれさがるつる
  [[-9.2, 17.6, 2.3], [-3, 22, 2.7], [5, 21.6, 2.4], [10.6, 16.4, 2.1], [-11.6, 12.4, 1.7], [7.2, 18.6, 1.5]].forEach(function (q, m) {
    var w = L(sc, f, q[0] * K, y0 + q[1] * K, m < 4 ? -1.2 : .5);
    sc.disc(sc.vx[w], sc.vy[w], sc.vz[w], q[2], m & 1 ? [52, 122, 62] : [42, 106, 56], { kv: kv, kb: 5.1 });
    sc.disc(sc.vx[w] - q[2] * .3, sc.vy[w] + q[2] * .4, sc.vz[w], q[2] * .55, [84, 156, 70], { kv: kv, kb: 5.11 });
  });

  // 洞窟の中(入口の形で切り抜いて描く)。壁は内側を向いた面だけ見える
  var axis = [f.o.x - DEPTH / 2 * f.rx, y0 + 7 * K, f.o.z - DEPTH / 2 * f.rz];
  function wall(vs, col) {
    var x = sc.vx, y = sc.vy, z = sc.vz, p = vs[0], q = vs[1], r = vs[2], c = centerOf(sc, vs);
    var nx = (y[q] - y[p]) * (z[r] - z[p]) - (z[q] - z[p]) * (y[r] - y[p]);
    var ny = (z[q] - z[p]) * (x[r] - x[p]) - (x[q] - x[p]) * (z[r] - z[p]);
    var nz = (x[q] - x[p]) * (y[r] - y[p]) - (y[q] - y[p]) * (x[r] - x[p]);
    if (nx * (axis[0] - c[0]) + ny * (axis[1] - c[1]) + nz * (axis[2] - c[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    var l = Math.hypot(nx, ny, nz) || 1;
    return { v: vs, n: [nx / l, ny / l, nz / l], css: P.hex(col) };
  }
  var SHADE = [[44, 40, 60], [36, 33, 52], [28, 26, 42], [22, 20, 34], [22, 20, 34], [28, 26, 42], [36, 33, 52], [44, 40, 60]], walls = [];
  for (i = 0; i < n - 1; i++) walls.push(wall([fi[i], fi[i + 1], bi[i + 1], bi[i]], SHADE[i]));
  walls.push(wall([fi[n - 1], fi[0], bi[0], bi[n - 1]], [58, 52, 62]));      // 床
  function plane(o, u, w, W, H) {
    return { o: L(sc, f, o[0], o[1], o[2]), u: L(sc, f, u[0], u[1], u[2]), w: L(sc, f, w[0], w[1], w[2]), W: W, H: H };
  }
  var hw = 8.5 * K * .72 + .4, top = y0 + 16.6 * K * .72 + .4;
  var gOut = sc.ground(f.o.x + 12 * f.rx, f.o.z + 12 * f.rz) + .35;
  sc.cave = {
    kv: kv, kb: 5.05, n: [f.rx, 0, f.rz], open: fi, back: bi, walls: walls,
    glow: plane([hw, top, -DEPTH + .2], [-hw, top, -DEPTH + .2], [hw, y0 - .3, -DEPTH + .2], 14, 14),      // 奥の壁
    floor: plane([hw, y0 + .2, -DEPTH], [-hw, y0 + .2, -DEPTH], [hw + 1.6, y0 + .2, 0], 14, 14),           // 床
    spill: plane([10 * K, y0 + .25, .5], [-10 * K, y0 + .25, .5], [10 * K, gOut, 12], 18, 12),              // 入口の外にもれる光
    haze: plane([8.6 * K, y0 + 17 * K, -DEPTH * .45], [-8.6 * K, y0 + 17 * K, -DEPTH * .45], [8.6 * K, y0, -DEPTH * .45], 19, 19),         // 入口いっぱいのもや
    eyes: L(sc, f, 3.4, y0 + .2, -DEPTH * .6),                                                              // 奥の左の暗がりにいる「何か」
    pile: L(sc, f, 5.3 * K, y0 + .1, -2.4 * K)                                                              // かくしてあるパイナップル
  };
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

P.PIER_A = 95; P.GAZEBO_A = 163;
P.HUTS = [58, 76, 114, 132];
P.FIELDS = [[26, 21], [207, 22], [314, 23]];

P.buildProps = function (sc) {
  var R = sc.rand, i, a, d, p;
  P.HUTS.forEach(function (h) { hut(sc, .815, h * DEG); });
  gazebo(sc, .815, P.GAZEBO_A * DEG);
  pier(sc, P.PIER_A * DEG);
  [[1.05, 30, 3.2], [1.1, 39, 2.1], [1.045, 150, 2.8], [1.07, 204, 3.4], [1.11, 213, 2], [1.05, 300, 3], [1.09, 346, 2.4], [1.06, 122, 1.9], [1.08, 262, 2.6]]
    .forEach(function (q) { rock(sc, q[0], q[1] * DEG, q[2]); });

  // 山と草地に花
  for (i = 0; i < 135; i++) {
    a = R() * TAU; d = R() < .62 ? .17 + R() * .4 : .715 + R() * .16;
    if (near(a / DEG, [[P.CAVE_A, 20]]) && d > .28 && d < .62) continue;
    p = sc.pt(d, a);
    sc.disc(p.x, p.y + .9, p.z, .85 + R() * .7, FLOWERS[(R() * FLOWERS.length) | 0], { kb: 2.5 });
  }
  // 山のしげみ
  for (i = 0; i < 46; i++) {
    a = R() * TAU; d = .27 + R() * .28;
    if (near(a / DEG, [[P.CAVE_A, 24]]) && d > .28) continue;
    p = sc.pt(d, a);
    var s = 2.3 + R() * 1.6, kv = sc.vert(p.x, p.y, p.z);
    sc.disc(p.x, p.y + s * .7, p.z, s, [40, 104, 56], { kv: kv, kb: 3 });
    sc.disc(p.x - s * .28, p.y + s * 1.1, p.z, s * .62, [76, 148, 66], { kv: kv, kb: 3.1 });
  }

  var busy = P.HUTS.map(function (h) { return [h, 8]; }).concat([[P.PIER_A, 10], [P.GAZEBO_A, 15]]).concat(P.FIELDS);
  // ヤシの木(浜辺)
  for (i = 0; i < 20; i++) {
    a = i * 18 + (R() - .5) * 9;
    if (near(a, [[P.PIER_A, 9], [P.GAZEBO_A, 13]])) continue;
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
    if (near(a, [[P.CAVE_A, 27]])) continue;
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
  // 洞窟は最後に作る(それまでの木や花の並びを変えないため)
  cave(sc, P.CAVE_A);
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
