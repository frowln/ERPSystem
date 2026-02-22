#!/usr/bin/env python3
"""
Transform component files to use t() i18n calls.
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def ensure_t_import(content):
    """Ensure import { t } from '@/i18n' exists."""
    if "import { t } from '@/i18n'" in content:
        return content
    if "from '@/i18n'" in content:
        return content
    # Add after last import
    lines = content.split('\n')
    last_import_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    lines.insert(last_import_idx + 1, "import { t } from '@/i18n';")
    return '\n'.join(lines)

modified_files = []

# ============================================================
# RegulatoryDashboardPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/RegulatoryDashboardPage.tsx')
c = read(p)
c = ensure_t_import(c)

# complianceAlerts useMemo - dynamic strings with interpolation
c = c.replace(
    "title: `Истекает разрешение ${p.number}`",
    "title: t('regulatory.alertPermitExpiring', { number: p.number })"
)
c = c.replace(
    "description: `Срок действия истекает через ${daysLeft} дн., требуется продление.`",
    "description: t('regulatory.alertPermitExpiringDesc', { days: String(daysLeft) })"
)
c = c.replace(
    "title: `Истекает лицензия ${l.number}`",
    "title: t('regulatory.alertLicenseExpiring', { number: l.number })"
)
c = c.replace(
    "description: `Лицензия \"${l.name}\" скоро истекает.`",
    "description: t('regulatory.alertLicenseExpiringDesc', { name: l.name })"
)
c = c.replace("name: i.name ?? 'Проверка'", "name: i.name ?? t('regulatory.defaultInspectionName')")

# PageHeader
c = c.replace('title="Регуляторика и комплаенс"', "title={t('regulatory.dashboardTitle')}")
c = c.replace('subtitle="Обзор нормативного соответствия"', "subtitle={t('regulatory.dashboardSubtitle')}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Регуляторика' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.breadcrumbRegulatory') },")

# Buttons
c = c.replace(">Разрешения</Button>", ">{t('regulatory.btnPermits')}</Button>")
c = c.replace(">Лицензии</Button>", ">{t('regulatory.btnLicenses')}</Button>")
c = c.replace(">Проверки</Button>", ">{t('regulatory.btnInspections')}</Button>")

# MetricCards
c = c.replace('label="Разрешения"', "label={t('regulatory.metricPermits')}")
c = c.replace('label="Лицензии СРО"', "label={t('regulatory.metricLicensesSro')}")
c = c.replace('label="Проверки"', "label={t('regulatory.metricInspections')}")
c = c.replace('label="Требуют внимания"', "label={t('regulatory.metricAttention')}")

# Trends
c = c.replace("value: `${permits.filter(p => p.status === 'ACTIVE').length} действующих`",
              "value: t('regulatory.trendActive', { count: String(permits.filter(p => p.status === 'ACTIVE').length) })")
c = c.replace("value: `${licenses.filter(l => l.status === 'ACTIVE').length} действующих`",
              "value: t('regulatory.trendActive', { count: String(licenses.filter(l => l.status === 'ACTIVE').length) })")
c = c.replace("value: `${inspections.filter(i => i.status === 'SCHEDULED').length} запланировано`",
              "value: t('regulatory.trendScheduled', { count: String(inspections.filter(i => i.status === 'SCHEDULED').length) })")
c = c.replace("value: 'Критические'", "value: t('regulatory.trendCritical')")

# Section headers
c = c.replace(">Предупреждения комплаенса</h3>", ">{t('regulatory.complianceAlerts')}</h3>")
c = c.replace(">Срок: {formatDate(alert.dueDate)}</p>",
              ">{t('regulatory.deadlinePrefix', { date: formatDate(alert.dueDate) })}</p>")
c = c.replace(">Ближайшие события</h3>", ">{t('regulatory.upcomingEvents')}</h3>")
c = c.replace(">Сводка по проектам</h3>", ">{t('regulatory.projectSummary')}</h3>")

# Project names
c = c.replace("['ЖК \"Солнечный\"', 'Мост через р. Вятка', 'ТЦ \"Центральный\"']",
              "[t('regulatory.projectSunny'), t('regulatory.projectBridgeLabel'), t('regulatory.projectCentral')]")

# Status text
c = c.replace(">Действует</span>", ">{t('regulatory.statusActive')}</span>")

write(p, c)
modified_files.append(p)
print(f"Updated RegulatoryDashboardPage.tsx")

# ============================================================
# PermitBoardPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/PermitBoardPage.tsx')
c = read(p)
c = ensure_t_import(c)

# Convert static arrays to getter functions
c = c.replace(
    """const defaultColumns: BoardColumn[] = [
  { id: 'DRAFT', title: 'Черновик', color: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', collapsed: false },
  { id: 'SUBMITTED', title: 'Подано', color: 'bg-blue-500', headerBg: 'bg-blue-50', collapsed: false },
  { id: 'UNDER_REVIEW', title: 'На рассмотрении', color: 'bg-yellow-500', headerBg: 'bg-yellow-50', collapsed: false },
  { id: 'APPROVED', title: 'Одобрено', color: 'bg-green-500', headerBg: 'bg-green-50', collapsed: false },
  { id: 'EXPIRED', title: 'Истекло', color: 'bg-red-500', headerBg: 'bg-red-50', collapsed: false },
];""",
    """const getDefaultColumns = (): BoardColumn[] => [
  { id: 'DRAFT', title: t('regulatory.colDraft'), color: 'bg-neutral-400', headerBg: 'bg-neutral-50 dark:bg-neutral-800', collapsed: false },
  { id: 'SUBMITTED', title: t('regulatory.colSubmitted'), color: 'bg-blue-500', headerBg: 'bg-blue-50', collapsed: false },
  { id: 'UNDER_REVIEW', title: t('regulatory.colUnderReview'), color: 'bg-yellow-500', headerBg: 'bg-yellow-50', collapsed: false },
  { id: 'APPROVED', title: t('regulatory.colApproved'), color: 'bg-green-500', headerBg: 'bg-green-50', collapsed: false },
  { id: 'EXPIRED', title: t('regulatory.colExpired'), color: 'bg-red-500', headerBg: 'bg-red-50', collapsed: false },
];"""
)

c = c.replace(
    "const priorityLabels: Record<string, string> = { low: 'Низкий', normal: 'Обычный', high: 'Высокий', critical: 'Критический' };",
    "const getPriorityLabels = (): Record<string, string> => ({ low: t('regulatory.priorityLow'), normal: t('regulatory.priorityNormal'), high: t('regulatory.priorityHigh'), critical: t('regulatory.priorityCritical') });"
)

# Update usages
c = c.replace("useState<BoardColumn[]>(defaultColumns)", "useState<BoardColumn[]>(getDefaultColumns())")
c = c.replace("...defaultColumns.map((c) => ({ value: c.id, label: c.title }))", "...getDefaultColumns().map((c) => ({ value: c.id, label: c.title }))")
c = c.replace("{priorityLabels[item.priority]}", "{getPriorityLabels()[item.priority]}")

# PageHeader
c = c.replace(
    """title="Разрешения - Доска" subtitle={`${items.length} разрешений`} breadcrumbs={[{ label: 'Главная', href: '/' }, { label: 'Регулирование', href: '/regulatory/permits' }, { label: 'Доска' }]}""",
    """title={t('regulatory.permitBoardTitle')} subtitle={t('regulatory.permitBoardSubtitle', { count: String(items.length) })} breadcrumbs={[{ label: t('regulatory.breadcrumbHome'), href: '/' }, { label: t('regulatory.permitBoardBreadcrumbRegulation'), href: '/regulatory/permits' }, { label: t('regulatory.permitBoardBreadcrumbBoard') }]}"""
)

c = c.replace(">Фильтры</Button>", ">{t('regulatory.btnFilters')}</Button>")
c = c.replace(">Новое разрешение</Button>", ">{t('regulatory.btnNewPermit')}</Button>")
c = c.replace('placeholder="Поиск..."', "placeholder={t('regulatory.searchPlaceholder')}")
c = c.replace("{ value: '', label: 'Все статусы' }", "{ value: '', label: t('regulatory.allStatuses') }")
c = c.replace(">Сбросить</Button>", ">{t('regulatory.btnReset')}</Button>")
c = c.replace(">Нет разрешений</p>", ">{t('regulatory.noPermits')}</p>")
c = c.replace(">Перетащите карточку сюда</p>", ">{t('regulatory.dragHint')}</p>")
c = c.replace(">до {item.expiryDate}</span>", ">{t('regulatory.expiryPrefix', { date: item.expiryDate })}</span>")

write(p, c)
modified_files.append(p)
print(f"Updated PermitBoardPage.tsx")

# ============================================================
# PermitDetailPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/PermitDetailPage.tsx')
c = read(p)
c = ensure_t_import(c)

# Convert static objects to getter functions
c = c.replace(
    """const inspectionStatusLabels: Record<string, string> = {
  scheduled: 'Запланирована',
  in_progress: 'Проводится',
  passed: 'Пройдена',
  failed: 'Не пройдена',
  cancelled: 'Отменена',
};""",
    """const getInspectionStatusLabels = (): Record<string, string> => ({
  scheduled: t('regulatory.inspStatusScheduled'),
  in_progress: t('regulatory.inspStatusInProgress'),
  passed: t('regulatory.inspStatusPassed'),
  failed: t('regulatory.inspStatusFailed'),
  cancelled: t('regulatory.inspStatusCancelled'),
});"""
)
c = c.replace("inspectionStatusLabels[insp.status]", "getInspectionStatusLabels()[insp.status]")

c = c.replace(
    """const statusActions: Record<string, { label: string; target: string }[]> = {
  draft: [{ label: 'Подать', target: 'SUBMITTED' }],
  submitted: [{ label: 'На рассмотрении', target: 'UNDER_REVIEW' }],
  under_review: [
    { label: 'Одобрить', target: 'APPROVED' },
    { label: 'Отклонить', target: 'REJECTED' },
  ],
  approved: [{ label: 'Активировать', target: 'ACTIVE' }],
};""",
    """const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  draft: [{ label: t('regulatory.actionSubmit'), target: 'SUBMITTED' }],
  submitted: [{ label: t('regulatory.actionUnderReview'), target: 'UNDER_REVIEW' }],
  under_review: [
    { label: t('regulatory.actionApprove'), target: 'APPROVED' },
    { label: t('regulatory.actionReject'), target: 'REJECTED' },
  ],
  approved: [{ label: t('regulatory.actionActivate'), target: 'ACTIVE' }],
});"""
)
c = c.replace("statusActions[effectiveStatus]", "getStatusActions()[effectiveStatus]")

# Loading
c = c.replace(">Загрузка...</div>", ">{t('regulatory.loadingText')}</div>")

# Toast & confirm
c = c.replace("toast.success(`Статус разрешения: ${permitStatusLabels[targetStatus] ?? targetStatus}`)",
              "toast.success(t('regulatory.statusChanged', { status: permitStatusLabels[targetStatus] ?? targetStatus }))")
c = c.replace("title: 'Удалить разрешение?'", "title: t('regulatory.deletePermitTitle')")
c = c.replace("description: 'Операция необратима. Разрешение будет удалено.'", "description: t('regulatory.deletePermitDesc')")
c = c.replace("confirmLabel: 'Удалить разрешение'", "confirmLabel: t('regulatory.deletePermitConfirm')")
c = c.replace("cancelLabel: 'Отмена'", "cancelLabel: t('regulatory.deletePermitCancel')")
c = c.replace("toast.success('Разрешение удалено')", "toast.success(t('regulatory.permitDeleted'))")
c = c.replace("toast('Редактирование доступно в реестре разрешений')", "toast(t('regulatory.editToast'))")

# Breadcrumbs
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Разрешения', href: '/regulatory/permits' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.btnPermits'), href: '/regulatory/permits' },")

# Buttons
c = c.replace(">\n              Редактировать\n            </Button>", ">\n              {t('regulatory.btnEdit')}\n            </Button>")
c = c.replace(">Удалить</Button>", ">{t('regulatory.btnDelete')}</Button>")

# Section headers
c = c.replace(">Описание разрешения\n", ">{t('regulatory.sectionDescription')}\n")
c = c.replace(
    ">Условия ({p.conditions.length})\n",
    ">{t('regulatory.sectionConditions', { count: String(p.conditions.length) })}\n"
)
c = c.replace(
    ">Связанные проверки ({linkedInspections.length})\n",
    ">{t('regulatory.sectionLinkedInspections', { count: String(linkedInspections.length) })}\n"
)
c = c.replace(
    ">Связанные документы ({linkedDocuments.length})\n",
    ">{t('regulatory.sectionLinkedDocuments', { count: String(linkedDocuments.length) })}\n"
)
c = c.replace('>Детали</h3>', ">{t('regulatory.sectionDetails')}</h3>")

# InfoItem labels
c = c.replace('label="Орган выдачи"', "label={t('regulatory.labelIssuingAuthority')}")
c = c.replace('label="Дата выдачи"', "label={t('regulatory.labelIssuedDate')}")
c = c.replace('label="Срок действия до"', "label={t('regulatory.labelValidUntil')}")
c = c.replace('label="Ответственный"', "label={t('regulatory.labelResponsible')}")
c = c.replace('label="Контактное лицо"', "label={t('regulatory.labelContactPerson')}")
c = c.replace('label="Телефон"', "label={t('regulatory.labelPhone')}")

# Warning
c = c.replace(">Внимание\n", ">{t('regulatory.warningAttention')}\n")
c = c.replace(
    ">\n                Разрешение истекает через {daysUntilExpiry} дн. Необходимо начать процедуру продления.\n",
    ">\n                {t('regulatory.warningExpiringDays', { days: String(daysUntilExpiry) })}\n"
)

write(p, c)
modified_files.append(p)
print(f"Updated PermitDetailPage.tsx")

# ============================================================
# ReportingCalendarPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/ReportingCalendarPage.tsx')
c = read(p)
c = ensure_t_import(c)

# Convert static objects to getter functions
c = c.replace("const deadlineStatusLabels: Record<string, string> = {\n  upcoming: 'Предстоит',\n  due_today: 'Сегодня',\n  overdue: 'Просрочен',\n  submitted: 'Отправлен',\n  accepted: 'Принят',\n  rejected: 'Отклонён',\n};",
              "const getDeadlineStatusLabels = (): Record<string, string> => ({\n  upcoming: t('regulatory.deadlineStatusUpcoming'),\n  due_today: t('regulatory.deadlineStatusDueToday'),\n  overdue: t('regulatory.deadlineStatusOverdue'),\n  submitted: t('regulatory.deadlineStatusSubmitted'),\n  accepted: t('regulatory.deadlineStatusAccepted'),\n  rejected: t('regulatory.deadlineStatusRejected'),\n});")
c = c.replace("deadlineStatusLabels[getValue<string>()]", "getDeadlineStatusLabels()[getValue<string>()]")

c = c.replace("const frequencyLabels: Record<string, string> = {\n  daily: 'Ежедневно',\n  weekly: 'Еженедельно',\n  monthly: 'Ежемесячно',\n  quarterly: 'Ежеквартально',\n  annually: 'Ежегодно',\n  one_time: 'Разово',\n};",
              "const getFrequencyLabels = (): Record<string, string> => ({\n  daily: t('regulatory.freqDaily'),\n  weekly: t('regulatory.freqWeekly'),\n  monthly: t('regulatory.freqMonthly'),\n  quarterly: t('regulatory.freqQuarterly'),\n  annually: t('regulatory.freqAnnually'),\n  one_time: t('regulatory.freqOneTime'),\n});")
c = c.replace("frequencyLabels[getValue<string>()]", "getFrequencyLabels()[getValue<string>()]")

c = c.replace("const channelLabels: Record<string, string> = {\n  portal: 'Портал',\n  email: 'Email',\n  paper: 'Бумажный',\n  edo: 'ЭДО',\n  api: 'API',\n};",
              "const getChannelLabels = (): Record<string, string> => ({\n  portal: t('regulatory.channelPortal'),\n  email: t('regulatory.channelEmail'),\n  paper: t('regulatory.channelPaper'),\n  edo: t('regulatory.channelEdo'),\n  api: t('regulatory.channelApi'),\n});")
c = c.replace("channelLabels[getValue<string>()]", "getChannelLabels()[getValue<string>()]")

c = c.replace("const frequencyFilterOptions = [\n  { value: '', label: 'Все периодичности' },\n  { value: 'DAILY', label: 'Ежедневно' },\n  { value: 'WEEKLY', label: 'Еженедельно' },\n  { value: 'MONTHLY', label: 'Ежемесячно' },\n  { value: 'QUARTERLY', label: 'Ежеквартально' },\n  { value: 'ANNUALLY', label: 'Ежегодно' },\n  { value: 'ONE_TIME', label: 'Разово' },\n];",
              "const getFrequencyFilterOptions = () => [\n  { value: '', label: t('regulatory.freqFilterAll') },\n  { value: 'DAILY', label: t('regulatory.freqDaily') },\n  { value: 'WEEKLY', label: t('regulatory.freqWeekly') },\n  { value: 'MONTHLY', label: t('regulatory.freqMonthly') },\n  { value: 'QUARTERLY', label: t('regulatory.freqQuarterly') },\n  { value: 'ANNUALLY', label: t('regulatory.freqAnnually') },\n  { value: 'ONE_TIME', label: t('regulatory.freqOneTime') },\n];")
c = c.replace("options={frequencyFilterOptions}", "options={getFrequencyFilterOptions()}")

# Column headers
c = c.replace("header: 'Отчёт',", "header: t('regulatory.colReport'),")
c = c.replace("header: 'Статус',", "header: t('regulatory.colStatus'),")
c = c.replace("header: 'Периодичность',", "header: t('regulatory.colFrequency'),")
c = c.replace("header: 'Срок сдачи',", "header: t('regulatory.colDueDate'),")
c = c.replace("header: 'Ответственный',", "header: t('regulatory.colResponsible'),")
c = c.replace("header: 'Канал',", "header: t('regulatory.colChannel'),")
c = c.replace("header: 'Штраф',", "header: t('regulatory.colFine'),")
c = c.replace("header: 'Следующий срок',", "header: t('regulatory.colNextDueDate'),")

# PageHeader
c = c.replace('title="Календарь отчётности"', "title={t('regulatory.calendarTitle')}")
c = c.replace("subtitle={`${deadlines.length} отчётных сроков`}", "subtitle={t('regulatory.calendarSubtitle', { count: String(deadlines.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Регуляторика', href: '/regulatory' },\n          { label: 'Календарь отчётности' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },\n          { label: t('regulatory.breadcrumbCalendar') },")
c = c.replace(">Добавить срок</Button>", ">{t('regulatory.btnAddDeadline')}</Button>")

# Tabs
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'UPCOMING', label: 'Предстоящие', count: tabCounts.upcoming },\n          { id: 'OVERDUE', label: 'Просроченные', count: tabCounts.overdue },\n          { id: 'SUBMITTED', label: 'Отправленные', count: tabCounts.submitted },\n          { id: 'ACCEPTED', label: 'Принятые', count: tabCounts.accepted },",
              "{ id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },\n          { id: 'UPCOMING', label: t('regulatory.tabUpcoming'), count: tabCounts.upcoming },\n          { id: 'OVERDUE', label: t('regulatory.tabOverdue'), count: tabCounts.overdue },\n          { id: 'SUBMITTED', label: t('regulatory.tabSubmitted'), count: tabCounts.submitted },\n          { id: 'ACCEPTED', label: t('regulatory.tabAccepted'), count: tabCounts.accepted },")

# MetricCards
c = c.replace('label="Всего сроков"', "label={t('regulatory.metricTotalDeadlines')}")
c = c.replace('label="Просрочено"', "label={t('regulatory.metricOverdue')}")
c = c.replace('label="Сегодня"', "label={t('regulatory.metricToday')}")
c = c.replace('label="Возможные штрафы"', "label={t('regulatory.metricPotentialFines')}")
c = c.replace("value: 'Срочно!'", "value: t('regulatory.trendUrgent')")
c = c.replace("value: 'Все в срок'", "value: t('regulatory.trendAllOnTime')")
c = c.replace("value: 'Внимание'", "value: t('regulatory.trendAttention')")
c = c.replace("value: 'Нет'", "value: t('regulatory.trendNone')")

# Search placeholder
c = c.replace('placeholder="Поиск по отчёту, органу, ответственному..."', "placeholder={t('regulatory.searchReportPlaceholder')}")

# Empty state
c = c.replace('emptyTitle="Нет отчётных сроков"', "emptyTitle={t('regulatory.emptyDeadlines')}")
c = c.replace('emptyDescription="Добавьте сроки сдачи отчётности для контроля"', "emptyDescription={t('regulatory.emptyDeadlinesDesc')}")

write(p, c)
modified_files.append(p)
print(f"Updated ReportingCalendarPage.tsx")

# ============================================================
# PermitsPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/PermitsPage.tsx')
c = read(p)
c = ensure_t_import(c)

# Type filter options
c = c.replace("const typeFilterOptions = [\n  { value: '', label: 'Все типы' },\n  { value: 'BUILDING_PERMIT', label: 'Разрешение на строительство' },\n  { value: 'EXCAVATION_PERMIT', label: 'Земляные работы' },\n  { value: 'ROSTECHNADZOR', label: 'Ростехнадзор' },\n  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },\n  { value: 'ENVIRONMENTAL_PERMIT', label: 'Экологическое' },\n  { value: 'SANITARY', label: 'Санитарное' },\n];",
              "const getTypeFilterOptions = () => [\n  { value: '', label: t('regulatory.typeFilterAll') },\n  { value: 'BUILDING_PERMIT', label: t('regulatory.typeBuildingPermit') },\n  { value: 'EXCAVATION_PERMIT', label: t('regulatory.typeExcavation') },\n  { value: 'ROSTECHNADZOR', label: t('regulatory.typeRostechnadzor') },\n  { value: 'FIRE_SAFETY', label: t('regulatory.typeFireSafety') },\n  { value: 'ENVIRONMENTAL_PERMIT', label: t('regulatory.typeEnvironmental') },\n  { value: 'SANITARY', label: t('regulatory.typeSanitary') },\n];")
c = c.replace("options={typeFilterOptions}", "options={getTypeFilterOptions()}")

# Column headers
c = c.replace("header: '\\u2116',", "header: t('regulatory.colNumber'),")
c = c.replace("header: 'Наименование',", "header: t('regulatory.colName'),")
c = c.replace("header: 'Тип',", "header: t('regulatory.colType'),")
c = c.replace("header: 'Статус',", "header: t('regulatory.colStatus'),")
c = c.replace("header: 'Действует до',", "header: t('regulatory.colValidUntil'),")
c = c.replace("header: 'Ответственный',", "header: t('regulatory.colResponsible'),")

# PageHeader
c = c.replace('title="Разрешения и допуски"', "title={t('regulatory.permitsTitle')}")
c = c.replace("subtitle={`${permits.length} разрешений в системе`}", "subtitle={t('regulatory.permitsSubtitle', { count: String(permits.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Регуляторика', href: '/regulatory' },\n          { label: 'Разрешения' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },\n          { label: t('regulatory.btnPermits') },")
c = c.replace(">Новое разрешение\n          </Button>", ">{t('regulatory.btnNewPermitFull')}\n          </Button>")
# Tabs
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'ACTIVE', label: 'Действующие', count: tabCounts.active },\n          { id: 'PENDING', label: 'На рассмотрении', count: tabCounts.pending },\n          { id: 'EXPIRED', label: 'Истекшие', count: tabCounts.expired },",
              "{ id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },\n          { id: 'ACTIVE', label: t('regulatory.tabActive'), count: tabCounts.active },\n          { id: 'PENDING', label: t('regulatory.tabPending'), count: tabCounts.pending },\n          { id: 'EXPIRED', label: t('regulatory.tabExpired'), count: tabCounts.expired },")
# MetricCards
c = c.replace('label="Всего разрешений"', "label={t('regulatory.metricTotalPermits')}")
c = c.replace('label="Действующие"', "label={t('regulatory.metricActive')}")
c = c.replace('label="Истекают в 90 дней"', "label={t('regulatory.metricExpiring90')}")
c = c.replace('label="Истекшие"', "label={t('regulatory.metricExpired')}")
c = c.replace("value: 'Требуют продления'", "value: t('regulatory.trendNeedRenewal')")
c = c.replace("value: 'Требуют обновления'", "value: t('regulatory.trendNeedUpdate')")
# Search
c = c.replace('placeholder="Поиск по номеру, названию..."', "placeholder={t('regulatory.searchPermitPlaceholder')}")
# Empty
c = c.replace('emptyTitle="Нет разрешений"', "emptyTitle={t('regulatory.emptyPermits')}")
c = c.replace('emptyDescription="Добавьте первое разрешение для начала учёта"', "emptyDescription={t('regulatory.emptyPermitsDesc')}")

write(p, c)
modified_files.append(p)
print(f"Updated PermitsPage.tsx")

# ============================================================
# InspectionsPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/InspectionsPage.tsx')
c = read(p)
c = ensure_t_import(c)

c = c.replace("const typeFilterOptions = [\n  { value: '', label: 'Все типы' },\n  { value: 'ROSTECHNADZOR', label: 'Ростехнадзор' },\n  { value: 'FIRE_INSPECTION', label: 'Пожарная инспекция' },\n  { value: 'SANITARY', label: 'Роспотребнадзор' },\n  { value: 'ENVIRONMENTAL', label: 'Экологическая' },\n  { value: 'INTERNAL_AUDIT', label: 'Внутренний аудит' },\n  { value: 'CUSTOMER_INSPECTION', label: 'Инспекция заказчика' },\n];",
              "const getTypeFilterOptions = () => [\n  { value: '', label: t('regulatory.inspTypeFilterAll') },\n  { value: 'ROSTECHNADZOR', label: t('regulatory.inspTypeRostechnadzor') },\n  { value: 'FIRE_INSPECTION', label: t('regulatory.inspTypeFireInspection') },\n  { value: 'SANITARY', label: t('regulatory.inspTypeSanitary') },\n  { value: 'ENVIRONMENTAL', label: t('regulatory.inspTypeEnvironmental') },\n  { value: 'INTERNAL_AUDIT', label: t('regulatory.inspTypeInternalAudit') },\n  { value: 'CUSTOMER_INSPECTION', label: t('regulatory.inspTypeCustomerInspection') },\n];")
c = c.replace("options={typeFilterOptions}", "options={getTypeFilterOptions()}")

c = c.replace("header: '\\u2116',", "header: t('regulatory.colNumber'),")
c = c.replace("header: 'Проверка',", "header: t('regulatory.colInspection'),")
c = c.replace("header: 'Тип',", "header: t('regulatory.colType'),")
c = c.replace("header: 'Статус',", "header: t('regulatory.colStatus'),")
c = c.replace("header: 'Результат',", "header: t('regulatory.colResult'),")
c = c.replace("header: 'Дата',", "header: t('regulatory.colDate'),")
c = c.replace("header: 'Организация',", "header: t('regulatory.colOrganization'),")

c = c.replace('title="Проверки и инспекции"', "title={t('regulatory.inspectionsTitle')}")
c = c.replace("subtitle={`${inspections.length} проверок в системе`}", "subtitle={t('regulatory.inspectionsSubtitle', { count: String(inspections.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Регуляторика', href: '/regulatory' },\n          { label: 'Проверки' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },\n          { label: t('regulatory.btnInspections') },")
c = c.replace(">Запланировать проверку\n          </Button>", ">{t('regulatory.btnScheduleInspection')}\n          </Button>")
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'SCHEDULED', label: 'Запланированные', count: tabCounts.scheduled },\n          { id: 'PASSED', label: 'Пройденные', count: tabCounts.passed },\n          { id: 'FAILED', label: 'Не пройденные', count: tabCounts.failed },",
              "{ id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },\n          { id: 'SCHEDULED', label: t('regulatory.tabScheduled'), count: tabCounts.scheduled },\n          { id: 'PASSED', label: t('regulatory.tabPassed'), count: tabCounts.passed },\n          { id: 'FAILED', label: t('regulatory.tabFailed'), count: tabCounts.failed },")
c = c.replace('label="Всего проверок"', "label={t('regulatory.metricTotalInspections')}")
c = c.replace('label="Запланировано"', "label={t('regulatory.metricScheduledCount')}")
c = c.replace('label="Пройдено"', "label={t('regulatory.metricPassedCount')}")
c = c.replace('label="Не пройдено"', "label={t('regulatory.metricFailedCount')}")
c = c.replace("value: 'Требуют корр. мер'", "value: t('regulatory.trendNeedCorrective')")
c = c.replace('placeholder="Поиск по номеру, названию..."', "placeholder={t('regulatory.searchInspectionPlaceholder')}")
c = c.replace('emptyTitle="Нет проверок"', "emptyTitle={t('regulatory.emptyInspections')}")
c = c.replace('emptyDescription="Запланируйте первую проверку или инспекцию"', "emptyDescription={t('regulatory.emptyInspectionsDesc')}")

write(p, c)
modified_files.append(p)
print(f"Updated InspectionsPage.tsx")

# ============================================================
# LicensesPage.tsx
# ============================================================
p = os.path.join(SRC, 'modules/regulatory/LicensesPage.tsx')
c = read(p)
c = ensure_t_import(c)

c = c.replace("const licenseTypeLabels: Record<string, string> = {\n  sro_construction: 'СРО Строительство',\n  sro_design: 'СРО Проектирование',\n  sro_engineering: 'СРО Инженерные изыскания',\n  special_permit: 'Спецразрешение',\n  other: 'Прочее',\n};",
              "const getLicenseTypeLabels = (): Record<string, string> => ({\n  sro_construction: t('regulatory.licTypeSroConstruction'),\n  sro_design: t('regulatory.licTypeSroDesign'),\n  sro_engineering: t('regulatory.licTypeSroEngineering'),\n  special_permit: t('regulatory.licTypeSpecialPermit'),\n  other: t('regulatory.licTypeOther'),\n});")
c = c.replace("licenseTypeLabels[getValue<string>()]", "getLicenseTypeLabels()[getValue<string>()]")

c = c.replace("header: '\\u2116',", "header: t('regulatory.colNumber'),")
c = c.replace("header: 'Наименование',", "header: t('regulatory.colName'),")
c = c.replace("header: 'Тип',", "header: t('regulatory.colType'),")
c = c.replace("header: 'Статус',", "header: t('regulatory.colStatus'),")
c = c.replace("header: 'Действует до',", "header: t('regulatory.colValidUntil'),")
c = c.replace("header: 'Макс. сумма договора',", "header: t('regulatory.colMaxContractAmount'),")
c = c.replace("header: 'Ответственный',", "header: t('regulatory.colResponsible'),")

c = c.replace('title="Лицензии и допуски СРО"', "title={t('regulatory.licensesTitle')}")
c = c.replace("subtitle={`${licenses.length} лицензий в системе`}", "subtitle={t('regulatory.licensesSubtitle', { count: String(licenses.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Регуляторика', href: '/regulatory' },\n          { label: 'Лицензии' },",
              "{ label: t('regulatory.breadcrumbHome'), href: '/' },\n          { label: t('regulatory.breadcrumbRegulatory'), href: '/regulatory' },\n          { label: t('regulatory.btnLicenses') },")
c = c.replace(">Добавить лицензию\n          </Button>", ">{t('regulatory.btnAddLicense')}\n          </Button>")
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'ACTIVE', label: 'Действующие', count: tabCounts.active },\n          { id: 'EXPIRING_SOON', label: 'Истекающие', count: tabCounts.expiring_soon },\n          { id: 'EXPIRED', label: 'Истекшие', count: tabCounts.expired },",
              "{ id: 'all', label: t('regulatory.tabAll'), count: tabCounts.all },\n          { id: 'ACTIVE', label: t('regulatory.metricActiveLicenses'), count: tabCounts.active },\n          { id: 'EXPIRING_SOON', label: t('regulatory.tabExpiringSoon'), count: tabCounts.expiring_soon },\n          { id: 'EXPIRED', label: t('regulatory.tabExpired'), count: tabCounts.expired },")
c = c.replace('label="Всего лицензий"', "label={t('regulatory.metricTotalLicenses')}")
c = c.replace('label="Действующие"', "label={t('regulatory.metricActiveLicenses')}")
c = c.replace('label="Истекающие"', "label={t('regulatory.metricExpiringLicenses')}")
c = c.replace('label="Истекшие"', "label={t('regulatory.metricExpiredLicenses')}")
c = c.replace("value: 'Требуют продления'", "value: t('regulatory.trendNeedRenewal')")
c = c.replace('placeholder="Поиск по номеру, названию, организации..."', "placeholder={t('regulatory.searchLicensePlaceholder')}")
c = c.replace('emptyTitle="Нет лицензий"', "emptyTitle={t('regulatory.emptyLicenses')}")
c = c.replace('emptyDescription="Добавьте первую лицензию или допуск СРО"', "emptyDescription={t('regulatory.emptyLicensesDesc')}")

write(p, c)
modified_files.append(p)
print(f"Updated LicensesPage.tsx")

# ============================================================
# Now handle punchlist and support files similarly
# Due to the large size, I'll handle them with targeted replacements
# ============================================================

# PunchlistBoardPage.tsx
p = os.path.join(SRC, 'modules/punchlist/PunchlistBoardPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const defaultColumns: BoardColumn[] = [\n  { id: 'OPEN', title: 'Открыт',", "const getDefaultColumns = (): BoardColumn[] => [\n  { id: 'OPEN', title: t('punchlist.colOpen'),")
c = c.replace("title: 'В работе',", "title: t('punchlist.colInProgress'),")
c = c.replace("title: 'На проверке',", "title: t('punchlist.colReadyForReview'),")
c = c.replace("title: 'Закрыт',", "title: t('punchlist.colClosed'),")
c = c.replace("const priorityLabels: Record<string, string> = { low: 'Низкий', normal: 'Обычный', high: 'Высокий', critical: 'Критический' };",
              "const getPriorityLabels = (): Record<string, string> => ({ low: t('punchlist.priorityLow'), normal: t('punchlist.priorityNormal'), high: t('punchlist.priorityHigh'), critical: t('punchlist.priorityCritical') });")
c = c.replace("useState<BoardColumn[]>(defaultColumns)", "useState<BoardColumn[]>(getDefaultColumns())")
c = c.replace("...defaultColumns.map((c) => ({ value: c.id, label: c.title }))", "...getDefaultColumns().map((c) => ({ value: c.id, label: c.title }))")
c = c.replace("{priorityLabels[item.priority]}", "{getPriorityLabels()[item.priority]}")
c = c.replace('title="Пунчлист - Доска"', "title={t('punchlist.boardTitle')}")
c = c.replace("subtitle={`${items.length} замечаний`}", "subtitle={t('punchlist.boardSubtitle', { count: String(items.length) })}")
c = c.replace("{ label: 'Главная', href: '/' }, { label: 'Пунчлист', href: '/punchlist/items' }, { label: 'Доска' }",
              "{ label: t('punchlist.breadcrumbHome'), href: '/' }, { label: t('punchlist.breadcrumbPunchlist'), href: '/punchlist/items' }, { label: t('punchlist.breadcrumbBoard') }")
c = c.replace(">Фильтры</Button>", ">{t('punchlist.btnFilters')}</Button>")
c = c.replace(">Новое замечание</Button>", ">{t('punchlist.btnNewItem')}</Button>")
c = c.replace('placeholder="Поиск..."', "placeholder={t('punchlist.searchPlaceholder')}")
c = c.replace("{ value: '', label: 'Все статусы' }", "{ value: '', label: t('punchlist.allStatuses') }")
c = c.replace(">Сбросить</Button>", ">{t('punchlist.btnReset')}</Button>")
c = c.replace(">Нет замечаний</p>", ">{t('punchlist.noItems')}</p>")
c = c.replace(">Перетащите карточку сюда</p>", ">{t('punchlist.dragHint')}</p>")
write(p, c)
modified_files.append(p)
print(f"Updated PunchlistBoardPage.tsx")

# PunchlistDashboardPage.tsx
p = os.path.join(SRC, 'modules/punchlist/PunchlistDashboardPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace('title="Панель Punch List"', "title={t('punchlist.dashboardTitle')}")
c = c.replace('subtitle="Сводка по перечням замечаний"', "subtitle={t('punchlist.dashboardSubtitle')}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Punch List' },", "{ label: t('punchlist.breadcrumbHome'), href: '/' },\n          { label: t('punchlist.breadcrumbPunchList') },")
c = c.replace(">Все замечания\n            </Button>", ">{t('punchlist.btnAllItems')}\n            </Button>")
c = c.replace(">Новый перечень\n            </Button>", ">{t('punchlist.btnNewList')}\n            </Button>")
c = c.replace('label="Всего замечаний"', "label={t('punchlist.metricTotalItems')}")
c = c.replace('label="Открытые"', "label={t('punchlist.metricOpenItems')}")
c = c.replace('label="Закрытые"', "label={t('punchlist.metricClosedItems')}")
c = c.replace('label="Общая готовность"', "label={t('punchlist.metricOverallCompletion')}")
c = c.replace("value: `${totalOpen} шт.`", "value: t('punchlist.trendItemsCount', { count: String(totalOpen) })")
c = c.replace(">Перечни замечаний</h3>", ">{t('punchlist.sectionPunchLists')}</h3>")
c = c.replace(">Последние замечания</h3>", ">{t('punchlist.sectionRecentItems')}</h3>")
c = c.replace(">По категориям</h3>", ">{t('punchlist.sectionByCategory')}</h3>")
c = c.replace(">Предупреждения</h3>", ">{t('punchlist.sectionAlerts')}</h3>")
c = c.replace(">Все замечания\n              </Button>", ">{t('punchlist.btnAllItems')}\n              </Button>")
c = c.replace("<span>Всего: {pl.totalItems}</span>", "<span>{t('punchlist.plTotal', { count: String(pl.totalItems) })}</span>")
c = c.replace("<span>Открыто: {pl.openItems}</span>", "<span>{t('punchlist.plOpenCount', { count: String(pl.openItems) })}</span>")
c = c.replace("<span>Закрыто: {pl.closedItems}</span>", "<span>{t('punchlist.plClosedCount', { count: String(pl.closedItems) })}</span>")
c = c.replace("<span className=\"tabular-nums\">Срок: {formatDate(pl.dueDate)}</span>", "<span className=\"tabular-nums\">{t('punchlist.plDueDate', { date: formatDate(pl.dueDate) })}</span>")
c = c.replace("<span className=\"text-xs text-neutral-500 dark:text-neutral-400\">{cat.open + cat.closed} шт.</span>", "<span className=\"text-xs text-neutral-500 dark:text-neutral-400\">{t('punchlist.catItemsCount', { count: String(cat.open + cat.closed) })}</span>")
c = c.replace("<span>Открыто: {cat.open}</span>", "<span>{t('punchlist.catOpen', { count: String(cat.open) })}</span>")
c = c.replace("<span>Закрыто: {cat.closed}</span>", "<span>{t('punchlist.catClosed', { count: String(cat.closed) })}</span>")
c = c.replace(">2 критических замечания</p>", ">{t('punchlist.alertCritical', { count: '2' })}</p>")
c = c.replace(">PI-003, PI-005 требуют срочного устранения</p>", ">{t('punchlist.alertCriticalDesc')}</p>")
c = c.replace(">1 замечание просрочено</p>", ">{t('punchlist.alertOverdue', { count: '1' })}</p>")
c = c.replace(">PI-003 -- срок истёк 14.02.2026</p>", ">{t('punchlist.alertOverdueDesc')}</p>")
write(p, c)
modified_files.append(p)
print(f"Updated PunchlistDashboardPage.tsx")

# PunchlistItemsPage.tsx
p = os.path.join(SRC, 'modules/punchlist/PunchlistItemsPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const priorityFilterOptions = [\n  { value: '', label: 'Все приоритеты' },\n  { value: 'LOW', label: 'Низкий' },\n  { value: 'MEDIUM', label: 'Средний' },\n  { value: 'HIGH', label: 'Высокий' },\n  { value: 'CRITICAL', label: 'Критический' },\n];",
              "const getPriorityFilterOptions = () => [\n  { value: '', label: t('punchlist.priorityFilterAll') },\n  { value: 'LOW', label: t('punchlist.priorityLow') },\n  { value: 'MEDIUM', label: t('punchlist.priorityMedium') },\n  { value: 'HIGH', label: t('punchlist.priorityHigh') },\n  { value: 'CRITICAL', label: t('punchlist.priorityCritical') },\n];")
c = c.replace("const categoryFilterOptions = [\n  { value: '', label: 'Все категории' },\n  { value: 'STRUCTURAL', label: 'Конструктивные' },\n  { value: 'ARCHITECTURAL', label: 'Архитектурные' },\n  { value: 'ELECTRICAL', label: 'Электрика' },\n  { value: 'PLUMBING', label: 'Водоснабжение' },\n  { value: 'FINISHING', label: 'Отделочные' },\n  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },\n];",
              "const getCategoryFilterOptions = () => [\n  { value: '', label: t('punchlist.categoryFilterAll') },\n  { value: 'STRUCTURAL', label: t('punchlist.catStructural') },\n  { value: 'ARCHITECTURAL', label: t('punchlist.catArchitectural') },\n  { value: 'ELECTRICAL', label: t('punchlist.catElectrical') },\n  { value: 'PLUMBING', label: t('punchlist.catPlumbing') },\n  { value: 'FINISHING', label: t('punchlist.catFinishing') },\n  { value: 'FIRE_SAFETY', label: t('punchlist.catFireSafety') },\n];")
c = c.replace("options={priorityFilterOptions}", "options={getPriorityFilterOptions()}")
c = c.replace("options={categoryFilterOptions}", "options={getCategoryFilterOptions()}")
c = c.replace("header: '\\u2116',", "header: t('punchlist.colStatus'),".replace('colStatus', 'colDueDate').replace('colDueDate', 'colStatus') if False else "header: t('regulatory.colNumber'),")
# Fix: use specific column headers
c = c.replace("header: 'Замечание',", "header: t('punchlist.colItem'),")
c = c.replace("header: 'Категория',", "header: t('punchlist.colCategory'),")
c = c.replace("header: 'Статус',", "header: t('punchlist.colStatus'),")
c = c.replace("header: 'Приоритет',", "header: t('punchlist.colPriority'),")
c = c.replace("header: 'Исполнитель',", "header: t('punchlist.colAssignee'),")
c = c.replace("header: 'Срок',", "header: t('punchlist.colDueDate'),")
c = c.replace('title="Замечания (Punch List)"', "title={t('punchlist.itemsTitle')}")
c = c.replace("subtitle={`${items.length} замечаний в системе`}", "subtitle={t('punchlist.itemsSubtitle', { count: String(items.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Punch List', href: '/punchlist' },\n          { label: 'Замечания' },", "{ label: t('punchlist.breadcrumbHome'), href: '/' },\n          { label: t('punchlist.breadcrumbPunchList'), href: '/punchlist' },\n          { label: t('punchlist.breadcrumbItems') },")
c = c.replace(">Новое замечание\n          </Button>", ">{t('punchlist.btnNewItem')}\n          </Button>")
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },\n          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },\n          { id: 'REVIEW', label: 'На проверке', count: tabCounts.review },\n          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },",
              "{ id: 'all', label: t('punchlist.tabAll'), count: tabCounts.all },\n          { id: 'OPEN', label: t('punchlist.tabOpen'), count: tabCounts.open },\n          { id: 'IN_PROGRESS', label: t('punchlist.tabInProgress'), count: tabCounts.in_progress },\n          { id: 'REVIEW', label: t('punchlist.tabReview'), count: tabCounts.review },\n          { id: 'CLOSED', label: t('punchlist.tabClosed'), count: tabCounts.closed },")
c = c.replace('label="Всего замечаний"', "label={t('punchlist.metricTotalItems')}")
c = c.replace('label="Открытые"', "label={t('punchlist.metricOpenItems')}")
c = c.replace('label="Критические"', "label={t('punchlist.metricCritical')}")
c = c.replace("value: 'Требуют внимания'", "value: t('punchlist.trendNeedAttention')")
c = c.replace('label="Закрытые"', "label={t('punchlist.metricClosedItems')}")
c = c.replace('placeholder="Поиск по номеру, описанию, месту..."', "placeholder={t('punchlist.searchItemPlaceholder')}")
c = c.replace('emptyTitle="Нет замечаний"', "emptyTitle={t('punchlist.emptyItems')}")
c = c.replace('emptyDescription="Создайте первое замечание для начала работы"', "emptyDescription={t('punchlist.emptyItemsDesc')}")
write(p, c)
modified_files.append(p)
print(f"Updated PunchlistItemsPage.tsx")

# PunchlistItemDetailPage.tsx
p = os.path.join(SRC, 'modules/punchlist/PunchlistItemDetailPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("action: 'Замечание создано',", "action: t('punchlist.historyCreated'),")
c = c.replace("action: 'Обновлено',", "action: t('punchlist.historyUpdated'),")
c = c.replace("action: 'Принято',", "action: t('punchlist.historyApproved'),")
c = c.replace(">Взять в работу\n", ">{t('punchlist.btnTakeToWork')}\n")
c = c.replace(">На проверку\n", ">{t('punchlist.btnSendForReview')}\n")
c = c.replace(">Отклонить\n", ">{t('punchlist.btnReject')}\n")
c = c.replace(">Принять\n", ">{t('punchlist.btnAccept')}\n")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Punch List', href: '/punchlist' },\n          { label: 'Замечания', href: '/punchlist/items' },",
              "{ label: t('punchlist.breadcrumbHome'), href: '/' },\n          { label: t('punchlist.breadcrumbPunchList'), href: '/punchlist' },\n          { label: t('punchlist.breadcrumbItems'), href: '/punchlist/items' },")
c = c.replace(">Назад\n", ">{t('punchlist.btnBack')}\n")
c = c.replace(">Описание замечания</h3>", ">{t('punchlist.sectionDescription')}</h3>")
c = c.replace(">Категория</p>", ">{t('punchlist.labelCategory')}</p>", 1)
c = c.replace(">Приоритет</p>", ">{t('punchlist.labelPriority')}</p>", 1)
c = c.replace(">Статус</p>", ">{t('punchlist.labelStatus')}</p>", 1)
c = c.replace(">Punch List</p>", ">{t('punchlist.labelPunchList')}</p>")
c = c.replace(">Расположение</h3>", ">{t('punchlist.sectionLocation')}</h3>")
c = c.replace(">Проект</p>", ">{t('punchlist.labelProject')}</p>")
c = c.replace(">Полное расположение</p>", ">{t('punchlist.labelFullLocation')}</p>")
c = c.replace(">Этаж</p>", ">{t('punchlist.labelFloor')}</p>")
c = c.replace(">Помещение</p>", ">{t('punchlist.labelRoom')}</p>")
c = c.replace(">Примечания</h3>", ">{t('punchlist.sectionNotes')}</h3>")
c = c.replace(">История</h3>", ">{t('punchlist.sectionHistory')}</h3>")
c = c.replace(">Ответственные</h3>", ">{t('punchlist.sectionResponsible')}</h3>")
c = c.replace(">Исполнитель</p>", ">{t('punchlist.labelAssigneePerson')}</p>")
c = c.replace(">Автор</p>", ">{t('punchlist.labelAuthor')}</p>")
c = c.replace(">Принял</p>", ">{t('punchlist.labelApprovedBy')}</p>")
c = c.replace(">Сроки</h3>", ">{t('punchlist.sectionDeadlines')}</h3>")
c = c.replace(">Срок устранения</span>", ">{t('punchlist.labelDueDate')}</span>")
c = c.replace(">Устранено</span>", ">{t('punchlist.labelCompletedDate')}</span>")
c = c.replace(">Принято</span>", ">{t('punchlist.labelApprovedDate')}</span>")
c = c.replace(">Создано</span>", ">{t('punchlist.labelCreatedDate')}</span>")
c = c.replace(">Фотографии</h3>", ">{t('punchlist.sectionPhotos')}</h3>")
c = c.replace(">Фотографии не прикреплены</p>", ">{t('punchlist.noPhotos')}</p>")
c = c.replace(">Добавить фото\n", ">{t('punchlist.btnAddPhoto')}\n")
write(p, c)
modified_files.append(p)
print(f"Updated PunchlistItemDetailPage.tsx")

# PunchListItemFormPage.tsx - already mostly i18n-ized, just fix remaining
p = os.path.join(SRC, 'modules/punchlist/PunchListItemFormPage.tsx')
c = read(p)
# Project options have hardcoded Russian
c = c.replace("{ value: '1', label: 'ЖК \"Солнечный\"' },", "{ value: '1', label: t('regulatory.projectSunny') },")
c = c.replace("{ value: '2', label: 'БЦ \"Горизонт\"' },", "{ value: '2', label: 'БЦ \"Горизонт\"' },")  # keep as is - it's a proper name
c = c.replace("{ value: '3', label: 'Мост через р. Вятка' },", "{ value: '3', label: t('regulatory.projectBridgeLabel') },")
c = c.replace("{ value: '6', label: 'ТЦ \"Центральный\"' },", "{ value: '6', label: t('regulatory.projectCentral') },")
write(p, c)
modified_files.append(p)
print(f"Updated PunchListItemFormPage.tsx")

# PunchItemCreateModal.tsx
p = os.path.join(SRC, 'modules/punchlist/PunchItemCreateModal.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const priorityOptions = [\n  { value: 'LOW', label: 'Низкий' },\n  { value: 'MEDIUM', label: 'Средний' },\n  { value: 'HIGH', label: 'Высокий' },\n  { value: 'CRITICAL', label: 'Критический' },\n];",
              "const getPriorityOptions = () => [\n  { value: 'LOW', label: t('punchlist.priorityLow') },\n  { value: 'MEDIUM', label: t('punchlist.priorityMedium') },\n  { value: 'HIGH', label: t('punchlist.priorityHigh') },\n  { value: 'CRITICAL', label: t('punchlist.priorityCritical') },\n];")
c = c.replace("const categoryOptions = [\n  { value: 'STRUCTURAL', label: 'Конструктивные' },\n  { value: 'ARCHITECTURAL', label: 'Архитектурные' },\n  { value: 'MECHANICAL', label: 'Механические' },\n  { value: 'ELECTRICAL', label: 'Электрика' },\n  { value: 'PLUMBING', label: 'Водоснабжение' },\n  { value: 'FINISHING', label: 'Отделочные' },\n  { value: 'FIRE_SAFETY', label: 'Пожарная безопасность' },\n  { value: 'LANDSCAPING', label: 'Благоустройство' },\n  { value: 'OTHER', label: 'Прочее' },\n];",
              "const getCategoryOptions = () => [\n  { value: 'STRUCTURAL', label: t('punchlist.catStructural') },\n  { value: 'ARCHITECTURAL', label: t('punchlist.catArchitectural') },\n  { value: 'MECHANICAL', label: t('punchlist.catMechanical') },\n  { value: 'ELECTRICAL', label: t('punchlist.catElectrical') },\n  { value: 'PLUMBING', label: t('punchlist.catPlumbing') },\n  { value: 'FINISHING', label: t('punchlist.catFinishing') },\n  { value: 'FIRE_SAFETY', label: t('punchlist.catFireSafety') },\n  { value: 'LANDSCAPING', label: t('punchlist.catLandscaping') },\n  { value: 'OTHER', label: t('punchlist.catOther') },\n];")
c = c.replace("const punchListOptions = [\n  { value: 'pl1', label: 'Замечания по секции А' },\n  { value: 'pl2', label: 'Замечания по паркингу' },\n  { value: 'pl3', label: 'Замечания по благоустройству' },\n];",
              "const getPunchListOptions = () => [\n  { value: 'pl1', label: t('punchlist.listSectionA') },\n  { value: 'pl2', label: t('punchlist.listParking') },\n  { value: 'pl3', label: t('punchlist.listLandscaping') },\n];")
c = c.replace("options={priorityOptions}", "options={getPriorityOptions()}")
c = c.replace("options={categoryOptions}", "options={getCategoryOptions()}")
c = c.replace("options={punchListOptions}", "options={getPunchListOptions()}")
c = c.replace('title="Новое замечание"', "title={t('punchlist.modalTitle')}")
c = c.replace('description="Добавьте замечание в перечень (Punch List)"', "description={t('punchlist.modalDescription')}")
c = c.replace(">Отмена\n          </Button>", ">{t('punchlist.modalCancel')}\n          </Button>")
c = c.replace(">Создать замечание\n          </Button>", ">{t('punchlist.modalCreate')}\n          </Button>")
c = c.replace('label="Punch List"', "label={t('punchlist.labelPunchListField')}")
c = c.replace('placeholder="Выберите перечень"', "placeholder={t('punchlist.placeholderSelectList')}")
c = c.replace('label="Название замечания"', "label={t('punchlist.labelTitleField')}")
c = c.replace('placeholder="Краткое описание дефекта"', "placeholder={t('punchlist.placeholderTitleField')}")
c = c.replace('label="Подробное описание"', "label={t('punchlist.labelDescriptionField')}")
c = c.replace('placeholder="Опишите замечание, укажите размеры, характер дефекта..."', "placeholder={t('punchlist.placeholderDescriptionField')}")
c = c.replace('label="Категория"', "label={t('punchlist.labelCategoryField')}")
c = c.replace('placeholder="Выберите категорию"', "placeholder={t('punchlist.placeholderSelectCategory')}")
c = c.replace('label="Приоритет"', "label={t('punchlist.labelPriorityField')}")
c = c.replace('label="Расположение"', "label={t('punchlist.labelLocationField')}")
c = c.replace('placeholder="Секция, этаж, помещение"', "placeholder={t('punchlist.placeholderLocationField')}")
c = c.replace('label="Этаж"', "label={t('punchlist.labelFloorField')}")
c = c.replace('placeholder="Номер этажа"', "placeholder={t('punchlist.placeholderFloorField')}")
c = c.replace('label="Помещение / Квартира"', "label={t('punchlist.labelRoomField')}")
c = c.replace('placeholder="Номер помещения"', "placeholder={t('punchlist.placeholderRoomField')}")
c = c.replace('label="Исполнитель"', "label={t('punchlist.labelAssigneeField')}")
c = c.replace('placeholder="Выберите исполнителя"', "placeholder={t('punchlist.placeholderSelectAssignee')}")
c = c.replace('label="Срок устранения"', "label={t('punchlist.labelDueDateField')}")
write(p, c)
modified_files.append(p)
print(f"Updated PunchItemCreateModal.tsx")

# ============================================================
# Support module files
# ============================================================

# TicketBoardPage.tsx
p = os.path.join(SRC, 'modules/support/TicketBoardPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const defaultColumns: BoardColumn[] = [\n  { id: 'OPEN', title: 'Открыта',", "const getDefaultColumns = (): BoardColumn[] => [\n  { id: 'OPEN', title: t('support.colOpen'),")
c = c.replace("{ id: 'ASSIGNED', title: 'Назначена',", "{ id: 'ASSIGNED', title: t('support.colAssigned'),")
c = c.replace("{ id: 'IN_PROGRESS', title: 'В работе',", "{ id: 'IN_PROGRESS', title: t('support.colInProgress'),")
c = c.replace("{ id: 'WAITING_RESPONSE', title: 'Ожидание ответа',", "{ id: 'WAITING_RESPONSE', title: t('support.colWaitingResponse'),")
c = c.replace("{ id: 'RESOLVED', title: 'Решена',", "{ id: 'RESOLVED', title: t('support.colResolved'),")
c = c.replace("{ id: 'CLOSED', title: 'Закрыта',", "{ id: 'CLOSED', title: t('support.colClosed'),")
c = c.replace("const priorityLabels: Record<string, string> = {\n  LOW: 'Низкий',\n  MEDIUM: 'Средний',\n  HIGH: 'Высокий',\n  CRITICAL: 'Критический',\n};",
              "const getPriorityLabels = (): Record<string, string> => ({\n  LOW: t('support.priorityLow'),\n  MEDIUM: t('support.priorityMedium'),\n  HIGH: t('support.priorityHigh'),\n  CRITICAL: t('support.priorityCritical'),\n});")
c = c.replace("const categoryLabels: Record<string, string> = {\n  TECHNICAL: 'Техническая',\n  ACCESS: 'Доступ',\n  DOCUMENTS: 'Документы',\n  EQUIPMENT: 'Оборудование',\n  SAFETY: 'Безопасность',\n  SCHEDULE: 'График',\n  OTHER: 'Прочее',\n};",
              "const getCategoryLabels = (): Record<string, string> => ({\n  TECHNICAL: t('support.catTechnical'),\n  ACCESS: t('support.catAccess'),\n  DOCUMENTS: t('support.catDocuments'),\n  EQUIPMENT: t('support.catEquipment'),\n  SAFETY: t('support.catSafety'),\n  SCHEDULE: t('support.catSchedule'),\n  OTHER: t('support.catOther'),\n});")
c = c.replace("if (!value) return 'Без категории';", "if (!value) return t('support.catNone');")
c = c.replace("return categoryLabels[value]", "return getCategoryLabels()[value]")
c = c.replace("useState<BoardColumn[]>(defaultColumns)", "useState<BoardColumn[]>(getDefaultColumns())")
c = c.replace("...defaultColumns.map((column) => ({ value: column.id, label: column.title }))", "...getDefaultColumns().map((column) => ({ value: column.id, label: column.title }))")
c = c.replace("priorityLabels[item.priority]", "getPriorityLabels()[item.priority]")
c = c.replace("toast.error('Не удалось изменить статус заявки')", "toast.error(t('support.statusChangeError'))")
c = c.replace("toast.error('Нельзя перевести в \"Назначена\" без исполнителя')", "toast.error(t('support.cannotAssignNoAssignee'))")
c = c.replace("title=\"Тикеты поддержки - Доска\"", "title={t('support.boardTitle')}")
c = c.replace("subtitle={`${items.length} тикетов`}", "subtitle={t('support.boardSubtitle', { count: String(items.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Поддержка', href: '/support/tickets' },\n          { label: 'Доска' },",
              "{ label: t('support.breadcrumbHome'), href: '/' },\n          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },\n          { label: t('support.breadcrumbBoard') },")
c = c.replace(">Фильтры\n            </Button>", ">{t('support.btnFilters')}\n            </Button>")
c = c.replace(">Список\n            </Button>", ">{t('support.btnList')}\n            </Button>")
c = c.replace(">Новый тикет\n            </Button>", ">{t('support.btnNewTicket')}\n            </Button>")
c = c.replace('placeholder="Поиск по номеру, теме, категории..."', "placeholder={t('support.searchPlaceholder')}")
c = c.replace("{ value: '', label: 'Все статусы' },", "{ value: '', label: t('support.allStatuses') },")
c = c.replace(">Сбросить\n            </Button>", ">{t('support.btnReset')}\n            </Button>")
c = c.replace("title=\"Не удалось загрузить доску заявок\"", "title={t('support.errorLoadBoard')}")
c = c.replace("description=\"Проверьте соединение и повторите попытку\"", "description={t('support.errorLoadBoardDesc')}")
c = c.replace("actionLabel=\"Повторить\"", "actionLabel={t('support.btnRetry')}")
c = c.replace("{isLoading ? 'Загрузка...' : 'Нет тикетов'}", "{isLoading ? t('support.loadingTickets') : t('support.noTickets')}")
c = c.replace(">Перетащите карточку сюда</p>", ">{t('support.dragHint')}</p>")
write(p, c)
modified_files.append(p)
print(f"Updated TicketBoardPage.tsx")

# SupportDashboardPage.tsx
p = os.path.join(SRC, 'modules/support/SupportDashboardPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const ticketStatusLabels: Record<string, string> = {\n  OPEN: 'Открыта',\n  ASSIGNED: 'Назначена',\n  IN_PROGRESS: 'В работе',\n  WAITING_RESPONSE: 'Ожидание ответа',\n  RESOLVED: 'Решена',\n  CLOSED: 'Закрыта',\n};",
              "const getTicketStatusLabels = (): Record<string, string> => ({\n  OPEN: t('support.colOpen'),\n  ASSIGNED: t('support.colAssigned'),\n  IN_PROGRESS: t('support.colInProgress'),\n  WAITING_RESPONSE: t('support.colWaitingResponse'),\n  RESOLVED: t('support.colResolved'),\n  CLOSED: t('support.colClosed'),\n});")
c = c.replace("const ticketPriorityLabels: Record<string, string> = {\n  LOW: 'Низкий',\n  MEDIUM: 'Средний',\n  HIGH: 'Высокий',\n  CRITICAL: 'Критический',\n};",
              "const getTicketPriorityLabels = (): Record<string, string> => ({\n  LOW: t('support.priorityLow'),\n  MEDIUM: t('support.priorityMedium'),\n  HIGH: t('support.priorityHigh'),\n  CRITICAL: t('support.priorityCritical'),\n});")
c = c.replace("const categoryLabels: Record<string, string> = {\n  TECHNICAL: 'Техническая',\n  ACCESS: 'Доступ',\n  DOCUMENTS: 'Документы',\n  EQUIPMENT: 'Оборудование',\n  SAFETY: 'Безопасность',\n  SCHEDULE: 'График',\n  OTHER: 'Прочее',\n};",
              "const getCategoryLabels = (): Record<string, string> => ({\n  TECHNICAL: t('support.catTechnical'),\n  ACCESS: t('support.catAccess'),\n  DOCUMENTS: t('support.catDocuments'),\n  EQUIPMENT: t('support.catEquipment'),\n  SAFETY: t('support.catSafety'),\n  SCHEDULE: t('support.catSchedule'),\n  OTHER: t('support.catOther'),\n});")
c = c.replace("if (!value) return 'Без категории';", "if (!value) return t('support.catNone');")
c = c.replace("return categoryLabels[value]", "return getCategoryLabels()[value]")
c = c.replace("ticketStatusLabels[ticket.status]", "getTicketStatusLabels()[ticket.status]")
c = c.replace("ticketPriorityLabels[ticket.priority]", "getTicketPriorityLabels()[ticket.priority]")
c = c.replace("category === 'UNCATEGORIZED' ? 'Без категории' : categoryLabel(category)", "category === 'UNCATEGORIZED' ? t('support.catUncategorized') : categoryLabel(category)")
c = c.replace('title="Панель поддержки"', "title={t('support.dashboardTitle')}")
c = c.replace('subtitle="Обзор текущих заявок и SLA-метрик"', "subtitle={t('support.dashboardSubtitle')}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Поддержка', href: '/support/tickets' },\n          { label: 'Панель' },",
              "{ label: t('support.breadcrumbHome'), href: '/' },\n          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },\n          { label: t('support.breadcrumbDashboard') },")
c = c.replace(">Все заявки\n          </Button>", ">{t('support.btnAllTickets')}\n          </Button>")
c = c.replace('label="Всего заявок"', "label={t('support.metricTotalTickets')}")
c = c.replace('label="Открытые"', "label={t('support.metricOpenTickets')}")
c = c.replace('label="Критические"', "label={t('support.metricCritical')}")
c = c.replace('label="Решено сегодня"', "label={t('support.metricResolvedToday')}")
c = c.replace('label="Среднее время решения"', "label={t('support.metricAvgResolution')}")
c = c.replace("value={`${metrics.avgResolutionHours} ч`}", "value={t('support.avgResolutionValue', { hours: String(metrics.avgResolutionHours) })}")
c = c.replace("value: 'Требуют внимания'", "value: t('support.trendNeedAttention')")
c = c.replace("value: 'Нет'", "value: t('support.trendNone')")
c = c.replace("value: `${metrics.openTickets} шт.`", "value: t('support.trendItemsCount', { count: String(metrics.openTickets) })")
c = c.replace(">Последние заявки</h3>", ">{t('support.sectionRecentTickets')}</h3>")
c = c.replace(">Все заявки\n                </Button>", ">{t('support.btnAllTickets')}\n                </Button>")
c = c.replace("'Без автора'", "t('support.noAuthor')")
c = c.replace(">Заявок пока нет</p>", ">{t('support.noTicketsYet')}</p>")
c = c.replace(">Открытые по категориям</h3>", ">{t('support.sectionOpenByCategory')}</h3>")
c = c.replace(">Нет открытых заявок</p>", ">{t('support.noOpenTickets')}</p>")
c = c.replace("title=\"Не удалось загрузить дашборд поддержки\"", "title={t('support.errorLoadDashboard')}")
c = c.replace("description=\"Проверьте соединение и повторите попытку\"", "description={t('support.errorLoadDashboardDesc')}")
c = c.replace("actionLabel=\"Повторить\"", "actionLabel={t('support.btnRetry')}")
write(p, c)
modified_files.append(p)
print(f"Updated SupportDashboardPage.tsx")

# TicketDetailPage.tsx
p = os.path.join(SRC, 'modules/support/TicketDetailPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const ticketStatusLabels: Record<string, string> = {\n  OPEN: 'Открыта',\n  ASSIGNED: 'Назначена',\n  IN_PROGRESS: 'В работе',\n  WAITING_RESPONSE: 'Ожидание ответа',\n  RESOLVED: 'Решена',\n  CLOSED: 'Закрыта',\n};",
              "const getTicketStatusLabels = (): Record<string, string> => ({\n  OPEN: t('support.colOpen'),\n  ASSIGNED: t('support.colAssigned'),\n  IN_PROGRESS: t('support.colInProgress'),\n  WAITING_RESPONSE: t('support.colWaitingResponse'),\n  RESOLVED: t('support.colResolved'),\n  CLOSED: t('support.colClosed'),\n});")
c = c.replace("const ticketPriorityLabels: Record<string, string> = {\n  LOW: 'Низкий',\n  MEDIUM: 'Средний',\n  HIGH: 'Высокий',\n  CRITICAL: 'Критический',\n};",
              "const getTicketPriorityLabels = (): Record<string, string> => ({\n  LOW: t('support.priorityLow'),\n  MEDIUM: t('support.priorityMedium'),\n  HIGH: t('support.priorityHigh'),\n  CRITICAL: t('support.priorityCritical'),\n});")
c = c.replace("const categoryLabels: Record<string, string> = {\n  TECHNICAL: 'Техническая',\n  ACCESS: 'Доступ',\n  DOCUMENTS: 'Документы',\n  EQUIPMENT: 'Оборудование',\n  SAFETY: 'Безопасность',\n  SCHEDULE: 'График',\n  OTHER: 'Прочее',\n};",
              "const getCategoryLabels = (): Record<string, string> => ({\n  TECHNICAL: t('support.catTechnical'),\n  ACCESS: t('support.catAccess'),\n  DOCUMENTS: t('support.catDocuments'),\n  EQUIPMENT: t('support.catEquipment'),\n  SAFETY: t('support.catSafety'),\n  SCHEDULE: t('support.catSchedule'),\n  OTHER: t('support.catOther'),\n});")
c = c.replace("const statusOptions = [\n  { value: 'OPEN', label: 'Открыта' },\n  { value: 'ASSIGNED', label: 'Назначена' },\n  { value: 'IN_PROGRESS', label: 'В работе' },\n  { value: 'WAITING_RESPONSE', label: 'Ожидание ответа' },\n  { value: 'RESOLVED', label: 'Решена' },\n  { value: 'CLOSED', label: 'Закрыта' },\n];",
              "const getStatusOptions = () => [\n  { value: 'OPEN', label: t('support.colOpen') },\n  { value: 'ASSIGNED', label: t('support.colAssigned') },\n  { value: 'IN_PROGRESS', label: t('support.colInProgress') },\n  { value: 'WAITING_RESPONSE', label: t('support.colWaitingResponse') },\n  { value: 'RESOLVED', label: t('support.colResolved') },\n  { value: 'CLOSED', label: t('support.colClosed') },\n];")
c = c.replace("return categoryLabels[value]", "return getCategoryLabels()[value]")
c = c.replace("ticketStatusLabels[currentTicket.status]", "getTicketStatusLabels()[currentTicket.status]")
c = c.replace("ticketPriorityLabels[currentTicket.priority]", "getTicketPriorityLabels()[currentTicket.priority]")
c = c.replace("options={statusOptions}", "options={getStatusOptions()}")
c = c.replace("toast.success('Комментарий добавлен')", "toast.success(t('support.commentAdded'))")
c = c.replace("toast.error('Не удалось добавить комментарий')", "toast.error(t('support.errorAddComment'))")
c = c.replace("throw new Error('Заявка не загружена')", "throw new Error(t('support.errorTicketNotLoaded'))")
c = c.replace("throw new Error('Нельзя назначить заявку без исполнителя')", "throw new Error(t('support.errorCannotAssign'))")
c = c.replace("toast.success('Статус обновлен')", "toast.success(t('support.statusUpdated'))")
c = c.replace("const message = error instanceof Error ? error.message : 'Не удалось обновить статус'", "const message = error instanceof Error ? error.message : t('support.errorStatusUpdate')")
c = c.replace("title=\"Некорректный идентификатор заявки\"", "title={t('support.errorInvalidId')}")
c = c.replace("description=\"Откройте заявку из списка и попробуйте снова\"", "description={t('support.errorInvalidIdDesc')}")
c = c.replace("title=\"Заявка поддержки\"\n          breadcrumbs={[\n            { label: 'Главная', href: '/' },\n            { label: 'Поддержка', href: '/support/tickets' },\n          ]}\n          actions={(\n            <Button variant=\"secondary\" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/support/tickets')}>\n              Назад к списку",
              "title={t('support.detailTitle')}\n          breadcrumbs={[\n            { label: t('support.breadcrumbHome'), href: '/' },\n            { label: t('support.breadcrumbSupport'), href: '/support/tickets' },\n          ]}\n          actions={(\n            <Button variant=\"secondary\" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/support/tickets')}>\n              {t('support.btnBackToList')}")
c = c.replace("title=\"Не удалось загрузить заявку\"", "title={t('support.errorLoadTicket')}")
c = c.replace("description=\"Проверьте соединение и повторите загрузку\"", "description={t('support.errorLoadTicketDesc')}")
c = c.replace("actionLabel=\"Повторить\"", "actionLabel={t('support.btnRetry')}")
c = c.replace("title={currentTicket ? `${currentTicket.number}: ${currentTicket.subject}` : 'Заявка поддержки'}", "title={currentTicket ? `${currentTicket.number}: ${currentTicket.subject}` : t('support.detailTitle')}")
c = c.replace("{ label: currentTicket?.number ?? 'Карточка заявки' },", "{ label: currentTicket?.number ?? t('support.cardLabel') },")
c = c.replace(">Назад к списку\n          </Button>", ">{t('support.btnBackToList')}\n          </Button>")
c = c.replace(">Загрузка заявки...</", ">{t('support.loadingTicket')}</")
c = c.replace("title=\"Заявка не найдена\"", "title={t('support.ticketNotFound')}")
c = c.replace("description=\"Проверьте ссылку или перейдите в список заявок\"", "description={t('support.ticketNotFoundDesc')}")
c = c.replace(">Описание</h3>", ">{t('support.sectionDescription')}</h3>")
c = c.replace(">Заявка закрыта/решена</h3>", ">{t('support.ticketResolved')}</h3>")
c = c.replace(">Не удалось загрузить комментарии.", ">{t('support.errorLoadComments')}")
c = c.replace(">Повторить\n", ">{t('support.btnRetry')}\n")
c = c.replace("'Неизвестный пользователь'", "t('support.unknownUser')")
c = c.replace(">Внутренний\n", ">{t('support.internalComment')}\n")
c = c.replace(">Комментариев пока нет.</p>", ">{t('support.noCommentsYet')}</p>")
c = c.replace('label="Добавить комментарий"', "label={t('support.labelAddComment')}")
c = c.replace('placeholder="Введите комментарий..."', "placeholder={t('support.placeholderComment')}")
c = c.replace(">Внутренний комментарий\n", ">{t('support.labelInternalComment')}\n")
c = c.replace(">Отправить\n", ">{t('support.btnSend')}\n")
c = c.replace(">Информация</h3>", ">{t('support.sectionInfo')}</h3>")
c = c.replace(">Статус</span>", ">{t('support.labelStatus')}</span>")
c = c.replace(">Приоритет</span>", ">{t('support.labelPriority')}</span>")
c = c.replace(">Категория</span>", ">{t('support.labelCategoryInfo')}</span>")
c = c.replace(">Детали</h3>", ">{t('support.sectionDetails')}</h3>")
c = c.replace(">Заявитель</p>", ">{t('support.labelRequester')}</p>")
c = c.replace(">Исполнитель</p>", ">{t('support.labelAssignee')}</p>")
c = c.replace("'Не назначен'", "t('support.notAssigned')")
c = c.replace(">Срок</p>", ">{t('support.labelDueDate')}</p>")
c = c.replace(">Создана</p>", ">{t('support.labelCreated')}</p>")
c = c.replace(">Решена</p>", ">{t('support.labelResolved')}</p>")
c = c.replace(">Действия</h3>", ">{t('support.sectionActions')}</h3>")
c = c.replace('label="Изменить статус"', "label={t('support.labelChangeStatus')}")
# Fix breadcrumbs in detail page
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Поддержка', href: '/support/tickets' },\n          { label: currentTicket?.number",
              "{ label: t('support.breadcrumbHome'), href: '/' },\n          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },\n          { label: currentTicket?.number")
write(p, c)
modified_files.append(p)
print(f"Updated TicketDetailPage.tsx")

# TicketListPage.tsx
p = os.path.join(SRC, 'modules/support/TicketListPage.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const ticketStatusLabels: Record<string, string> = {\n  OPEN: 'Открыта',\n  ASSIGNED: 'Назначена',\n  IN_PROGRESS: 'В работе',\n  WAITING_RESPONSE: 'Ожидание ответа',\n  RESOLVED: 'Решена',\n  CLOSED: 'Закрыта',\n};",
              "const getTicketStatusLabels = (): Record<string, string> => ({\n  OPEN: t('support.colOpen'),\n  ASSIGNED: t('support.colAssigned'),\n  IN_PROGRESS: t('support.colInProgress'),\n  WAITING_RESPONSE: t('support.colWaitingResponse'),\n  RESOLVED: t('support.colResolved'),\n  CLOSED: t('support.colClosed'),\n});")
c = c.replace("const ticketPriorityLabels: Record<string, string> = {\n  LOW: 'Низкий',\n  MEDIUM: 'Средний',\n  HIGH: 'Высокий',\n  CRITICAL: 'Критический',\n};",
              "const getTicketPriorityLabels = (): Record<string, string> => ({\n  LOW: t('support.priorityLow'),\n  MEDIUM: t('support.priorityMedium'),\n  HIGH: t('support.priorityHigh'),\n  CRITICAL: t('support.priorityCritical'),\n});")
c = c.replace("const categoryLabels: Record<string, string> = {\n  TECHNICAL: 'Техническая',\n  ACCESS: 'Доступ',\n  DOCUMENTS: 'Документы',\n  EQUIPMENT: 'Оборудование',\n  SAFETY: 'Безопасность',\n  SCHEDULE: 'График',\n  OTHER: 'Прочее',\n};",
              "const getCategoryLabels = (): Record<string, string> => ({\n  TECHNICAL: t('support.catTechnical'),\n  ACCESS: t('support.catAccess'),\n  DOCUMENTS: t('support.catDocuments'),\n  EQUIPMENT: t('support.catEquipment'),\n  SAFETY: t('support.catSafety'),\n  SCHEDULE: t('support.catSchedule'),\n  OTHER: t('support.catOther'),\n});")
c = c.replace("const priorityFilterOptions = [\n  { value: '', label: 'Все приоритеты' },\n  { value: 'LOW', label: 'Низкий' },\n  { value: 'MEDIUM', label: 'Средний' },\n  { value: 'HIGH', label: 'Высокий' },\n  { value: 'CRITICAL', label: 'Критический' },\n];",
              "const getPriorityFilterOptions = () => [\n  { value: '', label: t('support.priorityFilterAll') },\n  { value: 'LOW', label: t('support.priorityLow') },\n  { value: 'MEDIUM', label: t('support.priorityMedium') },\n  { value: 'HIGH', label: t('support.priorityHigh') },\n  { value: 'CRITICAL', label: t('support.priorityCritical') },\n];")
c = c.replace("if (categoryLabels[category]) return categoryLabels[category]", "if (getCategoryLabels()[category]) return getCategoryLabels()[category]")
c = c.replace("ticketStatusLabels[row.original.status]", "getTicketStatusLabels()[row.original.status]")
c = c.replace("ticketPriorityLabels[row.original.priority]", "getTicketPriorityLabels()[row.original.priority]")
c = c.replace("{ value: '', label: 'Все категории' },", "{ value: '', label: t('support.categoryFilterAll') },")
c = c.replace("options={priorityFilterOptions}", "options={getPriorityFilterOptions()}")
c = c.replace("header: '\\u2116',", "header: t('support.colNumber'),")
c = c.replace("header: 'Тема',", "header: t('support.colSubject'),")
c = c.replace("header: 'Статус',", "header: t('support.colStatus'),")
c = c.replace("header: 'Приоритет',", "header: t('support.colPriority'),")
c = c.replace("header: 'Заявитель',", "header: t('support.colRequester'),")
c = c.replace("header: 'Исполнитель',", "header: t('support.colAssigneeCol'),")
c = c.replace("header: 'Создана',", "header: t('support.colCreated'),")
c = c.replace("header: 'Срок',", "header: t('support.colDueDate'),")
c = c.replace('title="Заявки поддержки"', "title={t('support.listTitle')}")
c = c.replace("subtitle={`${tickets.length} заявок в системе`}", "subtitle={t('support.listSubtitle', { count: String(tickets.length) })}")
c = c.replace("{ label: 'Главная', href: '/' },\n          { label: 'Поддержка', href: '/support/tickets' },",
              "{ label: t('support.breadcrumbHome'), href: '/' },\n          { label: t('support.breadcrumbSupport'), href: '/support/tickets' },")
c = c.replace(">Доска\n            </Button>", ">{t('support.btnBoard')}\n            </Button>")
c = c.replace(">Новая заявка\n            </Button>", ">{t('support.btnNewRequest')}\n            </Button>")
c = c.replace("{ id: 'all', label: 'Все', count: tabCounts.all },\n          { id: 'OPEN', label: 'Открытые', count: tabCounts.open },\n          { id: 'IN_PROGRESS', label: 'В работе', count: tabCounts.in_progress },\n          { id: 'RESOLVED', label: 'Решённые', count: tabCounts.resolved },\n          { id: 'CLOSED', label: 'Закрытые', count: tabCounts.closed },",
              "{ id: 'all', label: t('support.tabAll'), count: tabCounts.all },\n          { id: 'OPEN', label: t('support.tabOpen'), count: tabCounts.open },\n          { id: 'IN_PROGRESS', label: t('support.tabInProgress'), count: tabCounts.in_progress },\n          { id: 'RESOLVED', label: t('support.tabResolved'), count: tabCounts.resolved },\n          { id: 'CLOSED', label: t('support.tabClosed'), count: tabCounts.closed },")
c = c.replace("title=\"Не удалось загрузить заявки поддержки\"", "title={t('support.errorLoadTickets')}")
c = c.replace("description=\"Проверьте соединение и попробуйте снова\"", "description={t('support.errorLoadTicketsDesc')}")
c = c.replace("actionLabel=\"Повторить\"", "actionLabel={t('support.btnRetry')}")
c = c.replace('label="Всего заявок"', "label={t('support.metricTotal')}")
c = c.replace('label="Открытые"', "label={t('support.metricOpen')}")
c = c.replace('label="Критические"', "label={t('support.metricCriticalList')}")
c = c.replace("value: 'Требуют внимания'", "value: t('support.trendNeedAttention')")
c = c.replace("value: 'Нет'", "value: t('support.trendNone')")
c = c.replace("value: `${metrics.open} шт.`", "value: t('support.trendItemsCount', { count: String(metrics.open) })")
c = c.replace('label="Решённые"', "label={t('support.metricResolvedList')}")
c = c.replace('placeholder="Поиск по номеру, теме, заявителю..."', "placeholder={t('support.searchTicketPlaceholder')}")
c = c.replace('emptyTitle="Нет заявок поддержки"', "emptyTitle={t('support.emptyTickets')}")
c = c.replace('emptyDescription="Создайте первую заявку для начала работы"', "emptyDescription={t('support.emptyTicketsDesc')}")
write(p, c)
modified_files.append(p)
print(f"Updated TicketListPage.tsx")

# TicketCreateModal.tsx
p = os.path.join(SRC, 'modules/support/TicketCreateModal.tsx')
c = read(p)
c = ensure_t_import(c)
c = c.replace("const priorityOptions = [\n  { value: 'LOW', label: 'Низкий' },\n  { value: 'MEDIUM', label: 'Средний' },\n  { value: 'HIGH', label: 'Высокий' },\n  { value: 'CRITICAL', label: 'Критический' },\n];",
              "const getPriorityOptions = () => [\n  { value: 'LOW', label: t('support.priorityLow') },\n  { value: 'MEDIUM', label: t('support.priorityMedium') },\n  { value: 'HIGH', label: t('support.priorityHigh') },\n  { value: 'CRITICAL', label: t('support.priorityCritical') },\n];")
# Note: categoryOptions at top level (line ~23-31) and fallbackCategoryOptions
c = c.replace("const fallbackCategoryOptions = [\n  { value: 'TECHNICAL', label: 'Техническая' },\n  { value: 'ACCESS', label: 'Доступ' },\n  { value: 'DOCUMENTS', label: 'Документы' },\n  { value: 'EQUIPMENT', label: 'Оборудование' },\n  { value: 'SAFETY', label: 'Безопасность' },\n  { value: 'SCHEDULE', label: 'График' },\n  { value: 'OTHER', label: 'Прочее' },\n];",
              "const getFallbackCategoryOptions = () => [\n  { value: 'TECHNICAL', label: t('support.catTechnical') },\n  { value: 'ACCESS', label: t('support.catAccess') },\n  { value: 'DOCUMENTS', label: t('support.catDocuments') },\n  { value: 'EQUIPMENT', label: t('support.catEquipment') },\n  { value: 'SAFETY', label: t('support.catSafety') },\n  { value: 'SCHEDULE', label: t('support.catSchedule') },\n  { value: 'OTHER', label: t('support.catOther') },\n];")
c = c.replace(": fallbackCategoryOptions", ": getFallbackCategoryOptions()")
c = c.replace("options={priorityOptions}", "options={getPriorityOptions()}")
c = c.replace("|| 'Текущий пользователь'", "|| t('support.currentUser')")
c = c.replace("toast.success('Заявка поддержки создана')", "toast.success(t('support.ticketCreated'))")
c = c.replace("toast.error('Не удалось создать заявку поддержки')", "toast.error(t('support.errorCreateTicket'))")
c = c.replace("toast.error('Тема и описание обязательны')", "toast.error(t('support.validationRequired'))")
c = c.replace('title="Новая заявка поддержки"', "title={t('support.createTitle')}")
c = c.replace('description="Опишите вашу проблему или запрос"', "description={t('support.createDescription')}")
c = c.replace(">Отмена\n          </Button>", ">{t('support.createCancel')}\n          </Button>")
c = c.replace(">Создать заявку\n          </Button>", ">{t('support.createSubmit')}\n          </Button>")
c = c.replace('label="Заявитель"', "label={t('support.labelReporter')}")
c = c.replace('label="Тема заявки"', "label={t('support.labelSubjectField')}")
c = c.replace('placeholder="Краткое описание проблемы"', "placeholder={t('support.placeholderSubject')}")
c = c.replace('label="Описание"', "label={t('support.labelDescriptionField')}")
c = c.replace('placeholder="Подробно опишите проблему или запрос..."', "placeholder={t('support.placeholderDescription')}")
c = c.replace('label="Категория"', "label={t('support.labelCategory')}")
c = c.replace('label="Приоритет"', "label={t('support.labelPriorityField')}")
c = c.replace('label="Желаемый срок решения"', "label={t('support.labelDesiredDeadline')}")
write(p, c)
modified_files.append(p)
print(f"Updated TicketCreateModal.tsx")

print(f"\nTotal files modified: {len(modified_files)}")
for f in modified_files:
    print(f"  {f}")
