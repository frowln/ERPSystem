# PRIVOD ERP — Детальные технические спецификации задач 16-30

> **Дата:** 2026-02-18
> **Версия:** 1.0
> **Автор:** CPO / Senior Architect
> **Стек:** Java 21 + Spring Boot 3.4.1 + PostgreSQL 16 + Redis 7 + React 19 + TypeScript + Tailwind CSS
> **Паттерн сущностей:** extends BaseEntity (UUID id, createdAt, updatedAt, createdBy, updatedBy, version, deleted)

---

## Оглавление

| # | Задача | Приоритет | Страница |
|---|--------|-----------|----------|
| 16 | Заявки на материалы и цепочка согласования | P1 Late MVP | |
| 17 | Портал управления субподрядчиками | P1 Late MVP | |
| 18 | Цифровой журнал инструктажей по ОТ | P1 Late MVP | |
| 19 | Трекер сертификатов и лицензий | P1 Late MVP | |
| 20 | Реестр дефектов с фото-документацией | P1 Late MVP | |
| 21 | Акты скрытых работ (АОСР) | P2 Core | |
| 22 | Учёт техники и GPS-трекинг | P2 Core | |
| 23 | Управление Punch List | P2 Core | |
| 24 | Прогнозирование денежных потоков | P2 Core | |
| 25 | Складской учёт со штрихкодами/QR | P2 Core | |
| 26 | Отчёт М-29 (списание материалов) | P2 Core | |
| 27 | Доска распределения ресурсов по проектам | P2 Core | |
| 28 | Чек-листы контроля качества | P2 Core | |
| 29 | Регистрация инцидентов и near-miss | P2 Core | |
| 30 | Панель руководителя с KPI | P2 Core | |

---

## Задача 16: Заявки на материалы и цепочка согласования

### 16.1 Описание

Модуль заявок на материалы позволяет инженерам и прорабам на объекте формировать структурированные заявки на получение строительных материалов со склада или закупку у поставщиков. Каждая заявка проходит настраиваемую цепочку согласования: инженер ПТО → начальник участка → снабженец → (опционально) руководитель проекта при превышении суммового порога.

Система автоматически проверяет остатки на складе (интеграция с модулем warehouse/StockEntry), лимитно-заборные ведомости (LimitFenceSheet), и при наличии достаточных запасов формирует складское перемещение (StockMovement типа ISSUE). При отсутствии материала создаётся заявка на закупку (PurchaseRequest). Все этапы фиксируются в журнале аудита с таймстампами и ответственными.

Критически важна мобильная версия: прораб на площадке должен за 2-3 тапа создать заявку с фотографией образца, указанием объёмов и срока потребности. Push-уведомления информируют согласующих в реальном времени.

### 16.2 Сущности БД

```sql
-- Перечисление статусов заявки
-- Java enum: MaterialRequestStatus
-- DRAFT, PENDING_APPROVAL, APPROVED, PARTIALLY_FULFILLED, FULFILLED, REJECTED, CANCELLED

-- Перечисление приоритетов
-- Java enum: MaterialRequestPriority
-- LOW, MEDIUM, HIGH, URGENT

-- Перечисление источников
-- Java enum: FulfillmentSource
-- WAREHOUSE, PURCHASE, MIXED

CREATE TABLE material_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    project_id          UUID NOT NULL,
    number              VARCHAR(50) NOT NULL,
    request_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    needed_by_date      DATE NOT NULL,
    requester_id        UUID NOT NULL,
    requester_name      VARCHAR(255),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    fulfillment_source  VARCHAR(20),
    total_estimated_cost NUMERIC(18,2) DEFAULT 0,
    location_on_site    VARCHAR(500),
    justification       TEXT,
    photo_urls          JSONB DEFAULT '[]'::jsonb,
    notes               TEXT,
    -- Аудит BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    -- Индексы
    CONSTRAINT uq_matreq_org_number UNIQUE (organization_id, number, deleted)
);

CREATE INDEX idx_matreq_org ON material_requests(organization_id);
CREATE INDEX idx_matreq_org_project ON material_requests(organization_id, project_id);
CREATE INDEX idx_matreq_org_status ON material_requests(organization_id, status);
CREATE INDEX idx_matreq_requester ON material_requests(requester_id);
CREATE INDEX idx_matreq_needed_by ON material_requests(needed_by_date);
CREATE INDEX idx_matreq_priority ON material_requests(priority);

CREATE TABLE material_request_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES material_requests(id),
    material_id         UUID NOT NULL,
    material_name       VARCHAR(500) NOT NULL,
    material_code       VARCHAR(100),
    unit_of_measure     VARCHAR(50) NOT NULL,
    requested_quantity  NUMERIC(16,3) NOT NULL,
    approved_quantity   NUMERIC(16,3),
    issued_quantity     NUMERIC(16,3) DEFAULT 0,
    estimated_unit_price NUMERIC(18,2),
    estimated_total     NUMERIC(18,2),
    limit_fence_sheet_id UUID,
    stock_available     NUMERIC(16,3),
    notes               TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_matreq_line_request ON material_request_lines(request_id);
CREATE INDEX idx_matreq_line_material ON material_request_lines(material_id);
CREATE INDEX idx_matreq_line_lfs ON material_request_lines(limit_fence_sheet_id);

CREATE TABLE material_request_approvals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id          UUID NOT NULL REFERENCES material_requests(id),
    step_order          INTEGER NOT NULL,
    approver_role       VARCHAR(50) NOT NULL,
    approver_id         UUID,
    approver_name       VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, APPROVED, REJECTED, SKIPPED
    decision_at         TIMESTAMPTZ,
    comment             TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_matreq_appr_request ON material_request_approvals(request_id);
CREATE INDEX idx_matreq_appr_approver ON material_request_approvals(approver_id);
CREATE INDEX idx_matreq_appr_status ON material_request_approvals(status);
```

### 16.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/material-requests` | ADMIN, MANAGER, ENGINEER | Список заявок с фильтрами (projectId, status, priority, dateRange) |
| GET | `/api/material-requests/{id}` | ADMIN, MANAGER, ENGINEER | Детали заявки с позициями и историей согласования |
| POST | `/api/material-requests` | ADMIN, MANAGER, ENGINEER | Создание заявки (статус DRAFT) |
| PUT | `/api/material-requests/{id}` | ADMIN, MANAGER, ENGINEER | Редактирование заявки (только DRAFT) |
| POST | `/api/material-requests/{id}/submit` | ADMIN, MANAGER, ENGINEER | Отправка на согласование (DRAFT → PENDING_APPROVAL) |
| POST | `/api/material-requests/{id}/approve` | ADMIN, MANAGER | Согласование текущего шага |
| POST | `/api/material-requests/{id}/reject` | ADMIN, MANAGER | Отклонение с комментарием |
| POST | `/api/material-requests/{id}/cancel` | ADMIN, MANAGER, ENGINEER | Отмена заявки (только автор или ADMIN) |
| POST | `/api/material-requests/{id}/fulfill` | ADMIN, MANAGER | Исполнение: создание StockMovement или PurchaseRequest |
| GET | `/api/material-requests/my-approvals` | ADMIN, MANAGER | Заявки, ожидающие моего согласования |
| GET | `/api/material-requests/stats` | ADMIN, MANAGER | Статистика: среднее время согласования, % отклонений |
| DELETE | `/api/material-requests/{id}` | ADMIN | Soft-delete (только DRAFT или CANCELLED) |

**Request: CreateMaterialRequestRequest**
```json
{
  "projectId": "uuid",
  "neededByDate": "2026-03-15",
  "priority": "HIGH",
  "locationOnSite": "Блок А, этаж 3",
  "justification": "Устройство монолитного перекрытия",
  "photoUrls": ["https://s3.../photo1.jpg"],
  "lines": [
    {
      "materialId": "uuid",
      "requestedQuantity": 150.0,
      "notes": "Марка М400"
    }
  ]
}
```

**Response: MaterialRequestResponse**
```json
{
  "id": "uuid",
  "number": "MR-2026-0042",
  "projectId": "uuid",
  "projectName": "ЖК Солнечный",
  "status": "PENDING_APPROVAL",
  "priority": "HIGH",
  "requestDate": "2026-02-18",
  "neededByDate": "2026-03-15",
  "requesterName": "Иванов И.И.",
  "totalEstimatedCost": 425000.00,
  "lines": [...],
  "approvals": [
    {
      "stepOrder": 1,
      "approverRole": "ENGINEER_PTO",
      "approverName": "Петров А.С.",
      "status": "APPROVED",
      "decisionAt": "2026-02-18T10:30:00Z"
    },
    {
      "stepOrder": 2,
      "approverRole": "SITE_MANAGER",
      "status": "PENDING"
    }
  ]
}
```

### 16.4 UI Экраны

1. **Список заявок** (`/material-requests`) — DataTable с колонками: номер, проект, дата потребности, приоритет (цветовой бейдж), статус, сумма, автор. Фильтры: статус, приоритет, проект, диапазон дат. Кнопка «+ Новая заявка».

2. **Форма создания/редактирования** (`/material-requests/new`, `/material-requests/:id/edit`) — мультишаговый wizard: Шаг 1 — проект, дата потребности, приоритет, обоснование, фото. Шаг 2 — добавление позиций материалов с автоподбором из справочника (Material), отображение остатков на складе и лимитов ЛЗВ. Шаг 3 — предпросмотр и отправка.

3. **Детальная страница** (`/material-requests/:id`) — карточка заявки, таблица позиций, timeline согласования (визуальный stepper), кнопки действий (согласовать/отклонить/отменить).

4. **Мои согласования** (`/material-requests/approvals`) — список заявок, ожидающих решения текущего пользователя. Свайп-действия на мобильном: влево = отклонить, вправо = согласовать.

5. **Мобильная форма быстрого создания** — камера для фото, поиск материала по названию/коду, ввод количества, автоподстановка проекта по GPS-геолокации (если настроена привязка проекта к координатам).

### 16.5 Бизнес-правила и валидации

1. **Автонумерация:** формат `MR-{YYYY}-{NNNN}`, инкремент в пределах организации и года.
2. **Дата потребности:** не ранее текущей даты + 1 день (за исключением приоритета URGENT).
3. **Проверка лимитов ЛЗВ:** при наличии активной LimitFenceSheet для данного материала/проекта — автоматически сверяется `remainingQuantity`. Если запрошено больше лимита — предупреждение (не блокировка, но требует обоснования).
4. **Проверка складских остатков:** при создании позиции заполняется `stockAvailable` из StockEntry. Если `available_quantity >= requested_quantity` — подсвечивается зелёным (можно выдать со склада). Иначе — оранжевым (нужна закупка).
5. **Цепочка согласования:** настраивается на уровне организации. По умолчанию: (1) Инженер ПТО → (2) Начальник участка → (3) Снабженец. Если `totalEstimatedCost > порог` (настраиваемый, по умолчанию 500 000 руб.) — добавляется шаг (4) Руководитель проекта.
6. **Таймауты согласования:** если шаг не обработан за 24 часа — push-напоминание. Через 48 часов — эскалация на следующий уровень.
7. **Частичное исполнение:** если на складе есть только часть материала — создаётся StockMovement на имеющееся количество + PurchaseRequest на остаток.
8. **Отмена:** отмена возможна автором до полного исполнения. При частичном исполнении — только на неисполненную часть.
9. **Нормативная база:** Постановление Госкомстата РФ от 30.10.1997 N 71а (унифицированные формы М-11, М-8); ПБУ 5/01 «Учёт материально-производственных запасов».

### 16.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр списка | + | + | + (свои + своего проекта) | + (только просмотр) | + (только просмотр) |
| Создание заявки | + | + | + | - | - |
| Редактирование | + | + (свои) | + (свои, только DRAFT) | - | - |
| Отправка на согласование | + | + | + (свои) | - | - |
| Согласование | + | + (в рамках своей роли) | - | - | - |
| Отклонение | + | + (в рамках своей роли) | - | - | - |
| Отмена | + | + (свои) | + (свои, до исполнения) | - | - |
| Исполнение | + | + | - | - | - |
| Удаление | + | - | - | - | - |

### 16.7 Крайние случаи

1. **Материал удалён из справочника** после создания заявки — заявка сохраняет `materialName`/`materialCode` в строке; при исполнении показывается предупреждение.
2. **Конкурентное согласование** — два согласующих одного шага одновременно нажимают «Согласовать». Решение: optimistic locking (version), первый побеждает, второй получает 409 Conflict.
3. **Складские остатки изменились** между согласованием и исполнением — повторная проверка при исполнении; если остатков недостаточно — автоматическое переключение на закупку с уведомлением.
4. **Заявка на несуществующий проект** — валидация FK на уровне сервиса (не JPA @ManyToOne по паттерну проекта).
5. **Массовая заявка** (>50 позиций) — пагинация строк; импорт из Excel (xlsx).

### 16.8 UX Бенчмарк

**Лучший в классе:** Procore (Material Requests module) — интуитивный wizard создания, интеграция с закупками, мобильная оптимизация. PlanRadar — фото-ориентированный подход с привязкой к чертежу. Для российского рынка: 1С:Управление строительством — цепочки согласования с настраиваемыми маршрутами.

---

## Задача 17: Портал управления субподрядчиками

### 17.1 Описание

Модуль управления субподрядчиками обеспечивает полный жизненный цикл взаимодействия генподрядчика с субподрядными организациями: от первичной регистрации и квалификации (prequalification) до оценки производительности и управления документами. Каждый субподрядчик проходит верификацию с проверкой ИНН/ОГРН через ФНС, наличия лицензий СРО, страховых полисов и финансовой состоятельности.

Портал предоставляет субподрядчикам ограниченный доступ для самообслуживания: загрузка документов, просмотр статуса платежей, заполнение форм КС-2/КС-3, отслеживание замечаний по качеству. Генподрядчик видит рейтинговую карточку каждого субподрядчика с KPI: сроки выполнения работ, качество (количество замечаний), безопасность (количество инцидентов), финансовая дисциплина.

Интеграция с модулями: contracts (договоры), finance (оплаты), quality (замечания), safety (инциденты), pto (исполнительная документация). Для российского рынка критична поддержка требований 44-ФЗ/223-ФЗ по квалификации подрядчиков.

### 17.2 Сущности БД

```sql
-- Java enum: SubcontractorStatus
-- PENDING_VERIFICATION, VERIFIED, QUALIFIED, SUSPENDED, BLACKLISTED

-- Java enum: QualificationLevel
-- NOT_QUALIFIED, BASIC, STANDARD, PREMIUM

-- Java enum: DocumentType
-- SRO_LICENSE, INSURANCE_POLICY, TAX_CERTIFICATE, FINANCIAL_STATEMENT,
-- SAFETY_RECORD, REFERENCE_LETTER, BANK_GUARANTEE, OTHER

CREATE TABLE subcontractors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    company_name        VARCHAR(500) NOT NULL,
    short_name          VARCHAR(200),
    inn                 VARCHAR(12) NOT NULL,
    ogrn                VARCHAR(15),
    kpp                 VARCHAR(9),
    legal_address       TEXT,
    actual_address      TEXT,
    contact_person      VARCHAR(255),
    contact_phone       VARCHAR(20),
    contact_email       VARCHAR(255),
    website             VARCHAR(500),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    qualification_level VARCHAR(20) NOT NULL DEFAULT 'NOT_QUALIFIED',
    sro_member          BOOLEAN DEFAULT FALSE,
    sro_number          VARCHAR(100),
    sro_expiry_date     DATE,
    max_contract_amount NUMERIC(18,2),
    specializations     JSONB DEFAULT '[]'::jsonb,
    -- ["concrete_works","electrical","plumbing","roofing",...]
    rating_overall      NUMERIC(3,1) DEFAULT 0.0,
    rating_quality      NUMERIC(3,1) DEFAULT 0.0,
    rating_schedule     NUMERIC(3,1) DEFAULT 0.0,
    rating_safety       NUMERIC(3,1) DEFAULT 0.0,
    rating_finance      NUMERIC(3,1) DEFAULT 0.0,
    total_contracts     INTEGER DEFAULT 0,
    total_contract_value NUMERIC(18,2) DEFAULT 0,
    blacklist_reason    TEXT,
    verification_date   DATE,
    verified_by_id      UUID,
    notes               TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_sub_org_inn UNIQUE (organization_id, inn, deleted)
);

CREATE INDEX idx_sub_org ON subcontractors(organization_id);
CREATE INDEX idx_sub_org_status ON subcontractors(organization_id, status);
CREATE INDEX idx_sub_org_qual ON subcontractors(organization_id, qualification_level);
CREATE INDEX idx_sub_inn ON subcontractors(inn);
CREATE INDEX idx_sub_rating ON subcontractors(rating_overall DESC);
CREATE INDEX idx_sub_specializations ON subcontractors USING GIN(specializations);

CREATE TABLE subcontractor_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id    UUID NOT NULL REFERENCES subcontractors(id),
    document_type       VARCHAR(30) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    file_url            VARCHAR(1000) NOT NULL,
    file_size           BIGINT,
    issue_date          DATE,
    expiry_date         DATE,
    document_number     VARCHAR(100),
    issuing_authority   VARCHAR(500),
    verified            BOOLEAN DEFAULT FALSE,
    verified_by_id      UUID,
    verified_at         TIMESTAMPTZ,
    notes               TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sub_doc_sub ON subcontractor_documents(subcontractor_id);
CREATE INDEX idx_sub_doc_type ON subcontractor_documents(document_type);
CREATE INDEX idx_sub_doc_expiry ON subcontractor_documents(expiry_date);

CREATE TABLE subcontractor_evaluations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id    UUID NOT NULL REFERENCES subcontractors(id),
    project_id          UUID NOT NULL,
    contract_id         UUID,
    evaluation_date     DATE NOT NULL,
    evaluator_id        UUID NOT NULL,
    evaluator_name      VARCHAR(255),
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    score_quality       INTEGER CHECK (score_quality BETWEEN 1 AND 10),
    score_schedule      INTEGER CHECK (score_schedule BETWEEN 1 AND 10),
    score_safety        INTEGER CHECK (score_safety BETWEEN 1 AND 10),
    score_finance       INTEGER CHECK (score_finance BETWEEN 1 AND 10),
    score_communication INTEGER CHECK (score_communication BETWEEN 1 AND 10),
    overall_score       NUMERIC(3,1),
    defects_count       INTEGER DEFAULT 0,
    incidents_count     INTEGER DEFAULT 0,
    schedule_variance_days INTEGER DEFAULT 0,
    payment_delays_count INTEGER DEFAULT 0,
    strengths           TEXT,
    weaknesses          TEXT,
    recommendations     TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sub_eval_sub ON subcontractor_evaluations(subcontractor_id);
CREATE INDEX idx_sub_eval_project ON subcontractor_evaluations(project_id);
CREATE INDEX idx_sub_eval_date ON subcontractor_evaluations(evaluation_date);

CREATE TABLE subcontractor_portal_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id    UUID NOT NULL REFERENCES subcontractors(id),
    user_id             UUID NOT NULL,
    role                VARCHAR(30) NOT NULL DEFAULT 'VIEWER',
    -- ADMIN, DOCUMENT_MANAGER, VIEWER
    active              BOOLEAN DEFAULT TRUE,
    invited_at          TIMESTAMPTZ,
    accepted_at         TIMESTAMPTZ,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sub_portal_sub ON subcontractor_portal_users(subcontractor_id);
CREATE INDEX idx_sub_portal_user ON subcontractor_portal_users(user_id);
```

### 17.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/subcontractors` | ADMIN, MANAGER | Список субподрядчиков с фильтрами |
| GET | `/api/subcontractors/{id}` | ADMIN, MANAGER, ENGINEER | Карточка субподрядчика с рейтингами |
| POST | `/api/subcontractors` | ADMIN, MANAGER | Регистрация нового субподрядчика |
| PUT | `/api/subcontractors/{id}` | ADMIN, MANAGER | Обновление данных |
| POST | `/api/subcontractors/{id}/verify` | ADMIN | Верификация (проверка ИНН/ОГРН) |
| POST | `/api/subcontractors/{id}/qualify` | ADMIN, MANAGER | Установка уровня квалификации |
| POST | `/api/subcontractors/{id}/suspend` | ADMIN | Приостановка сотрудничества |
| POST | `/api/subcontractors/{id}/blacklist` | ADMIN | Внесение в чёрный список |
| GET | `/api/subcontractors/{id}/documents` | ADMIN, MANAGER, ENGINEER | Документы субподрядчика |
| POST | `/api/subcontractors/{id}/documents` | ADMIN, MANAGER | Загрузка документа |
| POST | `/api/subcontractors/{id}/documents/{docId}/verify` | ADMIN | Верификация документа |
| GET | `/api/subcontractors/{id}/evaluations` | ADMIN, MANAGER | История оценок |
| POST | `/api/subcontractors/{id}/evaluations` | ADMIN, MANAGER | Создание оценки за период |
| GET | `/api/subcontractors/{id}/contracts` | ADMIN, MANAGER | Договоры субподрядчика (из модуля contracts) |
| GET | `/api/subcontractors/{id}/defects` | ADMIN, MANAGER, ENGINEER | Дефекты субподрядчика (из модуля ops) |
| GET | `/api/subcontractors/{id}/incidents` | ADMIN, MANAGER | Инциденты (из модуля safety) |
| GET | `/api/subcontractors/ranking` | ADMIN, MANAGER | Рейтинг по специализациям |
| POST | `/api/subcontractors/{id}/portal-invite` | ADMIN | Пригласить пользователя в портал |
| GET | `/api/portal/my-company` | SUBCONTRACTOR | Портал: данные своей компании |
| GET | `/api/portal/my-documents` | SUBCONTRACTOR | Портал: свои документы |
| POST | `/api/portal/my-documents` | SUBCONTRACTOR | Портал: загрузить документ |
| GET | `/api/portal/my-payments` | SUBCONTRACTOR | Портал: статус платежей |
| GET | `/api/portal/my-defects` | SUBCONTRACTOR | Портал: замечания по качеству |

### 17.4 UI Экраны

1. **Реестр субподрядчиков** (`/subcontractors`) — DataTable с колонками: название, ИНН, специализация (теги), квалификация (бейдж), рейтинг (звёзды), статус, кол-во договоров. Фильтры: статус, квалификация, специализация, диапазон рейтинга. Сортировка по рейтингу.

2. **Карточка субподрядчика** (`/subcontractors/:id`) — вкладки: Общие данные | Документы | Договоры | Оценки | Дефекты | Инциденты | Портал. Главная панель — рейтинговая карточка с radar-chart (5 осей: качество, сроки, безопасность, финансы, коммуникация).

3. **Форма регистрации** (`/subcontractors/new`) — поэтапная: Шаг 1 — реквизиты (ИНН с авто-заполнением из ФНС). Шаг 2 — специализации (мульти-селект). Шаг 3 — загрузка документов (drag-and-drop).

4. **Форма оценки** (`/subcontractors/:id/evaluate`) — 5 ползунков (1-10 баллов), текстовые поля для сильных/слабых сторон, авто-подтягивание статистики (дефекты, инциденты, отклонение от графика).

5. **Портал субподрядчика** (`/portal/dashboard`) — отдельный layout. Дашборд: статус документов (истекающие — красным), открытые замечания, история платежей, текущие объёмы работ.

6. **Рейтинг** (`/subcontractors/ranking`) — таблица-лидерборд по специализациям с фильтром по типу работ.

### 17.5 Бизнес-правила и валидации

1. **Валидация ИНН:** 10 цифр (юрлицо) или 12 цифр (ИП) с проверкой контрольной суммы по алгоритму ФНС. Уникальность ИНН в пределах организации.
2. **Проверка СРО:** если специализация требует допуска СРО (СП 48.13330.2019) — поле sroNumber обязательно. Автоматическая проверка наличия в реестре НОСТРОЙ/НОПРИЗ (при наличии API-интеграции).
3. **Квалификация:** BASIC — есть ИНН + учредительные документы. STANDARD — BASIC + СРО + страховка + 2 положительных отзыва. PREMIUM — STANDARD + 5 завершённых контрактов + рейтинг >= 7.0 + финансовый аудит.
4. **Истечение документов:** автоматическая проверка каждые 24 часа (cron). За 30 дней до истечения — уведомление MANAGER + субподрядчику. При истечении — статус документа «EXPIRED», предупреждение на карточке.
5. **Рейтинг:** пересчёт после каждой оценки. `rating_overall = (quality*0.3 + schedule*0.25 + safety*0.25 + finance*0.15 + communication*0.05)`. Веса настраиваемы на уровне организации.
6. **Чёрный список:** субподрядчик в BLACKLISTED не отображается в выборке при создании договоров. Требуется указание причины.
7. **Нормативная база:** 44-ФЗ «О контрактной системе», 223-ФЗ «О закупках», Градостроительный кодекс РФ (ст. 55.8 — допуск СРО).

### 17.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER | SUBCONTRACTOR |
|----------|-------|---------|----------|------------|--------|---------------|
| Просмотр реестра | + | + | + (свои проекты) | + | + | - |
| Карточка | + | + | + | + | + | Своя компания |
| Регистрация | + | + | - | - | - | - |
| Верификация | + | - | - | - | - | - |
| Квалификация | + | + | - | - | - | - |
| Приостановка/ЧС | + | - | - | - | - | - |
| Оценка | + | + | - | - | - | - |
| Загрузка документов | + | + | - | - | - | Свои |
| Верификация документов | + | - | - | - | - | - |
| Портал | - | - | - | - | - | + |

### 17.7 Крайние случаи

1. **Дублирование ИНН:** при создании — проверка уникальности ИНН в пределах организации. Soft-deleted записи игнорируются при проверке (deleted=true).
2. **Субподрядчик с активными договорами** — приостановка (SUSPEND) не блокирует текущие работы, но запрещает заключение новых контрактов.
3. **Удаление субподрядчика** с привязанными оценками/документами — soft-delete каскадно.
4. **Портальный пользователь уволен** — деактивация через `active=false`, без удаления для аудита.
5. **Загрузка большого файла** (>50 МБ) — multipart upload через MinIO с progress bar.
6. **Одновременная оценка** от двух MANAGER — обе сохраняются, рейтинг пересчитывается по среднему всех оценок за последние 12 месяцев.

### 17.8 UX Бенчмарк

**Лучший в классе:** Procore (Vendor Management) — prequalification workflow, документооборот, performance tracking. CMiC — глубокая интеграция с бухгалтерией для субподрядчиков. Для российского рынка: ИСУП — управление субподрядчиками с учётом 44-ФЗ/223-ФЗ; Битрикс24 — портал самообслуживания контрагентов.

---

## Задача 18: Цифровой журнал инструктажей по ОТ

### 18.1 Описание

Модуль цифрового журнала инструктажей по охране труда (ОТ) и технике безопасности (ТБ) заменяет бумажные журналы, обязательные по ГОСТ 12.0.004-2015 «Организация обучения безопасности труда». Система ведёт учёт всех видов инструктажей: вводный, первичный на рабочем месте, повторный, внеплановый, целевой. Каждый инструктаж фиксируется с электронной подписью инструктируемого и инструктирующего.

Автоматический контроль периодичности: повторный инструктаж — не реже 1 раза в 3 месяца (для работ повышенной опасности — 1 раз в месяц). Система заблаговременно формирует списки сотрудников, которым необходим повторный инструктаж, и отправляет уведомления ответственным. При отсутствии актуального инструктажа сотрудник не допускается к работе — блокировка в модуле табельного учёта (Timesheet).

Для мобильного использования на площадке: QR-код сотрудника → быстрое добавление в журнал инструктажа → подпись пальцем на экране. Поддержка массового инструктажа: один инструктаж для группы сотрудников (до 100 человек одновременно).

### 18.2 Сущности БД

```sql
-- Java enum: BriefingType
-- INTRODUCTORY, PRIMARY, REPEATED, UNSCHEDULED, TARGET

-- Java enum: BriefingStatus
-- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

CREATE TABLE safety_briefings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    project_id          UUID,
    number              VARCHAR(50) NOT NULL,
    briefing_type       VARCHAR(30) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    briefing_date       DATE NOT NULL,
    briefing_time       TIME,
    location            VARCHAR(500),
    instructor_id       UUID NOT NULL,
    instructor_name     VARCHAR(255) NOT NULL,
    instructor_position VARCHAR(255),
    program_content     TEXT,
    regulation_refs     JSONB DEFAULT '[]'::jsonb,
    -- ["ГОСТ 12.0.004-2015 п.8.7","ПОТ Р М-012-2000"]
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    hazard_types        JSONB DEFAULT '[]'::jsonb,
    -- ["height_work","confined_space","electrical"]
    work_permit_id      UUID,
    attachment_urls     JSONB DEFAULT '[]'::jsonb,
    notes               TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_briefing_org_number UNIQUE (organization_id, number, deleted)
);

CREATE INDEX idx_briefing_org ON safety_briefings(organization_id);
CREATE INDEX idx_briefing_org_project ON safety_briefings(organization_id, project_id);
CREATE INDEX idx_briefing_org_type ON safety_briefings(organization_id, briefing_type);
CREATE INDEX idx_briefing_date ON safety_briefings(briefing_date);
CREATE INDEX idx_briefing_instructor ON safety_briefings(instructor_id);
CREATE INDEX idx_briefing_status ON safety_briefings(status);
CREATE INDEX idx_briefing_work_permit ON safety_briefings(work_permit_id);

CREATE TABLE safety_briefing_attendees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id         UUID NOT NULL REFERENCES safety_briefings(id),
    employee_id         UUID NOT NULL,
    employee_name       VARCHAR(255) NOT NULL,
    employee_position   VARCHAR(255),
    employee_company    VARCHAR(500),
    -- Может быть субподрядчик
    passed              BOOLEAN,
    signature_url       VARCHAR(1000),
    -- URL подписи в MinIO (PNG рукописной подписи)
    signed_at           TIMESTAMPTZ,
    reason_for_absence  VARCHAR(500),
    next_briefing_date  DATE,
    -- Дата следующего повторного инструктажа
    notes               TEXT,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_briefing_att_briefing ON safety_briefing_attendees(briefing_id);
CREATE INDEX idx_briefing_att_employee ON safety_briefing_attendees(employee_id);
CREATE INDEX idx_briefing_att_next ON safety_briefing_attendees(next_briefing_date);
CREATE INDEX idx_briefing_att_passed ON safety_briefing_attendees(passed);

CREATE TABLE safety_briefing_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    briefing_type       VARCHAR(30) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    program_content     TEXT NOT NULL,
    regulation_refs     JSONB DEFAULT '[]'::jsonb,
    hazard_types        JSONB DEFAULT '[]'::jsonb,
    duration_minutes    INTEGER DEFAULT 30,
    active              BOOLEAN DEFAULT TRUE,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_briefing_tmpl_org ON safety_briefing_templates(organization_id);
CREATE INDEX idx_briefing_tmpl_type ON safety_briefing_templates(briefing_type);
```

### 18.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/safety-briefings` | ADMIN, MANAGER, ENGINEER | Список инструктажей с фильтрами |
| GET | `/api/safety-briefings/{id}` | ADMIN, MANAGER, ENGINEER | Детали инструктажа со списком участников |
| POST | `/api/safety-briefings` | ADMIN, MANAGER, ENGINEER | Создание инструктажа |
| PUT | `/api/safety-briefings/{id}` | ADMIN, MANAGER, ENGINEER | Редактирование (только SCHEDULED) |
| POST | `/api/safety-briefings/{id}/start` | ADMIN, MANAGER, ENGINEER | Начать проведение (SCHEDULED → IN_PROGRESS) |
| POST | `/api/safety-briefings/{id}/complete` | ADMIN, MANAGER, ENGINEER | Завершить (IN_PROGRESS → COMPLETED) |
| POST | `/api/safety-briefings/{id}/cancel` | ADMIN, MANAGER | Отменить |
| POST | `/api/safety-briefings/{id}/attendees` | ADMIN, MANAGER, ENGINEER | Добавить участников (массово) |
| POST | `/api/safety-briefings/{id}/attendees/{attId}/sign` | ADMIN, MANAGER, ENGINEER | Подпись участника (multipart: signature image) |
| POST | `/api/safety-briefings/{id}/attendees/scan` | ADMIN, MANAGER, ENGINEER | Добавить участника по QR-коду сотрудника |
| GET | `/api/safety-briefings/overdue` | ADMIN, MANAGER | Сотрудники с просроченным инструктажем |
| GET | `/api/safety-briefings/upcoming` | ADMIN, MANAGER | Предстоящие инструктажи (следующие 7/14/30 дней) |
| GET | `/api/safety-briefings/employee/{employeeId}/history` | ADMIN, MANAGER, ENGINEER | История инструктажей сотрудника |
| GET | `/api/safety-briefings/employee/{employeeId}/status` | ADMIN, MANAGER, ENGINEER | Актуальность инструктажей сотрудника |
| GET | `/api/safety-briefing-templates` | ADMIN, MANAGER, ENGINEER | Шаблоны инструктажей |
| POST | `/api/safety-briefing-templates` | ADMIN, MANAGER | Создание шаблона |
| PUT | `/api/safety-briefing-templates/{id}` | ADMIN, MANAGER | Обновление шаблона |
| GET | `/api/safety-briefings/{id}/print` | ADMIN, MANAGER, ENGINEER | Печатная форма журнала (PDF) |

### 18.4 UI Экраны

1. **Журнал инструктажей** (`/safety/briefings`) — DataTable: номер, тип (цветной бейдж), дата, инструктирующий, проект, кол-во участников, статус. Фильтры: тип, статус, проект, период. Быстрый фильтр «Просроченные».

2. **Карточка инструктажа** (`/safety/briefings/:id`) — заголовок с типом и датой, программа инструктажа, таблица участников с колонками: ФИО, должность, организация, подпись (миниатюра), дата подписи, результат (Прошёл/Не прошёл). Кнопки: «Добавить участников», «Сканировать QR», «Подписать», «Печать».

3. **Форма создания** (`/safety/briefings/new`) — выбор типа → автозаполнение из шаблона (программа, нормативные ссылки). Выбор проекта, инструктирующего, даты. Добавление участников из справочника сотрудников (мульти-селект с поиском).

4. **Мобильный экран проведения** — полноэкранный режим: список участников → тап на участника → экран подписи пальцем → подтверждение. Кнопка «Сканировать QR» с камерой.

5. **Дашборд ОТ** (`/safety/briefings/dashboard`) — метрики: всего проведено за месяц, просроченные (критическое число красным), покрытие сотрудников (%). Список сотрудников с просроченным инструктажем.

6. **Карточка сотрудника (расширение)** — вкладка «Инструктажи» с историей и статусом актуальности каждого типа.

7. **Печатная форма** — PDF по форме, соответствующей ГОСТ 12.0.004-2015 (Приложение А): таблица с графами: дата, ФИО, должность, вид инструктажа, подпись инструктирующего, подпись инструктируемого.

### 18.5 Бизнес-правила и валидации

1. **Периодичность повторного инструктажа:** по умолчанию — каждые 3 месяца. Для работ повышенной опасности (высотные работы, ограниченные пространства, электроустановки) — каждый месяц. Настраивается на уровне организации.
2. **Расчёт next_briefing_date:** `briefing_date + interval` (в зависимости от типа работ и конфигурации). Автоматически записывается при завершении инструктажа.
3. **Блокировка допуска:** если у сотрудника просрочен повторный инструктаж — флаг `briefing_overdue=true` в модуле HR. Табельный учёт (TimesheetService) проверяет этот флаг при записи рабочего времени.
4. **Вводный инструктаж:** обязателен для каждого нового сотрудника/субподрядчика перед первым выходом на площадку. Система проверяет наличие при первом добавлении в проект.
5. **Целевой инструктаж:** привязан к наряду-допуску (work_permit_id). Не может быть завершён до подписания наряда-допуска.
6. **Подпись:** обязательна для всех участников. Инструктаж не может перейти в COMPLETED, пока не подписаны все участники (или не отмечены как отсутствующие с указанием причины).
7. **Массовый инструктаж:** максимум 100 участников. При > 100 — создать два отдельных инструктажа.
8. **Нормативная база:** ГОСТ 12.0.004-2015 «ССБТ. Организация обучения безопасности труда»; ТК РФ ст. 212, 214, 225; Постановление Минтруда РФ и Минобразования РФ от 13.01.2003 N 1/29 «О порядке обучения по ОТ»; Приказ Минтруда РФ от 29.10.2021 N 773н.

### 18.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр журнала | + | + | + (свои проекты) | - | + |
| Создание инструктажа | + | + | + | - | - |
| Проведение (подписи) | + | + | + | - | - |
| Завершение | + | + | + (свои) | - | - |
| Отмена | + | + | - | - | - |
| Шаблоны (CRUD) | + | + | - | - | - |
| Дашборд ОТ | + | + | + | - | + |
| Печать PDF | + | + | + | - | + |
| История сотрудника | + | + | + | - | - |

### 18.7 Крайние случаи

1. **Сотрудник субподрядчика** — employee_company заполняется из карточки субподрядчика. Субподрядчик видит инструктажи своих сотрудников через портал (задача 17).
2. **Подпись с мобильного устройства** — canvas HTML5 для рисования подписи пальцем. При отсутствии стилуса — минимальный размер 200x100 px. Сохранение в PNG, upload в MinIO.
3. **Оффлайн-режим** — данные инструктажа кэшируются в IndexedDB (offlineQueue). При восстановлении связи — синхронизация. Подписи загружаются позже.
4. **Сотрудник отсутствует** — отмечается reason_for_absence. Необходимо провести индивидуальный инструктаж до допуска к работе.
5. **Внеплановый инструктаж** (после инцидента) — создаётся из карточки SafetyIncident с предзаполнением: тип = UNSCHEDULED, описание из incident.description.
6. **Удаление завершённого инструктажа** — запрещено (юридически значимый документ). Только soft-delete администратором с обязательным комментарием.

### 18.8 UX Бенчмарк

**Лучший в классе:** PlanRadar — мобильное проведение проверок с подписями. Fieldwire — чек-листы безопасности с фото. Procore — Safety module с toolbox talks. Для российского рынка: Охрана 24 — электронные журналы инструктажей по ГОСТ 12.0.004-2015; ELMA365 — цифровые маршруты согласования.

---
