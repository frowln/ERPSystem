// ─────────────────────────────────────────────────────────────────────────────
// Price / calculation helpers
// ─────────────────────────────────────────────────────────────────────────────

export const formatMoneyWhole = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export const calcSalePrice    = (cp: number, coef: number) => Math.round(cp * coef * 100) / 100;
export const calcVatAmount    = (sp: number, vatRate: number) => Math.round(sp * vatRate / 100 * 100) / 100;
export const calcTotalWithVat = (sp: number, va: number) => sp + va;
export const calcPlanned      = (sp: number, qty: number) => Math.round(sp * qty * 100) / 100;

// ─────────────────────────────────────────────────────────────────────────────
// Text matching helpers
// ─────────────────────────────────────────────────────────────────────────────

export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isLikelyLineMatch = (budgetItemName: string, sourceLineName: string): boolean => {
  const budgetTokens = normalizeText(budgetItemName)
    .split(' ')
    .filter((token) => token.length >= 3);
  const source = normalizeText(sourceLineName);
  if (!source || budgetTokens.length === 0) return false;
  return budgetTokens.some((token) => source.includes(token));
};

// ─────────────────────────────────────────────────────────────────────────────
// Table cell CSS helpers
// ─────────────────────────────────────────────────────────────────────────────

export const thCls  = 'px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap';
export const thRCls = thCls + ' text-right';
export const tdCls  = 'px-3 py-2.5 text-sm';
export const tdRCls = tdCls + ' tabular-nums text-right';
