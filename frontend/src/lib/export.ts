/**
 * Client-side Excel/CSV export utilities.
 * Uses xlsx (SheetJS) when available, falls back to CSV.
 */

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: (value: unknown) => string;
}

/**
 * Export data to Excel (.xlsx) file.
 * Dynamically imports xlsx to avoid increasing initial bundle size.
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ExportColumn[],
): Promise<void> {
  try {
    const XLSX = await import('xlsx');

    // Build worksheet data
    let wsData: unknown[][];

    if (columns) {
      const headers = columns.map((c) => c.header);
      const rows = data.map((row) =>
        columns.map((c) => {
          const value = row[c.key];
          return c.format ? c.format(value) : (value ?? '');
        }),
      );
      wsData = [headers, ...rows];
    } else {
      if (data.length === 0) {
        wsData = [[]];
      } else {
        const headers = Object.keys(data[0]);
        const rows = data.map((row) => headers.map((h) => row[h] ?? ''));
        wsData = [headers, ...rows];
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    if (columns) {
      ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }));
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Write and trigger download
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  } catch (err) {
    console.error('Excel export failed, falling back to CSV:', err);
    exportToCsv(data, filename, columns);
  }
}

/**
 * Export data to CSV file (fallback or when xlsx not available).
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ExportColumn[],
): void {
  if (data.length === 0) return;

  let csvContent: string;

  if (columns) {
    const headers = columns.map((c) => `"${c.header}"`).join(',');
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const value = c.format ? c.format(row[c.key]) : row[c.key];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    csvContent = [headers, ...rows].join('\n');
  } else {
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
  }

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
