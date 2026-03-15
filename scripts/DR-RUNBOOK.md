# Инструкция по аварийному восстановлению (DR Runbook)

> Для дежурного инженера. Все команды — копипаст. Выполнять по порядку.

---

## 1. Диагностика

### Проверить статус контейнеров

```bash
docker compose ps
```

Ожидаемый результат: все сервисы `healthy` / `Up`. Если какой-то `Exit` или `Restarting` — перейти к п.2.

### Проверить доступность API

```bash
curl -sf http://localhost:8080/api/health && echo "OK" || echo "BACKEND DOWN"
```

### Проверить базу данных

```bash
pg_isready -h localhost -p 15432 -U privod -d privod2
```

Ожидаемый ответ: `accepting connections`. Если нет — БД упала, перейти к п.2.

### Проверить Redis

```bash
docker compose exec redis redis-cli ping
```

Ожидаемый ответ: `PONG`.

### Проверить логи (последние 100 строк)

```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 postgres
```

---

## 2. Перезапуск сервисов

### Перезапуск всего стека

```bash
docker compose restart
```

Подождать 30 секунд, проверить:

```bash
docker compose ps
curl -sf http://localhost:8080/api/health && echo "OK" || echo "STILL DOWN"
```

### Перезапуск отдельного сервиса

```bash
docker compose restart backend    # только бэкенд
docker compose restart postgres   # только БД
docker compose restart redis      # только Redis
docker compose restart minio      # только MinIO
```

### Если контейнер не стартует — пересоздать

```bash
docker compose up -d --force-recreate backend
```

### Проверить место на диске (частая причина падений)

```bash
df -h /
docker system df
```

Если диск заполнен:

```bash
docker system prune -f          # удалить неиспользуемые образы/контейнеры
docker volume prune -f          # удалить неиспользуемые тома (ОСТОРОЖНО — не удалит именованные)
```

---

## 3. Восстановление БД из бэкапа

> Выполнять ТОЛЬКО если БД повреждена или данные потеряны. Обычный перезапуск — п.2.

### 3.1 Скачать последний бэкап

```bash
aws s3 cp s3://privod-backups/latest.sql.gz.gpg /tmp/
```

Или конкретную дату:

```bash
aws s3 ls s3://privod-backups/                              # посмотреть доступные
aws s3 cp s3://privod-backups/privod2_2026-03-14.sql.gz.gpg /tmp/latest.sql.gz.gpg
```

### 3.2 Расшифровать

```bash
gpg --decrypt --output /tmp/latest.sql.gz /tmp/latest.sql.gz.gpg
```

Ввести пароль GPG-ключа при запросе.

### 3.3 Распаковать

```bash
gunzip /tmp/latest.sql.gz
```

### 3.4 Остановить бэкенд (чтобы не было активных соединений)

```bash
docker compose stop backend
```

### 3.5 Восстановить базу

```bash
pg_restore --clean --if-exists -h localhost -p 15432 -U privod -d privod2 /tmp/latest.sql
```

Если бэкап в формате plain SQL (не custom):

```bash
psql -h localhost -p 15432 -U privod -d privod2 < /tmp/latest.sql
```

Пароль: `privod_dev`

### 3.6 Запустить бэкенд

```bash
docker compose start backend
```

### 3.7 Проверить что поднялось

```bash
sleep 15
curl -sf http://localhost:8080/api/health && echo "RESTORED OK" || echo "RESTORE FAILED"
```

### 3.8 Удалить временные файлы

```bash
rm -f /tmp/latest.sql.gz.gpg /tmp/latest.sql.gz /tmp/latest.sql
```

---

## 4. Проверка целостности после восстановления

### Flyway — проверить что миграции консистентны

```bash
docker compose exec backend java -jar app.jar --spring.flyway.enabled=true flyway:validate
```

Или через SQL:

```bash
psql -h localhost -p 15432 -U privod -d privod2 -c "SELECT count(*), max(version) FROM flyway_schema_history WHERE success = true;"
```

### Проверить количество записей в основных таблицах

```bash
psql -h localhost -p 15432 -U privod -d privod2 -c "
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'tasks', count(*) FROM tasks
UNION ALL SELECT 'contracts', count(*) FROM contracts
UNION ALL SELECT 'organizations', count(*) FROM organizations
UNION ALL SELECT 'counterparties', count(*) FROM counterparties
ORDER BY tbl;
"
```

Сравнить с предыдущими известными значениями. Если расхождение значительное — возможно бэкап устаревший.

### Проверить что фронтенд работает

```bash
curl -sf http://localhost:4000 && echo "FRONTEND OK" || echo "FRONTEND DOWN"
```

---

## 5. Контакты дежурных

| Роль | Имя | Телефон | Telegram |
|------|-----|---------|----------|
| DevOps (основной) | _______________ | _______________ | _______________ |
| DevOps (резерв) | _______________ | _______________ | _______________ |
| Backend-разработчик | _______________ | _______________ | _______________ |
| DBA | _______________ | _______________ | _______________ |
| Руководитель проекта | _______________ | _______________ | _______________ |

---

## 6. RTO ориентиры (Recovery Time Objective)

| Сценарий | Объём БД | Ожидаемое время восстановления |
|----------|----------|-------------------------------|
| Перезапуск сервиса | — | 1-2 мин |
| Малая БД (< 1 ГБ) | до 1 ГБ | 3-5 мин |
| Средняя БД (1-10 ГБ) | 1-10 ГБ | 12-20 мин |
| Большая БД (10-50 ГБ) | 10-50 ГБ | 30-60 мин |
| Полное пересоздание стека | — | 20-40 мин |

> Время включает: скачивание бэкапа + расшифровка + восстановление + проверка.
> На медленном S3-канале время скачивания может быть больше — учитывайте.

---

## Чеклист после инцидента

- [ ] Определена корневая причина падения
- [ ] Сервисы восстановлены и проверены
- [ ] Flyway validate прошёл
- [ ] Количество записей в таблицах соответствует ожиданиям
- [ ] Фронтенд доступен и функционален
- [ ] Уведомлены заинтересованные лица
- [ ] Создан инцидент-репорт (дата, причина, время простоя, действия)
