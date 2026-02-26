import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type SeedSummary = {
  budget: { id: string };
  commercialProposal: { id: string };
  contracts: { ids: string[]; splitBudgetItemId: string };
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type LoginData = {
  accessToken: string;
};

type CpItem = {
  id: string;
  selectedInvoiceLineId?: string;
};

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWithRetry(
  request: APIRequestContext,
  url: string,
  authToken: string,
  attempts = 8,
) {
  let response = await request.get(url, { headers: { Authorization: `Bearer ${authToken}` } });
  for (let i = 1; i < attempts && (response.status() === 429 || response.status() >= 500); i += 1) {
    await pause(350 * i);
    response = await request.get(url, { headers: { Authorization: `Bearer ${authToken}` } });
  }
  return response;
}

async function postWithRetry(
  request: APIRequestContext,
  url: string,
  authToken: string,
  data: unknown,
  attempts = 8,
) {
  let response = await request.post(url, {
    headers: { Authorization: `Bearer ${authToken}` },
    data,
  });
  for (let i = 1; i < attempts && (response.status() === 429 || response.status() >= 500); i += 1) {
    await pause(350 * i);
    response = await request.post(url, {
      headers: { Authorization: `Bearer ${authToken}` },
      data,
    });
  }
  return response;
}

async function readSummary(): Promise<SeedSummary> {
  const summaryPath = process.env.FINANCE_SUMMARY_FILE
    ?? path.resolve(process.cwd(), '..', 'scripts', 'seed_full_finmodel_demo_summary.json');
  const raw = await fs.readFile(summaryPath, 'utf8');
  return JSON.parse(raw) as SeedSummary;
}

async function login(request: APIRequestContext): Promise<string> {
  const apiRoot = process.env.API_ROOT || 'http://localhost:8080/api';
  const email = process.env.TEST_USER_EMAIL || 'admin@privod.ru';
  const password = process.env.TEST_USER_PASSWORD || 'admin123';

  const response = await request.post(`${apiRoot}/auth/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as ApiEnvelope<LoginData>;
  expect(payload.data.accessToken).toBeTruthy();
  return payload.data.accessToken;
}

test.describe('Finance negative API constraints', () => {
  test.describe.configure({ mode: 'serial' });

  test('cannot assign one invoice line to two different CP items', async ({ request }) => {
    const apiRoot = process.env.API_ROOT || 'http://localhost:8080/api';
    const summary = await readSummary();
    const token = await login(request);

    const materialsResp = await getWithRetry(
      request,
      `${apiRoot}/commercial-proposals/${summary.commercialProposal.id}/items/materials`,
      token,
    );
    expect(materialsResp.ok()).toBeTruthy();
    const materialsPayload = (await materialsResp.json()) as ApiEnvelope<CpItem[]>;
    const materials = materialsPayload.data;

    const withSelected = materials.filter((item) => !!item.selectedInvoiceLineId);
    expect(withSelected.length).toBeGreaterThanOrEqual(2);

    const sourceItem = withSelected[0];
    const targetItem = withSelected.find((item) => item.id !== sourceItem.id);
    expect(targetItem).toBeTruthy();

    const conflictResp = await postWithRetry(
      request,
      `${apiRoot}/commercial-proposals/${summary.commercialProposal.id}/items/${targetItem!.id}/select-invoice`,
      token,
      { invoiceLineId: sourceItem.selectedInvoiceLineId },
    );

    expect(conflictResp.ok()).toBeFalsy();
    expect([400, 409, 422, 429, 500]).toContain(conflictResp.status());
  });

  test('cannot link contract allocation above remaining FM quantity', async ({ request }) => {
    const apiRoot = process.env.API_ROOT || 'http://localhost:8080/api';
    const summary = await readSummary();
    const token = await login(request);

    const targetContractId = summary.contracts.ids[summary.contracts.ids.length - 1];
    expect(targetContractId).toBeTruthy();

    const overAllocateResp = await postWithRetry(
      request,
      `${apiRoot}/contracts/${targetContractId}/budget-items`,
      token,
      {
        items: [
          {
            budgetItemId: summary.contracts.splitBudgetItemId,
            allocatedQuantity: 1000000,
            allocatedAmount: 1,
            notes: 'negative-e2e over-allocation',
          },
        ],
      },
    );

    expect(overAllocateResp.ok()).toBeFalsy();
    expect([400, 409, 422, 429, 500]).toContain(overAllocateResp.status());
  });

  test('cannot move proposal from DRAFT directly to ACTIVE', async ({ request }) => {
    const apiRoot = process.env.API_ROOT || 'http://localhost:8080/api';
    const summary = await readSummary();
    const token = await login(request);

    const createResp = await postWithRetry(
      request,
      `${apiRoot}/commercial-proposals`,
      token,
      {
        budgetId: summary.budget.id,
        name: `NEG-CP-${Date.now()}`,
        notes: 'negative transition check',
      },
    );
    expect(createResp.ok()).toBeTruthy();
    const createPayload = (await createResp.json()) as ApiEnvelope<{ id: string }>;
    const proposalId = createPayload.data.id;

    const invalidTransitionResp = await postWithRetry(
      request,
      `${apiRoot}/commercial-proposals/${proposalId}/status`,
      token,
      { status: 'ACTIVE' },
    );

    expect(invalidTransitionResp.ok()).toBeFalsy();
    expect([400, 409, 422, 429, 500]).toContain(invalidTransitionResp.status());
  });
});
