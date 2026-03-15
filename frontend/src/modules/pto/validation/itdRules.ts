// =============================================================================
// ITD (Исполнительная Техническая Документация) Validation Engine
// Inspired by Hardroller — 52 rules for Russian construction compliance
// =============================================================================

import { formatDate } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleCategory =
  | 'dates'
  | 'signatures'
  | 'references'
  | 'completeness'
  | 'sequence'
  | 'materials'
  | 'geodesy';

export interface ValidationResult {
  passed: boolean;
  message?: string;
  details?: string;
  affectedField?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  check: (data: ItdDocumentData) => ValidationResult;
}

export interface ItdDocumentData {
  aosr?: {
    number?: string;
    date?: string;
    workName?: string;
    startDate?: string;
    endDate?: string;
    materialCertificates?: string[];
    labTests?: string[];
    drawings?: string[];
    signatories?: { name: string; role: string; signed: boolean }[];
    geodesyReference?: string;
    previousAosrNumber?: string;
    nextWorkStage?: string;
    workVolume?: number;
    workMethod?: string;
    qualityConclusion?: string;
    weatherConditions?: string;
    equipmentUsed?: string[];
    snipReference?: string;
    buildingPermitNumber?: string;
    photos?: string[];
  };
  executiveScheme?: {
    number?: string;
    date?: string;
    deviations?: { value: number; allowable: number }[];
    geodesyMarks?: { planned: number; actual: number }[];
    referencePoint?: string;
  };
  materialCertificate?: {
    date?: string;
    expiryDate?: string;
    brand?: string;
    grade?: string;
    batchNumber?: string;
    specificationBrand?: string;
    specificationGrade?: string;
  };
  projectStartDate?: string;
  projectEndDate?: string;
  previousDocuments?: { type: string; number: string; date: string; workType?: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

function isValidNameFormat(name: string): boolean {
  // Acceptable: "Иванов И.И." or "Иванов Иван Петрович" or "Ivanov I.P."
  return /^[A-ZА-ЯЁ][a-zа-яё]+\s+[A-ZА-ЯЁa-zа-яё]/.test(name.trim());
}

// ---------------------------------------------------------------------------
// 1. DATES (10 rules)
// ---------------------------------------------------------------------------

const D01: ValidationRule = {
  id: 'D01',
  name: 'Дата АОСР в пределах проекта',
  description: 'Дата акта должна быть в рамках дат начала и окончания проекта',
  category: 'dates',
  severity: 'error',
  check(data) {
    const aosrDate = parseDate(data.aosr?.date);
    const start = parseDate(data.projectStartDate);
    const end = parseDate(data.projectEndDate);
    if (!aosrDate) return { passed: true, message: 'Дата АОСР не указана — пропуск' };
    if (start && aosrDate < start) {
      return { passed: false, message: 'Дата АОСР раньше начала проекта', affectedField: 'aosr.date' };
    }
    if (end && aosrDate > end) {
      return { passed: false, message: 'Дата АОСР позже окончания проекта', affectedField: 'aosr.date' };
    }
    return { passed: true };
  },
};

const D02: ValidationRule = {
  id: 'D02',
  name: 'Дата начала работ ≤ дата окончания',
  description: 'Дата начала работ не может быть позже даты окончания',
  category: 'dates',
  severity: 'error',
  check(data) {
    const s = parseDate(data.aosr?.startDate);
    const e = parseDate(data.aosr?.endDate);
    if (!s || !e) return { passed: true, message: 'Даты начала/окончания не указаны' };
    if (s > e) {
      return { passed: false, message: 'Дата начала работ позже даты окончания', affectedField: 'aosr.startDate' };
    }
    return { passed: true };
  },
};

const D03: ValidationRule = {
  id: 'D03',
  name: 'Дата акта не в будущем',
  description: 'Дата оформления АОСР не может быть в будущем',
  category: 'dates',
  severity: 'error',
  check(data) {
    const d = parseDate(data.aosr?.date);
    if (!d) return { passed: true };
    if (d > new Date()) {
      return { passed: false, message: 'Дата АОСР в будущем', affectedField: 'aosr.date' };
    }
    return { passed: true };
  },
};

const D04: ValidationRule = {
  id: 'D04',
  name: 'Дата начала работ не в будущем',
  description: 'Дата начала работ не может быть в будущем',
  category: 'dates',
  severity: 'error',
  check(data) {
    const d = parseDate(data.aosr?.startDate);
    if (!d) return { passed: true };
    if (d > new Date()) {
      return { passed: false, message: 'Дата начала работ в будущем', affectedField: 'aosr.startDate' };
    }
    return { passed: true };
  },
};

const D05: ValidationRule = {
  id: 'D05',
  name: 'Дата окончания работ не в будущем',
  description: 'Дата окончания работ не может быть в будущем',
  category: 'dates',
  severity: 'warning',
  check(data) {
    const d = parseDate(data.aosr?.endDate);
    if (!d) return { passed: true };
    if (d > new Date()) {
      return { passed: false, message: 'Дата окончания работ в будущем (работы ещё ведутся?)', affectedField: 'aosr.endDate' };
    }
    return { passed: true };
  },
};

const D06: ValidationRule = {
  id: 'D06',
  name: 'Дата начала работ в пределах проекта',
  description: 'Дата начала работ должна быть в рамках проекта',
  category: 'dates',
  severity: 'error',
  check(data) {
    const d = parseDate(data.aosr?.startDate);
    const start = parseDate(data.projectStartDate);
    const end = parseDate(data.projectEndDate);
    if (!d) return { passed: true };
    if (start && d < start) {
      return { passed: false, message: 'Дата начала работ раньше старта проекта', affectedField: 'aosr.startDate' };
    }
    if (end && d > end) {
      return { passed: false, message: 'Дата начала работ позже окончания проекта', affectedField: 'aosr.startDate' };
    }
    return { passed: true };
  },
};

const D07: ValidationRule = {
  id: 'D07',
  name: 'Дата окончания работ в пределах проекта',
  description: 'Дата окончания работ должна быть в рамках проекта',
  category: 'dates',
  severity: 'error',
  check(data) {
    const d = parseDate(data.aosr?.endDate);
    const start = parseDate(data.projectStartDate);
    const end = parseDate(data.projectEndDate);
    if (!d) return { passed: true };
    if (start && d < start) {
      return { passed: false, message: 'Дата окончания работ раньше старта проекта', affectedField: 'aosr.endDate' };
    }
    if (end && d > end) {
      return { passed: false, message: 'Дата окончания работ позже окончания проекта', affectedField: 'aosr.endDate' };
    }
    return { passed: true };
  },
};

const D08: ValidationRule = {
  id: 'D08',
  name: 'Разрыв между актами > 30 дней',
  description: 'Предупреждение при разрыве более 30 дней между текущим и предыдущим АОСР',
  category: 'dates',
  severity: 'warning',
  check(data) {
    const current = parseDate(data.aosr?.date);
    if (!current || !data.previousDocuments?.length) return { passed: true };
    const prevAosr = data.previousDocuments
      .filter((d) => d.type === 'aosr')
      .map((d) => parseDate(d.date))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());
    if (!prevAosr.length) return { passed: true };
    const gap = daysBetween(prevAosr[0], current);
    if (gap > 30) {
      return {
        passed: false,
        message: `Разрыв между актами ${gap} дней (> 30)`,
        details: 'Возможен пропуск промежуточных работ',
        affectedField: 'aosr.date',
      };
    }
    return { passed: true };
  },
};

const D09: ValidationRule = {
  id: 'D09',
  name: 'Работы в выходные дни',
  description: 'Предупреждение, если работы выполняются в выходные дни',
  category: 'dates',
  severity: 'warning',
  check(data) {
    const start = parseDate(data.aosr?.startDate);
    const end = parseDate(data.aosr?.endDate);
    if (!start || !end) return { passed: true };
    const weekendDays: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      if (isWeekend(cursor)) {
        weekendDays.push(formatDate(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (weekendDays.length > 0) {
      return {
        passed: false,
        message: `Работы запланированы на ${weekendDays.length} выходных дней`,
        details: `Даты: ${weekendDays.slice(0, 5).join(', ')}${weekendDays.length > 5 ? '...' : ''}`,
        affectedField: 'aosr.startDate',
      };
    }
    return { passed: true };
  },
};

const D10: ValidationRule = {
  id: 'D10',
  name: 'Длительность работ < 1 дня',
  description: 'Если работы начаты и закончены в один день — предупреждение',
  category: 'dates',
  severity: 'info',
  check(data) {
    const s = parseDate(data.aosr?.startDate);
    const e = parseDate(data.aosr?.endDate);
    if (!s || !e) return { passed: true };
    if (daysBetween(s, e) === 0) {
      return { passed: false, message: 'Работы начаты и завершены в один день', affectedField: 'aosr.startDate' };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 2. SIGNATURES (8 rules)
// ---------------------------------------------------------------------------

const S01: ValidationRule = {
  id: 'S01',
  name: 'Представитель заказчика',
  description: 'Должен быть подписант с ролью «заказчик»',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: false, message: 'Список подписантов пуст', affectedField: 'aosr.signatories' };
    const found = sigs.some((s) => s.role.toLowerCase().includes('заказчик'));
    return found
      ? { passed: true }
      : { passed: false, message: 'Отсутствует представитель заказчика', affectedField: 'aosr.signatories' };
  },
};

const S02: ValidationRule = {
  id: 'S02',
  name: 'Представитель подрядчика',
  description: 'Должен быть подписант с ролью «подрядчик»',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: false, message: 'Список подписантов пуст', affectedField: 'aosr.signatories' };
    const found = sigs.some((s) => s.role.toLowerCase().includes('подрядчик'));
    return found
      ? { passed: true }
      : { passed: false, message: 'Отсутствует представитель подрядчика', affectedField: 'aosr.signatories' };
  },
};

const S03: ValidationRule = {
  id: 'S03',
  name: 'Представитель проектировщика',
  description: 'Должен быть подписант с ролью «проектировщик» (авторский надзор)',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: false, message: 'Список подписантов пуст', affectedField: 'aosr.signatories' };
    const found = sigs.some((s) => s.role.toLowerCase().includes('проектировщик'));
    return found
      ? { passed: true }
      : { passed: false, message: 'Отсутствует представитель проектировщика (авторский надзор)', affectedField: 'aosr.signatories' };
  },
};

const S04: ValidationRule = {
  id: 'S04',
  name: 'Все подписи собраны',
  description: 'Все указанные подписанты должны подписать акт',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: false, message: 'Список подписантов пуст', affectedField: 'aosr.signatories' };
    const unsigned = sigs.filter((s) => !s.signed);
    if (unsigned.length > 0) {
      return {
        passed: false,
        message: `Не подписали: ${unsigned.map((u) => u.name).join(', ')}`,
        details: `${unsigned.length} из ${sigs.length} подписей отсутствуют`,
        affectedField: 'aosr.signatories',
      };
    }
    return { passed: true };
  },
};

const S05: ValidationRule = {
  id: 'S05',
  name: 'Минимум 3 подписанта',
  description: 'АОСР должен содержать минимум 3 подписанта (заказчик, подрядчик, проектировщик)',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs || sigs.length < 3) {
      return {
        passed: false,
        message: `Указано ${sigs?.length ?? 0} подписантов (минимум 3)`,
        affectedField: 'aosr.signatories',
      };
    }
    return { passed: true };
  },
};

const S06: ValidationRule = {
  id: 'S06',
  name: 'Формат ФИО подписантов',
  description: 'Имена подписантов должны быть в формате «Фамилия И.О.» или полном формате',
  category: 'signatures',
  severity: 'warning',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: true };
    const invalid = sigs.filter((s) => !isValidNameFormat(s.name));
    if (invalid.length > 0) {
      return {
        passed: false,
        message: `Некорректный формат ФИО: ${invalid.map((s) => s.name).join(', ')}`,
        affectedField: 'aosr.signatories',
      };
    }
    return { passed: true };
  },
};

const S07: ValidationRule = {
  id: 'S07',
  name: 'Нет дублирования ролей',
  description: 'Не должно быть двух подписантов с одинаковой ролью (кроме «подрядчик»)',
  category: 'signatures',
  severity: 'warning',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: true };
    const roleCounts = new Map<string, number>();
    for (const s of sigs) {
      const role = s.role.toLowerCase();
      if (role.includes('подрядчик')) continue; // multiple subcontractors OK
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
    }
    const dupes = [...roleCounts.entries()].filter(([, c]) => c > 1);
    if (dupes.length > 0) {
      return {
        passed: false,
        message: `Дублирование ролей: ${dupes.map(([r]) => r).join(', ')}`,
        affectedField: 'aosr.signatories',
      };
    }
    return { passed: true };
  },
};

const S08: ValidationRule = {
  id: 'S08',
  name: 'Имена подписантов не пустые',
  description: 'У каждого подписанта должно быть указано имя',
  category: 'signatures',
  severity: 'error',
  check(data) {
    const sigs = data.aosr?.signatories;
    if (!sigs?.length) return { passed: true };
    const empty = sigs.filter((s) => !s.name?.trim());
    if (empty.length > 0) {
      return {
        passed: false,
        message: `${empty.length} подписант(ов) без имени`,
        affectedField: 'aosr.signatories',
      };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 3. REFERENCES (10 rules)
// ---------------------------------------------------------------------------

const R01: ValidationRule = {
  id: 'R01',
  name: 'Ссылка на чертежи',
  description: 'Должна быть указана хотя бы одна ссылка на рабочие чертежи',
  category: 'references',
  severity: 'error',
  check(data) {
    const drawings = data.aosr?.drawings;
    if (!drawings || drawings.length === 0) {
      return { passed: false, message: 'Не указаны ссылки на рабочие чертежи', affectedField: 'aosr.drawings' };
    }
    return { passed: true };
  },
};

const R02: ValidationRule = {
  id: 'R02',
  name: 'Ссылка на сертификаты материалов',
  description: 'При использовании материалов должны быть ссылки на сертификаты/паспорта',
  category: 'references',
  severity: 'error',
  check(data) {
    const certs = data.aosr?.materialCertificates;
    if (!certs || certs.length === 0) {
      return { passed: false, message: 'Не указаны сертификаты материалов', affectedField: 'aosr.materialCertificates' };
    }
    return { passed: true };
  },
};

const R03: ValidationRule = {
  id: 'R03',
  name: 'Ссылка на результаты испытаний',
  description: 'Должны быть приложены результаты лабораторных испытаний',
  category: 'references',
  severity: 'warning',
  check(data) {
    const tests = data.aosr?.labTests;
    if (!tests || tests.length === 0) {
      return { passed: false, message: 'Не указаны результаты лабораторных испытаний', affectedField: 'aosr.labTests' };
    }
    return { passed: true };
  },
};

const R04: ValidationRule = {
  id: 'R04',
  name: 'Ссылка на СНиП/ГОСТ',
  description: 'Должна быть ссылка на нормативный документ (СНиП, ГОСТ, СП)',
  category: 'references',
  severity: 'error',
  check(data) {
    const ref = data.aosr?.snipReference;
    if (!ref?.trim()) {
      return { passed: false, message: 'Не указана ссылка на нормативный документ (СНиП/ГОСТ/СП)', affectedField: 'aosr.snipReference' };
    }
    return { passed: true };
  },
};

const R05: ValidationRule = {
  id: 'R05',
  name: 'Ссылка на геодезическую съёмку',
  description: 'Для скрытых работ должна быть ссылка на исполнительную геодезическую съёмку',
  category: 'references',
  severity: 'warning',
  check(data) {
    const ref = data.aosr?.geodesyReference;
    if (!ref?.trim()) {
      return { passed: false, message: 'Не указана ссылка на геодезическую съёмку', affectedField: 'aosr.geodesyReference' };
    }
    return { passed: true };
  },
};

const R06: ValidationRule = {
  id: 'R06',
  name: 'Номер разрешения на строительство',
  description: 'Должен быть указан номер разрешения на строительство',
  category: 'references',
  severity: 'error',
  check(data) {
    const permit = data.aosr?.buildingPermitNumber;
    if (!permit?.trim()) {
      return { passed: false, message: 'Не указан номер разрешения на строительство', affectedField: 'aosr.buildingPermitNumber' };
    }
    return { passed: true };
  },
};

const R07: ValidationRule = {
  id: 'R07',
  name: 'Ссылка на предыдущий АОСР',
  description: 'При наличии предыдущих скрытых работ — ссылка на предыдущий акт',
  category: 'references',
  severity: 'warning',
  check(data) {
    if (!data.previousDocuments?.some((d) => d.type === 'aosr')) {
      return { passed: true, message: 'Нет предыдущих АОСР — пропуск' };
    }
    const ref = data.aosr?.previousAosrNumber;
    if (!ref?.trim()) {
      return {
        passed: false,
        message: 'Есть предыдущие АОСР, но ссылка на них не указана',
        affectedField: 'aosr.previousAosrNumber',
      };
    }
    return { passed: true };
  },
};

const R08: ValidationRule = {
  id: 'R08',
  name: 'Указан следующий этап работ',
  description: 'Должен быть указан следующий вид работ, который закрывается данным актом',
  category: 'references',
  severity: 'info',
  check(data) {
    const next = data.aosr?.nextWorkStage;
    if (!next?.trim()) {
      return { passed: false, message: 'Не указан следующий этап работ', affectedField: 'aosr.nextWorkStage' };
    }
    return { passed: true };
  },
};

const R09: ValidationRule = {
  id: 'R09',
  name: 'Формат номера чертежа',
  description: 'Номера чертежей должны содержать шифр проекта и номер листа',
  category: 'references',
  severity: 'info',
  check(data) {
    const drawings = data.aosr?.drawings;
    if (!drawings?.length) return { passed: true };
    // Check for basic pattern: at least has a dash/dot and some digits
    const invalid = drawings.filter((d) => !/[\-\.]\d/.test(d));
    if (invalid.length > 0) {
      return {
        passed: false,
        message: `Некорректный формат чертежа: ${invalid.join(', ')}`,
        details: 'Ожидается формат «ШифрПроекта-Раздел.Лист»',
        affectedField: 'aosr.drawings',
      };
    }
    return { passed: true };
  },
};

const R10: ValidationRule = {
  id: 'R10',
  name: 'Номер исполнительной схемы',
  description: 'Исполнительная схема должна иметь номер',
  category: 'references',
  severity: 'error',
  check(data) {
    if (!data.executiveScheme) return { passed: true, message: 'Исполнительная схема не приложена — пропуск' };
    if (!data.executiveScheme.number?.trim()) {
      return { passed: false, message: 'У исполнительной схемы отсутствует номер', affectedField: 'executiveScheme.number' };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 4. COMPLETENESS (10 rules)
// ---------------------------------------------------------------------------

const C01: ValidationRule = {
  id: 'C01',
  name: 'Номер акта заполнен',
  description: 'Номер АОСР должен быть заполнен',
  category: 'completeness',
  severity: 'error',
  check(data) {
    if (!data.aosr?.number?.trim()) {
      return { passed: false, message: 'Не указан номер АОСР', affectedField: 'aosr.number' };
    }
    return { passed: true };
  },
};

const C02: ValidationRule = {
  id: 'C02',
  name: 'Наименование работ > 10 символов',
  description: 'Описание вида работ должно быть подробным (минимум 10 символов)',
  category: 'completeness',
  severity: 'error',
  check(data) {
    const name = data.aosr?.workName?.trim() ?? '';
    if (name.length === 0) {
      return { passed: false, message: 'Не указано наименование работ', affectedField: 'aosr.workName' };
    }
    if (name.length < 10) {
      return {
        passed: false,
        message: `Слишком короткое описание работ (${name.length} символов, минимум 10)`,
        affectedField: 'aosr.workName',
      };
    }
    return { passed: true };
  },
};

const C03: ValidationRule = {
  id: 'C03',
  name: 'Объём работ указан',
  description: 'Должен быть указан объём выполненных работ',
  category: 'completeness',
  severity: 'error',
  check(data) {
    if (data.aosr?.workVolume == null || data.aosr.workVolume <= 0) {
      return { passed: false, message: 'Не указан объём выполненных работ', affectedField: 'aosr.workVolume' };
    }
    return { passed: true };
  },
};

const C04: ValidationRule = {
  id: 'C04',
  name: 'Метод производства работ',
  description: 'Должен быть указан метод (технология) выполнения работ',
  category: 'completeness',
  severity: 'error',
  check(data) {
    if (!data.aosr?.workMethod?.trim()) {
      return { passed: false, message: 'Не указан метод производства работ', affectedField: 'aosr.workMethod' };
    }
    return { passed: true };
  },
};

const C05: ValidationRule = {
  id: 'C05',
  name: 'Заключение о качестве',
  description: 'Должно быть указано заключение о соответствии качеству',
  category: 'completeness',
  severity: 'error',
  check(data) {
    if (!data.aosr?.qualityConclusion?.trim()) {
      return { passed: false, message: 'Не указано заключение о качестве работ', affectedField: 'aosr.qualityConclusion' };
    }
    return { passed: true };
  },
};

const C06: ValidationRule = {
  id: 'C06',
  name: 'Фотофиксация',
  description: 'Рекомендуется приложить фото выполненных работ',
  category: 'completeness',
  severity: 'warning',
  check(data) {
    const photos = data.aosr?.photos;
    if (!photos || photos.length === 0) {
      return { passed: false, message: 'Не приложены фотоматериалы', affectedField: 'aosr.photos' };
    }
    return { passed: true };
  },
};

const C07: ValidationRule = {
  id: 'C07',
  name: 'Погодные условия',
  description: 'Рекомендуется указать погодные условия при производстве работ',
  category: 'completeness',
  severity: 'warning',
  check(data) {
    if (!data.aosr?.weatherConditions?.trim()) {
      return { passed: false, message: 'Не указаны погодные условия', affectedField: 'aosr.weatherConditions' };
    }
    return { passed: true };
  },
};

const C08: ValidationRule = {
  id: 'C08',
  name: 'Использованное оборудование',
  description: 'Должен быть указан перечень использованной техники/оборудования',
  category: 'completeness',
  severity: 'info',
  check(data) {
    const eq = data.aosr?.equipmentUsed;
    if (!eq || eq.length === 0) {
      return { passed: false, message: 'Не указано использованное оборудование', affectedField: 'aosr.equipmentUsed' };
    }
    return { passed: true };
  },
};

const C09: ValidationRule = {
  id: 'C09',
  name: 'Дата акта заполнена',
  description: 'Дата оформления АОСР должна быть указана',
  category: 'completeness',
  severity: 'error',
  check(data) {
    if (!data.aosr?.date?.trim()) {
      return { passed: false, message: 'Не указана дата АОСР', affectedField: 'aosr.date' };
    }
    return { passed: true };
  },
};

const C10: ValidationRule = {
  id: 'C10',
  name: 'Наличие материалов',
  description: 'Должна быть информация о применённых материалах (сертификаты)',
  category: 'completeness',
  severity: 'error',
  check(data) {
    const certs = data.aosr?.materialCertificates;
    if (!certs || certs.length === 0) {
      return { passed: false, message: 'Не указаны применённые материалы', affectedField: 'aosr.materialCertificates' };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 5. SEQUENCE (6 rules)
// ---------------------------------------------------------------------------

const SEQ01: ValidationRule = {
  id: 'SEQ01',
  name: 'Фундамент до каркаса',
  description: 'Работы по каркасу не могут идти раньше фундаментных работ',
  category: 'sequence',
  severity: 'error',
  check(data) {
    if (!data.previousDocuments?.length || !data.aosr?.workName) return { passed: true };
    const workLower = data.aosr.workName.toLowerCase();
    const isStructure = /каркас|колонн|перекрыти|стен|несущ|монтаж металлоконструкц/.test(workLower);
    if (!isStructure) return { passed: true };
    const hasFoundation = data.previousDocuments.some(
      (d) => d.type === 'aosr' && /фундамент|свай|основани|котлован/.test((d.workType ?? '').toLowerCase()),
    );
    if (!hasFoundation) {
      return {
        passed: false,
        message: 'Нет подтверждения выполнения фундаментных работ перед монтажом каркаса',
        details: 'Требуется АОСР на фундамент/основание',
        affectedField: 'aosr.workName',
      };
    }
    return { passed: true };
  },
};

const SEQ02: ValidationRule = {
  id: 'SEQ02',
  name: 'Арматура до бетонирования',
  description: 'Бетонирование не может быть выполнено без предварительного акта на арматурные работы',
  category: 'sequence',
  severity: 'error',
  check(data) {
    if (!data.previousDocuments?.length || !data.aosr?.workName) return { passed: true };
    const workLower = data.aosr.workName.toLowerCase();
    const isConcrete = /бетонирован|бетон|заливк/.test(workLower);
    if (!isConcrete) return { passed: true };
    const hasRebar = data.previousDocuments.some(
      (d) => d.type === 'aosr' && /арматур|армирован|каркас арм/.test((d.workType ?? '').toLowerCase()),
    );
    if (!hasRebar) {
      return {
        passed: false,
        message: 'Нет АОСР на арматурные работы перед бетонированием',
        details: 'Перед бетонированием требуется освидетельствование арматуры',
        affectedField: 'aosr.workName',
      };
    }
    return { passed: true };
  },
};

const SEQ03: ValidationRule = {
  id: 'SEQ03',
  name: 'Гидроизоляция до обратной засыпки',
  description: 'Обратная засыпка не должна выполняться без акта на гидроизоляцию фундамента',
  category: 'sequence',
  severity: 'error',
  check(data) {
    if (!data.previousDocuments?.length || !data.aosr?.workName) return { passed: true };
    const workLower = data.aosr.workName.toLowerCase();
    const isBackfill = /обратная засыпк|засыпк/.test(workLower);
    if (!isBackfill) return { passed: true };
    const hasWaterproofing = data.previousDocuments.some(
      (d) => d.type === 'aosr' && /гидроизоляц|гидрозащит/.test((d.workType ?? '').toLowerCase()),
    );
    if (!hasWaterproofing) {
      return {
        passed: false,
        message: 'Нет АОСР на гидроизоляцию перед обратной засыпкой',
        affectedField: 'aosr.workName',
      };
    }
    return { passed: true };
  },
};

const SEQ04: ValidationRule = {
  id: 'SEQ04',
  name: 'Последовательная нумерация',
  description: 'Номера актов должны идти последовательно',
  category: 'sequence',
  severity: 'warning',
  check(data) {
    if (!data.previousDocuments?.length || !data.aosr?.number) return { passed: true };
    const currentNum = parseInt(data.aosr.number.replace(/\D/g, ''), 10);
    if (isNaN(currentNum)) return { passed: true };
    const prevNumbers = data.previousDocuments
      .filter((d) => d.type === 'aosr')
      .map((d) => parseInt(d.number.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
    if (!prevNumbers.length) return { passed: true };
    const maxPrev = prevNumbers[prevNumbers.length - 1];
    if (currentNum !== maxPrev + 1) {
      return {
        passed: false,
        message: `Нарушена последовательность: предыдущий №${maxPrev}, текущий №${currentNum}`,
        details: `Ожидается №${maxPrev + 1}`,
        affectedField: 'aosr.number',
      };
    }
    return { passed: true };
  },
};

const SEQ05: ValidationRule = {
  id: 'SEQ05',
  name: 'Хронология дат актов',
  description: 'Дата текущего акта не должна быть раньше даты предыдущего акта',
  category: 'sequence',
  severity: 'error',
  check(data) {
    const current = parseDate(data.aosr?.date);
    if (!current || !data.previousDocuments?.length) return { passed: true };
    const prevDates = data.previousDocuments
      .filter((d) => d.type === 'aosr')
      .map((d) => parseDate(d.date))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());
    if (!prevDates.length) return { passed: true };
    if (current < prevDates[0]) {
      return {
        passed: false,
        message: 'Дата текущего АОСР раньше предыдущего',
        details: `Текущий: ${data.aosr?.date}, предыдущий: ${prevDates[0].toISOString().slice(0, 10)}`,
        affectedField: 'aosr.date',
      };
    }
    return { passed: true };
  },
};

const SEQ06: ValidationRule = {
  id: 'SEQ06',
  name: 'Утепление после каркаса',
  description: 'Работы по утеплению не должны выполняться без акта на несущие конструкции',
  category: 'sequence',
  severity: 'warning',
  check(data) {
    if (!data.previousDocuments?.length || !data.aosr?.workName) return { passed: true };
    const workLower = data.aosr.workName.toLowerCase();
    const isInsulation = /утеплени|теплоизоляц|термоизоляц/.test(workLower);
    if (!isInsulation) return { passed: true };
    const hasStructure = data.previousDocuments.some(
      (d) =>
        d.type === 'aosr' &&
        /каркас|несущ|стен|колонн|перекрыт|монтаж металлоконструкц/.test((d.workType ?? '').toLowerCase()),
    );
    if (!hasStructure) {
      return {
        passed: false,
        message: 'Нет АОСР на несущие конструкции перед утеплением',
        affectedField: 'aosr.workName',
      };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 6. MATERIALS (4 rules)
// ---------------------------------------------------------------------------

const M01: ValidationRule = {
  id: 'M01',
  name: 'Сертификат до начала работ',
  description: 'Дата сертификата материала должна быть раньше даты начала работ',
  category: 'materials',
  severity: 'error',
  check(data) {
    const certDate = parseDate(data.materialCertificate?.date);
    const workStart = parseDate(data.aosr?.startDate);
    if (!certDate || !workStart) return { passed: true };
    if (certDate > workStart) {
      return {
        passed: false,
        message: 'Сертификат материала выдан позже начала работ',
        details: `Сертификат: ${data.materialCertificate?.date}, начало работ: ${data.aosr?.startDate}`,
        affectedField: 'materialCertificate.date',
      };
    }
    return { passed: true };
  },
};

const M02: ValidationRule = {
  id: 'M02',
  name: 'Срок действия сертификата',
  description: 'Сертификат не должен быть просрочен более чем на 1 год от даты работ',
  category: 'materials',
  severity: 'error',
  check(data) {
    const expiry = parseDate(data.materialCertificate?.expiryDate);
    const workStart = parseDate(data.aosr?.startDate);
    if (!expiry || !workStart) return { passed: true };
    if (expiry < workStart) {
      const daysExpired = daysBetween(expiry, workStart);
      return {
        passed: false,
        message: `Сертификат просрочен на ${daysExpired} дней к началу работ`,
        details: `Истёк: ${data.materialCertificate?.expiryDate}`,
        affectedField: 'materialCertificate.expiryDate',
      };
    }
    return { passed: true };
  },
};

const M03: ValidationRule = {
  id: 'M03',
  name: 'Марка материала совпадает со спецификацией',
  description: 'Марка/бренд материала должны совпадать с проектной спецификацией',
  category: 'materials',
  severity: 'error',
  check(data) {
    const cert = data.materialCertificate;
    if (!cert) return { passed: true };
    if (cert.specificationBrand && cert.brand) {
      if (cert.brand.toLowerCase() !== cert.specificationBrand.toLowerCase()) {
        return {
          passed: false,
          message: `Марка «${cert.brand}» не совпадает со спецификацией «${cert.specificationBrand}»`,
          affectedField: 'materialCertificate.brand',
        };
      }
    }
    if (cert.specificationGrade && cert.grade) {
      if (cert.grade.toLowerCase() !== cert.specificationGrade.toLowerCase()) {
        return {
          passed: false,
          message: `Класс «${cert.grade}» не совпадает со спецификацией «${cert.specificationGrade}»`,
          affectedField: 'materialCertificate.grade',
        };
      }
    }
    return { passed: true };
  },
};

const M04: ValidationRule = {
  id: 'M04',
  name: 'Номер партии указан',
  description: 'У сертификата материала должен быть указан номер партии',
  category: 'materials',
  severity: 'warning',
  check(data) {
    const cert = data.materialCertificate;
    if (!cert) return { passed: true };
    if (!cert.batchNumber?.trim()) {
      return { passed: false, message: 'Не указан номер партии материала', affectedField: 'materialCertificate.batchNumber' };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// 7. GEODESY (4 rules)
// ---------------------------------------------------------------------------

const G01: ValidationRule = {
  id: 'G01',
  name: 'Отклонения в допуске (фундамент ±5мм)',
  description: 'Геодезические отклонения фундаментов не должны превышать ±5 мм',
  category: 'geodesy',
  severity: 'error',
  check(data) {
    const scheme = data.executiveScheme;
    if (!scheme?.deviations?.length) return { passed: true };
    const overLimit = scheme.deviations.filter((d) => Math.abs(d.value) > d.allowable);
    if (overLimit.length > 0) {
      return {
        passed: false,
        message: `${overLimit.length} отклонений превышают допуск`,
        details: overLimit
          .slice(0, 3)
          .map((d) => `${d.value}мм (допуск ±${d.allowable}мм)`)
          .join('; '),
        affectedField: 'executiveScheme.deviations',
      };
    }
    return { passed: true };
  },
};

const G02: ValidationRule = {
  id: 'G02',
  name: 'Высотные отметки в допуске',
  description: 'Фактические высотные отметки должны совпадать с проектными (допуск ±10мм)',
  category: 'geodesy',
  severity: 'error',
  check(data) {
    const marks = data.executiveScheme?.geodesyMarks;
    if (!marks?.length) return { passed: true };
    const overLimit = marks.filter((m) => Math.abs(m.actual - m.planned) > 0.010); // 10mm = 0.010m
    if (overLimit.length > 0) {
      return {
        passed: false,
        message: `${overLimit.length} высотных отметок с отклонением > 10мм`,
        details: overLimit
          .slice(0, 3)
          .map((m) => `план ${m.planned}м, факт ${m.actual}м (Δ${((m.actual - m.planned) * 1000).toFixed(1)}мм)`)
          .join('; '),
        affectedField: 'executiveScheme.geodesyMarks',
      };
    }
    return { passed: true };
  },
};

const G03: ValidationRule = {
  id: 'G03',
  name: 'Дата геодезической съёмки',
  description: 'Дата исполнительной схемы должна быть в пределах ±3 дней от даты АОСР',
  category: 'geodesy',
  severity: 'warning',
  check(data) {
    const schemeDate = parseDate(data.executiveScheme?.date);
    const aosrDate = parseDate(data.aosr?.date);
    if (!schemeDate || !aosrDate) return { passed: true };
    const gap = Math.abs(daysBetween(schemeDate, aosrDate));
    if (gap > 3) {
      return {
        passed: false,
        message: `Разница между датой схемы и АОСР: ${gap} дней (допуск ±3 дня)`,
        affectedField: 'executiveScheme.date',
      };
    }
    return { passed: true };
  },
};

const G04: ValidationRule = {
  id: 'G04',
  name: 'Опорная точка указана',
  description: 'В исполнительной схеме должна быть указана реперная (опорная) точка',
  category: 'geodesy',
  severity: 'error',
  check(data) {
    if (!data.executiveScheme) return { passed: true };
    if (!data.executiveScheme.referencePoint?.trim()) {
      return {
        passed: false,
        message: 'Не указана реперная (опорная) точка в исполнительной схеме',
        affectedField: 'executiveScheme.referencePoint',
      };
    }
    return { passed: true };
  },
};

// ---------------------------------------------------------------------------
// Aggregated rule set
// ---------------------------------------------------------------------------

export const ITD_RULES: ValidationRule[] = [
  // Dates (10)
  D01, D02, D03, D04, D05, D06, D07, D08, D09, D10,
  // Signatures (8)
  S01, S02, S03, S04, S05, S06, S07, S08,
  // References (10)
  R01, R02, R03, R04, R05, R06, R07, R08, R09, R10,
  // Completeness (10)
  C01, C02, C03, C04, C05, C06, C07, C08, C09, C10,
  // Sequence (6)
  SEQ01, SEQ02, SEQ03, SEQ04, SEQ05, SEQ06,
  // Materials (4)
  M01, M02, M03, M04,
  // Geodesy (4)
  G01, G02, G03, G04,
];

// ---------------------------------------------------------------------------
// Validation runner
// ---------------------------------------------------------------------------

export interface ValidationResultEntry {
  rule: ValidationRule;
  result: ValidationResult;
}

export function validateItdDocument(data: ItdDocumentData): ValidationResultEntry[] {
  return ITD_RULES.map((rule) => ({
    rule,
    result: rule.check(data),
  }));
}

export interface ValidationSummary {
  errors: number;
  warnings: number;
  infos: number;
  passed: number;
  total: number;
}

export function getValidationSummary(results: ValidationResultEntry[]): ValidationSummary {
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  let passed = 0;

  for (const { rule, result } of results) {
    if (result.passed) {
      passed++;
    } else {
      switch (rule.severity) {
        case 'error':
          errors++;
          break;
        case 'warning':
          warnings++;
          break;
        case 'info':
          infos++;
          break;
      }
    }
  }

  return { errors, warnings, infos, passed, total: results.length };
}
