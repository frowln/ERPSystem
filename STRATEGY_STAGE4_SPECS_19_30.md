# PRIVOD ERP — Детальные технические спецификации задач 19-30

> **Дата:** 2026-02-18
> **Версия:** 1.0
> **Автор:** CPO / Senior Architect
> **Стек:** Java 21 + Spring Boot 3.4.1 + PostgreSQL 16 + Redis 7 + React 19 + TypeScript + Tailwind CSS
> **Паттерн сущностей:** extends BaseEntity (UUID id, createdAt, updatedAt, createdBy, updatedBy, version, deleted)

---

## Оглавление

| # | Задача | Приоритет |
|---|--------|-----------|
| 19 | Трекер сертификатов и лицензий | P1 Late MVP |
| 20 | Реестр дефектов с фото-документацией | P1 Late MVP |
| 21 | Акты скрытых работ (АОСР) | P2 Core |
| 22 | Учёт техники и GPS-трекинг | P2 Core |
| 23 | Управление Punch List | P2 Core |
| 24 | Прогнозирование денежных потоков | P2 Core |
| 25 | Складской учёт со штрихкодами/QR | P2 Core |
| 26 | Отчёт М-29 (списание материалов) | P2 Core |
| 27 | Доска распределения ресурсов по проектам | P2 Core |
| 28 | Чек-листы контроля качества | P2 Core |
| 29 | Регистрация инцидентов и near-miss | P2 Core |
| 30 | Панель руководителя с KPI | P2 Core |

---

## Задача 19: Трекер сертификатов и лицензий

### 19.1 Описание

Модуль централизованного учёта всех допусков, сертификатов, лицензий и аттестаций работников, организаций и техники. В строительной отрасли России одно физическое лицо может иметь десятки различных удостоверений: аттестация Ростехнадзора (электробезопасность, работа на высоте, грузоподъёмные механизмы), квалификационные аттестаты НАКС (сварщики), удостоверения по ОТ (охрана труда), медицинские заключения по приказу Минздрава 29н, водительские удостоверения специальных категорий, допуски СРО на уровне организации. Просроченный сертификат крановщика или сварщика означает немедленную остановку работ при проверке Ростехнадзора или ГИТ — штраф от 130 000 руб. на одного работника (КоАП РФ ст. 5.27.1).

Система реализует матричное представление: по строкам — работники/организации/единицы техники, по столбцам — типы сертификатов. Ячейка окрашивается в зелёный (действует), жёлтый (истекает в течение N дней), красный (просрочен), серый (не требуется). Многоуровневая система оповещений: за 90/60/30/14/7/1 день до истечения — уведомление ответственному HR-специалисту, руководителю проекта, самому работнику (через Telegram/push). При наступлении просрочки — блокировка допуска к работе: TimesheetService проверяет флаг `certificationBlocked` при записи рабочего времени.

Существующая сущность `EmployeeCertificate` содержит базовые поля (name, number, issuedDate, expiryDate, issuedBy), но не покрывает: категории сертификатов с настраиваемой периодичностью, сертификаты организаций (субподрядчиков), сертификаты техники (ОСАГО, техосмотр, регистрация Ростехнадзора), массовый импорт, историю продлений, привязку к нормативным документам, многоуровневые оповещения. Задача расширяет модели и создаёт полноценную систему compliance-контроля.

### 19.2 Сущности БД

```sql
-- Java enum: CertificationHolderType
-- EMPLOYEE, ORGANIZATION, VEHICLE, EQUIPMENT

-- Java enum: CertificationAlertLevel
-- NONE, INFO, WARNING, CRITICAL, EXPIRED

-- Java enum: CertificationStatus
-- ACTIVE, EXPIRING_SOON, EXPIRED, REVOKED, SUSPENDED, NOT_REQUIRED

CREATE TABLE certification_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    holder_type         VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    -- EMPLOYEE, ORGANIZATION, VEHICLE
    category            VARCHAR(50) NOT NULL,
    -- SAFETY, QUALIFICATION, MEDICAL, REGULATORY, INSURANCE, SRO, VEHICLE_DOC
    issuing_authority   VARCHAR(500),
    -- "Ростехнадзор", "НАКС", "Медучреждение", "Минтранс"
    regulation_ref      VARCHAR(500),
    -- "Приказ Ростехнадзора от 29.01.2007 №37"
    default_validity_months INTEGER,
    -- Типовой срок действия в месяцах (NULL = бессрочный)
    renewal_lead_days   INTEGER DEFAULT 30,
    -- За сколько дней начинать процесс продления
    is_mandatory        BOOLEAN NOT NULL DEFAULT FALSE,
    -- Обязателен ли данный сертификат для допуска к работе
    blocks_work_on_expiry BOOLEAN NOT NULL DEFAULT FALSE,
    -- Блокирует ли просрочка допуск к работе
    applicable_positions JSONB DEFAULT '[]'::jsonb,
    -- ["crane_operator","welder","electrician","driver_c","driver_d"]
    applicable_work_types JSONB DEFAULT '[]'::jsonb,
    -- ["height_work","confined_space","hot_work","lifting"]
    alert_days          JSONB DEFAULT '[90,60,30,14,7,1]'::jsonb,
    -- Дни до истечения для оповещений
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          INTEGER DEFAULT 0,
    -- BaseEntity
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_cert_type_org_code UNIQUE (organization_id, code, deleted)
);

CREATE INDEX idx_cert_type_org ON certification_types(organization_id);
CREATE INDEX idx_cert_type_holder ON certification_types(holder_type);
CREATE INDEX idx_cert_type_category ON certification_types(category);
CREATE INDEX idx_cert_type_mandatory ON certification_types(is_mandatory) WHERE is_mandatory = TRUE;

CREATE TABLE certifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    certification_type_id   UUID NOT NULL REFERENCES certification_types(id),
    holder_type             VARCHAR(20) NOT NULL,
    -- EMPLOYEE, ORGANIZATION, VEHICLE
    holder_id               UUID NOT NULL,
    -- employee_id / subcontractor_id / vehicle_id
    holder_name             VARCHAR(500) NOT NULL,
    -- Денормализация для отчётов и фильтров
    certificate_number      VARCHAR(200),
    issued_date             DATE NOT NULL,
    expiry_date             DATE,
    -- NULL = бессрочный
    issued_by               VARCHAR(500),
    issuing_authority       VARCHAR(500),
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, EXPIRING_SOON, EXPIRED, REVOKED, SUSPENDED
    alert_level             VARCHAR(20) NOT NULL DEFAULT 'NONE',
    -- NONE, INFO, WARNING, CRITICAL, EXPIRED
    days_until_expiry       INTEGER,
    -- Вычисляемое поле, обновляется scheduled job
    scan_url                VARCHAR(1000),
    -- URL скана документа в MinIO
    scan_file_name          VARCHAR(500),
    scan_file_size          BIGINT,
    renewal_in_progress     BOOLEAN NOT NULL DEFAULT FALSE,
    renewal_started_at      TIMESTAMPTZ,
    renewal_responsible_id  UUID,
    previous_certification_id UUID,
    -- Ссылка на предыдущий (продлённый) сертификат
    project_id              UUID,
    -- Привязка к конкретному проекту (опционально)
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cert_org ON certifications(organization_id);
CREATE INDEX idx_cert_org_holder ON certifications(organization_id, holder_type, holder_id);
CREATE INDEX idx_cert_org_type ON certifications(organization_id, certification_type_id);
CREATE INDEX idx_cert_org_status ON certifications(organization_id, status);
CREATE INDEX idx_cert_org_alert ON certifications(organization_id, alert_level);
CREATE INDEX idx_cert_expiry ON certifications(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_cert_holder ON certifications(holder_id);
CREATE INDEX idx_cert_project ON certifications(project_id);
CREATE INDEX idx_cert_days_until ON certifications(days_until_expiry) WHERE days_until_expiry IS NOT NULL;

CREATE TABLE certification_alerts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    certification_id        UUID NOT NULL REFERENCES certifications(id),
    alert_level             VARCHAR(20) NOT NULL,
    -- INFO, WARNING, CRITICAL, EXPIRED
    days_until_expiry       INTEGER NOT NULL,
    sent_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_to_ids             JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- ["uuid1","uuid2"] — кому отправлено
    channel                 VARCHAR(20) NOT NULL,
    -- EMAIL, PUSH, TELEGRAM, IN_APP
    acknowledged            BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by_id      UUID,
    acknowledged_at         TIMESTAMPTZ,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cert_alert_org ON certification_alerts(organization_id);
CREATE INDEX idx_cert_alert_cert ON certification_alerts(certification_id);
CREATE INDEX idx_cert_alert_sent ON certification_alerts(sent_at);
CREATE INDEX idx_cert_alert_ack ON certification_alerts(acknowledged) WHERE acknowledged = FALSE;

CREATE TABLE certification_requirements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    certification_type_id   UUID NOT NULL REFERENCES certification_types(id),
    project_id              UUID,
    -- NULL = для всех проектов
    position_code           VARCHAR(50),
    -- "crane_operator", "welder_NAKS", "electrician_III"
    work_type_code          VARCHAR(50),
    -- "height_work", "hot_work", "confined_space"
    is_mandatory            BOOLEAN NOT NULL DEFAULT TRUE,
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cert_req_org ON certification_requirements(organization_id);
CREATE INDEX idx_cert_req_type ON certification_requirements(certification_type_id);
CREATE INDEX idx_cert_req_project ON certification_requirements(project_id);
CREATE INDEX idx_cert_req_position ON certification_requirements(position_code);

-- ALTER TABLE: расширение существующей employee_certificates
ALTER TABLE employee_certificates ADD COLUMN IF NOT EXISTS certification_type_id UUID REFERENCES certification_types(id);
ALTER TABLE employee_certificates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE employee_certificates ADD COLUMN IF NOT EXISTS scan_url VARCHAR(1000);
ALTER TABLE employee_certificates ADD COLUMN IF NOT EXISTS alert_level VARCHAR(20) DEFAULT 'NONE';
ALTER TABLE employee_certificates ADD COLUMN IF NOT EXISTS days_until_expiry INTEGER;
```

### 19.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/certification-types` | ADMIN, MANAGER, ENGINEER | Справочник типов сертификатов |
| POST | `/api/certification-types` | ADMIN, MANAGER | Создание типа сертификата |
| PUT | `/api/certification-types/{id}` | ADMIN, MANAGER | Обновление типа |
| DELETE | `/api/certification-types/{id}` | ADMIN | Soft-delete (только если нет привязанных сертификатов) |
| GET | `/api/certifications` | ADMIN, MANAGER, ENGINEER | Список сертификатов с фильтрами |
| GET | `/api/certifications/{id}` | ADMIN, MANAGER, ENGINEER | Детали сертификата |
| POST | `/api/certifications` | ADMIN, MANAGER, ENGINEER | Создание сертификата |
| PUT | `/api/certifications/{id}` | ADMIN, MANAGER, ENGINEER | Обновление сертификата |
| POST | `/api/certifications/{id}/renew` | ADMIN, MANAGER | Продление (создаёт новый, ссылается на предыдущий) |
| POST | `/api/certifications/{id}/revoke` | ADMIN | Аннулирование |
| POST | `/api/certifications/{id}/upload-scan` | ADMIN, MANAGER, ENGINEER | Загрузка скана (multipart) |
| DELETE | `/api/certifications/{id}` | ADMIN | Soft-delete |
| GET | `/api/certifications/matrix` | ADMIN, MANAGER, ENGINEER | Матрица сертификатов (holderType, projectId) |
| GET | `/api/certifications/expiring` | ADMIN, MANAGER | Истекающие сертификаты (days=30/60/90) |
| GET | `/api/certifications/expired` | ADMIN, MANAGER | Просроченные сертификаты |
| GET | `/api/certifications/holder/{holderType}/{holderId}` | ADMIN, MANAGER, ENGINEER | Все сертификаты держателя |
| GET | `/api/certifications/compliance/{projectId}` | ADMIN, MANAGER | Compliance-отчёт по проекту |
| POST | `/api/certifications/import` | ADMIN, MANAGER | Массовый импорт из Excel |
| GET | `/api/certifications/export` | ADMIN, MANAGER | Экспорт в Excel |
| GET | `/api/certification-alerts` | ADMIN, MANAGER | Лог оповещений |
| POST | `/api/certification-alerts/{id}/acknowledge` | ADMIN, MANAGER | Подтверждение оповещения |
| GET | `/api/certification-requirements` | ADMIN, MANAGER | Требования к сертификатам |
| POST | `/api/certification-requirements` | ADMIN, MANAGER | Создание требования |

**Request: CreateCertificationRequest**
```json
{
  "certificationTypeId": "uuid",
  "holderType": "EMPLOYEE",
  "holderId": "uuid",
  "certificateNumber": "НАКС-2026-04521",
  "issuedDate": "2025-06-15",
  "expiryDate": "2027-06-15",
  "issuedBy": "Национальное агентство контроля сварки",
  "projectId": "uuid",
  "notes": "Допуск к сварке конструкций из стали"
}
```

**Response: CertificationMatrixResponse**
```json
{
  "holders": [
    {
      "id": "uuid",
      "name": "Иванов Пётр Сергеевич",
      "holderType": "EMPLOYEE",
      "position": "Крановщик",
      "projectName": "ЖК Солнечный",
      "certifications": [
        {
          "certificationTypeId": "uuid",
          "certificationTypeName": "Ростехнадзор — Крановщик",
          "status": "ACTIVE",
          "alertLevel": "NONE",
          "expiryDate": "2027-03-15",
          "daysUntilExpiry": 391,
          "certificateNumber": "RTN-2024-12345"
        },
        {
          "certificationTypeId": "uuid",
          "certificationTypeName": "Медосмотр (Приказ 29н)",
          "status": "EXPIRING_SOON",
          "alertLevel": "WARNING",
          "expiryDate": "2026-04-01",
          "daysUntilExpiry": 42,
          "certificateNumber": null
        }
      ],
      "overallStatus": "WARNING",
      "missingCertifications": ["Электробезопасность (III группа)"]
    }
  ],
  "certificationTypes": [
    {
      "id": "uuid",
      "code": "RTN_CRANE",
      "name": "Ростехнадзор — Крановщик",
      "category": "REGULATORY",
      "isMandatory": true,
      "blocksWorkOnExpiry": true
    }
  ],
  "summary": {
    "totalHolders": 145,
    "fullyCompliant": 98,
    "withWarnings": 32,
    "withExpired": 15,
    "complianceRate": 67.6
  }
}
```

### 19.4 UI Экраны

1. **Матрица сертификатов** (`/certifications`) — основной экран. Таблица-матрица: строки = работники (группировка по проекту/должности), столбцы = типы сертификатов. Ячейки — цветовые индикаторы:
   - Зелёный кружок + дата = действует (>90 дней)
   - Жёлтый кружок + дата = истекает (30-90 дней)
   - Оранжевый кружок + дата = скоро истечёт (<30 дней)
   - Красный кружок + дата = просрочен
   - Серый прочерк = не требуется
   - Пустая ячейка с «+» = требуется, но отсутствует.
   Клик на ячейку — всплывающая карточка сертификата. Фильтры: проект, должность, тип держателя, статус (только проблемные). Переключатель «Работники / Организации / Техника».

2. **Дашборд compliance** (`/certifications/dashboard`) — 4 MetricCard: всего сертификатов, % compliance, просроченных (красный), истекающих в 30 дней (оранжевый). Pie-chart по статусам. Bar-chart: количество истекающих по месяцам (следующие 6 мес.). Список критических просрочек с кнопкой «Начать продление».

3. **Карточка сертификата** (`/certifications/:id`) — полная информация, скан документа (PDF-viewer/image), история продлений (timeline), история оповещений, кнопки «Продлить», «Загрузить скан», «Аннулировать».

4. **Форма создания/редактирования** (`/certifications/new`, `/certifications/:id/edit`) — выбор типа сертификата (с авто-заполнением полей из CertificationType), выбор держателя (search по работникам/организациям/технике), дата выдачи/истечения (авто-расчёт по `defaultValidityMonths`), загрузка скана (drag-and-drop).

5. **Справочник типов** (`/certifications/types`) — DataTable с CRUD. Каждый тип: код, название, категория, орган выдачи, период действия, обязательность, блокирует ли допуск.

6. **Расширение карточки сотрудника** (`/employees/:id` вкладка «Сертификаты») — вертикальный список всех сертификатов работника с цветовым статусом, сроком действия, кнопкой «+ Добавить».

7. **Массовый импорт** — Wizard: загрузка Excel → маппинг колонок → превью → подтверждение. Шаблон Excel для скачивания.

### 19.5 Бизнес-правила и валидации

1. **Автоматический расчёт статуса:** Scheduled job (каждые 6 часов) обновляет `daysUntilExpiry`, `alertLevel`, `status` для всех сертификатов. Формула: `daysUntilExpiry = DATEDIFF(expiryDate, CURRENT_DATE)`. Статус: >90 дней = ACTIVE, 30-90 = EXPIRING_SOON (alertLevel=INFO), 14-30 = EXPIRING_SOON (WARNING), 1-14 = EXPIRING_SOON (CRITICAL), <=0 = EXPIRED.
2. **Каскад оповещений:** при пересечении порога alert_days — создание CertificationAlert + отправка по каналам (email, push, Telegram). Каждый порог отправляется однократно (проверка по certification_alerts).
3. **Блокировка допуска:** если `certificationTypes.blocksWorkOnExpiry=true` и `certifications.status=EXPIRED` — в `Employee` устанавливается флаг `certificationBlocked=true`. `TimesheetService` проверяет этот флаг; при попытке записи рабочего времени — ошибка с указанием просроченного сертификата.
4. **Продление:** при вызове `/renew` создаётся новый сертификат с `previousCertificationId` = текущий. Старый сертификат получает статус EXPIRED (если срок вышел) или остаётся ACTIVE до истечения. Непрерывность цепочки отслеживается.
5. **Compliance-отчёт по проекту:** для каждого работника на проекте определяется набор обязательных сертификатов через `certification_requirements` (по position_code и work_type_code). Проверяется наличие ACTIVE сертификата каждого типа. Результат: % compliance = (count_compliant / count_total) * 100.
6. **Уникальность:** один работник не может иметь два ACTIVE сертификата одного типа одновременно (валидация на уровне сервиса).
7. **Нормативная база:** ГОСТ 12.0.004-2015; Приказ Ростехнадзора от 29.01.2007 N37; Приказ Минздрава от 28.01.2021 N29н; ТК РФ ст.212; Приказ Минтруда от 29.10.2021 N773н; ПБ 10-382-00 (крановое оборудование).

### 19.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр матрицы | + | + | + (свои проекты) | - | + |
| Справочник типов (CRUD) | + | + | - | - | - |
| Создание сертификата | + | + | + | - | - |
| Редактирование | + | + | + (свои) | - | - |
| Продление | + | + | - | - | - |
| Аннулирование | + | - | - | - | - |
| Загрузка скана | + | + | + | - | - |
| Импорт/Экспорт | + | + | - | - | - |
| Compliance-отчёт | + | + | + (свой проект) | - | + |
| Дашборд | + | + | + | - | + |
| Управление оповещениями | + | + | - | - | - |
| Удаление | + | - | - | - | - |

### 19.7 Крайние случаи

1. **Бессрочный сертификат** (expiryDate=NULL) — не участвует в расчёте истечения, всегда ACTIVE. Пример: некоторые удостоверения по ОТ до отмены ПП 1/29.
2. **Работник уволен** — сертификаты остаются в системе с пометкой, не участвуют в compliance-расчёте по проекту (фильтр по активным работникам).
3. **Субподрядчик в BLACKLISTED** — его организационные сертификаты подсвечиваются серым с надписью «Приостановлен».
4. **Массовый импорт дублей** — при импорте из Excel система проверяет пару (holderType+holderId+certificationTypeId). При обнаружении дубля — запись отмечается как конфликтная в preview, пользователь решает: обновить / пропустить / создать новый.
5. **Изменение типа сертификата** (validity_months) — не влияет ретроактивно на существующие сертификаты, только на новые.
6. **Сертификат техники (Vehicle)** — ОСАГО, техосмотр, регистрация Ростехнадзора. При просрочке ОСАГО — Vehicle переводится в UNAVAILABLE до обновления.
7. **Одновременное продление несколькими пользователями** — optimistic locking через @Version.

### 19.8 UX Бенчмарк

**Лучший в классе:** InEight (Compliance Management) — матричный вид с цветовой индикацией, multi-level alerts. Procore (Workforce Management) — сертификаты привязаны к trade, автоматические предупреждения. Для российского рынка: Охрана 24 — журналы допусков по ОТ с привязкой к ГОСТ 12.0.004-2015; 1С:ЗУП — ведение удостоверений сотрудников с напоминаниями; SafetyCulture/iAuditor — compliance checklists с фотофиксацией.

---

## Задача 20: Реестр дефектов с фото-документацией

### 20.1 Описание

Центральный реестр дефектов строительно-монтажных работ с привязкой к местоположению на чертеже/плане, фотодокументированием, классификацией по степени серьёзности, отслеживанием устранения и верификацией результата. Дефект — это отклонение от проектной документации, нормативных требований или стандартов качества, выявленное в ходе инспекции, авторского надзора, строительного контроля или приёмки работ.

Каждый дефект проходит жизненный цикл: обнаружение (OPEN) → назначение ответственного (ASSIGNED) → устранение в работе (IN_PROGRESS) → устранён (FIXED) → верификация (VERIFIED) / возврат (REOPENED) → закрыт (CLOSED). На каждом этапе фиксируются: фотографии (до и после), комментарии, даты, ответственные. Система автоматически рассчитывает метрики: среднее время устранения, % просроченных, распределение по серьёзности и подрядчикам.

Критически важна мобильная функциональность: инспектор на площадке открывает чертёж этажа/секции, тапает на точку обнаружения дефекта (pin-on-plan), делает фото с камеры устройства, заполняет описание голосом или текстом, назначает ответственного субподрядчика и дедлайн. Всё за 30-60 секунд. Интеграция с модулями: quality (QualityCheck), punchlist (PunchItem), pto (HiddenWorkAct — дефект может блокировать подписание АОСР), safety (если дефект угрожает безопасности).

### 20.2 Сущности БД

```sql
-- Java enum: DefectSeverity
-- COSMETIC, MINOR, MAJOR, CRITICAL, SAFETY_HAZARD

-- Java enum: DefectStatus
-- OPEN, ASSIGNED, IN_PROGRESS, FIXED, VERIFIED, CLOSED, REOPENED, CANCELLED

-- Java enum: DefectCategory
-- STRUCTURAL, ARCHITECTURAL, MEP_ELECTRICAL, MEP_PLUMBING, MEP_HVAC,
-- FIRE_PROTECTION, WATERPROOFING, FINISHING, EXTERIOR, LANDSCAPING, OTHER

-- Java enum: DefectSource
-- INSPECTION, AUTHOR_SUPERVISION, OWNER_REVIEW, CONTRACTOR_SELF_CHECK,
-- COMMISSIONING, WARRANTY, REGULATORY

CREATE TABLE defects (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    project_id              UUID NOT NULL,
    number                  VARCHAR(50) NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    description             TEXT NOT NULL,
    location_description    VARCHAR(500),
    -- "Блок А, этаж 3, секция 2, ось В-Г / 4-5"
    location_floor          VARCHAR(50),
    location_section        VARCHAR(50),
    location_room           VARCHAR(100),
    pin_x                   NUMERIC(10,4),
    -- Координата X на чертеже (0.0-1.0 от ширины)
    pin_y                   NUMERIC(10,4),
    -- Координата Y на чертеже (0.0-1.0 от высоты)
    drawing_id              UUID,
    -- ID чертежа/плана для pin-on-plan
    drawing_revision        VARCHAR(50),
    severity                VARCHAR(20) NOT NULL DEFAULT 'MINOR',
    category                VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    source                  VARCHAR(30) NOT NULL DEFAULT 'INSPECTION',
    status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    detected_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    detected_by_id          UUID NOT NULL,
    detected_by_name        VARCHAR(255),
    assigned_to_company_id  UUID,
    -- Субподрядчик, ответственный за устранение
    assigned_to_company_name VARCHAR(500),
    assigned_to_person_id   UUID,
    assigned_to_person_name VARCHAR(255),
    assigned_date           DATE,
    fix_deadline            DATE,
    fixed_date              DATE,
    fixed_by_id             UUID,
    fixed_by_name           VARCHAR(255),
    verified_by_id          UUID,
    verified_by_name        VARCHAR(255),
    verified_date           DATE,
    closed_date             DATE,
    days_open               INTEGER,
    -- Вычисляемое: CURRENT_DATE - detected_date (для open) или closed_date - detected_date
    is_overdue              BOOLEAN NOT NULL DEFAULT FALSE,
    quality_check_id        UUID,
    -- Связь с QualityCheck
    punch_item_id           UUID,
    -- Связь с PunchItem
    hidden_work_act_id      UUID,
    -- Связь с HiddenWorkAct (блокирует подписание)
    wbs_node_id             UUID,
    -- Привязка к элементу WBS
    cost_of_repair          NUMERIC(18,2),
    -- Стоимость устранения (заполняется подрядчиком)
    root_cause              TEXT,
    corrective_action_plan  TEXT,
    tags                    JSONB DEFAULT '[]'::jsonb,
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_defect_org_number UNIQUE (organization_id, number, deleted)
);

CREATE INDEX idx_defect_org ON defects(organization_id);
CREATE INDEX idx_defect_org_project ON defects(organization_id, project_id);
CREATE INDEX idx_defect_org_status ON defects(organization_id, status);
CREATE INDEX idx_defect_org_severity ON defects(organization_id, severity);
CREATE INDEX idx_defect_project_status ON defects(project_id, status);
CREATE INDEX idx_defect_assigned_company ON defects(assigned_to_company_id);
CREATE INDEX idx_defect_deadline ON defects(fix_deadline) WHERE status NOT IN ('CLOSED','CANCELLED','VERIFIED');
CREATE INDEX idx_defect_overdue ON defects(is_overdue) WHERE is_overdue = TRUE;
CREATE INDEX idx_defect_drawing ON defects(drawing_id);
CREATE INDEX idx_defect_quality_check ON defects(quality_check_id);
CREATE INDEX idx_defect_punch ON defects(punch_item_id);
CREATE INDEX idx_defect_hwa ON defects(hidden_work_act_id);
CREATE INDEX idx_defect_wbs ON defects(wbs_node_id);
CREATE INDEX idx_defect_detected_date ON defects(detected_date);

CREATE TABLE defect_photos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_id               UUID NOT NULL REFERENCES defects(id),
    photo_url               VARCHAR(1000) NOT NULL,
    thumbnail_url           VARCHAR(1000),
    file_name               VARCHAR(500),
    file_size               BIGINT,
    photo_type              VARCHAR(20) NOT NULL DEFAULT 'BEFORE',
    -- BEFORE (при обнаружении), AFTER (после устранения), PROCESS (в процессе)
    taken_at                TIMESTAMPTZ,
    taken_by_id             UUID,
    taken_by_name           VARCHAR(255),
    gps_latitude            NUMERIC(10,7),
    gps_longitude           NUMERIC(10,7),
    caption                 VARCHAR(500),
    sort_order              INTEGER DEFAULT 0,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_defect_photo_defect ON defect_photos(defect_id);
CREATE INDEX idx_defect_photo_type ON defect_photos(photo_type);

CREATE TABLE defect_comments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_id               UUID NOT NULL REFERENCES defects(id),
    author_id               UUID NOT NULL,
    author_name             VARCHAR(255) NOT NULL,
    content                 TEXT NOT NULL,
    status_change_from      VARCHAR(20),
    status_change_to        VARCHAR(20),
    -- Если комментарий сопровождает смену статуса
    attachment_urls          JSONB DEFAULT '[]'::jsonb,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_defect_comment_defect ON defect_comments(defect_id);
CREATE INDEX idx_defect_comment_author ON defect_comments(author_id);
```

### 20.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/defects` | ADMIN, MANAGER, ENGINEER | Список дефектов с фильтрами (projectId, status, severity, assignedCompanyId, dateRange, isOverdue) |
| GET | `/api/defects/{id}` | ADMIN, MANAGER, ENGINEER | Детали дефекта с фото и комментариями |
| POST | `/api/defects` | ADMIN, MANAGER, ENGINEER | Создание дефекта |
| PUT | `/api/defects/{id}` | ADMIN, MANAGER, ENGINEER | Обновление (только OPEN/ASSIGNED/REOPENED) |
| POST | `/api/defects/{id}/assign` | ADMIN, MANAGER | Назначение ответственного |
| POST | `/api/defects/{id}/start-fix` | ADMIN, MANAGER, ENGINEER | Начать устранение (ASSIGNED → IN_PROGRESS) |
| POST | `/api/defects/{id}/mark-fixed` | ADMIN, MANAGER, ENGINEER | Отметить как устранённый (IN_PROGRESS → FIXED) |
| POST | `/api/defects/{id}/verify` | ADMIN, MANAGER | Верификация (FIXED → VERIFIED) |
| POST | `/api/defects/{id}/reopen` | ADMIN, MANAGER | Вернуть в работу (FIXED/VERIFIED → REOPENED) |
| POST | `/api/defects/{id}/close` | ADMIN, MANAGER | Закрыть (VERIFIED → CLOSED) |
| POST | `/api/defects/{id}/cancel` | ADMIN, MANAGER | Отменить (дубль или ошибочная запись) |
| POST | `/api/defects/{id}/photos` | ADMIN, MANAGER, ENGINEER | Загрузка фото (multipart, до 10 за раз) |
| DELETE | `/api/defects/{id}/photos/{photoId}` | ADMIN, MANAGER | Удаление фото |
| POST | `/api/defects/{id}/comments` | ADMIN, MANAGER, ENGINEER | Добавить комментарий |
| GET | `/api/defects/stats` | ADMIN, MANAGER | Статистика по проекту/подрядчику |
| GET | `/api/defects/drawing/{drawingId}` | ADMIN, MANAGER, ENGINEER | Все дефекты на чертеже (для pin-overlay) |
| GET | `/api/defects/export` | ADMIN, MANAGER | Экспорт в Excel/PDF |
| GET | `/api/defects/report/{projectId}` | ADMIN, MANAGER | Сводный отчёт по проекту |
| DELETE | `/api/defects/{id}` | ADMIN | Soft-delete (только OPEN/CANCELLED) |

**Request: CreateDefectRequest**
```json
{
  "projectId": "uuid",
  "title": "Трещина в монолитном перекрытии",
  "description": "Обнаружена продольная трещина шириной 0.5мм в монолитном перекрытии над 3-м этажом, длина ~2м",
  "locationDescription": "Блок А, этаж 3, секция 2, ось В-Г / 4-5",
  "locationFloor": "3",
  "locationSection": "Секция 2",
  "severity": "MAJOR",
  "category": "STRUCTURAL",
  "source": "INSPECTION",
  "drawingId": "uuid",
  "pinX": 0.4532,
  "pinY": 0.6781,
  "fixDeadline": "2026-03-15",
  "assignedToCompanyId": "uuid",
  "assignedToPersonId": "uuid",
  "wbsNodeId": "uuid",
  "tags": ["монолит", "перекрытие", "трещина"]
}
```

**Response: DefectStatsResponse**
```json
{
  "projectId": "uuid",
  "projectName": "ЖК Солнечный",
  "period": { "from": "2026-01-01", "to": "2026-02-18" },
  "totalDefects": 247,
  "openDefects": 42,
  "overdueDefects": 8,
  "averageResolutionDays": 12.3,
  "bySeverity": {
    "COSMETIC": 85, "MINOR": 102, "MAJOR": 41, "CRITICAL": 16, "SAFETY_HAZARD": 3
  },
  "byStatus": {
    "OPEN": 18, "ASSIGNED": 12, "IN_PROGRESS": 12, "FIXED": 24, "VERIFIED": 35, "CLOSED": 146
  },
  "byCompany": [
    { "companyId": "uuid", "companyName": "ООО СтройМонтаж", "total": 89, "open": 12, "overdue": 3, "avgDays": 14.1 },
    { "companyId": "uuid", "companyName": "ООО Электромонтаж", "total": 58, "open": 8, "overdue": 2, "avgDays": 9.7 }
  ],
  "byCategory": {
    "STRUCTURAL": 41, "MEP_ELECTRICAL": 58, "FINISHING": 85, "WATERPROOFING": 22
  },
  "trendByMonth": [
    { "month": "2026-01", "opened": 45, "closed": 38, "netOpen": 7 },
    { "month": "2026-02", "opened": 32, "closed": 41, "netOpen": -9 }
  ]
}
```

### 20.4 UI Экраны

1. **Реестр дефектов** (`/defects`) — DataTable с колонками: номер, проект, название (truncated), серьёзность (цветной бейдж: красный=CRITICAL/SAFETY, оранжевый=MAJOR, жёлтый=MINOR, серый=COSMETIC), статус, категория, ответственный подрядчик, дедлайн (красный если просрочен), миниатюра первого фото. Фильтры: проект, статус, серьёзность, категория, подрядчик, is_overdue, период. Переключатель «Список / Канбан / Чертёж».

2. **Канбан-доска** (`/defects?view=kanban`) — колонки по статусам (OPEN → ASSIGNED → IN_PROGRESS → FIXED → VERIFIED → CLOSED). Карточки дефектов с цветовой полосой серьёзности. Drag-and-drop для смены статуса. Счётчик в заголовке каждой колонки.

3. **Вид на чертеже** (`/defects?view=drawing&drawingId=uuid`) — чертёж этажа/секции с наложенными pin-маркерами дефектов. Цвет маркера = серьёзность. При наведении — tooltip с номером, статусом, описанием. Клик — открытие карточки дефекта.

4. **Карточка дефекта** (`/defects/:id`) — Заголовок: номер + статус-бейдж + серьёзность. Галерея фото (BEFORE/AFTER с переключателем, lightbox). Информация: описание, расположение (с мини-картой на чертеже), категория, ответственный, дедлайн, стоимость устранения. Timeline: все действия с датами и авторами. Форма комментария. Кнопки действий (зависят от текущего статуса и роли пользователя).

5. **Мобильная форма быстрого создания** — открыть чертёж → тап на точку (pin) → камера (фото) → описание (голос/текст) → серьёзность (3 тапа) → назначить подрядчика (select) → срок → «Создать». Цель: 30-60 секунд.

6. **Дашборд качества** (`/defects/dashboard`) — MetricCards: открытые, просроченные, среднее время устранения, % compliance. Pie-chart по серьёзности. Bar-chart: рейтинг подрядчиков по количеству дефектов. Trend-chart: открытые vs закрытые по месяцам.

7. **Отчёт подрядчику** — PDF/Excel с перечнем открытых дефектов подрядчика, фотографиями, дедлайнами. Одним кликом формируется и отправляется по email.

### 20.5 Бизнес-правила и валидации

1. **Автонумерация:** формат `DEF-{ProjectCode}-{NNNN}`, инкремент в пределах проекта. Пример: `DEF-SOL-0042`.
2. **Машина состояний:** OPEN → ASSIGNED (назначен ответственный) → IN_PROGRESS (начато устранение) → FIXED (устранён, ожидает проверки) → VERIFIED (проверен инспектором) → CLOSED. Возвраты: FIXED → REOPENED, VERIFIED → REOPENED. REOPENED → ASSIGNED/IN_PROGRESS.
3. **Фото обязательно:** при создании дефекта с severity >= MAJOR — минимум 1 фото обязательно. При переводе в FIXED — минимум 1 фото типа AFTER обязательно.
4. **Дедлайн обязателен** для severity MAJOR и выше. Автоматическое значение: COSMETIC — +30 дней, MINOR — +14 дней, MAJOR — +7 дней, CRITICAL — +3 дня, SAFETY_HAZARD — +1 день.
5. **Оповещения при просрочке:** is_overdue = (status NOT IN ('CLOSED','CANCELLED','VERIFIED') AND fix_deadline < CURRENT_DATE). Ежедневный cron обновляет `days_open` и `is_overdue`. При наступлении просрочки — push ответственному + его руководителю.
6. **Связь с АОСР:** если defect привязан к hidden_work_act_id — акт скрытых работ не может быть подписан (HiddenWorkActService проверяет наличие незакрытых дефектов).
7. **Стоимость устранения:** заполняется подрядчиком. Если cost_of_repair > порог (настраиваемый, по умолчанию 100 000 руб.) — требуется одобрение MANAGER.
8. **GPS-координаты фото:** при загрузке фото с мобильного — автоматическое извлечение EXIF GPS-данных. Проверка: координаты должны быть в пределах геозоны проекта (если настроена).
9. **Нормативная база:** ISO 9001:2015 (п.8.7 — управление несоответствующими результатами); СП 48.13330.2019; ГрК РФ ст.53 (строительный контроль); ГОСТ 31937-2011 (обследование зданий).

### 20.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр реестра | + | + | + (свои проекты) | - | + |
| Создание дефекта | + | + | + | - | - |
| Редактирование | + | + | + (свои, до FIXED) | - | - |
| Назначение ответственного | + | + | - | - | - |
| Смена статуса (fix/verify) | + | + | + (fix только) | - | - |
| Верификация | + | + | - | - | - |
| Возврат в работу | + | + | - | - | - |
| Закрытие | + | + | - | - | - |
| Загрузка фото | + | + | + | - | - |
| Комментарии | + | + | + | - | - |
| Удаление | + | - | - | - | - |
| Отчёты/экспорт | + | + | + | - | + |

### 20.7 Крайние случаи

1. **Чертёж заменён новой ревизией** — дефекты, привязанные к старому чертежу, сохраняют `drawingRevision`. При просмотре на новом чертеже — маркеры отображаются с пометкой «Ревизия чертежа изменена, положение может быть неточным».
2. **Субподрядчик удалён/заблокирован** — дефект сохраняет `assigned_to_company_name` (денормализация). В интерфейсе — предупреждение «Подрядчик заблокирован».
3. **Дефект без чертежа** — допускается. Pin-on-plan недоступен, используется только текстовое описание расположения.
4. **Массовое создание дефектов** из инспекции — кнопка «Создать дефект» на карточке QualityCheck с предзаполнением: проект, чертёж, инспектор.
5. **Конкурентное обновление** — два инспектора одновременно редактируют дефект. Optimistic locking (version). Первый сохраняет, второй получает 409 Conflict.
6. **Большое количество фото** — максимум 20 фото на дефект. Сжатие на клиенте до 2048px по длинной стороне перед загрузкой. WebP-формат для экономии трафика.
7. **Offline-создание** — дефект создаётся в IndexedDB с фото в виде blob. При восстановлении связи — синхронизация через offlineQueue.

### 20.8 UX Бенчмарк

**Лучший в классе:** PlanRadar — pin-on-plan с фото, кастомные поля, offline, API. Fieldwire — задачи на чертежах с фильтрами, лучший offline. Procore (Observations) — привязка к чертежам, камера, severity classification. Для российского рынка: Адепт (модуль «Замечания») — реестр с привязкой к ИД; ЦУС — QA/QC с фотофиксацией.

---

## Задача 21: Акты скрытых работ (АОСР)

### 21.1 Описание

Акт освидетельствования скрытых работ (АОСР) — обязательный документ исполнительной документации, оформляемый по форме, установленной РД-11-02-2006 (Приказ Ростехнадзора от 26.12.2006 N1129) и Приказом Минстроя от 02.12.2022 N1026/пр. АОСР составляется на все виды работ, результат которых будет скрыт последующими работами: армирование фундаментов, гидроизоляция, устройство оснований, прокладка скрытых коммуникаций, монтаж закладных деталей и т.д. Без подписанного АОСР запрещается выполнять последующие работы, закрывающие скрытые конструкции.

Существующая сущность `HiddenWorkAct` содержит базовые поля (projectId, date, workDescription, location, inspectorId, contractorId, status, photoIds, notes), но не покрывает: структурированные поля по форме РД-11-02-2006, уведомления участников за 3 рабочих дня, электронные подписи нескольких сторон (заказчик, генподрядчик, проектировщик, авторский надзор), нормативные ссылки, связь с WBS/КС-6а, генерацию печатной формы PDF. Задача расширяет сущность до полного соответствия нормативным требованиям.

АОСР подписывается представителями: (1) застройщика/заказчика, (2) лица, осуществляющего строительство (генподрядчик/субподрядчик), (3) лица, осуществляющего подготовку проектной документации (авторский надзор), (4) представителя Стройнадзора (для особо опасных объектов). Уведомление о готовности к освидетельствованию направляется всем участникам не позднее чем за 3 рабочих дня.

### 21.2 Сущности БД

```sql
-- Расширение существующей таблицы hidden_work_acts

ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS number VARCHAR(50);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS act_date DATE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS object_name VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS object_address TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS developer_name VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS developer_representative VARCHAR(255);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS contractor_representative VARCHAR(255);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS designer_name VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS designer_representative VARCHAR(255);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(500);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS supervisor_representative VARCHAR(255);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS other_participants JSONB DEFAULT '[]'::jsonb;

ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS work_name VARCHAR(1000);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS work_start_date DATE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS work_end_date DATE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS project_doc_refs TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS regulatory_refs TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS material_docs TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS materials_used TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS deviations TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS conclusion TEXT;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS permission_to_proceed BOOLEAN DEFAULT FALSE;

ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS notification_date DATE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS scheduled_inspection_date DATE;

ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS wbs_node_id UUID;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS ks6_record_id UUID;
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS building_permit_number VARCHAR(100);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS positive_expertise_number VARCHAR(100);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS sro_number_contractor VARCHAR(100);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS sro_number_designer VARCHAR(100);

ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(1000);
ALTER TABLE hidden_work_acts ADD COLUMN IF NOT EXISTS template_version VARCHAR(20) DEFAULT 'RD-11-02-2006';

-- Новая таблица: подписи участников АОСР
CREATE TABLE hidden_work_act_signatures (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id                  UUID NOT NULL REFERENCES hidden_work_acts(id),
    signer_role             VARCHAR(30) NOT NULL,
    -- DEVELOPER, CONTRACTOR, DESIGNER, SUPERVISOR, OTHER
    signer_name             VARCHAR(255) NOT NULL,
    signer_position         VARCHAR(255),
    signer_organization     VARCHAR(500),
    signed                  BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at               TIMESTAMPTZ,
    signature_url           VARCHAR(1000),
    -- URL рукописной подписи или КЭП
    kep_certificate_id      UUID,
    -- Ссылка на сертификат КЭП (если электронная подпись)
    comment                 TEXT,
    sort_order              INTEGER DEFAULT 0,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_hwa_sig_act ON hidden_work_act_signatures(act_id);
CREATE INDEX idx_hwa_sig_role ON hidden_work_act_signatures(signer_role);
CREATE INDEX idx_hwa_sig_signed ON hidden_work_act_signatures(signed);

-- Таблица: уведомления об освидетельствовании
CREATE TABLE hidden_work_act_notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id                  UUID NOT NULL REFERENCES hidden_work_acts(id),
    recipient_role          VARCHAR(30) NOT NULL,
    recipient_name          VARCHAR(255) NOT NULL,
    recipient_email         VARCHAR(255),
    recipient_phone         VARCHAR(20),
    notification_date       DATE NOT NULL,
    scheduled_date          DATE NOT NULL,
    -- Дата планируемого освидетельствования
    sent                    BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at                 TIMESTAMPTZ,
    channel                 VARCHAR(20),
    -- EMAIL, SMS, TELEGRAM, IN_APP
    response                VARCHAR(20),
    -- ACCEPTED, DECLINED, NO_RESPONSE
    response_at             TIMESTAMPTZ,
    response_comment        TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_hwa_notif_act ON hidden_work_act_notifications(act_id);
CREATE INDEX idx_hwa_notif_sent ON hidden_work_act_notifications(sent);
CREATE INDEX idx_hwa_notif_scheduled ON hidden_work_act_notifications(scheduled_date);

-- Шаблоны АОСР по типам работ
CREATE TABLE hidden_work_act_templates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    work_type_code          VARCHAR(50) NOT NULL,
    work_type_name          VARCHAR(500) NOT NULL,
    description_template    TEXT,
    -- Шаблон описания с плейсхолдерами {{объём}}, {{материал}}, {{отметка}}
    regulatory_refs         TEXT,
    -- Типовые ссылки на нормативы для данного вида работ
    project_doc_refs        TEXT,
    required_materials_docs TEXT,
    -- Какие документы на материалы требуются
    checklist_items         JSONB DEFAULT '[]'::jsonb,
    -- ["Проверка армирования","Проверка опалубки","Геодезическая съёмка"]
    required_photo_count    INTEGER DEFAULT 3,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_hwa_tmpl_org ON hidden_work_act_templates(organization_id);
CREATE INDEX idx_hwa_tmpl_type ON hidden_work_act_templates(work_type_code);

-- Дополнительные индексы для hidden_work_acts
CREATE INDEX idx_hwa_org ON hidden_work_acts(organization_id);
CREATE INDEX idx_hwa_org_project ON hidden_work_acts(organization_id, project_id);
CREATE INDEX idx_hwa_number ON hidden_work_acts(organization_id, number);
CREATE INDEX idx_hwa_wbs ON hidden_work_acts(wbs_node_id);
CREATE INDEX idx_hwa_scheduled ON hidden_work_acts(scheduled_inspection_date);
CREATE INDEX idx_hwa_notification ON hidden_work_acts(notification_sent, notification_date);
```

### 21.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/hidden-work-acts` | ADMIN, MANAGER, ENGINEER | Список АОСР с фильтрами (projectId, status, dateRange, wbsNodeId) |
| GET | `/api/hidden-work-acts/{id}` | ADMIN, MANAGER, ENGINEER | Детали АОСР с подписями и уведомлениями |
| POST | `/api/hidden-work-acts` | ADMIN, MANAGER, ENGINEER | Создание АОСР (статус DRAFT) |
| PUT | `/api/hidden-work-acts/{id}` | ADMIN, MANAGER, ENGINEER | Редактирование (только DRAFT) |
| POST | `/api/hidden-work-acts/{id}/send-notifications` | ADMIN, MANAGER | Отправка уведомлений участникам (за 3 рабочих дня) |
| POST | `/api/hidden-work-acts/{id}/submit` | ADMIN, MANAGER, ENGINEER | Отправка на подписание (DRAFT → PENDING_SIGNATURES) |
| POST | `/api/hidden-work-acts/{id}/sign` | ADMIN, MANAGER, ENGINEER | Подписание (текущим пользователем по его роли) |
| POST | `/api/hidden-work-acts/{id}/sign-kep` | ADMIN, MANAGER, ENGINEER | Подписание КЭП |
| POST | `/api/hidden-work-acts/{id}/reject` | ADMIN, MANAGER | Отклонение с замечаниями (→ DRAFT) |
| POST | `/api/hidden-work-acts/{id}/approve` | ADMIN, MANAGER | Финальное утверждение (все подписи собраны → APPROVED) |
| POST | `/api/hidden-work-acts/{id}/photos` | ADMIN, MANAGER, ENGINEER | Загрузка фото (multipart) |
| GET | `/api/hidden-work-acts/{id}/print` | ADMIN, MANAGER, ENGINEER | Генерация PDF по форме РД-11-02-2006 |
| GET | `/api/hidden-work-acts/{id}/print-notification` | ADMIN, MANAGER, ENGINEER | Генерация уведомления PDF |
| POST | `/api/hidden-work-acts/from-template` | ADMIN, MANAGER, ENGINEER | Создание из шаблона |
| GET | `/api/hidden-work-acts/pending-signatures` | ADMIN, MANAGER, ENGINEER | АОСР, ожидающие моей подписи |
| GET | `/api/hidden-work-acts/stats/{projectId}` | ADMIN, MANAGER | Статистика по проекту |
| GET | `/api/hidden-work-act-templates` | ADMIN, MANAGER, ENGINEER | Шаблоны АОСР |
| POST | `/api/hidden-work-act-templates` | ADMIN, MANAGER | Создание шаблона |
| PUT | `/api/hidden-work-act-templates/{id}` | ADMIN, MANAGER | Обновление шаблона |
| GET | `/api/hidden-work-acts/wbs/{wbsNodeId}` | ADMIN, MANAGER, ENGINEER | АОСР по элементу WBS |
| DELETE | `/api/hidden-work-acts/{id}` | ADMIN | Soft-delete (только DRAFT) |

**Request: CreateHiddenWorkActRequest**
```json
{
  "projectId": "uuid",
  "templateId": "uuid",
  "workName": "Устройство монолитного перекрытия на отм. +12.600",
  "workDescription": "Выполнено армирование и бетонирование монолитного ж/б перекрытия толщ. 200мм на отм. +12.600 по осям А-Д/1-6",
  "location": "Блок А, этаж 4, оси А-Д/1-6",
  "workStartDate": "2026-02-10",
  "workEndDate": "2026-02-17",
  "projectDocRefs": "Проект ЖК Солнечный. Лист КЖ-14, КЖ-15. Рабочая документация 2025-КЖ",
  "regulatoryRefs": "СП 70.13330.2012 «Несущие и ограждающие конструкции», СП 63.13330.2018 «Бетонные и ж/б конструкции»",
  "materialDocs": "Паспорт качества бетона М400 №2345 от 12.02.2026; Сертификат на арматуру А500С №567 от 01.01.2026",
  "materialsUsed": "Бетон М400 — 45 м3; Арматура А500С d12 — 3.2 т; Арматура А500С d16 — 2.1 т",
  "scheduledInspectionDate": "2026-02-21",
  "wbsNodeId": "uuid",
  "signers": [
    { "signerRole": "DEVELOPER", "signerName": "Петров А.С.", "signerPosition": "Начальник стройконтроля", "signerOrganization": "ООО Заказчик" },
    { "signerRole": "CONTRACTOR", "signerName": "Иванов П.И.", "signerPosition": "Прораб", "signerOrganization": "ООО Генподрядчик" },
    { "signerRole": "DESIGNER", "signerName": "Сидоров К.В.", "signerPosition": "ГИП", "signerOrganization": "ООО Проектинст" }
  ]
}
```

### 21.4 UI Экраны

1. **Реестр АОСР** (`/pto/hidden-work-acts`) — DataTable: номер, дата, наименование работ, расположение, статус (DRAFT/PENDING_SIGNATURES/APPROVED/REJECTED), проект, количество подписей (3/4), WBS-элемент. Фильтры: проект, статус, период, WBS. Быстрый фильтр «Ожидающие моей подписи» (badge с числом).

2. **Форма создания/редактирования** (`/pto/hidden-work-acts/new`, `/pto/hidden-work-acts/:id/edit`) — многошаговый wizard:
   - Шаг 1: Выбор проекта и шаблона → авто-заполнение полей (объект, адрес, разрешение на строительство, экспертиза, СРО).
   - Шаг 2: Описание работ — наименование, период выполнения, описание, расположение, ссылки на проектную документацию и нормативы.
   - Шаг 3: Материалы — документы на материалы, перечень использованных материалов с объёмами.
   - Шаг 4: Участники — добавление подписантов (роль, ФИО, должность, организация). Предзаполнение из карточки проекта.
   - Шаг 5: Фото — загрузка фотографий скрытых работ (минимум 3). Drag-and-drop. Подписи к фото.
   - Шаг 6: Предпросмотр — PDF-preview по форме РД-11-02-2006. Кнопки «Сохранить черновик» / «Отправить уведомления» / «Отправить на подписание».

3. **Карточка АОСР** (`/pto/hidden-work-acts/:id`) — полная информация по форме РД-11-02-2006. Блок подписей: список участников со статусами (подписал / ожидает / отклонил). Кнопка «Подписать» (для текущего пользователя, если его роль требует подписи). История уведомлений. Галерея фото. Связанные документы (дефекты, КС-6а запись). Кнопки: «Печать PDF», «Отправить уведомление», «Подписать КЭП».

4. **Экран подписания** (`/pto/hidden-work-acts/:id/sign`) — полноэкранный preview PDF + блок подписи: рукописная подпись (canvas) или КЭП (выбор сертификата). Поле комментария. Кнопки «Подписать» / «Отклонить с замечаниями».

5. **Шаблоны АОСР** (`/pto/hidden-work-act-templates`) — DataTable с CRUD: тип работ, шаблон описания, нормативные ссылки, чек-лист проверки.

6. **Интеграция с WBS** — на странице WBS-дерева (`/planning/wbs`) у каждого элемента — иконка «АОСР» с числом актов. Клик — фильтрованный реестр. Визуальная индикация: зелёный = все АОСР подписаны, жёлтый = есть ожидающие, красный = отсутствуют обязательные.

7. **Печатная форма** — PDF по форме РД-11-02-2006: заголовок «АКТ ОСВИДЕТЕЛЬСТВОВАНИЯ СКРЫТЫХ РАБОТ №___», реквизиты объекта, участники, описание, ссылки, вывод, подписи. Формат А4, portrait.

### 21.5 Бизнес-правила и валидации

1. **Автонумерация:** формат `АОСР-{ProjectCode}-{NNNN}`, инкремент в пределах проекта. Пример: `АОСР-СОЛ-0128`.
2. **Уведомление за 3 рабочих дня:** при установке `scheduledInspectionDate` — автоматическая отправка уведомления всем участникам. Расчёт: 3 рабочих дня назад от даты освидетельствования (учёт выходных и праздников по производственному календарю). Если дата создания АОСР < 3 рабочих дней до освидетельствования — предупреждение «Недостаточно времени для уведомления, требуется согласие всех сторон».
3. **Обязательные подписи:** минимум 2 подписи (CONTRACTOR + DEVELOPER). Для объектов капитального строительства, подлежащих государственному строительному надзору — обязательна подпись SUPERVISOR. АОСР не может перейти в APPROVED без всех обязательных подписей.
4. **Блокировка последующих работ:** если для элемента WBS не подписан АОСР — система предупреждает при попытке начать следующий элемент WBS (warning, не блокировка). Если настроено `strict_mode` на уровне проекта — блокировка.
5. **Связь с дефектами:** если к АОСР привязаны незакрытые дефекты (defects.hidden_work_act_id = act.id AND status NOT IN ('CLOSED','CANCELLED')) — АОСР не может перейти в APPROVED.
6. **Фото обязательно:** минимум 3 фотографии для каждого АОСР. Фото должны быть сделаны в период work_start_date — act_date.
7. **Шаблоны:** при создании из шаблона — авто-заполнение: описание (с плейсхолдерами), нормативные ссылки, требования к документам на материалы, чек-лист.
8. **Нормативная база:** РД-11-02-2006 «Требования к составу и порядку ведения исполнительной документации»; Приказ Минстроя от 02.12.2022 N1026/пр; СП 48.13330.2019 «Организация строительства»; ГрК РФ ст.52, 53.

### 21.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр реестра | + | + | + (свои проекты) | - | + |
| Создание АОСР | + | + | + | - | - |
| Редактирование (DRAFT) | + | + | + (свои) | - | - |
| Отправка уведомлений | + | + | - | - | - |
| Отправка на подписание | + | + | + (свои) | - | - |
| Подписание | + | + | + (в рамках своей роли) | - | - |
| Подписание КЭП | + | + | + | - | - |
| Отклонение | + | + | - | - | - |
| Утверждение | + | + | - | - | - |
| Печать PDF | + | + | + | - | + |
| Шаблоны (CRUD) | + | + | - | - | - |
| Удаление | + | - | - | - | - |

### 21.7 Крайние случаи

1. **Представитель Стройнадзора не пришёл** — после истечения 3 рабочих дней от уведомления, при отсутствии ответа — АОСР может быть подписан без SUPERVISOR с пометкой «Представитель надзорного органа уведомлён, на освидетельствование не явился». Ссылка: РД-11-02-2006 п.5.
2. **КЭП не настроена** — используется рукописная подпись (canvas). PDF генерируется с пустыми полями подписей для последующей печати и подписания на бумаге.
3. **Множество АОСР на один WBS-элемент** — допускается. Пример: для фундамента — отдельно АОСР на армирование, отдельно на бетонирование, отдельно на гидроизоляцию.
4. **Изменение состава участников после подписания** — запрещено. Для добавления нового подписанта — создать новую ревизию АОСР.
5. **Удаление подписанного АОСР** — запрещено (юридически значимый документ). Только soft-delete администратором с обязательным комментарием.
6. **Offline-режим** — черновик АОСР создаётся в IndexedDB. Фото сохраняются локально. Синхронизация при восстановлении связи. Подписание требует online (для проверки подписей других сторон).

### 21.8 UX Бенчмарк

**Лучший в классе:** Адепт (модуль «Исполнительная документация») — формирование АОСР по РД-11-02-2006 с привязкой к рабочей документации. ЦУС — электронные АОСР с КЭП. Procore — Observations module (международный аналог). Для полного соответствия: ИСУП «Вертикаль» — государственная система электронной ИД, формат обмена АОСР. ПУСК.app — мобильное создание актов с камеры.

---

## Задача 22: Учёт техники и GPS-трекинг

### 22.1 Описание

Единый реестр всей строительной техники (собственной и арендованной) с GPS/ГЛОНАСС-трекингом местоположения в реальном времени, учётом машино-часов, контролем расхода ГСМ, графиками ТО и расчётом себестоимости машино-часа. Строительная техника составляет 10-30% себестоимости проекта: экскаваторы, краны, бульдозеры, бетононасосы, автосамосвалы, генераторы, компрессоры. Основные проблемы отрасли: «призрачные активы» (техника числится, но не работает), дублирование аренды (два участка арендуют одинаковую технику, когда можно перебросить), хищение ГСМ, отсутствие контроля простоев, несвоевременное ТО.

Существующая сущность `Vehicle` содержит 30+ полей (organizationId, code, licensePlate, make, model, vehicleType, status, currentProjectId, fuelType, currentMileage, currentHours, insuranceExpiryDate, techInspectionExpiryDate), а также связанные `VehicleAssignment`, `FuelRecord`, `MaintenanceRecord`, `EquipmentInspection`. Задача расширяет модуль GPS-трекингом (интеграция с ГЛОНАСС-терминалами), учётом машино-часов с привязкой к проектам, экономическим анализом «своё vs аренда», геозонами (geofencing), электронными путевыми листами.

GPS-трекинг реализуется через интеграцию с популярными ГЛОНАСС/GPS-платформами: Wialon (СМТ/Gurtam), СКАУТ, Автограф, Навигатор, Fort Monitor. Платформа ПРИВОД получает данные через API этих систем (pull каждые 5 минут или push через webhook). Собственный GPS-модуль на устройствах не реализуется — используются существующие трекеры клиента.

### 22.2 Сущности БД

```sql
-- Расширение vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(20) DEFAULT 'OWNED';
-- OWNED, RENTED, LEASED
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_company VARCHAR(500);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_start_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_end_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_daily_rate NUMERIC(18,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_monthly_rate NUMERIC(18,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number_rostekhnadzor VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category VARCHAR(50);
-- "excavator","crane","bulldozer","concrete_pump","dump_truck","generator","compressor"
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity VARCHAR(100);
-- "25 тонн", "50 м3/ч", "40 кВт"
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gps_tracker_id VARCHAR(200);
-- ID устройства в ГЛОНАСС-системе
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gps_provider VARCHAR(50);
-- WIALON, SCOUT, AUTOGRAF, FORT_MONITOR, NAVIGATOR, MANUAL
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_gps_latitude NUMERIC(10,7);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_gps_longitude NUMERIC(10,7);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_gps_timestamp TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_gps_speed NUMERIC(6,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_engine_status VARCHAR(10);
-- ON, OFF, IDLE
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS hourly_cost_rate NUMERIC(18,2);
-- Расчётная стоимость машино-часа
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_hours_month NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS utilization_rate NUMERIC(5,2) DEFAULT 0;
-- % использования за текущий месяц

CREATE TABLE vehicle_gps_tracks (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id              UUID NOT NULL,
    latitude                NUMERIC(10,7) NOT NULL,
    longitude               NUMERIC(10,7) NOT NULL,
    altitude                NUMERIC(8,2),
    speed                   NUMERIC(6,2) DEFAULT 0,
    heading                 NUMERIC(5,2),
    engine_status           VARCHAR(10),
    -- ON, OFF, IDLE
    fuel_level              NUMERIC(5,2),
    -- % от бака
    odometer                NUMERIC(12,2),
    engine_hours            NUMERIC(12,2),
    recorded_at             TIMESTAMPTZ NOT NULL,
    received_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gps_provider            VARCHAR(50),
    raw_data                JSONB,
    -- Оригинальные данные от провайдера
    -- Без BaseEntity — таблица высокого объёма, только INSERT
    -- Партиционирование по месяцам
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Партиции на 12 месяцев вперёд
CREATE TABLE vehicle_gps_tracks_2026_01 PARTITION OF vehicle_gps_tracks
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE vehicle_gps_tracks_2026_02 PARTITION OF vehicle_gps_tracks
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE vehicle_gps_tracks_2026_03 PARTITION OF vehicle_gps_tracks
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- ... аналогично для остальных месяцев

CREATE INDEX idx_gps_vehicle_time ON vehicle_gps_tracks(vehicle_id, recorded_at);
CREATE INDEX idx_gps_recorded ON vehicle_gps_tracks(recorded_at);

CREATE TABLE vehicle_geofences (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    project_id              UUID,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    geofence_type           VARCHAR(20) NOT NULL DEFAULT 'POLYGON',
    -- POLYGON, CIRCLE
    coordinates             JSONB NOT NULL,
    -- Polygon: [{"lat":55.751,"lng":37.617},...] или Circle: {"lat":55.751,"lng":37.617,"radius":500}
    alert_on_enter          BOOLEAN DEFAULT FALSE,
    alert_on_exit           BOOLEAN DEFAULT TRUE,
    active                  BOOLEAN DEFAULT TRUE,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_geofence_org ON vehicle_geofences(organization_id);
CREATE INDEX idx_geofence_project ON vehicle_geofences(project_id);

CREATE TABLE vehicle_geofence_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id              UUID NOT NULL,
    geofence_id             UUID NOT NULL REFERENCES vehicle_geofences(id),
    event_type              VARCHAR(10) NOT NULL,
    -- ENTER, EXIT
    event_at                TIMESTAMPTZ NOT NULL,
    latitude                NUMERIC(10,7),
    longitude               NUMERIC(10,7),
    notified                BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_event_vehicle ON vehicle_geofence_events(vehicle_id, event_at);
CREATE INDEX idx_geofence_event_fence ON vehicle_geofence_events(geofence_id);

CREATE TABLE vehicle_work_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    vehicle_id              UUID NOT NULL,
    project_id              UUID NOT NULL,
    session_date            DATE NOT NULL,
    start_time              TIMESTAMPTZ NOT NULL,
    end_time                TIMESTAMPTZ,
    hours_worked            NUMERIC(6,2),
    hours_idle              NUMERIC(6,2),
    fuel_consumed_liters    NUMERIC(8,2),
    distance_km             NUMERIC(10,2),
    operator_id             UUID,
    operator_name           VARCHAR(255),
    source                  VARCHAR(20) NOT NULL DEFAULT 'GPS',
    -- GPS, MANUAL, WAYBILL
    cost_calculated         NUMERIC(18,2),
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_vws_org ON vehicle_work_sessions(organization_id);
CREATE INDEX idx_vws_vehicle_date ON vehicle_work_sessions(vehicle_id, session_date);
CREATE INDEX idx_vws_project ON vehicle_work_sessions(project_id);
CREATE INDEX idx_vws_date ON vehicle_work_sessions(session_date);

CREATE TABLE vehicle_cost_calculations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    vehicle_id              UUID NOT NULL,
    calculation_month       DATE NOT NULL,
    -- Первый день месяца
    depreciation_cost       NUMERIC(18,2) DEFAULT 0,
    fuel_cost               NUMERIC(18,2) DEFAULT 0,
    maintenance_cost        NUMERIC(18,2) DEFAULT 0,
    insurance_cost          NUMERIC(18,2) DEFAULT 0,
    rental_cost             NUMERIC(18,2) DEFAULT 0,
    operator_cost           NUMERIC(18,2) DEFAULT 0,
    other_cost              NUMERIC(18,2) DEFAULT 0,
    total_cost              NUMERIC(18,2) DEFAULT 0,
    total_hours             NUMERIC(12,2) DEFAULT 0,
    cost_per_hour           NUMERIC(18,2) DEFAULT 0,
    utilization_rate        NUMERIC(5,2) DEFAULT 0,
    -- % использования (hours / available_hours)
    own_vs_rent_comparison  JSONB,
    -- {"ownCostPerHour": 3500, "marketRentPerHour": 4200, "savings": 700}
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_vcc_vehicle_month UNIQUE (vehicle_id, calculation_month, deleted)
);

CREATE INDEX idx_vcc_org ON vehicle_cost_calculations(organization_id);
CREATE INDEX idx_vcc_vehicle ON vehicle_cost_calculations(vehicle_id);
CREATE INDEX idx_vcc_month ON vehicle_cost_calculations(calculation_month);
```

### 22.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/vehicles` | ADMIN, MANAGER, ENGINEER | Реестр техники с фильтрами |
| GET | `/api/vehicles/{id}` | ADMIN, MANAGER, ENGINEER | Карточка единицы техники |
| POST | `/api/vehicles` | ADMIN, MANAGER | Регистрация техники |
| PUT | `/api/vehicles/{id}` | ADMIN, MANAGER | Обновление |
| GET | `/api/vehicles/map` | ADMIN, MANAGER | Карта техники (все с GPS) |
| GET | `/api/vehicles/{id}/track` | ADMIN, MANAGER | GPS-трек за период (dateFrom, dateTo) |
| GET | `/api/vehicles/{id}/work-sessions` | ADMIN, MANAGER | Рабочие сессии за период |
| POST | `/api/vehicles/{id}/work-sessions` | ADMIN, MANAGER, ENGINEER | Ручной ввод рабочей сессии |
| GET | `/api/vehicles/{id}/cost` | ADMIN, MANAGER, ACCOUNTANT | Расчёт себестоимости машино-часа |
| POST | `/api/vehicles/{id}/calculate-cost` | ADMIN, MANAGER | Запуск расчёта за месяц |
| GET | `/api/vehicles/utilization` | ADMIN, MANAGER | Отчёт по утилизации |
| GET | `/api/vehicles/own-vs-rent` | ADMIN, MANAGER | Анализ «своё vs аренда» |
| POST | `/api/geofences` | ADMIN, MANAGER | Создание геозоны |
| GET | `/api/geofences` | ADMIN, MANAGER | Список геозон |
| PUT | `/api/geofences/{id}` | ADMIN, MANAGER | Обновление |
| DELETE | `/api/geofences/{id}` | ADMIN | Удаление |
| GET | `/api/geofences/{id}/events` | ADMIN, MANAGER | События входа/выхода |
| POST | `/api/vehicles/gps/webhook` | SYSTEM | Webhook для получения GPS-данных от провайдеров |
| POST | `/api/vehicles/gps/sync` | ADMIN | Принудительная синхронизация с GPS-провайдером |
| GET | `/api/vehicles/dashboard` | ADMIN, MANAGER | Дашборд техники |
| GET | `/api/vehicles/export` | ADMIN, MANAGER | Экспорт реестра |

### 22.4 UI Экраны

1. **Реестр техники** (`/fleet`) — DataTable: инвентарный номер, марка/модель, тип, гос. номер, статус (цветной бейдж), текущий проект, машино-часы за месяц, утилизация (progress bar), стоимость/час, ОСАГО (дата, подсветка если истекает). Фильтры: тип, статус, проект, собственная/арендованная. Переключатель «Таблица / Карта».

2. **Карта техники** (`/fleet/map`) — Yandex Maps/2GIS с маркерами всех единиц техники. Цвет маркера: зелёный = работает (engine ON), жёлтый = простой (engine IDLE/OFF на площадке), серый = нет данных. Геозоны отображаются полигонами. При клике на маркер — popup с информацией: название, статус, скорость, последнее обновление, проект. Фильтр по проекту, типу, статусу.

3. **Карточка техники** (`/fleet/:id`) — вкладки: Общие данные | GPS-трек | Рабочие сессии | ГСМ | ТО | Документы | Стоимость. GPS-трек: карта с маршрутом за выбранный день, timeline с периодами работы/простоя. Рабочие сессии: таблица по дням с часами и проектами. Стоимость: breakdown по статьям, график стоимости машино-часа по месяцам.

4. **Дашборд техники** (`/fleet/dashboard`) — MetricCards: всего единиц, работает сейчас, простаивает, на ТО. Утилизация по типам (stacked bar). Топ-5 по стоимости/час. Техника с просроченными документами (ОСАГО, техосмотр). Pie-chart: собственная vs арендованная.

5. **Форма геозоны** (`/fleet/geofences/new`) — карта с инструментами рисования: полигон (для площадки) или круг (для базы). Ввод названия, привязка к проекту, настройка оповещений.

6. **Анализ «своё vs аренда»** (`/fleet/own-vs-rent`) — таблица: единица техники, стоимость владения/час (амортизация + ГСМ + ТО + страховка + оператор), рыночная стоимость аренды/час, разница, рекомендация (зелёный «Выгоднее своё» / красный «Выгоднее аренда»).

### 22.5 Бизнес-правила и валидации

1. **GPS-данные:** приём через webhook или pull API каждые 5 минут. Данные сохраняются в партиционированную таблицу `vehicle_gps_tracks`. При получении точки — обновление `last_gps_*` в `vehicles`. Проверка геозон: если точка вне всех активных геозон проекта — создание geofence_event типа EXIT + уведомление.
2. **Рабочие сессии:** автоматическое формирование из GPS-данных. Алгоритм: engine_status=ON внутри геозоны проекта = рабочие часы. Engine_status=ON вне геозоны = перемещение. Engine_status=IDLE >15 мин = простой. Суммируется за день.
3. **Расчёт машино-часа:** ежемесячный scheduled job. Формула: `cost_per_hour = (depreciation + fuel + maintenance + insurance + operator) / total_hours`. Амортизация: линейная, `purchase_price * depreciation_rate / 12 / available_hours`. ГСМ: `fuel_consumed * fuel_price`. ТО: сумма maintenance_records за месяц.
4. **Утилизация:** `utilization_rate = total_hours_worked / available_hours * 100`. Available_hours = рабочих дней в месяце * 8 часов. Цветовая индикация: >80% зелёный, 50-80% жёлтый, <50% красный.
5. **Аренда:** для арендованной техники — `rental_daily_rate` обязателен. При превышении даты окончания аренды — предупреждение. Стоимость аренды включается в расчёт себестоимости проекта.
6. **Простои:** если техника на проекте, engine_status=OFF >24 часа — уведомление руководителю проекта «Техника {name} простаивает более 24 часов».
7. **Нормативная база:** ФСБУ 6/2020 «Основные средства» (амортизация); Приказ Минтранса от 28.09.2022 N390 (путевые листы); МДС 81-3.2001 (нормы расхода ГСМ строительных машин); ФЗ-395 (ГЛОНАСС обязательна для транспорта).

### 22.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Реестр техники | + | + | + (свои проекты) | + | + |
| Карта GPS | + | + | + (свои проекты) | - | + |
| Регистрация техники | + | + | - | - | - |
| Рабочие сессии | + | + | + (ручной ввод) | + (просмотр) | + |
| Расчёт стоимости | + | + | - | + | + |
| Геозоны (CRUD) | + | + | - | - | - |
| Анализ своё/аренда | + | + | - | + | + |
| Дашборд | + | + | + | + | + |
| Настройки GPS | + | - | - | - | - |

### 22.7 Крайние случаи

1. **GPS-провайдер недоступен** — данные кэшируются на стороне провайдера. При восстановлении — batch-загрузка за пропущенный период. Отметка «нет данных» в UI.
2. **Техника между проектами** — engine ON + движение + вне всех геозон = «в перемещении». Не учитывается ни в одном проекте.
3. **Аренда с пробегом** — для автосамосвалов расчёт по km, не по часам. Поле `rental_per_km`.
4. **Партиционирование GPS** — автоматическое создание партиций на 12 месяцев вперёд через scheduled job. Удаление данных старше retention_period (настраиваемый, по умолчанию 24 месяца).
5. **Множество GPS-провайдеров** — организация может использовать разных провайдеров для разной техники. Маппинг `gps_provider` + `gps_tracker_id` уникален.

### 22.8 UX Бенчмарк

**Лучший в классе:** Teletrac Navman (fleet tracking + construction), HCSS (Heavy Construction Systems) — GPS + job costing + equipment management. Viewpoint Vista — equipment module с cost tracking. Для российского рынка: СКАУТ, Wialon/Gurtam — лидеры ГЛОНАСС-мониторинга; 1С:Управление автотранспортом — путевые листы и ГСМ.

---

## Задача 23: Управление Punch List

### 23.1 Описание

Punch List (дефектная ведомость, предпусковой перечень замечаний) — формализованный перечень недоделок, дефектов и несоответствий, формируемый перед сдачей объекта или его части заказчику. В российской практике аналог — «Ведомость дефектов приёмочной комиссии» (ГрК РФ ст.55, ГК РФ ст.720). Каждый пункт (Punch Item) описывает конкретное замечание с указанием местоположения, фотографией, ответственным за устранение, сроком и статусом.

Существующие сущности `PunchList` (контейнер) и `PunchItem` (позиция) содержат базовые поля: number, description, location, category, priority, status, assignedToId, photoUrls, fixDeadline, fixedAt, verifiedById, verifiedAt. Задача расширяет функциональность: привязка к чертежу (pin-on-plan), многоуровневые категории (дисциплина/система/помещение), обязательная фотоверификация, шаблоны типовых замечаний, отчёт приёмочной комиссии (PDF), субподрядчик-исполнитель, стоимость устранения, связь с дефектами (Defect) для преемственности, массовое создание из обхода, уведомления ответственным.

Ключевое отличие Punch List от реестра дефектов (задача 20): дефекты обнаруживаются и устраняются в ходе строительства (construction phase), а Punch List формируется на этапе приёмки (pre-handover/closeout). Однако незакрытые дефекты с severity COSMETIC/MINOR могут мигрировать в Punch List.

### 23.2 Сущности БД

```sql
-- Расширение существующих таблиц

ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS project_id UUID NOT NULL;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS inspection_date DATE;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS inspector_id UUID;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS area VARCHAR(255);
-- "Блок А", "Корпус 2", "Паркинг"
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS floor VARCHAR(50);
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS closed_items INTEGER DEFAULT 0;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS progress_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS target_completion_date DATE;
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';
-- DRAFT, IN_PROGRESS, REVIEW, COMPLETED, APPROVED

ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS discipline VARCHAR(50);
-- STRUCTURAL, ARCHITECTURAL, ELECTRICAL, PLUMBING, HVAC, FIRE_PROTECTION, EXTERIOR, LANDSCAPING
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS system_name VARCHAR(255);
-- "Вентиляция", "Водоснабжение", "Электрика 0.4кВ"
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS room_number VARCHAR(50);
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS drawing_id UUID;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS pin_x NUMERIC(10,4);
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS pin_y NUMERIC(10,4);
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS assigned_company_id UUID;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS assigned_company_name VARCHAR(500);
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC(18,2);
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS defect_id UUID;
-- Ссылка на Defect, если мигрировал из реестра дефектов
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS before_photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS after_photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;

-- Дополнительные индексы
CREATE INDEX IF NOT EXISTS idx_punch_list_org ON punch_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_project ON punch_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_list_status ON punch_lists(status);
CREATE INDEX IF NOT EXISTS idx_punch_item_org ON punch_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_project ON punch_items(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_discipline ON punch_items(discipline);
CREATE INDEX IF NOT EXISTS idx_punch_item_company ON punch_items(assigned_company_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_drawing ON punch_items(drawing_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_defect ON punch_items(defect_id);
CREATE INDEX IF NOT EXISTS idx_punch_item_deadline_open ON punch_items(fix_deadline) WHERE status NOT IN ('CLOSED','VERIFIED');

-- Шаблоны типовых замечаний
CREATE TABLE punch_item_templates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    discipline              VARCHAR(50) NOT NULL,
    category                VARCHAR(50),
    title                   VARCHAR(500) NOT NULL,
    description_template    TEXT,
    default_priority        VARCHAR(20) DEFAULT 'MEDIUM',
    default_deadline_days   INTEGER DEFAULT 14,
    sort_order              INTEGER DEFAULT 0,
    active                  BOOLEAN DEFAULT TRUE,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_punch_tmpl_org ON punch_item_templates(organization_id);
CREATE INDEX idx_punch_tmpl_discipline ON punch_item_templates(discipline);
```

### 23.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/punch-lists` | ADMIN, MANAGER, ENGINEER | Список Punch Lists |
| GET | `/api/punch-lists/{id}` | ADMIN, MANAGER, ENGINEER | Детали с пунктами |
| POST | `/api/punch-lists` | ADMIN, MANAGER, ENGINEER | Создание Punch List |
| PUT | `/api/punch-lists/{id}` | ADMIN, MANAGER, ENGINEER | Обновление |
| POST | `/api/punch-lists/{id}/complete` | ADMIN, MANAGER | Завершение (все пункты закрыты) |
| POST | `/api/punch-lists/{id}/approve` | ADMIN, MANAGER | Утверждение заказчиком |
| GET | `/api/punch-items` | ADMIN, MANAGER, ENGINEER | Все пункты с фильтрами (punchListId, projectId, discipline, status, assignedCompanyId, isOverdue) |
| GET | `/api/punch-items/{id}` | ADMIN, MANAGER, ENGINEER | Детали пункта |
| POST | `/api/punch-items` | ADMIN, MANAGER, ENGINEER | Создание пункта |
| POST | `/api/punch-items/batch` | ADMIN, MANAGER, ENGINEER | Массовое создание (до 50 за раз) |
| PUT | `/api/punch-items/{id}` | ADMIN, MANAGER, ENGINEER | Обновление |
| POST | `/api/punch-items/{id}/assign` | ADMIN, MANAGER | Назначить ответственного |
| POST | `/api/punch-items/{id}/fix` | ADMIN, MANAGER, ENGINEER | Отметить устранённым (+ after_photo обязательно) |
| POST | `/api/punch-items/{id}/verify` | ADMIN, MANAGER | Верифицировать (FIXED → VERIFIED → CLOSED) |
| POST | `/api/punch-items/{id}/reject` | ADMIN, MANAGER | Отклонить (FIXED → OPEN, rejection_count++) |
| POST | `/api/punch-items/{id}/photos` | ADMIN, MANAGER, ENGINEER | Загрузка фото |
| POST | `/api/punch-items/from-defects` | ADMIN, MANAGER | Миграция незакрытых дефектов в Punch List |
| GET | `/api/punch-lists/{id}/report` | ADMIN, MANAGER | PDF-отчёт приёмочной комиссии |
| GET | `/api/punch-items/stats` | ADMIN, MANAGER | Статистика |
| GET | `/api/punch-items/drawing/{drawingId}` | ADMIN, MANAGER, ENGINEER | Пункты на чертеже |
| GET | `/api/punch-item-templates` | ADMIN, MANAGER, ENGINEER | Шаблоны |
| POST | `/api/punch-item-templates` | ADMIN, MANAGER | Создание шаблона |

### 23.4 UI Экраны

1. **Список Punch Lists** (`/punchlist`) — DataTable: номер, проект, зона/этаж, дата обхода, инспектор, прогресс (progress bar: 45/67 = 67%), статус, целевая дата. Клик — детальная страница.

2. **Детали Punch List** (`/punchlist/:id`) — заголовок с прогресс-баром. Фильтры: дисциплина, статус, приоритет, ответственный. Переключатель «Таблица / Канбан / Чертёж». Таблица пунктов: номер, описание (truncated), дисциплина, приоритет (цвет), статус, ответственный, дедлайн, мини-фото. Кнопка «+ Добавить замечание» / «Массовое создание» / «Импорт из дефектов».

3. **Канбан-доска** — колонки: OPEN → IN_PROGRESS → FIXED → VERIFIED/CLOSED. Drag-and-drop (ENGINEER может drag только в FIXED с загрузкой after-photo). Группировка по дисциплине или ответственному.

4. **Вид на чертеже** — чертёж этажа с pin-маркерами. Цвет = статус (красный=OPEN, жёлтый=IN_PROGRESS, синий=FIXED, зелёный=VERIFIED/CLOSED). Тап на маркер — popup с фото (before/after side-by-side), описание, кнопки действий.

5. **Мобильный обход** (`/punchlist/walkthrough`) — полноэкранный режим для инспекции. Выбор чертежа → тап на точку → камера → описание (текст/голос) → дисциплина (select) → приоритет → ответственный → «Далее». Серия создания без возврата на главный экран. Счётчик «Создано: 12». Кнопка «Завершить обход».

6. **Отчёт приёмочной комиссии** — PDF: заголовок «ВЕДОМОСТЬ ЗАМЕЧАНИЙ», проект, дата обхода, комиссия, таблица замечаний (номер, описание, фото, ответственный, срок, статус). Итого: создано/устранено/в работе/просрочено.

### 23.5 Бизнес-правила и валидации

1. **Автонумерация пунктов:** внутри PunchList — последовательный номер (1, 2, 3...). Глобальный номер: `PI-{ProjectCode}-{NNNN}`.
2. **Фото обязательно при устранении:** при переводе в FIXED — минимум 1 фото типа AFTER. Без фото — ошибка валидации.
3. **Повторные отклонения:** `rejection_count` инкрементируется при каждом reject. При rejection_count >= 3 — автоматическая эскалация руководителю проекта.
4. **Прогресс Punch List:** `progress_percent = closed_items / total_items * 100`. Обновляется при каждом изменении статуса пункта. Punch List переходит в COMPLETED когда progress=100%.
5. **Миграция из дефектов:** endpoint `/from-defects` копирует незакрытые дефекты (severity COSMETIC/MINOR) в Punch List как новые PunchItem с ссылкой defect_id. Оригинальный дефект переводится в CLOSED с пометкой «Мигрирован в Punch List».
6. **Дедлайн по умолчанию:** COSMETIC — +30 дней, MINOR — +14 дней, MAJOR — +7 дней. CRITICAL — +3 дня.
7. **Нормативная база:** ГрК РФ ст.55 (ввод объекта в эксплуатацию); ГК РФ ст.720 (приёмка результатов работ); AIA A201 (General Conditions, Article 9); FIDIC Cl.11 (Defects Liability).

### 23.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр | + | + | + (свои проекты) | - | + |
| Создание Punch List | + | + | + | - | - |
| Создание пунктов | + | + | + | - | - |
| Массовое создание | + | + | + | - | - |
| Назначение ответственного | + | + | - | - | - |
| Отметить устранённым | + | + | + | - | - |
| Верификация | + | + | - | - | - |
| Отклонение | + | + | - | - | - |
| Утверждение | + | + | - | - | - |
| Отчёт PDF | + | + | + | - | + |

### 23.7 Крайние случаи

1. **Субподрядчик не признаёт замечание** — добавить комментарий с обоснованием. Если спор не разрешён — MANAGER принимает решение (force assign).
2. **Punch List утверждён, но найдены новые замечания** — создать новый Punch List (Revision 2). Связь через parent_id.
3. **Пункт без чертежа** — допускается. Только текстовое описание расположения.
4. **Массовый обход с >100 замечаниями** — разбивается на несколько batch-запросов (по 50). Offline-кэширование в IndexedDB.

### 23.8 UX Бенчмарк

**Лучший в классе:** Fieldwire — лучший mobile punch list, pin-on-plan, offline, filters. PlanRadar — photo-first defect/punch management, 75+ стран. Procore (Punch List) — integration с scheduling, subcontractor workflows. Для российского рынка: Адепт — ведомость замечаний приёмочной комиссии; ЦУС — QC чек-листы с фотофиксацией.

---

## Задача 24: Прогнозирование денежных потоков

### 24.1 Описание

Модуль прогнозирования денежных потоков (Cash Flow Forecasting) обеспечивает визуализацию и анализ планируемых поступлений и выплат по портфелю проектов с горизонтом прогнозирования до 12-24 месяцев. Для строительных компаний ликвидность — критический фактор выживания: 60% банкротств в отрасли связаны с кассовыми разрывами, а не с убыточностью. CFO и казначей должны видеть: когда ожидаются поступления (оплата по КС-2/КС-3, авансы), когда предстоят крупные выплаты (субподрядчикам, поставщикам, зарплата, налоги, аренда), где возникают кассовые разрывы, и какие действия предпринять (ускорить выставление КС-2, перенести платёж, взять кредитную линию).

Существующая сущность `CashFlowEntry` содержит базовые поля (projectId, entryDate, direction, category, amount, paymentId, invoiceId), а `CashFlowPage.tsx` отображает таблицу и bar-chart по месяцам. Задача расширяет модуль: S-кривая (накопительный cash flow), прогнозные записи на основе графика работ и контрактных условий, сценарный анализ (оптимистичный/пессимистичный/базовый), rolling forecast с еженедельным обновлением, интеграция с модулями: finance (Invoice, Payment, Budget), costManagement (Commitment), planning (ScheduleBaseline), contracts (Contract — условия оплаты).

### 24.2 Сущности БД

```sql
-- Java enum: CashFlowEntryType
-- ACTUAL, FORECAST, COMMITTED, TENTATIVE

-- Java enum: CashFlowScenario
-- BASE, OPTIMISTIC, PESSIMISTIC

CREATE TABLE cash_flow_forecasts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    forecast_date           DATE NOT NULL,
    -- Дата создания прогноза
    horizon_start           DATE NOT NULL,
    horizon_end             DATE NOT NULL,
    scenario                VARCHAR(20) NOT NULL DEFAULT 'BASE',
    -- BASE, OPTIMISTIC, PESSIMISTIC
    opening_balance         NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Начальное сальдо на horizon_start
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    -- Только один активный прогноз на сценарий
    auto_generated          BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at            TIMESTAMPTZ,
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_cf_forecast_active UNIQUE (organization_id, scenario, is_active, deleted)
);

CREATE INDEX idx_cf_forecast_org ON cash_flow_forecasts(organization_id);
CREATE INDEX idx_cf_forecast_active ON cash_flow_forecasts(is_active) WHERE is_active = TRUE;

CREATE TABLE cash_flow_forecast_lines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id             UUID NOT NULL REFERENCES cash_flow_forecasts(id),
    project_id              UUID,
    period_start            DATE NOT NULL,
    -- Начало периода (первый день недели или месяца)
    period_end              DATE NOT NULL,
    period_type             VARCHAR(10) NOT NULL DEFAULT 'MONTHLY',
    -- WEEKLY, MONTHLY
    direction               VARCHAR(10) NOT NULL,
    -- INFLOW, OUTFLOW
    category                VARCHAR(30) NOT NULL,
    -- PROGRESS_PAYMENT, ADVANCE, RETENTION_RELEASE, SUBCONTRACTOR, MATERIALS,
    -- EQUIPMENT, LABOR, OVERHEAD, TAX, INSURANCE, OTHER
    entry_type              VARCHAR(20) NOT NULL DEFAULT 'FORECAST',
    -- ACTUAL, FORECAST, COMMITTED, TENTATIVE
    amount                  NUMERIC(18,2) NOT NULL,
    probability             NUMERIC(5,2) DEFAULT 100.0,
    -- % вероятности (для TENTATIVE)
    weighted_amount         NUMERIC(18,2),
    -- amount * probability / 100
    source_entity_type      VARCHAR(30),
    -- INVOICE, PAYMENT, COMMITMENT, CONTRACT, BUDGET, SCHEDULE
    source_entity_id        UUID,
    contract_id             UUID,
    counterparty_name       VARCHAR(500),
    description             VARCHAR(500),
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cf_line_forecast ON cash_flow_forecast_lines(forecast_id);
CREATE INDEX idx_cf_line_project ON cash_flow_forecast_lines(project_id);
CREATE INDEX idx_cf_line_period ON cash_flow_forecast_lines(period_start, period_end);
CREATE INDEX idx_cf_line_direction ON cash_flow_forecast_lines(direction);
CREATE INDEX idx_cf_line_category ON cash_flow_forecast_lines(category);
CREATE INDEX idx_cf_line_type ON cash_flow_forecast_lines(entry_type);
CREATE INDEX idx_cf_line_source ON cash_flow_forecast_lines(source_entity_type, source_entity_id);

-- Расширение cash_flow_entries для фактических данных
ALTER TABLE cash_flow_entries ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE cash_flow_entries ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE cash_flow_entries ADD COLUMN IF NOT EXISTS counterparty_name VARCHAR(500);
ALTER TABLE cash_flow_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) DEFAULT 'ACTUAL';
```

### 24.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/cash-flow/actual` | ADMIN, MANAGER, ACCOUNTANT | Фактические данные за период |
| GET | `/api/cash-flow/forecasts` | ADMIN, MANAGER, ACCOUNTANT | Список прогнозов |
| GET | `/api/cash-flow/forecasts/{id}` | ADMIN, MANAGER, ACCOUNTANT | Детали прогноза с линиями |
| POST | `/api/cash-flow/forecasts` | ADMIN, MANAGER | Создание прогноза |
| PUT | `/api/cash-flow/forecasts/{id}` | ADMIN, MANAGER | Обновление |
| POST | `/api/cash-flow/forecasts/generate` | ADMIN, MANAGER | Автоматическая генерация прогноза из контрактов, графика, обязательств |
| POST | `/api/cash-flow/forecasts/{id}/lines` | ADMIN, MANAGER, ACCOUNTANT | Добавление/обновление строки прогноза |
| DELETE | `/api/cash-flow/forecasts/{id}/lines/{lineId}` | ADMIN, MANAGER | Удаление строки |
| GET | `/api/cash-flow/s-curve` | ADMIN, MANAGER, ACCOUNTANT | Данные для S-кривой (actual + forecast, cumulative) |
| GET | `/api/cash-flow/gap-analysis` | ADMIN, MANAGER, ACCOUNTANT | Анализ кассовых разрывов |
| GET | `/api/cash-flow/scenarios` | ADMIN, MANAGER, ACCOUNTANT | Сценарный анализ (3 сценария overlay) |
| GET | `/api/cash-flow/by-project` | ADMIN, MANAGER, ACCOUNTANT | Cash flow в разрезе проектов |
| GET | `/api/cash-flow/by-category` | ADMIN, MANAGER, ACCOUNTANT | Cash flow в разрезе категорий |
| GET | `/api/cash-flow/export` | ADMIN, MANAGER, ACCOUNTANT | Экспорт в Excel |
| GET | `/api/cash-flow/report` | ADMIN, MANAGER, ACCOUNTANT | PDF-отчёт |

### 24.4 UI Экраны

1. **Главный экран Cash Flow** (`/finance/cash-flow`) — S-кривая (AreaChart): ось X — периоды (месяцы), ось Y — кумулятивный cash flow. Три линии: фактический (сплошная), прогнозный базовый (штриховая), оптимистичный/пессимистичный (полупрозрачные области). Точка перехода факт→прогноз отмечена вертикальной линией «Сегодня». Зоны кассовых разрывов подсвечены красным.

2. **Таблица потоков** — под S-кривой. Pivot-таблица: строки = категории (Поступления: оплата КС-2, авансы, возврат удержания; Выплаты: субподрядчики, материалы, техника, ЗП, налоги, аренда, прочее). Столбцы = периоды (месяцы). Итоговая строка: баланс за период, кумулятивный баланс. Ячейки с фактическими данными — чёрный шрифт, прогнозные — серый курсив. Отрицательный кумулятивный баланс — красный.

3. **MetricCards** — 4 карточки: текущий баланс, прогноз на конец месяца, минимальный прогнозный баланс (дата + сумма), дней до кассового разрыва (если прогнозируется).

4. **Сценарный анализ** (`/finance/cash-flow/scenarios`) — 3 S-кривые overlay на одном графике. Таблица с разницей между сценариями. Подстройка параметров: задержка оплат (дни), % вероятности тендера, курсовая разница.

5. **Drill-down по проектам** (`/finance/cash-flow/projects`) — Stacked bar chart: каждый проект — отдельный цвет. Клик на проект — cash flow этого проекта.

6. **Форма прогнозной строки** — модальное окно: проект, категория, направление (приход/расход), сумма, период, тип (forecast/committed/tentative), вероятность, контрагент, описание.

7. **Анализ разрывов** (`/finance/cash-flow/gaps`) — timeline с красными зонами (кумулятивный баланс < 0). Для каждого разрыва: дата начала, дата окончания, максимальная глубина, рекомендации (ускорить КС-2 по проекту X, перенести платёж Y).

### 24.5 Бизнес-правила и валидации

1. **Автогенерация прогноза:** при вызове `/generate` система собирает данные из: (a) Contract — графики оплат, условия авансирования, удержания; (b) Invoice — выставленные неоплаченные счета; (c) Commitment — обязательства по закупкам; (d) Budget — плановые расходы по статьям; (e) ScheduleBaseline — прогноз объёмов работ → прогноз КС-2; (f) PayrollService — прогноз ФОТ.
2. **S-кривая:** кумулятивные данные = SUM(amount) с нарастающим итогом. Фактические данные — из `cash_flow_entries`. Прогнозные — из `cash_flow_forecast_lines` активного прогноза.
3. **Кассовый разрыв:** `gap = opening_balance + SUM(inflows) - SUM(outflows)`. Если gap < 0 для любого периода — оповещение ACCOUNTANT и MANAGER.
4. **Rolling forecast:** еженедельный scheduled job пересчитывает прогноз: фактические данные замещают прогнозные для прошедших периодов, будущие периоды корректируются по трендам.
5. **Сценарии:** OPTIMISTIC = все поступления на 15% раньше, расходы на 10% позже. PESSIMISTIC = поступления на 30% позже, расходы на 5% раньше, +10% непредвиденных расходов. Коэффициенты настраиваемы.
6. **Вероятностный расчёт:** для TENTATIVE записей weighted_amount = amount * probability / 100. В S-кривую включается weighted_amount.
7. **Нормативная база:** ПБУ 23/2011 «Отчёт о движении денежных средств»; МСФО (IAS 7); CFMA Financial Benchmarker (строительная отрасль).

### 24.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр фактических данных | + | + | - | + | + |
| Просмотр прогноза | + | + | - | + | + |
| Создание прогноза | + | + | - | + (свой раздел) | - |
| Автогенерация | + | + | - | - | - |
| Редактирование строк | + | + | - | + | - |
| S-кривая | + | + | - | + | + |
| Сценарный анализ | + | + | - | + | + |
| Экспорт | + | + | - | + | + |

### 24.7 Крайние случаи

1. **Нет данных для автогенерации** (новый проект без контрактов) — прогноз создаётся пустым. Пользователь заполняет вручную.
2. **Изменение контракта после генерации** — прогноз НЕ обновляется автоматически. Требуется перегенерация (кнопка «Обновить прогноз»).
3. **Мультивалютность** — все суммы конвертируются в базовую валюту организации по курсу на дату записи.
4. **Дублирование при перегенерации** — при перегенерации старые FORECAST-строки удаляются, ACTUAL и ручные COMMITTED остаются.
5. **Горизонт >24 мес** — технически возможно, но точность падает. UI предупреждение: «Прогноз на горизонт более 12 месяцев имеет высокую неопределённость».

### 24.8 UX Бенчмарк

**Лучший в классе:** Procore (Financial Management) — cash flow forecasting с integration к billing. Sage 300 CRE — cash management module. Для российского рынка: 1С:Управление строительной организацией — БДДС (бюджет движения денежных средств); Gectaro — базовый cash flow. Визуализация: S-curve стандарт отрасли (PMI PMBOK, AACE).

---

## Задача 25: Складской учёт со штрихкодами/QR

### 25.1 Описание

Расширение существующего складского модуля (warehouse) поддержкой штрихкодового и QR-сканирования для автоматизации инвентаризаций, приёмки материалов, выдачи со склада и межобъектных перемещений. На строительной площадке потери материалов составляют 5-15% от стоимости: хищения, пересортица, потери при хранении, ошибки учёта. Сканирование снижает ошибки ручного ввода на 99.5% и ускоряет инвентаризацию в 3-5 раз.

Существующие сущности: `Material` (справочник), `StockEntry` (остатки по ячейкам), `StockMovement`/`StockMovementLine` (движения), `WarehouseLocation` (склады/ячейки), `InventoryCheck`/`InventoryCheckLine` (инвентаризации), `StockLimit`/`StockLimitAlert` (лимиты). Задача добавляет: штрихкоды/QR для материалов и складских ячеек, мобильный сканер (камера устройства), генерацию этикеток для печати, маршрутный лист инвентаризации, приёмку по штрихкоду поставщика, партионный учёт (batch/lot tracking), серийные номера для дорогостоящих материалов.

### 25.2 Сущности БД

```sql
-- Расширение materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20) DEFAULT 'EAN13';
-- EAN13, CODE128, QR, INTERNAL
ALTER TABLE materials ADD COLUMN IF NOT EXISTS qr_code_data VARCHAR(500);
-- Содержимое QR-кода (может включать UUID, URL, JSON)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS manufacturer_barcode VARCHAR(100);
-- Штрихкод производителя/поставщика
ALTER TABLE materials ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER;
-- Срок годности в днях (для цемента, краски и т.д.)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS requires_lot_tracking BOOLEAN DEFAULT FALSE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS requires_serial_tracking BOOLEAN DEFAULT FALSE;

-- Расширение warehouse_locations
ALTER TABLE warehouse_locations ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE warehouse_locations ADD COLUMN IF NOT EXISTS qr_code_data VARCHAR(500);

CREATE UNIQUE INDEX IF NOT EXISTS idx_material_barcode ON materials(organization_id, barcode) WHERE barcode IS NOT NULL AND deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_barcode ON warehouse_locations(organization_id, barcode) WHERE barcode IS NOT NULL AND deleted = FALSE;

-- Партии (lots) материалов
CREATE TABLE material_lots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    material_id             UUID NOT NULL,
    lot_number              VARCHAR(100) NOT NULL,
    batch_number            VARCHAR(100),
    supplier_id             UUID,
    supplier_name           VARCHAR(500),
    receipt_date            DATE NOT NULL,
    manufacture_date        DATE,
    expiry_date             DATE,
    certificate_number      VARCHAR(200),
    certificate_url         VARCHAR(1000),
    quantity_received       NUMERIC(16,3) NOT NULL,
    quantity_remaining      NUMERIC(16,3) NOT NULL,
    unit_price              NUMERIC(18,2),
    location_id             UUID,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, DEPLETED, EXPIRED, QUARANTINE, REJECTED
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_lot_org_material UNIQUE (organization_id, material_id, lot_number, deleted)
);

CREATE INDEX idx_lot_org ON material_lots(organization_id);
CREATE INDEX idx_lot_material ON material_lots(material_id);
CREATE INDEX idx_lot_expiry ON material_lots(expiry_date) WHERE status = 'ACTIVE';
CREATE INDEX idx_lot_status ON material_lots(status);
CREATE INDEX idx_lot_supplier ON material_lots(supplier_id);

-- Расширение stock_movement_lines для партионного учёта
ALTER TABLE stock_movement_lines ADD COLUMN IF NOT EXISTS lot_id UUID;
ALTER TABLE stock_movement_lines ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE stock_movement_lines ADD COLUMN IF NOT EXISTS scanned_barcode VARCHAR(100);
ALTER TABLE stock_movement_lines ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMPTZ;

-- Расширение inventory_check_lines
ALTER TABLE inventory_check_lines ADD COLUMN IF NOT EXISTS scanned_barcode VARCHAR(100);
ALTER TABLE inventory_check_lines ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMPTZ;
ALTER TABLE inventory_check_lines ADD COLUMN IF NOT EXISTS lot_id UUID;

-- Этикетки для печати
CREATE TABLE barcode_labels (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    label_type              VARCHAR(20) NOT NULL,
    -- MATERIAL, LOCATION, LOT, MOVEMENT
    entity_id               UUID NOT NULL,
    barcode_value           VARCHAR(200) NOT NULL,
    barcode_format          VARCHAR(20) NOT NULL DEFAULT 'QR',
    -- QR, EAN13, CODE128, CODE39
    label_text_line1        VARCHAR(200),
    label_text_line2        VARCHAR(200),
    label_text_line3        VARCHAR(200),
    printed                 BOOLEAN DEFAULT FALSE,
    printed_at              TIMESTAMPTZ,
    print_count             INTEGER DEFAULT 0,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_barcode_label_org ON barcode_labels(organization_id);
CREATE INDEX idx_barcode_label_type ON barcode_labels(label_type, entity_id);
CREATE INDEX idx_barcode_label_value ON barcode_labels(barcode_value);
```

### 25.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| POST | `/api/warehouse/scan` | ADMIN, MANAGER, ENGINEER | Универсальный сканер: принимает barcode/QR value, возвращает найденную сущность (материал/ячейка/партия) |
| POST | `/api/warehouse/receive-by-scan` | ADMIN, MANAGER, ENGINEER | Приёмка материала сканированием штрихкода поставщика |
| POST | `/api/warehouse/issue-by-scan` | ADMIN, MANAGER, ENGINEER | Выдача со склада по скану материала + ячейки |
| POST | `/api/warehouse/transfer-by-scan` | ADMIN, MANAGER, ENGINEER | Перемещение между ячейками по скану |
| GET | `/api/material-lots` | ADMIN, MANAGER, ENGINEER | Партии материалов с фильтрами |
| GET | `/api/material-lots/{id}` | ADMIN, MANAGER, ENGINEER | Детали партии |
| POST | `/api/material-lots` | ADMIN, MANAGER | Создание партии (при приёмке) |
| PUT | `/api/material-lots/{id}` | ADMIN, MANAGER | Обновление |
| POST | `/api/material-lots/{id}/quarantine` | ADMIN, MANAGER | Перевод в карантин (брак, несоответствие) |
| GET | `/api/material-lots/expiring` | ADMIN, MANAGER | Партии с истекающим сроком |
| POST | `/api/barcode-labels/generate` | ADMIN, MANAGER, ENGINEER | Генерация этикеток (batch) |
| GET | `/api/barcode-labels/{id}/image` | ADMIN, MANAGER, ENGINEER | Изображение этикетки (PNG/SVG) |
| POST | `/api/barcode-labels/print` | ADMIN, MANAGER, ENGINEER | Печать на принтере этикеток (ZPL/TSPL) |
| POST | `/api/inventory-checks/{id}/scan-item` | ADMIN, MANAGER, ENGINEER | Сканирование позиции при инвентаризации |
| GET | `/api/inventory-checks/{id}/route` | ADMIN, MANAGER, ENGINEER | Маршрутный лист инвентаризации |

### 25.4 UI Экраны

1. **Мобильный сканер** (`/warehouse/scan`) — полноэкранная камера с overlay-рамкой сканирования. При распознавании: вибрация + звуковой сигнал + отображение найденной сущности (материал: название, остаток, ячейка; ячейка: номер, содержимое). Кнопки быстрых действий: «Приёмка», «Выдача», «Перемещение», «Инвентаризация».

2. **Быстрая приёмка** (`/warehouse/receive`) — сканирование штрихкода поставщика → автоопределение материала (или ручной выбор) → ввод количества → сканирование ячейки → подтверждение. Batch-режим: последовательное сканирование нескольких позиций. Итоговый экран: список принятого, кнопка «Завершить приёмку» (создаёт StockMovement типа RECEIPT).

3. **Выдача со склада** (`/warehouse/issue`) — сканирование материала → отображение остатка → ввод количества → выбор получателя (сотрудник/проект) → подтверждение. Проверка лимитов ЛЗВ в реальном времени.

4. **Инвентаризация со сканером** (`/warehouse/inventory/:id/scan`) — маршрутный лист: последовательность ячеек для обхода. Сканирование ячейки → сканирование материала → ввод фактического количества → автоматический расчёт отклонения. Прогресс-бар: 45/120 позиций. Цветовая индикация: совпадение = зелёный, отклонение = красный.

5. **Генератор этикеток** (`/warehouse/labels`) — выбор материалов/ячеек → настройка шаблона (размер, поля, формат штрихкода) → preview → печать на принтере этикеток или PDF.

6. **Партии материалов** (`/warehouse/lots`) — DataTable: номер партии, материал, поставщик, дата приёмки, срок годности (подсветка), остаток, статус. Фильтры: материал, поставщик, статус, истекающие.

### 25.5 Бизнес-правила и валидации

1. **Генерация штрихкода:** при создании Material без barcode — автоматическая генерация внутреннего кода формата `PVD-{ORG_CODE}-{NNNNNN}`. QR содержит JSON: `{"type":"material","id":"uuid","org":"code"}`.
2. **Сканирование:** поддержка форматов EAN-13, EAN-8, Code128, Code39, QR, DataMatrix. Библиотека: `@nickyjs/barcode-scanner` или `html5-qrcode` для мобильного.
3. **Партионный учёт:** если `material.requires_lot_tracking=true` — при каждой приёмке обязательно указание lot_number. При выдаче — FIFO по дате приёмки (или FEFO по дате истечения).
4. **Срок годности:** если `material.shelf_life_days` задан — при создании партии автоматически рассчитывается `expiry_date = manufacture_date + shelf_life_days`. За 30 дней до истечения — оповещение. При истечении — статус EXPIRED, блокировка выдачи.
5. **Маршрутный лист:** генерируется оптимальный маршрут обхода ячеек (группировка по зонам/рядам, сортировка по номеру ячейки).
6. **Этикетки:** поддержка принтеров Zebra (ZPL), TSC (TSPL), Dymo (label). Размеры: 58x40мм, 100x50мм, 100x70мм. Содержание: штрихкод/QR, название материала, артикул, единица измерения, дата.
7. **Нормативная база:** ФСБУ 5/2019 «Запасы»; ПБУ 5/01; Методические указания по инвентаризации (Приказ Минфина от 13.06.1995 N49); ГОСТ ISO 15394-2013 (маркировка упаковки штрихкодами).

### 25.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Сканирование | + | + | + | - | - |
| Приёмка | + | + | + | - | - |
| Выдача | + | + | + | - | - |
| Инвентаризация | + | + | + | + (просмотр) | - |
| Партии (CRUD) | + | + | - | + | - |
| Этикетки | + | + | + | - | - |
| Настройки штрихкодов | + | + | - | - | - |

### 25.7 Крайние случаи

1. **Штрихкод не найден** — предложить ручной поиск по названию/артикулу или создать новый материал.
2. **Один штрихкод — несколько единиц** (пачка арматуры) — ввод количества обязателен после скана.
3. **Камера не доступна** — fallback на ручной ввод кода. Поле ввода с экранной клавиатурой.
4. **Штрихкод повреждён** — QR-код имеет error correction level H (30% повреждения). Если не читается — ручной ввод.
5. **Offline-сканирование** — данные кэшируются в IndexedDB. Синхронизация при восстановлении связи. Проверка остатков происходит при синхронизации (может выявить расхождения).

### 25.8 UX Бенчмарк

**Лучший в классе:** Fieldwire — mobile barcode scanning для materials tracking. HCSS — warehouse management для строительства. Для складского учёта: Мой Склад — QR/barcode scanning, партионный учёт; 1С:Управление торговлей — полноценный штрихкод-учёт с ЕГАИС.

---

## Задача 26: Отчёт М-29 (списание материалов)

### 26.1 Описание

Форма М-29 «Отчёт о расходе основных материалов в строительстве в сопоставлении с расходом, определённым по производственным нормам» — обязательный документ для всех строительных организаций (утверждён ЦСУ СССР 24.11.1982 N613, действующий по сей день). М-29 сопоставляет фактический расход материалов с нормативным (рассчитанным по сметным нормам ГЭСН/ФЕР/ТЕР на выполненные объёмы работ). Перерасход требует объяснения (акт на списание), экономия — учитывается для KPI подрядчика.

Существующие сущности `M29Document` (document_date, project_id, contract_id, warehouse_location_id, ks2_id, status, notes) и `M29Line` (m29_id, spec_item_id, sequence, name, plannedQuantity, actualQuantity, unitOfMeasure, variance, notes) содержат базовую структуру. Задача расширяет: автоматический расчёт нормативного расхода из сметных норм * выполненные объёмы (КС-6а/КС-2), привязку фактического расхода к складским движениям (StockMovement), процентный анализ отклонений, генерацию PDF по форме М-29, автоматическое формирование актов на списание при перерасходе, связь с LimitFenceSheet (ЛЗВ).

### 26.2 Сущности БД

```sql
-- Расширение m29_documents
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS number VARCHAR(50);
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS responsible_id UUID;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255);
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS approved_by_id UUID;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255);
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS total_normative_cost NUMERIC(18,2) DEFAULT 0;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS total_actual_cost NUMERIC(18,2) DEFAULT 0;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS total_variance_cost NUMERIC(18,2) DEFAULT 0;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS total_variance_percent NUMERIC(8,2) DEFAULT 0;
ALTER TABLE m29_documents ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(1000);

-- Расширение m29_lines
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS material_id UUID;
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS material_code VARCHAR(100);
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS norm_code VARCHAR(100);
-- Код сметной нормы (ГЭСН/ФЕР)
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS work_volume NUMERIC(16,3);
-- Объём выполненных работ (из КС-6а)
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS work_unit VARCHAR(50);
-- Единица измерения работы
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS norm_per_unit NUMERIC(16,6);
-- Норма расхода на единицу работы
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS normative_quantity NUMERIC(16,3);
-- = work_volume * norm_per_unit
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS actual_quantity_from_stock NUMERIC(16,3);
-- Фактический расход из складских движений
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS variance_quantity NUMERIC(16,3);
-- = actual_quantity - normative_quantity
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS variance_percent NUMERIC(8,2);
-- = (variance_quantity / normative_quantity) * 100
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS unit_price NUMERIC(18,2);
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS normative_cost NUMERIC(18,2);
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(18,2);
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS variance_cost NUMERIC(18,2);
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS overuse_justified BOOLEAN DEFAULT FALSE;
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS overuse_justification TEXT;
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS stock_movement_ids JSONB DEFAULT '[]'::jsonb;
-- Ссылки на складские движения
ALTER TABLE m29_lines ADD COLUMN IF NOT EXISTS ks6a_record_id UUID;
-- Ссылка на запись КС-6а

-- Дополнительные индексы
CREATE INDEX IF NOT EXISTS idx_m29_org ON m29_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_m29_org_period ON m29_documents(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_m29_line_material ON m29_lines(material_id);

-- Акты на списание перерасхода
CREATE TABLE m29_write_off_acts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    m29_id                  UUID NOT NULL REFERENCES m29_documents(id),
    number                  VARCHAR(50) NOT NULL,
    act_date                DATE NOT NULL,
    reason                  TEXT NOT NULL,
    -- "Непредвиденные грунтовые условия", "Брак поставщика", "Перерасход из-за погодных условий"
    commission_members      JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{"name":"Иванов И.И.","position":"Начальник участка"},...]
    total_amount            NUMERIC(18,2) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, APPROVED, REJECTED
    approved_by_id          UUID,
    approved_at             TIMESTAMPTZ,
    pdf_url                 VARCHAR(1000),
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_m29_wo_org ON m29_write_off_acts(organization_id);
CREATE INDEX idx_m29_wo_m29 ON m29_write_off_acts(m29_id);

CREATE TABLE m29_write_off_lines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    write_off_act_id        UUID NOT NULL REFERENCES m29_write_off_acts(id),
    m29_line_id             UUID NOT NULL REFERENCES m29_lines(id),
    material_name           VARCHAR(500) NOT NULL,
    unit_of_measure         VARCHAR(50),
    overuse_quantity        NUMERIC(16,3) NOT NULL,
    unit_price              NUMERIC(18,2),
    total_amount            NUMERIC(18,2),
    justification           TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_m29_wo_line_act ON m29_write_off_lines(write_off_act_id);
```

### 26.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/m29` | ADMIN, MANAGER, ENGINEER, ACCOUNTANT | Список отчётов М-29 |
| GET | `/api/m29/{id}` | ADMIN, MANAGER, ENGINEER, ACCOUNTANT | Детали с позициями |
| POST | `/api/m29` | ADMIN, MANAGER | Создание отчёта |
| PUT | `/api/m29/{id}` | ADMIN, MANAGER | Обновление |
| POST | `/api/m29/{id}/calculate` | ADMIN, MANAGER | Автоматический расчёт (нормативный из смет + фактический из склада) |
| POST | `/api/m29/{id}/approve` | ADMIN, MANAGER | Утверждение |
| POST | `/api/m29/{id}/reject` | ADMIN, MANAGER | Возврат на доработку |
| GET | `/api/m29/{id}/print` | ADMIN, MANAGER, ENGINEER, ACCOUNTANT | PDF по форме М-29 |
| GET | `/api/m29/{id}/variance-analysis` | ADMIN, MANAGER | Детальный анализ отклонений |
| POST | `/api/m29/{id}/write-off-act` | ADMIN, MANAGER | Создание акта на списание перерасхода |
| GET | `/api/m29-write-off-acts` | ADMIN, MANAGER, ACCOUNTANT | Список актов на списание |
| GET | `/api/m29-write-off-acts/{id}` | ADMIN, MANAGER, ACCOUNTANT | Детали акта |
| POST | `/api/m29-write-off-acts/{id}/approve` | ADMIN, MANAGER | Утверждение акта |
| GET | `/api/m29-write-off-acts/{id}/print` | ADMIN, MANAGER, ACCOUNTANT | PDF акта |
| GET | `/api/m29/summary/{projectId}` | ADMIN, MANAGER | Сводка по проекту за все периоды |

### 26.4 UI Экраны

1. **Реестр М-29** (`/warehouse/m29`) — DataTable: номер, проект, период, ответственный, нормативный расход (руб.), фактический расход (руб.), отклонение (% + цвет: зелёный=экономия, красный=перерасход), статус. Фильтры: проект, период, статус.

2. **Детали М-29** (`/warehouse/m29/:id`) — Заголовок с метриками: нормативный расход, фактический, отклонение (сумма + %). Таблица позиций: материал, код нормы, объём работ, норма на единицу, нормативный расход, фактический расход, отклонение (quantity + %), цена, стоимость отклонения. Цветовая подсветка строк: зелёный = экономия, красный = перерасход > 5%, жёлтый = перерасход 0-5%. Для строк с перерасходом — кнопка «Обосновать» / «Создать акт на списание».

3. **Визуализация отклонений** — Horizontal bar chart: материалы отсортированы по абсолютному отклонению. Красные бары = перерасход, зелёные = экономия. Drill-down по клику: какие складские движения формируют фактический расход.

4. **Форма создания** (`/warehouse/m29/new`) — выбор проекта → период → кнопка «Рассчитать автоматически». Система подтягивает: нормативный расход из сметных данных * объёмы КС-6а; фактический из StockMovement типа ISSUE за период. Ручная корректировка каждой строки.

5. **Акт на списание** (`/warehouse/m29/:id/write-off`) — форма: дата, причина перерасхода (select: непредвиденные условия / брак / технологические потери / прочее), состав комиссии, таблица позиций (из строк М-29 с перерасходом), обоснование по каждой позиции. Печатная форма PDF.

6. **Сводный отчёт по проекту** (`/warehouse/m29/summary/:projectId`) — аккумулятивный М-29 за всё время проекта. Trend-chart: накопительное отклонение по месяцам. Рейтинг материалов по перерасходу (топ-10).

### 26.5 Бизнес-правила и валидации

1. **Автоматический расчёт нормативного расхода:** `normative_quantity = work_volume * norm_per_unit`. `work_volume` берётся из КС-6а записей за период. `norm_per_unit` — из сметной нормы (ГЭСН/ФЕР ресурсная часть).
2. **Автоматический расчёт фактического расхода:** сумма `StockMovementLine.quantity` где `StockMovement.type = ISSUE` и `projectId = m29.projectId` и `movementDate BETWEEN period_start AND period_end`, сгруппированная по `materialId`.
3. **Порог перерасхода:** организация настраивает допустимый порог (по умолчанию 5%). При превышении — строка подсвечивается красным, требуется обоснование (`overuse_justified=true` + `overuse_justification`).
4. **Акт на списание обязателен** если суммарный перерасход по документу М-29 превышает порог (настраиваемый, по умолчанию 50 000 руб.).
5. **Связь с ЛЗВ:** при наличии LimitFenceSheet — нормативный расход дополнительно сверяется с лимитом ЛЗВ. Превышение лимита — отдельное предупреждение.
6. **Утверждение:** документ М-29 утверждается главным инженером (MANAGER). Утверждённый документ не подлежит редактированию.
7. **Нормативная база:** Форма М-29 (утв. ЦСУ СССР 24.11.1982 N613); ФСБУ 5/2019 «Запасы»; МДС 81-35.2004 (методика определения стоимости строительной продукции); ГЭСН-2001 (ресурсная часть).

### 26.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр | + | + | + (свои проекты) | + | + |
| Создание | + | + | - | - | - |
| Автоматический расчёт | + | + | - | - | - |
| Редактирование | + | + | + (корректировка строк) | - | - |
| Утверждение | + | + | - | - | - |
| Акт на списание | + | + | - | + (просмотр) | - |
| Печать PDF | + | + | + | + | + |

### 26.7 Крайние случаи

1. **Нет сметных норм** для материала — строка М-29 заполняется только фактическим расходом. Нормативный = 0. Предупреждение «Норма расхода не определена».
2. **Материал выдан, но не использован** (остаток на площадке) — возвратное движение (StockMovement типа RETURN) уменьшает фактический расход.
3. **Перемещение между проектами** — материал списан на проект А, перемещён на проект Б. В М-29 проекта А — фактический расход увеличен. В М-29 проекта Б — уменьшен (или приходуется отдельным движением).
4. **Период М-29 не совпадает с периодом КС-2** — допускается. Объёмы берутся из КС-6а (которая ведётся ежедневно), а не из КС-2 (ежемесячно).

### 26.8 UX Бенчмарк

**Лучший в классе:** 1С:Управление строительной организацией — М-29 с привязкой к сметам. Для нишевого функционала: ГРАНД-Смета — ресурсная ведомость. Нет международных аналогов (М-29 — уникальный российский документ).

---

## Задача 27: Доска распределения ресурсов по проектам

### 27.1 Описание

Визуальная доска (Resource Allocation Board) для распределения рабочей силы и бригад между проектами организации. Строительная компания со множеством параллельных проектов (5-50+) сталкивается с проблемой оптимального распределения ограниченных ресурсов: квалифицированные бригады, техника, ИТР. Решения принимаются реактивно («проект кричит — перебрасываем людей»), что приводит к простоям, задержкам графика и перерасходу ФОТ.

Существующий модуль HR содержит `CrewPage.tsx` (список бригад с проектами, статусами, специализацией), `CrewAssignment` (привязка бригады к проекту), `Employee` (работник с должностью и навыками). Существующий модуль planning содержит `ResourceAllocationService`, `WbsNodeService` (план работ). Задача создаёт визуальный интерфейс для: Gantt-подобной доски ресурсов (строки = бригады/сотрудники, столбцы = дни/недели, ячейки = проекты), drag-and-drop перемещения, обнаружения конфликтов (один человек на двух проектах), skills-based matching (подбор по навыкам), утилизации ресурсов, прогнозирования потребности.

### 27.2 Сущности БД

```sql
CREATE TABLE resource_allocations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    resource_type           VARCHAR(20) NOT NULL,
    -- CREW, EMPLOYEE, VEHICLE
    resource_id             UUID NOT NULL,
    -- crew_id / employee_id / vehicle_id
    resource_name           VARCHAR(255) NOT NULL,
    project_id              UUID NOT NULL,
    project_name            VARCHAR(255),
    allocation_start        DATE NOT NULL,
    allocation_end          DATE NOT NULL,
    hours_per_day           NUMERIC(4,1) DEFAULT 8.0,
    allocation_percent      NUMERIC(5,2) DEFAULT 100.0,
    -- 100% = full-time, 50% = half-time
    role_on_project         VARCHAR(100),
    -- "Бригада монолитчиков", "Крановщик", "Прораб"
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    -- PLANNED, CONFIRMED, ACTIVE, COMPLETED, CANCELLED
    priority                INTEGER DEFAULT 5,
    -- 1=highest, 10=lowest
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ra_org ON resource_allocations(organization_id);
CREATE INDEX idx_ra_resource ON resource_allocations(resource_type, resource_id);
CREATE INDEX idx_ra_project ON resource_allocations(project_id);
CREATE INDEX idx_ra_dates ON resource_allocations(allocation_start, allocation_end);
CREATE INDEX idx_ra_org_dates ON resource_allocations(organization_id, allocation_start, allocation_end);
CREATE INDEX idx_ra_status ON resource_allocations(status);

CREATE TABLE resource_demands (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    project_id              UUID NOT NULL,
    wbs_node_id             UUID,
    demand_start            DATE NOT NULL,
    demand_end              DATE NOT NULL,
    resource_type           VARCHAR(20) NOT NULL,
    -- CREW, EMPLOYEE, VEHICLE
    specialization          VARCHAR(100),
    -- "монолитчики", "электрики", "сварщики_НАКС"
    quantity_needed         INTEGER NOT NULL DEFAULT 1,
    quantity_allocated      INTEGER NOT NULL DEFAULT 0,
    priority                INTEGER DEFAULT 5,
    status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    -- OPEN, PARTIALLY_FILLED, FILLED, CANCELLED
    notes                   TEXT,
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_rd_org ON resource_demands(organization_id);
CREATE INDEX idx_rd_project ON resource_demands(project_id);
CREATE INDEX idx_rd_dates ON resource_demands(demand_start, demand_end);
CREATE INDEX idx_rd_spec ON resource_demands(specialization);
CREATE INDEX idx_rd_status ON resource_demands(status);

-- Skills/certifications для matching
CREATE TABLE resource_skills (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type           VARCHAR(20) NOT NULL,
    resource_id             UUID NOT NULL,
    skill_code              VARCHAR(50) NOT NULL,
    skill_name              VARCHAR(255) NOT NULL,
    proficiency_level       INTEGER DEFAULT 3,
    -- 1-5 (1=начинающий, 5=эксперт)
    -- BaseEntity
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_rs_resource ON resource_skills(resource_type, resource_id);
CREATE INDEX idx_rs_skill ON resource_skills(skill_code);
```

### 27.3 API Endpoints

| Метод | URL | Роли | Описание |
|-------|-----|------|----------|
| GET | `/api/resource-allocations` | ADMIN, MANAGER | Все аллокации с фильтрами (dateRange, projectId, resourceType, resourceId) |
| GET | `/api/resource-allocations/board` | ADMIN, MANAGER | Данные для доски (группировка по ресурсам, агрегация по периодам) |
| POST | `/api/resource-allocations` | ADMIN, MANAGER | Создание аллокации |
| PUT | `/api/resource-allocations/{id}` | ADMIN, MANAGER | Обновление (drag-and-drop: изменение дат и/или проекта) |
| DELETE | `/api/resource-allocations/{id}` | ADMIN, MANAGER | Удаление |
| POST | `/api/resource-allocations/batch` | ADMIN, MANAGER | Массовое создание (перенос бригады: все сотрудники) |
| GET | `/api/resource-allocations/conflicts` | ADMIN, MANAGER | Обнаружение конфликтов (один ресурс на >100% за период) |
| GET | `/api/resource-allocations/utilization` | ADMIN, MANAGER | Утилизация ресурсов (% по каждому ресурсу за период) |
| GET | `/api/resource-demands` | ADMIN, MANAGER | Потребности проектов |
| POST | `/api/resource-demands` | ADMIN, MANAGER | Создание потребности |
| PUT | `/api/resource-demands/{id}` | ADMIN, MANAGER | Обновление |
| GET | `/api/resource-demands/unmet` | ADMIN, MANAGER | Незакрытые потребности |
| POST | `/api/resource-allocations/suggest` | ADMIN, MANAGER | AI-подбор: на основе skills, доступности, географии |
| GET | `/api/resource-allocations/what-if` | ADMIN, MANAGER | Сценарий «что если» (перенос ресурса: влияние на другие проекты) |
| GET | `/api/resource-skills/{resourceType}/{resourceId}` | ADMIN, MANAGER | Навыки ресурса |
| POST | `/api/resource-skills` | ADMIN, MANAGER | Добавление навыка |

### 27.4 UI Экраны

1. **Доска ресурсов** (`/resources/board`) — Основной экран. Горизонтальная Gantt-подобная сетка: строки = ресурсы (бригады/сотрудники/техника), столбцы = дни или недели (переключатель). Ячейки = цветные бары аллокаций (цвет = проект). Drag-and-drop: перемещение бара по горизонтали (изменение дат) и вертикали (смена ресурса). Resize: растягивание бара (изменение длительности). Double-click — редактирование деталей. Переключатель масштаба: день / неделя / месяц. Фильтры: тип ресурса, специализация, проект, только с конфликтами.

2. **Визуализация конфликтов** — строки с конфликтом (allocation > 100%) подсвечиваются красным. Полоса перегрузки отображается отдельным баром. Tooltip: «Иванов И.И. назначен на 2 проекта в период 01.03-15.03».

3. **Потребности проектов** (`/resources/demands`) — DataTable: проект, специализация, период, требуемое количество, выделено, дефицит (красный бейдж), приоритет. Кнопка «Подобрать ресурсы» → открытие панели с предложенными кандидатами (skills-based matching).

4. **Утилизация** (`/resources/utilization`) — Heatmap: строки = ресурсы, столбцы = недели. Цвет: зелёный (60-90%), жёлтый (40-60%), красный (<40% = простой или >100% = перегрузка). MetricCards: средняя утилизация, количество простаивающих, количество перегруженных.

5. **What-if сценарий** — Панель: «Если перенести [Бригада монолитчиков] с [ЖК Солнечный] на [ЖК Парковый] с [дата] по [дата]». Результат: влияние на график проекта ЖК Солнечный (задержка N дней), высвобождение потребности ЖК Парковый.

6. **Панель подбора** — правая боковая панель. При клике на незакрытую потребность: список доступных ресурсов с match-score (на основе skills, доступности, текущего местоположения). Кнопка «Назначить» создаёт аллокацию одним кликом.

### 27.5 Бизнес-правила и валидации

1. **Конфликт:** суммарный allocation_percent ресурса за период не должен превышать 100%. При превышении — предупреждение (не блокировка). ADMIN может принудительно назначить.
2. **Skills-matching:** score = SUM(skill_match * proficiency_weight). Если потребность требует «сварщики_НАКС» — ищутся ресурсы со skill_code=«welding_NAKS» и proficiency_level >= 3.
3. **Каскадное перемещение бригады:** при назначении CREW на проект — все сотрудники бригады (через CrewAssignment) автоматически назначаются.
4. **Связь с графиком:** resource_demands могут создаваться автоматически из WBS (ResourceAllocationService) на основе типов работ и плановых объёмов.
5. **Утилизация:** `utilization = SUM(allocated_hours) / available_hours * 100`. Available_hours = рабочих дней * hours_per_day.
6. **Нормативная база:** PMI PMBOK Ch.9 (Resource Management); СП 48.13330.2019 (организация строительства — ресурсное обеспечение).

### 27.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр доски | + | + | + (свои проекты) | - | + |
| Создание аллокации | + | + | - | - | - |
| Drag-and-drop | + | + | - | - | - |
| Потребности (CRUD) | + | + | - | - | - |
| Утилизация | + | + | - | - | + |
| Skills matching | + | + | - | - | - |
| What-if | + | + | - | - | - |

### 27.7 Крайние случаи

1. **Работник уволен в середине аллокации** — аллокация автоматически сокращается до даты увольнения. Потребность пересчитывается как PARTIALLY_FILLED.
2. **Проект приостановлен** — все аллокации на проект переводятся в CANCELLED. Ресурсы высвобождаются.
3. **Вахтовый метод** — аллокация с паттерном (30/30 или 60/30). Система учитывает ротацию.
4. **>200 ресурсов** — виртуальный скроллинг на доске. Группировка по специализации с collapse/expand.

### 27.8 UX Бенчмарк

**Лучший в классе:** Bridgit Bench — лучшая resource allocation board для строительства; drag-and-drop, skills matching, scenario planning. InEight — multi-project resource optimization. Procore (Resource Management, ноя 2024) — workforce planning. Для российского рынка: Pragmacore — ресурсное планирование; 1С:Управление строительной организацией — распределение бригад.

---

## Задача 28: Чек-листы контроля качества

### 28.1 Описание

Модуль структурированных чек-листов для всех видов контроля качества строительных работ: входной контроль материалов (ГОСТ 24297-2013), операционный контроль (промежуточный), приёмочный контроль скрытых работ, итоговый контроль перед сдачей. В строительной отрасли России контроль качества регулируется СП 48.13330.2019 «Организация строительства» (раздел 7 — контроль качества), ГОСТ Р ИСО 9001-2015 (требования к СМК), РД-11-02-2006 (требования к ведению исполнительной документации). Каждый вид работ (бетонирование, армирование, гидроизоляция, кладка, сварка и т.д.) требует свой чек-лист с уникальным набором контрольных точек (checkpoints), ссылок на нормативные документы (СНиП/СП/ГОСТ), допустимых отклонений.

Текущая сущность `QualityCheck` хранит только общую информацию о проверке (name, description, plannedDate, actualDate, result, status, findings, attachmentUrls), но не содержит: шаблонов чек-листов с настраиваемыми секциями и пунктами, индивидуальных результатов по каждому пункту (PASS/FAIL/NA с измеренными значениями), привязки к допускам (ToleranceRule), фото-фиксации по каждому пункту, цифровой подписи инспектора, истории повторных проверок, аналитики по паттернам несоответствий.

Задача создаёт систему «шаблон → экземпляр»: ADMIN/MANAGER создаёт шаблоны чек-листов с секциями и пунктами; при инициации проверки из шаблона генерируется конкретный экземпляр (checklist_instance), привязанный к QualityCheck. Инспектор на площадке проходит пункт за пунктом, фиксирует результат, измеренное значение, фото. При обнаружении FAIL — автоматически создаётся NonConformance. По завершении — формируется акт проверки (PDF) со всеми результатами и фото.

### 28.2 Сущности БД

```sql
-- Java enum: ChecklistItemType
-- CHECKBOX, NUMERIC_MEASUREMENT, TEXT_OBSERVATION, PHOTO_REQUIRED, SIGNATURE

-- Java enum: ChecklistItemResult
-- PASS, FAIL, NOT_APPLICABLE, SKIPPED, PENDING

-- Java enum: ChecklistInstanceStatus
-- NOT_STARTED, IN_PROGRESS, COMPLETED, APPROVED, REJECTED

-- =====================================================
-- Шаблон чек-листа (справочник)
-- =====================================================
CREATE TABLE checklist_templates (
    -- BaseEntity fields (id UUID PK, created_at, updated_at, created_by, updated_by, version, deleted)
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    code              VARCHAR(30)  NOT NULL,
    name              VARCHAR(500) NOT NULL,
    description       TEXT,
    check_type        VARCHAR(30)  NOT NULL,  -- CheckType: INCOMING_MATERIAL, INTERMEDIATE_WORK, HIDDEN_WORK, FINAL, LABORATORY
    work_type         VARCHAR(100),           -- тип работ: «бетонирование», «армирование», «кладка», «сварка»...
    normative_docs    TEXT,                   -- ссылки: «СП 70.13330.2012 п.5.3.1; ГОСТ 7473-2010 п.4»
    revision          INTEGER      NOT NULL DEFAULT 1,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    is_mandatory      BOOLEAN      NOT NULL DEFAULT FALSE,  -- обязательный для данного типа работ
    estimated_duration_min INTEGER,            -- ожидаемое время заполнения (минуты)

    CONSTRAINT uq_checklist_template_org_code UNIQUE (organization_id, code)
);

CREATE INDEX idx_clt_org ON checklist_templates(organization_id);
CREATE INDEX idx_clt_org_type ON checklist_templates(organization_id, check_type);
CREATE INDEX idx_clt_org_work ON checklist_templates(organization_id, work_type);
CREATE INDEX idx_clt_active ON checklist_templates(organization_id, is_active);

-- =====================================================
-- Секция шаблона (группировка пунктов)
-- =====================================================
CREATE TABLE checklist_template_sections (
    -- BaseEntity fields
    template_id       UUID         NOT NULL REFERENCES checklist_templates(id),
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    is_critical       BOOLEAN      NOT NULL DEFAULT FALSE,  -- если FAIL хоть одного пункта секции → весь чек-лист FAIL

    CONSTRAINT uq_cl_section_order UNIQUE (template_id, sort_order)
);

CREATE INDEX idx_cls_template ON checklist_template_sections(template_id);

-- =====================================================
-- Пункт шаблона (контрольная точка)
-- =====================================================
CREATE TABLE checklist_template_items (
    -- BaseEntity fields
    section_id        UUID          NOT NULL REFERENCES checklist_template_sections(id),
    sort_order        INTEGER       NOT NULL DEFAULT 0,
    item_type         VARCHAR(30)   NOT NULL DEFAULT 'CHECKBOX',  -- ChecklistItemType
    label             VARCHAR(1000) NOT NULL,                     -- «Проверить вертикальность (отвес)»
    hint_text         TEXT,                                        -- подсказка инспектору
    normative_ref     VARCHAR(500),                               -- «СП 70.13330.2012 табл.5.12, п.3»
    is_required       BOOLEAN       NOT NULL DEFAULT TRUE,
    is_critical       BOOLEAN       NOT NULL DEFAULT FALSE,        -- FAIL по этому пункту → FAIL секции
    -- Для NUMERIC_MEASUREMENT:
    unit              VARCHAR(30),                                 -- «мм», «°C», «МПа», «%»
    min_value         NUMERIC(18,4),                               -- допустимый минимум
    max_value         NUMERIC(18,4),                               -- допустимый максимум
    target_value      NUMERIC(18,4),                               -- целевое значение
    tolerance_rule_id UUID          REFERENCES tolerance_rules(id), -- связь с существующим ToleranceRule
    -- Для PHOTO_REQUIRED:
    min_photos        INTEGER       DEFAULT 0,                     -- минимум фото для пункта

    CONSTRAINT uq_cl_item_order UNIQUE (section_id, sort_order)
);

CREATE INDEX idx_cli_section ON checklist_template_items(section_id);

-- =====================================================
-- Экземпляр чек-листа (заполненный)
-- =====================================================
CREATE TABLE checklist_instances (
    -- BaseEntity fields
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    template_id       UUID         NOT NULL REFERENCES checklist_templates(id),
    quality_check_id  UUID         NOT NULL REFERENCES quality_checks(id),
    project_id        UUID         NOT NULL REFERENCES projects(id),
    code              VARCHAR(30)  NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'NOT_STARTED',  -- ChecklistInstanceStatus
    inspector_id      UUID         REFERENCES users(id),
    inspector_name    VARCHAR(255),
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    approved_by_id    UUID         REFERENCES users(id),
    approved_at       TIMESTAMPTZ,
    location          VARCHAR(500),              -- конкретное место на объекте
    weather_conditions VARCHAR(200),             -- для наружных работ: «+5°C, ветер 3 м/с, без осадков»
    total_items       INTEGER      NOT NULL DEFAULT 0,
    passed_items      INTEGER      NOT NULL DEFAULT 0,
    failed_items      INTEGER      NOT NULL DEFAULT 0,
    na_items          INTEGER      NOT NULL DEFAULT 0,
    completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    overall_result    VARCHAR(30)  NOT NULL DEFAULT 'PENDING',     -- CheckResult
    notes             TEXT,
    inspector_signature TEXT,       -- base64 подпись на экране

    CONSTRAINT uq_checklist_inst_org_code UNIQUE (organization_id, code)
);

CREATE INDEX idx_ci_org ON checklist_instances(organization_id);
CREATE INDEX idx_ci_org_project ON checklist_instances(organization_id, project_id);
CREATE INDEX idx_ci_quality_check ON checklist_instances(quality_check_id);
CREATE INDEX idx_ci_template ON checklist_instances(template_id);
CREATE INDEX idx_ci_status ON checklist_instances(organization_id, status);
CREATE INDEX idx_ci_inspector ON checklist_instances(inspector_id);
CREATE INDEX idx_ci_completed ON checklist_instances(completed_at);

-- =====================================================
-- Результат по пункту (заполненный инспектором)
-- =====================================================
CREATE TABLE checklist_item_results (
    -- BaseEntity fields
    instance_id       UUID          NOT NULL REFERENCES checklist_instances(id),
    template_item_id  UUID          NOT NULL REFERENCES checklist_template_items(id),
    section_title     VARCHAR(500)  NOT NULL,     -- денормализация для отчётов
    item_label        VARCHAR(1000) NOT NULL,     -- денормализация
    sort_order        INTEGER       NOT NULL DEFAULT 0,
    result            VARCHAR(30)   NOT NULL DEFAULT 'PENDING',  -- ChecklistItemResult
    -- Для NUMERIC_MEASUREMENT:
    measured_value    NUMERIC(18,4),
    is_within_tolerance BOOLEAN,
    -- Для TEXT_OBSERVATION:
    observation_text  TEXT,
    -- Фото:
    photo_urls        JSONB         DEFAULT '[]'::jsonb,
    -- Метаданные:
    checked_at        TIMESTAMPTZ,
    checked_by_id     UUID          REFERENCES users(id),
    comment           TEXT,
    non_conformance_id UUID         REFERENCES non_conformances(id),  -- авто-создаётся при FAIL

    CONSTRAINT uq_cl_result UNIQUE (instance_id, template_item_id)
);

CREATE INDEX idx_cir_instance ON checklist_item_results(instance_id);
CREATE INDEX idx_cir_result ON checklist_item_results(instance_id, result);
CREATE INDEX idx_cir_nc ON checklist_item_results(non_conformance_id);

-- =====================================================
-- Аналитика по шаблонам (материализованное представление)
-- =====================================================
CREATE MATERIALIZED VIEW mv_checklist_analytics AS
SELECT
    ci.organization_id,
    ci.template_id,
    ct.name AS template_name,
    ct.check_type,
    ct.work_type,
    ci.project_id,
    COUNT(DISTINCT ci.id) AS total_inspections,
    COUNT(DISTINCT ci.id) FILTER (WHERE ci.overall_result = 'PASS') AS passed_inspections,
    COUNT(DISTINCT ci.id) FILTER (WHERE ci.overall_result = 'FAIL') AS failed_inspections,
    AVG(ci.completion_percent) AS avg_completion,
    -- Топ-проблемных пунктов
    COUNT(DISTINCT cir.id) FILTER (WHERE cir.result = 'FAIL') AS total_failed_items,
    AVG(EXTRACT(EPOCH FROM (ci.completed_at - ci.started_at)) / 60)::INTEGER AS avg_duration_min
FROM checklist_instances ci
JOIN checklist_templates ct ON ct.id = ci.template_id
LEFT JOIN checklist_item_results cir ON cir.instance_id = ci.id
WHERE ci.deleted = FALSE
GROUP BY ci.organization_id, ci.template_id, ct.name, ct.check_type, ct.work_type, ci.project_id;

CREATE UNIQUE INDEX idx_mv_cl_analytics ON mv_checklist_analytics(organization_id, template_id, project_id);

-- ALTER для связи с существующей QualityCheck
ALTER TABLE quality_checks ADD COLUMN IF NOT EXISTS checklist_instance_id UUID REFERENCES checklist_instances(id);
ALTER TABLE quality_checks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_qc_org ON quality_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_qc_checklist ON quality_checks(checklist_instance_id);
```

### 28.3 API Endpoints

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| **Шаблоны** | | | |
| GET | `/api/quality/checklist-templates` | Список шаблонов с фильтрами (checkType, workType, isActive) | ADMIN, MANAGER, ENGINEER |
| GET | `/api/quality/checklist-templates/{id}` | Детали шаблона со всеми секциями и пунктами | ADMIN, MANAGER, ENGINEER |
| POST | `/api/quality/checklist-templates` | Создание шаблона | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-templates/{id}` | Обновление шаблона (создаёт новую revision) | ADMIN, MANAGER |
| DELETE | `/api/quality/checklist-templates/{id}` | Soft-delete шаблона | ADMIN |
| POST | `/api/quality/checklist-templates/{id}/clone` | Клонирование шаблона | ADMIN, MANAGER |
| POST | `/api/quality/checklist-templates/{id}/import` | Импорт шаблона из JSON/Excel | ADMIN |
| GET | `/api/quality/checklist-templates/{id}/export` | Экспорт шаблона в JSON | ADMIN, MANAGER |
| **Секции** | | | |
| POST | `/api/quality/checklist-templates/{templateId}/sections` | Добавление секции | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-templates/{templateId}/sections/{sectionId}` | Обновление секции | ADMIN, MANAGER |
| DELETE | `/api/quality/checklist-templates/{templateId}/sections/{sectionId}` | Удаление секции | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-templates/{templateId}/sections/reorder` | Изменение порядка секций | ADMIN, MANAGER |
| **Пункты** | | | |
| POST | `/api/quality/checklist-sections/{sectionId}/items` | Добавление пункта | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-items/{itemId}` | Обновление пункта | ADMIN, MANAGER |
| DELETE | `/api/quality/checklist-items/{itemId}` | Удаление пункта | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-sections/{sectionId}/items/reorder` | Изменение порядка пунктов | ADMIN, MANAGER |
| **Экземпляры (заполнение)** | | | |
| POST | `/api/quality/checklist-instances` | Создание экземпляра из шаблона + привязка к QualityCheck | ADMIN, MANAGER, ENGINEER |
| GET | `/api/quality/checklist-instances` | Список экземпляров (фильтры: projectId, status, inspectorId, dateRange) | ADMIN, MANAGER, ENGINEER, VIEWER |
| GET | `/api/quality/checklist-instances/{id}` | Детали экземпляра со всеми результатами | ADMIN, MANAGER, ENGINEER, VIEWER |
| PUT | `/api/quality/checklist-instances/{id}/start` | Начать заполнение (NOT_STARTED → IN_PROGRESS) | ENGINEER |
| PUT | `/api/quality/checklist-instances/{id}/items/{itemResultId}` | Обновить результат пункта | ENGINEER |
| PUT | `/api/quality/checklist-instances/{id}/items/batch` | Массовое обновление пунктов (offline-sync) | ENGINEER |
| PUT | `/api/quality/checklist-instances/{id}/complete` | Завершить заполнение (IN_PROGRESS → COMPLETED) | ENGINEER |
| PUT | `/api/quality/checklist-instances/{id}/approve` | Утвердить (COMPLETED → APPROVED) | ADMIN, MANAGER |
| PUT | `/api/quality/checklist-instances/{id}/reject` | Отклонить (COMPLETED → REJECTED, с комментарием) | ADMIN, MANAGER |
| POST | `/api/quality/checklist-instances/{id}/signature` | Загрузить подпись инспектора (base64 canvas) | ENGINEER |
| GET | `/api/quality/checklist-instances/{id}/pdf` | Генерация PDF-отчёта | ADMIN, MANAGER, ENGINEER |
| **Аналитика** | | | |
| GET | `/api/quality/checklist-analytics` | Сводная аналитика по шаблонам/проектам | ADMIN, MANAGER |
| GET | `/api/quality/checklist-analytics/failure-patterns` | Топ-проблемных пунктов (Парето) | ADMIN, MANAGER |
| POST | `/api/quality/checklist-analytics/refresh` | Обновление материализованного представления | ADMIN |

### 28.4 Экраны (UI)

**Экран 28-A: Управление шаблонами чек-листов**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Шаблоны чек-листов»                               │
│  subtitle: «Управление шаблонами контроля качества»              │
│  breadcrumbs: Главная > Качество > Шаблоны чек-листов           │
│  actions: [+ Создать шаблон] [Импорт]                           │
├─────────────────────────────────────────────────────────────────┤
│  Фильтры: [Тип контроля ▾] [Вид работ ▾] [Активные ☑]         │
│                                                                 │
│  DataTable:                                                     │
│  ┌──────┬──────────────┬─────────┬──────────┬────┬───────────┐  │
│  │ Код  │ Название     │ Тип     │ Работы   │Rev │ Действия  │  │
│  ├──────┼──────────────┼─────────┼──────────┼────┼───────────┤  │
│  │CL-01 │Бетонирование │Промежут.│Бетонные  │ 3  │ ✎ 📋 ⬇   │  │
│  │      │фундаментов   │         │          │    │           │  │
│  │CL-02 │Входной       │Входной  │Арматура  │ 2  │ ✎ 📋 ⬇   │  │
│  │      │контроль      │контроль │          │    │           │  │
│  │      │арматуры      │         │          │    │           │  │
│  │CL-03 │Кладка стен   │Промежут.│Каменные  │ 1  │ ✎ 📋 ⬇   │  │
│  └──────┴──────────────┴─────────┴──────────┴────┴───────────┘  │
│  📋=клонировать  ⬇=экспорт  ✎=редактировать                    │
└─────────────────────────────────────────────────────────────────┘
```

**Экран 28-B: Конструктор шаблона чек-листа**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Шаблон: Бетонирование фундаментов (CL-01 rev.3)» │
│  breadcrumbs: ... > Шаблоны > Редактирование                    │
│  actions: [Предпросмотр] [Сохранить]                            │
├─────────────────────────────────────────────────────────────────┤
│  Основные данные:                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Код: [CL-01]  Название: [Бетонирование фундаментов   ]│    │
│  │ Тип контроля: [Промежуточный ▾]  Вид работ: [Бетонные]│    │
│  │ Нормативные документы: [СП 70.13330.2012 п.5.3; ...]  │    │
│  │ ☑ Обязательный   Время заполнения: [45] мин           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Секции и пункты (drag-and-drop сортировка):                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ⠿ Секция 1: «Подготовительные работы» [☐ Критическая]  │    │
│  │   ├ ☑ Опалубка установлена по проекту     [CHECKBOX]    │    │
│  │   ├ ☑ Армирование соответствует чертежу   [CHECKBOX]    │    │
│  │   ├ 📐 Отклонение оси (мм)               [NUMERIC]     │    │
│  │   │     min: 0  max: 20  target: 0  ед: мм             │    │
│  │   ├ 📷 Фото арматурного каркаса           [PHOTO_REQ]   │    │
│  │   │     min_photos: 2                                   │    │
│  │   └ [+ Добавить пункт]                                 │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ⠿ Секция 2: «Укладка бетонной смеси» [☑ Критическая]   │    │
│  │   ├ ☑ Температура смеси (°C)              [NUMERIC]     │    │
│  │   │     min: 5  max: 35  target: 20  ед: °C            │    │
│  │   ├ ☑ Класс бетона соответствует проекту  [CHECKBOX]    │    │
│  │   ├ 📝 Способ укладки                     [TEXT_OBS]    │    │
│  │   └ [+ Добавить пункт]                                 │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ [+ Добавить секцию]                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: react-beautiful-dnd (или @dnd-kit/sortable) для перетаскивания секций и пунктов. Каждый пункт — аккордеон с полями: label, item_type, hint_text, normative_ref, is_required, is_critical, параметры numeric (unit/min/max/target/tolerance_rule_id), min_photos. Форма react-hook-form + useFieldArray для динамического добавления.

**Экран 28-C: Заполнение чек-листа инспектором (мобильно-ориентированный)**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Проверка: CL-01-2026-0147»                       │
│  subtitle: Бетонирование фундаментов | Объект: ЖК «Весна»      │
│  breadcrumbs: Качество > Чек-листы > Заполнение                 │
│  progress: ████████░░░░░░ 58% (14/24)                           │
├─────────────────────────────────────────────────────────────────┤
│  ☁ Погодные условия: [+5°C, ветер 3 м/с, без осадков     ]     │
│  📍 Локация: [Секция 3, оси А-В / 1-5, фундамент Ф-12   ]     │
├─────────────────────────────────────────────────────────────────┤
│  Секция 1: Подготовительные работы ✅ (4/4)                      │
│  [свёрнута — все пункты PASS]                                   │
│                                                                 │
│  Секция 2: Укладка бетонной смеси ⏳ (2/5)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ✅ 2.1 Температура смеси (°C)                           │    │
│  │     Измерено: [18.5]  Допуск: 5–35°C  ✓ В норме       │    │
│  │                                                         │    │
│  │ ❌ 2.2 Класс бетона соответствует проекту               │    │
│  │     [FAIL]  Комментарий: [Привезли B20 вместо B25    ]  │    │
│  │     📷 [фото1.jpg] [фото2.jpg] [+ Добавить фото]       │    │
│  │     ⚠ Создано несоответствие NC-2026-0089               │    │
│  │                                                         │    │
│  │ ⬜ 2.3 Способ укладки                                   │    │
│  │     [Бетононасосом, с вибрированием              ____]  │    │
│  │                                                         │    │
│  │ ⬜ 2.4 Высота свободного падения (м)                    │    │
│  │     Измерено: [___]  Допуск: ≤1.5м  ед: м              │    │
│  │                                                         │    │
│  │ ⬜ 2.5 Фото процесса укладки                            │    │
│  │     📷 [+ Сделать фото] (мин. 2 фото)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Секция 3: Уход за бетоном ⬜ (0/3)                              │
│  [свёрнута — ещё не начата]                                     │
├─────────────────────────────────────────────────────────────────┤
│  [Сохранить черновик]  [Завершить и подписать →]                 │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: мобильно-ориентированный layout (max-w-2xl mx-auto). Аккордеон по секциям с автоматическим сворачиванием завершённых. Для NUMERIC_MEASUREMENT — Input type="number" с автоматической проверкой допуска (зелёная/красная подсветка бордера). Для PHOTO_REQUIRED — интеграция с камерой через `<input type="file" capture="environment" accept="image/*">`. При FAIL автоматически показывается поле комментария + кнопка создания NonConformance. Offline-режим: данные кешируются в IndexedDB (offlineQueue store), синхронизируются при восстановлении связи через batch endpoint.

**Экран 28-D: Подпись и завершение**
```
┌─────────────────────────────────────────────────────────────────┐
│  Итого: 24 пункта | ✅ 21 PASS | ❌ 2 FAIL | ➖ 1 N/A          │
│                                                                 │
│  Несоответствия (2):                                            │
│  • NC-2026-0089: Класс бетона B20 вместо B25 [CRITICAL]        │
│  • NC-2026-0090: Отклонение оси 22мм (допуск 20мм) [MINOR]    │
│                                                                 │
│  Заключение: [Условно соответствует ▾]                          │
│  Комментарий: [Работы приостановлены до замены партии бетона]   │
│                                                                 │
│  Подпись инспектора:                                            │
│  ┌─────────────────────────────────┐                            │
│  │                                 │  ← canvas для подписи     │
│  │    [рисунок подписи]            │                            │
│  │                                 │                            │
│  └─────────────────────────────────┘                            │
│  [Очистить]                                                     │
│                                                                 │
│  [◀ Назад]  [Завершить проверку ✓]                              │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: Canvas API для рисования подписи (react-signature-canvas). При нажатии «Завершить» — валидация, что все required-пункты заполнены, подпись поставлена → PUT /complete. После завершения — перенаправление на детальную страницу с возможностью генерации PDF.

**Экран 28-E: Аналитика качества (Парето-диаграмма)**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Аналитика контроля качества»                      │
│  Фильтры: [Проект ▾] [Период: с ___ по ___] [Тип контроля ▾]  │
├──────────────────────────────────┬──────────────────────────────┤
│  MetricCard: Всего проверок: 247 │  MetricCard: % PASS: 78.5%  │
│  MetricCard: Несоответствий: 53  │  MetricCard: Ср.время: 38м  │
├──────────────────────────────────┴──────────────────────────────┤
│  Парето: Топ-10 проблемных пунктов                              │
│  BarChart (горизонтальный):                                     │
│  Класс бетона ████████████████████ 18                           │
│  Отклонение осей █████████████████ 15                           │
│  Защитный слой ██████████████ 12                                │
│  Сертификат матер. ████████████ 10                              │
│  Вертикальность ████████ 7                                      │
│  ... + кумулятивная линия (80/20)                               │
├─────────────────────────────────────────────────────────────────┤
│  Тренд качества по месяцам (LineChart):                         │
│  — % PASS (зелёная линия)                                       │
│  — Количество NC (красные столбцы)                              │
│  — Среднее время проверки (серая пунктирная)                    │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: Recharts (BarChart + LineChart + composedChart). Данные с GET /checklist-analytics и /failure-patterns. Export в Excel через exportToExcel().

### 28.5 Бизнес-правила и валидации

1. **Шаблон → Экземпляр:** при создании экземпляра из шаблона — все секции и пункты копируются в checklist_item_results с result=PENDING. Шаблон «замораживается» по текущей revision — изменения шаблона не влияют на уже созданные экземпляры.
2. **NUMERIC_MEASUREMENT:** если measured_value < min_value или > max_value — автоматически result=FAIL. Отображается красная подсветка. Если tolerance_rule_id задан — используются правила из ToleranceRule (tolerancePercent, absoluteTolerance).
3. **FAIL → NonConformance:** при установке result=FAIL для любого пункта — автоматически предлагается создать NonConformance (предзаполненные description, severity на основе is_critical). Если пункт is_critical и секция is_critical — NonConformanceSeverity = CRITICAL.
4. **Завершение:** нельзя перевести в COMPLETED, если есть required-пункты с result=PENDING. Нельзя без подписи. Система автоматически рассчитывает overall_result: если есть FAIL в critical-секции → FAIL; если есть FAIL в non-critical → CONDITIONAL_PASS; иначе → PASS.
5. **Versioning:** при изменении шаблона — revision++. Старые экземпляры ссылаются на старую revision. Можно сравнить «что изменилось» между revisions.
6. **Offline:** все данные экземпляра кешируются при открытии. Каждое изменение пункта записывается в offlineQueue с timestamp. При синхронизации — batch-отправка с server-side conflict resolution (latest-wins по timestamp).
7. **Фото:** камера через `capture="environment"` (задняя камера). Сжатие до 1200px по длинной стороне, качество JPEG 0.8. Загрузка через `/api/files/upload`, URL сохраняется в photo_urls.
8. **Нормативная база:** ГОСТ 24297-2013 (входной контроль), СП 48.13330.2019 (контроль качества строительства), ГОСТ Р ИСО 9001-2015 (СМК), РД-11-02-2006 (исполнительная документация).

### 28.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Шаблоны CRUD | + | + | Только чтение | - | - |
| Создать экземпляр | + | + | + | - | - |
| Заполнять чек-лист | + | + | + (назначенный) | - | - |
| Утверждать / отклонять | + | + | - | - | - |
| Просмотр результатов | + | + | + | - | + |
| Аналитика | + | + | - | - | - |
| PDF-отчёт | + | + | + | - | - |
| Удалить шаблон | + | - | - | - | - |

### 28.7 Крайние случаи

1. **Шаблон удалён, а экземпляры существуют** — soft-delete шаблона не влияет на экземпляры. Экземпляры хранят денормализованные данные (section_title, item_label).
2. **Два инспектора одновременно** — optimistic locking через version field на checklist_instances. При конфликте — предупреждение «Чек-лист изменён другим пользователем».
3. **Нет сети на площадке** — полный offline-режим. Все данные формы в IndexedDB. При синхронизации — batch endpoint с conflict resolution.
4. **>100 пунктов в чек-листе** — виртуальный скроллинг внутри секций. Автосохранение каждые 30 секунд.
5. **Фото не загрузилось** — локальный blob URL в IndexedDB. При восстановлении сети — автоматическая загрузка. Статус «ожидает загрузки» у пункта.
6. **Шаблон без секций** — валидация: минимум 1 секция и 1 пункт. Нельзя сохранить пустой шаблон.

### 28.8 UX Бенчмарк

**Лучший в классе:** PlanRadar — лучшие чек-листы для стройки: шаблоны с фото, offline, подпись. Procore (Quality & Safety, 2024) — checklist templates with configurable items, auto-NCR creation. Fieldwire — мобильные чек-листы с pin-on-plan. SafetyCulture (iAuditor) — золотой стандарт мобильных инспекций: smart logic, scoring, analytics. Для российского рынка: Кайтен/1С:Стройнадзор — чек-листы по видам работ с привязкой к СНиП/СП.

---

## Задача 29: Регистрация инцидентов и near-miss

### 29.1 Описание

Модуль полного цикла управления инцидентами безопасности на строительной площадке: от мгновенной регистрации (в т.ч. near-miss — «предпосылки к инциденту», когда трагедии удалось избежать) до расследования, корректирующих действий и формирования отчётности в надзорные органы. В России расследование несчастных случаев на производстве регулируется Трудовым кодексом РФ (ст. 227–231), Положением о расследовании несчастных случаев (Постановление Правительства РФ №1206 от 2022), формой Н-1 (извещение о несчастном случае), формой 7-травматизм (статистическая отчётность). Для near-miss — ГОСТ 12.0.230.3-2016 (учёт и анализ опасных ситуаций). При тяжёлом/смертельном НС — уведомление ГИТ, прокуратуры, ФСС в течение 24 часов.

Существующая сущность `SafetyIncident` содержит базовые поля: number, incidentDate, projectId, locationDescription, severity (MINOR/MODERATE/SERIOUS/CRITICAL/FATAL), incidentType (INJURY/NEAR_MISS/PROPERTY_DAMAGE/ENVIRONMENTAL/FIRE/FALL/ELECTRICAL/OTHER), status (REPORTED → UNDER_INVESTIGATION → CORRECTIVE_ACTION → RESOLVED → CLOSED), description, rootCause, correctiveAction, reportedById, investigatorId, injuredEmployeeId, witnessNames, workDaysLost, medicalTreatment, hospitalization, resolvedAt. Но не покрывает: множественных пострадавших, подробных данных формы Н-1, комиссию по расследованию, дерево причин (Ishikawa/5 Whys), корректирующие/предупредительные действия с ответственными и сроками, повторные near-miss (паттерны), расчёт LTIR/TRIR/DART, уведомления в ГИТ/ФСС, фото/видео-доказательства с геолокацией, мобильную регистрацию «одним нажатием».

### 29.2 Сущности БД

```sql
-- Java enum: InjuryType
-- FRACTURE, CUT, BRUISE, BURN, ELECTRIC_SHOCK, POISONING, FALL_FROM_HEIGHT, CAUGHT_IN_MECHANISM, STRUCK_BY_OBJECT, HEAT_STROKE, OTHER

-- Java enum: BodyPart
-- HEAD, EYES, NECK, CHEST, BACK, ABDOMEN, LEFT_ARM, RIGHT_ARM, LEFT_HAND, RIGHT_HAND, LEFT_LEG, RIGHT_LEG, LEFT_FOOT, RIGHT_FOOT, MULTIPLE, OTHER

-- Java enum: CorrectiveActionStatus
-- PLANNED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED

-- Java enum: CorrectiveActionType
-- IMMEDIATE, CORRECTIVE, PREVENTIVE

-- Java enum: InvestigationMethod
-- FIVE_WHYS, ISHIKAWA, FAULT_TREE, BOW_TIE, SIMPLE

-- =====================================================
-- Расширение safety_incidents (ALTER)
-- =====================================================
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS time_of_incident TIME;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS shift VARCHAR(20);              -- ДЕНЬ, НОЧЬ, ВАХТА
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(200);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS equipment_involved VARCHAR(500); -- задействованная техника
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS work_being_performed TEXT;       -- выполняемая работа в момент инцидента
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS immediate_actions TEXT;          -- немедленные действия (первая помощь, эвакуация)
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_method VARCHAR(30); -- InvestigationMethod
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_started_at TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_completed_at TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_report TEXT;       -- заключение комиссии
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_notified BOOLEAN DEFAULT FALSE;  -- уведомлён ГИТ/ФСС
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_notification_date TIMESTAMPTZ;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS regulatory_case_number VARCHAR(50);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS direct_cost NUMERIC(18,2) DEFAULT 0;  -- прямые затраты (лечение, ремонт)
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS indirect_cost NUMERIC(18,2) DEFAULT 0; -- косвенные (простой, замена)
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS is_reportable BOOLEAN DEFAULT FALSE;    -- подлежит отчётности в органы
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_incident_org_date ON safety_incidents(organization_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_org_type ON safety_incidents(organization_id, incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_is_reportable ON safety_incidents(organization_id, is_reportable);

-- =====================================================
-- Пострадавшие (может быть несколько)
-- =====================================================
CREATE TABLE incident_injured_persons (
    -- BaseEntity fields
    incident_id       UUID         NOT NULL REFERENCES safety_incidents(id),
    employee_id       UUID         REFERENCES employees(id),
    full_name         VARCHAR(255) NOT NULL,
    position          VARCHAR(200),
    department        VARCHAR(200),
    date_of_birth     DATE,
    years_of_experience NUMERIC(4,1),
    injury_type       VARCHAR(30)  NOT NULL,      -- InjuryType
    body_part         VARCHAR(30)  NOT NULL,      -- BodyPart
    injury_description TEXT,
    medical_treatment BOOLEAN      NOT NULL DEFAULT FALSE,
    hospitalized      BOOLEAN      NOT NULL DEFAULT FALSE,
    hospital_name     VARCHAR(300),
    work_days_lost    INTEGER      DEFAULT 0,
    returned_to_work  BOOLEAN      DEFAULT FALSE,
    return_date       DATE,
    disability_type   VARCHAR(50),                 -- временная/стойкая/инвалидность
    outcome           VARCHAR(30),                 -- RECOVERED, PERMANENT_DISABILITY, FATAL

    CONSTRAINT uq_injured_person UNIQUE (incident_id, employee_id)
);

CREATE INDEX idx_iip_incident ON incident_injured_persons(incident_id);
CREATE INDEX idx_iip_employee ON incident_injured_persons(employee_id);

-- =====================================================
-- Комиссия по расследованию
-- =====================================================
CREATE TABLE incident_investigation_members (
    -- BaseEntity fields
    incident_id       UUID         NOT NULL REFERENCES safety_incidents(id),
    user_id           UUID         REFERENCES users(id),
    full_name         VARCHAR(255) NOT NULL,
    role_in_commission VARCHAR(100) NOT NULL,      -- «Председатель», «Член комиссии», «Представитель ГИТ»
    organization_name VARCHAR(300),                -- для внешних участников (ГИТ, ФСС, профсоюз)
    position          VARCHAR(200),

    CONSTRAINT uq_investigation_member UNIQUE (incident_id, user_id)
);

CREATE INDEX idx_iim_incident ON incident_investigation_members(incident_id);

-- =====================================================
-- Корректирующие и предупредительные действия (CAPA)
-- =====================================================
CREATE TABLE incident_corrective_actions (
    -- BaseEntity fields
    incident_id       UUID         NOT NULL REFERENCES safety_incidents(id),
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    action_type       VARCHAR(20)  NOT NULL,       -- CorrectiveActionType
    description       TEXT         NOT NULL,
    responsible_id    UUID         REFERENCES users(id),
    responsible_name  VARCHAR(255),
    due_date          DATE         NOT NULL,
    completed_date    DATE,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PLANNED',  -- CorrectiveActionStatus
    verification_date DATE,                        -- дата проверки эффективности
    verified_by_id    UUID         REFERENCES users(id),
    is_effective      BOOLEAN,                     -- действие оказалось эффективным?
    evidence_urls     JSONB        DEFAULT '[]'::jsonb,  -- фото подтверждения выполнения
    notes             TEXT
);

CREATE INDEX idx_ica_incident ON incident_corrective_actions(incident_id);
CREATE INDEX idx_ica_org ON incident_corrective_actions(organization_id);
CREATE INDEX idx_ica_status ON incident_corrective_actions(organization_id, status);
CREATE INDEX idx_ica_due_date ON incident_corrective_actions(due_date);
CREATE INDEX idx_ica_responsible ON incident_corrective_actions(responsible_id);

-- =====================================================
-- Анализ причин (RCA — Root Cause Analysis)
-- =====================================================
CREATE TABLE incident_rca_nodes (
    -- BaseEntity fields
    incident_id       UUID         NOT NULL REFERENCES safety_incidents(id),
    parent_node_id    UUID         REFERENCES incident_rca_nodes(id),  -- дерево (5 Whys / Ishikawa)
    node_type         VARCHAR(30)  NOT NULL,       -- ROOT, CAUSE, SUB_CAUSE, WHY (для 5 Whys), CATEGORY (для Ishikawa: Man/Machine/Method/Material/Environment/Measurement)
    description       TEXT         NOT NULL,
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    is_root_cause     BOOLEAN      NOT NULL DEFAULT FALSE  -- помечается как корневая причина
);

CREATE INDEX idx_rca_incident ON incident_rca_nodes(incident_id);
CREATE INDEX idx_rca_parent ON incident_rca_nodes(parent_node_id);

-- =====================================================
-- Метрики безопасности (агрегация по периодам)
-- =====================================================
CREATE TABLE safety_metrics_snapshots (
    -- BaseEntity fields
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    project_id        UUID         REFERENCES projects(id),  -- NULL = по всей организации
    period            VARCHAR(10)  NOT NULL,       -- «2026-01», «2026-Q1», «2026»
    period_type       VARCHAR(10)  NOT NULL,       -- MONTH, QUARTER, YEAR
    total_work_hours  NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_incidents   INTEGER      NOT NULL DEFAULT 0,
    total_near_misses INTEGER      NOT NULL DEFAULT 0,
    total_injuries    INTEGER      NOT NULL DEFAULT 0,
    lost_time_injuries INTEGER     NOT NULL DEFAULT 0,  -- с потерей рабочего времени
    fatalities        INTEGER      NOT NULL DEFAULT 0,
    first_aid_cases   INTEGER      NOT NULL DEFAULT 0,
    work_days_lost    INTEGER      NOT NULL DEFAULT 0,
    property_damage_cost NUMERIC(18,2) DEFAULT 0,
    -- Расчётные коэффициенты:
    ltir              NUMERIC(10,4),  -- Lost Time Injury Rate = (LTI * 200000) / total_work_hours
    trir              NUMERIC(10,4),  -- Total Recordable Incident Rate
    dart              NUMERIC(10,4),  -- Days Away, Restricted, Transferred rate
    severity_rate     NUMERIC(10,4),  -- work_days_lost / total_work_hours * 200000
    near_miss_ratio   NUMERIC(10,4),  -- near_misses / total_incidents (цель: >10:1)
    days_without_incident INTEGER DEFAULT 0,

    CONSTRAINT uq_safety_metrics UNIQUE (organization_id, project_id, period)
);

CREATE INDEX idx_sms_org ON safety_metrics_snapshots(organization_id);
CREATE INDEX idx_sms_period ON safety_metrics_snapshots(organization_id, period_type, period);
```

### 29.3 API Endpoints

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| **Инциденты** | | | |
| GET | `/api/safety/incidents` | Список с фильтрами (type, severity, status, projectId, dateRange, isReportable) | ADMIN, MANAGER, ENGINEER, VIEWER |
| GET | `/api/safety/incidents/{id}` | Детали инцидента со всеми связанными данными | ADMIN, MANAGER, ENGINEER, VIEWER |
| POST | `/api/safety/incidents` | Регистрация инцидента / near-miss | ADMIN, MANAGER, ENGINEER |
| PUT | `/api/safety/incidents/{id}` | Обновление данных инцидента | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/status` | Перевод статуса (с валидацией перехода) | ADMIN, MANAGER |
| POST | `/api/safety/incidents/quick-report` | Быстрая регистрация (минимум полей + фото + геолокация) | Все авторизованные |
| POST | `/api/safety/incidents/{id}/photos` | Загрузка фото/видео к инциденту | ADMIN, MANAGER, ENGINEER |
| **Пострадавшие** | | | |
| GET | `/api/safety/incidents/{id}/injured-persons` | Список пострадавших | ADMIN, MANAGER |
| POST | `/api/safety/incidents/{id}/injured-persons` | Добавление пострадавшего | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/injured-persons/{personId}` | Обновление данных пострадавшего | ADMIN, MANAGER |
| DELETE | `/api/safety/incidents/{id}/injured-persons/{personId}` | Удаление | ADMIN |
| **Расследование** | | | |
| POST | `/api/safety/incidents/{id}/investigation/start` | Начать расследование (назначить комиссию) | ADMIN, MANAGER |
| GET | `/api/safety/incidents/{id}/investigation/members` | Состав комиссии | ADMIN, MANAGER, ENGINEER |
| POST | `/api/safety/incidents/{id}/investigation/members` | Добавить члена комиссии | ADMIN, MANAGER |
| DELETE | `/api/safety/incidents/{id}/investigation/members/{memberId}` | Удалить | ADMIN, MANAGER |
| **RCA (анализ причин)** | | | |
| GET | `/api/safety/incidents/{id}/rca` | Дерево причин | ADMIN, MANAGER |
| POST | `/api/safety/incidents/{id}/rca/nodes` | Добавить узел | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/rca/nodes/{nodeId}` | Обновить узел | ADMIN, MANAGER |
| DELETE | `/api/safety/incidents/{id}/rca/nodes/{nodeId}` | Удалить узел | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/rca/nodes/{nodeId}/mark-root-cause` | Пометить как корневую причину | ADMIN, MANAGER |
| **Корректирующие действия (CAPA)** | | | |
| GET | `/api/safety/incidents/{id}/actions` | Список действий | ADMIN, MANAGER, ENGINEER |
| POST | `/api/safety/incidents/{id}/actions` | Создать действие | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/actions/{actionId}` | Обновить действие | ADMIN, MANAGER |
| PUT | `/api/safety/incidents/{id}/actions/{actionId}/complete` | Отметить выполнение | ADMIN, MANAGER, ENGINEER (назначенный) |
| PUT | `/api/safety/incidents/{id}/actions/{actionId}/verify` | Верификация эффективности | ADMIN, MANAGER |
| **Формы и отчёты** | | | |
| GET | `/api/safety/incidents/{id}/form-n1` | Генерация формы Н-1 (PDF) | ADMIN, MANAGER |
| GET | `/api/safety/incidents/{id}/notification-git` | Извещение в ГИТ (PDF) | ADMIN, MANAGER |
| POST | `/api/safety/incidents/{id}/notify-regulatory` | Отправить уведомление в ГИТ/ФСС | ADMIN |
| **Метрики** | | | |
| GET | `/api/safety/metrics` | Метрики безопасности (фильтры: projectId, periodType, dateRange) | ADMIN, MANAGER, VIEWER |
| GET | `/api/safety/metrics/dashboard` | Данные для дашборда безопасности | ADMIN, MANAGER, VIEWER |
| GET | `/api/safety/metrics/trends` | Тренды LTIR/TRIR/near-miss по периодам | ADMIN, MANAGER |
| POST | `/api/safety/metrics/recalculate` | Пересчёт метрик за период | ADMIN |

### 29.4 Экраны (UI)

**Экран 29-A: Реестр инцидентов и near-miss**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Инциденты и предпосылки (near-miss)»              │
│  subtitle: «Регистрация и расследование происшествий»            │
│  breadcrumbs: Главная > Безопасность > Инциденты                │
│  actions: [+ Зарегистрировать] [⚡ Быстрый отчёт] [Экспорт]    │
├─────────────────────────────────────────────────────────────────┤
│  Метрики:                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Дней без  │ │ LTIR     │ │Near-miss │ │ Всего    │           │
│  │инцидентов│ │ 0.82     │ │ за месяц │ │ инцидент.│           │
│  │  47      │ │ ↓ -12%   │ │   14     │ │ 2026: 8  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [Все] [Near-miss (23)] [Травмы (5)] [Пожары (1)]        │
│  Фильтры: [Проект ▾] [Статус ▾] [Серьёзность ▾] [Период]      │
│                                                                 │
│  DataTable:                                                     │
│  ┌──────┬──────────┬───────┬──────────┬──────┬────────┬──────┐  │
│  │ №    │ Дата     │Тип    │Описание  │Серьёз│Статус  │ Дни  │  │
│  ├──────┼──────────┼───────┼──────────┼──────┼────────┼──────┤  │
│  │INC-47│2026-02-15│Травма │Падение с │СЕРЬЁЗ│Расслед.│  12  │  │
│  │      │          │       │лесов     │      │        │      │  │
│  │NM-112│2026-02-14│Near-  │Ненадёжное│НЕЗНАЧ│Закрыт  │  0   │  │
│  │      │          │miss   │ограждение│      │        │      │  │
│  │INC-46│2026-02-10│Пожар  │Возгорание│КРИТИЧ│Кор.дей.│  3   │  │
│  │      │          │       │утеплителя│      │        │      │  │
│  └──────┴──────────┴───────┴──────────┴──────┴────────┴──────┘  │
│  * Строки с CRITICAL/FATAL — красный фон                        │
│  * Near-miss — жёлтый индикатор                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Экран 29-B: Быстрая регистрация (мобильный, полноэкранный)**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ БЫСТРЫЙ ОТЧЁТ ОБ ИНЦИДЕНТЕ                                 │
├─────────────────────────────────────────────────────────────────┤
│  Что произошло?                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 🔴       │ │ 🟡       │ │ 🔵       │ │ 🟢       │           │
│  │ Травма   │ │ Near-miss│ │ Повреж.  │ │ Экология │           │
│  │          │ │          │ │ имуществ.│ │          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  Серьёзность:                                                   │
│  ○ Незначительная  ○ Умеренная  ● Серьёзная  ○ Критическая     │
│                                                                 │
│  Описание (голосовой ввод 🎤):                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Рабочий упал с лесов второго этажа. Страховочный       │    │
│  │ пояс не был закреплён. Вызвана скорая.                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  📷 Фото (сделайте минимум 1):                                  │
│  [📸 Сделать фото]  [фото1] [фото2]                            │
│                                                                 │
│  📍 Геолокация: 55.7520° N, 37.6175° E  ✓ определена           │
│  📋 Проект: [ЖК «Весна» (авто-определено по GPS) ▾]            │
│                                                                 │
│  [Отправить отчёт →]                                            │
│                                                                 │
│  ⏱ Время регистрации: < 60 секунд                              │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: полноэкранный мобильный layout. Геолокация через `navigator.geolocation.getCurrentPosition()`. Определение проекта по ближайшим GPS-координатам площадок. Голосовой ввод через Web Speech API (`SpeechRecognition`). Камера через `<input type="file" capture="environment">`. Минимум полей: type + severity + description + photo. Остальное заполняется позже при расследовании.

**Экран 29-C: Детали инцидента + расследование**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «INC-47: Падение с лесов»                          │
│  StatusBadge: [🔴 Серьёзный] [На расследовании]                 │
│  breadcrumbs: Безопасность > Инциденты > INC-47                 │
│  actions: [Перевести статус ▾] [Форма Н-1] [Уведомить ГИТ]     │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [Основное] [Пострадавшие] [Расследование] [CAPA]        │
│        [Анализ причин] [Документы]                               │
│                                                                 │
│  ═══ Tab: Основное ═══                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Дата/время: 15.02.2026 14:35  Смена: Дневная            │    │
│  │ Проект: ЖК «Весна»  Локация: Секция 2, 3-й этаж        │    │
│  │ Погода: +2°C, облачно, ветер 5 м/с                      │    │
│  │ Тип: Травма (Падение)  Серьёзность: Серьёзная           │    │
│  │ Выполняемая работа: Монтаж фасадных панелей             │    │
│  │ Оборудование: Строительные леса ЛСПР-200               │    │
│  │                                                         │    │
│  │ Описание: [текст...]                                    │    │
│  │ Немедленные действия: Вызвана скорая, оказана первая    │    │
│  │ помощь, место оцеплено                                  │    │
│  │                                                         │    │
│  │ 📷 Фото (4):  [фото1] [фото2] [фото3] [фото4]         │    │
│  │ 📍 Координаты: 55.7520, 37.6175  [Показать на карте]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ═══ Tab: Анализ причин (5 Whys) ═══                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Почему 1: Рабочий не использовал страховочный пояс      │    │
│  │   └ Почему 2: Не было проведено инструктаж перед работой│    │
│  │     └ Почему 3: Прораб отсутствовал на площадке         │    │
│  │       └ Почему 4: Замещающий не был назначен             │    │
│  │         └ ⭐ Почему 5: Нет процедуры передачи обязаннос.│    │
│  │                        [КОРНЕВАЯ ПРИЧИНА]                │    │
│  │ [+ Добавить уровень]                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  или Ishikawa (рыбья кость):                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Человек────┐                                            │    │
│  │ Метод──────┤                                            │    │
│  │ Машина─────┼──→ [ИНЦИДЕНТ: Падение с лесов]            │    │
│  │ Материал───┤                                            │    │
│  │ Среда──────┤                                            │    │
│  │ Измерение──┘                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: Tab-навигация по разделам инцидента. Анализ причин — визуальный builder: для 5 Whys — вертикальное дерево с indent; для Ishikawa — интерактивная «рыбья кость» (SVG/Canvas). Каждый узел можно добавить/удалить/пометить как корневую причину. Форма Н-1 — генерация PDF с заполненными данными из всех связанных таблиц (PdfReportService + шаблон). Уведомление ГИТ — формирование извещения по установленной форме, отправка через интеграцию (email/СБИС).

**Экран 29-D: Дашборд безопасности**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Дашборд безопасности»                             │
│  Фильтры: [Проект ▾] [Период: 2026 ▾]                          │
├─────────────────────────────────────────────────────────────────┤
│  MetricCards:                                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │47 дней │ │LTIR    │ │TRIR    │ │Near-   │ │Затраты │        │
│  │без инц.│ │0.82↓   │ │1.54↓   │ │miss    │ │на инц. │        │
│  │🟢 цель │ │цель<1.0│ │цель<2.0│ │ratio   │ │₽2.4М   │        │
│  │  >30   │ │  ✅     │ │  ✅     │ │12:1 ✅ │ │        │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
├─────────────────────────────────────────────────────────────────┤
│  AreaChart: Инциденты vs Near-miss по месяцам                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  14│  ██                                                │    │
│  │  12│  ██ ██                                              │    │
│  │  10│  ██ ██ ██                 (near-miss — жёлтый)     │    │
│  │   8│  ██ ██ ██ ██                                        │    │
│  │   2│──██─██─██─██─██─  ───    (инциденты — красный)     │    │
│  │   0│──Янв─Фев─Мар─Апр─Май─                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  PieChart: По типам     Heatmap: По дням недели/часам           │
│  ┌────────────────┐     ┌──────────────────────────────────┐    │
│  │  Падение 35%   │     │     8h 10h 12h 14h 16h 18h      │    │
│  │  Near-miss 28% │     │ Пн  ░  ░  ██  ██  ░   ░        │    │
│  │  Электр.  15%  │     │ Вт  ░  ██  ░   ░   ░   ░       │    │
│  │  Пожар    12%  │     │ ...                              │    │
│  │  Прочие   10%  │     │ Пт  ██  ██  ██  ░   ░   ░       │    │
│  └────────────────┘     └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: Recharts (AreaChart, PieChart). Heatmap — кастомный компонент (матрица div с цветовой интенсивностью). Данные с GET /safety/metrics/dashboard и /trends. MetricCards с цветовой индикацией: зелёный (цель достигнута), красный (превышено).

### 29.5 Бизнес-правила и валидации

1. **Немедленное уведомление:** при severity = CRITICAL или FATAL — автоматический push/Telegram ответственному по ОТ, руководителю проекта, генеральному директору. Если is_reportable = true — система показывает предупреждение «Требуется уведомление ГИТ/ФСС в течение 24 часов».
2. **Форма Н-1:** генерируется для инцидентов типа INJURY с severity >= SERIOUS. Содержит все данные пострадавших, обстоятельства, комиссию, причины, мероприятия. Формат по Постановлению Правительства РФ №1206.
3. **LTIR расчёт:** `LTIR = (lost_time_injuries * 200000) / total_work_hours`. Total_work_hours берётся из TimesheetService (сумма табельных часов за период). Пороги: <1.0 = отлично (зелёный), 1.0-2.0 = предупреждение (жёлтый), >2.0 = критично (красный).
4. **Near-miss ratio:** `ratio = near_misses / (injuries + fatalities)`. По Heinrich's Law, ratio <10:1 свидетельствует о низкой культуре сообщения. Цель >10:1. Система стимулирует сообщение near-miss (не наказывает).
5. **Статусные переходы:** REPORTED → UNDER_INVESTIGATION (назначается комиссия) → CORRECTIVE_ACTION (определены действия) → RESOLVED (действия выполнены) → CLOSED. Нельзя закрыть при наличии PLANNED/IN_PROGRESS корректирующих действий.
6. **CAPA верификация:** каждое действие после COMPLETED должно быть верифицировано (is_effective). Если неэффективно — автоматически создаётся новое действие.
7. **Геолокация:** при быстрой регистрации — GPS-координаты сохраняются. По координатам определяется ближайший проект (radius search в БД: `ST_DDistance` если PostGIS, или расчёт Haversine).
8. **Нормативная база:** ТК РФ ст.227-231 (расследование НС), Постановление Правительства РФ №1206 от 2022 (положение о расследовании), ГОСТ 12.0.230.3-2016 (учёт опасных ситуаций), Приказ Минтруда 223н (форма Н-1).

### 29.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Быстрая регистрация | + | + | + | + | + |
| Полная регистрация | + | + | + | - | - |
| Расследование | + | + | - | - | - |
| Пострадавшие CRUD | + | + | - | - | - |
| RCA (анализ причин) | + | + | - | - | - |
| CAPA (создание) | + | + | - | - | - |
| CAPA (выполнение) | + | + | + (назначенный) | - | - |
| Форма Н-1 / ГИТ | + | + | - | - | - |
| Уведомление органов | + | - | - | - | - |
| Просмотр | + | + | + | - | + |
| Дашборд метрик | + | + | + | - | + |

### 29.7 Крайние случаи

1. **Смертельный НС** — при severity=FATAL: немедленная блокировка работ на объекте (статус проекта → ON_HOLD). Обязательная комиссия минимум 5 человек (включая представителя ГИТ). Срок расследования — 15 дней (ТК РФ).
2. **Групповой НС (>2 пострадавших)** — multiple injured_persons. Расследование расширенной комиссией. Уведомление ГИТ + прокуратура + ФСС.
3. **Near-miss без пострадавших** — нет записей в injured_persons. Упрощённое расследование. Но CAPA обязательна.
4. **Работник отказывается сообщать** — анонимная регистрация: reported_by_id = NULL, reported_by_name = «Аноним». Системе важнее получить информацию, чем идентифицировать автора.
5. **Инцидент на удалённом объекте без сети** — offline-регистрация с кешем в IndexedDB. Фото с локальными blob URL. Синхронизация при восстановлении связи.
6. **>50 инцидентов за месяц** — пагинация в реестре. DataTable с серверной пагинацией (page/size). Фильтры по типу, серьёзности, статусу.

### 29.8 UX Бенчмарк

**Лучший в классе:** Procore (Safety, 2024) — лучшая мобильная регистрация инцидентов: quick report с фото и GPS, investigation workflow, OSHA recordkeeping. SafetyCulture (iAuditor) — incident reporting + analytics + trends. Fieldwire — safety observations на плане. iSafe — near-miss gamification (стимулирование сообщений). Для российского рынка: 1С:Охрана труда — формы Н-1 и отчётность по травматизму; СБИС — электронная отправка уведомлений в ГИТ.

---

## Задача 30: Панель руководителя с KPI

### 30.1 Описание

Единая настраиваемая панель (Executive Dashboard) для высшего руководства строительной организации, агрегирующая ключевые показатели эффективности (KPI) по всем проектам и функциональным областям: финансы (маржинальность, cash flow, дебиторка), сроки (SPI, CPI, отклонения от графика), качество (% PASS, количество NC), безопасность (LTIR, дни без инцидентов), ресурсы (утилизация, вахта), склад (оборачиваемость, дефицит). Панель отображает real-time данные с автообновлением, трендами (spark-lines), drill-down до конкретного проекта и периода.

Существующие сущности: `Dashboard` (code, name, dashboardType, layoutConfig, isDefault, isPublic), `DashboardWidget` (dashboardId, widgetType, title, dataSource, configJson, positionX/Y, width, height, refreshIntervalSeconds), `KpiDefinition` (code, name, category, aggregationType, formula, unit, targetValue, warningThreshold, criticalThreshold), `KpiSnapshot` (kpiId, projectId, snapshotDate, value, targetValue, trend), `KpiAchievement` (employeeId, kpiId, period, targetValue, actualValue, achievementPercent). Однако не реализовано: organization_id на Dashboard/Widget (мультитенант), персонализация виджетов (drag-and-drop layout), drill-down navigation, sparck-lines, real-time WebSocket push, PDF/email-рассылка, адаптивный layout для мобильных, группировка по портфелям проектов.

Задача расширяет существующую аналитическую инфраструктуру до полноценной executive dashboard: drag-and-drop настройка расположения виджетов (react-grid-layout), библиотека преднастроенных виджетов по категориям, автоматический сбор KPI из всех модулей (@Scheduled + materialized views), WebSocket push при обновлении, PDF-дайджест по расписанию, TV-mode для отображения на экранах в офисе.

### 30.2 Сущности БД

```sql
-- Java enum: ExecutiveWidgetCategory
-- FINANCIAL, SCHEDULE, QUALITY, SAFETY, HR, WAREHOUSE, PROCUREMENT, CONTRACTS, OVERVIEW

-- Java enum: WidgetSize
-- SMALL_1x1, MEDIUM_2x1, MEDIUM_1x2, LARGE_2x2, WIDE_3x1, WIDE_4x1, TALL_1x3, FULL_4x2

-- Java enum: DigestFrequency
-- DAILY, WEEKLY, BIWEEKLY, MONTHLY

-- Java enum: KpiCollectorStatus
-- ACTIVE, PAUSED, ERROR

-- =====================================================
-- ALTER существующих таблиц для мультитенанта
-- =====================================================
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_executive BOOLEAN DEFAULT FALSE;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS tv_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS auto_rotate_seconds INTEGER DEFAULT 0;  -- 0 = не ротировать
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'LIGHT';      -- LIGHT, DARK, AUTO

CREATE INDEX IF NOT EXISTS idx_dashboard_org ON dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_exec ON dashboards(organization_id, is_executive);

ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS category VARCHAR(30);   -- ExecutiveWidgetCategory
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS kpi_id UUID REFERENCES kpi_definitions(id);
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS project_filter_ids JSONB DEFAULT '[]'::jsonb;  -- фильтр по проектам
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS date_range_type VARCHAR(20) DEFAULT 'CURRENT_MONTH';  -- CURRENT_MONTH, CURRENT_QUARTER, CURRENT_YEAR, CUSTOM, ROLLING_30D, ROLLING_90D
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS threshold_config JSONB DEFAULT '{}'::jsonb;  -- {warning: 80, critical: 60, direction: "higher_is_better"}
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS sparkline_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE dashboard_widgets ADD COLUMN IF NOT EXISTS drill_down_url VARCHAR(500);  -- куда переходить при клике

CREATE INDEX IF NOT EXISTS idx_widget_org ON dashboard_widgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_widget_kpi ON dashboard_widgets(kpi_id);

ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS data_query TEXT;            -- SQL/JPQL для сбора данных
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS collection_cron VARCHAR(30);  -- cron expression для автосбора
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS collector_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS last_collected_at TIMESTAMPTZ;
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS direction VARCHAR(20) DEFAULT 'HIGHER_IS_BETTER';  -- HIGHER_IS_BETTER, LOWER_IS_BETTER, TARGET_IS_BEST

CREATE INDEX IF NOT EXISTS idx_kpi_org ON kpi_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_collector ON kpi_definitions(collector_status);

ALTER TABLE kpi_snapshots ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE kpi_snapshots ADD COLUMN IF NOT EXISTS period_type VARCHAR(10) DEFAULT 'DAY';  -- DAY, WEEK, MONTH, QUARTER
ALTER TABLE kpi_snapshots ADD COLUMN IF NOT EXISTS delta_value NUMERIC(18,4);              -- разница с предыдущим snapshot
ALTER TABLE kpi_snapshots ADD COLUMN IF NOT EXISTS delta_percent NUMERIC(8,2);             -- % изменения

CREATE INDEX IF NOT EXISTS idx_snapshot_org ON kpi_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_org_date ON kpi_snapshots(organization_id, snapshot_date DESC);

-- =====================================================
-- Библиотека виджетов (шаблоны виджетов)
-- =====================================================
CREATE TABLE widget_templates (
    -- BaseEntity fields
    organization_id   UUID         REFERENCES organizations(id),  -- NULL = системные (доступны всем)
    code              VARCHAR(50)  NOT NULL,
    name              VARCHAR(300) NOT NULL,
    description       TEXT,
    category          VARCHAR(30)  NOT NULL,        -- ExecutiveWidgetCategory
    widget_type       VARCHAR(30)  NOT NULL,        -- WidgetType: NUMBER, CHART, TABLE, GAUGE, SPARKLINE, HEATMAP
    default_size      VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM_2x1',  -- WidgetSize
    data_source       VARCHAR(255) NOT NULL,
    default_config    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url     VARCHAR(500),
    is_system         BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order        INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT uq_widget_template_code UNIQUE (code)
);

CREATE INDEX idx_wt_org ON widget_templates(organization_id);
CREATE INDEX idx_wt_category ON widget_templates(category);
CREATE INDEX idx_wt_system ON widget_templates(is_system);

-- =====================================================
-- Рассылка дайджестов
-- =====================================================
CREATE TABLE dashboard_digests (
    -- BaseEntity fields
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    dashboard_id      UUID         NOT NULL REFERENCES dashboards(id),
    name              VARCHAR(300) NOT NULL,
    frequency         VARCHAR(20)  NOT NULL,        -- DigestFrequency
    send_day          INTEGER,                      -- день недели (1=Пн) для WEEKLY; день месяца для MONTHLY
    send_time         TIME         NOT NULL DEFAULT '08:00',
    recipient_ids     JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- UUID[] пользователей
    recipient_emails  JSONB        DEFAULT '[]'::jsonb,           -- дополнительные email-адреса
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    last_sent_at      TIMESTAMPTZ,
    include_comments  BOOLEAN      DEFAULT TRUE,
    format            VARCHAR(10)  DEFAULT 'PDF'    -- PDF, HTML
);

CREATE INDEX idx_dd_org ON dashboard_digests(organization_id);
CREATE INDEX idx_dd_dashboard ON dashboard_digests(dashboard_id);
CREATE INDEX idx_dd_active ON dashboard_digests(is_active);

-- =====================================================
-- Портфели проектов (для группировки KPI)
-- =====================================================
CREATE TABLE project_portfolios (
    -- BaseEntity fields
    organization_id   UUID         NOT NULL REFERENCES organizations(id),
    code              VARCHAR(30)  NOT NULL,
    name              VARCHAR(300) NOT NULL,
    description       TEXT,
    manager_id        UUID         REFERENCES users(id),

    CONSTRAINT uq_portfolio_org_code UNIQUE (organization_id, code)
);

CREATE TABLE portfolio_projects (
    -- BaseEntity fields
    portfolio_id      UUID         NOT NULL REFERENCES project_portfolios(id),
    project_id        UUID         NOT NULL REFERENCES projects(id),
    sort_order        INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT uq_portfolio_project UNIQUE (portfolio_id, project_id)
);

CREATE INDEX idx_pp_portfolio ON portfolio_projects(portfolio_id);
CREATE INDEX idx_pp_project ON portfolio_projects(project_id);

-- =====================================================
-- Материализованное представление: сводка по проектам
-- =====================================================
CREATE MATERIALIZED VIEW mv_project_executive_summary AS
SELECT
    p.organization_id,
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    p.start_date,
    p.end_date,
    -- Финансы
    COALESCE(b.total_budget, 0) AS total_budget,
    COALESCE(b.spent_amount, 0) AS spent_amount,
    CASE WHEN b.total_budget > 0 THEN (b.spent_amount / b.total_budget * 100) ELSE 0 END AS budget_utilization_pct,
    -- Сроки
    COALESCE(evm.spi, 1.0) AS spi,
    COALESCE(evm.cpi, 1.0) AS cpi,
    -- Качество
    COALESCE(q.total_checks, 0) AS total_quality_checks,
    COALESCE(q.passed_checks, 0) AS passed_quality_checks,
    CASE WHEN q.total_checks > 0 THEN (q.passed_checks::NUMERIC / q.total_checks * 100) ELSE 100 END AS quality_pass_rate,
    COALESCE(q.open_nc, 0) AS open_non_conformances,
    -- Безопасность
    COALESCE(s.total_incidents, 0) AS total_incidents,
    COALESCE(s.days_without_incident, 0) AS days_without_incident,
    -- Punch List
    COALESCE(pl.open_items, 0) AS open_punch_items,
    COALESCE(pl.total_items, 0) AS total_punch_items
FROM projects p
LEFT JOIN LATERAL (
    SELECT SUM(amount) AS total_budget, SUM(CASE WHEN type = 'ACTUAL' THEN amount ELSE 0 END) AS spent_amount
    FROM budget_lines WHERE project_id = p.id AND deleted = FALSE
) b ON TRUE
LEFT JOIN LATERAL (
    SELECT spi, cpi FROM evm_snapshots
    WHERE project_id = p.id AND deleted = FALSE ORDER BY snapshot_date DESC LIMIT 1
) evm ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total_checks,
           COUNT(*) FILTER (WHERE result = 'PASS') AS passed_checks,
           COUNT(*) FILTER (WHERE status != 'CLOSED' AND result = 'FAIL') AS open_nc
    FROM quality_checks WHERE project_id = p.id AND deleted = FALSE
) q ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS total_incidents,
           (CURRENT_DATE - MAX(incident_date)::DATE) AS days_without_incident
    FROM safety_incidents WHERE project_id = p.id AND deleted = FALSE
) s ON TRUE
LEFT JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE status NOT IN ('CLOSED', 'VERIFIED')) AS open_items,
           COUNT(*) AS total_items
    FROM punch_items pi JOIN punch_lists pl2 ON pl2.id = pi.punch_list_id
    WHERE pl2.project_id = p.id AND pi.deleted = FALSE
) pl ON TRUE
WHERE p.deleted = FALSE;

CREATE UNIQUE INDEX idx_mv_pes ON mv_project_executive_summary(organization_id, project_id);
```

### 30.3 API Endpoints

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| **Дашборды** | | | |
| GET | `/api/executive/dashboards` | Список дашбордов (мои + публичные + системные) | ADMIN, MANAGER, VIEWER |
| GET | `/api/executive/dashboards/{id}` | Детали дашборда со всеми виджетами | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/dashboards` | Создание нового дашборда | ADMIN, MANAGER |
| PUT | `/api/executive/dashboards/{id}` | Обновление метаданных дашборда | ADMIN, MANAGER (owner) |
| DELETE | `/api/executive/dashboards/{id}` | Удаление дашборда | ADMIN, MANAGER (owner) |
| POST | `/api/executive/dashboards/{id}/clone` | Клонирование дашборда | ADMIN, MANAGER |
| PUT | `/api/executive/dashboards/{id}/layout` | Сохранение расположения виджетов (react-grid-layout) | ADMIN, MANAGER (owner) |
| PUT | `/api/executive/dashboards/{id}/set-default` | Установить как дашборд по умолчанию | ADMIN, MANAGER |
| **Виджеты** | | | |
| GET | `/api/executive/dashboards/{id}/widgets` | Список виджетов дашборда | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/dashboards/{id}/widgets` | Добавление виджета | ADMIN, MANAGER (owner) |
| PUT | `/api/executive/widgets/{widgetId}` | Обновление конфигурации виджета | ADMIN, MANAGER (owner) |
| DELETE | `/api/executive/widgets/{widgetId}` | Удаление виджета | ADMIN, MANAGER (owner) |
| GET | `/api/executive/widgets/{widgetId}/data` | Данные для конкретного виджета (с кешированием) | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/widgets/{widgetId}/refresh` | Принудительное обновление данных виджета | ADMIN, MANAGER |
| **Библиотека виджетов** | | | |
| GET | `/api/executive/widget-templates` | Каталог доступных виджетов (системные + организации) | ADMIN, MANAGER |
| GET | `/api/executive/widget-templates/{id}` | Детали шаблона виджета | ADMIN, MANAGER |
| POST | `/api/executive/widget-templates` | Создание пользовательского шаблона | ADMIN |
| **KPI** | | | |
| GET | `/api/executive/kpis` | Список KPI с текущими значениями | ADMIN, MANAGER, VIEWER |
| GET | `/api/executive/kpis/{id}/history` | История значений KPI (spark-line data) | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/kpis/{id}/collect` | Ручной сбор значения KPI | ADMIN |
| POST | `/api/executive/kpis/collect-all` | Запуск сбора всех KPI | ADMIN |
| **Портфели** | | | |
| GET | `/api/executive/portfolios` | Список портфелей проектов | ADMIN, MANAGER, VIEWER |
| GET | `/api/executive/portfolios/{id}` | Детали портфеля с KPI по проектам | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/portfolios` | Создание портфеля | ADMIN, MANAGER |
| PUT | `/api/executive/portfolios/{id}` | Обновление портфеля | ADMIN, MANAGER |
| POST | `/api/executive/portfolios/{id}/projects` | Добавление проектов в портфель | ADMIN, MANAGER |
| DELETE | `/api/executive/portfolios/{id}/projects/{projectId}` | Удаление проекта из портфеля | ADMIN, MANAGER |
| **Сводка** | | | |
| GET | `/api/executive/project-summary` | Сводная таблица по всем проектам (mv) | ADMIN, MANAGER, VIEWER |
| GET | `/api/executive/project-summary/{projectId}` | Детальная сводка по проекту | ADMIN, MANAGER, VIEWER |
| POST | `/api/executive/project-summary/refresh` | Обновление материализованного представления | ADMIN |
| **Дайджесты** | | | |
| GET | `/api/executive/digests` | Список дайджестов | ADMIN, MANAGER |
| POST | `/api/executive/digests` | Создание дайджеста | ADMIN, MANAGER |
| PUT | `/api/executive/digests/{id}` | Обновление настроек рассылки | ADMIN, MANAGER |
| DELETE | `/api/executive/digests/{id}` | Удаление дайджеста | ADMIN, MANAGER |
| POST | `/api/executive/digests/{id}/send-now` | Отправить дайджест немедленно | ADMIN, MANAGER |
| GET | `/api/executive/digests/{id}/preview` | Предпросмотр PDF/HTML дайджеста | ADMIN, MANAGER |
| **TV Mode** | | | |
| GET | `/api/executive/dashboards/{id}/tv` | Данные для TV-режима (все виджеты + auto-rotate) | ADMIN, MANAGER |

### 30.4 Экраны (UI)

**Экран 30-A: Панель руководителя (Executive Dashboard)**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Панель руководителя»                              │
│  subtitle: Портфель: [Все проекты ▾]  Период: [Q1 2026 ▾]      │
│  actions: [⚙ Настроить] [📺 TV-режим] [📧 Дайджест] [Экспорт] │
├─────────────────────────────────────────────────────────────────┤
│  ┌─ ОБЗОР ──────────────────────────────────────────────────┐   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │   │
│  │ │Проекты │ │Выручка │ │Маржа   │ │SPI     │ │LTIR    │  │   │
│  │ │ 12     │ │₽847М   │ │18.2%   │ │ 0.94   │ │ 0.82   │  │   │
│  │ │активных│ │↑ +12%  │ │↑ +2.1% │ │↓ -0.03 │ │↓ -0.12 │  │   │
│  │ │▁▂▃▄▅▆▇│ │▁▂▄▃▅▆▇│ │▃▄▅▄▅▆▇│ │▇▆▅▅▄▃▃│ │▃▂▂▁▁▁▁│  │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ ФИНАНСЫ (2x2) ─────────────┐ ┌─ СРОКИ (2x2) ─────────┐   │
│  │ Бюджет vs Факт               │ │ SPI / CPI по проектам   │   │
│  │ BarChart:                     │ │ ScatterPlot:            │   │
│  │ ██████████ Бюджет ₽1.2B      │ │    CPI                  │   │
│  │ ████████   Факт   ₽964M      │ │  1.2│      ●ЖК«Весна»  │   │
│  │ ██████     Прогноз ₽1.1B     │ │  1.0│─────●─────────●── │   │
│  │                               │ │  0.8│  ●                │   │
│  │ Кликни для детализации →      │ │     └──────────────── SPI│   │
│  └───────────────────────────────┘ └────────────────────────┘   │
│                                                                 │
│  ┌─ КАЧЕСТВО (2x1) ────────────┐ ┌─ БЕЗОПАСНОСТЬ (2x1) ───┐   │
│  │ Качество проверок             │ │ 47 дней без инцидентов  │   │
│  │ Gauge: 78.5% PASS             │ │ LTIR: 0.82 (цель <1.0) │   │
│  │ NC открытых: 14               │ │ Near-miss: 14/мес       │   │
│  │ Тренд: ▁▂▃▃▄▅▆▅▆▇            │ │ Тренд: ▇▆▅▃▂▂▁▁▁▁     │   │
│  └───────────────────────────────┘ └────────────────────────┘   │
│                                                                 │
│  ┌─ СВОДНАЯ ТАБЛИЦА ПРОЕКТОВ (4x2) ───────────────────────┐   │
│  │ DataTable с мини-спарклайнами:                           │   │
│  │ ┌──────────┬────────┬─────┬─────┬──────┬─────┬────────┐ │   │
│  │ │Проект    │Бюджет  │SPI  │CPI  │Качест│Безоп│ Статус │ │   │
│  │ ├──────────┼────────┼─────┼─────┼──────┼─────┼────────┤ │   │
│  │ │ЖК Весна  │₽320М   │0.97 │1.02 │85% ✅│47дн │🟢 Норм │ │   │
│  │ │БЦ Сокол  │₽180М   │0.82 │0.91 │72% ⚠│12дн │🟡 Риск │ │   │
│  │ │Склад Юг  │₽95М    │1.05 │1.08 │91% ✅│120дн│🟢 Норм │ │   │
│  │ │ЖК Рассвет│₽445М   │0.68 │0.75 │65% ❌│3дн  │🔴 Крит │ │   │
│  │ └──────────┴────────┴─────┴─────┴──────┴─────┴────────┘ │   │
│  │ * Клик на проект → drill-down в ProjectDetailPage        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: react-grid-layout для drag-and-drop расположения виджетов. Каждый виджет — отдельный React-компонент с собственным useQuery и refreshInterval. Sparklines — recharts (tiny LineChart без осей). Gauge — кастомный SVG дуга (180 градусов). ScatterPlot — Recharts ScatterChart. Цветовая индикация: зелёный (KPI в норме), жёлтый (warningThreshold), красный (criticalThreshold). Drill-down: клик на виджет → навигация по drill_down_url (например, /projects/{id}, /finance/cashflow, /safety/dashboard).

**Экран 30-B: Конструктор дашборда**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Настройка панели: Панель генерального директора»   │
│  actions: [Предпросмотр] [Сохранить] [Отменить]                 │
├─────────────────────────────────────────────────────────────────┤
│  Левая панель: Библиотека виджетов                              │
│  ┌────────────────────────┐ ┌──────────────────────────────┐    │
│  │ Поиск: [___________🔍] │ │                              │    │
│  │                        │ │  CANVAS (react-grid-layout)  │    │
│  │ ▼ Обзорные             │ │  ┌──────┐ ┌──────┐ ┌──────┐ │    │
│  │   📊 Активные проекты  │ │  │KPI 1 │ │KPI 2 │ │KPI 3 │ │    │
│  │   📊 Выручка           │ │  └──────┘ └──────┘ └──────┘ │    │
│  │   📊 Маржа             │ │  ┌─────────────┐ ┌─────────┐│    │
│  │                        │ │  │ Бюджет vs   │ │ SPI/CPI ││    │
│  │ ▼ Финансы              │ │  │ Факт (2x2)  │ │ (2x2)   ││    │
│  │   📈 Cash Flow         │ │  │             │ │         ││    │
│  │   📊 Дебиторка         │ │  └─────────────┘ └─────────┘│    │
│  │   📊 P&L              │ │  ┌─────────────────────────┐ │    │
│  │                        │ │  │ Сводная таблица (4x2)   │ │    │
│  │ ▼ Сроки               │ │  │                         │ │    │
│  │   📉 SPI Тренд        │ │  └─────────────────────────┘ │    │
│  │   📉 Gantt Overview   │ │                              │    │
│  │                        │ │  Перетащите виджет сюда      │    │
│  │ ▼ Качество            │ │                              │    │
│  │ ▼ Безопасность        │ │                              │    │
│  │ ▼ Склад               │ │                              │    │
│  └────────────────────────┘ └──────────────────────────────┘    │
│                                                                 │
│  Настройки выбранного виджета (правая панель):                   │
│  ┌────────────────────────┐                                     │
│  │ Заголовок: [_________] │                                     │
│  │ Размер: [2x2 ▾]       │                                     │
│  │ Период: [Текущий кв. ▾]│                                     │
│  │ Проекты: [Все ▾]       │                                     │
│  │ Обновление: [300] сек  │                                     │
│  │ Spark-line: [☑]        │                                     │
│  │ Drill-down: [/finance] │                                     │
│  └────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: трёхколоночный layout. Левая панель — каталог виджетов из widget_templates с группировкой по category. Drag из каталога → drop на canvas (react-grid-layout). Правая панель — настройки выбранного виджета (react-hook-form). Canvas сохраняет layout через PUT /layout (массив {widgetId, x, y, w, h}). Библиотека включает ~30 преднастроенных виджетов по категориям.

**Экран 30-C: TV-режим (для офисных экранов)**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                      [✕ Выйти] │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │12      │ │₽847М   │ │18.2%   │ │ 0.94   │ │ 47 дн  │       │
│  │проектов│ │выручка │ │маржа   │ │SPI ▼   │ │без инц.│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │ ФИНАНСЫ                     │ │ БЕЗОПАСНОСТЬ             │   │
│  │ ████████████████ ₽1.2B Plan │ │ LTIR: 0.82 ↓            │   │
│  │ ████████████   ₽964M Fact   │ │ ████████████████████████ │   │
│  │                             │ │ Gauge: 82% Safe Days     │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ СВОДНАЯ: ЖК Весна 🟢 | БЦ Сокол 🟡 | Склад Юг 🟢 |    │   │
│  │          ЖК Рассвет 🔴 | ... (auto-scroll)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                    Стр. 1/3    │
│  ⏱ Авто-ротация: 30 сек     🕐 Обновлено: 15:42              │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: fullscreen API (`document.documentElement.requestFullscreen()`). Авто-ротация страниц через setInterval (auto_rotate_seconds). Увеличенные шрифты (text-2xl/3xl). Тёмный фон для офисных экранов (`theme: DARK`). WebSocket push для real-time обновления данных (через существующий RedisWebSocketBroadcast). Скрытие навигации и header. ESC для выхода из режима.

**Экран 30-D: Дайджест-рассылка**
```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: «Настройка дайджестов»                             │
│  actions: [+ Создать дайджест]                                  │
├─────────────────────────────────────────────────────────────────┤
│  DataTable:                                                     │
│  ┌────────────────┬──────────┬───────────┬──────────┬────────┐  │
│  │ Название       │Дашборд   │Частота    │Получатели│Действия│  │
│  ├────────────────┼──────────┼───────────┼──────────┼────────┤  │
│  │Еженедельный CEO│Панель CEO│Пн 08:00   │3 чел.    │✎ 📧 🗑│  │
│  │Ежемес. совет   │Финансовая│1-е число  │7 чел.    │✎ 📧 🗑│  │
│  └────────────────┴──────────┴───────────┴──────────┴────────┘  │
│  📧=отправить сейчас                                            │
│                                                                 │
│  Форма создания/редактирования:                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Название: [Еженедельный отчёт для CEO             ]     │    │
│  │ Дашборд: [Панель генерального директора ▾]              │    │
│  │ Частота: [Еженедельно ▾]  День: [Понедельник ▾]        │    │
│  │ Время отправки: [08:00]                                 │    │
│  │ Получатели: [Иванов А.А. ✕] [Петров Б.Б. ✕] [+]      │    │
│  │ Доп. email: [ceo@company.ru ✕] [+]                     │    │
│  │ Формат: ○ PDF  ● HTML                                  │    │
│  │ ☑ Включить комментарии                                  │    │
│  │ [Предпросмотр]  [Сохранить]                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
Реализация: React-hook-form + multi-select для получателей. Предпросмотр — открывает новую вкладку с GET /preview (PDF или HTML-вёрстка). Расписание — @Scheduled на бэкенде (DigestSchedulerService) с cron из частоты и дня/времени. Отправка через EmailService (существующий). PDF генерируется из данных виджетов через PdfReportService + шаблон iText/OpenPDF.

### 30.5 Бизнес-правила и валидации

1. **Автоматический сбор KPI:** @Scheduled задача (KpiCollectorService) запускается каждый час. Для каждого KPI с collector_status=ACTIVE и collection_cron — выполняется data_query, результат сохраняется в kpi_snapshots. Delta рассчитывается относительно предыдущего snapshot.
2. **Направление KPI:** direction определяет цветовую индикацию: HIGHER_IS_BETTER (маржа, SPI) — рост = зелёный; LOWER_IS_BETTER (LTIR, дефекты) — падение = зелёный; TARGET_IS_BEST — ближе к target = лучше.
3. **Материализованные представления:** mv_project_executive_summary обновляется каждые 15 минут (pg_cron или @Scheduled + REFRESH MATERIALIZED VIEW CONCURRENTLY). Для dashboard_widgets.data_source — маршрутизация: если source начинается с «mv_» → прямой SQL; если «api/» → HTTP вызов внутреннего API; если «kpi/» → из kpi_snapshots.
4. **WebSocket push:** при обновлении kpi_snapshots — Redis pub/sub → WebSocket broadcast на канал `/topic/executive/{dashboardId}`. Клиент получает delta-обновление и обновляет виджет без полной перезагрузки.
5. **TV-режим:** доступ по ссылке без авторизации (опционально, настраивается ADMIN). Генерируется JWT с ограниченными правами (read-only, конкретный dashboard). Ротация страниц: если виджетов больше, чем помещается на экране — авто-пагинация.
6. **Дайджест PDF:** snapshot данных на момент отправки. Включает: заголовок с датой, MetricCards в PDF-формате (iText table), графики как PNG (server-side rendering через headless browser или Apache Batik для SVG). Размер < 5MB.
7. **Портфели:** проект может входить в несколько портфелей. KPI агрегируются по портфелю: финансы = SUM, SPI/CPI = WEIGHTED_AVG (по бюджету), качество = AVG, безопасность = worst-case.
8. **Системные виджеты:** ~30 преднастроенных шаблонов (is_system=true): Активные проекты, Выручка, Маржинальность, Cash Flow, Дебиторская задолженность, SPI тренд, CPI тренд, Gantt Overview, Качество (% PASS), Открытые NC, LTIR, Дни без инцидентов, Near-miss ratio, Утилизация ресурсов, Складские остатки, Punch List открытые, Закупки в процессе, Контракты по статусам, Персонал на объектах, Вахтовый график.

### 30.6 Матрица RBAC

| Действие | ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER |
|----------|-------|---------|----------|------------|--------|
| Просмотр дашборда | + | + | - | - | + (публичные) |
| Создание дашборда | + | + | - | - | - |
| Настройка виджетов | + | + (свой) | - | - | - |
| TV-режим | + | + | - | - | + |
| Дайджесты (CRUD) | + | + | - | - | - |
| KPI управление | + | - | - | - | - |
| Портфели (CRUD) | + | + | - | - | - |
| Сводка по проектам | + | + | - | - | + |
| Обновить MV | + | - | - | - | - |
| Системные шаблоны | + | - | - | - | - |

### 30.7 Крайние случаи

1. **KPI collector завершился с ошибкой** — collector_status = ERROR, last_error_message записывается. Уведомление ADMIN. Retry через 15 минут (до 3 попыток). Если все retry провалились — отображается «Данные устарели: {last_collected_at}».
2. **Проект без данных** — виджет показывает «Нет данных» (EmptyState). В сводной таблице — прочерки. Не считается в агрегации портфеля.
3. **>20 проектов в портфеле** — сводная таблица с серверной пагинацией + сортировка по статусу (критические наверху). Top-5 проблемных проектов выделены.
4. **WebSocket disconnect** — fallback на polling (каждые refreshIntervalSeconds). Индикатор «Real-time: отключён» в углу виджета.
5. **Мобильный экран** — виджеты перестраиваются в одноколоночный layout (breakpoint < 768px). Каждый виджет занимает full-width. TV-режим недоступен на мобильных.
6. **Дайджест без данных** — не отправляется, если все KPI = NULL. Логируется предупреждение.

### 30.8 UX Бенчмарк

**Лучший в классе:** Procore (Analytics + Executive Dashboard, 2024) — лучший executive dashboard для строительства: drag-and-drop виджеты, drill-down, PDF reports, TV-mode. Power BI Embedded — кастомные виджеты с interactivity. Tableau Server — enterprise BI с role-based access. InEight (Oracle) — portfolio-level KPI aggregation. Для российского рынка: 1С:Управление строительной организацией — «Рабочий стол руководителя» с KPI; Битрикс24 — drag-and-drop dashboard с виджетами; GanttPRO — portfolio overview.

---
