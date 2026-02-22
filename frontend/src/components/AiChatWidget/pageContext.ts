import { t } from '@/i18n';
import type { PageContext, LiveData } from './types';

// ---------------------------------------------------------------------------
// Context mapping — knows what the user is doing on each page
// ---------------------------------------------------------------------------

export const getPageContext = (pathname: string): PageContext => {
  const patterns: [RegExp, string, string, string][] = [
    [
      /^\/projects\/[^/]+\/edit/,
      t('aiChat.context.projectEdit.title'),
      t('aiChat.context.projectEdit.hint'),
      t('aiChat.context.projectEdit.description'),
    ],
    [
      /^\/projects\/[^/]+/,
      t('aiChat.context.projectCard.title'),
      t('aiChat.context.projectCard.hint'),
      t('aiChat.context.projectCard.description'),
    ],
    [
      /^\/projects$/,
      t('aiChat.context.projectList.title'),
      t('aiChat.context.projectList.hint'),
      t('aiChat.context.projectList.description'),
    ],
    [
      /^\/contracts\/[^/]+\/edit/,
      t('aiChat.context.contractEdit.title'),
      t('aiChat.context.contractEdit.hint'),
      t('aiChat.context.contractEdit.description'),
    ],
    [
      /^\/contracts\/[^/]+/,
      t('aiChat.context.contractCard.title'),
      t('aiChat.context.contractCard.hint'),
      t('aiChat.context.contractCard.description'),
    ],
    [
      /^\/contracts$/,
      t('aiChat.context.contractList.title'),
      t('aiChat.context.contractList.hint'),
      t('aiChat.context.contractList.description'),
    ],
    [
      /^\/budgets\/[^/]+\/edit/,
      t('aiChat.context.budgetEdit.title'),
      t('aiChat.context.budgetEdit.hint'),
      t('aiChat.context.budgetEdit.description'),
    ],
    [
      /^\/budgets\/[^/]+/,
      t('aiChat.context.budgetCard.title'),
      t('aiChat.context.budgetCard.hint'),
      t('aiChat.context.budgetCard.description'),
    ],
    [
      /^\/budgets$/,
      t('aiChat.context.budgetList.title'),
      t('aiChat.context.budgetList.hint'),
      t('aiChat.context.budgetList.description'),
    ],
    [
      /^\/estimates\/[^/]+\/edit/,
      t('aiChat.context.estimateEdit.title'),
      t('aiChat.context.estimateEdit.hint'),
      t('aiChat.context.estimateEdit.description'),
    ],
    [
      /^\/estimates\/[^/]+/,
      t('aiChat.context.estimateCard.title'),
      t('aiChat.context.estimateCard.hint'),
      t('aiChat.context.estimateCard.description'),
    ],
    [
      /^\/estimates$/,
      t('aiChat.context.estimateList.title'),
      t('aiChat.context.estimateList.hint'),
      t('aiChat.context.estimateList.description'),
    ],
    [
      /^\/specifications\/[^/]+/,
      t('aiChat.context.specificationCard.title'),
      t('aiChat.context.specificationCard.hint'),
      t('aiChat.context.specificationCard.description'),
    ],
    [
      /^\/specifications$/,
      t('aiChat.context.specificationList.title'),
      t('aiChat.context.specificationList.hint'),
      t('aiChat.context.specificationList.description'),
    ],
    [
      /^\/invoices\/[^/]+/,
      t('aiChat.context.invoiceCard.title'),
      t('aiChat.context.invoiceCard.hint'),
      t('aiChat.context.invoiceCard.description'),
    ],
    [
      /^\/invoices$/,
      t('aiChat.context.invoiceList.title'),
      t('aiChat.context.invoiceList.hint'),
      t('aiChat.context.invoiceList.description'),
    ],
    [
      /^\/payments\/[^/]+/,
      t('aiChat.context.paymentCard.title'),
      t('aiChat.context.paymentCard.hint'),
      t('aiChat.context.paymentCard.description'),
    ],
    [
      /^\/payments$/,
      t('aiChat.context.paymentList.title'),
      t('aiChat.context.paymentList.hint'),
      t('aiChat.context.paymentList.description'),
    ],
    [
      /^\/procurement/,
      t('aiChat.context.procurement.title'),
      t('aiChat.context.procurement.hint'),
      t('aiChat.context.procurement.description'),
    ],
    [
      /^\/russian-docs/,
      t('aiChat.context.russianDocs.title'),
      t('aiChat.context.russianDocs.hint'),
      t('aiChat.context.russianDocs.description'),
    ],
    [
      /^\/warehouse/,
      t('aiChat.context.warehouse.title'),
      t('aiChat.context.warehouse.hint'),
      t('aiChat.context.warehouse.description'),
    ],
    [
      /^\/hr/,
      t('aiChat.context.hr.title'),
      t('aiChat.context.hr.hint'),
      t('aiChat.context.hr.description'),
    ],
    [
      /^\/analytics/,
      t('aiChat.context.analytics.title'),
      t('aiChat.context.analytics.hint'),
      t('aiChat.context.analytics.description'),
    ],
    [
      /^\/$/,
      t('aiChat.context.dashboard.title'),
      t('aiChat.context.dashboard.hint'),
      t('aiChat.context.dashboard.description'),
    ],
  ];

  for (const [pattern, section, hint, systemContext] of patterns) {
    if (pattern.test(pathname)) {
      return { section, hint, systemContext };
    }
  }

  return {
    section: t('aiChat.context.fallback.title'),
    hint: t('aiChat.context.fallback.hint'),
    systemContext: t('aiChat.context.fallback.description'),
  };
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export function serializeLiveData(data: LiveData): string {
  if (!data) return '';
  const json = JSON.stringify(data, null, 2);
  if (json.length > 3000) return json.slice(0, 3000) + '\n' + t('aiChat.context.dataTruncated');
  return json;
}

export const buildSystemPrompt = (pageContext: PageContext, pathname: string, liveData?: LiveData): string => `${t('aiChat.context.systemPrompt')}

${t('aiChat.context.financialCycle')}

${t('aiChat.context.currentContextLabel')}
${t('aiChat.context.userOnPage', { section: pageContext.section })}
${pageContext.systemContext}
${liveData ? `\n${t('aiChat.context.liveDataLabel')}\n\`\`\`json\n${serializeLiveData(liveData)}\n\`\`\`\n${t('aiChat.context.liveDataInstruction')}` : ''}

${t('aiChat.context.capabilitiesLabel')}
- ${t('aiChat.context.capTasks')}
- ${t('aiChat.context.capContracts')}
- ${t('aiChat.context.capBudgets')}
- ${t('aiChat.context.capInvoices')}
- ${t('aiChat.context.capPayments')}
- ${t('aiChat.context.capProcurement')}
- ${t('aiChat.context.capEmployees')}
- ${t('aiChat.context.capWarehouse')}
- ${t('aiChat.context.capTransport')}
- ${t('aiChat.context.capProjects')}

${t('aiChat.context.rulesLabel')}
- ${t('aiChat.context.ruleFriendly')}
- ${t('aiChat.context.ruleLists')}
- ${t('aiChat.context.ruleNoTech')}
- ${t('aiChat.context.ruleNoLocation')}
- ${t('aiChat.context.ruleNoIntro')}
- ${t('aiChat.context.ruleDefaults')}`;
