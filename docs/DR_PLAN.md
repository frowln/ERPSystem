# План аварийного восстановления (Disaster Recovery Plan)

**Система:** Привод — Строительная ERP/CRM
**Версия документа:** 1.0
**Дата:** 2026-03-08
**Ответственный:** Руководитель разработки

---

## 1. Общие сведения

| Параметр | Значение |
|---|---|
| Название системы | Привод — Строительная ERP/CRM |
| Технологический стек | Java Spring Boot + PostgreSQL + Redis + MinIO + React (Vite) |
| RPO (Recovery Point Objective) | **1 час** — допустимая потеря данных не более 1 часа |
| RTO (Recovery Time Objective) | **4 часа** — полное восстановление работоспособности за 4 часа |
| Количество сущностей БД | ~421 таблиц |
| Бэкенд | Java Spring Boot (~146K строк, 229 сервисов) |
| Фронтенд | React 19 + Vite 6 + TypeScript |

### 1.1 Цели документа

- Обеспечить непрерывность бизнес-процессов при авариях любого масштаба
- Минимизировать время простоя и потерю данных
- Определить роли, ответственности и порядок действий при инцидентах
- Соответствовать требованиям ФЗ-152 (персональные данные) и ФЗ-187 (КИИ)

### 1.2 Область применения

Документ распространяется на все компоненты платформы Привод:
- Сервер приложений (Spring Boot)
- База данных (PostgreSQL)
- Кэш и очереди (Redis)
- Файловое хранилище (MinIO)
- Фронтенд (React SPA, Nginx)
- Реверс-прокси и SSL (Nginx / Traefik)
- Мониторинг (Prometheus + Grafana)

---

## 2. Классификация инцидентов

### Уровень 1 — Низкий (Деградация)

| Параметр | Описание |
|---|---|
| Описание | Деградация производительности, один некритичный сервис недоступен |
| Примеры | Медленные запросы, высокая задержка Redis, недоступность мониторинга |
| Время реакции | 4 часа (рабочее время) |
| Ответственный | Дежурный инженер |
| Эскалация | Нет (если устранено в SLA) |

### Уровень 2 — Средний (Частичный отказ)

| Параметр | Описание |
|---|---|
| Описание | Несколько сервисов недоступны, частичная потеря функциональности |
| Примеры | Недоступность MinIO (файлы), сбой WebSocket, отказ Redis |
| Время реакции | 1 час |
| Ответственный | Дежурный инженер + DevOps |
| Эскалация | Руководитель разработки (через 2 часа без прогресса) |

### Уровень 3 — Критический (Полный отказ)

| Параметр | Описание |
|---|---|
| Описание | Полная недоступность системы для всех пользователей |
| Примеры | Падение PostgreSQL, отказ сервера приложений, сетевая недоступность |
| Время реакции | 15 минут |
| Ответственный | Вся команда эксплуатации |
| Эскалация | Немедленная эскалация руководству |

### Уровень 4 — Катастрофический (Потеря данных / Компрометация)

| Параметр | Описание |
|---|---|
| Описание | Потеря данных, компрометация безопасности, утечка персональных данных |
| Примеры | Ransomware, удаление базы данных, утечка данных, взлом |
| Время реакции | Немедленно |
| Ответственный | Вся команда + руководство + юридический отдел |
| Эскалация | ФСБ, РКН, клиенты — в течение 24 часов |

---

## 3. Контактная информация

> **ВАЖНО:** Заполните таблицу актуальными контактами. Обновляйте при каждом изменении состава команды.

| Роль | ФИО | Телефон | Email | Telegram |
|---|---|---|---|---|
| Дежурный инженер (1-я линия) | _______________ | _______________ | _______________ | _______________ |
| Руководитель разработки | _______________ | _______________ | _______________ | _______________ |
| DevOps инженер | _______________ | _______________ | _______________ | _______________ |
| DBA (администратор БД) | _______________ | _______________ | _______________ | _______________ |
| Системный администратор | _______________ | _______________ | _______________ | _______________ |
| Руководитель ИБ | _______________ | _______________ | _______________ | _______________ |
| Технический директор (CTO) | _______________ | _______________ | _______________ | _______________ |

### 3.1 Порядок эскалации

```
Уровень 1-2:  Дежурный инженер → DevOps → Руководитель разработки
Уровень 3:    Все инженеры одновременно → CTO (через 1 час)
Уровень 4:    Все инженеры + CTO + Руководитель ИБ → Юридический отдел → Регуляторы
```

### 3.2 Внешние контакты

| Сервис | Контакт | Назначение |
|---|---|---|
| Хостинг-провайдер | _______________ | Аппаратные сбои, сеть |
| Регистратор домена | _______________ | DNS проблемы |
| SSL-провайдер | _______________ | Сертификаты |
| ФСБ (НКЦКИ) | https://gossopka.ru | Инциденты ИБ |
| Роскомнадзор | https://pd.rkn.gov.ru | Утечка ПДн |

---

## 4. Процедуры резервного копирования

### 4.1 PostgreSQL

| Параметр | Значение |
|---|---|
| Метод | `pg_dump` (полный) + непрерывная WAL-архивация |
| Расписание полного бэкапа | Ежедневно в 03:00 MSK |
| WAL-архивация | Непрерывная (каждые 5 мин или по заполнению сегмента) |
| Хранение | S3-совместимое хранилище (отдельный ДЦ) |
| Ретенция | 30 дней полных бэкапов + 7 дней WAL |
| Шифрование | AES-256 (gpg) |
| Проверка | Еженедельная верификация восстановления |

**Скрипт ежедневного бэкапа:**

```bash
#!/bin/bash
# /opt/privod/scripts/backup_postgres.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://privod-backups/postgres"
DB_NAME="privod2"
DB_USER="privod"

# Полный дамп с компрессией
pg_dump -U "$DB_USER" -d "$DB_NAME" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/privod2_${TIMESTAMP}.dump"

# Шифрование
gpg --symmetric --cipher-algo AES256 \
  --batch --passphrase-file /opt/privod/secrets/backup_passphrase \
  "${BACKUP_DIR}/privod2_${TIMESTAMP}.dump"

# Загрузка в S3
aws s3 cp "${BACKUP_DIR}/privod2_${TIMESTAMP}.dump.gpg" \
  "${S3_BUCKET}/privod2_${TIMESTAMP}.dump.gpg"

# Очистка локальных файлов старше 7 дней
find "${BACKUP_DIR}" -name "*.dump*" -mtime +7 -delete

# Логирование
echo "[$(date)] Backup completed: privod2_${TIMESTAMP}.dump.gpg" >> /var/log/privod/backup.log
```

**Конфигурация WAL-архивации (postgresql.conf):**

```ini
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://privod-backups/wal/%f'
archive_timeout = 300
```

### 4.2 MinIO (файловое хранилище)

| Параметр | Значение |
|---|---|
| Метод | Серверная репликация (site replication) |
| Расписание | Непрерывная репликация |
| Резервное копирование | `mc mirror` ежедневно в 04:00 MSK |
| Ретенция | 30 дней |
| Версионирование | Включено на всех бакетах |

```bash
#!/bin/bash
# /opt/privod/scripts/backup_minio.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Зеркалирование на резервный сервер
mc mirror --overwrite \
  privod-primary/documents \
  privod-backup/documents

mc mirror --overwrite \
  privod-primary/attachments \
  privod-backup/attachments

echo "[$(date)] MinIO mirror completed" >> /var/log/privod/backup.log
```

### 4.3 Redis

| Параметр | Значение |
|---|---|
| RDB snapshot | Каждые 15 минут |
| AOF (Append Only File) | Включен, fsync каждую секунду |
| Хранение | Локально + S3 (ежедневно) |
| Ретенция | 7 дней |

**Конфигурация Redis (redis.conf):**

```ini
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec

dir /data/redis
dbfilename dump.rdb
appendfilename "appendonly.aof"
```

### 4.4 Конфигурация и секреты

| Параметр | Значение |
|---|---|
| Конфигурация приложения | Git репозиторий (отдельный приватный) |
| Docker Compose файлы | Git репозиторий |
| Секреты | HashiCorp Vault / Ansible Vault |
| SSL сертификаты | Автоматическое обновление (Let's Encrypt) |

### 4.5 Матрица резервного копирования (сводная)

| Компонент | Метод | Частота | Ретенция | Хранение |
|---|---|---|---|---|
| PostgreSQL (полный) | pg_dump | Ежедневно 03:00 | 30 дней | S3 (отдельный ДЦ) |
| PostgreSQL (WAL) | archive_command | Непрерывно | 7 дней | S3 (отдельный ДЦ) |
| MinIO | mc mirror | Ежедневно 04:00 | 30 дней | Резервный сервер |
| Redis (RDB) | save | Каждые 15 мин | 7 дней | Локально + S3 |
| Redis (AOF) | appendonly | Непрерывно | 7 дней | Локально |
| Конфигурация | Git push | При изменении | Полная история | Git (GitHub/GitLab) |
| Секреты | Vault snapshot | Ежедневно | 30 дней | Зашифрованный S3 |

---

## 5. Сценарии восстановления

### 5.1 Сбой базы данных PostgreSQL

**Симптомы:**
- Приложение возвращает 500-е ошибки
- В логах: `Connection refused`, `FATAL: the database system is not ready`
- Health check `/actuator/health` возвращает `DOWN`

**Диагностика:**

```bash
# 1. Проверить статус PostgreSQL
docker compose ps postgres
docker compose logs --tail=100 postgres

# 2. Попробовать подключиться
docker compose exec postgres pg_isready -U privod

# 3. Проверить дисковое пространство
docker compose exec postgres df -h /var/lib/postgresql/data

# 4. Проверить целостность
docker compose exec postgres pg_controldata /var/lib/postgresql/data
```

**Восстановление при аппаратном/программном сбое:**

```bash
# Шаг 1: Остановить приложение
docker compose stop backend

# Шаг 2: Попытаться перезапустить PostgreSQL
docker compose restart postgres

# Шаг 3: Если PostgreSQL не стартует — восстановление из бэкапа
# 3a. Остановить PostgreSQL
docker compose stop postgres

# 3b. Очистить данные
docker compose run --rm postgres rm -rf /var/lib/postgresql/data/*

# 3c. Скачать последний бэкап
aws s3 cp s3://privod-backups/postgres/privod2_LATEST.dump.gpg /backups/

# 3d. Расшифровать
gpg --decrypt --batch \
  --passphrase-file /opt/privod/secrets/backup_passphrase \
  /backups/privod2_LATEST.dump.gpg > /backups/privod2_LATEST.dump

# 3e. Запустить чистый PostgreSQL
docker compose up -d postgres
sleep 10

# 3f. Восстановить дамп
pg_restore -U privod -d privod2 \
  --clean --if-exists \
  /backups/privod2_LATEST.dump

# Шаг 4: Применить WAL-логи (Point-in-Time Recovery)
# Настроить recovery.conf / postgresql.auto.conf:
#   restore_command = 'aws s3 cp s3://privod-backups/wal/%f %p'
#   recovery_target_time = '2026-03-08 12:00:00 MSK'

# Шаг 5: Запустить приложение
docker compose up -d backend

# Шаг 6: Проверить целостность
curl -s http://localhost:8080/actuator/health | jq .
```

**Восстановление при логическом сбое (ошибочное удаление данных):**

```bash
# Использовать Point-in-Time Recovery для восстановления до момента ошибки

# 1. Определить время ошибки через audit_log
docker compose exec postgres psql -U privod -d privod2 \
  -c "SELECT * FROM immutable_records ORDER BY created_at DESC LIMIT 20;"

# 2. Восстановить на отдельный сервер до нужного момента
# 3. Извлечь потерянные данные
# 4. Импортировать в основную БД
```

**Ожидаемое время восстановления:** 1-3 часа

---

### 5.2 Сбой сервера приложений (Spring Boot)

**Симптомы:**
- HTTP 502/503 от прокси
- Health check не отвечает
- В логах: `OutOfMemoryError`, `StackOverflowError`, зависания

**Диагностика:**

```bash
# 1. Проверить статус контейнера
docker compose ps backend
docker compose logs --tail=200 backend

# 2. Проверить ресурсы
docker stats privod-backend --no-stream

# 3. Проверить heap dump (при OOM)
docker compose exec backend jcmd 1 GC.heap_info
```

**Восстановление:**

```bash
# Сценарий A: Простой перезапуск
docker compose restart backend

# Подождать 30 сек и проверить
sleep 30
curl -s http://localhost:8080/actuator/health | jq .

# Сценарий B: Пересборка (при обновлении кода или повреждении образа)
docker compose up -d --build backend

# Сценарий C: Полная пересборка с очисткой
docker compose down backend
docker rmi privod-backend:latest
docker compose build --no-cache backend
docker compose up -d backend

# Сценарий D: Переключение на резервный сервер
# 1. Обновить DNS/load balancer на резервный IP
# 2. Запустить backend на резервном сервере:
ssh backup-server "cd /opt/privod && docker compose up -d backend"

# 3. Проверить работоспособность
curl -s http://backup-server:8080/actuator/health | jq .
```

**Ожидаемое время восстановления:** 5-30 минут

---

### 5.3 Компрометация безопасности

**Симптомы:**
- Подозрительная активность в логах аудита
- Несанкционированные изменения данных
- Обращения от пользователей о подозрительных действиях
- Алерты от систем мониторинга/IDS

**НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ (первые 15 минут):**

```bash
# 1. ИЗОЛИРОВАТЬ сервер от сети
# На файрволе/маршрутизаторе:
iptables -A INPUT -j DROP
iptables -A OUTPUT -j DROP
# Или отключить сетевой интерфейс:
ip link set eth0 down

# 2. Сохранить текущее состояние для расследования
# Снять дамп памяти
docker compose exec backend jcmd 1 GC.heap_dump /tmp/heap.hprof

# Сохранить все логи
docker compose logs --no-color > /tmp/incident_logs_$(date +%Y%m%d_%H%M%S).txt

# Сохранить состояние БД (если доступна)
pg_dump -U privod -d privod2 > /tmp/incident_db_snapshot.sql
```

**ВОССТАНОВЛЕНИЕ (после расследования):**

```bash
# 3. Сменить ВСЕ секреты
# 3a. JWT Secret
export NEW_JWT_SECRET=$(openssl rand -base64 64)
# Обновить в application.yml / Vault

# 3b. Пароли базы данных
docker compose exec postgres psql -U postgres \
  -c "ALTER USER privod WITH PASSWORD 'NEW_SECURE_PASSWORD';"

# 3c. API ключи сторонних сервисов
# Перевыпустить в консолях: MinIO, SMTP, S3, etc.

# 3d. SSL сертификаты (если скомпрометированы)
certbot revoke --cert-name privod.ru
certbot certonly --nginx -d privod.ru

# 4. Проанализировать логи аудита
docker compose exec postgres psql -U privod -d privod2 -c "
SELECT action_type, entity_type, user_id, created_at, details
FROM immutable_records
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;
"

# 5. Инвалидировать все пользовательские сессии
docker compose exec postgres psql -U privod -d privod2 -c "
DELETE FROM user_sessions;
"
docker compose exec redis redis-cli FLUSHDB

# 6. Восстановить из чистого бэкапа (до момента компрометации)
# Использовать процедуру восстановления PostgreSQL (раздел 5.1)

# 7. Развернуть приложение из проверенного коммита
git checkout <known-good-commit>
docker compose up -d --build

# 8. Восстановить сетевой доступ
ip link set eth0 up
iptables -F
```

**УВЕДОМЛЕНИЯ (в течение 24 часов):**

```
1. Уведомить руководство компании
2. При утечке персональных данных:
   - РКН (Роскомнадзор): https://pd.rkn.gov.ru — в течение 24 часов
   - Субъекты ПДн — в течение 72 часов
3. При инциденте на объекте КИИ:
   - НКЦКИ (ФСБ): через ГосСОПКА — немедленно
4. Уведомить клиентов (если затронуты их данные)
5. Задокументировать инцидент для внутреннего расследования
```

**Ожидаемое время восстановления:** 4-24 часа

---

### 5.4 Потеря файлового хранилища (MinIO)

**Симптомы:**
- Ошибки загрузки/скачивания файлов
- HTTP 503 от MinIO
- В логах backend: `Connection refused` на MinIO порт

**Диагностика:**

```bash
# 1. Проверить статус
docker compose ps minio
docker compose logs --tail=100 minio

# 2. Проверить подключение
mc admin info privod-primary

# 3. Проверить диск
docker compose exec minio df -h /data
```

**Восстановление:**

```bash
# Сценарий A: Перезапуск
docker compose restart minio
sleep 10
mc admin info privod-primary

# Сценарий B: Полное восстановление из реплики
# 1. Остановить старый инстанс
docker compose stop minio

# 2. Очистить данные (если повреждены)
docker volume rm privod_minio_data

# 3. Запустить новый инстанс
docker compose up -d minio
sleep 15

# 4. Создать бакеты
mc mb privod-primary/documents
mc mb privod-primary/attachments
mc mb privod-primary/avatars

# 5. Восстановить данные из реплики
mc mirror privod-backup/documents privod-primary/documents
mc mirror privod-backup/attachments privod-primary/attachments
mc mirror privod-backup/avatars privod-primary/avatars

# 6. Включить версионирование
mc version enable privod-primary/documents
mc version enable privod-primary/attachments

# 7. Обновить конфигурацию endpoint (если IP изменился)
# В application.yml: minio.endpoint

# 8. Перезапустить приложение
docker compose restart backend

# 9. Проверить
curl -s http://localhost:8080/actuator/health | jq '.components.minio'
```

**Ожидаемое время восстановления:** 30 минут — 2 часа (зависит от объема данных)

---

### 5.5 Сбой Redis

**Симптомы:**
- Увеличение времени отклика API
- В логах backend: `RedisConnectionException`
- Rate limiting не работает

**Важно:** Redis в Привод используется для кэша, сессий и rate limiting. Потеря данных Redis **не критична** — все данные восстановятся автоматически при обращении к PostgreSQL.

**Восстановление:**

```bash
# Сценарий A: Простой перезапуск
docker compose restart redis
sleep 5
docker compose exec redis redis-cli PING
# Ожидаемый ответ: PONG

# Сценарий B: Восстановление из RDB snapshot
docker compose stop redis
# Скопировать dump.rdb в volume
cp /backups/redis/dump.rdb /var/lib/docker/volumes/privod_redis_data/_data/
docker compose up -d redis

# Сценарий C: Полная пересборка (при полной потере)
docker compose stop redis
docker volume rm privod_redis_data
docker compose up -d redis

# Прогрев кэша произойдет автоматически при обращениях к API
# Сессии пользователей будут сброшены — потребуется повторная авторизация

# Проверка
docker compose exec redis redis-cli INFO server | head -20
docker compose exec redis redis-cli DBSIZE
```

**Ожидаемое время восстановления:** 5-15 минут

---

### 5.6 Сбой фронтенда / Nginx

**Симптомы:**
- Белый экран в браузере
- HTTP 502/504 от Nginx
- Ошибки в консоли браузера

**Восстановление:**

```bash
# 1. Проверить Nginx
docker compose ps nginx
docker compose logs --tail=50 nginx

# 2. Перезапуск
docker compose restart nginx

# 3. Пересборка фронтенда
cd /opt/privod/frontend
npm run build
docker compose restart nginx

# 4. Проверить
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000
```

**Ожидаемое время восстановления:** 5-10 минут

---

### 5.7 Полная потеря сервера (Catastrophic Failure)

**Симптомы:**
- Сервер недоступен по сети
- Аппаратный сбой, пожар, стихийное бедствие

**Восстановление на резервном сервере:**

```bash
# 1. Подготовить резервный сервер
ssh backup-server

# 2. Установить зависимости (если не установлены)
apt update && apt install -y docker.io docker-compose-v2

# 3. Клонировать конфигурацию
git clone git@github.com:privod/infrastructure.git /opt/privod

# 4. Восстановить секреты из Vault
vault read -format=json secret/privod/production > /opt/privod/.env

# 5. Скачать последний бэкап БД
aws s3 cp s3://privod-backups/postgres/privod2_LATEST.dump.gpg /backups/
gpg --decrypt --batch \
  --passphrase-file /opt/privod/secrets/backup_passphrase \
  /backups/privod2_LATEST.dump.gpg > /backups/privod2_LATEST.dump

# 6. Запустить инфраструктуру
cd /opt/privod
docker compose up -d postgres redis minio
sleep 15

# 7. Восстановить БД
pg_restore -U privod -d privod2 --clean --if-exists /backups/privod2_LATEST.dump

# 8. Восстановить файлы
mc mirror privod-backup/documents privod-primary/documents
mc mirror privod-backup/attachments privod-primary/attachments

# 9. Запустить приложение
docker compose up -d backend nginx
sleep 30

# 10. Переключить DNS
# Обновить A-запись privod.ru на новый IP
# TTL рекомендуется держать 300 сек (5 мин)

# 11. Проверить
curl -s http://localhost:8080/actuator/health | jq .
curl -s http://localhost:4000 -o /dev/null -w "%{http_code}"
```

**Ожидаемое время восстановления:** 2-4 часа

---

## 6. Чек-лист после восстановления

После **любого** восстановления необходимо пройти все пункты:

### 6.1 Инфраструктура

- [ ] Все контейнеры запущены: `docker compose ps` — все `Up`
- [ ] Дисковое пространство достаточно: `df -h` — >20% свободно
- [ ] Мониторинг работает: Grafana доступна, алерты активны
- [ ] Бэкапы настроены: cron задания активны

### 6.2 Приложение

- [ ] Health check API отвечает 200: `GET /actuator/health`
- [ ] Пользователи могут авторизоваться (логин/пароль)
- [ ] JWT токены выдаются и валидируются
- [ ] RBAC работает (проверить доступ разных ролей)

### 6.3 Данные

- [ ] Данные проектов доступны и корректны
- [ ] Список пользователей полный
- [ ] Финансовые данные (бюджеты, счета) корректны
- [ ] Спецификации и сметы доступны
- [ ] Задачи и комментарии на месте

### 6.4 Файлы и интеграции

- [ ] Файлы загружаются в MinIO
- [ ] Файлы скачиваются из MinIO
- [ ] Аватары пользователей отображаются
- [ ] Документы проектов доступны

### 6.5 Реальное время

- [ ] WebSocket соединения устанавливаются
- [ ] Уведомления доставляются
- [ ] Чат (messaging) работает
- [ ] Typing indicators работают

### 6.6 Фоновые процессы

- [ ] Планировщики запущены (cron jobs)
- [ ] WAL-архивация PostgreSQL активна
- [ ] Redis AOF/RDB записывается
- [ ] Мониторинг и алерты работают
- [ ] Бэкапы по расписанию создаются

### 6.7 Производительность

- [ ] Время отклика API < 500ms (p95)
- [ ] Фронтенд загружается < 3 сек
- [ ] Нет ошибок в логах (кроме ожидаемых)
- [ ] CPU < 80%, RAM < 85%

---

## 7. Тестирование DR плана

### 7.1 Частота тестирования

| Тип теста | Частота | Ответственный |
|---|---|---|
| Табличные учения (Table-top) | Ежеквартально | Руководитель разработки |
| Проверка восстановления из бэкапа | Ежемесячно | DBA / DevOps |
| Частичное восстановление (один компонент) | Ежеквартально | DevOps |
| Полное DR тестирование (на резервном сервере) | Раз в полгода | Вся команда |

### 7.2 Табличные учения (Table-top Exercise)

Формат: команда собирается и проходит сценарий на бумаге.

**Сценарии для отработки:**
1. Потеря PostgreSQL в пятницу вечером
2. Ransomware-атака в рабочее время
3. Утечка персональных данных подрядчиков
4. Отказ дата-центра провайдера
5. DDoS-атака на API

**Шаблон протокола учений:**

```
Дата: ___________
Сценарий: ___________
Участники: ___________
Время обнаружения (фактическое): ___________
Время восстановления (фактическое): ___________
Проблемы выявленные: ___________
Корректирующие действия: ___________
Дедлайн исправления: ___________
```

### 7.3 Тестовое восстановление из бэкапа

```bash
#!/bin/bash
# /opt/privod/scripts/test_backup_restore.sh
# Запускать ежемесячно на тестовом сервере

set -euo pipefail

echo "=== DR Backup Restore Test ==="
echo "Date: $(date)"

# 1. Скачать последний бэкап
LATEST=$(aws s3 ls s3://privod-backups/postgres/ | sort | tail -1 | awk '{print $4}')
echo "Latest backup: $LATEST"
aws s3 cp "s3://privod-backups/postgres/$LATEST" /tmp/test_restore.dump.gpg

# 2. Расшифровать
gpg --decrypt --batch \
  --passphrase-file /opt/privod/secrets/backup_passphrase \
  /tmp/test_restore.dump.gpg > /tmp/test_restore.dump

# 3. Восстановить в тестовую БД
createdb -U postgres privod2_test_restore 2>/dev/null || true
pg_restore -U postgres -d privod2_test_restore \
  --clean --if-exists /tmp/test_restore.dump

# 4. Проверить целостность
TABLES=$(psql -U postgres -d privod2_test_restore -t \
  -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
USERS=$(psql -U postgres -d privod2_test_restore -t \
  -c "SELECT count(*) FROM users;")
PROJECTS=$(psql -U postgres -d privod2_test_restore -t \
  -c "SELECT count(*) FROM projects;")

echo "Tables: $TABLES"
echo "Users: $USERS"
echo "Projects: $PROJECTS"

# 5. Очистка
dropdb -U postgres privod2_test_restore
rm -f /tmp/test_restore.dump /tmp/test_restore.dump.gpg

echo "=== Test completed successfully ==="
```

### 7.4 Документирование результатов

Результаты каждого теста записываются в файл:
`/opt/privod/dr-tests/YYYY-MM-DD_test_type.md`

Минимальный набор метрик:
- Время начала и окончания
- Успешность восстановления (да/нет)
- Объем восстановленных данных
- Расхождения с ожидаемым результатом
- Выявленные проблемы и план их устранения

---

## 8. Регулярные процедуры

### 8.1 Еженедельно

- [ ] Проверка целостности бэкапов: `test_backup_restore.sh`
- [ ] Проверка свободного места на дисках
- [ ] Обзор алертов мониторинга за неделю
- [ ] Проверка актуальности SSL сертификатов

### 8.2 Ежемесячно

- [ ] Полное тестовое восстановление из бэкапа на тестовый сервер
- [ ] Обновление зависимостей (security patches)
- [ ] Ротация логов, проверка ретенции
- [ ] Обзор метрик производительности

### 8.3 Ежеквартально

- [ ] Табличные DR учения
- [ ] Частичное DR тестирование (восстановление одного компонента)
- [ ] Обновление контактной информации (раздел 3)
- [ ] Пересмотр RPO/RTO на основе бизнес-требований
- [ ] Аудит прав доступа к бэкапам и секретам

### 8.4 Ежегодно

- [ ] Полное DR тестирование с переключением на резервный ДЦ
- [ ] Полный пересмотр и обновление DR плана
- [ ] Обучение новых членов команды процедурам DR
- [ ] Внешний аудит безопасности и compliance
- [ ] Пересмотр контрактов с провайдерами (SLA)

---

## 9. Мониторинг и алерты

### 9.1 Ключевые метрики

| Метрика | Порог предупреждения | Порог критический |
|---|---|---|
| CPU usage | > 70% (5 мин) | > 90% (2 мин) |
| RAM usage | > 80% | > 95% |
| Disk usage | > 75% | > 90% |
| API response time (p95) | > 500ms | > 2000ms |
| API error rate (5xx) | > 1% | > 5% |
| PostgreSQL connections | > 80% max | > 95% max |
| PostgreSQL replication lag | > 1 мин | > 5 мин |
| Redis memory | > 75% maxmemory | > 90% maxmemory |
| Backup age | > 25 часов | > 48 часов |
| SSL cert expiry | < 30 дней | < 7 дней |

### 9.2 Каналы оповещения

| Уровень | Канал |
|---|---|
| Warning | Telegram бот → канал #privod-alerts |
| Critical | Telegram + SMS дежурному инженеру |
| Catastrophic | Telegram + SMS + телефонный звонок всей команде |

---

## 10. Приложения

### Приложение A: Docker Compose (ключевые сервисы)

```yaml
# Минимальная конфигурация для восстановления
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: privod2
      POSTGRES_USER: privod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U privod"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  minio:
    image: minio/minio:latest
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    command: server /data --console-address ":9001"

  backend:
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/privod2
      SPRING_REDIS_HOST: redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
```

### Приложение B: Полезные команды

```bash
# Проверка состояния всех сервисов
docker compose ps && docker compose logs --tail=5

# Быстрая диагностика БД
docker compose exec postgres psql -U privod -d privod2 \
  -c "SELECT pg_database_size('privod2') AS db_size_bytes;"

# Подсчет записей в ключевых таблицах
docker compose exec postgres psql -U privod -d privod2 -c "
SELECT 'users' AS t, count(*) FROM users
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'tasks', count(*) FROM project_tasks
UNION ALL SELECT 'documents', count(*) FROM document_containers
UNION ALL SELECT 'invoices', count(*) FROM invoices;
"

# Проверка размера бэкапов
aws s3 ls s3://privod-backups/postgres/ --summarize --human-readable | tail -3

# Принудительный бэкап
/opt/privod/scripts/backup_postgres.sh

# Проверка WAL архивации
docker compose exec postgres psql -U privod -c "SELECT * FROM pg_stat_archiver;"
```

### Приложение C: Контрольные суммы критичных файлов

При каждом развертывании фиксировать контрольные суммы:

```bash
# Генерация контрольных сумм
sha256sum docker-compose.yml > /opt/privod/checksums.txt
sha256sum nginx.conf >> /opt/privod/checksums.txt
sha256sum backend/build/libs/privod-platform.jar >> /opt/privod/checksums.txt

# Проверка целостности
sha256sum -c /opt/privod/checksums.txt
```

---

## История изменений

| Дата | Версия | Автор | Изменения |
|---|---|---|---|
| 2026-03-08 | 1.0 | Команда разработки | Первоначальная версия |
