# ПРИВОД ERP/CRM — ДЕТАЛЬНЫЕ ТЕХНИЧЕСКИЕ СПЕЦИФИКАЦИИ (Задачи 8-15)

> **Дата:** 18 февраля 2026
> **Автор:** CPO / Senior Architect
> **Для:** Команда разработки
> **Методология:** Спецификации основаны на полном аудите кодовой базы (1,500+ файлов), аудите безопасности (84 findings), карте 85 строительных процессов и конкурентном анализе (58+ решений)

---

## ОГЛАВЛЕНИЕ

### P1 — MVP Core:
8. [КС-2/КС-3 Generation Module](#задача-8-кс-2кс-3-generation-module)
9. [Work Volume Tracking](#задача-9-work-volume-tracking)
10. [Digital Daily Logs (Общий журнал работ)](#задача-10-digital-daily-logs-общий-журнал-работ)
11. [Basic CPM Scheduling Enhancement](#задача-11-basic-cpm-scheduling-enhancement)
12. [1C Integration (синхронизация данных)](#задача-12-1c-integration-синхронизация-данных)
13. [Document Approval Workflow Engine](#задача-13-document-approval-workflow-engine)
14. [Electronic Signature Integration (КЭП)](#задача-14-electronic-signature-integration-кэп)
15. [Real-time Plan-Fact Dashboard](#задача-15-real-time-plan-fact-dashboard)

---

## Задача 8: КС-2/КС-3 Generation Module

### Описание

Автоматическая генерация актов КС-2 (Акт о приёмке выполненных работ) и справок КС-3 (Справка о стоимости выполненных работ и затрат) — процесс №27 в карте строительных процессов и единодушно признан «убийственной фичей» №1 по результатам конкурентного анализа 58+ решений. Ни один конкурент (включая Procore, Autodesk BIM 360, PlanRadar) не реализует end-to-end автогенерацию КС-2 из данных полевого учёта. Текущая реализация в модуле `closing` (`backend/.../modules/closing/`) содержит базовые сущности `Ks2Document`, `Ks2Line`, `Ks3Document`, `Ks3Ks2Link` со статусной машиной `ClosingDocumentStatus` (DRAFT → SUBMITTED → SIGNED → CLOSED). Однако отсутствуют: связь с учётом объёмов (КС-6а), автоматический расчёт стоимости по сметным расценкам (ГЭСН/ФЕР/ТЕР), генерация PDF по утверждённой форме, привязка к договорам и периодам, НДС и удержания, электронный документооборот с контрагентом.

Текущий фронтенд (`frontend/src/modules/russianDocs/FormKs2Page.tsx`) — полностью ручная форма: пользователь вбивает строки работ вручную (workName, unitOfMeasure, quantity, unitPrice). Hardcoded список единиц измерения (м3, м2, т, кг, шт). Нет автозаполнения из сметы или журнала учёта объёмов. VAT hardcoded на 20%. В FormKs3Page.tsx — аналогичная ситуация. Нет связки КС-3 с конкретными КС-2. Нет генерации печатной формы.

Целевой UX: пользователь выбирает договор и период → система автоматически подтягивает выполненные объёмы из КС-6а за период → формирует строки КС-2 с расценками из сметы → рассчитывает итоги с НДС → генерирует PDF по форме Госкомстата → после подписания КЭП автоматически создаёт КС-3 с привязкой к КС-2 → отправляет контрагенту через ЭДО.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы ks2_documents
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS period_from DATE;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS period_to DATE;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS investor_name VARCHAR(500);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS investor_address VARCHAR(1000);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS customer_name VARCHAR(500);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS customer_address VARCHAR(1000);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(500);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS contractor_address VARCHAR(1000);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS construction_name VARCHAR(1000);  -- Наименование стройки
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS construction_address VARCHAR(1000);
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS object_name VARCHAR(1000);  -- Наименование объекта
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 20.00;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS total_with_vat NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS estimate_number VARCHAR(100);  -- Номер сметы
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS pdf_file_id UUID;  -- ссылка на MinIO
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'MANUAL';  -- MANUAL | AUTO_FROM_VOLUMES | AUTO_FROM_ESTIMATE
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS approved_by_id UUID;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX idx_ks2_org ON ks2_documents(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_ks2_period ON ks2_documents(period_from, period_to) WHERE deleted = FALSE;

-- Расширение существующей таблицы ks2_lines
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS estimate_item_id UUID;  -- связь с позицией сметы
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS volume_record_id UUID;  -- связь с записью учёта объёмов
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS overhead_percent NUMERIC(5,2);  -- накладные расходы %
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS overhead_amount NUMERIC(18,2);
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS profit_percent NUMERIC(5,2);  -- сметная прибыль %
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS profit_amount NUMERIC(18,2);
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS price_coefficient NUMERIC(8,4) DEFAULT 1.0000;  -- индекс пересчёта цен
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS base_price NUMERIC(18,2);  -- цена в базисных ценах (без коэффициента)

-- Расширение существующей таблицы ks3_documents
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS investor_name VARCHAR(500);
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS customer_name VARCHAR(500);
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(500);
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS construction_name VARCHAR(1000);
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS object_name VARCHAR(1000);
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 20.00;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS total_with_vat NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS cumulative_from_start NUMERIC(18,2) DEFAULT 0;  -- стоимость с начала строительства
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS cumulative_from_year NUMERIC(18,2) DEFAULT 0;  -- стоимость с начала года
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS pdf_file_id UUID;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS approved_by_id UUID;
ALTER TABLE ks3_documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX idx_ks3_org ON ks3_documents(organization_id) WHERE deleted = FALSE;

-- Таблица для хранения строк КС-3 (разбивка по видам работ)
CREATE TABLE ks3_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ks3_id UUID NOT NULL REFERENCES ks3_documents(id),
    organization_id UUID,
    sequence INTEGER DEFAULT 0,
    work_type_name VARCHAR(500) NOT NULL,  -- Наименование вида работ/затрат
    cumulative_from_start NUMERIC(18,2) DEFAULT 0,
    cumulative_from_year NUMERIC(18,2) DEFAULT 0,
    current_period NUMERIC(18,2) DEFAULT 0,  -- за отчётный период
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ks3_line_ks3 ON ks3_lines(ks3_id) WHERE deleted = FALSE;

-- Таблица шаблонов для автозаполнения реквизитов
CREATE TABLE ks_document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    contract_id UUID NOT NULL,
    investor_name VARCHAR(500),
    investor_address VARCHAR(1000),
    customer_name VARCHAR(500),
    customer_address VARCHAR(1000),
    contractor_name VARCHAR(500),
    contractor_address VARCHAR(1000),
    construction_name VARCHAR(1000),
    construction_address VARCHAR(1000),
    object_name VARCHAR(1000),
    vat_rate NUMERIC(5,2) DEFAULT 20.00,
    retention_percent NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_ks_tmpl_org_contract ON ks_document_templates(organization_id, contract_id) WHERE deleted = FALSE;
```

**Модификации существующих сущностей:**

Файл: `backend/.../modules/closing/domain/Ks2Document.java`
- Добавить поля: organizationId, periodFrom, periodTo, investorName, investorAddress, customerName, customerAddress, contractorName, contractorAddress, constructionName, constructionAddress, objectName, vatRate, vatAmount, totalWithVat, estimateNumber, pdfFileId, sourceType (enum: MANUAL, AUTO_FROM_VOLUMES, AUTO_FROM_ESTIMATE), approvedById, approvedAt

Файл: `backend/.../modules/closing/domain/Ks2Line.java`
- Добавить поля: organizationId, estimateItemId, volumeRecordId, overheadPercent, overheadAmount, profitPercent, profitAmount, priceCoefficient, basePrice

Файл: `backend/.../modules/closing/domain/Ks3Document.java`
- Добавить поля: organizationId, investorName, customerName, contractorName, constructionName, objectName, vatRate, vatAmount, totalWithVat, cumulativeFromStart, cumulativeFromYear, pdfFileId, approvedById, approvedAt

Файл: `backend/.../modules/closing/domain/ClosingDocumentStatus.java`
- Расширить статусную машину: DRAFT → SUBMITTED → APPROVED → SIGNED → SENT → CLOSED
  - APPROVED: утверждён ответственным (внутренний статус)
  - SENT: отправлен контрагенту через ЭДО
  - Добавить обратный переход: SUBMITTED → DRAFT (возврат на доработку)

### API Endpoints

```
GET /api/ks2
  Query: projectId, contractId, status, periodFrom, periodTo, page, size, sort
  Response: Page<Ks2ListResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/ks2/{id}
  Response: Ks2Response (с вложенными lines)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/ks2
  Request: CreateKs2Request { contractId, projectId, number, documentDate, periodFrom, periodTo, estimateNumber?, lines: [CreateKs2LineRequest] }
  Response: Ks2Response
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks2/generate-from-volumes
  Request: GenerateKs2FromVolumesRequest { contractId, projectId, periodFrom, periodTo, volumeRecordIds?: UUID[], priceCoefficient?: number }
  Response: Ks2Response (черновик с автоматически заполненными строками)
  Описание: Подтягивает данные из ks6a_records за указанный период,
    сопоставляет с позициями сметы, рассчитывает стоимость с учётом
    индексов пересчёта, накладных расходов и сметной прибыли.
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/ks2/{id}
  Request: UpdateKs2Request
  Response: Ks2Response
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks2/{id}/submit
  Response: Ks2Response (status → SUBMITTED)
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks2/{id}/approve
  Response: Ks2Response (status → APPROVED)
  Roles: [ADMIN, MANAGER]

POST /api/ks2/{id}/return
  Request: { reason: string }
  Response: Ks2Response (status → DRAFT)
  Roles: [ADMIN, MANAGER]

POST /api/ks2/{id}/generate-pdf
  Response: { pdfUrl: string, fileId: UUID }
  Описание: Генерирует PDF по форме КС-2 (Госкомстат, утв. Постановлением №100 от 11.11.1999)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

DELETE /api/ks2/{id}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER] (только в статусе DRAFT)

-- КС-2 Lines --

POST /api/ks2/{ks2Id}/lines
  Request: CreateKs2LineRequest { name, quantity, unitPrice, unitOfMeasure, specItemId?, overheadPercent?, profitPercent?, priceCoefficient? }
  Response: Ks2LineResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/ks2/{ks2Id}/lines/{lineId}
  Request: UpdateKs2LineRequest
  Response: Ks2LineResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

DELETE /api/ks2/{ks2Id}/lines/{lineId}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER, ENGINEER] (только если КС-2 в статусе DRAFT)

-- КС-3 --

GET /api/ks3
  Query: projectId, contractId, status, periodFrom, periodTo, page, size, sort
  Response: Page<Ks3ListResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/ks3/{id}
  Response: Ks3Response (с вложенными lines и linked КС-2)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/ks3/generate-from-ks2
  Request: GenerateKs3FromKs2Request { contractId, projectId, periodFrom, periodTo, ks2Ids: UUID[] }
  Response: Ks3Response (черновик с автоматически рассчитанными итогами)
  Описание: Агрегирует данные из указанных КС-2, рассчитывает
    нарастающий итог с начала строительства и с начала года,
    применяет удержания.
  Roles: [ADMIN, MANAGER, ACCOUNTANT]

POST /api/ks3/{id}/submit
  Response: Ks3Response (status → SUBMITTED)
  Roles: [ADMIN, MANAGER]

POST /api/ks3/{id}/approve
  Response: Ks3Response (status → APPROVED)
  Roles: [ADMIN, MANAGER]

POST /api/ks3/{id}/generate-pdf
  Response: { pdfUrl: string, fileId: UUID }
  Roles: [ADMIN, MANAGER, ACCOUNTANT]

-- Шаблоны реквизитов --

GET /api/ks-templates?contractId={id}
  Response: KsDocumentTemplateResponse
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

PUT /api/ks-templates
  Request: UpsertKsTemplateRequest { contractId, investorName, customerName, ... }
  Response: KsDocumentTemplateResponse
  Roles: [ADMIN, MANAGER]
```

### Экраны (UI Description)

**1. Список КС-2 (Russian Docs > КС-2)**
- Расположение: `frontend/src/modules/russianDocs/Ks2ListPage.tsx` (новый файл)
- Таблица: Номер | Дата | Проект | Договор | Период | Сумма | Статус | Действия
- Фильтры: проект, договор, статус, период (от-до)
- Кнопка «Создать КС-2» с dropdown: «Вручную» / «Из объёмов работ»
- Кнопка «Экспорт» (Excel/PDF)
- StatusBadge: DRAFT (серый), SUBMITTED (жёлтый), APPROVED (синий), SIGNED (зелёный), SENT (фиолетовый), CLOSED (тёмно-серый)
- Переиспользуемые компоненты: `DataTable`, `StatusBadge`, `Button`, `PageHeader`

**2. Форма создания КС-2 (обновлённая)**
- Расположение: обновить `frontend/src/modules/russianDocs/FormKs2Page.tsx`
- Шаг 1: Выбор договора → автозаполнение реквизитов из `ks_document_templates`
- Шаг 2: Указание периода (от-до) → подтягивание объёмов из КС-6а
- Шаг 3: Редактирование строк (таблица с inline-edit):
  - Колонки: №п/п | Наименование работ | Ед.изм | Объём | Цена | Накладные % | Прибыль % | К-т пересчёта | Сумма
  - Автоматический пересчёт при изменении любого поля
  - Кнопка «Добавить строку» + «Импорт из сметы»
- Шаг 4: Итоги — Сумма без НДС, НДС, Итого с НДС
- Кнопка «Предпросмотр PDF» — открывает PDF в модальном окне
- Кнопка «Сохранить черновик» / «Отправить на согласование»
- Мобильная версия: строки отображаются как карточки (stack view)

**3. Детальная страница КС-2**
- Расположение: `frontend/src/modules/russianDocs/Ks2DetailPage.tsx`
- Заголовок: «КС-2 №{number} от {date}»
- Карточки: Реквизиты сторон | Период | Договор | Смета
- Таблица строк работ
- Итоговая панель: Сумма / НДС / Итого с НДС
- Кнопки действий по статусу: Редактировать (DRAFT), Согласовать (SUBMITTED), Подписать КЭП (APPROVED), Скачать PDF
- Timeline: история изменений статуса

**4. Визард генерации КС-3 из КС-2**
- Расположение: `frontend/src/modules/russianDocs/Ks3GenerateWizard.tsx`
- Шаг 1: Выбор договора и периода
- Шаг 2: Выбор КС-2 для включения (чекбокс-список с суммами)
- Шаг 3: Проверка: нарастающий итог, удержания, НДС
- Шаг 4: Подтверждение и создание

### Бизнес-правила и валидации

1. **Автозаполнение из объёмов**: при вызове `generate-from-volumes` система:
   - Находит ks6a_records за период [periodFrom, periodTo] для проекта
   - Сопоставляет записи с позициями сметы по `work_name` + `unit`
   - Рассчитывает стоимость: `basePrice * priceCoefficient * quantity`
   - Добавляет накладные расходы и сметную прибыль
   - Создаёт КС-2 в статусе DRAFT с автозаполненными строками

2. **Расчёт итогов КС-2**:
   - `amount = quantity * unitPrice` (или `basePrice * priceCoefficient`)
   - `overheadAmount = amount * overheadPercent / 100`
   - `profitAmount = amount * profitPercent / 100`
   - `lineTotal = amount + overheadAmount + profitAmount`
   - `totalAmount = SUM(lineTotal)`
   - `vatAmount = totalAmount * vatRate / 100`
   - `totalWithVat = totalAmount + vatAmount`

3. **Расчёт итогов КС-3**:
   - `totalAmount = SUM(linked КС-2.totalAmount)`
   - `cumulativeFromStart = SUM(всех КС-3 по договору до текущего периода) + totalAmount`
   - `cumulativeFromYear = SUM(КС-3 с начала года) + totalAmount`
   - `retentionAmount = totalAmount * retentionPercent / 100`
   - `netAmount = totalWithVat - retentionAmount`

4. **Валидация периодов**: periodFrom <= periodTo. Периоды КС-2 в рамках одного договора не должны пересекаться (warning, не блокер — могут быть корректировки).

5. **Нумерация**: автоинкремент в рамках договора. Формат: "{порядковый номер}" (1, 2, 3...). Можно переопределить вручную.

6. **Статусная машина**:
   - DRAFT → SUBMITTED: валидация — минимум 1 строка, заполнены все обязательные реквизиты
   - SUBMITTED → APPROVED: только ADMIN/MANAGER
   - SUBMITTED → DRAFT: возврат с указанием причины
   - APPROVED → SIGNED: только после подписания КЭП (Задача 14)
   - SIGNED → SENT: после отправки через ЭДО
   - SENT → CLOSED: после получения подтверждения от контрагента

7. **PDF генерация**: использовать `PdfReportService` (уже существует в `backend/.../infrastructure/report/PdfReportService.java`). Шаблон PDF — строго по форме КС-2 утверждённой Постановлением Госкомстата №100 от 11.11.1999.

8. **Tenant isolation**: все запросы фильтруются по `organization_id` через `SecurityUtils.requireCurrentOrganizationId()`.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр списка КС-2/КС-3 | Да | Да | Да | Да | Да |
| Создание КС-2 | Да | Да | Да | Нет | Нет |
| Генерация КС-2 из объёмов | Да | Да | Да | Нет | Нет |
| Редактирование КС-2 (DRAFT) | Да | Да | Да | Нет | Нет |
| Отправка на согласование | Да | Да | Да | Нет | Нет |
| Согласование (APPROVE) | Да | Да | Нет | Нет | Нет |
| Возврат на доработку | Да | Да | Нет | Нет | Нет |
| Удаление КС-2 (DRAFT) | Да | Да | Нет | Нет | Нет |
| Создание/генерация КС-3 | Да | Да | Нет | Да | Нет |
| Генерация PDF | Да | Да | Да | Да | Нет |
| Управление шаблонами реквизитов | Да | Да | Нет | Нет | Нет |

### Edge Cases

1. **Объёмы без сметных позиций**: если в КС-6а есть записи, для которых нет соответствия в смете — создать строку КС-2 с предупреждением «Расценка не найдена» и нулевой ценой. Пользователь должен указать цену вручную.
2. **Нулевые объёмы**: если за период нет выполненных объёмов — показать предупреждение «За указанный период нет данных об объёмах работ». Разрешить создание пустого КС-2 (для ручного заполнения).
3. **Корректировочный КС-2**: если нужно уменьшить ранее принятые объёмы — разрешить отрицательные значения quantity в строках. Итоговая сумма может быть отрицательной.
4. **Изменение НДС**: если ставка НДС меняется (как было с 18% → 20%) — использовать ставку из шаблона договора, не hardcode.
5. **Большие документы**: КС-2 с 500+ строками — использовать пагинацию строк в UI, lazy loading.
6. **Concurrent editing**: optimistic locking через поле `version`. При конфликте — показать diff и предложить merge.
7. **PDF шрифты**: для корректного отображения кириллицы использовать встроенные шрифты (PT Sans / Liberation Sans). Формат A4, альбомная ориентация для КС-2.

### UX-эталон

**1С:Управление строительной организацией**: эталон для формы КС-2/КС-3 — автозаполнение из сметы, нарастающий итог, печатные формы. **Гранд-Смета**: эталон для расчёта с индексами пересчёта и накладными. Наш подход превосходит 1С за счёт: (1) генерации из полевых данных (а не только из сметы), (2) встроенной КЭП подписи, (3) mobile-friendly UI.

---

## Задача 9: Work Volume Tracking

### Описание

Учёт объёмов выполненных работ — процесс №25 в карте строительных процессов, Tier 1 «Абсолютный минимум». Это фундамент для автогенерации КС-2 (Задача 8), расчёта EVM (Задача 15) и контроля сроков. Текущая реализация в модуле `pto` содержит сущности `Ks6Journal` (журнал КС-6) и `Ks6aRecord` (записи КС-6а — ежемесячный учёт объёмов по декадам). Однако реализация минимальна: `Ks6aRecord` хранит объёмы по трём декадам месяца (first10days, second10days, third10days), но нет связи с WBS-элементами, нет связи с позициями сметы, нет автоматического подсчёта процента выполнения, нет привязки к конкретным участкам/захваткам, нет фотофиксации.

Фронтенд (`frontend/src/modules/pto/Ks6CalendarPage.tsx`) отображает календарь КС-6а, но ввод данных ограничен — нет bulk-ввода, нет мобильной формы для полевого инженера, нет валидации «объём не может превышать проектный».

Целевой UX: полевой инженер на планшете/телефоне выбирает участок работ → вводит фактический объём за смену → прикрепляет фото → система автоматически обновляет КС-6а, пересчитывает процент выполнения WBS-задачи, и помечает превышение планового объёма. Прораб в офисе видит сводную таблицу по всем участкам с цветовой индикацией (зелёный/жёлтый/красный).

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы ks6_journals
ALTER TABLE ks6_journals ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks6_journals ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE ks6_journals ADD COLUMN IF NOT EXISTS journal_number VARCHAR(50);
ALTER TABLE ks6_journals ADD COLUMN IF NOT EXISTS end_date DATE;

CREATE INDEX idx_ks6_org ON ks6_journals(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_ks6_contract ON ks6_journals(contract_id) WHERE deleted = FALSE;

-- Расширение существующей таблицы ks6a_records
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS wbs_node_id UUID;  -- связь с WBS
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS estimate_item_id UUID;  -- связь с позицией сметы
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS cost_code_id UUID;  -- связь с кодом затрат
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS section_name VARCHAR(200);  -- наименование раздела/захватки
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS contract_price NUMERIC(18,2);  -- договорная цена за единицу
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS total_cost NUMERIC(18,2);  -- стоимость = totalActual * contractPrice
ALTER TABLE ks6a_records ADD COLUMN IF NOT EXISTS percent_complete NUMERIC(5,2);  -- процент выполнения

CREATE INDEX idx_ks6a_org ON ks6a_records(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_ks6a_wbs ON ks6a_records(wbs_node_id) WHERE deleted = FALSE;
CREATE INDEX idx_ks6a_estimate ON ks6a_records(estimate_item_id) WHERE deleted = FALSE;

-- Новая таблица: ежедневный ввод объёмов (детализация внутри декады)
CREATE TABLE volume_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    ks6a_record_id UUID REFERENCES ks6a_records(id),
    project_id UUID NOT NULL,
    wbs_node_id UUID,
    entry_date DATE NOT NULL,
    work_name VARCHAR(500) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    planned_volume NUMERIC(18,4),  -- плановый объём на этот день
    actual_volume NUMERIC(18,4) NOT NULL,  -- фактический объём
    section_name VARCHAR(200),  -- участок/захватка
    shift VARCHAR(20) DEFAULT 'DAY',  -- DAY | NIGHT
    entered_by_id UUID NOT NULL,
    verified_by_id UUID,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    location_lat NUMERIC(10,7),  -- GPS координаты (мобильный ввод)
    location_lon NUMERIC(10,7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ve_org_project ON volume_entries(organization_id, project_id) WHERE deleted = FALSE;
CREATE INDEX idx_ve_date ON volume_entries(entry_date) WHERE deleted = FALSE;
CREATE INDEX idx_ve_wbs ON volume_entries(wbs_node_id) WHERE deleted = FALSE;
CREATE INDEX idx_ve_ks6a ON volume_entries(ks6a_record_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_ve_unique_entry ON volume_entries(organization_id, project_id, wbs_node_id, entry_date, shift) WHERE deleted = FALSE;

-- Таблица фотофиксации объёмов
CREATE TABLE volume_entry_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volume_entry_id UUID NOT NULL REFERENCES volume_entries(id),
    file_id UUID NOT NULL,  -- ссылка на MinIO
    file_name VARCHAR(255),
    file_size BIGINT,
    caption VARCHAR(500),
    taken_at TIMESTAMPTZ,
    geo_lat NUMERIC(10,7),
    geo_lon NUMERIC(10,7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_vep_entry ON volume_entry_photos(volume_entry_id) WHERE deleted = FALSE;

-- View для агрегации ежедневных записей в декады КС-6а
CREATE OR REPLACE VIEW v_volume_by_decade AS
SELECT
    ve.organization_id,
    ve.project_id,
    ve.wbs_node_id,
    TO_CHAR(ve.entry_date, 'YYYY-MM') AS month_year,
    SUM(CASE WHEN EXTRACT(DAY FROM ve.entry_date) BETWEEN 1 AND 10 THEN ve.actual_volume ELSE 0 END) AS first_10_days,
    SUM(CASE WHEN EXTRACT(DAY FROM ve.entry_date) BETWEEN 11 AND 20 THEN ve.actual_volume ELSE 0 END) AS second_10_days,
    SUM(CASE WHEN EXTRACT(DAY FROM ve.entry_date) > 20 THEN ve.actual_volume ELSE 0 END) AS third_10_days,
    SUM(ve.actual_volume) AS total_actual
FROM volume_entries ve
WHERE ve.deleted = FALSE
GROUP BY ve.organization_id, ve.project_id, ve.wbs_node_id, TO_CHAR(ve.entry_date, 'YYYY-MM');
```

### API Endpoints

```
-- Журналы КС-6 --

GET /api/ks6-journals
  Query: projectId, contractId, status, page, size
  Response: Page<Ks6JournalResponse>
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks6-journals
  Request: CreateKs6JournalRequest { projectId, contractId, journalNumber, startDate, responsibleEngineerId }
  Response: Ks6JournalResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

-- Записи КС-6а --

GET /api/ks6-journals/{journalId}/records
  Query: monthYear, sectionName, page, size
  Response: Page<Ks6aRecordResponse>
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks6-journals/{journalId}/records
  Request: CreateKs6aRecordRequest { workName, unit, plannedVolume, wbsNodeId?, estimateItemId?, sectionName? }
  Response: Ks6aRecordResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/ks6-journals/{journalId}/records/{recordId}
  Request: UpdateKs6aRecordRequest { first10days?, second10days?, third10days?, notes? }
  Response: Ks6aRecordResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/ks6-journals/{journalId}/records/sync-from-entries
  Request: { monthYear: string }
  Response: { syncedCount: number, updatedRecords: Ks6aRecordResponse[] }
  Описание: Агрегирует volume_entries за указанный месяц в записи КС-6а
  Roles: [ADMIN, MANAGER, ENGINEER]

-- Ежедневный ввод объёмов --

GET /api/volume-entries
  Query: projectId, wbsNodeId, dateFrom, dateTo, enteredById, page, size
  Response: Page<VolumeEntryResponse>
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/volume-entries
  Request: CreateVolumeEntryRequest { projectId, wbsNodeId?, entryDate, workName, unit, actualVolume, sectionName?, shift?, notes?, locationLat?, locationLon? }
  Response: VolumeEntryResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/volume-entries/batch
  Request: BatchCreateVolumeEntriesRequest { entries: CreateVolumeEntryRequest[] }
  Response: { created: number, errors: [{ index: number, message: string }] }
  Описание: Массовый ввод объёмов (до 50 записей за раз)
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/volume-entries/{id}
  Request: UpdateVolumeEntryRequest
  Response: VolumeEntryResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/volume-entries/{id}/verify
  Response: VolumeEntryResponse (verified_by_id + verified_at заполняются)
  Описание: Прораб подтверждает объём, введённый инженером
  Roles: [ADMIN, MANAGER]

DELETE /api/volume-entries/{id}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER] (только неверифицированные)

-- Фото к записям объёмов --

POST /api/volume-entries/{entryId}/photos
  Request: MultipartFile + caption?
  Response: VolumeEntryPhotoResponse { id, fileUrl, caption, takenAt }
  Roles: [ADMIN, MANAGER, ENGINEER]

DELETE /api/volume-entries/{entryId}/photos/{photoId}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER, ENGINEER]

-- Аналитика --

GET /api/volume-analytics/summary
  Query: projectId, dateFrom, dateTo
  Response: VolumeSummaryResponse { totalPlanned, totalActual, percentComplete, bySection: [...], byWbs: [...] }
  Roles: [ADMIN, MANAGER, ENGINEER]

GET /api/volume-analytics/deviation
  Query: projectId, threshold? (default 10%)
  Response: VolumeDeviationResponse[] { wbsNodeId, workName, plannedVolume, actualVolume, deviationPercent, status: OVER | UNDER | ON_TRACK }
  Roles: [ADMIN, MANAGER, ENGINEER]
```

### Экраны (UI Description)

**1. Календарь КС-6а (обновлённый)**
- Расположение: обновить `frontend/src/modules/pto/Ks6CalendarPage.tsx`
- Табличный вид: строки = виды работ, столбцы = декады месяца (I, II, III) + итого
- Цветовая индикация: ячейка зелёная (план выполнен), жёлтая (80-99%), красная (<80%), синяя (>100%)
- Inline-edit: клик на ячейку → ввод значения → Tab для перехода к следующей
- Кнопка «Синхронизировать из ежедневных записей» — агрегирует volume_entries
- Фильтр по участку/захватке, виду работ

**2. Мобильная форма ввода объёмов**
- Расположение: `frontend/src/modules/pto/VolumeEntryMobilePage.tsx` (новый файл)
- Оптимизирована для экранов 375px+
- Быстрый ввод: Дата (default сегодня) | Участок (select) | Вид работ (autocomplete) | Объём (number с крупными кнопками +/-)
- Кнопка камеры: фото с автоматическим GPS и timestamp
- Offline-режим: сохранение в IndexedDB, синхронизация при появлении сети (использовать `frontend/src/stores/offlineQueue.ts`)
- Кнопка «Быстрый ввод» — список вчерашних записей, одним тапом копировать с новой датой
- Swipe-right на записи — удалить (с подтверждением)

**3. Сводная таблица объёмов**
- Расположение: `frontend/src/modules/pto/VolumeSummaryPage.tsx` (новый файл)
- Pivot-таблица: строки = WBS/виды работ, столбцы = даты/недели/месяцы
- Группировка по уровням WBS (сворачиваемое дерево)
- Индикатор выполнения: прогресс-бар (plan vs fact) в каждой строке
- Drill-down: клик на ячейку → список volume_entries с фото
- Экспорт в Excel (формат КС-6а)

**4. Отклонения от плана**
- Расположение: виджет на `frontend/src/modules/pto/PtoDashboardPage.tsx`
- Карточки с критическими отклонениями: красные (>10% отставание), оранжевые (5-10%)
- Клик → детализация с графиком план/факт

### Бизнес-правила и валидации

1. **Уникальность записи**: одна volume_entry на комбинацию (project, wbs_node, date, shift). При повторном вводе — предложить обновить существующую.

2. **Валидация объёма**: actualVolume > 0 (исключение: корректировки могут быть отрицательными). Если actualVolume > plannedVolume * 1.2 (120%) — warning (не блокер).

3. **Автоматическая синхронизация КС-6а**: при создании/обновлении volume_entry — триггер пересчёта соответствующей записи ks6a_records. Агрегация: first10days = SUM(volume_entries WHERE day 1-10), аналогично для second10days и third10days.

4. **Автоматический пересчёт % WBS**: при обновлении объёмов — пересчитать percentComplete у связанного WbsNode: `percentComplete = (totalActualVolume / totalPlannedVolume) * 100`.

5. **Верификация**: записи, введённые ENGINEER, требуют подтверждения MANAGER (verify). Неверифицированные записи помечены предупреждением в UI. В КС-2 попадают только верифицированные объёмы.

6. **Фотофиксация**: для определённых типов работ (скрытые работы, ответственные конструкции) фото ОБЯЗАТЕЛЬНО. Настраивается в проекте.

7. **GPS-валидация**: если координаты volume_entry отличаются от координат проекта более чем на 5 км — warning «Координаты не совпадают с местоположением объекта».

8. **Tenant isolation**: все запросы фильтруются по `organization_id`.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр объёмов | Да | Да | Да | Да (только суммы) | Да (только суммы) |
| Ввод ежедневных объёмов | Да | Да | Да | Нет | Нет |
| Массовый ввод (batch) | Да | Да | Да | Нет | Нет |
| Верификация (подтверждение) | Да | Да | Нет | Нет | Нет |
| Удаление неверифицированных | Да | Да | Нет | Нет | Нет |
| Удаление верифицированных | Да | Нет | Нет | Нет | Нет |
| Редактирование КС-6а напрямую | Да | Да | Нет | Нет | Нет |
| Просмотр аналитики отклонений | Да | Да | Да | Нет | Нет |
| Экспорт в Excel | Да | Да | Да | Да | Нет |

### Edge Cases

1. **Offline-ввод**: инженер вводит данные без интернета. При синхронизации — конфликт: другой пользователь уже ввёл данные за ту же дату/участок. Решение: показать обе записи, пользователь выбирает или объединяет.
2. **Ретроспективный ввод**: ввод объёмов за прошлые даты (например, за вчера). Разрешено до 7 дней назад. Старше — только ADMIN.
3. **Смена единиц измерения**: если в смете единица «м3», а инженер вводит в «м2» — предупреждение о несоответствии.
4. **Нулевой проектный объём**: если plannedVolume = 0 (работа не была запланирована, но выполнена) — percentComplete = N/A, но объём принимается.
5. **Несколько WBS на одну работу**: одна и та же работа может быть привязана к разным WBS-узлам (разные захватки). volume_entry привязывается к конкретному wbs_node_id.
6. **Большой проект**: 1000+ видов работ × 365 дней = 365K записей за год. Использовать пагинацию, индексы, партиционирование volume_entries по месяцам при необходимости.

### UX-эталон

**PlanRadar**: мобильный ввод дефектов с фото и GPS — эталон для мобильной формы ввода объёмов. **Procore**: Daily Log с булк-вводом. **1С:УСО**: форма КС-6а с декадным разбиением. Наш подход уникален: ежедневный mobile-first ввод с автоматической агрегацией в КС-6а и далее в КС-2.

---

## Задача 10: Digital Daily Logs (Общий журнал работ)

### Описание

Общий журнал работ (ОЖР) по форме КС-6 — процесс №24 в карте строительных процессов, Tier 1 «Абсолютный минимум». Ведение ОЖР обязательно по СП 48.13330.2019 «Организация строительства» (п. 8.2-8.4). Это ежедневный документ, фиксирующий: погодные условия, численность рабочих и технику на площадке, выполненные работы по участкам, простои, нарушения ОТ/ПБ, указания авторского надзора, замечания заказчика. Текущая реализация в модуле `ops` содержит сущность `DailyReport` с минимальными полями (workOrderId, reportDate, workDone, issues, laborHours, equipmentHours, weatherImpact) и `WeatherRecord` (projectId, recordDate, temperature, humidity, windSpeed, condition, precipitation, isWorkable). Фронтенд (`frontend/src/modules/operations/DailyLogCreatePage.tsx`) реализует базовую форму с выбором проекта, даты, погоды, рабочих/техники, описания работ и записей по участкам (workArea, workDescription, workersCount, hoursWorked, equipmentUsed, percentComplete).

Критические недостатки текущей реализации: (1) `DailyReport` привязан к `workOrderId`, а не к `projectId` — один daily log должен охватывать ВЕСЬ проект за день. (2) Нет привязки к WBS. (3) Нет раздела «Простои» с указанием причин. (4) Нет раздела «Указания авторского надзора». (5) Нет подписей (прораб, представитель заказчика). (6) Нет генерации PDF по форме КС-6. (7) Форма `handleSubmit` делает только `toast.success` — нет вызова API. (8) Нет мобильной оптимизации для полевого заполнения.

Целевой UX: прораб на площадке открывает мобильное приложение → видит форму ОЖР за сегодня (автозаполнение погоды из API, вчерашние данные как шаблон) → заполняет секции: погода, персонал/техника, работы по захваткам (с привязкой к WBS), простои, ОТ/ПБ, указания надзора → прикрепляет фото → подписывает → заказчик получает уведомление и подтверждает.

### Сущности/Таблицы БД

```sql
-- Новая главная таблица ОЖР (заменяет daily_reports для строительного контекста)
CREATE TABLE daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    log_date DATE NOT NULL,
    log_number VARCHAR(50),  -- порядковый номер в журнале
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SUBMITTED, CONFIRMED, CLOSED

    -- Погода (утро/день/вечер)
    weather_morning VARCHAR(30),  -- CLEAR, CLOUDY, RAIN, SNOW, WIND, FROST, FOG
    weather_day VARCHAR(30),
    weather_evening VARCHAR(30),
    temp_morning NUMERIC(5,1),
    temp_day NUMERIC(5,1),
    temp_evening NUMERIC(5,1),
    wind_speed NUMERIC(5,1),
    humidity NUMERIC(5,1),
    precipitation NUMERIC(6,1),
    is_workable BOOLEAN NOT NULL DEFAULT TRUE,
    weather_notes TEXT,

    -- Ресурсы на площадке
    workers_own INTEGER DEFAULT 0,  -- собственный персонал
    workers_subcontract INTEGER DEFAULT 0,  -- субподрядчики
    workers_total INTEGER DEFAULT 0,
    equipment_units INTEGER DEFAULT 0,
    equipment_details TEXT,  -- JSON: [{type, count, condition}]

    -- Общее описание
    work_description TEXT,
    issues_notes TEXT,  -- проблемы, задержки
    safety_notes TEXT,  -- замечания ОТ/ПБ
    supervision_notes TEXT,  -- указания авторского/технадзора
    customer_notes TEXT,  -- замечания заказчика
    other_notes TEXT,

    -- Подписи
    compiled_by_id UUID NOT NULL,  -- кто заполнил (прораб)
    compiled_by_name VARCHAR(200),
    confirmed_by_id UUID,  -- представитель заказчика
    confirmed_by_name VARCHAR(200),
    confirmed_at TIMESTAMPTZ,
    supervisor_id UUID,  -- представитель авторского надзора
    supervisor_name VARCHAR(200),

    -- Связи
    weather_record_id UUID,  -- связь с weather_records (если заполнялось отдельно)
    pdf_file_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_dl_org_project_date ON daily_logs(organization_id, project_id, log_date) WHERE deleted = FALSE;
CREATE INDEX idx_dl_project ON daily_logs(project_id) WHERE deleted = FALSE;
CREATE INDEX idx_dl_date ON daily_logs(log_date) WHERE deleted = FALSE;
CREATE INDEX idx_dl_status ON daily_logs(status) WHERE deleted = FALSE;
CREATE INDEX idx_dl_compiled_by ON daily_logs(compiled_by_id) WHERE deleted = FALSE;

-- Записи работ по участкам/захваткам (детализация ОЖР)
CREATE TABLE daily_log_work_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id),
    sequence INTEGER DEFAULT 0,
    wbs_node_id UUID,  -- привязка к WBS
    work_area VARCHAR(200),  -- наименование участка/захватки
    work_description TEXT NOT NULL,
    unit VARCHAR(50),
    planned_volume NUMERIC(18,4),
    actual_volume NUMERIC(18,4),
    workers_count INTEGER DEFAULT 0,
    hours_worked NUMERIC(8,2) DEFAULT 0,
    equipment_used TEXT,
    percent_complete NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_dlwe_log ON daily_log_work_entries(daily_log_id) WHERE deleted = FALSE;
CREATE INDEX idx_dlwe_wbs ON daily_log_work_entries(wbs_node_id) WHERE deleted = FALSE;

-- Записи простоев
CREATE TABLE daily_log_downtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id),
    downtime_type VARCHAR(30) NOT NULL,  -- WEATHER, MATERIAL, EQUIPMENT, DESIGN, PERMIT, SUBCONTRACTOR, OTHER
    duration_hours NUMERIC(6,2) NOT NULL,
    affected_workers INTEGER DEFAULT 0,
    affected_equipment INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    work_area VARCHAR(200),
    responsible_party VARCHAR(200),  -- кто виноват
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_dld_log ON daily_log_downtimes(daily_log_id) WHERE deleted = FALSE;

-- Фотографии к ОЖР
CREATE TABLE daily_log_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id),
    work_entry_id UUID,  -- опционально: фото к конкретной записи работ
    file_id UUID NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    caption VARCHAR(500),
    photo_category VARCHAR(30),  -- PROGRESS, SAFETY, DEFECT, GENERAL, WEATHER
    taken_at TIMESTAMPTZ,
    geo_lat NUMERIC(10,7),
    geo_lon NUMERIC(10,7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_dlp_log ON daily_log_photos(daily_log_id) WHERE deleted = FALSE;
CREATE INDEX idx_dlp_work_entry ON daily_log_photos(work_entry_id) WHERE deleted = FALSE;
```

### API Endpoints

```
GET /api/daily-logs
  Query: projectId, dateFrom, dateTo, status, compiledById, page, size, sort
  Response: Page<DailyLogListResponse>
  Roles: [ADMIN, MANAGER, ENGINEER]

GET /api/daily-logs/{id}
  Response: DailyLogResponse (с вложенными workEntries, downtimes, photos)
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

GET /api/daily-logs/by-date?projectId={id}&date={date}
  Response: DailyLogResponse | 404
  Описание: Получить ОЖР за конкретную дату для проекта
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/daily-logs
  Request: CreateDailyLogRequest {
    projectId, logDate,
    weatherMorning?, weatherDay?, weatherEvening?,
    tempMorning?, tempDay?, tempEvening?,
    windSpeed?, humidity?, precipitation?, isWorkable?,
    workersOwn?, workersSubcontract?, equipmentUnits?, equipmentDetails?,
    workDescription?, issuesNotes?, safetyNotes?, supervisionNotes?, customerNotes?,
    workEntries: [CreateWorkEntryRequest],
    downtimes?: [CreateDowntimeRequest]
  }
  Response: DailyLogResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/daily-logs/{id}
  Request: UpdateDailyLogRequest
  Response: DailyLogResponse (только в статусе DRAFT)
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/daily-logs/{id}/submit
  Response: DailyLogResponse (status → SUBMITTED)
  Описание: Прораб подтверждает ОЖР за день
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/daily-logs/{id}/confirm
  Request: { confirmedByName?: string, notes?: string }
  Response: DailyLogResponse (status → CONFIRMED)
  Описание: Представитель заказчика подтверждает ОЖР
  Roles: [ADMIN, MANAGER]

POST /api/daily-logs/{id}/close
  Response: DailyLogResponse (status → CLOSED)
  Roles: [ADMIN]

POST /api/daily-logs/{id}/return
  Request: { reason: string }
  Response: DailyLogResponse (status → DRAFT)
  Roles: [ADMIN, MANAGER]

POST /api/daily-logs/{id}/generate-pdf
  Response: { pdfUrl: string, fileId: UUID }
  Описание: PDF по форме КС-6 (Общий журнал работ)
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/daily-logs/prefill?projectId={id}&date={date}
  Response: DailyLogPrefillResponse { weatherData?, yesterdayWorkEntries?, projectWorkers?, projectEquipment? }
  Описание: Автозаполнение: погода из OpenWeatherMap API, вчерашние записи как шаблон
  Roles: [ADMIN, MANAGER, ENGINEER]

DELETE /api/daily-logs/{id}
  Response: 204 No Content (только DRAFT)
  Roles: [ADMIN, MANAGER]

-- Фото --

POST /api/daily-logs/{logId}/photos
  Request: MultipartFile + caption? + photoCategory?
  Response: DailyLogPhotoResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

DELETE /api/daily-logs/{logId}/photos/{photoId}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER, ENGINEER] (только DRAFT)

-- Аналитика --

GET /api/daily-logs/analytics/summary
  Query: projectId, dateFrom, dateTo
  Response: DailyLogSummaryResponse {
    totalDays, workableDays, downtimeDays,
    totalWorkerDays, avgWorkersPerDay,
    downtimeByType: [{type, totalHours, count}],
    weatherDistribution: [{condition, count}]
  }
  Roles: [ADMIN, MANAGER]
```

### Экраны (UI Description)

**1. Список ОЖР**
- Расположение: обновить `frontend/src/modules/operations/DailyLogListPage.tsx`
- Таблица: Дата | Проект | Прораб | Рабочие | Техника | Погода (иконка) | Статус | Действия
- Фильтры: проект, даты (от-до), статус, прораб
- Календарный вид (toggle): дни месяца с цветовой индикацией (зелёный = CONFIRMED, жёлтый = SUBMITTED, серый = DRAFT, красный = нет записи)
- Кнопка «Создать за сегодня» — ведёт на форму с автозаполнением

**2. Форма создания/редактирования ОЖР (обновлённая)**
- Расположение: обновить `frontend/src/modules/operations/DailyLogCreatePage.tsx`
- Accordion-секции (сворачиваемые):
  - **Погода**: 3 колонки (утро/день/вечер), каждая с Select погоды + Input температуры. Иконки погоды. Кнопка «Загрузить из метео-API» (автозаполнение).
  - **Персонал и техника**: собственные рабочие, субподрядчики, итого. Техника: тип + количество (динамические строки).
  - **Выполненные работы**: repeater-форма (как сейчас), но с добавлением: (a) Autocomplete привязки к WBS, (b) поле «Объём», (c) привязка фото к записи.
  - **Простои**: repeater: тип (dropdown) | часы | описание | ответственный
  - **Замечания**: 4 textarea: проблемы, ОТ/ПБ, авторский надзор, заказчик
  - **Фото**: drag-n-drop зона + камера (мобильный). Галерея с превью.
- Sticky footer: «Сохранить черновик» | «Отправить прорабу» | «Предпросмотр PDF»
- Мобильная версия: секции в виде swipeable tabs
- Offline: сохранение через `offlineQueue` store

**3. Детальный просмотр ОЖР**
- Расположение: обновить `frontend/src/modules/operations/DailyLogDetailPage.tsx`
- Карточка-шапка: проект, дата, прораб, статус
- Секция погоды: 3 карточки (утро/день/вечер) с иконками и температурой
- Секция ресурсов: metric cards (рабочие, техника)
- Таблица работ с progress bar по каждой строке
- Таблица простоев с визуальной разбивкой по типам (pie chart)
- Галерея фото (lightbox при клике)
- Timeline подписей: кто заполнил → кто подтвердил → закрыт

**4. Аналитика ОЖР**
- Расположение: виджет на dashboard операций
- Графики: рабочие дни vs простои (stacked bar), средняя численность по дням, распределение причин простоев (donut chart)

### Бизнес-правила и валидации

1. **Один ОЖР на проект на дату**: уникальный индекс (organization_id, project_id, log_date). При попытке создать дубль — вернуть существующий для редактирования.

2. **Обязательные поля**: projectId, logDate, compiledById, хотя бы одна запись работ ИЛИ отметка isWorkable = false (нерабочий день).

3. **Автонумерация**: logNumber = порядковый номер в рамках проекта с начала строительства. Формат: «{число}» (1, 2, 3...).

4. **Статусная машина**:
   - DRAFT → SUBMITTED: прораб завершил заполнение. Валидация обязательных полей.
   - SUBMITTED → CONFIRMED: представитель заказчика подтвердил. Записывается confirmed_by_id, confirmed_at.
   - SUBMITTED → DRAFT: возврат на доработку с указанием причины.
   - CONFIRMED → CLOSED: финальное закрытие (конец месяца / конец проекта).
   - CLOSED: изменения невозможны.

5. **Автозаполнение погоды**: интеграция с OpenWeatherMap API (бесплатный тариф — 60 req/min). По GPS координатам проекта получить текущую погоду. Если API недоступен — ручной ввод.

6. **Связь с объёмами (Задача 9)**: при заполнении workEntry с wbsNodeId и actualVolume — автоматически создавать/обновлять volume_entry за этот день.

7. **workers_total**: автоматически = workers_own + workers_subcontract.

8. **Дата не в будущем**: logDate <= TODAY.

9. **Ретроспективный ввод**: разрешён до 3 дней назад без ограничений. 4-7 дней — с предупреждением. Более 7 дней — только ADMIN.

10. **Tenant isolation**: все запросы фильтруются по `organization_id`.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр списка ОЖР | Да | Да | Да (свои проекты) | Нет | Да (только read) |
| Создание ОЖР | Да | Да | Да | Нет | Нет |
| Редактирование (DRAFT) | Да | Да | Да (автор) | Нет | Нет |
| Отправка (SUBMIT) | Да | Да | Да (автор) | Нет | Нет |
| Подтверждение (CONFIRM) | Да | Да | Нет | Нет | Нет |
| Возврат на доработку | Да | Да | Нет | Нет | Нет |
| Закрытие (CLOSE) | Да | Нет | Нет | Нет | Нет |
| Удаление (DRAFT) | Да | Да | Нет | Нет | Нет |
| Генерация PDF | Да | Да | Да | Нет | Нет |
| Просмотр аналитики | Да | Да | Нет | Нет | Нет |

### Edge Cases

1. **Нерабочий день из-за погоды**: isWorkable = false, но ОЖР всё равно заполняется (погода, охрана, дежурный персонал). Работы = 0, но простой фиксируется с типом WEATHER.
2. **Несколько смен**: если проект работает в 2 смены — один ОЖР за день, но в workEntries указывается shift (DAY/NIGHT) для каждой записи.
3. **Субподрядчики**: workEntries могут включать работы субподрядчиков. Поле `isSubcontractor` boolean + subcontractorName.
4. **Праздничные/выходные дни**: система не запрещает создание ОЖР в выходные (стройка часто работает без выходных).
5. **Очень большой ОЖР**: крупная стройка с 50+ участков работ — использовать виртуализацию списка в UI.
6. **Потеря данных**: offline-ввод + потеря устройства. Решение: автосохранение каждые 30 секунд в localStorage/IndexedDB + синхронизация при подключении.
7. **Фото без GPS**: камера десктопа не имеет GPS. Не блокировать — GPS опциональный.

### UX-эталон

**Procore Daily Log**: эталон UX для ежедневного журнала — секции по категориям, bulk-ввод, мобильная форма. **Fieldwire**: мобильный UX с фотофиксацией и offline. **СтройКонтроль (Россия)**: форма КС-6 с погодой и подписями. Наш подход объединяет: (1) мобильный UX Procore, (2) offline Fieldwire, (3) российскую форму КС-6, (4) автоматическую связь с учётом объёмов.

---

## Задача 11: Basic CPM Scheduling Enhancement

### Описание

Календарно-сетевое планирование методом критического пути (CPM) — процесс №19, Tier 1. Текущая реализация в модуле `planning` уже содержит рабочий CPM-расчёт: `WbsNodeService.java` реализует forward pass (алгоритм Кана для топологической сортировки), backward pass, определение критического пути с расчётом float. Сущности `WbsNode` (с полями earlyStart/earlyFinish, lateStart/lateFinish, totalFloat, freeFloat, isCritical), `WbsDependency` (predecessorId, successorId, dependencyType: FS/SS/FF/SF, lagDays) и `EvmSnapshot` (BAC, PV, EV, AC, CPI, SPI) полностью готовы. Фронтенд содержит `GanttChartPage.tsx` с tree view, вычислением временного диапазона, подсветкой критического пути и линией «сегодня».

Критические недостатки: (1) Gantt-диаграмма read-only — нельзя drag-n-drop задачи, создавать зависимости. (2) Нет baseline (базовой линии) для сравнения план/факт. Сущность `ScheduleBaseline` существует, но не связана с UI. (3) Нет ресурсного планирования — назначение ресурсов на задачи не визуализировано. (4) Нет автоматического пересчёта при изменении дат. (5) Нет визуализации float (запаса времени). (6) Нет импорта из MS Project / Primavera P6 (.mpp, .xer). (7) Нет фильтрации по критическому пути, по ответственному, по уровню WBS.

Целевой UX: планировщик открывает интерактивный Gantt → создаёт задачи drag-n-drop → рисует зависимости (стрелки между задачами) → система автоматически рассчитывает CPM → красным выделяет критический путь → при сдвиге задачи автоматически пересчитывает все зависимые → показывает baseline для сравнения план/факт → экспортирует в PDF/PNG для отчёта заказчику.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы wbs_nodes
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS calendar_id UUID;  -- рабочий календарь
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS constraint_type VARCHAR(30);  -- ASAP, ALAP, SNET, SNLT, FNET, FNLT, MSO, MFO
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS constraint_date DATE;
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 500;  -- 0-1000, для ресурсного выравнивания
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS color VARCHAR(7);  -- hex цвет для визуализации (#FF5733)
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE;
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS is_summary BOOLEAN DEFAULT FALSE;  -- суммарная задача (автоматически если есть дочерние)
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS planned_cost NUMERIC(18,2);
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(18,2);
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS remaining_duration INTEGER;  -- оставшаяся длительность в днях

CREATE INDEX idx_wbs_org ON wbs_nodes(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_wbs_critical ON wbs_nodes(project_id, is_critical) WHERE deleted = FALSE AND is_critical = TRUE;
CREATE INDEX idx_wbs_milestone ON wbs_nodes(project_id, is_milestone) WHERE deleted = FALSE AND is_milestone = TRUE;

-- Расширение существующей таблицы wbs_dependencies
ALTER TABLE wbs_dependencies ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Расширение существующей таблицы schedule_baselines (если существует)
-- Если не существует — создать:
CREATE TABLE IF NOT EXISTS schedule_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    baseline_number INTEGER NOT NULL,  -- 0 = original, 1, 2, ... = revisions
    created_by_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sb_project ON schedule_baselines(project_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_sb_project_number ON schedule_baselines(organization_id, project_id, baseline_number) WHERE deleted = FALSE;

-- Снимки задач для baseline
CREATE TABLE IF NOT EXISTS schedule_baseline_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    baseline_id UUID NOT NULL REFERENCES schedule_baselines(id),
    wbs_node_id UUID NOT NULL,  -- ссылка на оригинальный WbsNode
    planned_start_date DATE,
    planned_end_date DATE,
    duration INTEGER,
    planned_cost NUMERIC(18,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sbn_baseline ON schedule_baseline_nodes(baseline_id) WHERE deleted = FALSE;
CREATE INDEX idx_sbn_node ON schedule_baseline_nodes(wbs_node_id) WHERE deleted = FALSE;

-- Рабочие календари (для корректного расчёта длительности)
CREATE TABLE work_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    work_days VARCHAR(7) NOT NULL DEFAULT '1111100',  -- Пн-Вс (1=рабочий, 0=выходной)
    work_hours_per_day NUMERIC(4,1) DEFAULT 8.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wc_org ON work_calendars(organization_id) WHERE deleted = FALSE;

-- Исключения календаря (праздники, специальные дни)
CREATE TABLE work_calendar_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES work_calendars(id),
    exception_date DATE NOT NULL,
    is_working BOOLEAN NOT NULL DEFAULT FALSE,  -- false = выходной, true = рабочий (перенос)
    name VARCHAR(200),
    work_hours NUMERIC(4,1),  -- если is_working = true, сколько часов
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wce_calendar ON work_calendar_exceptions(calendar_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_wce_cal_date ON work_calendar_exceptions(calendar_id, exception_date) WHERE deleted = FALSE;

-- Назначение ресурсов на задачи
CREATE TABLE task_resource_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    wbs_node_id UUID NOT NULL REFERENCES wbs_nodes(id),
    resource_type VARCHAR(30) NOT NULL,  -- LABOR, EQUIPMENT, MATERIAL
    resource_id UUID,  -- employee_id | equipment_id | material_id
    resource_name VARCHAR(200) NOT NULL,
    units NUMERIC(8,2) DEFAULT 100.00,  -- процент загрузки (100% = полная занятость)
    planned_hours NUMERIC(10,2),
    actual_hours NUMERIC(10,2) DEFAULT 0,
    cost_per_hour NUMERIC(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_tra_wbs ON task_resource_assignments(wbs_node_id) WHERE deleted = FALSE;
CREATE INDEX idx_tra_resource ON task_resource_assignments(resource_type, resource_id) WHERE deleted = FALSE;
```

### API Endpoints

```
-- WBS Nodes (расширение существующих) --

GET /api/projects/{projectId}/wbs
  Query: parentId?, level?, isCritical?, responsibleId?, search?, includeBaseline?: boolean, baselineId?: UUID
  Response: WbsTreeResponse[] (дерево с вложенностью, включая baseline даты если запрошено)
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

POST /api/projects/{projectId}/wbs
  Request: CreateWbsNodeRequest { parentId?, name, code?, nodeType, plannedStartDate, plannedEndDate, duration?, responsibleId?, costCodeId?, isMilestone?, priority?, color?, notes? }
  Response: WbsNodeResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

PUT /api/projects/{projectId}/wbs/{nodeId}
  Request: UpdateWbsNodeRequest { name?, plannedStartDate?, plannedEndDate?, duration?, actualStartDate?, actualEndDate?, percentComplete?, responsibleId?, isMilestone?, priority?, color?, notes? }
  Response: WbsNodeResponse
  Описание: При изменении дат — автоматический пересчёт CPM для всего проекта
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/projects/{projectId}/wbs/batch-update
  Request: BatchUpdateWbsRequest { updates: [{ nodeId, plannedStartDate?, plannedEndDate?, duration?, percentComplete? }] }
  Response: { updated: number, cpmRecalculated: boolean }
  Описание: Массовое обновление (drag-n-drop нескольких задач)
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/projects/{projectId}/wbs/{nodeId}/move
  Request: { newParentId?: UUID, newSortOrder: number }
  Response: WbsNodeResponse
  Roles: [ADMIN, MANAGER]

DELETE /api/projects/{projectId}/wbs/{nodeId}
  Response: 204 No Content
  Roles: [ADMIN, MANAGER] (только leaf-узлы или пустые summary)

-- Dependencies --

GET /api/projects/{projectId}/dependencies
  Response: WbsDependencyResponse[]
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

POST /api/projects/{projectId}/dependencies
  Request: CreateDependencyRequest { predecessorId, successorId, dependencyType?: FS|SS|FF|SF, lagDays?: number }
  Response: WbsDependencyResponse
  Описание: После создания — автоматический пересчёт CPM
  Roles: [ADMIN, MANAGER, ENGINEER]

DELETE /api/projects/{projectId}/dependencies/{depId}
  Response: 204 No Content
  Описание: После удаления — автоматический пересчёт CPM
  Roles: [ADMIN, MANAGER, ENGINEER]

-- CPM Calculation --

POST /api/projects/{projectId}/cpm/recalculate
  Response: CpmResultResponse { criticalPathNodes: UUID[], totalDuration: number, projectEndDate: date, changedNodes: number }
  Описание: Принудительный пересчёт CPM (обычно автоматический)
  Roles: [ADMIN, MANAGER, ENGINEER]

GET /api/projects/{projectId}/cpm/critical-path
  Response: CriticalPathResponse { nodes: WbsNodeResponse[], totalDuration: number, totalFloat: number }
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

-- Baselines --

GET /api/projects/{projectId}/baselines
  Response: ScheduleBaselineResponse[]
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

POST /api/projects/{projectId}/baselines
  Request: CreateBaselineRequest { name, description? }
  Response: ScheduleBaselineResponse
  Описание: Сохраняет снимок текущего расписания (все wbs_nodes.planned_start/end)
  Roles: [ADMIN, MANAGER]

GET /api/projects/{projectId}/baselines/{baselineId}/compare
  Response: BaselineComparisonResponse[] { nodeId, nodeName, baselineStart, baselineEnd, currentStart, currentEnd, slippageDays }
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

DELETE /api/projects/{projectId}/baselines/{baselineId}
  Response: 204 No Content (нельзя удалить active baseline)
  Roles: [ADMIN]

-- Calendars --

GET /api/work-calendars
  Response: WorkCalendarResponse[]
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/work-calendars
  Request: CreateCalendarRequest { name, workDays, workHoursPerDay, exceptions?: [...] }
  Response: WorkCalendarResponse
  Roles: [ADMIN, MANAGER]

PUT /api/work-calendars/{id}
  Request: UpdateCalendarRequest
  Response: WorkCalendarResponse
  Roles: [ADMIN, MANAGER]

-- Resource Assignments --

GET /api/projects/{projectId}/wbs/{nodeId}/resources
  Response: TaskResourceAssignmentResponse[]
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/projects/{projectId}/wbs/{nodeId}/resources
  Request: CreateResourceAssignmentRequest { resourceType, resourceId?, resourceName, units?, plannedHours?, costPerHour? }
  Response: TaskResourceAssignmentResponse
  Roles: [ADMIN, MANAGER, ENGINEER]

-- Gantt Data (оптимизированный endpoint для визуализации) --

GET /api/projects/{projectId}/gantt
  Query: dateFrom?, dateTo?, level?, showCriticalOnly?, showBaseline?: boolean, baselineId?
  Response: GanttDataResponse {
    nodes: GanttNodeResponse[],  -- плоский список с indent level
    dependencies: GanttDependencyResponse[],
    baselines?: GanttBaselineResponse[],
    criticalPath: UUID[],
    projectStartDate, projectEndDate,
    todayLine: date
  }
  Roles: [ADMIN, MANAGER, ENGINEER, VIEWER]

-- Export --

POST /api/projects/{projectId}/gantt/export
  Request: { format: PDF|PNG|XLSX, dateRange?, showBaseline?, showCritical?, paperSize?: A4|A3|A2 }
  Response: { fileUrl: string, fileId: UUID }
  Roles: [ADMIN, MANAGER, ENGINEER]
```

### Экраны (UI Description)

**1. Интерактивный Gantt Chart (обновлённый)**
- Расположение: обновить `frontend/src/modules/planning/GanttChartPage.tsx`
- Левая панель (30%): дерево WBS (сворачиваемое) с колонками: Задача | Начало | Конец | Длит. | % | Ответственный
- Правая панель (70%): временная шкала с горизонтальными полосками задач
  - Масштаб: день / неделя / месяц / квартал (zoom in/out)
  - Критический путь: красные полоски, жирный контур
  - Обычные задачи: синие полоски
  - Milestone: ромбик
  - Summary: серая полоска с треугольниками на концах
  - Float: тонкая серая линия после полоски (визуализация запаса)
  - Baseline: тонкая серая полоска ПОД текущей (если включен показ baseline)
  - Зависимости: стрелки между задачами (FS: стрелка от конца к началу, SS/FF/SF — соответственно)
- Drag-n-drop:
  - Перетаскивание полоски → сдвиг дат (с автопересчётом CPM)
  - Перетаскивание правого края → изменение длительности
  - Drag от правого края одной задачи к левому краю другой → создание зависимости FS
- Toolbar: Zoom (+/-) | Показать критический путь (toggle) | Показать baseline (select) | Фильтр по ответственному | Экспорт PDF/PNG
- Today line: красная вертикальная линия
- Контекстное меню (правый клик): Редактировать | Удалить | Добавить зависимость | Назначить ресурсы | Отметить milestone

**2. Форма редактирования задачи (модальное окно)**
- Расположение: `frontend/src/modules/planning/WbsNodeEditModal.tsx` (новый файл)
- Табы: Общие | Даты и длительность | Зависимости | Ресурсы | Заметки
- Общие: Название, Код WBS, Тип (Activity/Milestone/Summary), Ответственный (select), Приоритет, Цвет
- Даты: Плановое начало/конец, Фактическое начало/конец, Длительность (авто), % выполнения (slider)
- Зависимости: таблица предшественников и последователей, кнопка «Добавить»
- Ресурсы: таблица назначений (тип | имя | % загрузки | часы)

**3. Baseline Comparison View**
- Расположение: `frontend/src/modules/planning/BaselineComparisonPage.tsx` (новый файл)
- Gantt с двумя линиями для каждой задачи: baseline (серая) и текущая (синяя/красная)
- Таблица отклонений: Задача | Базовое начало | Текущее начало | Сдвиг дней | Статус (Ahead/On Track/Behind)
- Цветовая индикация: зелёный (опережение), серый (по плану), красный (отставание)

**4. Ресурсная диаграмма**
- Расположение: `frontend/src/modules/planning/ResourceHistogramPage.tsx` (новый файл)
- Горизонт: совпадает с Gantt
- Гистограмма: загрузка ресурса по дням/неделям (часы)
- Красная линия: доступная мощность (8ч × % загрузки)
- Перегрузка: область выше красной линии заливается красным

### Бизнес-правила и валидации

1. **Автоматический CPM-пересчёт**: при ЛЮБОМ изменении дат задачи, создании/удалении зависимости — автоматический вызов `recalculateCpm()`. Если проект имеет > 5000 задач — выполнять асинхронно (Spring @Async) и уведомлять по WebSocket.

2. **Типы зависимостей**:
   - FS (Finish-to-Start): successorStart >= predecessorFinish + lag (по умолчанию)
   - SS (Start-to-Start): successorStart >= predecessorStart + lag
   - FF (Finish-to-Finish): successorFinish >= predecessorFinish + lag
   - SF (Start-to-Finish): successorFinish >= predecessorStart + lag
   - Lag: положительный (задержка) или отрицательный (опережение, lead)

3. **Циклическая зависимость**: перед созданием зависимости проверить отсутствие цикла (DFS). Если цикл обнаружен — HTTP 400 «Циклическая зависимость невозможна».

4. **Summary tasks**: длительность и даты суммарной задачи автоматически рассчитываются из дочерних (min start, max end). Нельзя вручную менять даты summary task.

5. **Рабочий календарь**: длительность в рабочих днях. При расчёте дат учитывать выходные и праздники из work_calendars / work_calendar_exceptions.

6. **Constraint types**:
   - ASAP (As Soon As Possible) — по умолчанию
   - ALAP (As Late As Possible)
   - SNET (Start No Earlier Than) — constraintDate
   - SNLT (Start No Later Than) — constraintDate
   - FNET (Finish No Earlier Than) — constraintDate
   - FNLT (Finish No Later Than) — constraintDate
   - MSO (Must Start On) — constraintDate (жёсткое)
   - MFO (Must Finish On) — constraintDate (жёсткое)

7. **Baseline**: при создании baseline сохраняются planned_start/end и duration ВСЕХ wbs_nodes проекта. Максимум 10 baselines на проект.

8. **Tenant isolation**: все запросы фильтруются по `organization_id`.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр Gantt | Да | Да | Да | Да (read-only) | Да (read-only) |
| Создание/редактирование задач | Да | Да | Да | Нет | Нет |
| Drag-n-drop на Gantt | Да | Да | Да | Нет | Нет |
| Создание/удаление зависимостей | Да | Да | Да | Нет | Нет |
| Создание baseline | Да | Да | Нет | Нет | Нет |
| Удаление baseline | Да | Нет | Нет | Нет | Нет |
| Управление календарями | Да | Да | Нет | Нет | Нет |
| Назначение ресурсов | Да | Да | Да | Нет | Нет |
| Экспорт PDF/PNG | Да | Да | Да | Да | Да |
| Удаление задач | Да | Да | Нет | Нет | Нет |

### Edge Cases

1. **Большие проекты**: 5000+ задач — Gantt рендерить с виртуализацией (только видимые строки). CPM-расчёт O(V+E) — работает за <1 сек для 5000 задач.
2. **Drag-n-drop с зависимостями**: при сдвиге задачи, если зависимые задачи «вылезают» за constraints — показать предупреждение «Нарушен constraint для задачи X».
3. **Отрицательный float**: если критический путь длиннее дедлайна проекта — total float отрицательный. Показывать красным числом.
4. **Удаление задачи с зависимостями**: при удалении — каскадно удалять зависимости (predecessorId = nodeId OR successorId = nodeId) и пересчитывать CPM.
5. **Import MS Project**: .mpp формат проприетарный. Реализовать через промежуточный XML/CSV. .xer (Primavera) — текстовый формат, парсить напрямую.
6. **Concurrent editing**: два пользователя одновременно двигают задачи. Optimistic locking + WebSocket: при изменении другим пользователем — уведомление «Расписание изменено, обновите страницу».
7. **Circular dependency через lag**: A →FS(lag=-5)→ B →FS→ A — это не прямой цикл, но может создать невалидное расписание. Проверять через полный пересчёт.

### UX-эталон

**Microsoft Project**: эталон интерактивного Gantt с drag-n-drop, baseline, resource leveling. **Primavera P6**: эталон CPM для строительства (constraints, multiple calendars, baselines). **Monday.com**: эталон для drag-n-drop UX (smooth animation, undo). Наш подход: CPM-точность Primavera + UX-простота Monday + web-доступность (без установки).

---

## Задача 12: 1C Integration (синхронизация данных)

### Описание

Двусторонняя интеграция с 1С:Бухгалтерия/1С:УСО — процесс №34 в карте строительных процессов. Для российского рынка 1С — де-факто стандарт бухгалтерского учёта, и интеграция с 1С — обязательное условие для 90%+ потенциальных клиентов. Текущая реализация в модуле `integration` содержит: `OneCConfig` (baseUrl, username, password (plaintext!), databaseName, syncDirection, syncIntervalMinutes), `OneCExchangeLog` (логи обменов), `OneCMapping` (маппинг сущностей ПРИВОД ↔ 1С). `OneCIntegrationService.java` реализует: CRUD для конфигов, connection test, sync operations через OData protocol с Basic auth, retry-механизм для сетевых ошибок.

Критические недостатки: (1) **Пароль в plaintext** (`OneCConfig.password` — тип TEXT без шифрования). При компрометации БД — все пароли 1С утекают. (2) Нет маппинга конкретных сущностей — service содержит заглушки `syncInvoices()`, `syncPayments()`, `syncEmployees()` и т.д., но логика маппинга не реализована. (3) Нет conflict resolution — при двусторонней синхронизации нет стратегии разрешения конфликтов. (4) Нет webhook/push — только pull (по расписанию). (5) Нет delta-sync — каждый раз синхронизируется всё. (6) Нет мониторинга здоровья интеграции.

Целевой UX: администратор настраивает подключение к 1С (URL, логин, зашифрованный пароль) → выбирает сущности для синхронизации (контрагенты, счета, оплаты, проводки) → задаёт расписание → система автоматически синхронизирует данные → при конфликтах показывает diff и предлагает варианты → dashboard мониторинга показывает статус синхронизации в реальном времени.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы onec_configs
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS password_encrypted VARCHAR(1000);  -- AES-256 зашифрованный пароль
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS api_type VARCHAR(20) DEFAULT 'ODATA';  -- ODATA | COM | REST_API | FILE_EXCHANGE
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS version_1c VARCHAR(50);  -- "8.3.24", "8.3.25" и т.д.
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS configuration_name VARCHAR(200);  -- "Бухгалтерия предприятия", "УСО"
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'UNKNOWN';  -- OK, ERROR, DEGRADED, UNKNOWN
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ;
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;
ALTER TABLE onec_configs ADD COLUMN IF NOT EXISTS last_error_message TEXT;
-- Удалить после миграции данных: ALTER TABLE onec_configs DROP COLUMN IF EXISTS password;

CREATE INDEX idx_onec_org ON onec_configs(organization_id) WHERE deleted = FALSE;

-- Настройки синхронизации по типам сущностей
CREATE TABLE onec_sync_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    config_id UUID NOT NULL REFERENCES onec_configs(id),
    entity_type VARCHAR(50) NOT NULL,  -- COUNTERPARTY, INVOICE, PAYMENT, BANK_STATEMENT, GL_ENTRY, EMPLOYEE, MATERIAL, CONTRACT
    sync_direction VARCHAR(20) NOT NULL DEFAULT 'BIDIRECTIONAL',  -- TO_1C, FROM_1C, BIDIRECTIONAL
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 60,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),  -- SUCCESS, PARTIAL, ERROR
    last_sync_count INTEGER DEFAULT 0,
    conflict_strategy VARCHAR(30) DEFAULT 'MANUAL',  -- PRIVOD_WINS, 1C_WINS, MANUAL, NEWEST_WINS
    filter_expression TEXT,  -- OData $filter для выборки (например, "ДатаНачала ge '2026-01-01'")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_oss_config_entity ON onec_sync_settings(config_id, entity_type) WHERE deleted = FALSE;
CREATE INDEX idx_oss_org ON onec_sync_settings(organization_id) WHERE deleted = FALSE;

-- Расширение существующей таблицы onec_mappings
ALTER TABLE onec_mappings ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE onec_mappings ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE onec_mappings ADD COLUMN IF NOT EXISTS last_hash VARCHAR(64);  -- SHA-256 хэш данных для delta-sync
ALTER TABLE onec_mappings ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'SYNCED';  -- SYNCED, PENDING, CONFLICT, ERROR
ALTER TABLE onec_mappings ADD COLUMN IF NOT EXISTS conflict_data JSONB;  -- данные конфликта для ручного разрешения

CREATE INDEX idx_om_org ON onec_mappings(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_om_status ON onec_mappings(sync_status) WHERE sync_status != 'SYNCED' AND deleted = FALSE;

-- Очередь синхронизации (для delta-sync)
CREATE TABLE onec_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    config_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,  -- ID в ПРИВОД
    operation VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE
    payload JSONB,  -- данные для отправки
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED, RETRY
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_osq_status ON onec_sync_queue(status, scheduled_at) WHERE deleted = FALSE;
CREATE INDEX idx_osq_org_config ON onec_sync_queue(organization_id, config_id) WHERE deleted = FALSE;

-- Расширение существующей таблицы onec_exchange_logs
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS sync_setting_id UUID;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS records_total INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS records_created INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS records_updated INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS records_skipped INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS records_failed INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS conflicts_count INTEGER DEFAULT 0;
ALTER TABLE onec_exchange_logs ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
```

### API Endpoints

```
-- Configs --

GET /api/integrations/1c/configs
  Response: Page<OneCConfigResponse> (пароль НЕ возвращается)
  Roles: [ADMIN]

GET /api/integrations/1c/configs/{id}
  Response: OneCConfigResponse
  Roles: [ADMIN]

POST /api/integrations/1c/configs
  Request: CreateOneCConfigRequest { name, baseUrl, username, password, databaseName, apiType?, version1c?, configurationName?, syncDirection?, syncIntervalMinutes? }
  Response: OneCConfigResponse
  Описание: Пароль шифруется AES-256 перед сохранением
  Roles: [ADMIN]

PUT /api/integrations/1c/configs/{id}
  Request: UpdateOneCConfigRequest { name?, baseUrl?, username?, password?, databaseName?, syncDirection?, syncIntervalMinutes?, isActive? }
  Response: OneCConfigResponse
  Roles: [ADMIN]

POST /api/integrations/1c/configs/{id}/test
  Response: ConnectionTestResponse { success: boolean, version?: string, configuration?: string, latencyMs?: number, error?: string }
  Описание: Тест подключения к 1С (OData $metadata)
  Roles: [ADMIN]

DELETE /api/integrations/1c/configs/{id}
  Response: 204 No Content
  Roles: [ADMIN]

-- Sync Settings --

GET /api/integrations/1c/configs/{configId}/sync-settings
  Response: OneCSyncSettingResponse[]
  Roles: [ADMIN]

PUT /api/integrations/1c/configs/{configId}/sync-settings
  Request: UpsertSyncSettingsRequest { settings: [{ entityType, syncDirection, isEnabled, syncIntervalMinutes?, conflictStrategy?, filterExpression? }] }
  Response: OneCSyncSettingResponse[]
  Roles: [ADMIN]

-- Manual Sync --

POST /api/integrations/1c/configs/{configId}/sync
  Request: StartSyncRequest { entityTypes?: string[], fullSync?: boolean }
  Response: SyncJobResponse { jobId: UUID, status: STARTED, entityTypes: string[] }
  Описание: Запуск ручной синхронизации. fullSync=true — полная (игнорировать delta), false — инкрементальная.
  Roles: [ADMIN]

GET /api/integrations/1c/sync-jobs/{jobId}
  Response: SyncJobDetailResponse { jobId, status, progress: number, entityResults: [{entityType, total, created, updated, skipped, failed, conflicts}] }
  Roles: [ADMIN]

POST /api/integrations/1c/sync-jobs/{jobId}/cancel
  Response: { success: true }
  Roles: [ADMIN]

-- Exchange Logs --

GET /api/integrations/1c/exchange-logs
  Query: configId?, entityType?, status?, dateFrom?, dateTo?, page, size
  Response: Page<OneCExchangeLogResponse>
  Roles: [ADMIN]

-- Conflicts --

GET /api/integrations/1c/conflicts
  Query: configId?, entityType?, page, size
  Response: Page<OneCConflictResponse> { mappingId, entityType, privodData: JSON, onecData: JSON, conflictFields: string[], detectedAt }
  Roles: [ADMIN]

POST /api/integrations/1c/conflicts/{mappingId}/resolve
  Request: ResolveConflictRequest { resolution: 'PRIVOD_WINS' | '1C_WINS' | 'MERGE', mergedData?: JSON }
  Response: OneCMappingResponse
  Roles: [ADMIN]

POST /api/integrations/1c/conflicts/resolve-all
  Request: { resolution: 'PRIVOD_WINS' | '1C_WINS', entityType?: string }
  Response: { resolved: number }
  Roles: [ADMIN]

-- Dashboard --

GET /api/integrations/1c/dashboard
  Response: OneCDashboardResponse {
    configs: [{ id, name, healthStatus, lastSyncAt, errorCount }],
    syncStats: { last24h: { total, success, failed }, last7d: { ... } },
    pendingQueue: number,
    unresolvedConflicts: number,
    entityBreakdown: [{ entityType, privodCount, onecCount, syncedCount, lastSyncAt }]
  }
  Roles: [ADMIN]

-- Mappings (диагностика) --

GET /api/integrations/1c/mappings
  Query: configId?, entityType?, syncStatus?, page, size
  Response: Page<OneCMappingResponse>
  Roles: [ADMIN]
```

### Экраны (UI Description)

**1. Dashboard интеграции 1С**
- Расположение: обновить `frontend/src/modules/settings/IntegrationsPage.tsx` → вынести 1С в отдельную страницу `frontend/src/modules/integrations/OneCDashboardPage.tsx`
- Metric Cards: Здоровье подключения (зелёный/жёлтый/красный) | Последняя синхронизация (время + статус) | Очередь (pending count) | Конфликты (count, красный badge)
- Графики: Синхронизации за 7 дней (bar chart: success/failed) | Объёмы данных по типам (donut chart)
- Таблица конфигураций: Название | URL | Направление | Статус | Последняя синхронизация | Действия
- Quick actions: «Синхронизировать сейчас» | «Тест подключения» | «Просмотр логов»

**2. Настройки подключения к 1С**
- Расположение: `frontend/src/modules/integrations/OneCConfigFormPage.tsx` (новый файл)
- Форма: Название | URL базы 1С | Логин | Пароль (masked input) | Имя базы | Тип API (OData/COM/REST) | Версия 1С | Конфигурация
- Кнопка «Тестировать подключение» — показывает результат inline (зелёная/красная плашка)
- Секция «Настройки синхронизации»:
  - Таблица сущностей с toggle: Контрагенты | Счета | Оплаты | Банковские выписки | Проводки | Сотрудники | Материалы | Договоры
  - Для каждой сущности: Направление (select) | Интервал (select: 15/30/60/120/360 мин) | Стратегия конфликтов (select) | OData фильтр (input)

**3. Журнал обменов**
- Расположение: `frontend/src/modules/integrations/OneCExchangeLogPage.tsx` (новый файл)
- Таблица: Дата/время | Тип сущности | Направление | Всего | Создано | Обновлено | Ошибки | Конфликты | Время (мс) | Статус
- Фильтры: конфигурация, тип сущности, статус, даты
- Клик на строку → модальное окно с деталями (ошибки, список обработанных записей)

**4. Разрешение конфликтов**
- Расположение: `frontend/src/modules/integrations/OneCConflictsPage.tsx` (новый файл)
- Список конфликтов с группировкой по типу сущности
- Для каждого конфликта: side-by-side diff (ПРИВОД | 1С)
  - Совпадающие поля — серые
  - Различающиеся поля — подсвечены жёлтым
- Кнопки: «Принять ПРИВОД» | «Принять 1С» | «Объединить вручную»
- Bulk actions: «Принять все ПРИВОД» | «Принять все 1С» (с подтверждением)

### Бизнес-правила и валидации

1. **Шифрование пароля**: пароль 1С шифруется AES-256-GCM с ключом из переменной окружения `ENCRYPTION_KEY`. При чтении — дешифруется в memory, никогда не возвращается в API response. Миграция: зашифровать существующие plaintext пароли, удалить колонку `password`.

2. **OData Protocol**: взаимодействие через HTTP REST:
   - GET `{baseUrl}/odata/standard.odata/Catalog_Контрагенты?$format=json` — чтение
   - POST `{baseUrl}/odata/standard.odata/Catalog_Контрагенты` — создание
   - PATCH `{baseUrl}/odata/standard.odata/Catalog_Контрагенты(guid'{id}')` — обновление
   - Авторизация: Basic Auth (Base64(username:password))

3. **Delta-sync**: для каждого mapping хранить `last_hash` (SHA-256 от сериализованных данных). При синхронизации сравнивать хэши — если совпадают, пропускать. Для 1С → ПРИВОД: использовать OData `$filter` по `ДатаИзменения ge datetime'{lastSyncAt}'`.

4. **Conflict detection**: конфликт возникает когда:
   - Обе стороны изменили один и тот же объект с момента последней синхронизации
   - Определение: `privod.updatedAt > lastSyncAt AND onec.ДатаИзменения > lastSyncAt`
   - Стратегии: PRIVOD_WINS (приоритет ПРИВОД), 1C_WINS (приоритет 1С), NEWEST_WINS (по дате), MANUAL (требует ручного разрешения)

5. **Retry policy**: при ошибке сети — 3 попытки с exponential backoff (1s, 5s, 30s). При ошибке HTTP 5xx — retry. При HTTP 4xx — не retry, логировать ошибку.

6. **Rate limiting**: не более 100 OData-запросов в минуту на одну конфигурацию 1С (защита от перегрузки сервера 1С).

7. **Health check**: каждые 5 минут проверять доступность каждого config (GET $metadata). При 3 подряд неуспешных проверках — health_status = ERROR, уведомление ADMIN.

8. **Маппинг сущностей** (основные):
   - Контрагенты: ПРИВОД `organizations/contractors` ↔ 1С `Catalog_Контрагенты` (по ИНН)
   - Счета на оплату: ПРИВОД `invoices` ↔ 1С `Document_СчетНаОплатуПокупателю` (по номеру+дате)
   - Оплаты: ПРИВОД `payments` ↔ 1С `Document_ПлатежноеПоручениеВходящее` / `ПлатежноеПоручениеИсходящее`
   - Банковские выписки: ПРИВОД — нет (создать) ↔ 1С `Document_ВыпискаБанка`
   - Договоры: ПРИВОД `contracts` ↔ 1С `Catalog_ДоговорыКонтрагентов`

9. **Tenant isolation**: каждая организация имеет свои конфигурации 1С. Синхронизация строго в рамках organization_id.

10. **SSRF Protection**: валидировать baseUrl — запретить localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12 (кроме Docker-сети). Whitelist: только http/https протоколы.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр dashboard интеграции | Да | Нет | Нет | Нет | Нет |
| Настройка подключения | Да | Нет | Нет | Нет | Нет |
| Тест подключения | Да | Нет | Нет | Нет | Нет |
| Запуск ручной синхронизации | Да | Нет | Нет | Нет | Нет |
| Просмотр логов обменов | Да | Нет | Нет | Нет | Нет |
| Разрешение конфликтов | Да | Нет | Нет | Нет | Нет |
| Просмотр маппингов | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **1С недоступна**: если сервер 1С выключен (ночью) — очередь sync_queue накапливает операции. При восстановлении — обработка в порядке priority/scheduled_at.
2. **Большой начальный импорт**: первая синхронизация может содержать 100K+ контрагентов. Решение: batch processing по 100 записей, прогресс через WebSocket.
3. **Дублирование контрагентов**: один контрагент может быть в нескольких базах 1С (у клиента несколько юрлиц). Маппинг по ИНН — уникальный ключ.
4. **Изменение структуры 1С**: при обновлении конфигурации 1С могут измениться имена полей OData. Решение: version_1c + configurationName для адаптации маппинга.
5. **Длинные транзакции**: если синхронизация 10K записей занимает 30 минут — использовать batch commit (каждые 100 записей). При crash — resume от последнего обработанного.
6. **Кириллические имена полей**: 1С OData использует кириллицу (`ДатаНачала`, `Контрагент`). Убедиться в правильной кодировке UTF-8 в RestTemplate.
7. **Пароль не сохраняется**: если пользователь обновляет конфиг, но не вводит пароль — сохранить существующий зашифрованный пароль (не перезаписывать null).

### UX-эталон

**Контур.Диадок**: эталон интеграции с 1С для ЭДО — настройка подключения, маппинг справочников, мониторинг обменов. **Битрикс24**: эталон UX для настройки интеграции — визуальный маппинг полей, тест подключения, логи. Наш подход добавляет: (1) delta-sync для производительности, (2) автоматическое разрешение конфликтов, (3) dashboard мониторинга в реальном времени.

---

## Задача 13: Document Approval Workflow Engine

### Описание

Универсальный движок согласования документов — процесс №30 в карте строительных процессов. В строительстве ВСЕ ключевые документы проходят многоступенчатую процедуру согласования: КС-2/КС-3 → прораб → ПТО → главный инженер → бухгалтер → директор. Заявки на закупку → инициатор → руководитель отдела → финансовый директор. ИД (исполнительная документация) → инженер → представитель авторского надзора → представитель заказчика. Текущая реализация в различных модулях содержит ad-hoc статусные машины (ClosingDocumentStatus: DRAFT→SUBMITTED→SIGNED→CLOSED, PtoDocumentStatus, SubmittalStatus, TransmittalStatus и т.д.), но: (1) нет универсального движка — каждый модуль реализует свою логику, (2) нет параллельных маршрутов (подпись ОТ + подпись ПТО одновременно), (3) нет условных ветвлений (если сумма > 1M → дополнительное согласование директором), (4) нет делегирования (я в отпуске — передать мои полномочия заместителю), (5) нет SLA (автоматическая эскалация при просрочке), (6) нет аудита: кто когда что согласовал.

Модуль CDE (`backend/.../modules/cde/`) содержит `DocumentAuditEntry` для логирования действий с документами, но это лишь запись event-ов, не workflow engine.

Целевой UX: администратор в визуальном конструкторе создаёт шаблон workflow (drag-n-drop этапов) → привязывает к типу документа → при создании документа автоматически запускается workflow → каждый участник получает уведомление → подтверждает/отклоняет на своём этапе → при условных ветвлениях система автоматически выбирает маршрут → при просрочке SLA — эскалация → полная история согласования доступна на каждом документе.

### Сущности/Таблицы БД

```sql
-- Шаблоны workflow
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL,  -- KS2, KS3, PURCHASE_REQUEST, PTO_DOCUMENT, INVOICE, CONTRACT, CHANGE_ORDER, ...
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,  -- шаблон по умолчанию для данного entity_type
    version INTEGER NOT NULL DEFAULT 1,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wt_org ON workflow_templates(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_wt_entity_type ON workflow_templates(organization_id, entity_type) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_wt_default ON workflow_templates(organization_id, entity_type) WHERE deleted = FALSE AND is_default = TRUE;

-- Этапы workflow-шаблона
CREATE TABLE workflow_template_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES workflow_templates(id),
    step_order INTEGER NOT NULL,  -- порядок (0, 1, 2, ...)
    name VARCHAR(200) NOT NULL,
    description TEXT,
    step_type VARCHAR(30) NOT NULL DEFAULT 'APPROVAL',  -- APPROVAL, REVIEW, SIGN, NOTIFY, CONDITION
    execution_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',  -- SEQUENTIAL, PARALLEL

    -- Кто согласовывает
    assignee_type VARCHAR(30) NOT NULL,  -- ROLE, USER, FIELD, DYNAMIC
    assignee_role VARCHAR(50),  -- если ROLE: ADMIN, MANAGER, ENGINEER, ACCOUNTANT
    assignee_user_id UUID,  -- если USER: конкретный пользователь
    assignee_field VARCHAR(100),  -- если FIELD: поле документа (например, 'responsibleId', 'projectManagerId')

    -- SLA
    sla_hours INTEGER,  -- часов на согласование (NULL = без лимита)
    escalation_user_id UUID,  -- кому эскалировать при просрочке
    auto_approve_on_timeout BOOLEAN NOT NULL DEFAULT FALSE,  -- автосогласование при истечении SLA

    -- Условие (для step_type = CONDITION)
    condition_field VARCHAR(100),  -- поле документа для проверки
    condition_operator VARCHAR(20),  -- GT, GTE, LT, LTE, EQ, NEQ, IN
    condition_value VARCHAR(500),  -- значение для сравнения
    condition_true_step INTEGER,  -- step_order при true
    condition_false_step INTEGER,  -- step_order при false

    -- Действия
    required_comment BOOLEAN NOT NULL DEFAULT FALSE,  -- обязательный комментарий при согласовании
    required_attachment BOOLEAN NOT NULL DEFAULT FALSE,  -- обязательное вложение

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wts_template ON workflow_template_steps(template_id, step_order) WHERE deleted = FALSE;

-- Параллельные участники этапа (для PARALLEL execution_type)
CREATE TABLE workflow_step_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES workflow_template_steps(id),
    assignee_type VARCHAR(30) NOT NULL,  -- ROLE, USER, FIELD
    assignee_role VARCHAR(50),
    assignee_user_id UUID,
    assignee_field VARCHAR(100),
    is_required BOOLEAN NOT NULL DEFAULT TRUE,  -- обязательный ли участник (для PARALLEL: все required должны согласовать)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wsp_step ON workflow_step_participants(step_id) WHERE deleted = FALSE;

-- Экземпляры workflow (запущенные процессы)
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES workflow_templates(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,  -- ID документа
    entity_title VARCHAR(500),  -- заголовок документа (для отображения)
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, COMPLETED, REJECTED, CANCELLED
    current_step_order INTEGER NOT NULL DEFAULT 0,
    started_by_id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wi_org ON workflow_instances(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_wi_entity ON workflow_instances(entity_type, entity_id) WHERE deleted = FALSE;
CREATE INDEX idx_wi_status ON workflow_instances(organization_id, status) WHERE deleted = FALSE AND status = 'ACTIVE';
CREATE INDEX idx_wi_started_by ON workflow_instances(started_by_id) WHERE deleted = FALSE;

-- Задачи согласования (один этап одного экземпляра)
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES workflow_instances(id),
    step_id UUID NOT NULL REFERENCES workflow_template_steps(id),
    step_order INTEGER NOT NULL,
    step_name VARCHAR(200),
    assignee_id UUID NOT NULL,  -- конкретный пользователь (резолвится из шаблона)
    assignee_name VARCHAR(200),
    delegated_from_id UUID,  -- если задача делегирована
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, APPROVED, REJECTED, SKIPPED, ESCALATED
    decision VARCHAR(20),  -- APPROVE, REJECT
    comment TEXT,
    attachment_file_id UUID,
    sla_deadline TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wta_instance ON workflow_tasks(instance_id) WHERE deleted = FALSE;
CREATE INDEX idx_wta_assignee ON workflow_tasks(assignee_id, status) WHERE deleted = FALSE;
CREATE INDEX idx_wta_sla ON workflow_tasks(sla_deadline) WHERE deleted = FALSE AND status = 'PENDING';
CREATE INDEX idx_wta_status ON workflow_tasks(status) WHERE deleted = FALSE;

-- Делегирование полномочий
CREATE TABLE workflow_delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    delegator_id UUID NOT NULL,  -- кто делегирует
    delegate_id UUID NOT NULL,  -- кому делегирует
    entity_types VARCHAR(500),  -- типы документов (NULL = все). Comma-separated: "KS2,KS3,INVOICE"
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    reason VARCHAR(500),  -- "Отпуск", "Командировка"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_wd_org ON workflow_delegations(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_wd_delegator ON workflow_delegations(delegator_id) WHERE deleted = FALSE AND is_active = TRUE;
CREATE INDEX idx_wd_delegate ON workflow_delegations(delegate_id) WHERE deleted = FALSE AND is_active = TRUE;
CREATE INDEX idx_wd_dates ON workflow_delegations(valid_from, valid_to) WHERE deleted = FALSE AND is_active = TRUE;
```

### API Endpoints

```
-- Workflow Templates --

GET /api/workflow-templates
  Query: entityType?, isActive?, page, size
  Response: Page<WorkflowTemplateResponse>
  Roles: [ADMIN, MANAGER]

GET /api/workflow-templates/{id}
  Response: WorkflowTemplateDetailResponse (с вложенными steps и participants)
  Roles: [ADMIN, MANAGER]

POST /api/workflow-templates
  Request: CreateWorkflowTemplateRequest { name, description?, entityType, isDefault?, steps: [CreateStepRequest] }
  Response: WorkflowTemplateDetailResponse
  Roles: [ADMIN]

PUT /api/workflow-templates/{id}
  Request: UpdateWorkflowTemplateRequest
  Response: WorkflowTemplateDetailResponse
  Roles: [ADMIN]

POST /api/workflow-templates/{id}/clone
  Request: { name: string }
  Response: WorkflowTemplateDetailResponse
  Описание: Клонировать шаблон (для создания вариации)
  Roles: [ADMIN]

DELETE /api/workflow-templates/{id}
  Response: 204 No Content (нельзя удалить если есть активные instances)
  Roles: [ADMIN]

-- Workflow Instances --

POST /api/workflows/start
  Request: StartWorkflowRequest { entityType, entityId, templateId? (если не указан — используется default для entityType) }
  Response: WorkflowInstanceResponse
  Описание: Запуск workflow для документа. Автоматически создаёт первые задачи.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/workflows/instances
  Query: entityType?, entityId?, status?, startedById?, page, size
  Response: Page<WorkflowInstanceResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/workflows/instances/{instanceId}
  Response: WorkflowInstanceDetailResponse (с history всех tasks)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/workflows/instances/{instanceId}/cancel
  Request: { reason: string }
  Response: WorkflowInstanceResponse (status → CANCELLED)
  Roles: [ADMIN, MANAGER] (или initiator)

-- Workflow Tasks (мои задачи) --

GET /api/workflows/my-tasks
  Query: status?, entityType?, page, size, sort
  Response: Page<WorkflowTaskResponse>
  Описание: Задачи текущего пользователя (включая делегированные)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/workflows/my-tasks/count
  Response: { pending: number, overdue: number }
  Описание: Счётчик для badge в навигации
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/workflows/tasks/{taskId}/approve
  Request: { comment?: string, attachmentFileId?: UUID }
  Response: WorkflowTaskResponse
  Описание: Согласовать. Если это последний этап — instance.status → COMPLETED, документ переходит в следующий статус.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT] (только assignee)

POST /api/workflows/tasks/{taskId}/reject
  Request: { comment: string (обязательный), attachmentFileId?: UUID }
  Response: WorkflowTaskResponse
  Описание: Отклонить. instance.status → REJECTED, документ возвращается в DRAFT.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT] (только assignee)

-- Delegations --

GET /api/workflow-delegations
  Response: WorkflowDelegationResponse[]
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/workflow-delegations
  Request: CreateDelegationRequest { delegateId, entityTypes?, validFrom, validTo, reason? }
  Response: WorkflowDelegationResponse
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

DELETE /api/workflow-delegations/{id}
  Response: 204 No Content
  Roles: [ADMIN] (или delegator)

-- Document Workflow Status (для встраивания в любой модуль) --

GET /api/workflows/entity/{entityType}/{entityId}/status
  Response: EntityWorkflowStatusResponse { instanceId?, status, currentStep?, steps: [{ order, name, status, assigneeName, completedAt }] }
  Описание: Статус workflow для конкретного документа (для отображения progress bar)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]
```

### Экраны (UI Description)

**1. Inbox — Мои задачи на согласование**
- Расположение: `frontend/src/modules/workflow/WorkflowInboxPage.tsx` (новый файл)
- Ссылка из TopBar: иконка Bell + badge с количеством pending задач
- Список задач: карточки с: Документ (ссылка) | Тип | Этап | Инициатор | SLA (countdown или «Просрочено» красным) | Действия
- Фильтры: тип документа, только просроченные
- Quick actions: кнопки «Согласовать» / «Отклонить» прямо из списка (с модальным окном для комментария)
- Tabs: «Ожидают» | «Обработанные» | «Делегированные мне»

**2. Workflow Timeline (на каждом документе)**
- Расположение: универсальный компонент `frontend/src/components/WorkflowTimeline.tsx`
- Вертикальный timeline: этапы workflow с иконками (check = approved, x = rejected, clock = pending, arrow = current)
- Для каждого этапа: имя этапа, согласующий, дата, комментарий
- Если текущий пользователь — assignee текущего этапа, показать кнопки «Согласовать» / «Отклонить» inline
- Встраивается в: FormKs2Page, FormKs3Page, PurchaseRequestDetailPage, InvoiceDetailPage, ContractDetailPage, PtoDocumentDetailPage и т.д.

**3. Визуальный конструктор workflow**
- Расположение: `frontend/src/modules/workflow/WorkflowDesignerPage.tsx` (новый файл)
- Drag-n-drop конструктор этапов (вертикальный flow):
  - Блоки: Согласование (зелёный) | Рецензия (синий) | Подпись (фиолетовый) | Уведомление (серый) | Условие (жёлтый ромб)
  - Между блоками: стрелки (sequential) или параллельные линии
  - Клик на блок: настройка (assignee, SLA, условие)
- Sidebar: свойства выбранного блока
- Preview: визуализация маршрута для примерного документа
- Сохранение: JSON-структура шаблона

**4. Делегирование**
- Расположение: `frontend/src/modules/workflow/DelegationSettingsPage.tsx` (новый файл) или вкладка в настройках профиля
- Таблица активных делегирований: Кому | Типы документов | С | По | Причина | Действия
- Кнопка «Добавить делегирование»: модальная форма

### Бизнес-правила и валидации

1. **Запуск workflow**: при вызове `POST /api/workflows/start` система:
   - Находит шаблон (по templateId или default для entityType)
   - Создаёт workflow_instance
   - Резолвит assignee для первого шага (ROLE → найти пользователей с ролью в проекте, USER → конкретный, FIELD → прочитать поле документа)
   - Проверяет делегирования: если assignee делегировал полномочия — задача назначается delegate
   - Создаёт workflow_task для первого шага с SLA deadline
   - Отправляет уведомление assignee (push + email)

2. **При согласовании (APPROVE)**:
   - Если текущий шаг PARALLEL: проверить все задачи этапа. Если все required participants approved → переход к следующему шагу.
   - Если текущий шаг SEQUENTIAL: сразу переход к следующему шагу.
   - Если следующий шаг CONDITION: вычислить условие и перейти к condition_true_step или condition_false_step.
   - Если это последний шаг: instance.status = COMPLETED, обновить статус документа.

3. **При отклонении (REJECT)**: instance.status = REJECTED. Документ возвращается в DRAFT. Все pending задачи текущего этапа → SKIPPED.

4. **SLA и эскалация**: Scheduler каждые 5 минут проверяет workflow_tasks WHERE sla_deadline < NOW() AND status = 'PENDING':
   - Если auto_approve_on_timeout = true → автоматическое согласование
   - Если escalation_user_id заполнен → создать новую задачу для escalation user, текущую → ESCALATED
   - Отправить уведомление «Просрочено согласование»

5. **Делегирование**: при назначении задачи проверять active делегирования WHERE delegator_id = assignee_id AND NOW() BETWEEN valid_from AND valid_to. Если найдено — assignee_id = delegate_id, delegated_from_id = original_assignee_id.

6. **Условные ветвления**: поддерживаемые операторы для condition: GT (>), GTE (>=), LT (<), LTE (<=), EQ (==), NEQ (!=), IN (значение в списке). Поле берётся из entity через reflection или JSON.

7. **Версионирование шаблонов**: при изменении шаблона — увеличить version. Существующие instances используют снимок шаблона на момент запуска.

8. **Tenant isolation**: все workflow привязаны к organization_id.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Создание/редактирование шаблонов | Да | Нет | Нет | Нет | Нет |
| Просмотр шаблонов | Да | Да | Нет | Нет | Нет |
| Запуск workflow (отправка на согласование) | Да | Да | Да | Да | Нет |
| Согласование/отклонение (свои задачи) | Да | Да | Да | Да | Нет |
| Просмотр статуса workflow | Да | Да | Да | Да | Да |
| Отмена workflow | Да | Да (свои) | Нет | Нет | Нет |
| Управление делегированиями (свои) | Да | Да | Да | Да | Нет |
| Управление делегированиями (чужие) | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **Assignee не найден**: если шаг привязан к ROLE, но в проекте нет пользователя с этой ролью — workflow не запускается, показать ошибку «Не найден согласующий для этапа X. Назначьте пользователя с ролью Y в проекте.»
2. **Параллельный этап: частичное согласование**: 3 из 5 участников approved, 1 rejected. Правило: если ANY required participant rejected → весь этап rejected.
3. **Circular delegation**: A делегирует B, B делегирует A. Решение: запрет цепочек делегирования длиннее 2 (A→B→C допустимо, A→B→C→D — нет).
4. **Удаление пользователя**: если assignee удалён/деактивирован — автоматическая эскалация к ADMIN.
5. **Одновременный workflow**: документ может иметь только ОДИН активный workflow. При попытке запуска второго — HTTP 409 «Документ уже в процессе согласования».
6. **Отмена и повторный запуск**: после CANCEL можно запустить workflow заново.
7. **Изменение документа во время согласования**: запретить редактирование документа пока workflow ACTIVE (кроме DRAFT статуса при reject).

### UX-эталон

**Битрикс24 Бизнес-процессы**: эталон визуального конструктора workflow для российского рынка — drag-n-drop, условия, параллельные ветки. **Procore Approvals**: эталон для строительного согласования — multi-step, comments, audit trail. **DocuSign PowerForms**: эталон для автоматического routing по условиям. Наш подход объединяет: (1) визуальный конструктор Битрикс24, (2) строительный контекст Procore, (3) SLA и эскалацию корпоративных BPM-систем.

---

## Задача 14: Electronic Signature Integration (КЭП)

### Описание

Квалифицированная электронная подпись (КЭП) — юридически значимая подпись по Федеральному закону 63-ФЗ «Об электронной подписи». Для строительной отрасли КЭП критична: КС-2/КС-3, акты скрытых работ (АОСР), договоры, счета-фактуры — все эти документы требуют юридически обязывающей подписи. Без КЭП документы нужно печатать и подписывать физически, что создаёт задержки 3-7 дней на каждый документооборот.

Текущая реализация в модуле `kep` содержит развитую доменную модель: `KepCertificate` (ownerId, serialNumber, issuer, validFrom/To, thumbprint, subjectCn/Org/Inn/Ogrn, isQualified), `KepSignature` (certificateId, documentModel, documentId, signedAt, signatureData, signatureHash, isValid, validationMessage), `KepSigningRequest` (documentModel, documentId, requesterId, signerId, status: PENDING→SIGNED/REJECTED, dueDate, priority), `KepConfig` (providerType: CRYPTO_PRO/VIPNET/RUTOKEN/JACARTA, apiEndpoint, apiKey). `KepService.java` содержит CRUD для сертификатов, запросов на подпись и конфигураций. Фронтенд `KepSignWizard.tsx` реализует 4-шаговый визард: выбор документа → выбор сертификата → подписание (ввод PIN) → результат.

Критические недостатки: (1) **Нет реальной интеграции с КриптоПро CSP** — подписание не вызывает криптопровайдер, signatureData = заглушка. (2) **apiKey в plaintext** в `KepConfig`. (3) Нет валидации подписи (проверка цепочки сертификатов, CRL/OCSP). (4) Нет интеграции с УКЭП через cloud-based сервисы (КриптоПро DSS, КонтурSign). (5) Нет batch-signing (подпись нескольких документов за раз). (6) Нет визуализации подписи в PDF (штамп). (7) Нет уведомлений об истечении сертификата.

Целевой UX: пользователь на странице КС-2 нажимает «Подписать КЭП» → система проверяет наличие действующего сертификата → если установлен КриптоПро Browser Plugin — подписание локально (быстро) → если нет — перенаправление в КриптоПро DSS (облачная подпись) → после подписания — PDF с визуальным штампом подписи → верификация подписи в один клик → уведомление контрагенту.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы kep_certificates
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS user_id UUID;  -- связь с пользователем системы (отличается от owner_id — физического владельца)
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS certificate_source VARCHAR(30) DEFAULT 'MANUAL';  -- MANUAL, BROWSER_PLUGIN, DSS_CLOUD
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS revocation_checked_at TIMESTAMPTZ;
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE;
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS key_usage VARCHAR(500);  -- digitalSignature, nonRepudiation, etc.
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS enhanced_key_usage VARCHAR(500);  -- OIDs
ALTER TABLE kep_certificates ADD COLUMN IF NOT EXISTS issuer_certificate_data TEXT;  -- сертификат издателя для валидации цепочки

CREATE INDEX idx_kep_cert_org ON kep_certificates(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_kep_cert_user ON kep_certificates(user_id) WHERE deleted = FALSE;
CREATE INDEX idx_kep_cert_expiry ON kep_certificates(valid_to) WHERE deleted = FALSE AND status = 'ACTIVE';

-- Расширение существующей таблицы kep_signatures
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS signature_type VARCHAR(30) DEFAULT 'CADES_BES';  -- CADES_BES, CADES_T, CADES_XLT1, XADES_BES
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS timestamp_data TEXT;  -- TSP (Time Stamp Protocol) данные
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS timestamp_authority VARCHAR(500);  -- URL TSA
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS document_hash VARCHAR(128);  -- hash исходного документа
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS hash_algorithm VARCHAR(30) DEFAULT 'GOST_R_34_11_2012_256';  -- ГОСТ Р 34.11-2012
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS signing_method VARCHAR(30);  -- BROWSER_PLUGIN, DSS_CLOUD, USB_TOKEN
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS verification_result JSONB;  -- результат последней проверки
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE kep_signatures ADD COLUMN IF NOT EXISTS signature_visual_stamp TEXT;  -- SVG/HTML шаблон визуального штампа

CREATE INDEX idx_kep_sig_org ON kep_signatures(organization_id) WHERE deleted = FALSE;

-- Расширение существующей таблицы kep_signing_requests
ALTER TABLE kep_signing_requests ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE kep_signing_requests ADD COLUMN IF NOT EXISTS workflow_task_id UUID;  -- связь с Задачей 13
ALTER TABLE kep_signing_requests ADD COLUMN IF NOT EXISTS signing_order INTEGER DEFAULT 0;  -- порядок подписания (0 = любой)
ALTER TABLE kep_signing_requests ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE kep_signing_requests ADD COLUMN IF NOT EXISTS escalated_to_id UUID;

CREATE INDEX idx_kep_req_org ON kep_signing_requests(organization_id) WHERE deleted = FALSE;
CREATE INDEX idx_kep_req_workflow ON kep_signing_requests(workflow_task_id) WHERE deleted = FALSE;

-- Расширение существующей таблицы kep_configs
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS api_key_encrypted VARCHAR(1000);  -- AES-256 зашифрованный API key
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS tsp_url VARCHAR(500);  -- URL Time Stamp Authority
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS ocsp_url VARCHAR(500);  -- URL OCSP responder
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS crl_url VARCHAR(500);  -- URL CRL (Certificate Revocation List)
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS dss_api_url VARCHAR(500);  -- URL КриптоПро DSS API
ALTER TABLE kep_configs ADD COLUMN IF NOT EXISTS dss_callback_url VARCHAR(500);  -- callback URL для асинхронного подписания

CREATE INDEX idx_kep_cfg_org ON kep_configs(organization_id) WHERE deleted = FALSE;

-- Лог верификаций подписей
CREATE TABLE kep_verification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    signature_id UUID NOT NULL REFERENCES kep_signatures(id),
    verified_by_id UUID NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_valid BOOLEAN NOT NULL,
    certificate_valid BOOLEAN,
    chain_valid BOOLEAN,
    timestamp_valid BOOLEAN,
    not_revoked BOOLEAN,
    document_integrity BOOLEAN,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kvl_signature ON kep_verification_log(signature_id) WHERE deleted = FALSE;
```

### API Endpoints

```
-- Certificates --

GET /api/kep/certificates
  Query: userId?, status?, isExpiring? (valid_to < NOW() + 30 days), page, size
  Response: Page<KepCertificateResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

GET /api/kep/certificates/{id}
  Response: KepCertificateDetailResponse (с историей подписей)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/certificates
  Request: CreateKepCertificateRequest { certificateData (Base64 encoded .cer), userId? }
  Response: KepCertificateResponse
  Описание: Загрузка сертификата. Парсинг ASN.1: извлечение subjectCn, subjectOrg, subjectInn, issuer, validFrom/To, thumbprint, keyUsage.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/certificates/from-browser
  Request: { certificateBase64: string, thumbprint: string }
  Response: KepCertificateResponse
  Описание: Импорт сертификата из КриптоПро Browser Plugin
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/certificates/{id}/check-revocation
  Response: { isRevoked: boolean, checkedAt: datetime, method: 'OCSP' | 'CRL', details?: string }
  Описание: Проверка отзыва через OCSP или CRL
  Roles: [ADMIN, MANAGER]

DELETE /api/kep/certificates/{id}
  Response: 204 No Content (мягкое удаление, status → REVOKED)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT] (только свои)

-- Signing --

POST /api/kep/sign/prepare
  Request: PrepareSigningRequest { documentModel, documentId, certificateId, signatureType?: CADES_BES|CADES_T|CADES_XLT1 }
  Response: PrepareSigningResponse { dataToSign: string (Base64 hash документа), algorithm: string }
  Описание: Подготовка данных для подписания. Генерирует hash документа по ГОСТ Р 34.11-2012.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/sign/complete
  Request: CompleteSigningRequest { documentModel, documentId, certificateId, signatureData: string (Base64 CMS), signingMethod: BROWSER_PLUGIN|USB_TOKEN }
  Response: KepSignatureResponse
  Описание: Завершение подписания (после подписи на клиенте через Browser Plugin)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/sign/dss
  Request: DssSigningRequest { documentModel, documentId, certificateId?, returnUrl: string }
  Response: DssSigningStartResponse { redirectUrl: string, transactionId: string }
  Описание: Инициация подписания через КриптоПро DSS (облачная подпись). Пользователь перенаправляется на страницу DSS.
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/sign/dss/callback
  Request: (вызывается КриптоПро DSS) { transactionId, signatureData, status }
  Response: 200 OK
  Описание: Callback от DSS после подписания
  Roles: PUBLIC (с HMAC-верификацией)

POST /api/kep/sign/batch
  Request: BatchSigningRequest { documents: [{ documentModel, documentId }], certificateId, signatureType? }
  Response: BatchSigningResponse { prepared: [{ documentModel, documentId, dataToSign }], algorithm }
  Описание: Подготовка batch-подписания (до 50 документов)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/sign/batch/complete
  Request: BatchCompleteRequest { signatures: [{ documentModel, documentId, signatureData }] }
  Response: { signed: number, failed: [{ documentModel, documentId, error }] }
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

-- Verification --

POST /api/kep/verify/{signatureId}
  Response: VerifySignatureResponse { isValid, certificateValid, chainValid, timestampValid, notRevoked, documentIntegrity, signerName, signerInn, signerOrg, signedAt, details }
  Описание: Полная верификация подписи: целостность, сертификат, цепочка, отзыв, timestamp
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]

GET /api/kep/signatures
  Query: documentModel?, documentId?, certificateId?, isValid?, page, size
  Response: Page<KepSignatureResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

-- Signing Requests --

GET /api/kep/signing-requests
  Query: signerId? (default: current user), status?, page, size
  Response: Page<KepSigningRequestResponse>
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

POST /api/kep/signing-requests
  Request: CreateSigningRequestRequest { documentModel, documentId, documentTitle, signerId, dueDate?, priority?, signingOrder? }
  Response: KepSigningRequestResponse
  Описание: Отправка запроса на подпись другому пользователю
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/kep/signing-requests/{id}/reject
  Request: { rejectionReason: string }
  Response: KepSigningRequestResponse (status → REJECTED)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT] (только signer)

-- PDF with Signature Stamp --

POST /api/kep/documents/{documentModel}/{documentId}/stamped-pdf
  Response: { pdfUrl: string, fileId: UUID }
  Описание: PDF с визуальным штампом подписи (ФИО, ИНН, серийный номер, дата, «Документ подписан КЭП»)
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

-- Config --

GET /api/kep/config
  Response: KepConfigResponse (без apiKey)
  Roles: [ADMIN]

PUT /api/kep/config
  Request: UpdateKepConfigRequest { providerType, apiEndpoint?, apiKey?, tspUrl?, ocspUrl?, crlUrl?, dssApiUrl?, dssCallbackUrl? }
  Response: KepConfigResponse
  Roles: [ADMIN]
```

### Экраны (UI Description)

**1. КЭП-визард (обновлённый)**
- Расположение: обновить `frontend/src/modules/russianDocs/KepSignWizard.tsx`
- Шаг 1: **Выбор документа** — если вызван из контекста (КС-2 → «Подписать»), документ уже выбран. Показать превью документа (PDF inline).
- Шаг 2: **Выбор сертификата** — список сертификатов текущего пользователя (иконка: зелёный замок = действующий, жёлтый = истекает через <30 дней, красный = истёк/отозван). Кнопка «Загрузить из Browser Plugin» (КриптоПро). Кнопка «Подписать через облако (DSS)».
- Шаг 3: **Подписание**:
  - Если Browser Plugin: поле для PIN-кода → кнопка «Подписать» → JS-библиотека КриптоПро вызывает криптопровайдер → signatureData отправляется на backend.
  - Если DSS: redirect на страницу КриптоПро DSS → пользователь подтверждает → callback → возврат.
  - Если USB-токен: инструкция по подключению + PIN.
- Шаг 4: **Результат** — зелёная плашка «Документ подписан». Детали: ФИО, ИНН, организация, серийный номер сертификата, дата. Кнопка «Скачать PDF с штампом» | «Отправить контрагенту».

**2. Мои сертификаты**
- Расположение: `frontend/src/modules/kep/MyCertificatesPage.tsx` (новый файл) или вкладка в настройках профиля
- Карточки сертификатов: Владелец | Организация | ИНН | Издатель | Действует до (countdown) | Статус
- Кнопка «Загрузить сертификат» (drag-n-drop .cer файла)
- Кнопка «Импорт из Browser Plugin»
- Предупреждение: «Сертификат истекает через X дней» (жёлтый banner)

**3. Запросы на подпись**
- Расположение: интегрировать в Workflow Inbox (Задача 13)
- Тип задачи «Подписание КЭП» с иконкой подписи
- Клик → открывается KepSignWizard с предвыбранным документом

**4. Визуальный штамп в PDF**
- На PDF документе (КС-2, АОСР и т.д.) — блок в правом нижнем углу:
  ```
  ┌─────────────────────────────────┐
  │ ДОКУМЕНТ ПОДПИСАН               │
  │ ЭЛЕКТРОННОЙ ПОДПИСЬЮ            │
  │ Иванов Иван Иванович           │
  │ ИНН: 7712345678                 │
  │ Серийный №: 01 B9 C7 ...       │
  │ Действителен: 01.01.2025-31.12.2026 │
  │ Дата подписания: 18.02.2026    │
  └─────────────────────────────────┘
  ```

### Бизнес-правила и валидации

1. **Формат подписи CAdES-BES** (минимальный): подпись включает данные подписанта, hash документа, подпись по ГОСТ Р 34.10-2012. Для CAdES-T: дополнительно TSP timestamp. Для CAdES-XLT1: CRL/OCSP ответ + сертификаты цепочки (для долгосрочной валидации).

2. **Hash-алгоритм**: ГОСТ Р 34.11-2012 (Стрибог-256) — обязательный для УКЭП в России.

3. **Подпись-алгоритм**: ГОСТ Р 34.10-2012 (256 или 512 бит).

4. **Browser Plugin интеграция**: использовать JavaScript-библиотеку `cadesplugin.js` (КриптоПро Browser Plug-in). Последовательность:
   - `cadesplugin.CreateObject("CAdESCOM.CPSigner")` — создание объекта подписанта
   - `cadesplugin.CreateObject("CAdESCOM.CadesSignedData")` — создание подписываемых данных
   - `oSigner.Certificate = certificate` — указание сертификата
   - `oSignedData.Sign(oSigner, true)` — создание открепленной подписи
   - Результат (Base64 CMS) отправляется на backend

5. **КриптоПро DSS** (облачное подписание): REST API v2:
   - POST `/api/certificates` — получить список сертификатов пользователя
   - POST `/api/documents` — загрузить документ
   - POST `/api/sign/requests` — создать запрос на подпись
   - Пользователь подтверждает через myDSS (мобильное приложение)
   - Callback с результатом на наш endpoint

6. **Верификация подписи** (полная):
   - Целостность: hash документа совпадает с hash в подписи
   - Сертификат: не истёк, keyUsage содержит digitalSignature
   - Цепочка: сертификат издан доверенным УЦ (из списка аккредитованных УЦ Минцифры)
   - Отзыв: OCSP-ответ или CRL не содержат серийный номер сертификата
   - Timestamp: если CAdES-T/XLT1 — timestamp валиден

7. **Уведомления**:
   - За 30 дней до истечения сертификата — email + push «Сертификат КЭП истекает через 30 дней»
   - За 7 дней — повторное уведомление
   - При истечении — блокировка подписания, предупреждение

8. **Шифрование API Key**: аналогично паролю 1С (Задача 12) — AES-256-GCM.

9. **Batch-signing**: для подписания нескольких документов одним действием (например, 10 КС-2 за месяц). Browser Plugin подписывает каждый hash последовательно с одним PIN-вводом. DSS — одно подтверждение в myDSS для всех документов.

10. **Tenant isolation**: сертификаты и подписи привязаны к organization_id.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр своих сертификатов | Да | Да | Да | Да | Нет |
| Загрузка сертификата | Да | Да | Да | Да | Нет |
| Подписание документов | Да | Да | Да | Да | Нет |
| Batch-подписание | Да | Да | Нет | Да | Нет |
| Верификация подписей | Да | Да | Да | Да | Да |
| Отправка запроса на подпись другому | Да | Да | Да | Нет | Нет |
| Настройка КЭП-провайдера | Да | Нет | Нет | Нет | Нет |
| Просмотр всех сертификатов организации | Да | Нет | Нет | Нет | Нет |

### Edge Cases

1. **Нет Browser Plugin**: если КриптоПро Browser Plugin не установлен — показать инструкцию по установке + предложить облачное подписание через DSS.
2. **Несколько сертификатов**: у пользователя может быть несколько действующих КЭП (от разных УЦ, для разных организаций). Фильтр по subjectInn === организация.
3. **Сертификат отозван после подписания**: подпись была валидна на момент создания, но сертификат отозван позднее. Для CAdES-XLT1 — подпись остаётся валидной (доказательство действительности на момент подписания). Для CAdES-BES — подпись становится недоверенной.
4. **Timeout DSS**: если пользователь не подтвердил в myDSS за 5 минут — timeout. Показать «Время подтверждения истекло. Повторите.»
5. **Подмена документа после подписания**: если документ изменён после подписания — верификация обнаружит несоответствие hash. Показать красным «Документ изменён после подписания. Подпись недействительна.»
6. **Локальный firewall**: КриптоПро Browser Plugin общается через localhost (127.0.0.1:XXXXX). Если заблокирован — подписание невозможно. Предупреждение с инструкцией.
7. **macOS/Linux**: КриптоПро CSP доступен для macOS и Linux, но Browser Plugin — только Windows. Для macOS/Linux → только DSS (облачное подписание).

### UX-эталон

**Контур.Диадок**: эталон КЭП-подписания в России — Browser Plugin + облако, визуальный штамп, верификация. **СБИС**: альтернативный эталон — inline-подписание в интерфейсе, batch, mobile. **DocuSign**: международный эталон UX подписания — простота, пошаговый визард. Наш подход: (1) простота DocuSign, (2) ГОСТ-совместимость КриптоПро, (3) интеграция с workflow (Задача 13) для автоматических маршрутов.

---

## Задача 15: Real-time Plan-Fact Dashboard

### Описание

Дашборд «План vs Факт» в реальном времени — процесс №6 в карте строительных процессов, Tier 1. Это главный инструмент руководителя проекта для принятия решений: сколько денег потрачено vs бюджет, какие работы опережают/отстают от графика, где перерасход, как изменились метрики за последнюю неделю. Текущая реализация в модуле `planning` содержит `EvmSnapshot` с полным набором EVM-метрик (BAC, PV, EV, AC, CPI, SPI, EAC, ETC, TCPI, percentComplete, criticalPathLength). Фронтенд `EvmDashboardPage.tsx` отображает: GaugeIndicator (CPI/SPI кружочки), TrafficLight status (red/yellow/green), S-curve placeholder. Модуль analytics (`frontend/src/modules/analytics/`) содержит AnalyticsDashboardPage, KpiPage, ProjectAnalyticsChartPage, ReportsPage.

Критические недостатки: (1) EVM-снимки создаются вручную — нет автоматического расчёта PV/EV/AC из данных системы. (2) S-curve — заглушка (нет реальных данных). (3) Нет drill-down: от общего KPI к конкретному WBS-узлу с проблемой. (4) Нет виджетов для финансового план/факта (бюджет vs фактические затраты по статьям). (5) Нет сравнения нескольких проектов. (6) Нет real-time обновления (WebSocket). (7) Нет алертов: «CPI < 0.9 → проект убыточен». (8) Нет прогнозирования: «При текущем CPI проект завершится с перерасходом X млн рублей».

Целевой UX: руководитель открывает дашборд → видит светофор проектов (зелёный/жёлтый/красный) → кликает на проект → видит EVM-метрики (CPI, SPI) с трендом → S-curve (PV/EV/AC по времени) → бюджет по статьям (план/факт/прогноз) → таблицу проблемных WBS-узлов → при изменении данных (новый объём, новая оплата) — дашборд обновляется в реальном времени через WebSocket.

### Сущности/Таблицы БД

```sql
-- Расширение существующей таблицы evm_snapshots
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS schedule_variance NUMERIC(18,2);  -- SV = EV - PV
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS cost_variance NUMERIC(18,2);  -- CV = EV - AC
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS variance_at_completion NUMERIC(18,2);  -- VAC = BAC - EAC
ALTER TABLE evm_snapshots ADD COLUMN IF NOT EXISTS to_complete_cpi NUMERIC(8,4);  -- TCPI(BAC) = (BAC - EV) / (BAC - AC)

CREATE INDEX idx_evm_org ON evm_snapshots(organization_id) WHERE deleted = FALSE;

-- S-curve данные (time-series для графика)
CREATE TABLE plan_fact_timeseries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    data_date DATE NOT NULL,
    metric_type VARCHAR(30) NOT NULL,  -- PLANNED_VALUE, EARNED_VALUE, ACTUAL_COST, BUDGET_FORECAST
    amount NUMERIC(18,2) NOT NULL,
    cumulative_amount NUMERIC(18,2) NOT NULL,  -- нарастающий итог
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_pft_project_date ON plan_fact_timeseries(project_id, data_date) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_pft_unique ON plan_fact_timeseries(organization_id, project_id, data_date, metric_type) WHERE deleted = FALSE;

-- Бюджетные статьи план/факт (breakdown по cost codes)
CREATE TABLE budget_plan_fact (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    cost_code_id UUID,  -- связь с cost_codes
    cost_code_name VARCHAR(200) NOT NULL,
    budget_amount NUMERIC(18,2) NOT NULL DEFAULT 0,  -- плановый бюджет
    committed_amount NUMERIC(18,2) NOT NULL DEFAULT 0,  -- договорные обязательства
    actual_amount NUMERIC(18,2) NOT NULL DEFAULT 0,  -- фактические затраты
    forecast_amount NUMERIC(18,2) NOT NULL DEFAULT 0,  -- прогноз (EAC по статье)
    variance_amount NUMERIC(18,2) NOT NULL DEFAULT 0,  -- отклонение = budget - forecast
    variance_percent NUMERIC(8,2) DEFAULT 0,
    last_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bpf_project ON budget_plan_fact(project_id) WHERE deleted = FALSE;
CREATE UNIQUE INDEX idx_bpf_unique ON budget_plan_fact(organization_id, project_id, cost_code_id) WHERE deleted = FALSE;

-- Алерты (автоматические уведомления о проблемах)
CREATE TABLE plan_fact_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL,  -- CPI_LOW, SPI_LOW, BUDGET_OVERRUN, SCHEDULE_DELAY, COST_CODE_OVERRUN
    severity VARCHAR(20) NOT NULL,  -- INFO, WARNING, CRITICAL
    title VARCHAR(500) NOT NULL,
    description TEXT,
    metric_name VARCHAR(50),
    metric_value NUMERIC(10,4),
    threshold_value NUMERIC(10,4),
    related_entity_type VARCHAR(50),  -- WBS_NODE, COST_CODE, CONTRACT
    related_entity_id UUID,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by_id UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_pfa_project ON plan_fact_alerts(project_id) WHERE deleted = FALSE;
CREATE INDEX idx_pfa_unacked ON plan_fact_alerts(organization_id, is_acknowledged) WHERE deleted = FALSE AND is_acknowledged = FALSE;
CREATE INDEX idx_pfa_type ON plan_fact_alerts(alert_type) WHERE deleted = FALSE;

-- Настройки порогов алертов
CREATE TABLE alert_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    project_id UUID,  -- NULL = глобальный для организации
    metric_name VARCHAR(50) NOT NULL,  -- CPI, SPI, BUDGET_VARIANCE_PERCENT, SCHEDULE_DELAY_DAYS
    warning_threshold NUMERIC(10,4),  -- жёлтый (например, CPI < 0.95)
    critical_threshold NUMERIC(10,4),  -- красный (например, CPI < 0.85)
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_at_unique ON alert_thresholds(organization_id, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'), metric_name) WHERE deleted = FALSE;
```

### API Endpoints

```
-- Dashboard (главный endpoint) --

GET /api/plan-fact/dashboard
  Query: projectId?, dateFrom?, dateTo?
  Response: PlanFactDashboardResponse {
    projects: [ProjectSummaryResponse],  -- если projectId не указан — список проектов со светофором
    selectedProject?: {
      projectId, projectName, status: RED|YELLOW|GREEN,
      evm: EvmCurrentResponse { bac, pv, ev, ac, cpi, spi, eac, etc, tcpi, sv, cv, vac, percentComplete },
      trend: EvmTrendResponse { cpiTrend: number[], spiTrend: number[], dates: string[] },  -- за последние 12 точек
      budget: BudgetSummaryResponse { totalBudget, totalCommitted, totalActual, totalForecast, variance },
      schedule: ScheduleSummaryResponse { plannedEndDate, forecastEndDate, delayDays, criticalPathLength },
      alerts: PlanFactAlertResponse[]
    }
  }
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]

-- S-Curve Data --

GET /api/plan-fact/s-curve?projectId={id}
  Query: dateFrom?, dateTo?, interval?: DAY|WEEK|MONTH
  Response: SCurveResponse {
    dates: string[],
    plannedValue: number[],  -- нарастающий PV
    earnedValue: number[],   -- нарастающий EV
    actualCost: number[],    -- нарастающий AC
    budgetForecast?: number[]  -- прогнозная кривая
  }
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]

-- Budget Breakdown --

GET /api/plan-fact/budget?projectId={id}
  Query: groupBy?: COST_CODE|CONTRACT|WBS
  Response: BudgetBreakdownResponse[] {
    id, name,
    budget, committed, actual, forecast,
    varianceAmount, variancePercent,
    status: UNDER_BUDGET|ON_BUDGET|OVER_BUDGET
  }
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT]

-- WBS Plan-Fact (drill-down) --

GET /api/plan-fact/wbs?projectId={id}
  Query: parentId?, level?, showProblematicOnly?: boolean
  Response: WbsPlanFactResponse[] {
    nodeId, nodeName, code, level,
    plannedStart, actualStart, plannedEnd, forecastEnd,
    delayDays, percentComplete,
    plannedCost, actualCost, forecastCost,
    cpi?, spi?,
    status: AHEAD|ON_TRACK|BEHIND|CRITICAL
  }
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]

-- EVM Snapshots --

GET /api/plan-fact/evm-history?projectId={id}
  Query: dateFrom?, dateTo?
  Response: EvmSnapshot[]
  Roles: [ADMIN, MANAGER, ENGINEER, ACCOUNTANT, VIEWER]

POST /api/plan-fact/evm/recalculate?projectId={id}
  Response: EvmSnapshot (новый снимок)
  Описание: Пересчёт EVM из текущих данных:
    - PV = SUM(бюджет задач, запланированных к текущей дате)
    - EV = SUM(бюджет задач * percentComplete)
    - AC = SUM(фактических затрат из invoices/payments)
    - CPI = EV / AC, SPI = EV / PV
    - EAC = BAC / CPI (типичный), ETC = EAC - AC
  Roles: [ADMIN, MANAGER]

-- Alerts --

GET /api/plan-fact/alerts
  Query: projectId?, severity?, isAcknowledged?, page, size
  Response: Page<PlanFactAlertResponse>
  Roles: [ADMIN, MANAGER, ENGINEER]

POST /api/plan-fact/alerts/{id}/acknowledge
  Response: PlanFactAlertResponse
  Roles: [ADMIN, MANAGER]

-- Alert Thresholds --

GET /api/plan-fact/thresholds
  Query: projectId?
  Response: AlertThresholdResponse[]
  Roles: [ADMIN, MANAGER]

PUT /api/plan-fact/thresholds
  Request: UpsertThresholdsRequest { thresholds: [{ metricName, warningThreshold, criticalThreshold, isEnabled }] }
  Response: AlertThresholdResponse[]
  Roles: [ADMIN]

-- Multi-project comparison --

GET /api/plan-fact/compare
  Query: projectIds (comma-separated)
  Response: ProjectComparisonResponse[] { projectId, projectName, cpi, spi, percentComplete, budgetVariance, scheduleDelay, status }
  Roles: [ADMIN, MANAGER]

-- Real-time (WebSocket) --

WS /ws/plan-fact/{projectId}
  Описание: WebSocket канал для real-time обновлений дашборда.
    При изменении данных (новый volume_entry, новая оплата, обновление % WBS)
    сервер отправляет delta-обновление.
  Messages:
    - { type: 'EVM_UPDATE', data: EvmCurrentResponse }
    - { type: 'BUDGET_UPDATE', data: BudgetSummaryResponse }
    - { type: 'ALERT', data: PlanFactAlertResponse }
    - { type: 'WBS_UPDATE', data: { nodeId, percentComplete, status } }
```

### Экраны (UI Description)

**1. Главный дашборд Plan-Fact**
- Расположение: `frontend/src/modules/analytics/PlanFactDashboardPage.tsx` (новый файл)
- Header: выбор проекта (dropdown) или «Все проекты»
- **При «Все проекты»** — Portfolio View:
  - Таблица проектов: Проект | Прогресс (%) | CPI | SPI | Бюджет/Факт | Дедлайн | Статус (светофор)
  - Сортировка: по статусу (красные сверху), по CPI, по deadline
  - Sparklines: мини-график CPI за 30 дней в каждой строке
- **При выбранном проекте** — Project Detail View:
  - **Верхняя полоса**: 6 MetricCards:
    - CPI (с трендом arrow up/down + цвет) | SPI | BAC | EAC | % Complete | Delay Days
  - **S-Curve** (центральная область, 60% ширины):
    - Линейный график: 3 кривых (PV=синий пунктир, EV=зелёный, AC=красный)
    - Ось X: время, Ось Y: рубли (с суффиксами К/М/Млрд)
    - Hover: tooltip с точными значениями
    - Today line: вертикальная линия
    - Forecast: пунктирная продолжение EV/AC до конца проекта
  - **Budget Breakdown** (правая колонка, 40%):
    - Stacked horizontal bar chart: по cost codes
    - Каждая полоса: бюджет (серый) / факт (синий/красный) / прогноз (пунктир)
    - Drill-down: клик на cost code → детализация
  - **Проблемные области** (нижняя панель):
    - Таблица WBS-узлов с отклонениями: WBS Code | Работа | Plan End | Forecast End | Задержка | CPI | Статус
    - Фильтр: только проблемные (BEHIND/CRITICAL)
  - **Алерты** (правая sidebar, collapsible):
    - Список алертов с severity-иконками
    - Кнопка «Принять к сведению» для каждого

**2. EVM Trend Page (детализация)**
- Расположение: обновить `frontend/src/modules/planning/EvmDashboardPage.tsx`
- Gauge indicators: CPI (круг) + SPI (круг) — уже есть, обновить данные
- Таблица EVM-снимков: Дата | BAC | PV | EV | AC | CPI | SPI | EAC | ETC | TCPI
- Графики трендов: CPI и SPI за время (линейный)
- Прогноз: «При текущем CPI={X} проект завершится с бюджетом {EAC}. Перерасход: {VAC} руб.»

**3. Budget Detail Page**
- Расположение: обновить `frontend/src/modules/finance/CashFlowPage.tsx` или новая страница
- Treemap: визуализация бюджета по cost codes (размер = бюджет, цвет = отклонение)
- Waterfall chart: бюджет → изменения → прогноз
- Drill-down: cost code → contracts → invoices

**4. Настройки алертов**
- Расположение: `frontend/src/modules/analytics/AlertThresholdsPage.tsx` (новый файл)
- Таблица метрик: Метрика | Порог Warning | Порог Critical | Вкл/Выкл
- Предустановки: «Консервативный» (CPI<0.95/0.90), «Стандартный» (CPI<0.90/0.85), «Агрессивный» (CPI<0.85/0.80)

### Бизнес-правила и валидации

1. **Автоматический расчёт EVM**: Scheduler ежедневно (или по trigger при изменении данных):
   - **BAC** = SUM(wbs_nodes.planned_cost) WHERE projectId = X
   - **PV** (Planned Value на дату D) = SUM(wbs_nodes.planned_cost) WHERE planned_end_date <= D
   - **EV** (Earned Value) = SUM(wbs_nodes.planned_cost * percentComplete / 100)
   - **AC** (Actual Cost) = SUM(invoice_lines.amount + payment.amount) по проекту (из модулей finance/costManagement)
   - **CPI** = EV / AC (если AC > 0, иначе NULL)
   - **SPI** = EV / PV (если PV > 0, иначе NULL)
   - **EAC** = BAC / CPI (EAC_typical). Альтернативы: AC + (BAC - EV) (EAC_atypical), AC + (BAC - EV) / (CPI * SPI)
   - **ETC** = EAC - AC
   - **TCPI** = (BAC - EV) / (BAC - AC) — для достижения BAC
   - **SV** = EV - PV (schedule variance, положительный = опережение)
   - **CV** = EV - AC (cost variance, положительный = экономия)
   - **VAC** = BAC - EAC (variance at completion)

2. **Светофор проекта**:
   - GREEN: CPI >= 0.95 AND SPI >= 0.95
   - YELLOW: (CPI >= 0.85 OR SPI >= 0.85) AND NOT GREEN
   - RED: CPI < 0.85 OR SPI < 0.85

3. **S-Curve timeseries**: при пересчёте EVM — записывать точку в plan_fact_timeseries для каждого metric_type (PV, EV, AC). Нарастающий итог = SUM(amount) с начала проекта до data_date.

4. **Прогнозирование**: forecast_end_date = actual_start_date + (planned_duration / SPI). forecast_budget = BAC / CPI.

5. **Алерты**: при расчёте EVM проверять пороги из alert_thresholds:
   - CPI < warning_threshold → WARNING alert
   - CPI < critical_threshold → CRITICAL alert
   - budget_variance_percent > threshold → BUDGET_OVERRUN alert
   - schedule_delay_days > threshold → SCHEDULE_DELAY alert
   - Не создавать дублирующие алерты (проверка по типу + entity за последние 24 часа)

6. **Real-time**: при изменении данных, влияющих на EVM (создание volume_entry, оплата, обновление percentComplete):
   - Trigger: пересчёт EVM для проекта (асинхронно)
   - Отправка delta через WebSocket `/ws/plan-fact/{projectId}`
   - Frontend подписан через `useWebSocket` hook (существует: `frontend/src/hooks/useWebSocket.ts`)

7. **Tenant isolation**: все данные фильтруются по organization_id.

8. **Кэширование**: dashboard данные кэшировать в Redis (TTL 5 минут). При получении WebSocket-обновления — инвалидировать кэш.

### Роли и доступ

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|:-----:|:-------:|:--------:|:----------:|:------:|
| Просмотр дашборда (все проекты) | Да | Да | Нет | Да | Нет |
| Просмотр дашборда (свой проект) | Да | Да | Да | Да | Да |
| Просмотр S-Curve | Да | Да | Да | Да | Да |
| Просмотр бюджетной детализации | Да | Да | Нет | Да | Нет |
| Drill-down до WBS | Да | Да | Да | Нет | Нет |
| Пересчёт EVM вручную | Да | Да | Нет | Нет | Нет |
| Подтверждение алертов | Да | Да | Нет | Нет | Нет |
| Настройка порогов алертов | Да | Нет | Нет | Нет | Нет |
| Сравнение проектов | Да | Да | Нет | Нет | Нет |
| Экспорт отчётов | Да | Да | Да | Да | Нет |

### Edge Cases

1. **Проект без бюджета**: если BAC = 0 — CPI/SPI = NULL. Показать «Не определено» вместо NaN. S-curve пуста.
2. **Начало проекта**: первые дни — PV и EV близки к нулю. CPI/SPI могут быть аномально высокими/низкими. Решение: не генерировать алерты первые 2 недели проекта (или до percentComplete > 5%).
3. **Множественные валюты**: если проект имеет затраты в разных валютах — конвертировать в основную валюту организации по курсу на дату.
4. **Ретроактивные изменения**: если бухгалтер задним числом добавит платёж — пересчитать ALL EVM snapshots с этой даты (или только текущий + отметить historical как estimated).
5. **Очень большой проект**: 5000+ WBS nodes × 365 дней = 1.8M точек timeseries за год. Использовать агрегацию: daily → weekly → monthly при zoom out.
6. **WebSocket disconnection**: при потере WebSocket — fallback на polling каждые 60 секунд.
7. **EVM для суммарных задач**: CPI/SPI для summary WBS node = weighted average по дочерним (вес = planned_cost).
8. **Отрицательный AC**: при возврате средств AC может уменьшиться. CPI может стать > 1 (что нормально — экономия).

### UX-эталон

**Primavera P6 EVM**: эталон для EVM-метрик и S-curve в строительстве. **Microsoft Power BI**: эталон для интерактивных дашбордов с drill-down. **Procore Budget**: эталон для план/факт бюджета по cost codes. Наш подход объединяет: (1) строительный EVM из Primavera, (2) интерактивность Power BI, (3) real-time обновления (чего нет у конкурентов), (4) автоматический расчёт из данных системы (не ручной ввод как в Primavera).

---

_Конец спецификаций задач 8-15. Для задач 16-30 см. отдельный документ STRATEGY_STAGE4_SPECS_16_30.md._