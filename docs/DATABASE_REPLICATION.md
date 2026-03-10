# Репликация PostgreSQL для Привод

## Обзор

Данный документ описывает настройку потоковой (streaming) репликации PostgreSQL
для платформы Привод. Конфигурация обеспечивает высокую доступность,
отказоустойчивость и возможность восстановления на произвольный момент времени
(Point-in-Time Recovery, PITR).

---

## Стратегия

| Аспект | Решение |
|--------|---------|
| Тип репликации | Streaming replication (primary -> standby) |
| Режим (production) | **Синхронная** репликация — гарантия нулевой потери данных |
| Режим (staging/dev) | Асинхронная репликация — меньшая задержка на запись |
| WAL archiving | Включён — для PITR и защиты от потери WAL-сегментов |
| Автоматический failover | Patroni + etcd (рекомендация для production) |

### Схема

```
┌──────────────┐    WAL stream     ┌──────────────┐
│              │ ─────────────────> │              │
│   PRIMARY    │                   │   STANDBY    │
│  (postgres)  │ <─ feedback ───── │  (hot_standby│
│              │                   │   = on)      │
└──────┬───────┘                   └──────────────┘
       │
       │  WAL archive
       ▼
┌──────────────┐
│  /wal_archive│
│  (PITR)      │
└──────────────┘
```

---

## Настройка Primary (мастер)

### 1. postgresql.conf

Добавить или изменить следующие параметры:

```ini
# --- Репликация ---
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
synchronous_standby_names = 'standby1'

# --- WAL-архивация (для PITR) ---
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
archive_timeout = 60

# --- Логирование ---
log_replication_commands = on
```

**Пояснения:**

- `wal_level = replica` — минимальный уровень WAL для потоковой репликации.
- `max_wal_senders = 5` — до 5 одновременных standby/pg_basebackup.
- `wal_keep_size = 1GB` — хранить минимум 1 GB WAL-сегментов на primary
  (страховка при кратковременных разрывах связи со standby).
- `synchronous_standby_names = 'standby1'` — синхронная репликация; primary
  ждёт подтверждения от standby перед commit. Для асинхронного режима
  закомментируйте эту строку.
- `archive_command` — копирует WAL-файлы в архив для PITR.

### 2. pg_hba.conf

Разрешить подключение реплики:

```
# TYPE  DATABASE        USER            ADDRESS           METHOD
host    replication     replicator      standby_ip/32     scram-sha-256
```

> Замените `standby_ip` на реальный IP-адрес standby-сервера.
> В Docker-сети можно указать подсеть: `172.20.0.0/16`.

### 3. Создание пользователя репликации

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password';
```

> В production используйте надёжный пароль и храните его в секрет-менеджере
> (Vault, Docker secrets, etc.).

### 4. Создание директории WAL-архива

```bash
mkdir -p /var/lib/postgresql/wal_archive
chown postgres:postgres /var/lib/postgresql/wal_archive
```

### 5. Перезагрузка Primary

```bash
pg_ctl reload -D /var/lib/postgresql/data
# или
SELECT pg_reload_conf();
```

> Изменение `wal_level` требует полного перезапуска PostgreSQL.

---

## Настройка Standby (реплика)

### 1. Базовый бэкап

Выполнить **на standby-сервере** (при остановленном PostgreSQL):

```bash
pg_basebackup \
  -h primary_host \
  -p 5432 \
  -U replicator \
  -D /var/lib/postgresql/data \
  -Fp \
  -Xs \
  -R \
  -P \
  -v
```

**Флаги:**

| Флаг | Назначение |
|------|-----------|
| `-Fp` | Формат plain (каталог файлов) |
| `-Xs` | Стриминг WAL во время бэкапа |
| `-R` | Автоматически создаёт `standby.signal` и записывает `primary_conninfo` |
| `-P` | Показ прогресса |
| `-v` | Verbose-вывод |

### 2. standby.signal

Если флаг `-R` не использовался, создайте пустой файл вручную:

```bash
touch /var/lib/postgresql/data/standby.signal
```

Этот файл сообщает PostgreSQL, что экземпляр работает как standby.

### 3. postgresql.conf (standby)

```ini
primary_conninfo = 'host=primary_host port=5432 user=replicator password=secure_password application_name=standby1'
hot_standby = on
hot_standby_feedback = on

# Опционально: восстановление из WAL-архива при отставании
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
```

**Пояснения:**

- `application_name=standby1` — должен совпадать с именем в
  `synchronous_standby_names` на primary (для синхронной репликации).
- `hot_standby = on` — разрешает read-only запросы к standby.
- `hot_standby_feedback = on` — standby сообщает primary о своих активных
  запросах, предотвращая преждевременную очистку данных vacuum.

### 4. Запуск Standby

```bash
pg_ctl start -D /var/lib/postgresql/data
```

---

## Мониторинг репликации

### На Primary

```sql
-- Активные реплики и их статус:
SELECT
  client_addr,
  application_name,
  state,
  sync_state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (sent_lsn - replay_lsn) AS byte_lag
FROM pg_stat_replication;
```

### На Standby

```sql
-- Статус WAL-приёмника:
SELECT
  status,
  sender_host,
  sender_port,
  received_lsn,
  last_msg_send_time,
  last_msg_receipt_time
FROM pg_stat_wal_receiver;
```

### Лаг репликации

```sql
-- Временной лаг (на standby):
SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;

-- Лаг в байтах (на primary):
SELECT
  application_name,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
```

### Prometheus-метрики

Если используется `postgres_exporter`, ключевые метрики:

```
pg_stat_replication_pg_wal_lsn_diff   # лаг в байтах
pg_replication_lag                      # лаг в секундах
pg_stat_wal_receiver_status             # статус WAL-приёмника
```

Алерты рекомендуется настроить при:
- Лаг репликации > 30 секунд — Warning
- Лаг репликации > 120 секунд — Critical
- Отсутствие standby в `pg_stat_replication` — Critical

---

## Failover

### Автоматический (Patroni) — рекомендуется для Production

[Patroni](https://github.com/patroni/patroni) — стандартное решение для
автоматического failover PostgreSQL.

**Архитектура:**

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Patroni │     │  Patroni │     │  etcd     │
│  + PG    │ <──>│  + PG    │ <──>│  cluster  │
│  (node1) │     │  (node2) │     │          │
└──────────┘     └──────────┘     └──────────┘
```

**Преимущества:**

- Автоматическое переключение при сбое primary (< 30 сек).
- Координация через etcd/consul/ZooKeeper.
- REST API для управления и мониторинга.
- Автоматическое создание реплик (pg_basebackup).

**Базовая конфигурация Patroni (`patroni.yml`):**

```yaml
scope: privod-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008

etcd3:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    synchronous_mode: true
    postgresql:
      parameters:
        wal_level: replica
        max_wal_senders: 5
        wal_keep_size: 1GB
        archive_mode: "on"
        archive_command: "cp %p /var/lib/postgresql/wal_archive/%f"

postgresql:
  listen: 0.0.0.0:5432
  connect_address: node1:5432
  data_dir: /var/lib/postgresql/data
  authentication:
    superuser:
      username: postgres
      password: postgres_password
    replication:
      username: replicator
      password: replicator_password
```

### Ручной Failover

Если Patroni не используется:

```bash
# 1. Убедиться, что primary недоступен

# 2. На standby — промоутить до primary:
pg_ctl promote -D /var/lib/postgresql/data

# 3. Проверить, что standby.signal удалён (PostgreSQL удаляет автоматически)
ls /var/lib/postgresql/data/standby.signal

# 4. Обновить connection string в приложении:
#    SPRING_DATASOURCE_URL=jdbc:postgresql://new_primary_host:5432/privod2

# 5. Перезапустить backend:
docker compose -f docker-compose.server.yml restart backend

# 6. (Опционально) Настроить бывший primary как новый standby
```

---

## Docker Compose: тестовая конфигурация

В файле `docker-compose.server.yml` предусмотрен профиль `replication`
для локального тестирования потоковой репликации.

### Запуск

```bash
# Запустить primary + standby:
docker compose -f docker-compose.server.yml --profile replication up -d

# Проверить статус репликации:
docker exec privod2_pg_primary \
  psql -U privod -d privod2 -c "SELECT * FROM pg_stat_replication;"

# Проверить лаг на standby:
docker exec privod2_pg_standby \
  psql -U privod -d privod2 -c "SELECT now() - pg_last_xact_replay_timestamp() AS lag;"
```

### Сервисы

| Сервис | Порт | Роль |
|--------|------|------|
| `postgres-primary` | 5433 | Primary (read-write) |
| `postgres-standby` | 5434 | Standby (read-only) |

> Эти сервисы не заменяют основной `postgres` сервис (порт 5432).
> Профиль `replication` предназначен исключительно для тестирования.

---

## Point-in-Time Recovery (PITR)

### Восстановление на определённый момент времени

```bash
# 1. Остановить PostgreSQL
pg_ctl stop -D /var/lib/postgresql/data

# 2. Восстановить из базового бэкапа
rm -rf /var/lib/postgresql/data/*
tar -xf /backups/base_backup.tar -C /var/lib/postgresql/data/

# 3. Создать recovery.signal
touch /var/lib/postgresql/data/recovery.signal

# 4. Указать точку восстановления в postgresql.conf:
# restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
# recovery_target_time = '2026-03-08 14:30:00+03'
# recovery_target_action = 'promote'

# 5. Запустить PostgreSQL
pg_ctl start -D /var/lib/postgresql/data
```

---

## Рекомендации для Production

1. **Всегда используйте синхронную репликацию** (`synchronous_standby_names`)
   для критичных данных — гарантирует zero data loss.

2. **Минимум 2 standby** — один синхронный, один асинхронный. Если синхронный
   standby выходит из строя, primary не блокируется.

3. **WAL-архив на отдельном хранилище** (S3, NFS) — для PITR даже при потере
   обоих серверов.

4. **Patroni для автоматического failover** — ручное переключение в 3 часа
   ночи — не то, чем хочется заниматься.

5. **Мониторинг лага** — алерт при > 30 сек, critical при > 120 сек.

6. **Тестируйте failover регулярно** — минимум раз в квартал.

7. **Read-only нагрузка на standby** — Spring Boot поддерживает маршрутизацию
   запросов через `@Transactional(readOnly = true)`.

---

## Связанные файлы

| Файл | Назначение |
|------|-----------|
| `docker-compose.server.yml` | Профиль `replication` для тестирования |
| `monitoring/postgres/init-replication.sh` | Скрипт инициализации репликации |
| `scripts/init-db.sh` | Инициализация расширений PostgreSQL |
| `monitoring/prometheus.yml` | Метрики (добавить postgres_exporter) |
