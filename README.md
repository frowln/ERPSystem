# ПРИВОД — Строительная ERP/CRM платформа

> Полнофункциональная платформа для управления строительными проектами

## Быстрый старт

### Требования
- Docker + Docker Compose
- Java 21 (для локальной разработки backend)
- Node.js 24+ (для локальной разработки frontend)

### Запуск
```bash
docker-compose up -d
```

Приложение будет доступно:
- Frontend: http://localhost:4000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui
- PostgreSQL: localhost:15432

### Разработка

**Backend:**
```bash
cd backend
./gradlew bootRun
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Тестирование

**Unit-тесты (frontend):**
```bash
cd frontend
npx vitest run --dir src
```

**E2E-тесты (Playwright):**
```bash
cd frontend
npx playwright test --config=e2e/playwright.config.ts
```

**Backend:**
```bash
cd backend
./gradlew compileJava
```

## Архитектура

| Компонент | Технологии |
|-----------|-----------|
| Frontend | React 19, TypeScript 5.7, Vite 6, Tailwind CSS, Zustand 5, TanStack Query |
| Backend | Java 21, Spring Boot 3.4, Spring Security, MapStruct, Lombok |
| База данных | PostgreSQL 16, Flyway migrations (300+) |
| Кэш | Redis |
| Файлы | MinIO (S3-compatible) |
| Почта | SMTP (Yandex / MailHog для разработки) |
| CI/CD | GitHub Actions |

### Frontend (`frontend/src/`)

| Директория | Назначение |
|------------|-----------|
| `api/` | Axios API-функции (JWT-interceptor) |
| `components/` | Общие компоненты |
| `config/` | `navigation.ts`, `routePermissions.ts` |
| `design-system/` | Токены, базовые UI-компоненты (DataTable, FormField, StatusBadge) |
| `hooks/` | Кастомные React-хуки |
| `i18n/` | `ru.ts` (основной) + `en.ts` (~25k строк каждый) |
| `modules/` | 85 функциональных модулей |
| `routes/` | Доменные маршруты (`projectRoutes.tsx`, `financeRoutes.tsx` и др.) |
| `stores/` | Zustand-стор |
| `types/` | Общие TypeScript-типы |

### Backend (`backend/src/main/java/com/privod/platform/`)

| Директория | Назначение |
|------------|-----------|
| `modules/<name>/domain/` | JPA-сущности |
| `modules/<name>/repository/` | Spring Data-репозитории |
| `modules/<name>/service/` | Бизнес-логика |
| `modules/<name>/web/` | REST-контроллеры + DTO |
| `infrastructure/` | Безопасность, конфигурация, фильтры |

## Модули

- **Проекты**: управление проектами, задачи, Kanban, Gantt, вехи
- **Финансы**: бюджеты, счета, оплаты, cash flow, факторинг
- **Сметы**: ЛСР, ГРАНД-Смета импорт, коэффициенты Минстроя, нормативные базы
- **КС-2/КС-3**: формирование актов, привязка к сметам
- **Закупки**: спецификации, конкурентные листы, финансовые модели, коммерческие предложения
- **Склад**: приход/расход, М-29, штрихкоды, инвентаризация
- **Кадры**: табель Т-13, отпуска, больничные, производственный календарь, штатное расписание
- **Охрана труда**: инциденты, инструктажи, LTIFR, оценка рисков
- **Качество**: дефекты, чек-листы, АОСР, несоответствия
- **Документооборот**: ЭДО, версионирование, исполнительная документация
- **CRM**: лиды, контрагенты, воронка продаж
- **Аналитика**: дашборды, EVM (CPI/SPI), предиктивная аналитика
- **Интеграции**: 1С, Telegram, webhooks, email, DaData
- **Портал**: клиентский портал (без доступа к себестоимости)
- **Автопарк**: путевые листы, ТО, водители
- **BIM**: 3D-модели, clash detection
- **PWA**: офлайн-режим, push-уведомления, установка на устройство
- **Подписки**: тарифы, YooKassa-оплата

## API

- OpenAPI: `/api-docs`
- Swagger UI: `/swagger-ui`
- JWT-аутентификация
- Rate limiting (600 req/min, 10 auth req/min)
- HMAC-верификация webhooks
- RBAC: `ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER`

## Конфигурация

Все переменные окружения описаны в `backend/.env.example`.

## Лицензия

Proprietary. All rights reserved.
