#!/usr/bin/env node
/**
 * validate-i18n.mjs
 *
 * Scans all .tsx/.ts files under src/, extracts t('...') calls, verifies that
 * every key exists in both en.ts and ru.ts translation files.
 *
 * Exits with code 1 and prints missing keys if any are found.
 * Exits with code 0 if all keys are present in both files.
 *
 * Usage:
 *   node scripts/validate-i18n.mjs
 *   npm run validate:i18n
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(__dirname, '../src');
const EN_FILE = resolve(__dirname, '../src/i18n/en.ts');
const RU_FILE = resolve(__dirname, '../src/i18n/ru.ts');

// ---------------------------------------------------------------------------
// 1. Load translation files and extract all dot-notation keys
//    Uses a stack-based line parser — no eval, no external tools required.
// ---------------------------------------------------------------------------

/**
 * Parse a TypeScript translation file and return a Set of all dot-notation
 * keys (leaf nodes only). Works by scanning lines and tracking nesting depth.
 *
 * Supports the pattern used in ru.ts / en.ts:
 *   someSection: {
 *     leafKey: 'value',
 *     nested: {
 *       deepKey: 'value',
 *     },
 *   },
 */
function loadTranslations(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const keys = new Set();

  // Stack of key segments for current nesting path
  const stack = [];

  // Matches a line that opens a nested object:  keyName: {
  const OPEN_RE = /^\s*['"]?([\w-]+)['"]?\s*:\s*\{/;
  // Matches a leaf value line:  keyName: 'value'   or  keyName: "value"
  // Including multi-line strings (we just need the key name)
  const LEAF_RE = /^\s*['"]?([\w-]+)['"]?\s*:\s*(?:'|"|`)/;
  // Matches a closing brace (possibly with comma)
  const CLOSE_RE = /^\s*\},?\s*$/;

  for (const line of raw.split('\n')) {
    // Skip comments
    const trimmed = line.replace(/\/\/.*$/, '').trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

    // A line can both open AND close (e.g. nested: {},) — handle close first
    const openMatch = OPEN_RE.exec(line);
    const closeMatch = CLOSE_RE.exec(trimmed);
    const leafMatch = LEAF_RE.exec(line);

    if (openMatch && !trimmed.endsWith('},') && !trimmed.endsWith('}')) {
      // Opening a new nested section
      stack.push(openMatch[1]);
    } else if (closeMatch) {
      // Closing a nested section
      if (stack.length > 0) stack.pop();
    } else if (leafMatch && !openMatch) {
      // Leaf key-value pair
      const leafKey = leafMatch[1];
      const fullKey = stack.length > 0 ? `${stack.join('.')}.${leafKey}` : leafKey;
      keys.add(fullKey);
    }
  }

  return keys;
}

// ---------------------------------------------------------------------------
// 2. Walk src/ directory and collect all .tsx / .ts files
// ---------------------------------------------------------------------------

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      // Skip node_modules, __tests__, stories
      if (['node_modules', '.storybook', 'stories', '__tests__'].includes(entry)) continue;
      files.push(...walkDir(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith('.stories.tsx')) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// 3. Extract t('...') calls from source files
// ---------------------------------------------------------------------------

const T_CALL_RE = /\bt\(\s*['"`]([^'"`]+)['"`]/g;

function extractKeys(sourceFiles) {
  const found = new Map(); // key → first file where it appears
  for (const file of sourceFiles) {
    const content = readFileSync(file, 'utf8');
    let match;
    while ((match = T_CALL_RE.exec(content)) !== null) {
      const key = match[1];
      // Skip keys that are clearly dynamic (contain ${} or variables)
      if (key.includes('${') || key.includes('\n')) continue;
      if (!found.has(key)) {
        const rel = file.replace(SRC_DIR + '/', '');
        found.set(key, rel);
      }
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// 4. Main — compare and report
// ---------------------------------------------------------------------------

console.log('🔍  Loading translation files…');
const enKeys = loadTranslations(EN_FILE);
const ruKeys = loadTranslations(RU_FILE);

console.log(`    en.ts: ${enKeys.size} keys`);
console.log(`    ru.ts: ${ruKeys.size} keys`);

console.log('🔍  Scanning source files…');
const sourceFiles = walkDir(SRC_DIR).filter(
  (f) => !f.includes('/i18n/') && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'),
);
console.log(`    ${sourceFiles.length} files scanned`);

const usedKeys = extractKeys(sourceFiles);
console.log(`    ${usedKeys.size} unique t() keys found\n`);

let errors = 0;

for (const [key, file] of usedKeys.entries()) {
  const missingEn = !enKeys.has(key);
  const missingRu = !ruKeys.has(key);

  if (missingEn || missingRu) {
    errors++;
    const missing = [missingEn && 'en.ts', missingRu && 'ru.ts'].filter(Boolean).join(', ');
    console.error(`  ✗  Missing in [${missing}]: "${key}"  (first seen in ${file})`);
  }
}

// Cross-check: keys in en.ts but not ru.ts (and vice versa)
for (const key of enKeys) {
  if (!ruKeys.has(key)) {
    errors++;
    console.error(`  ✗  Key in en.ts but missing in ru.ts: "${key}"`);
  }
}
for (const key of ruKeys) {
  if (!enKeys.has(key)) {
    errors++;
    console.error(`  ✗  Key in ru.ts but missing in en.ts: "${key}"`);
  }
}

if (errors === 0) {
  console.log('✅  All i18n keys are valid — no missing translations.\n');
  process.exit(0);
} else {
  console.error(`\n❌  Found ${errors} i18n issue(s). Fix before merging.\n`);
  process.exit(1);
}
