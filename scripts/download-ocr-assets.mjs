/**
 * 下载 OCR 本地资源（tesseract worker / 核心 / 中文+英文语言包）
 *
 * 用法：
 *   node scripts/download-ocr-assets.mjs
 *
 * 下载完成后，构建时设置环境变量 NEXT_PUBLIC_OCR_LOCAL=true 即启用本地 OCR
 * （例如在 .env.local 或构建命令中设置），无需联网、国内可用。
 *
 * ⚠️ 体积说明（影响 APK 大小）：
 *   - worker.min.js            约 0.1 MB
 *   - tesseract-core*.wasm.js  每个约 20 MB（SIMD + 非 SIMD 两个）
 *   - chi_sim / eng 语言包      各约 1.7~2.0 MB
 *   合计约 40 MB。若想减小体积，可只保留 SIMD 核心（现代 Android WebView
 *   均支持 SIMD），并把脚本中 nonSimdCore 置为 null。
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'ocr');
const langDir = join(outDir, 'lang');

const FILES = [
  {
    name: 'worker.min.js',
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
  },
  {
    name: 'tesseract-core-simd.wasm.js',
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-simd.wasm.js',
  },
  {
    name: 'tesseract-core.wasm.js',
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core.wasm.js',
  },
  {
    name: 'lang/chi_sim.traineddata.gz',
    url: 'https://tessdata.projectnaptha.com/4.0.0_fast/chi_sim.traineddata.gz',
  },
  {
    name: 'lang/eng.traineddata.gz',
    url: 'https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz',
  },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

for (const dir of [outDir, langDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

let total = 0;
for (const file of FILES) {
  const dest = join(outDir, file.name);
  try {
    const size = await download(file.url, dest);
    total += size;
    console.log(`✓ ${file.name}  (${(size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error(`✗ ${file.name}  下载失败：${err.message}`);
    process.exitCode = 1;
  }
}

console.log(`\n完成，共约 ${(total / 1024 / 1024).toFixed(1)} MB`);
console.log('下一步：在 .env.local 中加入 NEXT_PUBLIC_OCR_LOCAL=true 后重新 npm run build');
