/**
 * Dadata.ru API integration
 * Docs: https://dadata.ru/api/find-party/
 *
 * Token is loaded from VITE_DADATA_TOKEN env variable.
 * Register at https://dadata.ru — free plan: 10,000 requests/day.
 */

const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN as string | undefined;

const BASE_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';

export interface DadataParty {
  value: string; // short name with OPF
  data: {
    inn: string;
    kpp: string | null;
    ogrn: string | null;
    ogrn_date: string | null;
    type: 'LEGAL' | 'INDIVIDUAL';
    state: {
      status: 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'REORGANIZING' | 'BANKRUPT';
    };
    name: {
      full_with_opf: string;
      short_with_opf: string | null;
      latin: string | null;
      full: string;
      short: string | null;
    };
    address: {
      value: string;
      data?: {
        postal_code?: string;
        region?: string;
        city?: string;
        street?: string;
      };
    } | null;
    management: {
      name: string;
      post: string;
      disqualified: boolean | null;
    } | null;
    finance: {
      tax_system: string | null;
    } | null;
    okved: string | null;
    okved_type: string | null;
  };
}

interface DadataSuggestResponse {
  suggestions: DadataParty[];
}

/** Check whether Dadata token is configured */
export function isDadataConfigured(): boolean {
  return !!DADATA_TOKEN && DADATA_TOKEN.trim().length > 0;
}

/**
 * Find organization by exact INN (10 or 12 digits).
 * Returns null if not found or token not configured.
 */
export async function findPartyByInn(inn: string): Promise<DadataParty | null> {
  if (!isDadataConfigured()) return null;

  const response = await fetch(`${BASE_URL}/findById/party`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${DADATA_TOKEN}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: inn }),
  });

  if (!response.ok) {
    throw new Error(`Dadata error: ${response.status}`);
  }

  const data: DadataSuggestResponse = await response.json();
  return data.suggestions[0] ?? null;
}

/**
 * Search organizations by name or INN fragment.
 * Returns up to `count` suggestions.
 */
export async function suggestParties(query: string, count = 5): Promise<DadataParty[]> {
  if (!isDadataConfigured() || !query.trim()) return [];

  const response = await fetch(`${BASE_URL}/suggest/party`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${DADATA_TOKEN}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, count }),
  });

  if (!response.ok) return [];

  const data: DadataSuggestResponse = await response.json();
  return data.suggestions;
}

/** Map Dadata party to flat counterparty fields */
export function mapDadataToCounterparty(party: DadataParty) {
  const d = party.data;
  return {
    name: d.name.short_with_opf ?? d.name.full_with_opf ?? party.value,
    inn: d.inn ?? '',
    kpp: d.kpp ?? '',
    ogrn: d.ogrn ?? '',
    legalAddress: d.address?.value ?? '',
    actualAddress: d.address?.value ?? '',
    active: d.state.status === 'ACTIVE',
  };
}
