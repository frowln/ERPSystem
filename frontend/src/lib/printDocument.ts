/**
 * Print utility for generating A4-formatted print windows.
 * Opens a new browser window with styled HTML content and triggers window.print().
 */

/** Base CSS for A4 print format with Russian construction document styling */
const PRINT_BASE_CSS = `
  @page {
    size: A4 portrait;
    margin: 15mm 20mm 15mm 25mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Times New Roman', 'PT Serif', serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6pt;
  }
  h2 {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 4pt;
  }
  h3 {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 4pt;
  }
  .doc-header {
    text-align: center;
    margin-bottom: 12pt;
  }
  .doc-header .form-name {
    font-size: 9pt;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 4pt;
  }
  .doc-header .doc-title {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 2pt;
  }
  .doc-header .doc-date {
    font-size: 10pt;
    color: #333;
  }
  .parties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12pt;
    margin-bottom: 12pt;
  }
  .party-block {
    border: 0.5pt solid #999;
    padding: 6pt 8pt;
  }
  .party-block .party-label {
    font-size: 9pt;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 2pt;
  }
  .party-block .party-name {
    font-weight: bold;
    font-size: 10pt;
  }
  .party-block .party-detail {
    font-size: 9pt;
    color: #333;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10pt;
    font-size: 10pt;
  }
  table th,
  table td {
    border: 0.5pt solid #333;
    padding: 3pt 5pt;
    text-align: left;
    vertical-align: top;
  }
  table th {
    background-color: #f0f0f0;
    font-weight: bold;
    font-size: 9pt;
    text-align: center;
  }
  .text-right {
    text-align: right;
  }
  .text-center {
    text-align: center;
  }
  .num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
  .totals-row td {
    font-weight: bold;
    background-color: #f8f8f8;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20pt;
    margin-top: 30pt;
    page-break-inside: avoid;
  }
  .signature-block {
    border-top: 0.5pt solid #333;
    padding-top: 6pt;
    text-align: center;
  }
  .signature-block .sig-role {
    font-size: 9pt;
    color: #666;
    margin-bottom: 20pt;
  }
  .signature-block .sig-line {
    border-bottom: 0.5pt solid #333;
    margin: 0 auto;
    width: 80%;
    height: 16pt;
  }
  .signature-block .sig-name {
    font-size: 9pt;
    color: #333;
    margin-top: 2pt;
  }
  .meta-info {
    margin-bottom: 8pt;
    font-size: 10pt;
  }
  .meta-info .meta-label {
    color: #666;
    font-size: 9pt;
  }
  .meta-info .meta-value {
    font-weight: bold;
  }
  .section-title {
    font-size: 11pt;
    font-weight: bold;
    margin: 10pt 0 6pt 0;
    border-bottom: 0.5pt solid #999;
    padding-bottom: 2pt;
  }
  .notes-block {
    margin-top: 10pt;
    padding: 6pt 8pt;
    border: 0.5pt solid #ccc;
    background: #fafafa;
    font-size: 9pt;
    color: #333;
  }
  .status-badge {
    display: inline-block;
    padding: 1pt 6pt;
    border-radius: 3pt;
    font-size: 9pt;
    font-weight: bold;
  }
  @media screen {
    body {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: #f5f5f5;
    }
  }
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
  }
`;

/**
 * Format a number as Russian currency (e.g., 1 234 567,89)
 */
export function formatRuMoney(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with Russian locale
 */
export function formatRuNumber(value: number | null | undefined, decimals = 2): string {
  if (value == null || !isFinite(value)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Open a new window with formatted HTML content and trigger printing.
 *
 * @param title - Window/document title
 * @param bodyHtml - HTML content for the document body
 * @param extraCss - Optional additional CSS to inject
 */
export function printDocument(
  title: string,
  bodyHtml: string,
  extraCss?: string,
): void {
  const printWindow = window.open('', '_blank', 'width=800,height=1100');
  if (!printWindow) {
    // Popup blocker likely active
    alert('Please allow popups to print documents');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_BASE_CSS}${extraCss ? '\n' + extraCss : ''}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
