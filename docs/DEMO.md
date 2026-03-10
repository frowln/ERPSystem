# Демо-среда Привод

Демо-среда позволяет быстро развернуть полностью работающую платформу Привод с предзаполненными данными для демонстрации, тестирования и ознакомления.

## Требования

- **Docker Desktop** 4.x+ (с Docker Compose V2)
- **Node.js** 18+ (для загрузки демо-данных)
- 4 ГБ+ свободной оперативной памяти
- 10 ГБ+ дискового пространства

## Быстрый старт

Одна команда для полного развёртывания:

```bash
./scripts/demo-setup.sh
```

Скрипт автоматически:
1. Проверит наличие Docker
2. Соберёт и запустит все контейнеры (PostgreSQL, Redis, MinIO, Backend, Frontend)
3. Дождётся готовности backend
4. Загрузит демо-данные (проект, спецификации, сметы, бюджет, контракты, счета)

Первая сборка занимает 5-10 минут (скачивание образов + компиляция).
Последующие запуски — 1-2 минуты.

## Параметры запуска

```bash
# Стандартный запуск с демо-данными
./scripts/demo-setup.sh

# Запуск без загрузки данных
./scripts/demo-setup.sh --no-seed

# Полный сброс (удалить базу и пересоздать)
./scripts/demo-setup.sh --reset

# Справка
./scripts/demo-setup.sh --help
```

## Доступные сервисы

| Сервис           | URL                          | Описание                    |
|------------------|------------------------------|-----------------------------|
| Frontend         | http://localhost:3000         | Веб-интерфейс платформы     |
| Backend API      | http://localhost:8080/api     | REST API                    |
| Swagger UI       | http://localhost:3000/swagger-ui/ | Документация API        |
| MinIO Console    | http://localhost:9001         | Хранилище файлов (S3)       |

Прямой доступ к инфраструктуре:

| Сервис     | Хост:Порт          | Учётные данные              |
|------------|---------------------|-----------------------------|
| PostgreSQL | localhost:15432     | privod / demo_password      |
| Redis      | localhost:16379     | без пароля                  |
| MinIO S3   | localhost:9000      | minioadmin / minioadmin     |

## Демо-аккаунты

Все аккаунты используют пароль: `Demo123!`

| Роль         | Email                         | Описание                             |
|--------------|-------------------------------|--------------------------------------|
| Админ        | admin@demo.privod.ru          | Полный доступ ко всем модулям        |
| Менеджер     | manager@demo.privod.ru        | Управление проектами и задачами      |
| Инженер      | engineer@demo.privod.ru       | Работа со спецификациями и чертежами |
| Бухгалтер    | accountant@demo.privod.ru     | Финансы, бюджеты, счета              |
| Наблюдатель  | viewer@demo.privod.ru         | Только просмотр                      |

## Управление

```bash
# Просмотр логов (все сервисы)
docker compose -f docker-compose.demo.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.demo.yml logs -f backend
docker compose -f docker-compose.demo.yml logs -f frontend

# Статус контейнеров
docker compose -f docker-compose.demo.yml ps

# Остановка
docker compose -f docker-compose.demo.yml down

# Остановка с удалением данных
docker compose -f docker-compose.demo.yml down -v

# Перезапуск backend
docker compose -f docker-compose.demo.yml restart backend
```

## Подключение к базе данных

```bash
# Через psql (если установлен)
psql -h localhost -p 15432 -U privod -d privod2_demo

# Через Docker
docker compose -f docker-compose.demo.yml exec postgres \
  psql -U privod -d privod2_demo
```

## Повторная загрузка данных

Если нужно загрузить демо-данные заново:

```bash
API_ROOT=http://localhost:8080/api \
PRIVOD_EMAIL=admin@demo.privod.ru \
PRIVOD_PASSWORD=Demo123! \
  node scripts/seed_full_finmodel_demo.mjs
```

Для полного сброса и пересоздания:

```bash
./scripts/demo-setup.sh --reset
```

## Архитектура демо-среды

```
docker-compose.demo.yml
├── postgres (PostgreSQL 16)     — порт 15432
├── redis (Redis 7)              — порт 16379
├── minio (MinIO S3)             — порты 9000, 9001
├── minio-init                   — создаёт bucket при первом запуске
├── backend (Spring Boot 3.4)    — порт 8080
│   └── профиль: demo
│       └── DemoDataInitializer  — создаёт роли и демо-пользователей
└── frontend (Nginx + React SPA) — порт 3000
    └── nginx проксирует /api/ → backend:8080
```

## Отличия от production

| Параметр          | Демо                          | Production                   |
|-------------------|-------------------------------|------------------------------|
| Профиль Spring    | demo                          | prod                         |
| Пароль БД         | demo_password (фиксированный) | Из .env (обязательный)       |
| Redis пароль      | Без пароля                    | Из .env (обязательный)       |
| JWT секрет        | Фиксированный (демо)         | Из .env (обязательный)       |
| Swagger UI        | Включён                       | Отключён                     |
| DDL auto          | update                        | validate / none              |
| Мониторинг        | Нет                           | Prometheus + Alertmanager    |
| SSL/TLS           | Нет                           | Nginx + Let's Encrypt        |
| Бэкапы            | Нет                           | Ежедневные                   |

## Решение проблем

### Backend не запускается

```bash
# Проверить логи
docker compose -f docker-compose.demo.yml logs backend

# Частая причина — порт 8080 уже занят
lsof -i :8080
```

### Порт уже занят

Если порты 3000, 8080, 9000 или 15432 заняты, остановите конфликтующие сервисы или измените порты в `docker-compose.demo.yml`.

### Ошибки при сборке frontend

```bash
# Пересобрать с нуля
docker compose -f docker-compose.demo.yml build --no-cache frontend
```

### Недостаточно памяти

Демо-среда требует ~2 ГБ RAM. Увеличьте лимит Docker Desktop в настройках (Resources → Memory).
