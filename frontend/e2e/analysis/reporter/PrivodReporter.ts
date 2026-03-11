import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/* ───────────────────────── Types ───────────────────────── */

interface TestRecord {
  name: string;
  file: string;
  module: string;
  testType: string; // smoke | crud | calculations | rbac | workflows | edge | ux
  duration: number;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  error?: string;
  screenshots: string[];
  retries: number;
  wasFlaky: boolean; // passed on retry
}

interface ModuleStats {
  module: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  avgDuration: number;
  slowest: { name: string; duration: number } | null;
}

interface ReportData {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  totalDuration: number;
  tests: TestRecord[];
  modules: ModuleStats[];
}

/* ─────────────── Module detection from file path ──────── */

const TEST_TYPE_DIRS = [
  'smoke',
  'crud',
  'calculations',
  'rbac',
  'workflows',
  'edge',
  'ux',
] as const;

/** All known PRIVOD modules — derived from navigation.ts (84 modules). */
const KNOWN_MODULES = [
  'dashboard', 'analytics', 'reports',
  'tasks',
  'calendar',
  'planning', 'gantt', 'evm', 'resources',
  'rfis', 'submittals', 'issues', 'workflows', 'approval', 'change-management',
  'projects', 'site-assessments', 'portfolio',
  'crm', 'counterparties', 'opportunities', 'tenders', 'bid-packages',
  'documents', 'cde', 'pto', 'russian-docs', 'data-exchange',
  'design',
  'exec-docs',
  'budgets', 'financial-models', 'commercial-proposals', 'invoices',
  'payments', 'cash-flow', 'accounting', 'execution-chain', 'revenue',
  'cost-management', 'contracts', 'finance',
  'specifications', 'competitive-lists', 'estimates', 'pricing',
  'procurement', 'warehouse', 'operations', 'dispatch',
  'employees', 'hr', 'crew', 'timesheets', 'leave',
  'safety', 'incidents', 'training',
  'quality', 'defects', 'punchlist', 'regulatory',
  'fleet', 'iot',
  'bim', 'daily-logs',
  'closeout', 'commissioning', 'warranty',
  'maintenance',
  'legal', 'insurance',
  'portal',
  'messaging', 'mail',
  'admin', 'users', 'permissions', 'support', 'settings', 'subscription',
];

function detectModule(filePath: string, testName: string): string {
  const normalised = filePath.replace(/\\/g, '/').toLowerCase();

  // Try to match a known module from the file path
  for (const mod of KNOWN_MODULES) {
    if (normalised.includes(`/${mod}`) || normalised.includes(`${mod}.spec`)) {
      return mod;
    }
  }

  // Fallback: extract from test name (first segment before " ")
  const firstWord = testName.split(/[\s→:]/)[0].toLowerCase();
  if (KNOWN_MODULES.includes(firstWord)) return firstWord;

  return 'unknown';
}

function detectTestType(filePath: string): string {
  const normalised = filePath.replace(/\\/g, '/').toLowerCase();
  for (const dir of TEST_TYPE_DIRS) {
    if (normalised.includes(`/${dir}/`)) return dir;
  }
  return 'other';
}

/* ─────────────────────── Reporter ─────────────────────── */

const REPORTS_DIR = path.resolve(__dirname, '../../reports');

class PrivodReporter implements Reporter {
  private tests: TestRecord[] = [];
  private startTime = 0;

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    // Ensure reports dir exists
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const filePath = test.location.file;
    const screenshots = result.attachments
      .filter((a) => a.contentType?.startsWith('image/'))
      .map((a) => a.path ?? a.name);

    const wasFlaky =
      result.status === 'passed' && result.retry > 0;

    this.tests.push({
      name: test.title,
      file: path.relative(process.cwd(), filePath),
      module: detectModule(filePath, test.title),
      testType: detectTestType(filePath),
      duration: result.duration,
      status: result.status,
      error: result.error?.message?.slice(0, 500),
      screenshots,
      retries: result.retry,
      wasFlaky,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const reportData = this.buildReportData(totalDuration);

    // Write all reports
    this.writeJsonReport(reportData);
    this.writeCoverageMatrix(reportData);
    this.writeImprovements(reportData);
  }

  /* ─────── Report data aggregation ─────── */

  private buildReportData(totalDuration: number): ReportData {
    const passed = this.tests.filter((t) => t.status === 'passed').length;
    const failed = this.tests.filter((t) => t.status === 'failed').length;
    const skipped = this.tests.filter((t) => t.status === 'skipped').length;
    const flaky = this.tests.filter((t) => t.wasFlaky).length;

    // Group by module
    const moduleMap = new Map<string, TestRecord[]>();
    for (const t of this.tests) {
      const arr = moduleMap.get(t.module) ?? [];
      arr.push(t);
      moduleMap.set(t.module, arr);
    }

    const modules: ModuleStats[] = [];
    for (const [mod, tests] of moduleMap) {
      const mPassed = tests.filter((t) => t.status === 'passed').length;
      const mFailed = tests.filter((t) => t.status === 'failed').length;
      const mSkipped = tests.filter((t) => t.status === 'skipped').length;
      const durations = tests.map((t) => t.duration);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const slowest = tests.reduce(
        (prev, cur) => (cur.duration > (prev?.duration ?? 0) ? cur : prev),
        tests[0],
      );
      modules.push({
        module: mod,
        total: tests.length,
        passed: mPassed,
        failed: mFailed,
        skipped: mSkipped,
        passRate: tests.length > 0 ? Math.round((mPassed / tests.length) * 100) : 0,
        avgDuration: Math.round(avg),
        slowest: slowest ? { name: slowest.name, duration: slowest.duration } : null,
      });
    }

    modules.sort((a, b) => a.module.localeCompare(b.module));

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.tests.length,
      passed,
      failed,
      skipped,
      flaky,
      totalDuration,
      tests: this.tests,
      modules,
    };
  }

  /* ─────── (a) test-results.json ─────── */

  private writeJsonReport(data: ReportData): void {
    const filePath = path.join(REPORTS_DIR, 'test-results.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /* ─────── (b) coverage-matrix.md ─────── */

  private writeCoverageMatrix(data: ReportData): void {
    const lines: string[] = [
      '# Coverage Matrix — Module × Test Type',
      '',
      `> Generated: ${data.timestamp}`,
      `> Total: ${data.totalTests} tests | ${data.passed} passed | ${data.failed} failed | ${data.skipped} skipped | ${data.flaky} flaky`,
      '',
    ];

    // Collect all test types present
    const testTypes = [...new Set(this.tests.map((t) => t.testType))].sort();

    // Header row
    lines.push(
      `| Module | ${testTypes.join(' | ')} | Total | Pass% |`,
    );
    lines.push(
      `|--------|${testTypes.map(() => '------').join('|')}|-------|-------|`,
    );

    // Data rows per module
    for (const mod of data.modules) {
      const modTests = this.tests.filter((t) => t.module === mod.module);
      const cells = testTypes.map((type) => {
        const typeTests = modTests.filter((t) => t.testType === type);
        if (typeTests.length === 0) return '—';
        const p = typeTests.filter((t) => t.status === 'passed').length;
        const f = typeTests.filter((t) => t.status === 'failed').length;
        if (f > 0) return `${p}/${typeTests.length} ❌`;
        return `${p}/${typeTests.length} ✅`;
      });

      lines.push(
        `| ${mod.module} | ${cells.join(' | ')} | ${mod.total} | ${mod.passRate}% |`,
      );
    }

    // Modules with NO coverage
    const testedModules = new Set(data.modules.map((m) => m.module));
    const untestedModules = KNOWN_MODULES.filter((m) => !testedModules.has(m));
    if (untestedModules.length > 0) {
      lines.push('');
      lines.push('## Untested Modules');
      lines.push('');
      for (const m of untestedModules) {
        lines.push(`- [ ] ${m}`);
      }
    }

    const filePath = path.join(REPORTS_DIR, 'coverage-matrix.md');
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  /* ─────── (c) improvements.md ─────── */

  private writeImprovements(data: ReportData): void {
    const lines: string[] = [
      '# Improvements Report',
      '',
      `> Generated: ${data.timestamp}`,
      `> Suite: ${data.totalTests} tests in ${(data.totalDuration / 1000).toFixed(1)}s`,
      '',
    ];

    // [CRITICAL] Failed tests
    const failed = this.tests.filter((t) => t.status === 'failed');
    lines.push('## [CRITICAL] Failed Tests');
    lines.push('');
    if (failed.length === 0) {
      lines.push('No failed tests. All green! ✅');
    } else {
      lines.push(`${failed.length} test(s) failed:`);
      lines.push('');
      for (const t of failed) {
        lines.push(`### ❌ ${t.name}`);
        lines.push(`- **File:** \`${t.file}\``);
        lines.push(`- **Module:** ${t.module}`);
        lines.push(`- **Duration:** ${t.duration}ms`);
        if (t.error) {
          lines.push(`- **Error:**`);
          lines.push('```');
          lines.push(t.error);
          lines.push('```');
        }
        if (t.screenshots.length > 0) {
          lines.push(`- **Screenshots:** ${t.screenshots.join(', ')}`);
        }
        lines.push('');
      }
    }
    lines.push('');

    // [MAJOR] Slow tests (>10s)
    const slow = this.tests
      .filter((t) => t.duration > 10_000 && t.status !== 'skipped')
      .sort((a, b) => b.duration - a.duration);
    lines.push('## [MAJOR] Slow Tests (>10s)');
    lines.push('');
    if (slow.length === 0) {
      lines.push('No slow tests detected. Performance is good. ✅');
    } else {
      lines.push(`${slow.length} test(s) exceeded 10s:`);
      lines.push('');
      lines.push('| Test | Module | Duration | File |');
      lines.push('|------|--------|----------|------|');
      for (const t of slow) {
        lines.push(
          `| ${t.name} | ${t.module} | ${(t.duration / 1000).toFixed(1)}s | \`${t.file}\` |`,
        );
      }
    }
    lines.push('');

    // [MINOR] Flaky tests (passed on retry)
    const flaky = this.tests.filter((t) => t.wasFlaky);
    lines.push('## [MINOR] Flaky Tests (passed on retry)');
    lines.push('');
    if (flaky.length === 0) {
      lines.push('No flaky tests detected. Stability is solid. ✅');
    } else {
      lines.push(`${flaky.length} test(s) were flaky:`);
      lines.push('');
      for (const t of flaky) {
        lines.push(`- **${t.name}** (${t.module}) — ${t.retries} retry(ies), file: \`${t.file}\``);
      }
    }
    lines.push('');

    // [MISSING] Modules with no test coverage
    const testedModules = new Set(data.modules.map((m) => m.module));
    const untestedModules = KNOWN_MODULES.filter((m) => !testedModules.has(m));
    lines.push('## [MISSING] Modules Without Test Coverage');
    lines.push('');
    if (untestedModules.length === 0) {
      lines.push('All modules have test coverage. ✅');
    } else {
      lines.push(`${untestedModules.length} module(s) have no E2E tests:`);
      lines.push('');
      for (const m of untestedModules) {
        lines.push(`- [ ] **${m}** — needs at least smoke test`);
      }
    }
    lines.push('');

    // [UX] Console errors, broken layouts, missing i18n
    const testsWithConsoleErrors = this.tests.filter(
      (t) => t.error && /console\.error|uncaught|unhandled/i.test(t.error),
    );
    const testsWithI18nIssues = this.tests.filter(
      (t) => t.error && /i18n|translation|t\(|missing key/i.test(t.error),
    );
    lines.push('## [UX] Console Errors, Layout Issues, Missing i18n');
    lines.push('');
    if (testsWithConsoleErrors.length === 0 && testsWithI18nIssues.length === 0) {
      lines.push('No UX issues detected during test run. ✅');
    } else {
      if (testsWithConsoleErrors.length > 0) {
        lines.push(`### Console errors (${testsWithConsoleErrors.length})`);
        for (const t of testsWithConsoleErrors) {
          lines.push(`- **${t.name}** (${t.module}): ${t.error?.slice(0, 200)}`);
        }
        lines.push('');
      }
      if (testsWithI18nIssues.length > 0) {
        lines.push(`### i18n issues (${testsWithI18nIssues.length})`);
        for (const t of testsWithI18nIssues) {
          lines.push(`- **${t.name}** (${t.module}): ${t.error?.slice(0, 200)}`);
        }
      }
    }
    lines.push('');

    // Summary
    lines.push('---');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(`| Metric | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total tests | ${data.totalTests} |`);
    lines.push(`| Passed | ${data.passed} |`);
    lines.push(`| Failed | ${data.failed} |`);
    lines.push(`| Skipped | ${data.skipped} |`);
    lines.push(`| Flaky | ${data.flaky} |`);
    lines.push(`| Untested modules | ${untestedModules.length} |`);
    lines.push(`| Slow tests (>10s) | ${slow.length} |`);
    lines.push(`| Total duration | ${(data.totalDuration / 1000).toFixed(1)}s |`);
    lines.push('');

    const filePath = path.join(REPORTS_DIR, 'improvements.md');
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }
}

export default PrivodReporter;
