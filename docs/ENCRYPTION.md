# Шифрование данных — Стратегия защиты платформы «Привод»

## Обзор

Платформа «Привод» реализует **многоуровневую стратегию шифрования** для защиты
конфиденциальных данных:

| Уровень | Технология | Что защищает |
|---------|-----------|--------------|
| Диск | LUKS / dm-crypt | Все данные на дисках серверов |
| БД (PostgreSQL) | pgcrypto + TDE | Таблицы и резервные копии |
| Объектное хранилище (MinIO) | SSE-S3 / SSE-KMS | Загруженные файлы и документы |
| Приложение | AES-256-GCM | Отдельные чувствительные поля |
| Транспорт | TLS 1.3 | Данные в передаче |

---

## 1. Шифрование на уровне PostgreSQL

### 1.1 Расширение pgcrypto

Для шифрования отдельных столбцов на уровне БД:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Пример шифрования столбца
UPDATE counterparties
SET bank_account = pgp_sym_encrypt(bank_account, 'секретный_ключ')
WHERE bank_account IS NOT NULL;
```

> **Рекомендация**: Использовать application-level шифрование (см. раздел 3)
> вместо pgcrypto, т.к. ключи не должны передаваться в SQL-запросах.

### 1.2 Полнодисковое шифрование (TDE)

PostgreSQL не имеет встроенного TDE. Рекомендуемые подходы:

**Вариант A — LUKS (Linux Unified Key Setup)**:
```bash
# Создание зашифрованного раздела для PGDATA
cryptsetup luksFormat /dev/sdb
cryptsetup luksOpen /dev/sdb pg_encrypted
mkfs.ext4 /dev/mapper/pg_encrypted
mount /dev/mapper/pg_encrypted /var/lib/postgresql/data
```

**Вариант B — PostgreSQL TDE (EDB / CyberTech Postgres Pro)**:
- Postgres Pro Enterprise поддерживает нативное TDE
- Шифруются tablespace-ы, WAL, временные файлы
- Ключ мастера хранится в HSM / Vault

**Вариант C — Шифрование резервных копий**:
```bash
# pg_dump с шифрованием через GPG
pg_dump -Fc privod2 | gpg --symmetric --cipher-algo AES256 > backup.dump.gpg

# Восстановление
gpg --decrypt backup.dump.gpg | pg_restore -d privod2
```

---

## 2. Шифрование MinIO (объектное хранилище)

### 2.1 SSE-S3 (Server-Side Encryption with S3 keys)

MinIO шифрует объекты автоматически, используя собственные ключи:

```bash
# Включение авто-шифрования на бакете
mc encrypt set sse-s3 myminio/privod-documents
```

Конфигурация MinIO:
```yaml
# docker-compose.yml
minio:
  environment:
    MINIO_KMS_AUTO_ENCRYPTION: "on"
```

### 2.2 SSE-KMS (Server-Side Encryption with KMS)

Для production рекомендуется интеграция с KMS (HashiCorp Vault, AWS KMS):

```bash
# Конфигурация MinIO с Vault KMS
export MINIO_KMS_KES_ENDPOINT=https://kes.privod.ru:7373
export MINIO_KMS_KES_KEY_NAME=privod-minio-key
export MINIO_KMS_KES_CERT_FILE=/certs/minio.cert
export MINIO_KMS_KES_KEY_FILE=/certs/minio.key
```

### 2.3 Шифрование на стороне клиента

Для особо чувствительных документов (паспорта, договоры с ПД):

```java
// Шифрование файла перед загрузкой в MinIO
byte[] encrypted = fieldEncryptionService.encrypt(fileBytes);
minioClient.putObject(PutObjectArgs.builder()
    .bucket("privod-sensitive")
    .object(filename)
    .stream(new ByteArrayInputStream(encrypted), encrypted.length, -1)
    .build());
```

---

## 3. Шифрование на уровне приложения (Application-Level Encryption)

### 3.1 Технология

- **Алгоритм**: AES-256-GCM (Galois/Counter Mode)
- **IV**: 12 байт, случайный для каждой операции шифрования
- **Auth Tag**: 128 бит — обеспечивает аутентифицированное шифрование
- **Формат хранения**: Base64(IV || Ciphertext || GCM Tag)

### 3.2 Использование

Для шифрования поля в JPA-сущности добавьте аннотацию `@Convert`:

```java
import com.privod.platform.infrastructure.security.EncryptedFieldConverter;
import jakarta.persistence.Convert;

@Entity
public class Counterparty extends BaseEntity {

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "inn", length = 255)  // увеличить length!
    private String inn;

    @Convert(converter = EncryptedFieldConverter.class)
    @Column(name = "bank_account", length = 255)
    private String bankAccount;
}
```

> **ВАЖНО**: При включении шифрования на существующем поле:
> 1. Увеличьте `length` столбца (зашифрованные данные длиннее)
> 2. Выполните миграцию данных (см. раздел 3.4)

### 3.3 Какие поля шифровать

| Категория | Поля | Сущность |
|-----------|------|----------|
| Налоговые реквизиты | `inn`, `kpp`, `ogrn` | Organization, Counterparty |
| Банковские реквизиты | `bankAccount`, `bik`, `correspondentAccount` | Counterparty |
| Паспортные данные | `passportSeries`, `passportNumber` | Employee |
| Персональные данные | `snils`, `innPersonal` | Employee |
| API ключи | `apiKey`, `secretKey` | ApiKey, WebhookConfig |
| Платёжные данные | `cardNumber`, `accountNumber` | Payment |

### 3.4 Миграция существующих данных

При включении шифрования на поле с существующими незашифрованными данными:

```sql
-- Flyway миграция V1070__encrypt_sensitive_fields.sql

-- 1. Увеличить длину столбцов
ALTER TABLE counterparties ALTER COLUMN inn TYPE VARCHAR(255);
ALTER TABLE counterparties ALTER COLUMN bank_account TYPE VARCHAR(255);
ALTER TABLE counterparties ALTER COLUMN bik TYPE VARCHAR(255);
ALTER TABLE counterparties ALTER COLUMN correspondent_account TYPE VARCHAR(255);

ALTER TABLE organizations ALTER COLUMN inn TYPE VARCHAR(255);
ALTER TABLE organizations ALTER COLUMN kpp TYPE VARCHAR(255);
ALTER TABLE organizations ALTER COLUMN ogrn TYPE VARCHAR(255);
```

После миграции схемы запустите Java-скрипт для перешифровки:

```java
@Component
public class EncryptionMigrationRunner implements CommandLineRunner {

    @Autowired private CounterpartyRepository repo;
    @Autowired private FieldEncryptionService encService;

    @Override
    public void run(String... args) {
        if (!"migrate-encryption".equals(System.getenv("RUN_MODE"))) return;

        repo.findAll().forEach(cp -> {
            // encrypt() внутри конвертера — перезапишем через save
            repo.save(cp);
        });
    }
}
```

---

## 4. Конфигурация ключа шифрования

### 4.1 Переменная окружения

```bash
# Генерация 32-символьного ключа
openssl rand -base64 32 | head -c 32

# Установка
export FIELD_ENCRYPTION_KEY="ваш-32-символьный-секретный-ключ"
```

### 4.2 application.yml

```yaml
app:
  encryption:
    field-key: ${FIELD_ENCRYPTION_KEY:default-dev-key-change-in-production-32ch}
```

> **ВНИМАНИЕ**: Значение по умолчанию (`default-dev-key-...`) — **только для разработки**.
> В production **обязательно** установите `FIELD_ENCRYPTION_KEY`.

### 4.3 Docker / Kubernetes

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      FIELD_ENCRYPTION_KEY: ${FIELD_ENCRYPTION_KEY}

# kubernetes secret
apiVersion: v1
kind: Secret
metadata:
  name: privod-encryption
type: Opaque
data:
  FIELD_ENCRYPTION_KEY: <base64-encoded-key>
```

---

## 5. Ротация ключей шифрования

### 5.1 Плановая ротация

Рекомендуемый интервал: **каждые 12 месяцев** или при смене персонала.

Процедура:
1. Подготовить новый ключ: `openssl rand -base64 32 | head -c 32`
2. Остановить приложение (или перевести в режим обслуживания)
3. Запустить скрипт перешифровки:
   ```bash
   OLD_KEY=старый_ключ NEW_KEY=новый_ключ java -jar privod-reencrypt.jar
   ```
4. Обновить `FIELD_ENCRYPTION_KEY` на новый ключ
5. Перезапустить приложение
6. Уничтожить старый ключ

### 5.2 Скрипт перешифровки

```java
// Псевдокод
FieldEncryptionService oldService = new FieldEncryptionService(oldKey);
FieldEncryptionService newService = new FieldEncryptionService(newKey);

for (Counterparty cp : repository.findAll()) {
    String plainInn = oldService.decrypt(cp.getInn());
    cp.setInn(newService.encrypt(plainInn));
    repository.save(cp);
}
```

---

## 6. Процедура при компрометации ключа

### Немедленные действия (в течение 1 часа):

1. **Сгенерировать новый ключ**: `openssl rand -base64 32 | head -c 32`
2. **Остановить приложение** — предотвратить дальнейшее использование скомпрометированного ключа
3. **Запустить экстренную перешифровку** всех данных с новым ключом
4. **Обновить FIELD_ENCRYPTION_KEY** во всех окружениях (prod, staging)
5. **Перезапустить приложение** с новым ключом
6. **Уничтожить скомпрометированный ключ** из всех хранилищ

### Расследование:

7. **Зафиксировать инцидент** в журнале ИБ
8. **Определить объём компрометации**: какие данные могли быть расшифрованы
9. **Уведомить ответственных лиц** (DPO, руководство)
10. **При утечке ПД**: уведомить Роскомнадзор в соответствии с 152-ФЗ (в течение 24 часов)
11. **Провести аудит доступа**: проверить логи, кто имел доступ к ключу
12. **Усилить защиту**: переместить ключи в HSM / Vault, ограничить доступ

### Превентивные меры:

- Хранить ключи в HashiCorp Vault или аналогичном KMS
- Разделение обязанностей: разные люди управляют ключами и кодом
- Мониторинг доступа к секретам
- Регулярная ротация ключей (раздел 5.1)

---

## 7. Соответствие требованиям

| Требование | Реализация |
|-----------|-----------|
| 152-ФЗ «О персональных данных» | Шифрование ПД на уровне приложения |
| Приказ ФСТЭК №21 | AES-256 — сертифицированный алгоритм |
| PCI DSS (если применимо) | Шифрование карточных данных, ротация ключей |
| ГОСТ Р 34.12-2015 | Для гос. заказчиков — заменить AES на «Кузнечик» |

> **Примечание**: Для работы с государственными заказчиками может потребоваться
> переход на ГОСТ-алгоритмы (Кузнечик / Магма). В этом случае заменить
> `AES/GCM/NoPadding` на реализацию ГОСТ через BouncyCastle.
