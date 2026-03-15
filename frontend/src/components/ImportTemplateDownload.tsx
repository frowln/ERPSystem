import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export interface TemplateColumn {
  header: string;
  example?: string;
  required?: boolean;
}

interface ImportTemplateDownloadProps {
  templateName: string;
  columns: TemplateColumn[];
  fileName: string;
  label?: string;
}

export function ImportTemplateDownload({
  templateName,
  columns,
  fileName,
  label = 'Скачать шаблон',
}: ImportTemplateDownloadProps) {
  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // Row 1: headers (with * for required fields)
    const headers = columns.map((c) => (c.required ? `${c.header} *` : c.header));
    // Row 2: examples
    const examples = columns.map((c) => c.example || '');

    const ws = XLSX.utils.aoa_to_sheet([headers, examples]);

    // Set column widths
    ws['!cols'] = columns.map((c) => ({
      wch: Math.max(c.header.length + (c.required ? 2 : 0), (c.example || '').length, 15),
    }));

    XLSX.utils.book_append_sheet(wb, ws, templateName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Pre-defined templates ───────────────────────────────────────────────────

export const MATERIAL_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { header: 'Наименование', required: true, example: 'Труба стальная 108x4' },
  { header: 'Артикул', example: 'TS-108-4' },
  { header: 'Ед.изм.', required: true, example: 'м.п.' },
  { header: 'Категория', example: 'METAL' },
  { header: 'Мин.остаток', example: '100' },
];

export const EMPLOYEE_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { header: 'Фамилия', required: true, example: 'Иванов' },
  { header: 'Имя', required: true, example: 'Пётр' },
  { header: 'Отчество', example: 'Сергеевич' },
  { header: 'Должность', required: true, example: 'Инженер-сметчик' },
  { header: 'Email', example: 'ivanov@company.ru' },
  { header: 'Телефон', example: '+7 (999) 123-45-67' },
  { header: 'Табельный номер', example: 'EMP-00001' },
  { header: 'ИНН', example: '770123456789' },
  { header: 'СНИЛС', example: '123-456-789 00' },
  { header: 'Подразделение', example: 'Сметный отдел' },
];

export const SPECIFICATION_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { header: 'Наименование', required: true, example: 'Насос центробежный' },
  { header: 'Тип/Марка', example: 'НК-65/35' },
  { header: 'Код', example: 'НК-001' },
  { header: 'Завод', example: 'ОАО Ливгидромаш' },
  { header: 'Ед.изм.', example: 'шт' },
  { header: 'Кол-во', example: '2' },
  { header: 'Вес', example: '145.5' },
  { header: 'Примечание', example: 'Комплект с эл.двигателем' },
];

export const COUNTERPARTY_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { header: 'Наименование', required: true, example: 'ООО "Стройком"' },
  { header: 'ИНН', required: true, example: '7701234567' },
  { header: 'КПП', example: '770101001' },
  { header: 'ОГРН', example: '1177746012345' },
  { header: 'Адрес', example: 'г. Москва, ул. Строителей, д. 1' },
  { header: 'Телефон', example: '+7 (495) 123-45-67' },
  { header: 'Email', example: 'info@stroykom.ru' },
];
