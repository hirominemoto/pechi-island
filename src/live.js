// ペチ島 — ブラウザで動かす部分(回転・並べ替え・キャラクターの歩行・時間帯・台風)
(function (G) {
'use strict';
var P = G.Pechi, TAU = P.TAU, DEG = P.DEG, r1 = P.r1, NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, parent) {
  var e = document.createElementNS(NS, tag), k;
  for (k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
function r2(v) { return Math.round(v * 100) / 100; }
function tr(p) { return 'translate(' + p[0] + ' ' + p[1] + ')'; }

P.mount = function (svg, opts) {
  opts = opts || {};
  var sc = new P.Scene(), R = new P.Renderer(sc), items = sc.items, i;
  var reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cam = { az: (opts.az == null ? 20 : opts.az) * DEG, el: 30 * DEG, zoom: 1, cx: null, cy: null, auto: opts.auto !== false && !reduce, speed: .1, follow: null };
  // 時間帯。T はいまの色(切りかえ中は2つの時間帯のあいだ)
  var timeName = P.TIMES[opts.time] ? opts.time : 'day', T = P.TIMES[timeName], fade = null, tall = false;
  sc.retone(T);

  // スクリプトなし用の静止画を片づける
  Array.prototype.slice.call(svg.childNodes).forEach(function (n) { if (n.nodeName !== 'title' && n.nodeName !== 'desc' && n.nodeName !== 'script') svg.removeChild(n); });
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  el('style', {}, svg).textContent = (opts.webfont ? '@import url("https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap");' : '') + P.STYLE;
  var defs = el('defs', {}, svg);
  defs.innerHTML = P.defs(T);
  var sky = el('g', {}, svg);
  sky.innerHTML = P.sky(T, false, Math.sin(cam.el), true);
  var skyL = { sun: sky.querySelector('.pe-sun'), dusk: sky.querySelector('.pe-dusk'), night: sky.querySelector('.pe-night') };
  var skyP = { sun: sky.querySelector('.pe-sunpos'), dusk: sky.querySelector('.pe-duskpos'), venus: sky.querySelector('.pe-venuspos'), shoot: all(sky, '.pe-shootpos') };
  var gSea = el('g', {}, svg);
  var seaWall = el('path', { fill: 'url(#g-wall)' }, gSea);
  var seaTop = el('ellipse', { cx: 0, cy: 0, rx: P.SEA_R, fill: 'url(#g-sea)' }, gSea);
  var sh2 = el('path', { opacity: .45 }, gSea), sh1 = el('path', { opacity: .6 }, gSea);
  var glint = el('path', { 'class': 'glint', fill: 'none', 'stroke-width': .7, 'stroke-linecap': 'round' }, gSea);
  var surf = el('path', { 'class': 'surf', fill: 'none', 'stroke-width': 1, 'stroke-dasharray': '9 7', 'stroke-linecap': 'round' }, gSea);
  var foam = el('path', { fill: 'none', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, gSea);
  var world = el('g', { transform: 'scale(.1)' }, svg);
  var rain = el('g', { 'class': 'rain', display: 'none' }, svg);
  rain.innerHTML = P.rainMarkup();
  var over = el('g', {}, svg);
  var shoreA = sc.shore(1), shoreB = sc.shore(1.05), shoreC = sc.shore(1.14), glints = P.makeGlints();

  var slots = [], used = 0;
  for (i = 0; i < items.length; i++) slots.push(el('path', { 'class': 's' }, world));

  // 面のあいだに差しこむもの(木・看板の文字・洞窟の中・キャラクター・雲)
  var things = [];
  sc.sprites.forEach(function (s) { things.push({ kind: 0, s: s, el: el('use', { href: '#s-' + s.sym }, world), key: 0, rank: 0 }); });
  sc.signs.forEach(function (g) {
    var e = el('g', {}, world); e.innerHTML = P.signMarkup(g.id);
    things.push({ kind: 1, g: g, el: e, key: 0, rank: 0 });
  });
  var caveT = { kind: 4, el: el('g', {}, world), key: 0, rank: 0 };
  caveT.el.innerHTML = P.caveMarkup(sc);
  var cv = { open: all(caveT.el, '.cv-open'), walls: all(caveT.el, '.cv-w'), back: caveT.el.querySelector('.cv-b'), amt: caveT.el.querySelector('.cv-amt'),
    mf: caveT.el.querySelector('.cv-mf'), mh: caveT.el.querySelector('.cv-mh'), mb: caveT.el.querySelector('.cv-mb'), ms: caveT.el.querySelector('.cv-ms'),
    pile: caveT.el.querySelector('.cv-pile'), spill: caveT.el.querySelector('.cv-spill') };
  things.push(caveT);
  var actors = P.CAST.map(function (cst) {
    var e = el('g', { 'class': 'chr' }, world);
    var a = { kind: 2, name: cst.name, el: e, key: 0, rank: 0, off: cst.off * DEG, dur: cst.dur, size: cst.size,
      isBack: false, flip: false, line: 0, bub: null, x: 0, y: 0, limbs: [], bobs: [],
      halo: el('circle', { cx: 0, cy: -11, r: 20, fill: 'url(#g-halo)', opacity: 0 }, e), body: el('g', {}, e) };   // halo: 夜でも見えるように、まわりをほんのり照らす
    el('title', {}, e).textContent = P.NAMES[cst.name];
    e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); say(a); });
    things.push(a);
    return a;
  });
  // 台風モード: ヒロミーヌがうずまきになって島を一周多く走る
  var hiro = actors[0], ty = el('g', { display: 'none' }, hiro.el), storm = null, fn = [], orb = [];
  var mini = { kind: 3, el: el('g', {}, world), key: 0, rank: 0 };
  things.push(mini);
  var clouds = P.CLOUDS.map(function (c) {
    var t = { kind: 3, c: c, el: el('use', { href: '#s-cloud' }, world), key: 0, rank: 0 };
    things.push(t);
    return t;
  });
  // SVG 単体で開いたときは、画面の右下にボタンを出す
  var ui = null;
  if (opts.ui) {
    ui = el('g', {}, svg);
    ui.innerHTML = P.uiMarkup();
    [['.pe-b-time', function () { api.nextTime(); }], ['.pe-b-storm', function () { api.storm(); }]].forEach(function (b) {
      var node = ui.querySelector(b[0]);
      node.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      node.addEventListener('click', b[1]);
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b[1](); } });
    });
  }

  // ---- 時間帯の色を塗る ------------------------------------------------
  // キャラクターを、いまの時間帯の色味で描きなおす
  function dress(a) {
    a.body.innerHTML = P.tint(P.charMarkup(a.name, false), T.chr);
    a.front = a.body.querySelector('.front'); a.back = a.body.querySelector('.back');
    a.limbs = all(a.body, '.lb').map(function (l) { return { el: l, p: l.getAttribute('data-p'), a: +l.getAttribute('data-a') }; });
    a.bobs = all(a.body, '.bob');
    var hide = storm && a === hiro;
    a.front.setAttribute('display', hide || a.isBack ? 'none' : 'inline');
    a.back.setAttribute('display', hide || !a.isBack ? 'none' : 'inline');
    a.halo.setAttribute('opacity', r2(T.lamp * .62));
  }
  function dressAll() {
    actors.forEach(dress);
    ty.innerHTML = P.tint(P.typhoonMarkup(), T.chr);
    fn = all(ty, '.fn'); orb = all(ty, '.orb');
    mini.el.innerHTML = P.tint(P.miniMarkup(), T.chr);
  }
  function paintSky() {       // 太陽・夕日と金星・星空の濃さ。台風のあいだは雲にかくれる
    var k = storm ? .3 : 1, n, v;
    for (n in skyL) {
      v = T[n] * k;
      skyL[n].setAttribute('opacity', r2(v));
      if (v > .004) skyL[n].removeAttribute('display'); else skyL[n].setAttribute('display', 'none');
    }
  }
  function placeSky() {       // 夕日は海のふちに半分しずめる
    var p = P.skyPos(tall, R.se == null ? Math.sin(cam.el) : R.se);
    skyP.sun.setAttribute('transform', tr(p.sun));
    skyP.dusk.setAttribute('transform', tr(p.dusk));
    skyP.venus.setAttribute('transform', tr(p.venus));
  }
  function paintSea() {
    var c = P.seaColors(T);
    sh1.setAttribute('fill', c.sh1); sh2.setAttribute('fill', c.sh2);
    glint.setAttribute('stroke', c.foam); surf.setAttribute('stroke', c.foam); foam.setAttribute('stroke', c.foam);
  }
  function paintSlots() {
    var ord = R.order, k, it, s;
    for (k = 0; k < used; k++) { it = items[ord[k]]; s = slots[k]; if (s._c !== it.css) { s.setAttribute('color', it.css); s._c = it.css; } }
  }
  function paintCave() {
    var a = P.caveAmt(T);
    cv.amt.setAttribute('opacity', a.glow); cv.spill.setAttribute('opacity', a.spill);
  }
  function paintUi() {
    if (ui) P.TIME_ORDER.forEach(function (t) { ui.querySelector('.pe-i-' + t).setAttribute('display', t === timeName ? 'inline' : 'none'); });
  }
  // heavy: 木などの部品とキャラクターも塗りなおす(切りかえ中は数コマに1回)
  function paintTime(heavy) {
    sc.retone(T);
    paintSlots(); paintSea(); paintSky(); paintCave();
    rain.firstChild.setAttribute('opacity', r2(T.veil));
    if (heavy) { defs.innerHTML = P.defs(T); dressAll(); }
  }
  function setTime(name, instant) {
    if (!P.TIMES[name]) return;
    var from = T, changed = name !== timeName;
    timeName = name;
    if (instant || reduce || !changed) { fade = null; T = P.TIMES[name]; paintTime(true); }
    else fade = { from: from, t0: clock, dur: 1.4, n: 0 };
    paintUi();
    if (changed && opts.onTime) opts.onTime(name);
  }

  function fit() {
    var b = svg.getBoundingClientRect(), w = b.width || G.innerWidth || 800, h = b.height || G.innerHeight || 600, wasTall = tall;
    tall = w / h < 1;
    var v = tall ? P.VIEW.tall : P.VIEW.wide, z = cam.zoom, k = cam.cx == null ? 0 : Math.max(0, Math.min(1, (z - 1) / 1.2));
    var cx = v[0] + v[2] / 2 + (cam.cx - v[0] - v[2] / 2) * k, cy = v[1] + v[3] / 2 + (cam.cy - v[1] - v[3] / 2) * k, vw = v[2] / z, vh = v[3] / z;
    svg.setAttribute('viewBox', [cx - vw / 2, cy - vh / 2, vw, vh].map(r1).join(' '));
    if (tall !== wasTall) placeSky();
    if (ui) {
      var px = Math.min(w / vw, h / vh);       // 1単位が何ピクセルか
      ui.setAttribute('transform', 'translate(' + r1(cx + (w / 2 - 38) / px) + ' ' + r1(cy + (h / 2 - 38) / px) + ') scale(' + (1 / px).toFixed(4) + ')');
    }
  }

  // カメラが動いたとき: 全部の面を投影しなおして、奥から順に並べる
  var lastSe = null;
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
    if (R.se !== lastSe) { lastSe = R.se; placeSky(); }
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
    // 洞窟の中: 入口の形で切り抜いて、見える壁だけ描く
    var st = P.caveState(R, sc, T);
    caveT.key = R.sd[sc.cave.kv] + sc.cave.kb;
    if (!st.show) caveT.el.setAttribute('display', 'none');
    else {
      caveT.el.removeAttribute('display');
      cv.open[0].setAttribute('d', st.open); cv.open[1].setAttribute('d', st.open); cv.back.setAttribute('d', st.back);
      for (k = 0; k < cv.walls.length; k++) cv.walls[k].setAttribute('d', st.walls[k]);
      cv.mf.setAttribute('transform', st.mFloor); cv.mh.setAttribute('transform', st.mHaze); cv.mb.setAttribute('transform', st.mBack); cv.ms.setAttribute('transform', st.mSpill);
      cv.pile.setAttribute('transform', st.pile);
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
  function stormEnd() {
    storm = null;
    ty.setAttribute('display', 'none'); rain.setAttribute('display', 'none');
    hiro.front.setAttribute('display', hiro.isBack ? 'none' : 'inline'); hiro.back.setAttribute('display', hiro.isBack ? 'inline' : 'none');
    paintSky();
    if (opts.onStorm) opts.onStorm(false);
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
    if (!(ms >= 0)) return;
    var now = ms / 1000, dt = Math.max(0, Math.min(.05, last ? now - last : 0));
    last = now; clock += dt; walk += dt;
    if (fade) {                 // 時間帯をなめらかに切りかえる
      var fu = (clock - fade.t0) / fade.dur;
      if (fu >= 1) { T = P.TIMES[timeName]; fade = null; paintTime(true); }
      else { T = P.blend(fade.from, P.TIMES[timeName], fu * fu * (3 - 2 * fu)); paintTime(fade.n++ % 4 === 0); }
    }
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
    if (clock > nextTalk) { if (!storm) say(actors[talker++ % actors.length]); nextTalk = clock + 3.8 + Math.random() * 2.4; }
  }
  function loop(ms) { tick(ms); G.requestAnimationFrame(loop); }

  // 流れ星は、流れるたびに場所を変える
  sky.addEventListener('animationiteration', function (e) {
    var t = e.target;
    if (!t.getAttribute || !/shoot/.test(t.getAttribute('class') || '')) return;
    t.parentNode.setAttribute('transform', tall ? tr([r1(-90 + Math.random() * 200), r1(-240 + Math.random() * 130)]) : tr([r1(-40 + Math.random() * 210), r1(-113 + Math.random() * 26)]));
  });

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
    time: function () { return timeName; },
    setTime: setTime,
    nextTime: function () { setTime(P.TIME_ORDER[(P.TIME_ORDER.indexOf(timeName) + 1) % P.TIME_ORDER.length]); },
    storm: function () {
      if (storm) return;
      storm = { t0: clock, dur: 9, step: 0 };
      hiro.front.setAttribute('display', 'none'); hiro.back.setAttribute('display', 'none');
      ty.setAttribute('display', 'inline'); rain.setAttribute('display', 'inline');
      paintSky();
      say(hiro, 'たいふうモード〜！');
      if (opts.onStorm) opts.onStorm(true);
    },
    tick: tick
  };
  dressAll(); paintSea(); paintSky(); paintCave(); paintUi();
  rain.firstChild.setAttribute('opacity', r2(T.veil));
  fit(); placeSky();
  tick(0);
  G.requestAnimationFrame(loop);
  return api;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
