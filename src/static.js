// ペチ島 — スクリプトなしでも動く SVG を書き出す(<img> で貼ったときなど)。
// 島は1コマ分を描いておき、キャラクターは SVG アニメ(SMIL)で歩かせる。
(function (G) {
'use strict';
var P = G.Pechi, TAU = P.TAU, DEG = P.DEG;

P.LOOP = 46;        // 島を一周する秒数
P.CAST = [{ name: 'hiro', off: 0, dur: .4, size: 1 }, { name: 'pechi', off: -13, dur: .62, size: 1 }, { name: 'mira', off: -25, dur: .74, size: .92 }];
P.CLOUDS = [[52, 80, .06, 0, 1.7], [44, 62, -.045, 2.1, 1.3], [60, 90, .05, 4.2, 2]];
P.MINI = { r: 31, y: 64, w: -.42 };

var BB = { palm: [-17, -42, 17, 3], tree: [-9, -16, 9, 2], tree2: [-7.5, -21, 7.5, 2], pine: [-4.5, -9.5, 4.5, 1.5], pile: [-14, -22, 14, 5] };
var NONE = [1e9, 1e9, -1e9, -1e9];

function f4(v) { return Math.round(v * 1e4) / 1e4; }
// true/false の列を「切りかわる時刻」と値のリストにする
function runs(arr, on, off) {
  var kt = ['0'], vals = [arr[0] ? on : off], i;
  for (i = 1; i < arr.length; i++) if (!!arr[i] !== !!arr[i - 1]) { kt.push(f4(i / arr.length)); vals.push(arr[i] ? on : off); }
  return { kt: kt.join(';'), vals: vals.join(';'), any: arr.some(Boolean), n: vals.length };
}
function timing(dur, begin) { return 'dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite"'; }
function show(r, dur, begin) {
  return r.n > 1 ? '<animate attributeName="display" calcMode="discrete" ' + timing(dur, begin) + ' keyTimes="' + r.kt + '" values="' + r.vals + '"/>' : '';
}

function itemBB(R, it) {
  var v = it.v, sx = R.sx, sy = R.sy, i, b;
  if (it.t !== 0) return [sx[v[0]] - it.r, sy[v[0]] - it.r, sx[v[0]] + it.r, sy[v[0]] + it.r];
  b = [1e9, 1e9, -1e9, -1e9];
  for (i = 0; i < v.length; i++) {
    b[0] = Math.min(b[0], sx[v[i]]); b[1] = Math.min(b[1], sy[v[i]]); b[2] = Math.max(b[2], sx[v[i]]); b[3] = Math.max(b[3], sy[v[i]]);
  }
  return b;
}

// 動くものを、並べた面のどこに差しこめば前後関係が合うか。
// 画面上で重なる面だけを見て、できるだけ少ない「差しこみ位置」にまとめる。
function layers(list, pts, bb) {
  var M = list.length;
  var iv = pts.map(function (p) {
    var lo = 0, hi = M, x0 = p.x + bb[0], y0 = p.y + bb[1], x1 = p.x + bb[2], y1 = p.y + bb[3], j, b;
    for (j = 0; j < M; j++) {
      b = list[j].bb;
      if (b[0] > x1 || b[2] < x0 || b[1] > y1 || b[3] < y0) continue;
      if (list[j].key <= p.key) lo = j + 1; else { hi = j; break; }
    }
    return { lo: lo, hi: hi };
  });
  var pos = [], last = -1;
  iv.slice().sort(function (a, b) { return a.hi - b.hi; }).forEach(function (v) { if (last < v.lo) { last = v.hi; pos.push(last); } });
  var of = iv.map(function (v) {
    for (var k = 0; k < pos.length; k++) if (pos[k] >= v.lo && pos[k] <= v.hi) return pos[k];
    return v.hi;
  });
  return { pos: pos, of: of };
}

function walkerSamples(sc, R, N) {
  var S = { pts: [], back: [], flip: [], toward: [] }, isBack = false, isFlip = false, pass, i;
  for (pass = 0; pass < 2; pass++) {
    for (i = 0; i < N; i++) {
      var ang = i / N * TAU, p = sc.walk(ang), q = sc.walk(ang + .03), s = R.xy(p.x, p.y, p.z);
      var dx = (q.x - p.x) * R.ca - (q.z - p.z) * R.sa, dz = (q.x - p.x) * R.sa + (q.z - p.z) * R.ca, len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      if (isBack ? dz > -.2 : dz < -.38) isBack = !isBack;
      if (isFlip ? dx > .12 : dx < -.12) isFlip = !isFlip;
      if (pass) { S.pts.push({ x: s[0], y: s[1], key: s[2] + 5 }); S.back.push(isBack); S.flip.push(isFlip); S.toward.push(dz >= 0); }
    }
  }
  return S;
}
function xy10(p) { return Math.round(p.x * 10) + ' ' + Math.round(p.y * 10); }
function valuesOf(pts) { return pts.concat([pts[0]]).map(xy10).join(';'); }

P.renderStatic = function (azDeg, elDeg, time) {
  var sc = new P.Scene(), R = new P.Renderer(sc), items = sc.items, list = [], defs = '', ins = {}, k;
  var T = P.TIMES[time] || P.TIMES.day, sea = P.seaColors(T);
  sc.retone(T);
  R.project(azDeg * DEG, elDeg * DEG); R.sort();
  for (k = 0; k < R.count; k++) {
    var it = items[R.order[k]];
    list.push({ key: R.key[R.order[k]], bb: itemBB(R, it), html: '<path class="s" color="' + it.css + '" d="' + R.d(it) + '"/>' });
  }
  sc.sprites.forEach(function (s) {
    var x = R.sx[s.v], y = R.sy[s.v], b = BB[s.sym];
    list.push({ key: R.sd[s.v] + s.kb, bb: [x + b[0] * s.s, y + b[1] * s.s, x + b[2] * s.s, y + b[3] * s.s],
      html: '<use href="#s-' + s.sym + '" transform="' + P.at(x, y, s.flip ? -s.s : s.s, s.s) + '"/>' });
  });
  sc.signs.forEach(function (g) {
    var m = P.signMatrix(R, g);
    if (m) list.push({ key: R.sd[g.kv] + g.kb, bb: NONE, html: '<g transform="' + m + '">' + P.signMarkup(g.id) + '</g>' });
  });
  var cst = P.caveState(R, sc, T);
  cst.auto = true;
  if (cst.show) list.push({ key: R.sd[sc.cave.kv] + sc.cave.kb, bb: NONE, html: '<g>' + P.caveMarkup(sc, cst) + '</g>' });
  list.forEach(function (e, n) { e.n = n; });
  list.sort(function (a, b) { return a.key - b.key || a.n - b.n; });
  function add(p, html) { ins[p] = (ins[p] || '') + html; }

  // 歩く3人。道は同じなので、出発時刻だけをずらす
  var N = 184, S = walkerSamples(sc, R, N), lay = layers(list, S.pts, [-8, -25, 8, 2]), values = valuesOf(S.pts);
  var flipRuns = runs(S.flip, '-1 1', '1 1'), frontRuns = runs(S.back, 'none', 'inline'), backRuns = runs(S.back, 'inline', 'none');
  var cast = P.CAST.map(function (c, n) {
    var begin = f4(-c.off / 360 * P.LOOP - P.LOOP), i0 = Math.floor((((-begin / P.LOOP) % 1) + 1) % 1 * N), TG = timing(P.LOOP, begin);
    var parts = P.figSprites(c.name, R, c.dur, T.chr), line = P.LINES[c.name], t0 = .06 + n * .16;
    function bub(text, a) {
      return '<g display="none"><animate attributeName="display" calcMode="discrete" ' + TG + ' keyTimes="0;' + f4(a) + ';' + f4(a + .075) + '" values="none;inline;none"/>' +
        '<g transform="translate(0 -25)">' + P.bubble(text) + '</g></g>';
    }
    defs += '<g id="pe-c-' + c.name + '" transform="translate(' + xy10(S.pts[i0]) + ')">' +
      '<animateTransform attributeName="transform" type="translate" ' + TG + ' values="' + values + '"/>' +
      '<g transform="scale(' + c.size * 10 + ')">' +
        (T.lamp > 0 ? '<circle cx="0" cy="-11" r="20" fill="url(#g-halo)" opacity="' + Math.round(T.lamp * 62) / 100 + '"/>' : '') +
        '<g' + (S.flip[i0] ? ' transform="scale(-1 1)"' : '') + '>' +
          (flipRuns.n > 1 ? '<animateTransform attributeName="transform" type="scale" calcMode="discrete" ' + TG + ' keyTimes="' + flipRuns.kt + '" values="' + flipRuns.vals + '"/>' : '') +
          '<g display="' + (S.back[i0] ? 'none' : 'inline') + '">' + show(frontRuns, P.LOOP, begin) + parts.f + '</g>' +
          '<g display="' + (S.back[i0] ? 'inline' : 'none') + '">' + show(backRuns, P.LOOP, begin) + parts.b + '</g>' +
        '</g>' + bub(line[0], t0) + bub(line[1], t0 + .5) +
      '</g></g>';
    return { c: c, begin: begin, i0: i0 };
  });
  // 同じ位置に入るときの順番: 奥へ歩く間は先頭(ヒロミーヌ)が奥、手前へ歩く間は先頭が手前
  lay.pos.forEach(function (p) {
    [[0, false], [1, false], [2, false], [2, true], [1, true], [0, true]].forEach(function (o) {
      var w = cast[o[0]], arr = lay.of.map(function (pp, i) { return pp === p && S.toward[i] === o[1]; }), r = runs(arr, 'inline', 'none');
      if (r.any) add(p, '<use href="#pe-c-' + w.c.name + '" display="' + (arr[w.i0] ? 'inline' : 'none') + '">' + show(r, P.LOOP, w.begin) + '</use>');
    });
  });

  // ドローンと雲
  function mover(id, pts, bb, dur, inner) {
    var ly = layers(list, pts, bb);
    defs += '<g id="' + id + '" transform="translate(' + xy10(pts[0]) + ')"><animateTransform attributeName="transform" type="translate" ' + timing(f4(dur), 0) +
      ' values="' + valuesOf(pts) + '"/>' + inner + '</g>';
    ly.pos.forEach(function (p) {
      var arr = ly.of.map(function (pp) { return pp === p; });
      add(p, '<use href="#' + id + '" display="' + (arr[0] ? 'inline' : 'none') + '">' + show(runs(arr, 'inline', 'none'), f4(dur), 0) + '</use>');
    });
  }
  function orbit(n, fn) {
    var pts = [], i, s;
    for (i = 0; i < n; i++) { s = fn(i / n * TAU); s = R.xy(s[0], s[1], s[2]); pts.push({ x: s[0], y: s[1], key: s[2] }); }
    return pts;
  }
  var mi = P.MINI, sg = mi.w < 0 ? -1 : 1;
  mover('pe-c-mini', orbit(96, function (a) { a *= sg; return [-7 + mi.r * Math.cos(a), mi.y + 5 * Math.sin(3 * a), -9 + mi.r * Math.sin(a)]; }),
    [-6, -9, 6, 5], TAU / Math.abs(mi.w), '<g transform="scale(15)">' + P.figMarkup('mini', R, azDeg * DEG + .5, true, 1, T.chr) + '</g>');
  P.CLOUDS.forEach(function (c, n) {
    var dir = c[2] < 0 ? -1 : 1;
    mover('pe-c-cloud' + n, orbit(72, function (a) { a = c[3] + dir * a; return [-7 + c[0] * Math.cos(a), c[1], -9 + c[0] * Math.sin(a)]; }),
      [-10 * c[4], -10 * c[4], 10 * c[4], 0], TAU / Math.abs(c[2]), '<use href="#s-cloud" transform="scale(' + c[4] * 10 + ')"/>');
  });

  var world = '';
  for (k = 0; k <= list.length; k++) { if (ins[k]) world += ins[k]; if (k < list.length) world += list[k].html; }
  P.staticInfo = { faces: R.count, sprites: sc.sprites.length, walkerLayers: lay.pos.length };

  var loop = function (pts) { return P.loopD(R, pts); };
  return '<g id="pe-static"><style>' + P.STYLE + '</style><defs>' + P.defs(T) + defs + '</defs>' + P.sky(T, false, R.se, false) + '<g>' +
    '<path fill="url(#g-wall)" d="' + P.seaWallD(R) + '"/><ellipse cx="0" cy="0" rx="' + P.SEA_R + '" ry="' + P.r1(P.SEA_R * R.se) + '" fill="url(#g-sea)"/>' +
    '<path fill="' + sea.sh2 + '" opacity=".45" d="' + loop(sc.shore(1.14)) + '"/><path fill="' + sea.sh1 + '" opacity=".6" d="' + loop(sc.shore(1.05)) + '"/>' +
    '<path class="glint" fill="none" stroke="' + sea.foam + '" stroke-width=".7" stroke-linecap="round" d="' + P.glintD(R, P.makeGlints()) + '"/>' +
    '<path class="surf" fill="none" stroke="' + sea.foam + '" stroke-width="1" stroke-dasharray="9 7" stroke-linecap="round" d="' + loop(sc.shore(1.05)) + '"/>' +
    '<path fill="none" stroke="' + sea.foam + '" stroke-width="2.4" stroke-linejoin="round" d="' + loop(sc.shore(1)) + '"/></g>' +
    '<g transform="scale(.1)">' + world + '</g></g>';
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
