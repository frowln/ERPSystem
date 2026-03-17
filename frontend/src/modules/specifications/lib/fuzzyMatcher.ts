import type { SpecItem } from '@/types';

export interface MatchResult {
  specItem: SpecItem;
  confidence: number;       // 0-100
  matchType: 'exact-code' | 'brand-mfr' | 'fuzzy-name';
}

export interface InvoiceLine {
  name: string;
  productCode?: string;
  brand?: string;
  manufacturer?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

/**
 * Match an invoice line to spec items using deterministic fuzzy matching.
 * Returns top matches sorted by confidence (descending).
 */
export function matchInvoiceLine(
  line: InvoiceLine,
  specItems: SpecItem[],
  topN = 5,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const item of specItems) {
    let confidence = 0;
    let matchType: MatchResult['matchType'] = 'fuzzy-name';

    // 1) Exact product code match
    if (line.productCode && item.productCode &&
        normalize(line.productCode) === normalize(item.productCode)) {
      confidence = 95;
      matchType = 'exact-code';
    }
    // 2) Brand + manufacturer match
    else if (line.brand && item.brand &&
             normalize(line.brand) === normalize(item.brand)) {
      confidence = 75;
      if (line.manufacturer && item.manufacturer &&
          normalize(line.manufacturer) === normalize(item.manufacturer)) {
        confidence = 85;
      }
      matchType = 'brand-mfr';
    }
    // 3) Fuzzy name match with engineering normalization
    else {
      const normA = normalizeEngineering(line.name);
      const normB = normalizeEngineering(item.name);
      confidence = trigramSimilarity(normA, normB) * 100;

      // Bonus: if both contain same DN/PN values, boost confidence
      const dnA = extractParams(line.name);
      const dnB = extractParams(item.name);
      if (dnA.dn && dnB.dn && dnA.dn === dnB.dn) confidence = Math.min(100, confidence + 15);
      if (dnA.pn && dnB.pn && dnA.pn === dnB.pn) confidence = Math.min(100, confidence + 10);

      matchType = 'fuzzy-name';
    }

    if (confidence >= 20) {
      results.push({ specItem: item, confidence: Math.round(confidence), matchType });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, topN);
}

/**
 * Batch match: try to find best match for each invoice line.
 */
export function batchMatch(
  lines: InvoiceLine[],
  specItems: SpecItem[],
): { line: InvoiceLine; bestMatch: MatchResult | null; alternatives: MatchResult[] }[] {
  return lines.map(line => {
    const matches = matchInvoiceLine(line, specItems);
    return {
      line,
      bestMatch: matches.length > 0 ? matches[0] : null,
      alternatives: matches.slice(1),
    };
  });
}

// ---------------------------------------------------------------------------
// Engineering abbreviation normalization
// ---------------------------------------------------------------------------

const ENGINEERING_SYNONYMS: [RegExp, string][] = [
  // Diameter: Ду, DN, Д, д.у., d
  [/\bд[уy]\.?\s*(\d+)/gi, 'dn$1'],
  [/\bdn\s*(\d+)/gi, 'dn$1'],
  [/\bd\.?\s*у\.?\s*(\d+)/gi, 'dn$1'],

  // Pressure: Ру, PN, Р, р.у.
  [/\bр[уy]\.?\s*(\d+)/gi, 'pn$1'],
  [/\bpn\s*(\d+)/gi, 'pn$1'],
  [/\bр\.?\s*у\.?\s*(\d+)/gi, 'pn$1'],

  // Common abbreviations
  [/\bш\.\s*/gi, 'шаровой '],
  [/\bшар\.\s*/gi, 'шаровой '],
  [/\bобр\.\s*/gi, 'обратный '],
  [/\bзап\.\s*/gi, 'запорный '],
  [/\bрег\.\s*/gi, 'регулирующий '],
  [/\bнерж\.\s*/gi, 'нержавеющий '],
  [/\bоц\.\s*/gi, 'оцинкованный '],
  [/\bп\/п\b/gi, 'полипропилен'],
  [/\bп\/э\b/gi, 'полиэтилен'],
  [/\bэл\.\s*/gi, 'электро'],
  [/\bциркуляц\.\s*/gi, 'циркуляционный '],

  // Units
  [/\bмм\b/gi, 'мм'],
  [/\bм\b/gi, 'м'],
  [/\bшт\b\.?/gi, 'шт'],
  [/\bкг\b/gi, 'кг'],

  // Remove ГОСТ references (they clutter matching)
  [/гост\s*[\d.-]+/gi, ''],
  [/ту\s*[\d.-]+/gi, ''],
];

function normalizeEngineering(s: string): string {
  let result = normalize(s);
  for (const [pattern, replacement] of ENGINEERING_SYNONYMS) {
    result = result.replace(pattern, replacement);
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Extract DN and PN parameters from a string for bonus matching.
 */
function extractParams(s: string): { dn: string | null; pn: string | null } {
  const lower = s.toLowerCase();
  const dnMatch = lower.match(/(?:ду|dn|д\.?\s*у\.?)\s*(\d+)/i);
  const pnMatch = lower.match(/(?:ру|pn|р\.?\s*у\.?)\s*(\d+)/i);
  return {
    dn: dnMatch ? dnMatch[1] : null,
    pn: pnMatch ? pnMatch[1] : null,
  };
}

// ---------------------------------------------------------------------------
// Core text processing
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const result = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    result.add(padded.slice(i, i + 3));
  }
  return result;
}

function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union > 0 ? intersection / union : 0;
}
