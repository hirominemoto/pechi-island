// ペチ島 — 木やパイナップルなどの絵(すべて SVG のコードで描く。登場人物のポリゴンモデルは figures.js)
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

})(typeof globalThis !== 'undefined' ? globalThis : this);
