// src/ のコードを 1 ファイルにまとめる:  node build.mjs
//   index.html        … そのままウェブに置けるページ
//   pechi-island.svg  … 単体で動く SVG
//   build/artifact.html … 共有ページ用(head なし)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(dir, 'src', f), 'utf8');
const require = createRequire(import.meta.url);

const parts = ['scene.js', 'props.js', 'chars.js', 'figures.js', 'markup.js', 'static.js', 'live.js'].filter(f => fs.existsSync(path.join(dir, 'src', f)));
const code = parts.map(read).join('\n');
if (code.includes(']]>')) throw new Error('code must not contain ]]>');

// スクリプトが動かない場所(<img> など)でも見えるように、最初の1コマを Node で描いておく
for (const f of parts) if (f !== 'live.js') require('./src/' + f);
const P = globalThis.Pechi;
const stat = P.renderStatic ? P.renderStatic(20, 30) : '';

const page = read('page.html').replace('/*__CODE__*/', () => code).replace('<!--__STATIC__-->', () => stat);
const cut = page.indexOf('</style>') + '</style>'.length;
const icon = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -10.5 12 12"><path d="M0-1.2L-4.2-2.6-1.2-2.2-3.4-4.8-.6-3 0-5 .6-3 3.4-4.8 1.2-2.2 4.2-2.6Z" fill="#2f8a3d"/>' +
  '<ellipse cx="0" cy="-4.4" rx="1.9" ry="2.4" fill="#f2b632" stroke="#c98a1a" stroke-width=".3"/><path d="M0-6.4L-1.6-8.8-.4-7.6 0-9.6 .4-7.6 1.6-8.8Z" fill="#3f9e46"/></svg>');
const desc = 'コードだけで描いた3Dの「ペチ島」。ペチ隊長・ヒロミーヌ・ミラが島をぐるぐる歩き回ります。';

fs.writeFileSync(path.join(dir, 'index.html'),
  '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="description" content="' + desc + '">\n<meta property="og:title" content="ペチ島">\n<meta property="og:description" content="' + desc + '">\n' +
  '<link rel="icon" href="' + icon + '">\n' + page.slice(0, cut) + '\n</head>\n<body>' + page.slice(cut) + '</body>\n</html>\n');

fs.writeFileSync(path.join(dir, 'pechi-island.svg'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" id="pechi" viewBox="' + P.VIEW.wide.join(' ') + '">\n' +
  '<title>ペチ島</title>\n<desc>' + desc + '</desc>\n' + stat + '\n<script><![CDATA[\n' + code +
  '\nPechi.mount(document.documentElement, { webfont: true, ui: true, time: Pechi.hashTime() });\n]]></script>\n</svg>\n');

fs.mkdirSync(path.join(dir, 'build'), { recursive: true });
fs.writeFileSync(path.join(dir, 'build', 'artifact.html'), page);

for (const f of ['index.html', 'pechi-island.svg', 'build/artifact.html'])
  console.log(f.padEnd(22), (fs.statSync(path.join(dir, f)).size / 1024).toFixed(1) + ' KB');
