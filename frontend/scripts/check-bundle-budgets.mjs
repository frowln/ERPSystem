import fs from 'fs';
import path from 'path';

const DIST_ASSETS_DIR = path.resolve(process.cwd(), 'dist', 'assets');

const KB = 1024;

const limits = {
  maxAnyJsChunkKb: 500,
  maxIndexChunkKb: 400,
  maxChartsChunkKb: 320,
  maxVendorChunkKb: 500,
  maxVendorReactChunkKb: 450,
  maxAppShellChunkKb: 180,
  maxIconsChunkKb: 120,
};

const toKb = (bytes) => Math.round((bytes / KB) * 100) / 100;

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  console.error(`dist assets directory not found: ${DIST_ASSETS_DIR}`);
  process.exit(1);
}

const assetFiles = fs.readdirSync(DIST_ASSETS_DIR);
const jsFiles = assetFiles.filter((file) => file.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('No JS chunks found in dist/assets.');
  process.exit(1);
}

const chunks = jsFiles.map((file) => {
  const fullPath = path.join(DIST_ASSETS_DIR, file);
  const stats = fs.statSync(fullPath);
  return {
    file,
    sizeBytes: stats.size,
    sizeKb: toKb(stats.size),
  };
});

chunks.sort((a, b) => b.sizeBytes - a.sizeBytes);

const indexChunk = chunks.find((chunk) => chunk.file.startsWith('index-'));
const chartsChunk = chunks.find((chunk) => chunk.file.startsWith('charts-'));
const vendorReactChunk = chunks.find((chunk) => chunk.file.startsWith('vendor-react-'));
const vendorChunk = chunks.find(
  (chunk) => chunk.file.startsWith('vendor-') && !chunk.file.startsWith('vendor-react-'),
);
const appShellChunk = chunks.find((chunk) => chunk.file.startsWith('app-shell-'));
const iconsChunk = chunks.find((chunk) => chunk.file.startsWith('icons-'));
const largestChunk = chunks[0];

const violations = [];

if (largestChunk && largestChunk.sizeKb > limits.maxAnyJsChunkKb) {
  violations.push(
    `Largest JS chunk ${largestChunk.file} is ${largestChunk.sizeKb}KB (limit ${limits.maxAnyJsChunkKb}KB).`,
  );
}

if (indexChunk && indexChunk.sizeKb > limits.maxIndexChunkKb) {
  violations.push(
    `Index chunk ${indexChunk.file} is ${indexChunk.sizeKb}KB (limit ${limits.maxIndexChunkKb}KB).`,
  );
}

if (chartsChunk && chartsChunk.sizeKb > limits.maxChartsChunkKb) {
  violations.push(
    `Charts chunk ${chartsChunk.file} is ${chartsChunk.sizeKb}KB (limit ${limits.maxChartsChunkKb}KB).`,
  );
}

if (vendorChunk && vendorChunk.sizeKb > limits.maxVendorChunkKb) {
  violations.push(
    `Vendor chunk ${vendorChunk.file} is ${vendorChunk.sizeKb}KB (limit ${limits.maxVendorChunkKb}KB).`,
  );
}

if (vendorReactChunk && vendorReactChunk.sizeKb > limits.maxVendorReactChunkKb) {
  violations.push(
    `Vendor React chunk ${vendorReactChunk.file} is ${vendorReactChunk.sizeKb}KB (limit ${limits.maxVendorReactChunkKb}KB).`,
  );
}

if (appShellChunk && appShellChunk.sizeKb > limits.maxAppShellChunkKb) {
  violations.push(
    `App shell chunk ${appShellChunk.file} is ${appShellChunk.sizeKb}KB (limit ${limits.maxAppShellChunkKb}KB).`,
  );
}

if (iconsChunk && iconsChunk.sizeKb > limits.maxIconsChunkKb) {
  violations.push(
    `Icons chunk ${iconsChunk.file} is ${iconsChunk.sizeKb}KB (limit ${limits.maxIconsChunkKb}KB).`,
  );
}

console.log('Top 10 JS chunks by size:');
for (const chunk of chunks.slice(0, 10)) {
  console.log(`- ${chunk.file}: ${chunk.sizeKb}KB`);
}

if (violations.length > 0) {
  console.error('\nBundle budget violations:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('\nBundle budgets: PASS');
