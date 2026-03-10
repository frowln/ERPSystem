import React, { useState, useEffect } from 'react';
import {
  Code2,
  Key,
  Server,
  AlertCircle,
  Book,
  Copy,
  Check,
  Webhook,
  Terminal,
  Heart,
  Gauge,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------------- */
/*  Table of contents sections                                                 */
/* -------------------------------------------------------------------------- */
const TOC_SECTIONS = [
  { id: 'overview', icon: Server },
  { id: 'auth', icon: Key },
  { id: 'rateLimiting', icon: Gauge },
  { id: 'pagination', icon: Book },
  { id: 'errors', icon: AlertCircle },
  { id: 'endpoints', icon: Code2 },
  { id: 'health', icon: Heart },
  { id: 'webhooks', icon: Webhook },
  { id: 'sdk', icon: Terminal },
] as const;

type SectionId = (typeof TOC_SECTIONS)[number]['id'];

/* -------------------------------------------------------------------------- */
/*  Code block with copy button                                                */
/* -------------------------------------------------------------------------- */
const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'bash' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
      {lang && (
        <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 font-mono border-b border-neutral-200 dark:border-neutral-700">
          {lang}
        </div>
      )}
      <pre className="p-4 bg-neutral-50 dark:bg-neutral-900 overflow-x-auto text-sm leading-relaxed">
        <code className="text-neutral-800 dark:text-neutral-200 font-mono whitespace-pre">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-200/80 dark:bg-neutral-700/80 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        title={t('common.copyToClipboard')}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  HTTP method badge                                                          */
/* -------------------------------------------------------------------------- */
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };

  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-bold font-mono', colors[method] ?? 'bg-neutral-100 text-neutral-700')}>
      {method}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*  Endpoint row                                                               */
/* -------------------------------------------------------------------------- */
const EndpointRow: React.FC<{ method: string; path: string; description: string }> = ({ method, path, description }) => (
  <tr className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <td className="py-2.5 pr-3 whitespace-nowrap"><MethodBadge method={method} /></td>
    <td className="py-2.5 pr-3 font-mono text-sm text-neutral-800 dark:text-neutral-200 whitespace-nowrap">{path}</td>
    <td className="py-2.5 text-sm text-neutral-600 dark:text-neutral-400">{description}</td>
  </tr>
);

/* -------------------------------------------------------------------------- */
/*  Error code row                                                             */
/* -------------------------------------------------------------------------- */
const ErrorRow: React.FC<{ code: number; title: string; description: string }> = ({ code, title, description }) => (
  <tr className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <td className="py-2.5 pr-3 font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">{code}</td>
    <td className="py-2.5 pr-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">{title}</td>
    <td className="py-2.5 text-sm text-neutral-600 dark:text-neutral-400">{description}</td>
  </tr>
);

/* -------------------------------------------------------------------------- */
/*  Section heading                                                            */
/* -------------------------------------------------------------------------- */
const SectionHeading: React.FC<{ id: string; icon: React.ElementType; iconBg: string; iconColor: string; title: string }> = ({
  id, icon: Icon, iconBg, iconColor, title,
}) => (
  <div id={id} className="flex items-center gap-3 mb-6 scroll-mt-24">
    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
      <Icon size={20} className={iconColor} />
    </div>
    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{title}</h2>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Endpoint group                                                             */
/* -------------------------------------------------------------------------- */
const EndpointGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <>
    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{title}</h3>
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-left">
        <tbody>{children}</tbody>
      </table>
    </div>
  </>
);

/* -------------------------------------------------------------------------- */
/*  Main page component                                                        */
/* -------------------------------------------------------------------------- */
const ApiDocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  /* Track scroll position to highlight active TOC entry */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 },
    );

    for (const s of TOC_SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('apiDocs.pageTitle')}
        subtitle={t('apiDocs.pageSubtitle')}
        breadcrumbs={[
          { label: t('nav.admin'), href: '/admin/dashboard' },
          { label: t('apiDocs.pageTitle') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a href="/api-docs" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" iconLeft={<Code2 size={16} />}>
                OpenAPI JSON
              </Button>
            </a>
            <a href="/swagger-ui" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" iconLeft={<ExternalLink size={16} />}>
                Swagger UI
              </Button>
            </a>
          </div>
        }
      />

      <div className="flex gap-8 mt-6">
        {/* ---- Sidebar TOC ---- */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-28">
            <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
              {t('apiDocs.tableOfContents')}
            </h3>
            <nav className="space-y-1">
              {TOC_SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                    )}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {t(`apiDocs.toc.${s.id}` as any)}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ---- Main content ---- */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* === Overview === */}
          <section id="overview" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Server}
              iconBg="bg-primary-100 dark:bg-primary-900/40"
              iconColor="text-primary-600 dark:text-primary-400"
              title={t('apiDocs.overview.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.overview.description')}</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('apiDocs.overview.baseUrl')}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">https://api.privod.ru/api</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('apiDocs.overview.version')}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">v1.0.0</p>
              </div>
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('apiDocs.overview.rateLimit')}</p>
                <p className="font-mono text-sm text-neutral-800 dark:text-neutral-200">600 {t('apiDocs.overview.reqPerMin')}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
              <p className="text-sm text-warning-800 dark:text-warning-300">
                <strong>{t('apiDocs.overview.formatNote')}:</strong> {t('apiDocs.overview.formatDescription')}
              </p>
            </div>
          </section>

          {/* === Authentication === */}
          <section id="auth" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Key}
              iconBg="bg-emerald-100 dark:bg-emerald-900/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
              title={t('apiDocs.auth.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.auth.description')}</p>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.auth.loginFlow')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.auth.loginDescription')}</p>
            <CodeBlock lang="bash" code={`curl -X POST https://api.privod.ru/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@company.ru",
    "password": "your-password"
  }'`} />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 mb-6">{t('apiDocs.auth.loginResponse')}</p>
            <CodeBlock lang="json" code={`{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@company.ru",
    "fullName": "Иванов Иван Иванович",
    "role": "MANAGER"
  }
}`} />

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-8 mb-3">{t('apiDocs.auth.usingToken')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.auth.usingTokenDescription')}</p>
            <CodeBlock lang="bash" code={`curl https://api.privod.ru/api/projects \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`} />

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-8 mb-3">{t('apiDocs.auth.refreshFlow')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.auth.refreshDescription')}</p>
            <CodeBlock lang="bash" code={`curl -X POST https://api.privod.ru/api/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }'`} />

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-8 mb-3">{t('apiDocs.auth.twoFactor')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.auth.twoFactorDescription')}</p>
            <CodeBlock lang="bash" code={`curl -X POST https://api.privod.ru/api/auth/2fa/verify \\
  -H "Content-Type: application/json" \\
  -d '{ "tempToken": "...", "code": "123456" }'`} />
          </section>

          {/* === Rate Limiting === */}
          <section id="rateLimiting" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Gauge}
              iconBg="bg-orange-100 dark:bg-orange-900/40"
              iconColor="text-orange-600 dark:text-orange-400"
              title={t('apiDocs.rateLimiting.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.rateLimiting.description')}</p>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.rateLimiting.currentLimits')}</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.rateLimiting.tier')}</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.rateLimiting.limit')}</th>
                    <th className="py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.rateLimiting.window')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-medium text-neutral-800 dark:text-neutral-200">{t('apiDocs.rateLimiting.standard')}</td>
                    <td className="py-2.5 pr-4 font-mono text-neutral-600 dark:text-neutral-400">600</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.windowMinute')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-medium text-neutral-800 dark:text-neutral-200">{t('apiDocs.rateLimiting.burst')}</td>
                    <td className="py-2.5 pr-4 font-mono text-neutral-600 dark:text-neutral-400">30</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.windowSecond')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.rateLimiting.headersTitle')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.rateLimiting.headersDescription')}</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.rateLimiting.headerName')}</th>
                    <th className="py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('common.description')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">X-RateLimit-Limit</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.xLimitHeader')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">X-RateLimit-Remaining</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.xRemainingHeader')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">X-RateLimit-Reset</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.xResetHeader')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">Retry-After</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.rateLimiting.retryAfterHeader')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.rateLimiting.retryTitle')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.rateLimiting.retryDescription')}</p>
            <CodeBlock lang="javascript" code={`async function requestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '1';
      const delay = parseInt(retryAfter, 10) * 1000;
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay + jitter));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}`} />
          </section>

          {/* === Pagination === */}
          <section id="pagination" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Book}
              iconBg="bg-violet-100 dark:bg-violet-900/40"
              iconColor="text-violet-600 dark:text-violet-400"
              title={t('apiDocs.pagination.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.pagination.description')}</p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.pagination.param')}</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.pagination.type')}</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.pagination.default')}</th>
                    <th className="py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('common.description')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">page</td>
                    <td className="py-2.5 pr-4 text-neutral-600 dark:text-neutral-400">integer</td>
                    <td className="py-2.5 pr-4 font-mono text-neutral-600 dark:text-neutral-400">0</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.pagination.pageDesc')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">size</td>
                    <td className="py-2.5 pr-4 text-neutral-600 dark:text-neutral-400">integer</td>
                    <td className="py-2.5 pr-4 font-mono text-neutral-600 dark:text-neutral-400">20</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.pagination.sizeDesc')}</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-4 font-mono text-neutral-800 dark:text-neutral-200">sort</td>
                    <td className="py-2.5 pr-4 text-neutral-600 dark:text-neutral-400">string</td>
                    <td className="py-2.5 pr-4 font-mono text-neutral-600 dark:text-neutral-400">id,asc</td>
                    <td className="py-2.5 text-neutral-600 dark:text-neutral-400">{t('apiDocs.pagination.sortDesc')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock lang="bash" code={"curl 'https://api.privod.ru/api/projects?page=0&size=10&sort=name,asc' \\\n  -H \"Authorization: Bearer <token>\""} />

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 mb-3">{t('apiDocs.pagination.responseFormat')}</p>
            <CodeBlock lang="json" code={`{
  "content": [ ... ],
  "totalElements": 42,
  "totalPages": 5,
  "number": 0,
  "size": 10,
  "first": true,
  "last": false
}`} />
          </section>

          {/* === Error codes === */}
          <section id="errors" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={AlertCircle}
              iconBg="bg-danger-100 dark:bg-danger-900/40"
              iconColor="text-danger-600 dark:text-danger-400"
              title={t('apiDocs.errors.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.errors.description')}</p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.errors.code')}</th>
                    <th className="py-2 pr-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('apiDocs.errors.status')}</th>
                    <th className="py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('common.description')}</th>
                  </tr>
                </thead>
                <tbody>
                  <ErrorRow code={400} title="Bad Request" description={t('apiDocs.errors.e400')} />
                  <ErrorRow code={401} title="Unauthorized" description={t('apiDocs.errors.e401')} />
                  <ErrorRow code={403} title="Forbidden" description={t('apiDocs.errors.e403')} />
                  <ErrorRow code={404} title="Not Found" description={t('apiDocs.errors.e404')} />
                  <ErrorRow code={409} title="Conflict" description={t('apiDocs.errors.e409')} />
                  <ErrorRow code={422} title="Unprocessable Entity" description={t('apiDocs.errors.e422')} />
                  <ErrorRow code={429} title="Too Many Requests" description={t('apiDocs.errors.e429')} />
                  <ErrorRow code={500} title="Internal Server Error" description={t('apiDocs.errors.e500')} />
                </tbody>
              </table>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('apiDocs.errors.format')}</p>
            <CodeBlock lang="json" code={`{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Поле 'email' обязательно для заполнения",
  "timestamp": "2026-03-08T12:00:00Z"
}`} />
          </section>

          {/* === Endpoints === */}
          <section id="endpoints" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Code2}
              iconBg="bg-primary-100 dark:bg-primary-900/40"
              iconColor="text-primary-600 dark:text-primary-400"
              title={t('apiDocs.endpoints.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">{t('apiDocs.endpoints.description')}</p>

            {/* -- Projects -- */}
            <EndpointGroup title={t('apiDocs.endpoints.projects')}>
              <EndpointRow method="GET" path="/api/projects" description={t('apiDocs.endpoints.projectsList')} />
              <EndpointRow method="GET" path="/api/projects/{id}" description={t('apiDocs.endpoints.projectsGet')} />
              <EndpointRow method="POST" path="/api/projects" description={t('apiDocs.endpoints.projectsCreate')} />
              <EndpointRow method="PUT" path="/api/projects/{id}" description={t('apiDocs.endpoints.projectsUpdate')} />
              <EndpointRow method="DELETE" path="/api/projects/{id}" description={t('apiDocs.endpoints.projectsDelete')} />
              <EndpointRow method="GET" path="/api/projects/{id}/dashboard" description={t('apiDocs.endpoints.projectsDashboard')} />
            </EndpointGroup>

            {/* -- Tasks -- */}
            <EndpointGroup title={t('apiDocs.endpoints.tasks')}>
              <EndpointRow method="GET" path="/api/projects/{projectId}/tasks" description={t('apiDocs.endpoints.tasksList')} />
              <EndpointRow method="POST" path="/api/projects/{projectId}/tasks" description={t('apiDocs.endpoints.tasksCreate')} />
              <EndpointRow method="PUT" path="/api/tasks/{id}" description={t('apiDocs.endpoints.tasksUpdate')} />
              <EndpointRow method="PATCH" path="/api/tasks/{id}/status" description={t('apiDocs.endpoints.tasksStatus')} />
              <EndpointRow method="DELETE" path="/api/tasks/{id}" description={t('apiDocs.endpoints.tasksDelete')} />
              <EndpointRow method="GET" path="/api/tasks/my" description={t('apiDocs.endpoints.tasksMy')} />
            </EndpointGroup>

            {/* -- Finance -- */}
            <EndpointGroup title={t('apiDocs.endpoints.finance')}>
              <EndpointRow method="GET" path="/api/budgets" description={t('apiDocs.endpoints.budgetsList')} />
              <EndpointRow method="POST" path="/api/budgets" description={t('apiDocs.endpoints.budgetsCreate')} />
              <EndpointRow method="GET" path="/api/budgets/{id}" description={t('apiDocs.endpoints.budgetsGet')} />
              <EndpointRow method="GET" path="/api/invoices" description={t('apiDocs.endpoints.invoicesList')} />
              <EndpointRow method="POST" path="/api/invoices" description={t('apiDocs.endpoints.invoicesCreate')} />
            </EndpointGroup>

            {/* -- Estimates -- */}
            <EndpointGroup title={t('apiDocs.endpoints.estimates')}>
              <EndpointRow method="GET" path="/api/estimates" description={t('apiDocs.endpoints.estimatesList')} />
              <EndpointRow method="POST" path="/api/estimates" description={t('apiDocs.endpoints.estimatesCreate')} />
              <EndpointRow method="GET" path="/api/estimates/{id}" description={t('apiDocs.endpoints.estimatesGet')} />
              <EndpointRow method="GET" path="/api/estimates/{id}/items" description={t('apiDocs.endpoints.estimatesItems')} />
            </EndpointGroup>

            {/* -- Specifications -- */}
            <EndpointGroup title={t('apiDocs.endpoints.specifications')}>
              <EndpointRow method="GET" path="/api/specifications" description={t('apiDocs.endpoints.specificationsList')} />
              <EndpointRow method="POST" path="/api/specifications" description={t('apiDocs.endpoints.specificationsCreate')} />
              <EndpointRow method="GET" path="/api/specifications/{id}" description={t('apiDocs.endpoints.specificationsGet')} />
              <EndpointRow method="POST" path="/api/specifications/{id}/items" description={t('apiDocs.endpoints.specificationsAddItems')} />
            </EndpointGroup>

            {/* -- CRM -- */}
            <EndpointGroup title={t('apiDocs.endpoints.crm')}>
              <EndpointRow method="GET" path="/api/crm/leads" description={t('apiDocs.endpoints.crmList')} />
              <EndpointRow method="POST" path="/api/crm/leads" description={t('apiDocs.endpoints.crmCreate')} />
              <EndpointRow method="GET" path="/api/crm/leads/{id}" description={t('apiDocs.endpoints.crmGet')} />
              <EndpointRow method="PATCH" path="/api/crm/leads/{id}/status" description={t('apiDocs.endpoints.crmStatus')} />
              <EndpointRow method="POST" path="/api/crm/leads/{id}/convert" description={t('apiDocs.endpoints.crmConvert')} />
            </EndpointGroup>

            {/* -- Contracts -- */}
            <EndpointGroup title={t('apiDocs.endpoints.contracts')}>
              <EndpointRow method="GET" path="/api/contracts" description={t('apiDocs.endpoints.contractsList')} />
              <EndpointRow method="POST" path="/api/contracts" description={t('apiDocs.endpoints.contractsCreate')} />
              <EndpointRow method="GET" path="/api/contracts/{id}" description={t('apiDocs.endpoints.contractsGet')} />
            </EndpointGroup>

            {/* -- Safety -- */}
            <EndpointGroup title={t('apiDocs.endpoints.safety')}>
              <EndpointRow method="GET" path="/api/safety/incidents" description={t('apiDocs.endpoints.safetyIncidentsList')} />
              <EndpointRow method="POST" path="/api/safety/incidents" description={t('apiDocs.endpoints.safetyIncidentsCreate')} />
              <EndpointRow method="GET" path="/api/safety/trainings" description={t('apiDocs.endpoints.safetyTrainingsList')} />
            </EndpointGroup>

            {/* -- Procurement -- */}
            <EndpointGroup title={t('apiDocs.endpoints.procurement')}>
              <EndpointRow method="GET" path="/api/purchase-requests" description={t('apiDocs.endpoints.procurementList')} />
              <EndpointRow method="POST" path="/api/purchase-requests" description={t('apiDocs.endpoints.procurementCreate')} />
              <EndpointRow method="GET" path="/api/purchase-requests/{id}" description={t('apiDocs.endpoints.procurementGet')} />
            </EndpointGroup>

            {/* -- Documents -- */}
            <EndpointGroup title={t('apiDocs.endpoints.documents')}>
              <EndpointRow method="GET" path="/api/documents" description={t('apiDocs.endpoints.documentsList')} />
              <EndpointRow method="POST" path="/api/documents/upload" description={t('apiDocs.endpoints.documentsUpload')} />
              <EndpointRow method="GET" path="/api/documents/{id}/download" description={t('apiDocs.endpoints.documentsDownload')} />
              <EndpointRow method="DELETE" path="/api/documents/{id}" description={t('apiDocs.endpoints.documentsDelete')} />
            </EndpointGroup>

            {/* -- Users -- */}
            <EndpointGroup title={t('apiDocs.endpoints.users')}>
              <EndpointRow method="GET" path="/api/users" description={t('apiDocs.endpoints.usersList')} />
              <EndpointRow method="GET" path="/api/users/me" description={t('apiDocs.endpoints.usersMe')} />
              <EndpointRow method="PUT" path="/api/users/{id}" description={t('apiDocs.endpoints.usersUpdate')} />
              <EndpointRow method="PATCH" path="/api/users/{id}/role" description={t('apiDocs.endpoints.usersRole')} />
            </EndpointGroup>

            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-primary-800 dark:text-primary-300">
                {t('apiDocs.endpoints.fullListNote')}{' '}
                <a href="/swagger-ui" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Swagger UI
                </a>
              </p>
            </div>
          </section>

          {/* === Health Checks === */}
          <section id="health" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Heart}
              iconBg="bg-success-100 dark:bg-success-900/40"
              iconColor="text-success-600 dark:text-success-400"
              title={t('apiDocs.health.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.health.description')}</p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left">
                <tbody>
                  <EndpointRow method="GET" path="/api/health" description={t('apiDocs.health.main')} />
                  <EndpointRow method="GET" path="/api/health/ready" description={t('apiDocs.health.ready')} />
                  <EndpointRow method="GET" path="/api/health/live" description={t('apiDocs.health.live')} />
                  <EndpointRow method="GET" path="/api/health/status" description={t('apiDocs.health.status')} />
                </tbody>
              </table>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('apiDocs.health.responseExample')}</p>
            <CodeBlock lang="json" code={`{
  "status": "UP",
  "version": "1.0.0",
  "timestamp": "2026-03-08T12:00:00Z",
  "details": {
    "database": "UP",
    "redis": "UP",
    "minio": "UP",
    "uptime": 86400
  }
}`} />

            <div className="mt-4 p-4 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
              <p className="text-sm text-success-800 dark:text-success-300">
                {t('apiDocs.health.noAuthNote')}
              </p>
            </div>
          </section>

          {/* === Webhooks === */}
          <section id="webhooks" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Webhook}
              iconBg="bg-orange-100 dark:bg-orange-900/40"
              iconColor="text-orange-600 dark:text-orange-400"
              title={t('apiDocs.webhooks.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.webhooks.description')}</p>

            {/* Outgoing webhooks */}
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.webhooks.outgoingTitle')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.webhooks.outgoingDescription')}</p>

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('apiDocs.webhooks.eventsTitle')}</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {['project.created', 'task.updated', 'task.completed', 'invoice.created', 'document.uploaded', 'defect.created', 'budget.updated'].map((ev) => (
                <span key={ev} className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                  {ev}
                </span>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('apiDocs.webhooks.payloadTitle')}</h4>
            <CodeBlock lang="json" code={`{
  "event": "task.completed",
  "timestamp": "2026-03-10T14:30:00Z",
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "Монтаж опалубки",
    "status": "DONE",
    "completedAt": "2026-03-10T14:30:00Z"
  }
}`} />

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 mt-6">{t('apiDocs.webhooks.hmacTitle')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.webhooks.hmacDescription')}</p>
            <CodeBlock lang="javascript" code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Проверка в обработчике:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) return res.status(401).send('Invalid signature');
  // Обработка события...
  res.status(200).send('OK');
});`} />

            {/* YooKassa */}
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-10 mb-3">{t('apiDocs.webhooks.yookassaTitle')}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t('apiDocs.webhooks.yookassaDescription')}</p>
            <CodeBlock lang="json" code={`{
  "type": "notification",
  "event": "payment.succeeded",
  "object": {
    "id": "2a5b6c7d-...",
    "status": "succeeded",
    "amount": {
      "value": "15000.00",
      "currency": "RUB"
    },
    "description": "Подписка Привод — Профессиональный",
    "metadata": {
      "organizationId": "uuid",
      "planId": "professional"
    }
  }
}`} />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">
              {t('apiDocs.webhooks.endpointLabel')}: <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono">POST /api/payments/webhook/yookassa</code>
            </p>
          </section>

          {/* === SDK & Examples === */}
          <section id="sdk" className="scroll-mt-24">
            <SectionHeading
              id=""
              icon={Terminal}
              iconBg="bg-cyan-100 dark:bg-cyan-900/40"
              iconColor="text-cyan-600 dark:text-cyan-400"
              title={t('apiDocs.sdk.title')}
            />
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">{t('apiDocs.sdk.description')}</p>

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('apiDocs.sdk.curlExamples')}</h3>

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 mt-4">{t('apiDocs.sdk.exGetProjects')}</h4>
            <CodeBlock lang="bash" code={`curl -s https://api.privod.ru/api/projects \\
  -H "Authorization: Bearer $TOKEN" | jq .`} />

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 mt-6">{t('apiDocs.sdk.exCreateTask')}</h4>
            <CodeBlock lang="bash" code={`curl -X POST https://api.privod.ru/api/projects/{projectId}/tasks \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Проверка фундамента",
    "description": "Выполнить проверку фундамента блока А",
    "assigneeId": "uuid",
    "priority": "HIGH",
    "dueDate": "2026-04-01"
  }'`} />

            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 mt-6">{t('apiDocs.sdk.exUploadDoc')}</h4>
            <CodeBlock lang="bash" code={`curl -X POST https://api.privod.ru/api/documents/upload \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@/path/to/document.pdf" \\
  -F "projectId=uuid" \\
  -F "type=DRAWING"`} />

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mt-8 mb-3">{t('apiDocs.sdk.jsExample')}</h3>
            <CodeBlock lang="javascript" code={`// Пример на JavaScript (fetch)
const API_BASE = 'https://api.privod.ru/api';

async function getProjects(token) {
  const response = await fetch(\`\${API_BASE}/projects?page=0&size=20\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

async function createDefect(token, projectId, data) {
  const response = await fetch(\`\${API_BASE}/projects/\${projectId}/defects\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}`} />

            <div className="mt-8 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">{t('apiDocs.sdk.swaggerLink')}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{t('apiDocs.sdk.swaggerDescription')}</p>
              <a
                href="/swagger-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Code2 size={16} />
                {t('apiDocs.sdk.openSwagger')}
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPage;
