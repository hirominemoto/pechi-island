// ペチ島 — 登場人物と木などの絵(すべて SVG のコードで描く)
(function (G) {
'use strict';
var P = G.Pechi;

var FROND = 'M0 0C4-7 12-7 16 1 11-2.5 5-2 0 0Z';
function frond(tf, fill) { return '<path d="' + FROND + '" fill="' + fill + '"' + (tf ? ' transform="' + tf + '"' : '') + '/>'; }

// 木・パイナップル・雲など、<use> で何度も置く部品
P.symbols = function () {
  return '' +
  '<g id="s-palm"><ellipse cx="1" cy="0" rx="6" ry="2.1" fill="#16301c" opacity=".22"/>' +
    '<path d="M0 0Q3.2-12 1.2-25" fill="none" stroke="#7a4f2c" stroke-width="2.6" stroke-linecap="round"/>' +
    '<path d="M0 0Q3.2-12 1.2-25" fill="none" stroke="#a9753f" stroke-width="1" stroke-dasharray="1.6 1.6" stroke-linecap="round"/>' +
    '<g transform="translate(1.2 -25)">' +
      frond('rotate(26)', '#27803a') + frond('scale(-1 1) rotate(26)', '#27803a') +
      frond('', '#2f8f3f') + frond('scale(-1 1)', '#3aa349') +
      frond('rotate(-38)', '#3aa349') + frond('scale(-1 1) rotate(-38)', '#2f8f3f') +
      frond('rotate(-78)', '#44ad52') + frond('scale(-1 1) rotate(-74)', '#3aa349') +
      '<circle cx="-1" cy="1.2" r="1.3" fill="#6b4226"/><circle cx="1.5" cy="1.7" r="1.2" fill="#7a4d2b"/>' +
    '</g></g>' +
  '<g id="s-tree"><ellipse cx=".5" cy="0" rx="5.2" ry="1.8" fill="#16301c" opacity=".22"/>' +
    '<path d="M-.9 0L-.6-6H.8L1 0Z" fill="#7a4f2c"/>' +
    '<circle cx="0" cy="-9.6" r="5.2" fill="#2f7d3c"/><circle cx="-3.4" cy="-7.2" r="3.4" fill="#2f7d3c"/>' +
    '<circle cx="3.5" cy="-7.4" r="3.3" fill="#2a7237"/><circle cx="-1.4" cy="-11" r="3.3" fill="#4a9e4a"/>' +
    '<circle cx="1.9" cy="-9.4" r="1.9" fill="#5fb356"/></g>' +
  '<g id="s-tree2"><ellipse cx=".4" cy="0" rx="4.6" ry="1.6" fill="#16301c" opacity=".22"/>' +
    '<path d="M-.8 0L-.5-9H.7L.9 0Z" fill="#6e4628"/>' +
    '<path d="M0-20C5-16 7-11.5 6-7H-6C-7-11.5-5-16 0-20Z" fill="#256b38"/>' +
    '<path d="M-.4-19C2.6-15.6 3.6-12.4 3-9.6H-4.2C-5-12.6-3.2-16.4-.4-19Z" fill="#3c8f46"/>' +
    '<circle cx="-2.2" cy="-9.4" r="1" fill="#ff8fb3"/><circle cx="3.2" cy="-11.6" r=".9" fill="#ffd34d"/>' +
    '<circle cx=".4" cy="-14.4" r=".8" fill="#fff6e8"/></g>' +
  '<g id="s-pine"><ellipse cx="0" cy="0" rx="3.4" ry="1.2" fill="#16301c" opacity=".2"/>' +
    '<path d="M0-1.2L-4.2-2.6-1.2-2.2-3.4-4.8-.6-3 0-5 .6-3 3.4-4.8 1.2-2.2 4.2-2.6Z" fill="#2f8a3d"/>' +
    '<ellipse cx="0" cy="-4.4" rx="1.7" ry="2.2" fill="#f2b632" stroke="#c98a1a" stroke-width=".3"/>' +
    '<path d="M-1.2-5.4L1-3.6M-1.4-4.2L.4-2.8M1.2-5.4L-1-3.6M1.4-4.2L-.4-2.8" stroke="#c98a1a" stroke-width=".25" fill="none"/>' +
    '<path d="M0-6.2L-1.5-8.4-.4-7.4 0-9.2 .4-7.4 1.5-8.4Z" fill="#3f9e46"/></g>' +
  '<g id="s-bigpine"><ellipse cx="0" cy="-6.6" rx="5.2" ry="6.6" fill="#f5b82e" stroke="#b9791a" stroke-width=".5"/>' +
    '<path d="M-4.4-9.6L2.4-1M-5-6L-.4-.4M-2.2-12.4L4.6-4.2M1-13L4.9-8.2M4.4-9.6L-2.4-1M5-6L.4-.4M2.2-12.4L-4.6-4.2M-1-13L-4.9-8.2" stroke="#c98a1a" stroke-width=".45" fill="none"/>' +
    '<path d="M0-12.6L-4.6-19-1.6-16.4-1-21.6 0-17.6 1-21.6 1.6-16.4 4.6-19Z" fill="#3f9e46" stroke="#2c7a36" stroke-width=".35" stroke-linejoin="round"/>' +
    '<ellipse cx="-2.1" cy="-9" rx="1.1" ry="2" fill="#ffe08a" opacity=".7"/></g>' +
  '<g id="s-pile"><ellipse cx="0" cy="0" rx="13" ry="4" fill="#16301c" opacity=".25"/>' +
    '<use href="#s-bigpine" transform="translate(-7.6 -.6) scale(.6) rotate(-14)"/>' +
    '<use href="#s-bigpine" transform="translate(7.8 -.8) scale(.66) rotate(12)"/>' +
    '<use href="#s-bigpine"/>' +
    '<use href="#s-bigpine" transform="translate(-3.8 1.2) scale(.42) rotate(-6)"/>' +
    '<use href="#s-bigpine" transform="translate(4.4 1.4) scale(.46) rotate(8)"/>' +
    '<path class="tw" d="M-10-15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7ZM9-18l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6ZM6-6l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4Z" fill="#fff8d2"/></g>' +
  '<g id="s-cloud"><path d="M-9 0a4 4 0 0 1 1.6-7.6A6 6 0 0 1 3.4-9.8 5 5 0 0 1 10-4.6 3.4 3.4 0 0 1 9 0Z" fill="#fff" opacity=".9"/></g>';
};

// 道ばたのランタン。柱と笠は島と同じ色味に、灯り(足もとの光・ほのかな光の輪)は T.lamp の濃さで重ねる
P.lampSymbol = function (T, mul, lift) {
  var k = Math.round(T.lamp * 100) / 100, on = k > .004;
  var base = P.tint('<ellipse cx=".5" cy="0" rx="1.7" ry=".6" fill="#16301c" opacity=".22"/>' +
    '<path d="M0 0V-6.4" stroke="#6e4628" stroke-width=".75" stroke-linecap="round"/>' +
    '<rect x="-1.1" y="-8.8" width="2.2" height="2.7" rx=".7" fill="#f1dca8" stroke="#8a5a2e" stroke-width=".3"/>' +
    '<path d="M-1.6-8.7L0-10.1 1.6-8.7Z" fill="#7a4f2c"/>', mul, lift);
  return '<g id="s-lamp">' + (on ? '<ellipse cx="0" cy="-.3" rx="9.5" ry="4" fill="url(#g-pool)" opacity="' + k + '"/>' : '') + base +
    (on ? '<rect x="-.85" y="-8.5" width="1.7" height="2.1" rx=".5" fill="#ffe7a6" opacity="' + k + '"/><circle cx="0" cy="-7.4" r="4.6" fill="url(#g-lamp)" opacity="' + Math.round(k * 85) / 100 + '"/>' : '') + '</g>';
};

var SKIN = '#ffdfc4', INK = '#2b2430';
var SHADOW = '<ellipse cx="0" cy="0" rx="4.8" ry="1.6" fill="#16301c" opacity=".26"/>';

P.charParts = function (name, smil) {
  var dur = { pechi: .62, hiro: .4, mira: .74 }[name];
  // 手足: (px,py) を軸に amp 度ゆれる。smil=true なら SVG アニメを埋め込む(スクリプトなしでも動く)
  function limb(px, py, amp, inner) {
    var an = smil ? '<animateTransform attributeName="transform" type="rotate" values="' + amp + ' ' + px + ' ' + py + ';' + (-amp) + ' ' + px + ' ' + py + ';' + amp + ' ' + px + ' ' + py +
      '" keyTimes="0;.5;1" dur="' + dur + 's" repeatCount="indefinite"/>' : '';
    return '<g class="lb" data-p="' + px + ' ' + py + '" data-a="' + amp + '">' + inner + an + '</g>';
  }
  function bob(inner) {
    var an = smil ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.1;0 0" dur="' + (dur / 2) + 's" repeatCount="indefinite"/>' : '';
    return '<g class="bob">' + inner + an + '</g>';
  }
  var f, b;

  if (name === 'pechi') {
    var legs = limb(-1.7, -5.2, 26, '<path class="ol" d="M-2.7-5.4h2.1v4h-2.1z" fill="#9b7a4c"/><path class="ol" d="M-3-1.8h2.6q.9 0 .9.9v.9h-3.5z" fill="#5b3a22"/>') +
      limb(1.7, -5.2, -26, '<path class="ol" d="M.6-5.4h2.1v4H.6z" fill="#9b7a4c"/><path class="ol" d="M.3-1.8h2.6q.9 0 .9.9v.9H.3z" fill="#5b3a22"/>');
    var arms = limb(-3.5, -9.6, -24, '<path class="ol" d="M-4.7-10h2v4.3q-1 .8-2 0z" fill="#fbfbf6"/><path d="M-4.7-6.6h2" stroke="#e3ae2c" stroke-width=".6"/><circle class="ol" cx="-3.7" cy="-5" r=".95" fill="' + SKIN + '"/>') +
      limb(3.5, -9.6, 24, '<path class="ol" d="M2.7-10h2v4.3q-1 .8-2 0z" fill="#fbfbf6"/><path d="M2.7-6.6h2" stroke="#e3ae2c" stroke-width=".6"/><circle class="ol" cx="3.7" cy="-5" r=".95" fill="' + SKIN + '"/>');
    var torso = '<path class="ol" d="M-3.4-10.6h6.8l.5 5.4q-3.9 1-7.8 0z" fill="#fbfbf6"/>';
    var pads = '<ellipse class="ol" cx="-3.3" cy="-10.3" rx="1.5" ry=".75" fill="#e9b730"/><ellipse class="ol" cx="3.3" cy="-10.3" rx="1.5" ry=".75" fill="#e9b730"/>';
    var hairB = '<path class="ol" d="M-5.3-14.4a5.3 5.3 0 0 1 10.6 0v2.8q0 1.5-1.4 1.5h-7.8q-1.4 0-1.4-1.5z" fill="' + INK + '"/>';
    var crown = '<path class="ol" d="M-5.9-19.4q0-3.9 5.9-3.9t5.9 3.9q0 1-5.9 1t-5.9-1z" fill="#fff"/>';
    var band = '<path class="ol" d="M-4.9-19.1q4.9 1.5 9.8 0v1.4q-4.9 1.5-9.8 0z" fill="#2a3352"/>';
    f = SHADOW + bob(legs + arms + torso +
      '<path d="M-1.3-10.6L0-8.5 1.3-10.6z" fill="#2a3352"/><circle cx="0" cy="-7.5" r=".42" fill="#e3ae2c"/><circle cx="0" cy="-6" r=".42" fill="#e3ae2c"/>' + pads +
      hairB + '<circle class="ol" cx="0" cy="-14.2" r="4.6" fill="' + SKIN + '"/>' +
      '<path d="M-4.6-14.6a4.6 4.6 0 0 1 9.2 0q-1.1-1.3-2.4-1.2-.5.9-1.6 1-.6-.9-1.6-1-.7.9-1.5 1-1.1-.9-2.1.2z" fill="' + INK + '"/>' +
      '<ellipse cx="-1.75" cy="-13.1" rx=".56" ry=".78" fill="' + INK + '"/><ellipse cx="1.75" cy="-13.1" rx=".56" ry=".78" fill="' + INK + '"/>' +
      '<path d="M-2.8-14.5l1.7.5M2.8-14.5l-1.7.5" stroke="' + INK + '" stroke-width=".42" stroke-linecap="round"/>' +
      '<path d="M-.8-11.2q.8-.45 1.6 0" stroke="#8a4b3a" stroke-width=".42" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="-3" cy="-12" rx=".85" ry=".5" fill="#ff9d9d" opacity=".55"/><ellipse cx="3" cy="-12" rx=".85" ry=".5" fill="#ff9d9d" opacity=".55"/>' +
      crown + band + '<path class="ol" d="M-4.5-17.7q4.5 1.5 9 0q-.8 1.6-4.5 1.6t-4.5-1.6z" fill="#1c2238"/>' +
      '<circle cx="0" cy="-18.7" r="1.05" fill="#e9b730" stroke="#b7861c" stroke-width=".25"/><path d="M0-19.3v1.1M-.5-18.4q.5.5 1 0" stroke="#7a5510" stroke-width=".25" fill="none"/>');
    b = SHADOW + bob(legs + arms + torso + '<path d="M0-9.6v4.2" stroke="#d9d9d0" stroke-width=".35"/>' + pads + hairB +
      '<circle class="ol" cx="0" cy="-14.3" r="4.7" fill="' + INK + '"/><path d="M-2.4-13q1 .9 2.2.4M.8-12.2q1 .6 1.9-.1" stroke="#4a4152" stroke-width=".35" fill="none" stroke-linecap="round"/>' +
      crown + band);
  }

  if (name === 'hiro') {
    var hl = limb(-1.5, -4.6, 34, '<path class="ol" d="M-2.4-4.8h1.8v3.6h-1.8z" fill="' + SKIN + '"/><ellipse class="ol" cx="-1.2" cy="-.7" rx="1.5" ry=".75" fill="' + SKIN + '"/>') +
      limb(1.5, -4.6, -34, '<path class="ol" d="M.6-4.8h1.8v3.6H.6z" fill="' + SKIN + '"/><ellipse class="ol" cx="1.8" cy="-.7" rx="1.5" ry=".75" fill="' + SKIN + '"/>');
    var puffs = [[0, -15.6, 6.6], [-5.6, -13.2, 3.8], [5.6, -13.2, 3.8], [-4, -20, 3.4], [3.8, -20.2, 3.4], [0, -21.4, 3.4], [-6.4, -9.4, 2.8], [6.4, -9.4, 2.8]];
    var hairO = puffs.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#ff8fc0" stroke="#c9548a" stroke-width=".9"/>'; }).join('');
    var hairF = puffs.map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#ff8fc0"/>'; }).join('');
    var shine = '<path d="M-3.2-21.8q1.4-1 2.8-.4M2.2-21.2q1.2-.6 2.2.2M-7-13.6q-.4-1.6.6-2.8" stroke="#ffc6df" stroke-width=".55" fill="none" stroke-linecap="round"/>';
    var pin = '<ellipse cx="-2.9" cy="-20.4" rx=".95" ry="1.2" fill="#f5b82e" stroke="#b9791a" stroke-width=".25"/><path d="M-2.9-21.5l-.9-1.2.6.4.3-1.2.3 1.2.6-.4z" fill="#3f9e46"/>';
    var dress = '<path class="ol" d="M-2.6-10.4h5.2l2 6.4q-4.6 1.5-9.2 0z" fill="#ffd23f"/><path d="M-4.4-4.4q1.1.9 2.2.3 1.1.7 2.2.2 1.1.6 2.2 0 1.1.5 2.2-.3" stroke="#e0a11c" stroke-width=".35" fill="none"/>';
    var fruit = '<ellipse class="ol" cx="6.3" cy="-8.2" rx="2" ry="2.6" fill="#f5b82e"/><path d="M5-9.6l2.4 2.6M5-8.2l1.6 1.8M7.6-9.6L5.2-7M7.6-8.2L6-6.4" stroke="#c98a1a" stroke-width=".25"/>' +
      '<path class="ol" d="M6.3-10.7l-1.7-2.3 1.1.8.6-2.4.6 2.4 1.1-.8z" fill="#3f9e46"/>';
    var armsH = '<path d="M2-9.3Q4.2-9.8 5.6-8.9M1.6-7.6Q3.8-7.2 5.4-7.4" stroke="#4a3528" stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<path d="M2-9.3Q4.2-9.8 5.6-8.9M1.6-7.6Q3.8-7.2 5.4-7.4" stroke="' + SKIN + '" stroke-width="1.2" stroke-linecap="round" fill="none"/>';
    f = SHADOW + bob('<g transform="rotate(7 0 -5)">' + hl + hairO + hairF + dress +
      '<path d="M-2.2-10.5l1 1.3 1.2-1.2 1.2 1.2 1-1.3z" fill="#49a84e"/>' + fruit + armsH +
      '<circle class="ol" cx="0" cy="-14.2" r="4.5" fill="' + SKIN + '"/>' +
      '<path d="M-4.6-14.6a4.6 4.6 0 0 1 9.2 0q-.2-1.6-1.6-1.9-.3 1.2-1.6 1.3-.5-1.1-1.5-1.2-.6 1.1-1.6 1.2-.5-1.1-1.4-1.1-1.2.3-1.5 1.7z" fill="#ff8fc0" stroke="#c9548a" stroke-width=".3"/>' +
      '<path d="M-2.7-13.1q.8-1.1 1.6 0M1.1-13.1q.8-1.1 1.6 0" stroke="' + INK + '" stroke-width=".48" fill="none" stroke-linecap="round"/>' +
      '<path d="M-1.1-11.7h2.2q0 1.7-1.1 1.7t-1.1-1.7z" fill="#a8323e"/><ellipse cx="0" cy="-10.4" rx=".55" ry=".3" fill="#ff8f9d"/>' +
      '<ellipse cx="-3" cy="-11.9" rx=".85" ry=".5" fill="#ff8a9a" opacity=".6"/><ellipse cx="3" cy="-11.9" rx=".85" ry=".5" fill="#ff8a9a" opacity=".6"/>' +
      shine + pin + '</g>');
    b = SHADOW + bob('<g transform="rotate(7 0 -5)">' + hl + fruit + dress + hairO + hairF +
      '<circle cx="0" cy="-14.6" r="5.4" fill="#ff8fc0"/><path d="M-3-13.4q1.4 1.2 3 .4M1-11.6q1.2.8 2.4 0M-4.6-17q1-1.2 2.4-1.2" stroke="#e9719f" stroke-width=".45" fill="none" stroke-linecap="round"/>' +
      shine + pin + '</g>');
  }

  if (name === 'mira') {
    var ml = limb(-1.6, -4.2, 20, '<path class="olr" d="M-2.4-4.4h1.6v2.6h-1.6z" fill="#2a2e3a"/><path d="M-2.4-3.5h1.6M-2.4-2.7h1.6" stroke="#fff" stroke-width=".3"/><path class="olr" d="M-3-1.9h2.8q.8 0 .8.9v1H-3z" fill="#f4f6fa"/><path d="M-3-.55h3.6" stroke="#35d6ff" stroke-width=".3"/>') +
      limb(1.6, -4.2, -20, '<path class="olr" d="M.8-4.4h1.6v2.6H.8z" fill="#2a2e3a"/><path d="M.8-3.5h1.6M.8-2.7h1.6" stroke="#fff" stroke-width=".3"/><path class="olr" d="M-.6-1.9h2.8q.8 0 .8.9v1H-.6z" fill="#f4f6fa"/><path d="M-.6-.55H3" stroke="#35d6ff" stroke-width=".3"/>');
    var ma = limb(-3.2, -8.8, 15, '<path d="M-3.2-8.8L-5.8-11.4" stroke="#2a2e3a" stroke-width="1.6" stroke-linecap="round"/><path d="M-3.7-9.9l-.6.6M-4.6-10.8l-.6.6" stroke="#fff" stroke-width=".3"/><circle class="olr" cx="-6.2" cy="-11.9" r="1.3" fill="#2a2e3a"/><circle cx="-6.2" cy="-11.9" r=".5" fill="#35d6ff"/>') +
      limb(3.2, -8.8, -15, '<path d="M3.2-8.8L5.8-11.4" stroke="#2a2e3a" stroke-width="1.6" stroke-linecap="round"/><path d="M3.7-9.9l.6.6M4.6-10.8l.6.6" stroke="#fff" stroke-width=".3"/><circle class="olr" cx="6.2" cy="-11.9" r="1.3" fill="#2a2e3a"/><circle cx="6.2" cy="-11.9" r=".5" fill="#35d6ff"/>');
    var mb = '<rect x="-1.2" y="-10.7" width="2.4" height="1.2" fill="#2a2e3a"/><rect class="olr" x="-3.3" y="-9.8" width="6.6" height="5.8" rx="2.3" fill="#f4f6fa"/>';
    var ant = '<path d="M-2.4-19L-3.6-22.2M2.4-19L3.6-22.2" stroke="#7d879c" stroke-width=".5" stroke-linecap="round"/>' +
      '<circle class="olr" cx="-3.7" cy="-22.6" r="1.05" fill="#35d6ff"/><circle class="olr" cx="3.7" cy="-22.6" r="1.05" fill="#35d6ff"/>';
    var ears = '<circle class="olr" cx="-6" cy="-14.6" r="1.35" fill="#c9d1df"/><circle cx="-6" cy="-14.6" r=".55" fill="#35d6ff"/><circle class="olr" cx="6" cy="-14.6" r="1.35" fill="#c9d1df"/><circle cx="6" cy="-14.6" r=".55" fill="#35d6ff"/>';
    var helm = '<ellipse class="olr" cx="0" cy="-14.8" rx="6" ry="5" fill="#f9fbff"/>';
    function bow(x) { return '<path class="ol" d="M' + x + '-19.7l-2.1-1.4v2.8zM' + x + '-19.7l2.1-1.4v2.8z" fill="#ff6fa5"/><circle class="ol" cx="' + x + '" cy="-19.7" r=".62" fill="#ff9cc4"/>'; }
    f = SHADOW + bob(ml + ma + mb +
      '<rect x="-1.7" y="-8" width="3.4" height="2.5" rx=".6" fill="#2a2e3a"/><path d="M-1.1-7.3h2.2M-1.1-6.7h2.2M-1.1-6.1h1.4" stroke="#35d6ff" stroke-width=".3"/>' +
      ant + ears + helm + '<rect x="-4.7" y="-17.7" width="9.4" height="6.2" rx="2.9" fill="#0d1020"/>' +
      '<path d="M-3.6-16.1q1-1 2.6-1.1" stroke="#3a4266" stroke-width=".5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-2" cy="-14.8" r="1.2" fill="#35d6ff"/><circle cx="-2.3" cy="-15.2" r=".4" fill="#c8f6ff"/>' +
      '<circle cx="2" cy="-14.8" r="1.2" fill="#35d6ff"/><circle cx="1.7" cy="-15.2" r=".4" fill="#c8f6ff"/>' +
      '<ellipse cx="0" cy="-12.8" rx=".55" ry=".4" fill="#35d6ff"/>' + bow(2.8));
    b = SHADOW + bob(ml + ma + mb + '<rect x="-1.5" y="-8.4" width="3" height="3" rx=".7" fill="#dfe5ee" stroke="#9aa3b5" stroke-width=".25"/><path d="M-.8-7.4h1.6M-.8-6.6h1.6" stroke="#9aa3b5" stroke-width=".3"/>' +
      ant + ears + helm + '<path d="M-4-17.4q4 1.8 8 0M0-16.5v4.6" stroke="#b5bdcc" stroke-width=".35" fill="none" stroke-linecap="round"/>' + bow(-2.8));
  }
  return { f: f, b: b };
};
P.charMarkup = function (name, smil) {
  var c = P.charParts(name, smil);
  return '<g class="front">' + c.f + '</g><g class="back" display="none">' + c.b + '</g>';
};

// 台風になったヒロミーヌ(物語の「台風化」)
P.typhoonMarkup = function () {
  var s = '<ellipse cx="0" cy="0" rx="6.5" ry="2.1" fill="#16301c" opacity=".26"/>', i;
  var F = [[-2.2, 2.6], [-6, 4.2], [-10, 5.8], [-14, 7.4], [-18, 9]];
  for (i = 0; i < F.length; i++) {
    s += '<ellipse class="fn" cx="0" cy="' + F[i][0] + '" rx="' + F[i][1] + '" ry="' + (F[i][1] * .34).toFixed(2) + '" fill="' + (i & 1 ? '#c9d8ea' : '#e6eef8') + '" stroke="#8ea3bd" stroke-width=".35"/>';
  }
  return s + '<circle cx="0" cy="-22.4" r="3.6" fill="#ff8fc0" stroke="#c9548a" stroke-width=".5"/><circle cx="-3.4" cy="-21" r="2.4" fill="#ff8fc0" stroke="#c9548a" stroke-width=".5"/>' +
    '<circle cx="3.4" cy="-21" r="2.4" fill="#ff8fc0" stroke="#c9548a" stroke-width=".5"/><circle cx="0" cy="-21.4" r="3.2" fill="#ff8fc0"/>' +
    '<path d="M-4.6-17.6a1.3 1.3 0 1 1 1.3 1.3a.7.7 0 1 1 .2-1.3M1.8-17.6a1.3 1.3 0 1 1 1.3 1.3a.7.7 0 1 1 .2-1.3" fill="none" stroke="#2b2430" stroke-width=".45" stroke-linecap="round"/>' +
    '<path d="M-1-14.6q1 .8 2 0" fill="none" stroke="#2b2430" stroke-width=".45" stroke-linecap="round"/>' +
    '<use class="orb" href="#s-pine"/><use class="orb" href="#s-pine"/>';
};

// ミラmini(ハートの目のドローン)
P.miniMarkup = function () {
  var heart = 'c-1.2-.9-.7-1.9 0-1.2c.7-.7 1.2.3 0 1.2z';
  return '<ellipse cx="0" cy="-4.7" rx="3.4" ry=".55" fill="#aab3c4" opacity=".75"><animate attributeName="rx" values="3.4;.7;3.4" dur=".22s" repeatCount="indefinite"/></ellipse>' +
    '<path d="M0-4.6v1.3" stroke="#7d879c" stroke-width=".45"/>' +
    '<ellipse class="olr" cx="0" cy="-1" rx="3.3" ry="2.5" fill="#f9fbff"/>' +
    '<rect x="-2.5" y="-2.5" width="5" height="2.9" rx="1.4" fill="#0d1020"/>' +
    '<path d="M-1.15-.4' + heart + '" fill="#ff5c9a"/><path d="M1.15-.4' + heart + '" fill="#ff5c9a"/>' +
    '<circle cx="0" cy="1.7" r=".45" fill="#35d6ff"/>';
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
