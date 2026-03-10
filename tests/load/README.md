# Нагрузочное тестирование Привод

Скрипты нагрузочного тестирования на базе [k6](https://k6.io/) для платформы Привод.

## Установка k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Структура

```
tests/load/
  config.js                  # Конфигурация: URL, учётные данные, хелперы
  run-all.js                 # Главная точка входа — все сценарии
  README.md
  scenarios/
    auth.js                  # Аутентификация (login, refresh, /me)
    projects.js              # Проекты (CRUD, dashboard)
    tasks.js                 # Задачи (CRUD, обновление статуса)
    finance.js               # Финансы (бюджеты, счета, сводки)
```

## Запуск

### Все сценарии (полный прогон)

```bash
k6 run tests/load/run-all.js
```

Профиль нагрузки по умолчанию:
- Разгон: 0 → 50 пользователей за 2 мин
- Устойчивая нагрузка: 50 пользователей — 5 мин
- Пик: 50 → 100 пользователей за 1 мин
- Устойчивый пик: 100 пользователей — 3 мин
- Снижение: 100 → 0 за 2 мин

### Отдельные сценарии

```bash
k6 run tests/load/scenarios/auth.js
k6 run tests/load/scenarios/projects.js
k6 run tests/load/scenarios/tasks.js
k6 run tests/load/scenarios/finance.js
```

### С переменными окружения

```bash
# Другой URL бэкенда
k6 run -e BASE_URL=https://staging.privod.ru tests/load/run-all.js

# Пользовательские учётные данные
k6 run -e ADMIN_EMAIL=test@company.ru -e ADMIN_PASSWORD=secret tests/load/run-all.js
```

### С ограничением количества VU

```bash
# Быстрый smoke-тест: 5 VU, 30 секунд
k6 run --vus 5 --duration 30s tests/load/scenarios/auth.js
```

## Визуализация (Grafana + InfluxDB)

### Запуск InfluxDB и Grafana

```bash
docker run -d --name influxdb -p 8086:8086 influxdb:1.8
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

### Отправка результатов в InfluxDB

```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load/run-all.js
```

Затем настройте datasource InfluxDB в Grafana и импортируйте дашборд k6
(ID: 2587 в Grafana Dashboards).

## Пороговые значения (Thresholds)

| Метрика | Порог | Описание |
|---------|-------|----------|
| `http_req_duration` | p95 < 1000ms | Общее время ответа |
| `http_req_failed` | rate < 5% | Общий процент ошибок |
| `auth_login_duration` | p95 < 500ms | Время входа |
| `auth_refresh_duration` | p95 < 500ms | Время обновления токена |
| `auth_error_rate` | rate < 1% | Ошибки аутентификации |
| `projects_*_duration` | p95 < 1000ms | Операции с проектами |
| `tasks_*_duration` | p95 < 800ms | Операции с задачами |
| `finance_*_duration` | p95 < 1000ms | Финансовые операции |

## Очистка тестовых данных

Сценарий `projects.js` автоматически удаляет созданные проекты.
Задачи, созданные сценарием `tasks.js`, можно найти по префиксу `k6-task-` и удалить вручную.
