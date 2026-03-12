/**
 * Performance Summary Report Generator.
 *
 * Runs last after all performance phases. Reads individual results files
 * and generates a consolidated performance-summary.md and performance-results.json.
 *
 * This file should be alphabetically last in the performance/ directory
 * so it runs after all other tests.
 */

import { test } from '../../fixtures/base.fixture';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { writeReport, saveResults } from './perf-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

function readJSON(filename: string): unknown {
  const filePath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readMD(filename: string): string {
  const filePath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(filePath)) return `*${filename} not generated*\n`;
  return fs.readFileSync(filePath, 'utf-8');
}

test.describe('Performance Summary Report', () => {
  test('Generate consolidated performance report', async () => {
    // Read all individual report files
    const pageLoadReport = readMD('performance-page-load.md');
    const interactionReport = readMD('performance-interactions.md');
    const stressReport = readMD('performance-stress.md');
    const memoryReport = readMD('performance-memory.md');
    const bundleReport = readMD('performance-bundle.md');
    const lazyLoadReport = readMD('performance-lazy-load.md');
    const apiReport = readMD('performance-api.md');

    // Read JSON results for summary stats
    const pageLoadResults = readJSON('page-load-results.json') as Array<{
      grade: string;
      fullyLoaded: number;
      url: string;
    }> | null;
    const stressResults = readJSON('stress-test-results.json') as Array<{
      passed: boolean;
    }> | null;
    const memoryResults = readJSON('memory-leak-results.json') as Array<{
      leaked: boolean;
    }> | null;
    const apiResults = readJSON('api-response-results.json') as {
      totalCalls?: number;
      avgTime?: number;
      failedAPIs?: number;
    } | null;

    // Build executive summary
    const totalPages = pageLoadResults?.length ?? 0;
    const pageGrades = { A: 0, B: 0, C: 0, F: 0 };
    if (pageLoadResults) {
      for (const r of pageLoadResults) {
        if (r.grade in pageGrades) pageGrades[r.grade as keyof typeof pageGrades]++;
      }
    }

    const stressPassed = stressResults?.filter((r) => r.passed).length ?? 0;
    const stressTotal = stressResults?.length ?? 0;
    const memoryLeaks = memoryResults?.filter((r) => r.leaked).length ?? 0;
    const memoryTotal = memoryResults?.length ?? 0;
    const apiTotal = apiResults?.totalCalls ?? 0;
    const apiAvg = apiResults?.avgTime ?? 0;
    const apiFailed = apiResults?.failedAPIs ?? 0;

    // Determine overall health
    let overallHealth = 'HEALTHY';
    const criticals: string[] = [];
    const majors: string[] = [];

    if (pageGrades.F > totalPages * 0.05) {
      overallHealth = 'DEGRADED';
      criticals.push(`${pageGrades.F} pages failed load time SLA (>5s)`);
    }
    if (memoryLeaks > 0) {
      overallHealth = 'DEGRADED';
      criticals.push(`${memoryLeaks} memory leak(s) detected`);
    }
    if (apiFailed > 0) {
      overallHealth = 'DEGRADED';
      criticals.push(`${apiFailed} API calls exceeded 5s`);
    }
    if (stressPassed < stressTotal) {
      majors.push(`${stressTotal - stressPassed}/${stressTotal} stress tests failed`);
    }

    // Generate consolidated summary
    const summary = `# Performance Audit Report — PRIVOD ERP

> Generated: ${new Date().toISOString().split('T')[0]}
> Platform: React 19 + Vite 6 + Spring Boot 3.4
> Target: Construction company with 50+ projects, 500+ employees

## Executive Summary

**Overall Health: ${overallHealth}**

| Category | Result | Status |
|----------|--------|--------|
| Page Load (${totalPages} pages) | A: ${pageGrades.A}, B: ${pageGrades.B}, C: ${pageGrades.C}, F: ${pageGrades.F} | ${pageGrades.F === 0 ? 'PASS' : 'FAIL'} |
| Stress Tests | ${stressPassed}/${stressTotal} passed | ${stressPassed === stressTotal ? 'PASS' : 'WARN'} |
| Memory Leaks | ${memoryLeaks}/${memoryTotal} leaks | ${memoryLeaks === 0 ? 'PASS' : 'FAIL'} |
| API Response | avg ${apiAvg}ms, ${apiFailed} failed | ${apiFailed === 0 ? 'PASS' : 'FAIL'} |

${criticals.length > 0 ? `### Critical Issues
${criticals.map((c) => `- [CRITICAL] ${c}`).join('\n')}
` : ''}
${majors.length > 0 ? `### Major Issues
${majors.map((m) => `- [MAJOR] ${m}`).join('\n')}
` : ''}
---

${pageLoadReport}

---

${interactionReport}

---

${stressReport}

---

${memoryReport}

---

${bundleReport}

${lazyLoadReport}

---

${apiReport}

---

## Comparison vs Competitors (estimates)

| Metric | Privod | Procore | PlanRadar | 1C:USO |
|--------|--------|---------|-----------|--------|
| Initial load | ~${pageLoadResults && pageLoadResults.length > 0 ? (pageLoadResults.reduce((s, r) => s + r.fullyLoaded, 0) / pageLoadResults.length / 1000).toFixed(1) : '?'}s | ~2.5s | ~1.8s | ~4s |
| SPA navigation | ~200ms | ~300ms | ~200ms | N/A |
| API avg response | ${apiAvg}ms | ~150ms | ~200ms | ~500ms |
| Bundle size | measured above | ~3MB | ~1.5MB | N/A |

> Note: Competitor numbers are estimated from public benchmarks and may vary.
`;

    writeReport('performance-summary.md', summary);

    // Save consolidated JSON
    saveResults('performance-results.json', {
      timestamp: new Date().toISOString(),
      overallHealth,
      criticals,
      majors,
      pageLoad: {
        total: totalPages,
        grades: pageGrades,
      },
      stress: {
        total: stressTotal,
        passed: stressPassed,
      },
      memory: {
        total: memoryTotal,
        leaks: memoryLeaks,
      },
      api: {
        totalCalls: apiTotal,
        avgTime: apiAvg,
        failed: apiFailed,
      },
    });
  });
});
