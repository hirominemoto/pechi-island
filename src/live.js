// ペチ島 — ブラウザで動かす部分(回転・並べ替え・キャラクターの歩行)
(function (G) {
'use strict';
var P = G.Pechi, TAU = P.TAU, DEG = P.DEG, r1 = P.r1, NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, parent) {
  var e = document.createElementNS(NS, tag), k;
  for (k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

P.mount = function (svg, opts) {
  opts = opts || {};
  var sc = new P.Scene(), R = new P.Renderer(sc), items = sc.items, i;
  var reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cam = { az: (opts.az == null ? 20 : opts.az) * DEG, el: 30 * DEG, zoom: 1, cx: null, cy: null, auto: opts.auto !== false && !reduce, speed: .1, follow: null };

  // スクリプトなし用の静止画を片づける
  Array.prototype.slice.call(svg.childNodes).forEach(function (n) { if (n.nodeName !== 'title' && n.nodeName !== 'desc' && n.nodeName !== 'script') svg.removeChild(n); });
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  el('style', {}, svg).textContent = (opts.webfont ? '@import url("https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap");' : '') + P.STYLE;
  el('defs', {}, svg).innerHTML = P.defs();
  el('g', {}, svg).innerHTML = P.sky();
  var gSea = el('g', {}, svg);
  var seaWall = el('path', { fill: 'url(#g-wall)' }, gSea);
  var seaTop = el('ellipse', { cx: 0, cy: 0, rx: P.SEA_R, fill: 'url(#g-sea)' }, gSea);
  var sh2 = el('path', { fill: '#8fe6ea', opacity: .45 }, gSea), sh1 = el('path', { fill: '#b9f4f2', opacity: .6 }, gSea);
  var glint = el('path', { 'class': 'glint', fill: 'none', stroke: '#eafcff', 'stroke-width': .7, 'stroke-linecap': 'round' }, gSea);
  var surf = el('path', { 'class': 'surf', fill: 'none', stroke: '#fff', 'stroke-width': 1, 'stroke-dasharray': '9 7', 'stroke-linecap': 'round' }, gSea);
  var foam = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, gSea);
  var world = el('g', { transform: 'scale(.1)' }, svg), over = el('g', {}, svg);
  var shoreA = sc.shore(1), shoreB = sc.shore(1.05), shoreC = sc.shore(1.14), glints = P.makeGlints();

  var slots = [], used = 0;
  for (i = 0; i < items.length; i++) slots.push(el('path', { 'class': 's' }, world));

  // 面のあいだに差しこむもの(木・看板の文字・キャラクター・雲)
  var things = [];
  sc.sprites.forEach(function (s) { things.push({ kind: 0, s: s, el: el('use', { href: '#s-' + s.sym }, world), key: 0, rank: 0 }); });
  sc.signs.forEach(function (g) {
    var e = el('g', {}, world); e.innerHTML = P.signMarkup(g.id);
    things.push({ kind: 1, g: g, el: e, key: 0, rank: 0 });
  });
  var actors = P.CAST.map(function (cst) {
    var name = cst.name;
    var e = el('g', { 'class': 'chr' }, world);
    e.innerHTML = P.charMarkup(name, false);
    var a = { kind: 2, name: name, el: e, key: 0, rank: 0, off: cst.off * DEG, dur: cst.dur, size: cst.size,
      front: e.querySelector('.front'), back: e.querySelector('.back'), isBack: false, flip: false, line: 0, bub: null, x: 0, y: 0,
      limbs: Array.prototype.map.call(e.querySelectorAll('.lb'), function (l) { return { el: l, p: l.getAttribute('data-p'), a: +l.getAttribute('data-a') }; }),
      bobs: Array.prototype.slice.call(e.querySelectorAll('.bob')) };
    el('title', {}, e).textContent = P.NAMES[name];
    e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); say(a); });
    things.push(a);
    return a;
  });
  // 台風モード: ヒロミーヌがうずまきになって島を一周多く走る
  var hiro = actors[0], ty = el('g', { display: 'none' }, hiro.el), storm = null;
  ty.innerHTML = P.typhoonMarkup();
  var fn = Array.prototype.slice.call(ty.querySelectorAll('.fn')), orb = Array.prototype.slice.call(ty.querySelectorAll('.orb'));
  var rain = el('g', { 'class': 'rain', display: 'none' }, null);
  svg.insertBefore(rain, over);
  rain.innerHTML = P.rainMarkup();
  function stormEnd() {
    storm = null;
    ty.setAttribute('display', 'none'); rain.setAttribute('display', 'none');
    hiro.front.setAttribute('display', hiro.isBack ? 'none' : 'inline'); hiro.back.setAttribute('display', hiro.isBack ? 'inline' : 'none');
    if (opts.onStorm) opts.onStorm(false);
  }
  var mini = { kind: 3, el: el('g', {}, world), key: 0, rank: 0 };
  mini.el.innerHTML = P.miniMarkup();
  things.push(mini);
  var clouds = P.CLOUDS.map(function (c) {
    var t = { kind: 3, c: c, el: el('use', { href: '#s-cloud' }, world), key: 0, rank: 0 };
    things.push(t);
    return t;
  });

  function fit() {
    var b = svg.getBoundingClientRect(), w = b.width || G.innerWidth || 800, h = b.height || G.innerHeight || 600;
    var v = w / h < 1 ? P.VIEW.tall : P.VIEW.wide, z = cam.zoom, k = cam.cx == null ? 0 : Math.max(0, Math.min(1, (z - 1) / 1.2));
    var cx = v[0] + v[2] / 2 + (cam.cx - v[0] - v[2] / 2) * k, cy = v[1] + v[3] / 2 + (cam.cy - v[1] - v[3] / 2) * k;
    svg.setAttribute('viewBox', [cx - v[2] / 2 / z, cy - v[3] / 2 / z, v[2] / z, v[3] / z].map(r1).join(' '));
  }

  // カメラが動いたとき: 全部の面を投影しなおして、奥から順に並べる
  function camUpdate() {
    R.project(lastAz, lastEl); R.sort();
    var ord = R.order, n = R.count, it, s, d, th, k;
    for (k = 0; k < n; k++) {
      it = items[ord[k]]; s = slots[k]; d = R.d(it);
      if (s._d !== d) { s.setAttribute('d', d); s._d = d; }
      if (s._c !== it.css) { s.setAttribute('color', it.css); s._c = it.css; }
    }
    for (k = n; k < used; k++) { slots[k].setAttribute('d', ''); slots[k]._d = ''; }
    used = n;
    seaTop.setAttribute('ry', r1(P.SEA_R * R.se));
    seaWall.setAttribute('d', P.seaWallD(R));
    sh2.setAttribute('d', P.loopD(R, shoreC)); sh1.setAttribute('d', P.loopD(R, shoreB));
    foam.setAttribute('d', P.loopD(R, shoreA)); surf.setAttribute('d', P.loopD(R, shoreB));
    glint.setAttribute('d', P.glintD(R, glints));
    for (k = 0; k < things.length; k++) {
      th = things[k];
      if (th.kind === 0) {
        s = th.s;
        th.el.setAttribute('transform', P.at(R.sx[s.v], R.sy[s.v], s.flip ? -s.s : s.s, s.s));
        th.key = R.sd[s.v] + s.kb;
      } else if (th.kind === 1) {
        d = P.signMatrix(R, th.g);
        if (d) { th.el.setAttribute('transform', d); th.el.removeAttribute('display'); } else th.el.setAttribute('display', 'none');
        th.key = R.sd[th.g.kv] + th.g.kb;
      }
    }
  }

  // DOM の順番 = 描く順番。スロットは固定で、スプライトだけを正しい位置へ動かす
  function place() {
    var k, th, nx;
    for (k = 0; k < things.length; k++) things[k].rank = R.rank(things[k].key);
    things.sort(function (a, b) { return a.key - b.key; });
    for (k = things.length - 1; k >= 0; k--) {
      th = things[k];
      nx = (k + 1 < things.length && things[k + 1].rank === th.rank) ? things[k + 1].el : (slots[th.rank] || null);
      if (th.el.nextSibling !== nx) world.insertBefore(th.el, nx);
    }
  }

  // ふきだし
  function say(a, text) {
    if (a.bub) { over.removeChild(a.bub.el); a.bub = null; }
    var lines = P.LINES[a.name];
    text = text || lines[a.line++ % lines.length];
    var g = el('g', { 'class': 'bub', opacity: 0 }, over);
    g.innerHTML = P.bubble(text);
    a.bub = { el: g, until: clock + 3.4 };
    G.requestAnimationFrame(function () { g.setAttribute('opacity', 1); });
  }

  var odd = false, clock = 0, walk = 0, last = 0, nextTalk = 2.5, talker = 0, lastAz = null, lastEl = null, holdUntil = 0;
  var LOOP = P.LOOP;

  function actorUpdate() {
    var k, a, th;
    for (k = 0; k < actors.length; k++) {
      a = actors[k];
      var ang = walk / LOOP * TAU + a.off + (k === 0 ? .05 * Math.sin(clock * .9) : k === 1 ? .035 * Math.sin(clock * .6 + 1) : 0);
      if (k === 0 && storm) {
        var u = (clock - storm.t0) / storm.dur;
        if (u >= 1) stormEnd();
        else {
          ang += TAU * (.5 - .5 * Math.cos(Math.PI * u));
          for (var w = 0; w < fn.length; w++) fn[w].setAttribute('cx', r1(1.3 * Math.sin(clock * 11 + w * .9)));
          for (w = 0; w < orb.length; w++) orb[w].setAttribute('transform', 'translate(' + r1(10.5 * Math.cos(clock * 7 + w * Math.PI)) + ' ' + r1(-9 + 3 * Math.sin(clock * 7 + w * Math.PI)) + ') scale(.8)');
          if (storm.step === 0 && u > .14) { storm.step = 1; say(actors[1], 'こらー！ とまりなさい！'); }
          if (storm.step === 1 && u > .42) { storm.step = 2; say(actors[2], 'ヒナン シマス…'); }
        }
      }
      var p = sc.walk(ang), q = sc.walk(ang + .03), s = R.xy(p.x, p.y, p.z);
      var dx = (q.x - p.x) * R.ca - (q.z - p.z) * R.sa, dz = (q.x - p.x) * R.sa + (q.z - p.z) * R.ca, len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      if (a.isBack ? dz > -.2 : dz < -.38) {
        a.isBack = !a.isBack;
        if (!(k === 0 && storm)) { a.front.setAttribute('display', a.isBack ? 'none' : 'inline'); a.back.setAttribute('display', a.isBack ? 'inline' : 'none'); }
      }
      if (a.flip ? dx > .12 : dx < -.12) a.flip = !a.flip;
      var sw = Math.sin(clock * TAU / a.dur);
      a.x = s[0]; a.y = s[1];
      a.el.setAttribute('transform', P.at(s[0], s[1], a.flip ? -a.size : a.size, a.size));
      a.key = s[2] + 5;
      for (var j = 0; j < a.limbs.length; j++) a.limbs[j].el.setAttribute('transform', 'rotate(' + r1(a.limbs[j].a * sw) + ' ' + a.limbs[j].p + ')');
      for (j = 0; j < a.bobs.length; j++) a.bobs[j].setAttribute('transform', 'translate(0 ' + r1(-Math.abs(sw) * 1.1) + ')');
      if (a.bub) {
        if (clock > a.bub.until + .4) { over.removeChild(a.bub.el); a.bub = null; }
        else {
          if (clock > a.bub.until) a.bub.el.setAttribute('opacity', 0);
          a.bub.el.setAttribute('transform', 'translate(' + r1(s[0]) + ' ' + r1(s[1] - 25 * a.size) + ')');
        }
      }
    }
    // ミラmini は山のまわりを飛ぶ
    var th0 = clock * P.MINI.w, m = R.xy(-7 + P.MINI.r * Math.cos(th0), P.MINI.y + 5 * Math.sin(3 * th0), -9 + P.MINI.r * Math.sin(th0));
    mini.el.setAttribute('transform', P.at(m[0], m[1], 1.5, 1.5, r1(7 * Math.sin(clock * 2.1))));
    mini.key = m[2];
    for (k = 0; k < clouds.length; k++) {
      th = clouds[k];
      var ca = th.c[3] + clock * th.c[2], c = R.xy(-7 + th.c[0] * Math.cos(ca), th.c[1], -9 + th.c[0] * Math.sin(ca));
      th.el.setAttribute('transform', P.at(c[0], c[1], th.c[4], th.c[4]));
      th.key = c[2];
    }
  }

  function tick(ms) {
    var now = ms / 1000, dt = Math.max(0, Math.min(.05, last ? now - last : 0));
    last = now; clock += dt; walk += dt;
    var drag = now <= holdUntil;
    if (cam.auto && !drag) cam.az += cam.speed * dt;
    odd = !odd;
    if ((cam.az !== lastAz || cam.el !== lastEl) && (drag || odd || !cam.auto)) { lastAz = cam.az; lastEl = cam.el; camUpdate(); }
    actorUpdate();
    place();
    if (cam.follow) {            // 名札を押したキャラクターを追いかける
      var f = cam.follow, e = Math.min(1, dt * 3.2);
      cam.cx += (f.x - cam.cx) * e; cam.cy += (f.y - 9 - cam.cy) * e; cam.zoom += (2.7 - cam.zoom) * e;
      fit();
    }
    if (clock > nextTalk) { say(actors[talker++ % actors.length]); nextTalk = clock + 3.8 + Math.random() * 2.4; }
  }
  function loop(ms) { tick(ms); G.requestAnimationFrame(loop); }

  // ドラッグで回す・ホイールやピンチで拡大
  var ptr = {}, pinch = 0;
  svg.style.touchAction = 'none';
  svg.style.cursor = 'grab';
  svg.addEventListener('pointerdown', function (e) {
    ptr[e.pointerId] = [e.clientX, e.clientY];
    if (svg.setPointerCapture) try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    svg.style.cursor = 'grabbing';
  });
  svg.addEventListener('pointermove', function (e) {
    var p = ptr[e.pointerId], ids = Object.keys(ptr);
    if (!p) return;
    if (ids.length === 2) {
      var o = ptr[ids[0] == e.pointerId ? ids[1] : ids[0]], dist = Math.hypot(e.clientX - o[0], e.clientY - o[1]);
      if (pinch) api.zoomBy(dist / pinch);
      pinch = dist;
    } else {
      cam.az -= (e.clientX - p[0]) * .007;
      cam.el = Math.max(13 * DEG, Math.min(64 * DEG, cam.el + (e.clientY - p[1]) * .004));
      holdUntil = last + 2.2;
    }
    ptr[e.pointerId] = [e.clientX, e.clientY];
  });
  function up(e) { delete ptr[e.pointerId]; pinch = 0; svg.style.cursor = 'grab'; }
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', function (e) { e.preventDefault(); api.zoomBy(Math.exp(-e.deltaY * .0012)); }, { passive: false });
  G.addEventListener('resize', fit);

  var api = {
    cam: cam, scene: sc, renderer: R,
    setAuto: function (on) { cam.auto = !!on; holdUntil = 0; },
    zoomBy: function (f) { cam.follow = null; cam.cx = cam.cy = null; cam.zoom = Math.max(.6, Math.min(3.6, cam.zoom * f)); fit(); if (opts.onFollow) opts.onFollow(null); },
    follow: function (name) {
      cam.follow = null;
      actors.forEach(function (a) { if (a.name === name) cam.follow = a; });
      if (cam.follow) { if (cam.cx == null) { cam.cx = 0; cam.cy = 0; } say(cam.follow); } else { cam.cx = cam.cy = null; cam.zoom = 1; fit(); }
      if (opts.onFollow) opts.onFollow(cam.follow ? name : null);
    },
    say: function (name) { actors.forEach(function (a) { if (a.name === name) say(a); }); },
    turn: function (rad) { cam.az += rad; },
    storm: function () {
      if (storm) return;
      storm = { t0: clock, dur: 9, step: 0 };
      hiro.front.setAttribute('display', 'none'); hiro.back.setAttribute('display', 'none');
      ty.setAttribute('display', 'inline'); rain.setAttribute('display', 'inline');
      say(hiro, 'たいふうモード〜！');
      if (opts.onStorm) opts.onStorm(true);
    },
    tick: tick
  };
  fit();
  tick(0);
  G.requestAnimationFrame(loop);
  return api;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
