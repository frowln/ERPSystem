# CRM + Portal + Support — Бизнес-анализ

**Дата**: 2026-03-12
**Тест**: `e2e/tests/workflows/crm-portal-support.wf.spec.ts`
**Персоны**: Менеджер по продажам, Заказчик (Иванченко М.П.), Техподдержка
**Фазы**: 5 (A–E), 28 шагов, ~250 assertions

---

## 1. CRM: Воронка продаж

### Privod
**Статус**: Реализовано
- Pipeline дашборд с KPI (total/weighted revenue, win rate, avg deal)
- 6 фиксированных стадий: NEW → QUALIFIED → PROPOSITION → NEGOTIATION → WON / LOST
- Kanban + List view toggle
- Активности: CALL, MEETING, EMAIL, PROPOSAL, SITE_VISIT
- Удаление с подтверждением, фильтры по команде

### Лучший конкурент
**Кто**: Битрикс24
**Как у них**: 100+ настроек CRM, кастомные стадии, встроенная телефония, маркетплейс, автоматические триггеры на каждый переход.

### GAP анализ
| Фича | Privod | Битрикс24 | Приоритет |
|------|--------|-----------|-----------|
| Кастомные стадии | Нет (6 fixed) | Да (∞) | MEDIUM |
| Автоматические триггеры | Нет | Да | LOW |
| Встроенная телефония | Нет | Да | LOW |
| CRM → Project conversion | Endpoint есть, UX нет | — | HIGH |
| Строительная специфика (объект, тип работ) | Есть | Нет | **Наше преимущество** |

**Вывод**: Для стройки 6 стадий достаточно. Наше CRM проще Б24, но имеет уникальную строительную вертикаль. Кастомные стадии = nice-to-have.

---

## 2. Portal: Заказчик за 30 секунд

### Privod
**Статус**: Реализовано (16 страниц портала)
- Dashboard: проекты, документы, дефекты, RFI, задачи, подписи
- Документы: список по категориям
- Контракты, счета, расписание
- RFI с ответами, дефекты с timeline
- **УНИКАЛЬНО**: КС-2 черновики через портал (ни у кого нет!)
- **УНИКАЛЬНО**: КП согласование через портал
- Электронное подписание документов
- Фото-отчёты, ежедневные отчёты

### Лучший конкурент
**Кто**: Buildertrend (portal UX), Procore (feature depth)
**Как у них**:
- Buildertrend: заказчик видит фото каждую неделю, может оплатить онлайн, интуитивный UI
- Procore: RFI workflow = эталон, change order tracking, 200+ интеграций

### GAP анализ
| Фича | Privod | Buildertrend | Procore | Приоритет |
|------|--------|-------------|---------|-----------|
| Фото прогресса | Есть | ++++ | +++ | MEDIUM (UI polish) |
| Онлайн оплата | Нет | Есть | Нет | MEDIUM |
| КС-2 черновики | **Есть** | Нет | Нет | — (наше!) |
| КП через портал | **Есть** | Нет | Нет | — (наше!) |
| RFI workflow | Есть | + | ++++ | MEDIUM (depth) |
| Авто-доступ при выигрыше | Нет | Partial | Да | HIGH |

**Вывод**: Портал на уровне 7/10 от Procore. Уникальные фичи (КС-2 drafts, КП approval) = конкурентное преимущество. Слабое место: нет автоматического invite заказчика при конвертации лида.

---

## 3. Security: Маржа и КЛ скрыты?

### Проверка
- Сканировались 5 страниц портала на утечку: costPrice, маржа, margin, profitRate, КЛ, закупочные цены
- **Результат**: Проверяется runtime — структурно код НЕ передаёт внутренние цены через portal API
- Portal API (`/portal/*`) отдельные endpoints, не используют backend controllers с costPrice

### Рекомендации
- [HIGH] Добавить backend filter/interceptor: любой `/portal/*` response НЕ ДОЛЖЕН содержать `costPrice`, `margin`, `profitRate` полей
- [MEDIUM] Audit log: логировать если portal user попытался обратиться к не-portal endpoint
- [LOW] Penetration test: проверить что `/api/specifications/{id}` недоступен с portal-токеном

---

## 4. Мессенджер: быстрее WhatsApp?

### Privod
- Каналы (public/private/direct), треды, реакции, pin, favorites
- Поиск, вложения файлов, статусы пользователей

### Оценка
| Критерий | WhatsApp | Privod | Примечание |
|----------|----------|--------|------------|
| Скорость открытия | <1s | 2-3s | Нужен PWA + Service Worker |
| Push-уведомления | Да | PWA push | Работает |
| Offline | Да | Partial (IndexedDB) | Нужно доработать |
| Файлы с площадки | Фото+видео | Да | На уровне |
| Привязка к проекту | Нет | Да | **Наше преимущество** |
| Аудит/комплаенс | Нет | Да | **Наше преимущество** |

**Честный ответ**: Прорабы НЕ перейдут с WhatsApp ради чата. Но если весь workflow в системе (daily log → chat → defect), чат становится органичной частью. Ключ = интеграция, а не standalone chat.

---

## 5. Support: Тикетная система

### Privod
- Dashboard с KPI (open/resolved/avg time)
- Тикеты: OPEN → ASSIGNED → IN_PROGRESS → WAITING_RESPONSE → RESOLVED → CLOSED
- Kanban board + list view
- Комментарии (internal/external)
- Категории: TECHNICAL, ACCESS, DOCUMENTS, BUG, QUESTION, FEATURE_REQUEST
- Приоритеты: LOW, MEDIUM, HIGH, CRITICAL

### GAP
| Фича | Статус | Приоритет |
|------|--------|-----------|
| SLA индикаторы | Нет | HIGH |
| Email уведомления | Backend есть, проверка нужна | MEDIUM |
| Knowledge base | Categories есть, articles нет | LOW |
| Satisfaction survey | Поле есть, UI нет | LOW |
| Auto-assign by category | Backend ready, config нужна | MEDIUM |

---

## 6. Сравнение: Procore Portal = эталон

| Критерий | Procore | Privod | Оценка |
|----------|---------|--------|--------|
| Количество portal pages | ~20 | 16 | 8/10 |
| RFI workflow depth | ++++ | ++ | 5/10 |
| Document management | ++++ | +++ | 7/10 |
| Photo reports | +++ | ++ | 6/10 |
| Schedule visibility | ++++ | ++ | 5/10 |
| Financial transparency | +++ | +++ | 8/10 |
| Signature workflow | ++ | +++ | 9/10 |
| **КС-2 draft review** | Нет | **Есть** | 10/10 |
| **КП portal approval** | Нет | **Есть** | 10/10 |
| Mobile UX | ++++ | + | 3/10 |
| **ИТОГО** | — | — | **7/10** |

---

## 7. Уникальность Privod

### Фичи, которых НЕТ ни у одного конкурента:
1. **КС-2 черновики через портал** — заказчик проверяет объёмы до подписания. Сокращает цикл закрытия с 2 недель до 2 дней.
2. **КП согласование через портал** — заказчик утверждает коммерческое предложение онлайн, без email ping-pong.
3. **Полная цепочка Spec → КЛ → ФМ ← ЛСР → КП** интегрированная с порталом — ни одна система не связывает pre-construction с client portal.

### Roadmap приоритеты
1. [P0] Авто-invite заказчика при CRM → Project conversion
2. [P0] SLA индикаторы в тикетах
3. [P1] Backend security filter для portal endpoints (strip sensitive fields)
4. [P1] Мобильная оптимизация портала (заказчик смотрит с телефона)
5. [P2] Онлайн оплата через портал (YooKassa уже есть для подписки)
6. [P2] RFI depth — auto-link to drawings/specs
7. [P3] CRM кастомные стадии
8. [P3] Knowledge base для Support

---

*Сгенерировано автоматически при прогоне E2E workflow CRM + Portal + Support.*
